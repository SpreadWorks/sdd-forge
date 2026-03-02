#!/usr/bin/env node
/**
 * sdd-forge/analyzers/generic-scan.js
 *
 * 汎用ソースコード解析器。
 * config.json の scan 設定に基づき、ファイルシステムの構造的事実
 * （ファイル一覧・クラス名・public メソッド名）を抽出する。
 *
 * フレームワーク固有の意味解釈は行わない。
 * analysis.json の出力構造は既存の resolver/renderer と互換。
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// デフォルトスキャン設定（type ごと）
// ---------------------------------------------------------------------------

/**
 * 汎用のスキャンデフォルト設定。
 * FW 固有のデフォルトは fw/*.js の SCAN_DEFAULTS で提供され、
 * scan.js が動的にマージする。
 *
 * 旧 type 名 ("php-mvc", "node-cli") の後方互換もここで維持する。
 */
const SCAN_DEFAULTS = {
  // --- 旧 type 名（後方互換） ---
  "php-mvc": {
    controllers: {
      dir: "app/Controller",
      pattern: "*Controller.php",
      exclude: ["AppController.php"],
      lang: "php",
    },
    models: {
      dir: "app/Model",
      pattern: "*.php",
      exclude: ["AppModel.php"],
      subDirs: true,
      lang: "php",
    },
    shells: {
      dir: "app/Console/Command",
      pattern: "*Shell.php",
      exclude: ["AppShell.php"],
      lang: "php",
    },
    routes: {
      file: "app/Config/routes.php",
      lang: "php",
    },
  },
  "node-cli": {
    modules: {
      dir: "src",
      pattern: "*.js",
      subDirs: true,
      lang: "js",
    },
  },
  // --- 新 type パス ---
  "cli": {
    modules: {
      dir: "src",
      pattern: "*.js",
      subDirs: true,
      lang: "js",
    },
  },
};

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
function findFiles(baseDir, pattern, excludeList, subDirs) {
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
function parsePHPFile(filePath) {
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
function parseJSFile(filePath) {
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

function parseFile(filePath, lang) {
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
// コントローラ解析
// ---------------------------------------------------------------------------

function analyzeControllers(sourceRoot, scanCfg) {
  const cfg = scanCfg.controllers;
  if (!cfg) return null;

  const dir = path.join(sourceRoot, cfg.dir);
  const files = findFiles(dir, cfg.pattern, cfg.exclude, cfg.subDirs);

  const controllers = [];
  for (const f of files) {
    const parsed = parseFile(f.absPath, cfg.lang);
    controllers.push({
      file: path.join(cfg.dir, f.relPath),
      className: parsed.className,
      parentClass: parsed.parentClass,
      components: parsed.properties.components || [],
      uses: parsed.properties.uses || [],
      actions: parsed.methods.filter((m) => !m.startsWith("_")),
    });
  }

  const totalActions = controllers.reduce((s, c) => s + c.actions.length, 0);
  return {
    controllers,
    summary: { total: controllers.length, totalActions },
  };
}

// ---------------------------------------------------------------------------
// モデル解析
// ---------------------------------------------------------------------------

function camelToSnake(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function pluralize(str) {
  if (str.endsWith("y") && !/[aeiou]y$/i.test(str)) {
    return str.slice(0, -1) + "ies";
  }
  if (str.endsWith("s") || str.endsWith("x") || str.endsWith("sh") || str.endsWith("ch")) {
    return str + "es";
  }
  return str + "s";
}

function analyzeModels(sourceRoot, scanCfg) {
  const cfg = scanCfg.models;
  if (!cfg) return null;

  const dir = path.join(sourceRoot, cfg.dir);
  const files = findFiles(dir, cfg.pattern, cfg.exclude, cfg.subDirs !== false);

  const models = [];
  const dbGroups = {};

  for (const f of files) {
    const parsed = parseFile(f.absPath, cfg.lang);
    const isLogic = f.relPath.includes("Logic");
    const isFe = parsed.className.startsWith("Fe");
    const useTable = parsed.properties.useTable || null;
    const useDbConfig = parsed.properties.useDbConfig || null;
    const tableName = useTable || pluralize(camelToSnake(parsed.className));
    const dbKey = useDbConfig || "default";

    if (!dbGroups[dbKey]) dbGroups[dbKey] = [];
    dbGroups[dbKey].push(parsed.className);

    models.push({
      file: path.join(cfg.dir, f.relPath),
      className: parsed.className,
      parentClass: parsed.parentClass,
      isLogic,
      isFe,
      useTable,
      useDbConfig,
      primaryKey: parsed.properties.primaryKey || null,
      displayField: parsed.properties.displayField || null,
      tableName,
      relations: parsed.relations,
      validateFields: parsed.properties.validate
        ? (Array.isArray(parsed.properties.validate) ? parsed.properties.validate : [])
        : [],
      actsAs: parsed.properties.actsAs || [],
    });
  }

  const feModels = models.filter((m) => m.isFe).length;
  const logicModels = models.filter((m) => m.isLogic).length;

  return {
    models,
    summary: { total: models.length, feModels, logicModels, dbGroups },
  };
}

// ---------------------------------------------------------------------------
// シェル/コマンド解析
// ---------------------------------------------------------------------------

function analyzeShells(sourceRoot, scanCfg) {
  const cfg = scanCfg.shells;
  if (!cfg) return null;

  const dir = path.join(sourceRoot, cfg.dir);
  const files = findFiles(dir, cfg.pattern, cfg.exclude, cfg.subDirs);

  const shells = [];
  for (const f of files) {
    const parsed = parseFile(f.absPath, cfg.lang);
    const hasMain = parsed.methods.includes("main");
    shells.push({
      file: path.join(cfg.dir, f.relPath),
      className: parsed.className,
      publicMethods: parsed.methods.filter((m) => !m.startsWith("_")),
      hasMain,
      appUses: [],  // 汎用版では App::uses の CakePHP 固有解析は行わない
    });
  }

  return {
    shells,
    summary: {
      total: shells.length,
      withMain: shells.filter((s) => s.hasMain).length,
    },
  };
}

// ---------------------------------------------------------------------------
// ルート解析
// ---------------------------------------------------------------------------

function analyzeRoutes(sourceRoot, scanCfg) {
  const cfg = scanCfg.routes;
  if (!cfg) return { routes: [], summary: { total: 0, controllers: [] } };

  const filePath = path.join(sourceRoot, cfg.file);
  if (!fs.existsSync(filePath)) {
    return { routes: [], summary: { total: 0, controllers: [] } };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const routes = [];
  const controllersSet = new Set();

  if (cfg.lang === "php") {
    // Router::connect / Route::get 等の汎用パターン
    const routeRegex =
      /(?:Router::connect|Route::(?:get|post|put|delete|any|match))\s*\(\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = routeRegex.exec(content)) !== null) {
      const pattern = m[1];
      // controller/action の抽出を試みる
      const ctrlMatch = content
        .slice(m.index, m.index + 500)
        .match(/['"]controller['"]\s*=>\s*['"](\w+)['"]/);
      const actionMatch = content
        .slice(m.index, m.index + 500)
        .match(/['"]action['"]\s*=>\s*['"](\w+)['"]/);

      const controller = ctrlMatch ? ctrlMatch[1] : "";
      const action = actionMatch ? actionMatch[1] : "";

      if (controller) controllersSet.add(controller);
      routes.push({
        pattern,
        controller,
        action,
        raw: content.slice(m.index, content.indexOf("\n", m.index)).trim(),
      });
    }
  }

  return {
    routes,
    summary: { total: routes.length, controllers: [...controllersSet] },
  };
}

// ---------------------------------------------------------------------------
// extras（汎用版）
// ---------------------------------------------------------------------------

function analyzeExtras(sourceRoot, scanCfg) {
  const extras = {};

  // composer.json があれば依存関係を抽出
  const composerPath = path.join(sourceRoot, "composer.json");
  if (fs.existsSync(composerPath)) {
    try {
      const composer = JSON.parse(fs.readFileSync(composerPath, "utf8"));
      extras.composerDeps = {
        require: composer.require || {},
        requireDev: composer["require-dev"] || {},
      };
    } catch (_) { /* ignore */ }
  }

  // package.json があれば依存関係を抽出
  const pkgPath = path.join(sourceRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      extras.packageDeps = {
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
      };
    } catch (_) { /* ignore */ }
  }

  return extras;
}

// ---------------------------------------------------------------------------
// エクスポート
// ---------------------------------------------------------------------------

/**
 * 汎用スキャンを実行する。
 *
 * @param {string} sourceRoot - ソースコードのルートディレクトリ
 * @param {string} type - プロジェクトタイプ (php-mvc, node-cli, ...)
 * @param {Object} [scanOverrides] - config.json の scan セクション（部分上書き用）
 * @returns {Object} analysis.json 互換のオブジェクト
 */
export function genericScan(sourceRoot, type, scanOverrides) {
  const defaults = SCAN_DEFAULTS[type] || {};
  const scanCfg = { ...defaults, ...scanOverrides };

  const result = { analyzedAt: new Date().toISOString() };

  if (scanCfg.controllers) {
    console.error("[analyze] controllers ...");
    result.controllers = analyzeControllers(sourceRoot, scanCfg);
    if (result.controllers) {
      console.error(
        `[analyze] controllers: ${result.controllers.summary.total} files, ${result.controllers.summary.totalActions} actions`,
      );
    }
  }

  if (scanCfg.models) {
    console.error("[analyze] models ...");
    result.models = analyzeModels(sourceRoot, scanCfg);
    if (result.models) {
      console.error(
        `[analyze] models: ${result.models.summary.total} files (fe=${result.models.summary.feModels}, logic=${result.models.summary.logicModels})`,
      );
    }
  }

  if (scanCfg.shells) {
    console.error("[analyze] shells ...");
    result.shells = analyzeShells(sourceRoot, scanCfg);
    if (result.shells) {
      console.error(`[analyze] shells: ${result.shells.summary.total} files`);
    }
  }

  if (scanCfg.routes) {
    console.error("[analyze] routes ...");
    result.routes = analyzeRoutes(sourceRoot, scanCfg);
    console.error(`[analyze] routes: ${result.routes.summary.total} routes`);
  }

  console.error("[analyze] extras ...");
  result.extras = analyzeExtras(sourceRoot, scanCfg);
  const extrasKeys = Object.keys(result.extras);
  if (extrasKeys.length > 0) {
    console.error(`[analyze] extras: ${extrasKeys.length} categories (${extrasKeys.join(", ")})`);
  }

  return result;
}
