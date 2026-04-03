#!/usr/bin/env node
/**
 * run-script.mjs - Cross-platform script runner
 * Automatically selects bash or PowerShell based on OS
 */

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

function runScript(scriptName) {
  const isWindows = process.platform === 'win32';
  
  // Find the script based on OS and extension priority
  let scriptPath;
  let command;
  
  if (isWindows) {
    // On Windows: prefer .ps1 over .sh for better compatibility
    
    // Check if .ps1 version exists first
    const psScript = path.join(ROOT_DIR, 'scripts', `${scriptName}.ps1`);
    
    if (fs.existsSync(psScript)) {
      scriptPath = psScript;
      command = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', scriptPath];
    } else {
      // Fall back to .sh version
      const bashScript = path.join(ROOT_DIR, 'scripts', `${scriptName}.sh`);
      
      if (fs.existsSync(bashScript)) {
        scriptPath = bashScript;
        
        // Try Git Bash first
        const gitBashPath = spawnSync('where', ['gitbash']).stdout?.toString().trim();
        if (gitBashPath) {
          command = [path.join(gitBashPath, 'bin', 'bash.exe'), '--login', '-c', `"${scriptPath}"`];
        } else {
          // Try standard Git Bash location
          const standardGitBash = 'C:\\Program Files\\Git\\bin\\bash.exe';
          if (fs.existsSync(standardGitBash)) {
            command = [standardGitBash, '--login', '-c', `"${scriptPath}"`];
          } else {
            console.error(`Error: '${scriptName}.sh' requires Git Bash on Windows.`);
            console.error('Please install Git for Windows from https://git-scm.com/');
            process.exit(1);
          }
        }
      } else {
        console.error(`Script not found: ${scriptName} (tried .ps1 and .sh)`);
        process.exit(1);
      }
    }
  } else {
    // Unix-like systems (macOS, Linux) - prefer .sh
    scriptPath = path.join(ROOT_DIR, 'scripts', `${scriptName}.sh`);
    
    if (!fs.existsSync(scriptPath)) {
      console.error(`Script not found: ${scriptPath}`);
      process.exit(1);
    }
    
    command = ['bash', scriptPath];
  }

  // Run the script
  const child = spawn(command[0], command.slice(1), {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (err) => {
    console.error(`Failed to start script: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

// Get script name from command line args
const scriptName = process.argv[2];

if (!scriptName) {
  console.error('Usage: node scripts/run-script.mjs <script-name>');
  console.error('Examples:');
  console.error('  node scripts/run-script.mjs bundle-a2ui');
  console.error('  node scripts/run-script.mjs bundle-a2ui.sh');
  process.exit(1);
}

// Remove extension if present (handle both "bundle-a2ui" and "bundle-a2ui.sh")
const baseName = scriptName.replace(/\.(ps1|sh)$/, '');

runScript(baseName);
