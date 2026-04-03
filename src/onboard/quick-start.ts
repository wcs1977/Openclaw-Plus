/**
 * Quick Start Wizard - 快速启动向导
 * 
 * 参考 Claude Code Haha 的 --install-daemon 一键安装模式
 * 将复杂的设置流程简化为 3 步完成
 */

import { createInterface } from 'readline';
import chalk from 'chalk';
import { execSync, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface QuickStartOptions {
  installDaemon?: boolean;
  skipChannels?: string[];
  model?: string;
  verbose?: boolean;
}

interface EnvironmentCheckResult {
  success: boolean;
  issues: string[];
  recommendations: string[];
}

interface SmartConfig {
  agent: {
    model: string;
    workspace: string;
  };
  gateway: {
    bind: 'loopback' | 'all';
    port: number;
    tailscale?: { mode: 'serve' | 'funnel' };
  };
  channels: Record<string, any>;
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(chalk.bold(`\n${query}`), (answer) => {
      resolve(answer.trim());
    });
  });
}

async function checkEnvironment(): Promise<EnvironmentCheckResult> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check Node.js version
  try {
    const nodeVersion = process.version.replace('v', '');
    const [major] = nodeVersion.split('.').map(Number);
    
    if (major < 22) {
      issues.push(`Node.js ${nodeVersion} is too old. Requires >= 22.14.0`);
      recommendations.push('Update Node.js to version 22 or later');
    }
  } catch (error) {
    issues.push('Failed to check Node.js version');
  }
  
  // Check pnpm availability
  try {
    execSync('pnpm --version', { stdio: 'pipe' });
  } catch (error) {
    issues.push('pnpm is not installed');
    recommendations.push('Install pnpm globally: npm install -g pnpm');
  }
  
  // Check workspace writability
  const homeDir = os.homedir();
  const workspacePath = path.join(homeDir, '.openclaw', 'workspace');
  
  try {
    await fs.access(workspacePath);
  } catch (error) {
    issues.push(`Workspace directory not found: ${workspacePath}`);
    recommendations.push('Run "openclaw onboard" to initialize workspace');
  }
  
  // Check Tailscale availability
  try {
    execSync('tailscale status', { stdio: 'pipe' });
  } catch (error) {
    issues.push('Tailscale is not running or installed');
    recommendations.push('Install and start Tailscale for remote access');
  }
  
  return {
    success: issues.length === 0,
    issues,
    recommendations
  };
}

function generateSmartConfig(options: QuickStartOptions): SmartConfig {
  const defaults: SmartConfig = {
    agent: {
      model: options.model || 'anthropic/claude-opus-4-6',
      workspace: path.join(os.homedir(), '.openclaw', 'workspace')
    },
    gateway: {
      bind: 'loopback',
      port: 18789,
      tailscale: { mode: 'serve' }
    },
    channels: {}
  };
  
  // Detect preferred channels based on OS and environment
  const detectedChannels = detectPreferredChannels();
  
  if (!options.skipChannels) {
    for (const channel of detectedChannels) {
      defaults.channels[channel] = getDefaultChannelConfig(channel);
    }
  }
  
  return defaults;
}

function detectPreferredChannels(): string[] {
  const platform = os.platform();
  const channels: string[] = [];
  
  // Common channels for all platforms
  if (platform !== 'win32') {
    channels.push('telegram');
  }
  
  // Platform-specific recommendations
  switch (platform) {
    case 'darwin':
      channels.push('iMessage', 'slack');
      break;
    case 'linux':
      channels.push('discord', 'slack');
      break;
    case 'win32':
      channels.push('teams', 'whatsapp');
      break;
  }
  
  return channels.slice(0, 3); // Limit to top 3 recommendations
}

function getDefaultChannelConfig(channel: string): any {
  const configs: Record<string, any> = {
    telegram: {
      botToken: '', // User will need to provide
      enabled: false
    },
    discord: {
      token: '',
      enabled: false
    },
    slack: {
      botToken: '',
      appId: '',
      signingSecret: '',
      enabled: false
    }
  };
  
  return configs[channel] || {};
}

