/**
 * permissionChecker.ts - OpenClaw Plus Permission Checker (Fine-grained)
 * 
 * 借鉴 Claude Code v2.1.88 的三层权限检查模型，
 * 实现细粒度权限控制。
 */

import type { Tool } from '../../Tool.js';
import { profileCheckpoint } from '../startupProfiler.js';

/**
 * Permission Result Types
 */
export type PermissionBehavior = 'allow' | 'deny' | 'prompt';

export interface PermissionResult {
  behavior: PermissionBehavior;
  reason?: string;
  riskLevel?: RiskLevel;
}

/**
 * Risk Levels for command assessment
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Permission Context - Enhanced with detailed information
 */
export interface PermissionContext {
  /** Current permission mode (default/plan/auto/bypass) */
  mode: PermissionMode;
  
  /** Allowed tools by user configuration */
  allowedTools?: string[];
  
  /** Denied tools by user configuration */
  disallowedTools?: string[];
  
  /** Additional working directories */
  additionalWorkingDirectories?: Map<string, WorkingDir>;
  
  /** Bash permission rules */
  bashPermissions?: BashPermissionRule[];
}

/**
 * Permission Modes
 */
export type PermissionMode = 'default' | 'plan' | 'auto' | 'bypass';

/**
 * Working Directory Configuration
 */
export interface WorkingDir {
  path: string;
  allowed: boolean;
}

/**
 * Bash Permission Rule
 */
export interface BashPermissionRule {
  pattern: RegExp;
  action: 'allow' | 'deny' | 'prompt';
  description?: string;
}

/**
 * Permission Checker - Fine-grained permission checking (Enhanced)
 */
export class PermissionChecker {
  private context: PermissionContext;
  private decisionCache: Map<string, PermissionResult> = new Map();
  
  constructor(context: PermissionContext) {
    this.context = context;
    
    console.log(`[PERMISSION] Initialized with mode: ${context.mode}`);
  }

  /**
   * Fine-grained permission check (Three-layer model) - Enhanced
   */
  async checkPermission(
    tool: Tool, 
    input: unknown,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    profileCheckpoint('permission_check_start');
    
    // Merge provided context with instance context
    const effectiveContext = context ?? this.context;
    
    // Layer 1: Cache check (cached decisions)
    const cached = await this.getDecisionCache(tool.name, input);
    if (cached) {
      profileCheckpoint('permission_check_cached');
      console.log(`[PERMISSION] Cached decision for ${tool.name}: ${cached.behavior}`);
      return cached;
    }

    // Layer 2: Sandbox check
    const sandboxResult = this.checkSandbox(tool, input);
    if (sandboxResult) {
      profileCheckpoint('permission_check_sandbox');
      console.log(`[PERMISSION] Sandbox allowed for ${tool.name}`);
      return sandboxResult;
    }

    // Layer 3: Risk assessment
    const risk = this.assessRisk(tool, input);
    
    if (risk.level === 'high') {
      profileCheckpoint('permission_check_high_risk');
      
      // High risk commands require prompt
      const result: PermissionResult = {
        behavior: 'prompt',
        reason: 'high_risk_command',
        riskLevel: 'high',
      };
      
      console.log(`[PERMISSION] High risk detected for ${tool.name}: ${risk.reason}`);
      return result;
    }

    // Layer 4: Auto mode decision (based on history)
    if (effectiveContext.mode === 'auto') {
      const autoResult = await this.autoApprove(tool, effectiveContext);
      
      profileCheckpoint('permission_check_auto');
      console.log(`[PERMISSION] Auto mode decision for ${tool.name}: ${autoResult.behavior}`);
      
      // Cache the decision
      await this.cacheDecision(tool.name, input, autoResult);
      
      return autoResult;
    }

    // Layer 5: Default - prompt
    profileCheckpoint('permission_check_default');
    
    const result: PermissionResult = {
      behavior: 'prompt',
      reason: 'default_prompt',
      riskLevel: risk.level,
    };
    
    console.log(`[PERMISSION] Default prompt for ${tool.name}`);
    return result;
  }

