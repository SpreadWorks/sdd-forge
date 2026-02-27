#!/usr/bin/env node
/**
 * bin/sdd-forge.js
 *
 * sdd-forge のメイン CLI エントリポイント。
 * サブコマンドを対応スクリプトへ振り分ける。
 *
 * Usage:
 *   sdd-forge <subcommand> [options]
 *   sdd-forge help
 */

import { fileURLToPath } from "url";
import path from "path";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** サブコマンド → スクリプト相対パス */
const SCRIPTS = {
  help:          "help.js",
  scan:          "analyzers/scan.js",
  "scan:ctrl":   "analyzers/scan.js",
  "scan:model":  "analyzers/scan.js",
  "scan:shell":  "analyzers/scan.js",
  "scan:route":  "analyzers/scan.js",
  "scan:extra":  "analyzers/scan.js",
  init:          "engine/init.js",
  populate:      "engine/populate.js",
  tfill:         "engine/tfill.js",
  readme:        "engine/readme.js",
  spec:          "spec/spec.js",
  gate:          "spec/gate.js",
  forge:         "forge/forge.js",
  flow:          "flow/flow.js",
};

/** サブコマンドに注入する追加引数 */
const INJECT = {
  "scan:ctrl":   ["--only", "controllers"],
  "scan:model":  ["--only", "models"],
  "scan:shell":  ["--only", "shells"],
  "scan:route":  ["--only", "routes"],
  "scan:extra":  ["--only", "extras"],
};

const [, , subCmd, ...rest] = process.argv;

// scan:all: 全解析 → populate を順に実行
if (subCmd === "scan:all") {
  const scanPath    = path.join(PKG_DIR, "analyzers/scan.js");
  const populatePath = path.join(PKG_DIR, "engine/populate.js");

  process.argv = [process.argv[0], scanPath, ...rest];
  await import(scanPath);

  process.argv = [process.argv[0], populatePath];
  await import(populatePath);
  process.exit(0);
}

// ヘルプ（引数なし / -h / --help）
if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  const helpPath = path.join(PKG_DIR, "help.js");
  process.argv = [process.argv[0], helpPath];
  await import(helpPath);
  process.exit(0);
}

const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge help");
  process.exit(1);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
const inject = INJECT[subCmd] || [];
process.argv = [process.argv[0], scriptPath, ...inject, ...rest];

await import(scriptPath);
