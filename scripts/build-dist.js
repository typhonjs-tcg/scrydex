#!/usr/bin/env bun
import fs      from 'node:fs';
import path    from 'node:path';
import { $ }   from 'bun';

// Builds binary distributable for current platform.

const APP_NAME = 'scrydex';
const ENTRY = 'src/cli/index.js';
const OUT_DIR = 'dist';

// Resolve paths.
const distDir = path.resolve(OUT_DIR);

// Ensure OUT_DIR exists.
if (!fs.existsSync(distDir))
{
   fs.mkdirSync(distDir, { recursive: true });
}

// Detect OS + arch.
let os = process.platform;  // darwin, linux, win32
let arch = process.arch;    // x64, arm64, ia32, etc.

// Normalize values for output naming.
switch (os)
{
   case 'darwin': os = 'macos'; break;
   case 'win32':  os = 'windows'; break;
}

switch (arch)
{
   case 'x64': arch = 'x64'; break;
   case 'arm64': arch = 'arm64'; break;
   default:
      console.warn(`⚠️ Unknown arch '${arch}', using raw value`);
}

// Temp output name (bun always writes with its own name).
const tempOut = path.resolve(distDir, APP_NAME + (os === 'windows' ? '.exe' : ''));

// Final output name.
const outFile = path.resolve(distDir,`${APP_NAME}-${os}-${arch}${os === 'windows' ? '.exe' : ''}`);

console.log(`🔨 Building ${outFile} ...`);

// Build cmd.
await $`bun build ${ENTRY} --compile --optimize --outfile ${tempOut}`;

// Rename into normalized target filename.
fs.renameSync(tempOut, outFile);

console.log(`✅ Build complete: ${outFile}`);