  /**
   * Layer 1: Cache check - Enhanced with TTL
   */
  private async getDecisionCache(
    toolName: string, 
    input: unknown
  ): Promise<PermissionResult | null> {
    const cacheKey = this.generateCacheKey(toolName, input);
    
    const cached = this.decisionCache.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      return cached;
    }
    
    // Try LRU cache for recent decisions
    const recentDecision = this.getRecentDecision(toolName);
    
    if (recentDecision) {
      console.log(`[PERMISSION] Recent decision found for ${toolName}`);
      return recentDecision;
    }
    
    return null;
  }

  /**
   * Generate cache key from tool name and input
   */
  private generateCacheKey(toolName: string, input: unknown): string {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    return `${toolName}:${inputStr.substring(0, 50)}`;
  }

  /**
   * Check if cache entry is expired (TTL: 1 hour)
   */
  private isExpired(entry: { timestamp: number }): boolean {
    const now = Date.now();
    const ttlMs = 60 * 60 * 1000; // 1 hour
    
    return (now - entry.timestamp) > ttlMs;
  }

  /**
   * Cache decision for future use
   */
  private async cacheDecision(
    toolName: string, 
    input: unknown, 
    result: PermissionResult
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(toolName, input);
    
    this.decisionCache.set(cacheKey, { ...result, timestamp: Date.now() });
    
    // Limit cache size (LRU eviction)
    if (this.decisionCache.size > 1000) {
      const firstKey = this.decisionCache.keys().next().value;
      this.decisionCache.delete(firstKey);
    }
  }

  /**
   * Get recent decision for tool
   */
  private getRecentDecision(toolName: string): PermissionResult | null {
    // In real implementation, query database or file system
    return null;
  }

  /**
   * Layer 2: Sandbox check - Enhanced with pattern matching
   */
  private checkSandbox(
    tool: Tool, 
    input: unknown
  ): PermissionResult | null {
    const command = this.extractCommand(input);
    
    if (!command) return null;

    // Safe patterns (always allowed in sandbox)
    const safePatterns = [
      /echo\s+/,                    // Echo commands
      /ls\s+.*\|/,                 // List with pipe
      /cat\s+.*\|/,                // Cat with pipe
      /grep\s+.*\|/,               // Grep with pipe
      /head\s+/,                   // Head command
      /tail\s+/,                   // Tail command
    ];

    for (const pattern of safePatterns) {
      if (pattern.test(command)) {
        return { behavior: 'allow', reason: 'sandbox_safe_pattern' };
      }
    }

    return null;
  }

  /**
   * Layer 3: Risk assessment - Enhanced with detailed analysis
   */
  private assessRisk(
    tool: Tool, 
    input: unknown
  ): { level: RiskLevel; reason?: string } {
    const command = this.extractCommand(input);
    
    if (!command) return { level: 'low' };

    // High risk patterns (dangerous operations)
    const highRiskPatterns = [
      { pattern: /rm\s+-rf\s+\/, reason: 'deletes root directory' },
      { pattern: /dd\s+if=.*of=\/dev/, reason: 'disk write operation' },
      { pattern: /chmod\s+[0-7]{4}\s+\/, reason: 'root permission change' },
      { pattern: /wget\s+.*\|sh/, reason: 'download and execute script' },
      { pattern: /curl\s+.*\|bash/, reason: 'download and execute script' },
      { pattern: /mkfs/, reason: 'format filesystem' },
      { pattern: /fdisk/, reason: 'disk partitioning' },
    ];

    for (const { pattern, reason } of highRiskPatterns) {
      if (pattern.test(command)) {
        return { level: 'high', reason };
      }
    }

    // Medium risk patterns (potentially dangerous)
    const mediumRiskPatterns = [
      { pattern: /sudo\s+/, reason: 'elevated privileges' },
      { pattern: /mount\s+/, reason: 'filesystem mount' },
      { pattern: /iptables\s+/, reason: 'firewall modification' },
      { pattern: /useradd\s+|usermod\s+/, reason: 'user management' },
      { pattern: /passwd\s+/, reason: 'password change' },
    ];

    for (const { pattern, reason } of mediumRiskPatterns) {
      if (pattern.test(command)) {
        return { level: 'medium', reason };
      }
    }

    // Low risk patterns (generally safe)
    const lowRiskPatterns = [
      /echo\s+/,                    // Echo commands
      /ls\s+/,                      // List directory
      /cat\s+/,                     // View file content
      /grep\s+/,                    // Search text
      /head\s+|tail\s+/,           // View file start/end
      /wc\s+/,                      // Word count
      /date\s+/,                    // Show date/time
    ];

    for (const { pattern } of lowRiskPatterns) {
      if (pattern.test(command)) {
        return { level: 'low' };
      }
    }

    // Default to medium risk for unknown commands
    return { level: 'medium', reason: 'unknown_command_pattern' };
  }

  /**
   * Layer 4: Auto mode decision - Enhanced with history analysis
   */
  private async autoApprove(
    tool: Tool, 
    context: PermissionContext
  ): Promise<PermissionResult> {
    // Get tool execution history (simplified for demo)
    const history = await this.getToolHistory(tool.name);
    
    // If approved > 10 times in last hour, auto-approve
    if (history.approvedCount >= 10 && history.lastHourApproved >= 5) {
      return { 
        behavior: 'allow', 
        reason: 'auto_approved_by_history' 
      };
    }

    // If denied > 3 times, deny
    if (history.deniedCount >= 3) {
      return { 
        behavior: 'deny', 
        reason: 'denied_by_history' 
      };
    }

    // Default to prompt for auto mode
    return { 
      behavior: 'prompt', 
      reason: 'auto_mode_default' 
    };
  }

  /**
   * Extract command from tool input (simplified)
   */
  private extractCommand(input: unknown): string | null {
    if (typeof input === 'string') {
      return input;
    }
    
    if (typeof input === 'object' && input !== null) {
      const obj = input as Record<string, unknown>;
      
      // Common command fields
      for (const key of ['command', 'cmd', 'script', 'code']) {
        if (typeof obj[key] === 'string') {
          return obj[key];
        }
      }
    }
    
    return null;
  }

  /**
   * Get tool execution history (simplified)
   */
  private async getToolHistory(toolName: string): Promise<{
    approvedCount: number;
    deniedCount: number;
    lastHourApproved: number;
  }> {
    // In real implementation, query database or file system
    
    // Mock data for demo
    return {
      approvedCount: Math.floor(Math.random() * 20),
      deniedCount: Math.floor(Math.random() * 5),
      lastHourApproved: Math.floor(Math.random() * 10),
    };
  }

  /**
   * Update permission context
   */
  updateContext(context: Partial<PermissionContext>): void {
    this.context = { ...this.context, ...context };
    
    console.log(`[PERMISSION] Context updated: mode=${this.context.mode}`);
  }

  /**
   * Clear decision cache
   */
  clearCache(): void {
    this.decisionCache.clear();
    console.log('[PERMISSION] Decision cache cleared');
  }

  /**
   * Get permission statistics
   */
  getStats(): {
    totalChecks: number;
    allowed: number;
    denied: number;
    prompted: number;
    cached: number;
  } {
    let allowed = 0, denied = 0, prompted = 0, cached = 0;
    
    for (const result of this.decisionCache.values()) {
      switch (result.behavior) {
        case 'allow': allowed++; break;
        case 'deny': denied++; break;
        case 'prompt': prompted++; break;
      }
    }
    
    return {
      totalChecks: this.decisionCache.size,
      allowed,
      denied,
      prompted,
      cached,
    };
  }
}

/**
 * Permission Checker Factory - Enhanced with context management
 */
export function createPermissionChecker(context: PermissionContext): PermissionChecker {
  return new PermissionChecker(context);
}

/**
 * Default permission checker instance
 */
export const defaultPermissionChecker = createPermissionChecker({
  mode: 'default',
});
