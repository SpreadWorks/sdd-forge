#!/usr/bin/env node
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const PRESETS_DIR = join(ROOT, "src", "presets");

function findTestFiles(dirs) {
  const files = [];
  for (const dir of dirs) {
    walk(dir, files);
  }
  return files;
}

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name.endsWith(".test.js")) out.push(full);
  }
}

function getPresetNames() {
  return readdirSync(PRESETS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

function collectPresetTestDirs(scope) {
  const dirs = [];
  for (const name of getPresetNames()) {
    const testDir = join(PRESETS_DIR, name, "tests", scope);
    dirs.push(testDir);
  }
  return dirs;
}

// Parse args
const args = process.argv.slice(2);
const presetIdx = args.indexOf("--preset");
const scopeIdx = args.indexOf("--scope");

let preset = null;
if (presetIdx !== -1) {
  preset = args[presetIdx + 1];
  if (!preset) {
    console.error("Error: --preset requires a value");
    process.exit(1);
  }
  const valid = getPresetNames();
  if (!valid.includes(preset)) {
    console.error(`Error: unknown preset "${preset}". Available: ${valid.join(", ")}`);
    process.exit(1);
  }
}

let scope = null;
if (scopeIdx !== -1) {
  scope = args[scopeIdx + 1];
  if (!scope || !["unit", "e2e"].includes(scope)) {
    console.error("Error: --scope must be 'unit' or 'e2e'");
    process.exit(1);
  }
}

let searchDirs;
if (preset) {
  // --preset: shared tests + preset-specific tests
  searchDirs = [
    join(ROOT, "tests", "unit"),
    join(ROOT, "tests", "e2e"),
    join(PRESETS_DIR, preset, "tests"),
  ];
} else if (scope) {
  // --scope: scoped tests from tests/ + all presets
  searchDirs = [
    join(ROOT, "tests", scope),
    ...collectPresetTestDirs(scope),
  ];
} else {
  // default: all tests
  searchDirs = [
    join(ROOT, "tests", "unit"),
    join(ROOT, "tests", "e2e"),
    join(PRESETS_DIR),
  ];
}

const testFiles = findTestFiles(searchDirs);
if (testFiles.length === 0) {
  console.error("No test files found");
  process.exit(1);
}

try {
  execFileSync("node", ["--test", ...testFiles], {
    stdio: "inherit",
    cwd: ROOT,
  });
} catch (err) {
  process.exit(err.status || 1);
}
