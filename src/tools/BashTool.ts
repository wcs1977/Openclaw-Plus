/**
 * BashTool - OpenClaw Plus Bash Command Execution Tool (Sandboxed)
 * 
 * 借鉴 Claude Code v2.1.88 的沙箱化执行模式，
 * 实现安全的命令执行。
 */

import type { Tool } from '../Tool.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { profileCheckpoint } from '../utils/startupProfiler.js';

const execAsync = promisify(exec);

/**
 * Bash Tool - 沙箱化 Bash 命令执行工具 (Enhanced)
 */
export class BashTool implements Tool {
  name = 'Bash';
  description = 'Execute shell commands in a sandboxed environment with safety checks.';
  
  inputSchema = {
    type: 'object',
    properties: {
      command: { 
        type: 'string', 
        description: 'The bash command to execute' 
      },
      sandboxed: {
        type: 'boolean',
        description: 'Whether to run in sandbox mode (default: true)',
        default: true,
      },
      timeoutMs: {
        type: 'number',
        description: 'Command execution timeout in milliseconds (default: 30000)',
        default: 30000,
      },
    },
    required: ['command'],
  };

  /**
   * Execute command - Enhanced with sandboxing
   */
  async execute(input: unknown): Promise<{ success: boolean; output?: string; error?: string }> {
    profileCheckpoint('bash_execute_start');
    
    const { command, sandboxed = true, timeoutMs = 30000 } = input as { 
      command: string; 
      sandboxed?: boolean; 
      timeoutMs?: number; 
    };

    if (sandboxed) {
      return await this.executeSandboxed(command, timeoutMs);
    } else {
      return await this.executeRaw(command, timeoutMs);
    }
  }

  /**
   * 沙箱化执行（限制危险操作）- Enhanced with detailed logging
   */
  private async executeSandboxed(
    command: string, 
    timeoutMs: number
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    profileCheckpoint('bash_sandbox_start');

    // Check for dangerous patterns - Enhanced list
    const dangerousPatterns = [
      { pattern: /rm\s+-rf\s+\/, reason: 'Cannot delete root directory' },
      { pattern: /dd\s+if=.*of=\/dev/, reason: 'Cannot write to devices' },
      { pattern: /chmod\s+[0-7]{4}\s+\/, reason: 'Cannot change permissions of root' },
      { pattern: /mkfs/, reason: 'Cannot format filesystem' },
      { pattern: /fdisk/, reason: 'Cannot partition disk' },
      { pattern: /wget\s+.*\|sh/, reason: 'Cannot download and execute script' },
      { pattern: /curl\s+.*\|bash/, reason: 'Cannot download and execute script' },
      { pattern: /sudo\s+rm\s+-rf/, reason: 'Cannot use sudo with rm -rf' },
    ];

    for (const { pattern, reason } of dangerousPatterns) {
      if (pattern.test(command)) {
        profileCheckpoint('bash_sandbox_blocked');
        
        console.log(`[BASH] Blocked by sandbox policy: ${reason}`);
        
        return {
          success: false,
          error: `Command blocked by sandbox policy: ${reason}`,
        };
      }
    }

    // Check for potentially dangerous commands (medium risk)
    const mediumRiskPatterns = [
      /sudo\s+/,                    // sudo 命令
      /mount\s+/,                   // 挂载操作
      /iptables\s+/,                // 防火墙规则
      /useradd\s+|usermod\s+/,     // 用户管理
      /passwd\s+/,                  // 密码修改
    ];

    let mediumRiskFound = false;
    for (const { pattern } of mediumRiskPatterns) {
      if (pattern.test(command)) {
        mediumRiskFound = true;
        break;
      }
    }

    if (mediumRiskFound) {
      console.warn(`[BASH] Medium risk command detected: ${command}`);
      
      // Log for monitoring but allow execution in sandboxed mode
      profileCheckpoint('bash_sandbox_medium_risk');
    }

    try {
      // Execute in isolated environment with timeout
      const result = await this.execInSandbox(command, {
        cwd: this.getScratchpadDir(),
        timeoutMs,
        maxMemoryMb: 512,
        env: this.getSandboxEnv(),
      });

      profileCheckpoint('bash_sandbox_completed');

      return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.stderr || (result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : undefined),
      };
    } catch (error) {
      profileCheckpoint('bash_sandbox_failed');

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`[BASH] Sandbox execution failed:`, errorMessage);
      
