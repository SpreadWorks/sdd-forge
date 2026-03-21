#!/usr/bin/env node
/**
 * tests/acceptance/run.js
 *
 * Acceptance test runner. Discovers and runs preset-specific test files.
 *
 * Usage:
 *   node tests/acceptance/run.js           — run all presets
 *   node tests/acceptance/run.js symfony    — run only symfony
 */

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALL_PRESETS = [
  "laravel", "symfony", "cakephp2",
  "node-cli", "library",
  "php", "node",
  "webapp", "cli", "base",
];

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node tests/acceptance/run.js [preset ...]

Run acceptance tests for sdd-forge presets.

Arguments:
  preset    One or more preset names to test (default: all)

Available presets:
  ${ALL_PRESETS.join(", ")}

Examples:
  node tests/acceptance/run.js              Run all presets
  node tests/acceptance/run.js symfony      Run only symfony
  node tests/acceptance/run.js node laravel Run node and laravel`);
  process.exit(0);
}

const requested = args.filter((a) => !a.startsWith("-"));
const presets = requested.length > 0 ? requested : ALL_PRESETS;

// Validate requested presets
for (const p of presets) {
  if (!ALL_PRESETS.includes(p)) {
    console.error(`Unknown preset: ${p}`);
    console.error(`Available: ${ALL_PRESETS.join(", ")}`);
    process.exit(1);
  }
}

// Collect test files
const testFiles = [];
for (const preset of presets) {
  const file = path.join(__dirname, `${preset}.test.js`);
  if (!fs.existsSync(file)) {
    console.error(`Test file not found: ${file}`);
    process.exit(1);
  }
  testFiles.push(file);
}

console.log(`Running acceptance tests for: ${presets.join(", ")}`);

try {
  execFileSync("node", ["--test", ...testFiles], {
    stdio: "inherit",
    env: process.env,
  });
} catch (err) {
  process.exit(err.status || 1);
}
