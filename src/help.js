#!/usr/bin/env node
/**
 * sdd-forge/help.js
 *
 * SDD ツール群のコマンド一覧を表示する。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const commands = [
  { name: "help",        desc: "このヘルプを表示" },
  { section: "Project" },
  { name: "setup",       desc: "プロジェクト登録 + 設定生成（対話式）" },
  { name: "upgrade",     desc: "テンプレート由来ファイルを最新版に更新" },
  { name: "default",     desc: "デフォルトプロジェクトを変更" },
  { section: "Build" },
  { name: "build",       desc: "ドキュメント一括生成（scan → init → data → text → readme）" },
  { section: "Docs" },
  { name: "init",        desc: "テンプレートから docs/ を初期化" },
  { name: "forge",       desc: "docs 反復改善（AI エージェント対応）" },
  { name: "review",      desc: "docs 品質チェック" },
  { name: "changelog",   desc: "specs/ から change_log.md を生成" },
  { name: "agents",      desc: "AGENTS.md の PROJECT セクションを更新" },
  { name: "readme",      desc: "README.md 自動生成" },
  { section: "Scan" },
  { name: "scan",        desc: "ソースコード解析 → analysis.json" },
  { name: "data",        desc: "@data ディレクティブを解析データで解決" },
  { name: "text",        desc: "@text ディレクティブを AI で解決" },
  { section: "Spec" },
  { name: "spec",        desc: "spec 初期化（feature ブランチ + spec.md）" },
  { name: "gate",        desc: "spec ゲート（未解決事項チェック）" },
  { section: "Flow" },
  { name: "flow",        desc: "SDD フロー自動実行" },
  { section: "Info" },
  { name: "presets list", desc: "プリセット継承ツリーを表示" },
];

function getVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PKG_DIR, "..", "package.json"), "utf8"));
    return pkg.version;
  } catch (_) {
    return "?";
  }
}

function main() {
  const version = getVersion();
  const maxName = Math.max(...commands.filter((c) => c.name).map((c) => c.name.length));

  console.log("");
  console.log(`  \x1b[1mSDD Forge\x1b[0m v${version} — コマンド一覧`);
  console.log("");
  console.log("  Usage: sdd-forge <command> [options]");
  console.log("");

  for (const cmd of commands) {
    if (cmd.section) {
      console.log("");
      console.log(`  \x1b[2m${cmd.section}\x1b[0m`);
      continue;
    }
    const padded = cmd.name.padEnd(maxName + 2);
    console.log(`    ${padded}\x1b[2m${cmd.desc}\x1b[0m`);
  }

  console.log("");
  console.log("  Run \x1b[1msdd-forge <command> --help\x1b[0m for details.");
  console.log("");
}

export { main, commands };

const isDirectRun = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}