async function installDependencies(): Promise<void> {
  console.log(chalk.cyan('\n📦 Installing dependencies...'));
  
  try {
    execSync('pnpm install', { 
      stdio: 'inherit',
      cwd: path.join(os.homedir(), '.openclaw')
    });
    
    console.log(chalk.green('✅ Dependencies installed successfully'));
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

async function setupWorkspace(): Promise<void> {
  const workspacePath = path.join(os.homedir(), '.openclaw', 'workspace');
  
  console.log(chalk.cyan('\n📁 Setting up workspace...'));
  
  try {
    await fs.mkdir(workspacePath, { recursive: true });
    
    // Create essential files
    await fs.writeFile(
      path.join(workspacePath, 'README.md'),
      `# OpenClaw Workspace\n\nThis is your personal AI assistant workspace.\n`
    );
    
    console.log(chalk.green('✅ Workspace created successfully'));
  } catch (error) {
    throw new Error(`Failed to setup workspace: ${error.message}`);
  }
}

async function installDaemon(options: QuickStartOptions): Promise<void> {
  if (!options.installDaemon) return;
  
  console.log(chalk.cyan('\n🔧 Installing system daemon...'));
  
  try {
    const platform = os.platform();
    
    switch (platform) {
      case 'darwin':
        await installMacOSDaemon();
        break;
      case 'linux':
        await installLinuxDaemon();
        break;
      case 'win32':
        console.log(chalk.yellow('⚠️  Windows daemon installation not yet supported'));
        console.log('   You can run OpenClaw manually with: openclaw start');
        return;
    }
    
    console.log(chalk.green('✅ Daemon installed successfully'));
  } catch (error) {
    throw new Error(`Failed to install daemon: ${error.message}`);
  }
}

async function installMacOSDaemon(): Promise<void> {
  const launchAgentPath = path.join(
    os.homedir(),
    'Library',
    'LaunchAgents',
    'ai.openclaw.gateway.plist'
  );
  
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.gateway</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/openclaw</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/openclaw-gateway.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/openclaw-gateway-error.log</string>
</dict>
</plist>`;
  
  await fs.mkdir(path.dirname(launchAgentPath), { recursive: true });
  await fs.writeFile(launchAgentPath, plistContent);
  
  execSync('launchctl load ~/Library/LaunchAgents/ai.openclaw.gateway.plist');
}

async function installLinuxDaemon(): Promise<void> {
  const systemdUnitPath = '/etc/systemd/system/openclaw-gateway.service';
  
  const unitContent = `[Unit]
Description=OpenClaw Gateway Service
After=network.target

[Service]
Type=simple
User=${os.userInfo().username}
ExecStart=/usr/local/bin/openclaw start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target`;
  
  await fs.mkdir(path.dirname(systemdUnitPath), { recursive: true });
  await fs.writeFile(systemdUnitPath, unitContent);
  
  execSync('sudo systemctl daemon-reload');
  execSync('sudo systemctl enable openclaw-gateway');
  execSync('sudo systemctl start openclaw-gateway');
}

async function channelSetupWizard(): Promise<void> {
  console.log(chalk.cyan('\n📱 Channel Setup Wizard'));
  console.log('-'.repeat(60));
  
  const channels = ['telegram', 'discord', 'slack'];
  
  for (const channel of channels) {
    const answer = await question(`\nEnable ${channel}? (y/n): `);
    
    if (answer.toLowerCase() === 'y') {
      console.log(chalk.cyan(`\nEnter your ${channel} credentials:`));
      
      let config: Record<string, string> = {};
      
      switch (channel) {
        case 'telegram':
          config.botToken = await question('Telegram Bot Token: ');
          break;
        case 'discord':
          config.token = await question('Discord Bot Token: ');
          break;
        case 'slack':
          config.botToken = await question('Slack Bot Token: ');
          config.appId = await question('Slack App ID: ');
          config.signingSecret = await question('Slack Signing Secret: ');
          break;
      }
      
      console.log(chalk.green(`✅ ${channel} configured`));
    } else {
      console.log(chalk.yellow(`⏭️  Skipping ${channel}`));
    }
  }
}

async function promptConfigConfirmation(config: SmartConfig): Promise<boolean> {
  console.log('\n📋 Configuration Summary');
  console.log('-'.repeat(60));
  
  console.log(chalk.bold('Agent Settings:'));
  console.log(`   Model: ${config.agent.model}`);
  console.log(`   Workspace: ${config.agent.workspace}`);
  
  console.log('\nGateway Settings:');
  console.log(`   Bind Address: ${config.gateway.bind}`);
  console.log(`   Port: ${config.gateway.port}`);
  
  if (config.gateway.tailscale) {
    console.log(`   Tailscale Mode: ${config.gateway.tailscale.mode}`);
  }
  
  const answer = await question('\nAccept this configuration? (y/n): ');
  
  return answer.toLowerCase() === 'y';
}

export async function quickStart(options: QuickStartOptions = {}): Promise<void> {
  console.log(chalk.bold('\n🚀 OpenClaw Quick Start'));
  console.log('='.repeat(60));
  
  try {
    // Step 1: Environment Check
    console.log('\n🔍 Checking environment...');
    const envCheck = await checkEnvironment();
    
    if (!envCheck.success) {
      console.log(chalk.red('\n❌ Environment issues detected:'));
      
      for (const issue of envCheck.issues) {
        console.log(`   ${chalk.yellow('•')} ${issue}`);
      }
      
      if (envCheck.recommendations.length > 0) {
        console.log(chalk.cyan('\n💡 Recommendations:'));
        
        for (const rec of envCheck.recommendations) {
          console.log(`   ${chalk.green('→')} ${rec}`);
        }
      }
      
      const fix = await question('\nAttempt automatic fixes? (y/n): ');
      
      if (fix.toLowerCase() === 'y') {
        // TODO: Implement auto-fix logic
        console.log(chalk.yellow('⚠️  Automatic fixes not yet implemented'));
        return;
      }
    } else {
      console.log(chalk.green('✅ Environment check passed'));
    }
    
    // Step 2: Generate Smart Configuration
    const config = generateSmartConfig(options);
    
    // Step 3: User Confirmation
    const confirmed = await promptConfigConfirmation(config);
    
    if (!confirmed) {
      console.log(chalk.yellow('\n⏭️  Setup cancelled by user'));
      return;
    }
    
    // Step 4: Installation
    console.log('\n🔧 Installing OpenClaw...');
    await installDependencies();
    await setupWorkspace();
    
    if (options.installDaemon) {
      await installDaemon(options);
    }
    
    // Step 5: Channel Setup (optional)
    if (!options.skipChannels) {
      await channelSetupWizard();
    }
    
    console.log('\n✨ Quick start complete!');
    console.log(chalk.green('📖 Run "openclaw doctor" to verify setup'));
    console.log(chalk.cyan('🚀 Run "openclaw start" to launch the gateway\n'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

export default quickStart;
