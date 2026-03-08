/**
 * sdd-forge/docs/lib/scanner.js
 *
 * 汎用ソースコード解析ユーティリティ。
 * ファイル探索・言語別パーサなど、DataSource の scan() で使われる共通機能を提供する。
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// ファイル探索
// ---------------------------------------------------------------------------

/**
 * glob 風パターンを正規表現に変換する。
 * "*" → 任意文字列。
 */
function patternToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp("^" + escaped + "$");
}

/**
 * dir 配下からパターンに一致するファイルを再帰的に探索する。
 */
export function findFiles(baseDir, pattern, excludeList, subDirs) {
  const regex = patternToRegex(pattern);
  const excludeSet = new Set(excludeList || []);
  const results = [];

  function walk(dir, relPrefix) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && subDirs) {
        walk(path.join(dir, entry.name), path.join(relPrefix, entry.name));
      } else if (entry.isFile()) {
        if (regex.test(entry.name) && !excludeSet.has(entry.name)) {
          results.push({
            absPath: path.join(dir, entry.name),
            relPath: path.join(relPrefix, entry.name),
            fileName: entry.name,
          });
        }
      }
    }
  }

  walk(baseDir, "");
  return results.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

// ---------------------------------------------------------------------------
// 言語別クラス/関数抽出
// ---------------------------------------------------------------------------

/**
 * PHP ファイルからクラス名・親クラス・public メソッド・プロパティを抽出する。
 */
export function parsePHPFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  // クラス定義
  const classMatch = content.match(
    /class\s+(\w+)(?:\s+extends\s+(\w+))?/,
  );
  const className = classMatch ? classMatch[1] : path.basename(filePath, ".php");
  const parentClass = classMatch ? classMatch[2] || "" : "";

  // public メソッド
  const methodRegex = /public\s+function\s+(\w+)\s*\(/g;
  const methods = [];
  let m;
  while ((m = methodRegex.exec(content)) !== null) {
    methods.push(m[1]);
  }

  // プロパティ（$var = 'value' / $var = array(...) 形式）
  const properties = {};
  const propRegex =
    /(?:public|protected|private|var)\s+\$(\w+)\s*=\s*(?:(?:'([^']*)'|"([^"]*)")|array\(([^)]*)\)|\[([^\]]*)\])/g;
  let pm;
  while ((pm = propRegex.exec(content)) !== null) {
    const propName = pm[1];
    const strValue = pm[2] || pm[3];
    const arrayContent = pm[4] || pm[5];

    if (strValue !== undefined) {
      properties[propName] = strValue;
    } else if (arrayContent !== undefined) {
      // 配列からクォートされた文字列を抽出
      const items = [];
      const itemRegex = /['"]([^'"]+)['"]/g;
      let im;
      while ((im = itemRegex.exec(arrayContent)) !== null) {
        items.push(im[1]);
      }
      properties[propName] = items;
    }
  }

  // belongsTo / hasMany / hasOne / hasAndBelongsToMany
  const relations = {};
  for (const relType of ["belongsTo", "hasMany", "hasOne", "hasAndBelongsToMany"]) {
    const relRegex = new RegExp(
      `\\$${relType}\\s*=\\s*(?:array\\(([\\s\\S]*?)\\)|\\[([\\s\\S]*?)\\])`,
    );
    const relMatch = content.match(relRegex);
    if (relMatch) {
      const body = relMatch[1] || relMatch[2] || "";
      const keys = [];
      const keyRegex = /['"](\w+)['"]\s*(?:=>|,|\)|\])/g;
      let km;
      while ((km = keyRegex.exec(body)) !== null) {
        keys.push(km[1]);
      }
      if (keys.length > 0) {
        relations[relType] = keys;
      }
    }
  }

  return { className, parentClass, methods, properties, relations, content };
}

/**
 * JS ファイルからエクスポートされた関数/クラスを抽出する。
 */
export function parseJSFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const className = path.basename(filePath, ".js");

  // export function / export class / export default
  const funcRegex =
    /export\s+(?:async\s+)?(?:function|class)\s+(\w+)/g;
  const methods = [];
  let m;
  while ((m = funcRegex.exec(content)) !== null) {
    methods.push(m[1]);
  }

  // function xxx (非 export)
  const localFuncRegex = /^(?:async\s+)?function\s+(\w+)/gm;
  while ((m = localFuncRegex.exec(content)) !== null) {
    if (!methods.includes(m[1])) {
      methods.push(m[1]);
    }
  }

  return { className, parentClass: "", methods, properties: {}, relations: {}, content };
}

export function parseFile(filePath, lang) {
  if (lang === "php") return parsePHPFile(filePath);
  if (lang === "js") return parseJSFile(filePath);
  // デフォルト: ファイル名のみ
  return {
    className: path.basename(filePath),
    parentClass: "",
    methods: [],
    properties: {},
    relations: {},
    content: "",
  };
}

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

export { camelToSnake, pluralize } from "./php-array-parser.js";

/**
 * scanCfg のエントリがカテゴリ定義かどうかを判定する。
 * カテゴリ定義は dir または file プロパティを持つオブジェクト。
 */
export function isCategoryEntry(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    && (value.dir != null || value.file != null);
}

/**
 * composer.json / package.json から依存関係を抽出する。
 */
export function analyzeExtras(sourceRoot) {
  const extras = {};

  const composerPath = path.join(sourceRoot, "composer.json");
  if (fs.existsSync(composerPath)) {
    try {
      const composer = JSON.parse(fs.readFileSync(composerPath, "utf8"));
      extras.composerDeps = {
        require: composer.require || {},
        requireDev: composer["require-dev"] || {},
      };
    } catch (_) { /* malformed composer.json — non-critical, skip deps */ }
  }

  const pkgPath = path.join(sourceRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      extras.packageDeps = {
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
      };
    } catch (_) { /* malformed package.json — non-critical, skip deps */ }
  }

  return extras;
}