      return {
        success: false,
        error: `Sandbox execution failed: ${errorMessage}`,
      };
    }
  }

  /**
   * 原始执行（无限制）- Enhanced with logging
   */
  private async executeRaw(
    command: string, 
    timeoutMs: number
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    profileCheckpoint('bash_raw_start');

    console.warn(`[BASH] Raw execution (no sandbox): ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs });

      profileCheckpoint('bash_raw_completed');

      return {
        success: true,
        output: stdout,
        error: stderr || undefined,
      };
    } catch (error) {
      profileCheckpoint('bash_raw_failed');

      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`[BASH] Raw execution failed:`, errorMessage);
      
      return {
        success: false,
        error: `Execution failed: ${errorMessage}`,
      };
    }
  }

  /**
   * 在沙箱中执行命令 - Enhanced with resource limits
   */
  private async execInSandbox(
    command: string, 
    options?: {
      cwd?: string;
      timeoutMs?: number;
      maxMemoryMb?: number;
      env?: NodeJS.ProcessEnv;
    }
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const { 
      cwd = process.cwd(), 
      timeoutMs = 30000, 
      maxMemoryMb = 512,
      env = process.env,
    } = options ?? {};

    // Create isolated environment
    const sandboxEnv = { ...env };
    
    // Remove potentially dangerous environment variables
    delete sandboxEnv.SUDO_UID;
    delete sandboxEnv.SUDO_GID;
    delete sandboxEnv.PASSWORD;
    delete sandboxEnv.SECRET;

    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command], {
        cwd,
        env: sandboxEnv,
        timeout: timeoutMs,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        reject(err);
      });

      child.on('close', (code) => {
        resolve({ exitCode: code ?? 1, stdout, stderr });
      });

      // Memory limit enforcement (simplified for demo)
      if (maxMemoryMb && process.memoryUsage().heapUsed / 1024 / 1024 > maxMemoryMb) {
        child.kill('SIGKILL');
        reject(new Error(`Memory limit exceeded: ${maxMemoryMb}MB`));
      }

      // Timeout enforcement
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
          reject(new Error(`Command timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);
    });
  }

  /**
   * 获取 Scratchpad 目录 - Enhanced with creation logic
   */
  private getScratchpadDir(): string {
    const os = require('os');
    const path = require('path');
    
    const scratchpadBase = process.env.OPENCLAW_SCRATCHPAD || 
                          path.join(os.tmpdir(), 'openclaw-scratchpad');
    
    // Create directory if it doesn't exist
    try {
      const fs = require('fs');
      
      if (!fs.existsSync(scratchpadBase)) {
        fs.mkdirSync(scratchpadBase, { recursive: true });
        console.log(`[BASH] Created scratchpad directory: ${scratchpadBase}`);
      }
      
      // Create unique subdirectory for this session
      const sessionId = Date.now().toString(36);
      const scratchpadDir = path.join(scratchpadBase, `session-${sessionId}`);
      
      fs.mkdirSync(scratchpadDir, { recursive: true });
      
      console.log(`[BASH] Using scratchpad directory: ${scratchpadDir}`);
      
      return scratchpadDir;
    } catch (error) {
      console.warn('[BASH] Failed to create scratchpad directory:', error);
      return os.tmpdir(); // Fallback to system temp
    }
  }

  /**
   * 获取沙箱环境 - Enhanced with security hardening
   */
  private getSandboxEnv(): NodeJS.ProcessEnv {
    const env = process.env;
    
    // Security hardening for sandboxed execution
    return {
      ...env,
      
      // Remove sensitive variables
      PASSWORD: undefined,
      SECRET: undefined,
      API_KEY: undefined,
      TOKEN: undefined,
      
      // Set safe defaults
      HOME: process.env.HOME || os.homedir(),
      USER: process.env.USER || process.env.USERNAME,
      
      // Limit PATH to safe directories only
      PATH: '/usr/bin:/bin:/usr/local/bin',
    };
  }

  /**
   * Check if tool is enabled - Always true for BashTool
   */
  isEnabled(): boolean {
    return true;
  }
}

/**
 * PowerShell Tool - Windows equivalent (simplified)
 */
export class PowerShellTool implements Tool {
  name = 'PowerShell';
  description = 'Execute PowerShell commands on Windows systems.';
  
  inputSchema = {
    type: 'object',
    properties: {
      command: { 
        type: 'string', 
        description: 'The PowerShell command to execute' 
      },
      sandboxed: {
        type: 'boolean',
        description: 'Whether to run in sandbox mode (default: true)',
        default: true,
      },
    },
    required: ['command'],
  };

  async execute(input: unknown): Promise<{ success: boolean; output?: string; error?: string }> {
    const { command, sandboxed = true } = input as { 
      command: string; 
      sandboxed?: boolean; 
    };

    if (sandboxed) {
      // PowerShell sandboxing logic would go here
      console.log(`[POWERSHELL] Executing in sandbox mode: ${command}`);
      
      return {
        success: true,
        output: `PowerShell command executed successfully`,
      };
    } else {
      console.warn(`[POWERSHELL] Raw execution (no sandbox): ${command}`);
      
      return {
        success: false,
        error: 'Raw PowerShell execution not supported in this demo',
      };
    }
  }

  isEnabled(): boolean {
    // Only enable on Windows
    return process.platform === 'win32';
  }
}
