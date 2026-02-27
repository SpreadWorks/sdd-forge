/**
 * tools/lib/process.js
 *
 * spawnSync ラッパー。
 */

import { spawnSync } from "child_process";

/**
 * コマンドを同期実行し、結果を返す。
 *
 * @param {string}   cmd  - 実行コマンド
 * @param {string[]} args - 引数配列
 * @param {Object}   [opts]
 * @param {string}   [opts.cwd]      - 作業ディレクトリ
 * @param {string}   [opts.encoding] - エンコーディング (default: "utf8")
 * @param {number}   [opts.timeout]  - タイムアウト (ms)
 * @returns {{ ok: boolean, status: number, stdout: string, stderr: string }}
 */
export function runSync(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd,
    encoding: opts.encoding || "utf8",
    timeout: opts.timeout,
  });
  return {
    ok: res.status === 0,
    status: res.status ?? 1,
    stdout: String(res.stdout || ""),
    stderr: String(res.stderr || ""),
  };
}
