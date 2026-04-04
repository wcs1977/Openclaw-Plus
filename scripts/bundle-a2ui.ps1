# bundle-a2ui.ps1 - Windows compatible version of bundle-a2ui.sh
set-strictmode -version latest
$ErrorActionPreference = "Stop"

function OnError {
    param()
    Write-Host "A2UI bundling failed. Re-run with: pnpm canvas:a2ui:bundle" -ForegroundColor Red
    Write-Host "If this persists, verify pnpm deps and try again." -ForegroundColor Red
}

trap { OnError; exit 1 }

$ROOT_DIR = (Get-Location).Path
$HASH_FILE = Join-Path $ROOT_DIR "src\canvas-host\a2ui\.bundle.hash"
$OUTPUT_FILE = Join-Path $ROOT_DIR "src\canvas-host\a2ui\a2ui.bundle.js"
$A2UI_RENDERER_DIR = Join-Path $ROOT_DIR "vendor\a2ui\renderers\lit"
$A2UI_APP_DIR = Join-Path $ROOT_DIR "apps\shared\OpenClawKit\Tools\CanvasA2UI"

# Check if sources exist
if (-not (Test-Path $A2UI_RENDERER_DIR) -or -not (Test-Path $A2UI_APP_DIR)) {
    if (Test-Path $OUTPUT_FILE) {
        Write-Host "A2UI sources missing; keeping prebuilt bundle."
        exit 0
    }
    Write-Host "A2UI sources missing and no prebuilt bundle found at: $OUTPUT_FILE" -ForegroundColor Red
    exit 1
}

$INPUT_PATHS = @(
    Join-Path $ROOT_DIR "package.json",
    Join-Path $ROOT_DIR "pnpm-lock.yaml",
    $A2UI_RENDERER_DIR,
    $A2UI_APP_DIR
)

function ComputeHash {
    param($RootDir, $Inputs)
    
    $nodeScript = @'
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.env.ROOT_DIR ?? process.cwd();
const inputs = process.argv.slice(1);
const files = [];

async function walk(entryPath) {
  const st = await fs.stat(entryPath);
  if (st.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walk(path.join(entryPath, entry));
    }
    return;
  }
  files.push(entryPath);
}

for (const input of inputs) {
  await walk(input);
}

function normalize(p) {
  return p.split(path.sep).join("/");
}

files.sort((a, b) => normalize(a).localeCompare(normalize(b)));

const hash = createHash("sha256");
for (const filePath of files) {
  const rel = normalize(path.relative(rootDir, filePath));
  hash.update(rel);
  hash.update("\0");
  hash.update(await fs.readFile(filePath));
  hash.update("\0");
}

process.stdout.write(hash.digest("hex"));
'@

    $env:ROOT_DIR = $RootDir
    $argsList = $Inputs -join " "
    
    $hash = node --input-type=module --eval $nodeScript $Inputs
    return $hash
}

$current_hash = ComputeHash $ROOT_DIR $INPUT_PATHS

if (Test-Path $HASH_FILE) {
    $previous_hash = Get-Content $HASH_FILE -Raw
    if ($previous_hash -eq $current_hash -and (Test-Path $OUTPUT_FILE)) {
        Write-Host "A2UI bundle up to date; skipping."
        exit 0
    }
}

# Compile TypeScript renderer
Write-Host "Compiling A2UI renderer..." -ForegroundColor Cyan
$tscConfig = "$A2UI_RENDERER_DIR\tsconfig.json"
if (-not (Test-Path $tscConfig)) {
    Write-Host "ERROR: TypeScript config not found at: $tscConfig" -ForegroundColor Red
    exit 1
}

Write-Host "TypeScript config path: $tscConfig" -ForegroundColor Yellow
$tscOutput = pnpm -s exec tsc -p "$tscConfig" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript compilation failed:" -ForegroundColor Red
    Write-Host $tscOutput -ForegroundColor Yellow
    throw "TypeScript build failed"
}

# Run rolldown (try multiple locations)
$rolldownConfig = Join-Path $A2UI_APP_DIR "rolldown.config.mjs"

Write-Host "Rolldown config path: $rolldownConfig" -ForegroundColor Yellow
if (-not (Test-Path $rolldownConfig)) {
    Write-Host "ERROR: Rolldown config not found at: $rolldownConfig" -ForegroundColor Red
    exit 1
}

$rolldownOutput = ""
try {
    if (Get-Command rolldown -ErrorAction SilentlyContinue) {
        Write-Host "Using system rolldown..." -ForegroundColor Yellow
        $rolldownOutput = & rolldown -c $rolldownConfig 2>&1
    } elseif (Test-Path "$ROOT_DIR\node_modules\.pnpm\node_modules\rolldown\bin\cli.mjs") {
        Write-Host "Using local rolldown from node_modules/.pnpm/node_modules/rolldown..." -ForegroundColor Yellow
        $rolldownOutput = node "$ROOT_DIR\node_modules\.pnpm\node_modules\rolldown\bin\cli.mjs" -c $rolldownConfig 2>&1
    } elseif (Test-Path "$ROOT_DIR\node_modules\.pnpm\rolldown@1.0.0-rc.9\node_modules\rolldown\bin\cli.mjs") {
        Write-Host "Using local rolldown from node_modules/.pnpm/rolldown@1.0.0-rc.9..." -ForegroundColor Yellow
        $rolldownOutput = node "$ROOT_DIR\node_modules\.pnpm\rolldown@1.0.0-rc.9\node_modules\rolldown\bin\cli.mjs" -c $rolldownConfig 2>&1
    } elseif (Test-Path "$ROOT_DIR\node_modules\.pnpm\rolldown@1.0.0-rc.12\node_modules\rolldown\bin\cli.mjs") {
        Write-Host "Using local rolldown from node_modules/.pnpm/rolldown@1.0.0-rc.12..." -ForegroundColor Yellow
        $rolldownOutput = node "$ROOT_DIR\node_modules\.pnpm\rolldown@1.0.0-rc.12\node_modules\rolldown\bin\cli.mjs" -c $rolldownConfig 2>&1
    } else {
        Write-Host "Using pnpm dlx for rolldown..." -ForegroundColor Yellow
        $rolldownOutput = pnpm -s dlx rolldown -c $rolldownConfig 2>&1
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Rolldown failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Output:" -ForegroundColor Yellow
        Write-Host $rolldownOutput -ForegroundColor Yellow
        throw "Rolldown build failed"
    }
} catch {
    Write-Host "Rolldown exception: $_" -ForegroundColor Red
    if ($rolldownOutput) {
        Write-Host "Output:" -ForegroundColor Yellow
        Write-Host $rolldownOutput -ForegroundColor Yellow
    }
    throw
}

# Save hash
$current_hash | Out-File -FilePath $HASH_FILE -Encoding utf8

Write-Host "A2UI bundle completed successfully!" -ForegroundColor Green
