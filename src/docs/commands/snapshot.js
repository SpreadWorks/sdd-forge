#!/usr/bin/env node
/**
 * src/docs/commands/snapshot.js
 *
 * スナップショットテスト。deterministic なコマンド出力を保存・比較する。
 * リグレッション検出ツールとして、意図しない変更を検知する。
 *
 * Usage:
 *   sdd-forge snapshot save    — 現在の出力をスナップショットとして保存
 *   sdd-forge snapshot check   — 現在の出力とスナップショットを比較
 *   sdd-forge snapshot update  — スナップショットを現在の出力で更新
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs, sourceRoot } from "../../lib/cli.js";
import { sddDir } from "../../lib/config.js";
import { resolveCommandContext } from "../lib/command-context.js";

const SNAPSHOT_DIR_NAME = "snapshots";

/**
 * スナップショットディレクトリのパスを返す。
 */
function snapshotDir(root) {
  return path.join(sddDir(root), SNAPSHOT_DIR_NAME);
}

/**
 * deterministic なコマンドの現在の出力を収集する。
 * scan の出力（analysis.json 相当）と review の結果を対象とする。
 */
function collectOutputs(root) {
  const outputs = {};

  // scan output (analysis.json)
  const analysisPath = path.join(sddDir(root), "output", "analysis.json");
  if (fs.existsSync(analysisPath)) {
    outputs["analysis.json"] = fs.readFileSync(analysisPath, "utf8");
  }

  // docs/ directory contents (init + data の結果)
  const docsDir = path.join(root, "docs");
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md")).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(docsDir, file), "utf8");
      outputs[`docs/${file}`] = content;
    }
    // サブディレクトリ（言語フォルダ等）
    for (const entry of fs.readdirSync(docsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const subDir = path.join(docsDir, entry.name);
        const subFiles = fs.readdirSync(subDir).filter((f) => f.endsWith(".md")).sort();
        for (const file of subFiles) {
          const content = fs.readFileSync(path.join(subDir, file), "utf8");
          outputs[`docs/${entry.name}/${file}`] = content;
        }
      }
    }
  }

  // README.md
  const readmePath = path.join(root, "README.md");
  if (fs.existsSync(readmePath)) {
    outputs["README.md"] = fs.readFileSync(readmePath, "utf8");
  }

  return outputs;
}

/**
 * スナップショットを保存する。
 */
function saveSnapshots(root, outputs) {
  const dir = snapshotDir(root);
  fs.mkdirSync(dir, { recursive: true });

  const manifestPath = path.join(dir, "manifest.json");
  const manifest = {};

  for (const [key, content] of Object.entries(outputs)) {
    const safeName = key.replace(/\//g, "__");
    const filePath = path.join(dir, safeName);
    fs.writeFileSync(filePath, content);
    manifest[key] = safeName;
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * スナップショットを読み込む。
 */
function loadSnapshots(root) {
  const dir = snapshotDir(root);
  const manifestPath = path.join(dir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const outputs = {};

  for (const [key, safeName] of Object.entries(manifest)) {
    const filePath = path.join(dir, safeName);
    if (fs.existsSync(filePath)) {
      outputs[key] = fs.readFileSync(filePath, "utf8");
    }
  }

  return outputs;
}

/**
 * 現在の出力とスナップショットを比較する。
 *
 * @returns {{ pass: boolean, diffs: Array<{ key: string, type: string }> }}
 */
function compareOutputs(current, saved) {
  const diffs = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(saved)]);

  for (const key of allKeys) {
    if (!(key in saved)) {
      diffs.push({ key, type: "added" });
    } else if (!(key in current)) {
      diffs.push({ key, type: "removed" });
    } else if (current[key] !== saved[key]) {
      diffs.push({ key, type: "changed" });
    }
  }

  return { pass: diffs.length === 0, diffs };
}

/**
 * check の結果を表示する。
 */
function printCheckResult(result) {
  if (result.pass) {
    console.log("snapshot check: PASS (no diff)");
    return;
  }

  console.log(`snapshot check: ${result.diffs.length} diff(s) detected`);
  for (const d of result.diffs) {
    console.log(`  [${d.type}] ${d.key}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const subCmd = args[0];
  const rest = args.slice(1);

  const opts = parseArgs(rest, { flags: [], options: [] });

  if (!subCmd || opts.help) {
    console.log("Usage: sdd-forge snapshot <save|check|update>");
    console.log("");
    console.log("  save    Save current outputs as snapshot");
    console.log("  check   Compare current outputs with saved snapshot");
    console.log("  update  Update snapshot with current outputs");
    return;
  }

  const root = repoRoot();

  if (subCmd === "save") {
    const outputs = collectOutputs(root);
    saveSnapshots(root, outputs);
    console.log(`snapshot save: ${Object.keys(outputs).length} file(s) saved`);
    return;
  }

  if (subCmd === "check") {
    const saved = loadSnapshots(root);
    if (!saved) {
      console.log("snapshot check: no snapshot found. Run 'sdd-forge snapshot save' first.");
      process.exitCode = 1;
      return;
    }
    const current = collectOutputs(root);
    const result = compareOutputs(current, saved);
    printCheckResult(result);
    if (!result.pass) {
      process.exitCode = 1;
    }
    return;
  }

  if (subCmd === "update") {
    const outputs = collectOutputs(root);
    saveSnapshots(root, outputs);
    console.log(`snapshot update: ${Object.keys(outputs).length} file(s) updated`);
    return;
  }

  console.error(`snapshot: unknown subcommand '${subCmd}'`);
  process.exitCode = 1;
}

export { main, collectOutputs, compareOutputs, snapshotDir };

runIfDirect(import.meta.url, main);
