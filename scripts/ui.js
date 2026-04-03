#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const uiDir = path.join(repoRoot, "ui");

const WINDOWS_SHELL_EXTENSIONS = new Set([".cmd", ".bat", ".com"]);
const WINDOWS_UNSAFE_SHELL_ARG_PATTERN = /[\r\n"&|<>^%!]/;

function usage() {
  // keep this tiny; it's invoked from npm scripts too
  process.stderr.write("Usage: node scripts/ui.js <install|dev|build|test> [...args]\n");
}

function which(cmd) {
  try {
    const key = process.platform === "win32" ? "Path" : "PATH";
    const paths = (process.env[key] ?? process.env.PATH ?? "")
      .split(path.delimiter)
      .filter(Boolean);
    const extensions =
      process.platform === "win32"
        ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";").filter(Boolean)
        : [""];
    for (const entry of paths) {
      for (const ext of extensions) {
        const candidate = path.join(entry, process.platform === "win32" ? `${cmd}${ext}` : cmd);
        try {
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function resolveRunner() {
  const pnpm = which("pnpm");
  if (pnpm) {
    return { cmd: pnpm, kind: "pnpm" };
  }
  return null;
}

export function shouldUseShellForCommand(cmd, platform = process.platform) {
  if (platform !== "win32") {
    return false;
  }
  
  const extension = path.extname(cmd).toLowerCase();
  
  // SECURITY FIX: Commands with spaces in path MUST use shell execution
  // This prevents spawn EINVAL errors on Windows
  if (cmd.includes(" ")) {
    return true;
  }
  
  // .CMD and .BAT files need cmd.exe to execute properly
  if (extension === ".cmd" || extension === ".bat") {
    return true;
  }
  
  return WINDOWS_SHELL_EXTENSIONS.has(extension);
}

export function assertSafeWindowsShellArgs(args, platform = process.platform) {
  if (platform !== "win32") {
    return;
  }
  const unsafeArg = args.find((arg) => WINDOWS_UNSAFE_SHELL_ARG_PATTERN.test(arg));
  if (!unsafeArg) {
    return;
  }
  // SECURITY: `shell: true` routes through cmd.exe; reject risky metacharacters
  // in forwarded args to prevent shell control-flow/env-expansion injection.
  throw new Error(
    `Unsafe Windows shell argument: ${unsafeArg}. Remove shell metacharacters (" & | < > ^ % !).`,
  );
}

function createSpawnOptions(cmd, args, envOverride) {
  const useShell = shouldUseShellForCommand(cmd);
  
  if (useShell) {
    assertSafeWindowsShellArgs(args);
    
    // SECURITY FIX: For commands with spaces or .CMD files, wrap in cmd.exe /c
    // This ensures proper path handling while avoiding shell metacharacter issues
    const fullCmd = `"${cmd}"`;
    return {
      cwd: uiDir,
      stdio: "inherit",
      env: envOverride ?? process.env,
      shell: true,
      windowsVerbatimArguments: false,
    };
  }
  
  // For non-shell commands (pnpm, npm), use direct execution
  return {
    cwd: uiDir,
    stdio: "inherit",
    env: envOverride ?? process.env,
    windowsVerbatimArguments: false,
  };
}

function run(cmd, args) {
  let child;
  
  try {
    // SECURITY FIX: Log command before execution for debugging
    console.log(`[UI Script] Executing: ${cmd} ${args.join(" ")}`);
    
    // SECURITY FIX: For commands with spaces or .CMD files, use cmd.exe /c wrapper
    if (shouldUseShellForCommand(cmd)) {
      child = spawn(
        "cmd", 
        ["/c", `"${cmd}"`, ...args], 
        createSpawnOptions(cmd, args)
      );
    } else {
      child = spawn(cmd, args, createSpawnOptions(cmd, args));
    }
  } catch (err) {
    console.error(`Failed to launch ${cmd}:`, err);
    process.exit(1);
    return;
  }

  child.on("error", (err) => {
    console.error(`Failed to launch ${cmd}:`, err);
    process.exit(1);
  });
  
  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[UI Script] Command exited with code: ${code}`);
      process.exit(code ?? 1);
    }
  });
}

function runSync(cmd, args, envOverride) {
  let result;
  
  try {
    // SECURITY FIX: Log command before execution for debugging
    console.log(`[UI Script] Executing (sync): ${cmd} ${args.join(" ")}`);
    
    // SECURITY FIX: For commands with spaces or .CMD files, use cmd.exe /c wrapper
    if (shouldUseShellForCommand(cmd)) {
      result = spawnSync(
        "cmd", 
        ["/c", `"${cmd}"`, ...args], 
        createSpawnOptions(cmd, args, envOverride)
      );
    } else {
      result = spawnSync(cmd, args, createSpawnOptions(cmd, args, envOverride));
    }
  } catch (err) {
    console.error(`Failed to launch ${cmd}:`, err);
    process.exit(1);
    return;
  }
  
  if (result.signal) {
    console.error(`[UI Script] Command killed by signal: ${result.signal}`);
    process.exit(1);
  }
  
  const status = result.status ?? 1;
  if (status !== 0) {
    console.error(`[UI Script] Command exited with status: ${status}`);
    if (result.stderr && result.stderr.length > 0) {
      process.stderr.write(result.stderr.toString());
    }
    process.exit(status);
  }
}

function depsInstalled(kind) {
  try {
    const require = createRequire(path.join(uiDir, "package.json"));
    require.resolve("vite");
    require.resolve("dompurify");
    if (kind === "test") {
      require.resolve("vitest");
      require.resolve("@vitest/browser-playwright");
      require.resolve("playwright");
    }
    return true;
  } catch {
    return false;
  }
}

function resolveScriptAction(action) {
  if (action === "install") {
    return null;
  }
  if (action === "dev") {
    return "dev";
  }
  if (action === "build") {
    return "build";
  }
  if (action === "test") {
    return "test";
  }
  return null;
}

export function main(argv = process.argv.slice(2)) {
  const [action, ...rest] = argv;
  if (!action) {
    usage();
    process.exit(2);
  }

  const runner = resolveRunner();
  if (!runner) {
    process.stderr.write("Missing UI runner: install pnpm, then retry.\n");
    process.exit(1);
  }

  const script = resolveScriptAction(action);
  if (action !== "install" && !script) {
    usage();
    process.exit(2);
  }

  if (action === "install") {
    run(runner.cmd, ["install", ...rest]);
    return;
  }

  if (!depsInstalled(action === "test" ? "test" : "build")) {
    const installEnv =
      action === "build" ? { ...process.env, NODE_ENV: "production" } : process.env;
    const installArgs = action === "build" ? ["install", "--prod"] : ["install"];
    runSync(runner.cmd, installArgs, installEnv);
  }

  run(runner.cmd, ["run", script, ...rest]);
}

const isDirectExecution = (() => {
  const entry = process.argv[1];
  return Boolean(entry && path.resolve(entry) === fileURLToPath(import.meta.url));
})();

if (isDirectExecution) {
  main();
}
