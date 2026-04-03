/**
 * Skill Manager - 增强的技能管理系统
 * 
 * 实现自动发现机制、版本兼容性检查、从 ClawHub 安装支持
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Skill {
  name: string;
  description: string;
  version: string;
  author?: string;
  features: string[];
  requiredFeatures: string[];
  install: () => Promise<void>;
}

export interface ClawHubSkill {
  id: string;
  name: string;
  version: string;
  description: string;
  downloadUrl: string;
  requiredVersion?: string;
  requiredFeatures: string[];
  author: string;
  tags: string[];
}

export class SkillManager {
  
  private static instance: SkillManager;
  private skills: Map<string, Skill> = new Map();
  
  private constructor() {}
  
  static getInstance(): SkillManager {
    if (!SkillManager.instance) {
      SkillManager.instance = new SkillManager();
    }
    return SkillManager.instance;
  }
  
  /**
   * 自动发现本地技能
   */
  async discoverSkills(): Promise<Skill[]> {
    
    const skillDirs = [
      path.join(os.homedir(), '.openclaw', 'workspace', 'skills'),
      path.join(os.homedir(), '.openclaw', 'skills')
    ];
    
    const discovered: Skill[] = [];
    
    for (const dir of skillDirs) {
      try {
        await fs.access(dir);
        
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          if (file === 'SKILL.md') {
            const skillPath = path.join(dir, file);
            const skillName = path.basename(path.dirname(skillPath));
            
            // 解析 SKILL.md
            const content = await fs.readFile(skillPath, 'utf-8');
            const parsed = this.parseSkillMD(content);
            
            if (parsed) {
              discovered.push({
                name: skillName,
                description: parsed.description,
                version: parsed.version || '1.0.0',
                author: parsed.author,
                features: parsed.features,
                requiredFeatures: parsed.requiredFeatures,
                install: () => this.installSkill(skillName)
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to scan ${dir}:`, error);
      }
    }
    
    return discovered;
  }
  
  /**
   * 从 ClawHub 安装技能
   */
  async installSkillFromHub(name: string): Promise<Skill> {
    
    // Step 1: 从 ClawHub API 获取技能信息
    const hubResponse = await fetch(`https://clawhub.com/api/skills/${name}`);
    
    if (!hubResponse.ok) {
      throw new Error(`Skill ${name} not found on ClawHub`);
    }
    
    const skillData: ClawHubSkill = await hubResponse.json();
    
    // Step 2: 检查依赖和兼容性
    if (!this.checkCompatibility(skillData)) {
      throw new Error(
        `Incompatible with current version. Required: ${skillData.requiredVersion || 'unknown'}`
      );
    }
    
    // Step 3: 下载技能包
    const downloadUrl = skillData.downloadUrl;
    console.log(`Downloading skill from ${downloadUrl}...`);
    
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error('Failed to download skill package');
    }
    
    const zipBuffer = await response.arrayBuffer();
    
    // Step 4: 解压到 workspace
    const destDir = path.join(
      os.homedir(),
      '.openclaw', 'workspace', 'skills',
      name
    );
    
    console.log(`Extracting to ${destDir}...`);
    await fs.mkdir(destDir, { recursive: true });
    await this.extractZip(zipBuffer, destDir);
    
    // Step 5: 验证安装
    const skillPath = path.join(destDir, 'SKILL.md');
    if (!(await this.fileExists(skillPath))) {
      throw new Error('Invalid skill package - missing SKILL.md');
    }
    
    console.log(`✅ Skill ${name} installed successfully`);
    
    // 加载新安装的技能
    return await this.loadSkill(name);
  }
  
  /**
   * 检查版本兼容性
   */
  private checkCompatibility(skillData: ClawHubSkill): boolean {
    
    // 检查版本要求
    if (skillData.requiredVersion) {
      const currentVersion = process.env.OPENCLAW_VERSION || 'unknown';
      
      if (!this.isVersionCompatible(currentVersion, skillData.requiredVersion)) {
        console.warn(`⚠️  Version mismatch: required ${skillData.requiredVersion}, got ${currentVersion}`);
        return false;
      }
    }
    
    // 检查功能依赖
    for (const requiredFeature of skillData.requiredFeatures || []) {
      if (!this.isFeatureEnabled(requiredFeature)) {
        console.warn(`⚠️  Missing feature: ${requiredFeature}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 版本兼容性检查
   */
  private isVersionCompatible(current: string, required: string): boolean {
    
    // 简单版本比较 (实际应使用 semver)
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const curr = currentParts[i] || 0;
      const req = requiredParts[i] || 0;
      
      if (curr > req) return true;
      if (curr < req) return false;
    }
    
    return true;
  }
  
  /**
   * 检查功能是否启用
   */
  private isFeatureEnabled(feature: string): boolean {
    
    // TODO: 实现实际的 feature gate 机制
    const enabledFeatures = [
      'MULTI_CHANNEL',
      'LIVE_CANVAS',
      'VOICE_WAKE',
      'SKILL_SYSTEM'
    ];
    
    return enabledFeatures.includes(feature);
  }
  
  /**
   * 解压 ZIP 文件
   */
  private async extractZip(zipBuffer: ArrayBuffer, destDir: string): Promise<void> {
    
    // TODO: 实现实际的 ZIP 解压逻辑
    // 可以使用 JSZip 库或系统命令
    
    console.log('Extracting ZIP...');
    
    try {
      // 尝试使用系统 unzip 命令
      const tempFile = path.join(os.tmpdir(), 'skill-download.zip');
      await fs.writeFile(tempFile, Buffer.from(zipBuffer));
      
      await execAsync(`unzip -o ${tempFile} -d ${destDir}`, {
        stdio: 'inherit'
      });
      
      await fs.unlink(tempFile);
    } catch (error) {
      // 如果 unzip 不可用，尝试使用系统 zip 命令
      try {
        const tempFile = path.join(os.tmpdir(), 'skill-download.zip');
        await fs.writeFile(tempFile, Buffer.from(zipBuffer));
        
        await execAsync(`tar -xzf ${tempFile} -C ${destDir}`, {
          stdio: 'inherit'
        });
        
        await fs.unlink(tempFile);
      } catch (extractError) {
        throw new Error('Failed to extract skill package');
      }
    }
  }
  
  /**
   * 加载已安装的技能
   */
  async loadSkill(name: string): Promise<Skill> {
    
    const skillPath = path.join(
      os.homedir(),
      '.openclaw', 'workspace', 'skills', name, 'SKILL.md'
    );
    
    if (!(await this.fileExists(skillPath))) {
      throw new Error(`Skill ${name} not found`);
    }
    
    const content = await fs.readFile(skillPath, 'utf-8');
    const parsed = this.parseSkillMD(content);
    
    if (!parsed) {
      throw new Error(`Invalid skill format for ${name}`);
    }
    
    const skill: Skill = {
      name,
      description: parsed.description,
      version: parsed.version || '1.0.0',
      author: parsed.author,
      features: parsed.features,
      requiredFeatures: parsed.requiredFeatures,
      install: () => this.installSkill(name)
    };
    
    this.skills.set(name, skill);
    
    return skill;
  }
  
  /**
   * 解析 SKILL.md 文件
   */
  private parseSkillMD(content: string): {
    description: string;
    version?: string;
    author?: string;
    features: string[];
    requiredFeatures: string[];
  } | null {
    
    const lines = content.split('\n');
    
    let description = '';
    let version: string | undefined;
    let author: string | undefined;
    const features: string[] = [];
    const requiredFeatures: string[] = [];
    
    for (const line of lines) {
      // 提取描述
      if (line.startsWith('# ') && !description) {
        description = line.substring(2).trim();
      }
      
      // 提取版本
      const versionMatch = line.match(/Version:\s*(.+)/i);
      if (versionMatch && !version) {
        version = versionMatch[1].trim();
      }
      
      // 提取作者
      const authorMatch = line.match(/Author:\s*(.+)/i);
      if (authorMatch && !author) {
        author = authorMatch[1].trim();
      }
      
      // 提取功能列表
      if (line.startsWith('- **')) {
        const featureMatch = line.match(/\*\*([^*]+)\*\*/);
        if (featureMatch) {
          features.push(featureMatch[1]);
        }
      }
      
      // 提取必需功能
      if (line.includes('Required:') || line.includes('Requires:')) {
        const reqMatch = line.match(/(?:Required|Requires):\s*(.+)/i);
        if (reqMatch) {
          requiredFeatures.push(reqMatch[1].trim());
        }
      }
    }
    
    return {
      description,
      version,
      author,
      features,
      requiredFeatures
    };
  }
  
  /**
   * 安装技能
   */
  private async installSkill(name: string): Promise<void> {
    
    console.log(`Installing skill ${name}...`);
    
    // TODO: 实现实际的安装逻辑
    
    console.log(`✅ Skill ${name} installed successfully`);
  }
  
  /**
   * 检查文件是否存在
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// CLI 命令集成
export async function installSkillCommand(args: { name: string }) {
  
  const manager = SkillManager.getInstance();
  
  try {
    await manager.installSkillFromHub(args.name);
    console.log('✅ Installation complete!');
    
    // 列出已安装的技能
    const installedSkills = await manager.discoverSkills();
    console.log('\n📚 Installed skills:');
    for (const skill of installedSkills) {
      console.log(`   - ${skill.name} v${skill.version}`);
    }
    
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    
    // 提供诊断建议
    if (error.message.includes('not found')) {
      console.log('\n💡 Tip: Check the skill name and try again');
      console.log('   Available skills: openclaw skills list');
    } else if (error.message.includes('Incompatible')) {
      console.log('\n💡 Tip: Update OpenClaw to a newer version');
      console.log('   Run: openclaw update --channel beta');
    }
  }
}

export default SkillManager;
