/**
 * analyze-business.js
 *
 * Business-layer analyzers: Logic classes, TitlesGraph mapping, Composer deps.
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../../lib/php-array-parser.js";

// ---------------------------------------------------------------------------
// Logic クラスメソッド解析: app/Model/Logic/*.php
// ---------------------------------------------------------------------------
export function analyzeLogicClasses(appDir) {
  const logicDir = path.join(appDir, "Model", "Logic");
  if (!fs.existsSync(logicDir)) return [];

  const files = fs.readdirSync(logicDir).filter((f) => f.endsWith(".php"));
  const results = [];

  for (const file of files) {
    const filePath = path.join(logicDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) continue;

    const methods = [];
    const fnRe = /(public|protected|private)\s+function\s+(\w+)\s*\(([^)]*)\)/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      if (fm[2].startsWith("__")) continue;
      methods.push({ name: fm[2], visibility: fm[1], params: fm[3].trim() });
    }

    results.push({
      className: classMatch[1],
      extends: classMatch[2],
      file: "app/Model/Logic/" + file,
      methods,
    });
  }

  results.sort((a, b) => a.className.localeCompare(b.className));
  return results;
}

// ---------------------------------------------------------------------------
// TitlesGraphController アクション→Logic マッピング
// ---------------------------------------------------------------------------
export function analyzeTitlesGraphMapping(appDir) {
  const filePath = path.join(appDir, "Controller", "TitlesGraphController.php");
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);

  const actionRe = /public\s+function\s+(\w+)\s*\(\)/g;
  const results = [];
  let am;

  while ((am = actionRe.exec(src)) !== null) {
    const actionName = am[1];
    if (actionName.startsWith("__") || actionName === "beforeFilter") continue;

    const bodyStart = am.index + am[0].length;
    const nextFn = src.indexOf("public function", bodyStart + 1);
    const body = src.slice(bodyStart, nextFn > 0 ? nextFn : undefined);

    const logicRe = /\$this->(\w+Logic)->/g;
    const logics = new Set();
    let lm;
    while ((lm = logicRe.exec(body)) !== null) {
      logics.add(lm[1]);
    }

    let outputType = "画面表示";
    if (/OutputExcel|Excel/i.test(actionName)) outputType = "Excel";
    else if (/OutputCsv|Csv/i.test(actionName)) outputType = "CSV";
    else if (/ajax/i.test(actionName)) outputType = "JSON";

    results.push({ action: actionName, logicClasses: [...logics], outputType });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Composer 依存パッケージ解析
// ---------------------------------------------------------------------------
export function analyzeComposerDeps(appDir) {
  const rootDir = path.dirname(appDir);
  const filePath = path.join(rootDir, "composer.json");
  if (!fs.existsSync(filePath)) return { require: {}, requireDev: {} };

  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    require: json.require || {},
    requireDev: json["require-dev"] || {},
  };
}
