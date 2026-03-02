#!/usr/bin/env node
/**
 * sdd-forge/help.js
 *
 * SDD ツール群のコマンド一覧を表示する。
 */

const commands = [
  { name: "help",        desc: "このヘルプを表示" },
  { sep: "--- project ---" },
  { name: "setup",       desc: "プロジェクト登録 + config.json 生成（対話式）",       usage: "[--name <name>] [--path <path>] [--type <type>]" },
  { name: "default",     desc: "デフォルトプロジェクトを変更（引数なしで一覧表示）",  usage: "[<name>]" },
  { sep: "--- build ---" },
  { name: "build",       desc: "ドキュメント一括生成（scan → init → data → text → readme）",  usage: "[--force] [--agent <name>]" },
  { sep: "--- docs ---" },
  { name: "init",        desc: "テンプレートから docs/ を初期化",                 usage: "[--type <type>] [--force]  (types: webapp, webapp/cakephp2, cli, library)" },
  { name: "forge",       desc: "docs 反復改善（AI エージェント対応）",             usage: '--prompt "内容"' },
  { name: "review",      desc: "docs レビュー（--review-cmd で設定、または npm run sdd:review）" },
  { name: "readme",      desc: "README.md 自動生成" },
  { sep: "--- scan ---" },
  { name: "scan",        desc: "ソースコード解析 → .sdd-forge/output/analysis.json", usage: "[--legacy] [--stdout]" },
  { name: "data",        desc: "@data ディレクティブを解析データで解決" },
  { name: "text",        desc: "@text ディレクティブを AI エージェントで解決", usage: "--agent claude [--id <id>]" },
  { sep: "--- spec ---" },
  { name: "spec",        desc: "spec 初期化（feature ブランチ + spec.md 作成）",  usage: '--title "機能名"' },
  { name: "gate",        desc: "spec ゲート（未解決事項チェック）",                usage: "--spec specs/NNN-xxx/spec.md" },
  { sep: "--- flow ---" },
  { name: "flow",        desc: "SDD フロー自動実行（spec → gate → forge → review）", usage: '--request "要望"' },
];

const maxName = Math.max(...commands.filter((c) => c.name).map((c) => c.name.length));

console.log("");
console.log("  SDD Forge — コマンド一覧");
console.log("  ========================");
console.log("");

for (const cmd of commands) {
  if (cmd.sep) {
    console.log(`  ${cmd.sep}`);
    continue;
  }
  const padded = cmd.name.padEnd(maxName + 2);
  const usage = cmd.usage ? `  sdd-forge ${cmd.name} ${cmd.usage}` : "";
  console.log(`  ${padded}${cmd.desc}`);
  if (usage) {
    console.log(`  ${"".padEnd(maxName + 2)}  ${usage}`);
  }
}

console.log("");
