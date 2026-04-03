#!/usr/bin/env node
/**
 * skip-a2ui-build.mjs - Skip A2UI bundling if sources are missing or SKIP_A2UI env var is set
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// Check SKIP_A2UI environment variable first
if (process.env.SKIP_A2UI === 'true') {
  console.log('[SKIP-A2UI] SKIP_A2UI=true, skipping bundling...');
  
  // Create a dummy bundle file to satisfy build dependencies
  const outputDir = path.join(ROOT_DIR, 'src', 'canvas-host', 'a2ui');
  if (!existsSync(outputDir)) {
    import('node:fs').then(fs => fs.promises.mkdir(outputDir, { recursive: true }));
  }
  
  const dummyBundlePath = path.join(outputDir, 'a2ui.bundle.js');
  import('node:fs').then(fs => 
    fs.promises.writeFile(
      dummyBundlePath,
      '// A2UI bundle skipped via SKIP_A2UI=true\nexport default {};',
      { encoding: 'utf8' }
    )
  );
  
  console.log(`[SKIP-A2UI] Created dummy bundle at ${dummyBundlePath}`);
  process.exit(0);
}

// Check if A2UI sources exist
const a2uiRendererDir = path.join(ROOT_DIR, 'vendor', 'a2ui', 'renderers', 'lit');
const a2uiAppDir = path.join(ROOT_DIR, 'apps', 'shared', 'OpenClawKit', 'Tools', 'CanvasA2UI');

if (!existsSync(a2uiRendererDir) || !existsSync(a2uiAppDir)) {
  console.log('[SKIP-A2UI] A2UI sources missing, skipping bundling...');
  console.log(`[SKIP-A2UI] Expected: ${a2uiRendererDir}`);
  console.log(`[SKIP-A2UI] Expected: ${a2uiAppDir}`);
  
  // Create a dummy bundle file to satisfy build dependencies
  const outputDir = path.join(ROOT_DIR, 'src', 'canvas-host', 'a2ui');
  if (!existsSync(outputDir)) {
    import('node:fs').then(fs => fs.promises.mkdir(outputDir, { recursive: true }));
  }
  
  const dummyBundlePath = path.join(outputDir, 'a2ui.bundle.js');
  import('node:fs').then(fs => 
    fs.promises.writeFile(
      dummyBundlePath,
      '// A2UI bundle skipped - sources missing\nexport default {};',
      { encoding: 'utf8' }
    )
  );
  
  console.log(`[SKIP-A2UI] Created dummy bundle at ${dummyBundlePath}`);
  process.exit(0);
}

console.log('[A2UI] Sources found, proceeding with bundling...');
process.exit(1); // Exit with error to trigger actual bundling
