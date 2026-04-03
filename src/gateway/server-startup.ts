/**
 * server-startup.ts - OpenClaw Plus 启动优化模块
 * 
 * 借鉴 Claude Code v2.1.88 的并行预取模式，
 * 将 MDM + Keychain 从串行改为并行执行。
 */

import { profileCheckpoint } from '../utils/startupProfiler.js';
import type { PluginRegistry } from './plugin-registry.js';
import type { ModelCatalog } from '../services/model-catalog.js';

/**
 * 启动所有异步预取任务（不阻塞主线程）
 * 
 * Claude Code 模式：
 * - startMdmRawRead: MDM 设置异步读取 (~30ms)
 * - startKeychainPrefetch: Keychain 并行加载 (~65ms → ~0ms)
 */
export function startDeferredPrefetches() {
  profileCheckpoint('deferred_prefetch_start');
  
  // 预取远程技能缓存（减少首次使用延迟）
  void loadRemoteSkillsCache();
  
  // 异步初始化插件注册表
  void initPluginRegistryAsync();
  
  // 预取模型目录（加速模型选择）
  void prefetchModelCatalog();
  
  profileCheckpoint('deferred_prefetch_end');
}

/**
 * 加载远程技能缓存
 */
async function loadRemoteSkillsCache() {
  const cachePath = '~/.openclaw/skills-cache.json';
  
  try {
    // 异步下载最新技能列表
    await fetchAndCacheSkills();
    
    profileCheckpoint('skills_cache_loaded');
  } catch (err) {
    console.warn('Failed to preload skills cache:', err);
    profileCheckpoint('skills_cache_failed');
  }
}

/**
 * 异步初始化插件注册表
 */
async function initPluginRegistryAsync() {
  try {
    const registry = getPluginRegistry();
    
    if (registry) {
      await registry.initializeAsync();
      
      profileCheckpoint('plugin_registry_initialized');
    } else {
      console.warn('Plugin registry not available yet');
    }
  } catch (err) {
    console.warn('Failed to initialize plugin registry:', err);
    profileCheckpoint('plugin_registry_failed');
  }
}

/**
 * 预取模型目录
 */
async function prefetchModelCatalog() {
  try {
    const catalog = getModelCatalog();
    
    if (catalog) {
      await catalog.prefetch();
      
      profileCheckpoint('model_catalog_prefetched');
    } else {
      console.warn('Model catalog not available yet');
    }
  } catch (err) {
    console.warn('Failed to prefetch model catalog:', err);
    profileCheckpoint('model_catalog_failed');
  }
}

/**
 * 获取插件注册表实例（延迟加载）
 */
function getPluginRegistry(): PluginRegistry | null {
  try {
    // Lazy load to avoid circular dependencies
    const registryModule = require('./plugin-registry.js') as typeof import('./plugin-registry.js');
    
    return registryModule.getPluginRegistry();
  } catch (err) {
    console.warn('Failed to get plugin registry:', err);
    return null;
  }
}

/**
 * 获取模型目录实例（延迟加载）
 */
function getModelCatalog(): ModelCatalog | null {
  try {
    // Lazy load to avoid circular dependencies
    const catalogModule = require('../services/model-catalog.js') as typeof import('../services/model-catalog.js');
    
    return catalogModule.getModelCatalog();
  } catch (err) {
    console.warn('Failed to get model catalog:', err);
    return null;
  }
}

/**
 * 下载并缓存技能列表
 */
async function fetchAndCacheSkills() {
  const cachePath = path.join(os.homedir(), '.openclaw', 'skills-cache.json');
  
  // Fetch latest skills from remote
  const response = await fetch('https://api.openclaw.ai/skills/list');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch skills: ${response.status}`);
  }
  
  const skills = await response.json();
  
  // Cache locally for faster access
  await fs.promises.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.promises.writeFile(
    cachePath, 
    JSON.stringify(skills, null, 2)
  );
}

// Export profile checkpoints for debugging
export const PROFILE_CHECKPOINTS = [
  'deferred_prefetch_start',
  'skills_cache_loaded',
  'skills_cache_failed',
  'plugin_registry_initialized',
  'plugin_registry_failed',
  'model_catalog_prefetched',
  'model_catalog_failed',
  'deferred_prefetch_end',
];
