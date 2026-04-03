#!/usr/bin/env node
/**
 * build-config.mjs - Build configuration for OpenClaw Plus
 * 
 * 借鉴 Claude Code v2.1.88 的 Bun feature flags 模式，
 * 根据构建目标裁剪未使用的代码。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/**
 * Build modes and their feature flag configurations
 */
export const BUILD_MODES = {
  DEV: {
    name: 'development',
    description: 'Full feature set with debugging support',
    defines: {
      'feature.PROACTIVE': 'true',
      'feature.KAIROS': 'true',
      'feature.AGENT_SWARMS': 'true',
      'feature.WORKTREE_MODE': 'true',
      'feature.AGENT_TRIGGERS': 'true',
      'feature.COORDINATOR_MODE': 'false',
    },
  },
  PROD: {
    name: 'production',
    description: 'Optimized for production with minimal overhead',
    defines: {
      'feature.PROACTIVE': 'true',
      'feature.KAIROS': 'true',
      'feature.AGENT_SWARMS': 'true',
      'feature.WORKTREE_MODE': 'true',
      'feature.AGENT_TRIGGERS': 'true',
      'feature.COORDINATOR_MODE': 'false',
    },
  },
  MINIMAL: {
    name: 'minimal',
    description: 'Core features only - smallest bundle size',
    defines: {
      'feature.PROACTIVE': 'false',
      'feature.KAIROS': 'false',
      'feature.AGENT_SWARMS': 'false',
      'feature.WORKTREE_MODE': 'false',
      'feature.AGENT_TRIGGERS': 'false',
      'feature.COORDINATOR_MODE': 'false',
    },
  },
};

/**
 * Generate Bun build command for a specific mode
 */
export function generateBuildCommand(modeName) {
  const mode = BUILD_MODES[modeName];
  
  if (!mode) {
    throw new Error(`Unknown build mode: ${modeName}`);
  }
  
  const defines = Object.entries(mode.defines)
    .map(([key, value]) => `--define:${key}=${value}`)
    .join(' ');
  
  return `bun build src/index.ts --outdir=dist ${defines} --minify`;
}

/**
 * Print usage information
 */
export function printUsage() {
  console.log(`
OpenClaw Plus Build Configuration

Usage: node scripts/build-config.mjs <mode>

Available modes:
  dev      - Development build (full features)
  prod     - Production build (optimized)
  minimal  - Minimal build (core features only)

Examples:
  node scripts/build-config.mjs dev
  node scripts/build-config.mjs prod
  node scripts/build-config.mjs minimal
`);
}

// Main execution
const modeName = process.argv[2];

if (!modeName || !BUILD_MODES[modeName.toUpperCase()]) {
  printUsage();
  process.exit(1);
}

console.log(`\n=== OpenClaw Plus Build Configuration ===`);
console.log(`Mode: ${BUILD_MODES[modeName.toUpperCase()].name}`);
console.log(`Description: ${BUILD_MODES[modeName.toUpperCase()].description}\n`);

const command = generateBuildCommand(modeName.toUpperCase());
console.log(`Build command:\n  ${command}\n`);

// Write configuration to file for reference
const configPath = path.join(ROOT_DIR, '.artifacts', 'build-config.json');
const configDir = path.dirname(configPath);

if (!path.existsSync(configDir)) {
  await import('node:fs').then(fs => fs.promises.mkdir(configDir, { recursive: true }));
}

await import('node:fs').then(fs => 
  fs.promises.writeFile(
    configPath,
    JSON.stringify({
      mode: BUILD_MODES[modeName.toUpperCase()].name,
      description: BUILD_MODES[modeName.toUpperCase()].description,
      defines: BUILD_MODES[modeName.toUpperCase()].defines,
      command,
      timestamp: new Date().toISOString(),
    }, null, 2)
  )
);

console.log(`Configuration saved to: ${configPath}\n`);
