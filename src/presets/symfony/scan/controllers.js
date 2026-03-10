/**
 * Symfony コントローラ解析器。
 * src/Controller/ 配下の PHP ファイルを解析し、
 * クラス名・アクション・Route attribute・DI 依存を抽出する。
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
  const baseDir = path.join(sourceRoot, "src", "Controller");
  if (!fs.existsSync(baseDir)) return { controllers: [], summary: { total: 0, totalActions: 0 } };

  const files = findFiles(baseDir, "*.php", [".gitkeep"], true);
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
  const classMatch = content.match(/class\s+(\w+)\s+(?:extends\s+(\w+))?/);
  const className = classMatch ? classMatch[1] : path.basename(filePath, ".php");
  const parentClass = classMatch && classMatch[2] ? classMatch[2] : "";

  // クラスレベル #[Route] attribute
  const classRouteMatch = content.match(/#\[Route\s*\(\s*['"]([^'"]*)['"]/);
  const classRoutePrefix = classRouteMatch ? classRouteMatch[1] : "";

  // public メソッド（アクション）と #[Route] attributes
  const actions = [];
  // メソッド定義の前に #[Route(...)] がある場合を検出
  const methodBlockRegex = /((?:\s*#\[(?:[^\[\]]*(?:\[[^\[\]]*\])?)*\]\s*)*)\s*public\s+function\s+(\w+)\s*\(/g;
  let m;
  while ((m = methodBlockRegex.exec(content)) !== null) {
    const methodName = m[2];
    if (methodName === "__construct" || methodName.startsWith("_")) continue;

    const attrBlock = m[1] || "";
    const routes = [];

    // #[Route('/path', name: 'name', methods: ['GET'])]
    const routeAttrRegex = /#\[Route\s*\(\s*['"]([^'"]*)['"]\s*(?:,\s*(?:name:\s*['"]([^'"]*)['"]\s*)?(?:,?\s*methods:\s*\[([^\]]*)\])?)?\s*\)/g;
    let rm;
    while ((rm = routeAttrRegex.exec(attrBlock)) !== null) {
      const routePath = rm[1];
      const routeName = rm[2] || "";
      const methods = rm[3]
        ? rm[3].match(/['"](\w+)['"]/g)?.map((s) => s.replace(/['"]/g, "")) || ["GET"]
        : ["GET"];
      routes.push({
        path: classRoutePrefix + routePath,
        name: routeName,
        methods,
      });
    }

    actions.push({ name: methodName, routes });
  }

  // コンストラクタ DI
  const diDeps = [];
  const ctorMatch = content.match(/public\s+function\s+__construct\s*\(([^)]*)\)/s);
  if (ctorMatch) {
    const depRegex = /(?:private|protected|public)?\s*(?:readonly\s+)?(\w+)\s+\$\w+/g;
    let dm;
    while ((dm = depRegex.exec(ctorMatch[1])) !== null) {
      const typeName = dm[1];
      if (!["Request", "array", "string", "int", "bool", "float"].includes(typeName)) {
        diDeps.push(typeName);
      }
    }
  }

  return {
    file: path.join("src/Controller", relPath),
    className,
    parentClass,
    actions,
    diDeps,
    classRoutePrefix,
  };
}
