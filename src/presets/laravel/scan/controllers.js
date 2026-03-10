/**
 * Laravel コントローラ解析器。
 * app/Http/Controllers/ 配下の PHP ファイルを解析し、
 * クラス名・アクション・ミドルウェア・DI を抽出する。
 */

import fs from "fs";
import path from "path";
import { findFiles } from "../../../docs/lib/scanner.js";

/**
 * コントローラディレクトリを再帰的に走査し、コントローラ情報を返す。
 *
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {{ controllers: Object[], summary: { total: number, totalActions: number } }}
 */
export function analyzeControllers(sourceRoot) {
  const baseDir = path.join(sourceRoot, "app", "Http", "Controllers");
  if (!fs.existsSync(baseDir)) return { controllers: [], summary: { total: 0, totalActions: 0 } };

  const files = findFiles(baseDir, "*.php", ["Controller.php"], true);
  const controllers = files.map((f) => ({
    ...parseController(f.absPath, f.relPath),
    lines: f.lines, hash: f.hash, mtime: f.mtime,
  }));

  const totalActions = controllers.reduce((s, c) => s + c.actions.length, 0);
  return { controllers, summary: { total: controllers.length, totalActions } };
}

function parseController(filePath, relPath) {
  const content = fs.readFileSync(filePath, "utf8");

  // クラス名
  const classMatch = content.match(/class\s+(\w+)\s+extends\s+(\w+)/);
  const className = classMatch ? classMatch[1] : path.basename(filePath, ".php");
  const parentClass = classMatch ? classMatch[2] : "";

  // public メソッド（アクション）
  const methodRegex = /public\s+function\s+(\w+)\s*\(/g;
  const actions = [];
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    if (m[1] !== "__construct" && !m[1].startsWith("_")) {
      actions.push(m[1]);
    }
  }

  // コンストラクタ DI
  const diDeps = [];
  const ctorMatch = content.match(/public\s+function\s+__construct\s*\(([^)]*)\)/s);
  if (ctorMatch) {
    const depRegex = /(\w+)\s+\$\w+/g;
    let dm;
    while ((dm = depRegex.exec(ctorMatch[1])) !== null) {
      if (dm[1] !== "Request" && dm[1] !== "array" && dm[1] !== "string" && dm[1] !== "int" && dm[1] !== "bool") {
        diDeps.push(dm[1]);
      }
    }
  }

  // middleware() 呼び出し
  const middleware = [];
  const mwRegex = /\$this->middleware\(\s*['"]([^'"]+)['"]/g;
  while ((m = mwRegex.exec(content)) !== null) {
    middleware.push(m[1]);
  }

  return {
    file: path.join("app/Http/Controllers", relPath),
    className,
    parentClass,
    actions,
    diDeps,
    middleware,
  };
}
