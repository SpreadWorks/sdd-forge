/**
 * tools/lib/cli.js
 *
 * repoRoot / parseArgs — 全エントリポイント共通の CLI ユーティリティ。
 */

import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

/**
 * git rev-parse で repo root を取得。失敗時は importMetaUrl ベースで推定する。
 *
 * @param {string} importMetaUrl - 呼び出し元の import.meta.url
 * @returns {string} リポジトリルートの絶対パス
 */
export function repoRoot(importMetaUrl) {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim();
  } catch (_) {
    // npm パッケージとしてインストールされた場合、相対パス推定は
    // node_modules/ 内部を指すため process.cwd() を使用する
    return process.cwd();
  }
}

/**
 * 汎用 CLI パーサー。
 *
 * @param {string[]} argv - process.argv.slice(2)
 * @param {Object}   spec
 * @param {string[]} [spec.flags]    - ブール型フラグ (例: ["--dry-run","--force"])
 * @param {string[]} [spec.options]  - 値付きオプション (例: ["--type","--agent"])
 * @param {Object}   [spec.aliases]  - 短縮名マップ (例: { "-v": "--verbose" })
 * @param {Object}   [spec.defaults] - デフォルト値
 * @returns {Object} パース済みオプション (help は常に含む)
 */
export function parseArgs(argv, spec) {
  const flags = new Set(spec.flags || []);
  const options = new Set(spec.options || []);
  const aliases = spec.aliases || {};
  const opts = { ...spec.defaults, help: false };

  for (let i = 0; i < argv.length; i += 1) {
    let a = argv[i];
    if (a === "--") continue;
    if (a in aliases) a = aliases[a];
    if (a === "-h" || a === "--help") { opts.help = true; continue; }
    if (flags.has(a)) {
      opts[flagKey(a)] = true;
      continue;
    }
    if (options.has(a)) {
      opts[flagKey(a)] = String(argv[i + 1] || "").trim();
      i += 1;
      continue;
    }
    throw new Error(`Unknown option: ${a}`);
  }
  return opts;
}

/** --some-flag → someFlag */
function flagKey(flag) {
  return flag.replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
