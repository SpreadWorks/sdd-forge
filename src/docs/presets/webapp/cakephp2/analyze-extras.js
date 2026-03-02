#!/usr/bin/env node
/**
 * tools/analyzers/analyze-extras.js
 *
 * 既存 4 解析器（controllers, models, shells, routes）で未カバーの領域を一括解析する。
 * - const.php 設定定数
 * - bootstrap.php 初期化処理
 * - AppController 共通処理
 * - AppModel 共通処理
 * - View ヘルパー
 * - 共通ライブラリ (Lib/)
 * - ビヘイビア
 * - SQL テンプレート
 * - レイアウト・エレメント
 * - フロントエンドアセット (JS/CSS)
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../lib/php-array-parser.js";

// ---------------------------------------------------------------------------
// 定数解析: app/Config/const.php
// ---------------------------------------------------------------------------
function analyzeConstants(appDir) {
  const filePath = path.join(appDir, "Config", "const.php");
  if (!fs.existsSync(filePath)) return { scalars: [], selectOptions: [] };

  const raw = fs.readFileSync(filePath, "utf8");
  const scalars = [];
  const selectOptions = [];

  // 全 $config 行を走査し、array(...) を含むかで分岐
  const allRe = /\$config\s*\[?\s*["']([^"']+)["']\s*\]?\s*=\s*/g;
  let m;
  while ((m = allRe.exec(raw)) !== null) {
    const name = m[1];
    const rest = raw.slice(m.index + m[0].length);

    if (/^\s*array\s*\(/.test(rest)) {
      // 配列定数 → 括弧バランスで中身を抽出
      const openIdx = rest.indexOf("(");
      let depth = 1;
      let i = openIdx + 1;
      while (i < rest.length && depth > 0) {
        if (rest[i] === "(") depth++;
        else if (rest[i] === ")") depth--;
        i++;
      }
      if (depth === 0) {
        const body = rest.slice(openIdx + 1, i - 1);
        const options = [];
        const optRe = /["']([^"']+)["']\s*=>\s*["']([^"']+)["']/g;
        let om;
        while ((om = optRe.exec(body)) !== null) {
          options.push({ key: om[1], label: om[2] });
        }
        selectOptions.push({ name, options });
      }
    } else {
      // スカラー定数
      const valMatch = rest.match(/^(.+?)\s*;/);
      if (valMatch) {
        let value = valMatch[1].trim();
        value = value.replace(/^["']|["']$/g, "");
        scalars.push({ name, value });
      }
    }
  }

  return { scalars, selectOptions };
}

// ---------------------------------------------------------------------------
// Bootstrap 解析: app/Config/bootstrap.php
// ---------------------------------------------------------------------------
function analyzeBootstrap(appDir) {
  const filePath = path.join(appDir, "Config", "bootstrap.php");
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);
  // 行コメントも除去（コメント内の CakePlugin::load 等を誤検出しないため）
  const active = src.replace(/(?:^|\n)\s*(?:\/\/|#).*$/gm, "");
  const result = {
    siteTitle: "",
    environments: [],
    plugins: [],
    logChannels: [],
    classPaths: [],
    configureWrites: [],
  };

  // サイトタイトル
  const titleMatch = active.match(/Configure::write\s*\(\s*['"]SITE_TITLE['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
  if (titleMatch) result.siteTitle = titleMatch[1];

  // 環境判定
  const envRe = /CAKE_ENV['"]\s*,\s*['"](\w+)['"]/g;
  const envSet = new Set();
  let em;
  while ((em = envRe.exec(active)) !== null) {
    envSet.add(em[1]);
  }
  result.environments = [...envSet].sort();

  // プラグイン
  const pluginRe = /CakePlugin::load\s*\(\s*['"](\w+)['"]/g;
  while ((em = pluginRe.exec(active)) !== null) {
    result.plugins.push(em[1]);
  }

  // ログチャネル
  const logRe = /CakeLog::config\s*\(\s*['"]([^'"]+)['"]/g;
  while ((em = logRe.exec(active)) !== null) {
    result.logChannels.push(em[1]);
  }

  // App::build クラスパス
  const buildRe = /['"](\w+)['"]\s*=>\s*array\s*\(\s*APP\s*\.\s*['"]([^'"]+)['"]/g;
  while ((em = buildRe.exec(active)) !== null) {
    result.classPaths.push({ type: em[1], path: em[2] });
  }

  // Configure::write 一覧
  const cwRe = /Configure\s*::\s*write\s*\(\s*['"]([^'"]+)["']\s*,\s*(.+?)\s*\)/g;
  while ((em = cwRe.exec(active)) !== null) {
    const key = em[1];
    let value = em[2].trim();
    // 配列値は省略表現にする
    if (value.startsWith("array")) {
      value = "array(...)";
    }
    // クォートを除去
    value = value.replace(/^["']|["']$/g, "");
    result.configureWrites.push({ key, value });
  }

  return result;
}

// ---------------------------------------------------------------------------
// AppController 解析
// ---------------------------------------------------------------------------
function analyzeAppController(appDir) {
  const filePath = path.join(appDir, "Controller", "AppController.php");
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);

  const result = {
    components: [],
    helpers: [],
    authConfig: {},
    methods: [],
  };

  // components 配列から Session, Auth, Acl をトップレベルのみ抽出
  // 括弧バランスで第一階層だけ読み取る
  const compSection = src.match(/\$components\s*=\s*array\s*\(/);
  if (compSection) {
    const startIdx = compSection.index + compSection[0].length;
    let depth = 1;
    let i = startIdx;
    while (i < src.length && depth > 0) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")") depth--;
      i++;
    }
    const compBody = src.slice(startIdx, i - 1);

    // トップレベルの要素を分割（depth=0 のカンマで区切る）
    let d = 0;
    let last = 0;
    const segments = [];
    for (let j = 0; j < compBody.length; j++) {
      if (compBody[j] === "(" || compBody[j] === "[") d++;
      else if (compBody[j] === ")" || compBody[j] === "]") d--;
      else if (compBody[j] === "," && d === 0) {
        segments.push(compBody.slice(last, j).trim());
        last = j + 1;
      }
    }
    segments.push(compBody.slice(last).trim());

    for (const seg of segments) {
      if (!seg) continue;
      // 'Session' or 'Auth' => array(...) or 'Acl'
      const nameMatch = seg.match(/^['"](\w+)['"]/);
      if (nameMatch) {
        result.components.push(nameMatch[1]);
      }
    }
  }

  // helpers
  const helperMatch = src.match(/\$helpers\s*=\s*array\s*\(([^)]+)\)/);
  if (helperMatch) {
    const body = helperMatch[1];
    // 'Html' => array('className' => 'MyHtml') パターン
    const helperRe = /['"](\w+)['"]\s*=>\s*array\s*\(\s*['"]className['"]\s*=>\s*['"](\w+)['"]/g;
    let hm;
    while ((hm = helperRe.exec(body)) !== null) {
      result.helpers.push({ name: hm[1], className: hm[2] });
    }
  }

  // Auth 設定を抽出
  const authSection = src.match(/'Auth'\s*=>\s*array\s*\(([\s\S]*?)\),\s*'Acl'/);
  if (authSection) {
    const authBody = authSection[1];
    // authorize
    const authorizeMatch = authBody.match(/['"]authorize['"]\s*=>\s*array\s*\(\s*['"](\w+)['"]/);
    if (authorizeMatch) result.authConfig.authorize = authorizeMatch[1];
    // authenticate
    const authMatch = authBody.match(/['"]authenticate['"]\s*=>\s*array\s*\(\s*['"](\w+)['"]/);
    if (authMatch) result.authConfig.authenticate = authMatch[1];
    // userModel
    const userModelMatch = authBody.match(/['"]userModel['"]\s*=>\s*['"](\w+)['"]/);
    if (userModelMatch) result.authConfig.userModel = userModelMatch[1];
    // username field
    const fieldMatch = authBody.match(/['"]username['"]\s*=>\s*['"](\w+)['"]/);
    if (fieldMatch) result.authConfig.loginField = fieldMatch[1];
    // loginRedirect
    const loginRedirMatch = authBody.match(/['"]loginRedirect['"]\s*=>\s*array\s*\(\s*['"]controller['"]\s*=>\s*['"](\w+)['"]/);
    if (loginRedirMatch) result.authConfig.loginRedirect = loginRedirMatch[1] + "/index";
    // logoutRedirect
    const logoutRedirMatch = authBody.match(/['"]logoutRedirect['"]\s*=>\s*array\s*\(\s*['"]controller['"]\s*=>\s*['"](\w+)['"][^)]*['"]action['"]\s*=>\s*['"](\w+)['"]/);
    if (logoutRedirMatch) result.authConfig.logoutRedirect = logoutRedirMatch[1] + "/" + logoutRedirMatch[2];
  }

  // メソッド一覧
  const fnRe = /(public|protected|private)\s+function\s+(\w+)\s*\(/g;
  let fm;
  while ((fm = fnRe.exec(src)) !== null) {
    result.methods.push({ name: fm[2], visibility: fm[1] });
  }

  return result;
}

// ---------------------------------------------------------------------------
// AppModel 解析
// ---------------------------------------------------------------------------
function analyzeAppModel(appDir) {
  const filePath = path.join(appDir, "Model", "AppModel.php");
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);

  const result = {
    behaviors: [],
    callbacks: [],
    auditFields: [],
    methods: [],
  };

  // actsAs
  const actsAsMatch = src.match(/\$actsAs\s*=\s*array\s*\(\s*["'](\w+)["']/);
  if (actsAsMatch) result.behaviors.push(actsAsMatch[1]);

  // コールバック
  if (/function\s+beforeSave\s*\(/.test(src)) result.callbacks.push("beforeSave");
  if (/function\s+afterSave\s*\(/.test(src)) result.callbacks.push("afterSave");

  // 監査フィールド
  const auditFields = ["created_by", "created_ts", "updated_by", "updated_ts"];
  for (const field of auditFields) {
    if (src.includes(`'${field}'`)) result.auditFields.push(field);
  }

  // メソッド一覧
  const fnRe = /(public\s+)?function\s+(\w+)\s*\(/g;
  let fm;
  const methodDescs = {
    picureWithSize: "画像横幅バリデーション（パイプ区切り）",
    beforeSave: "自動タイムスタンプ・監査フィールド設定",
    afterSave: "進捗管理更新・FEデータ削除フラグ処理",
    invalidDate: "日付バリデーション",
    sqldump: "SQL デバッグダンプ",
    sql: "SQL テンプレートファイル読み込み・実行",
    escapeQuote: "シングルクォートエスケープ",
    replaseParam: "SQL パラメータ置換",
    updateProcessUpdate: "コンテンツ・タイトル最終更新日時の更新",
    saveAllAtOnce: "500件単位バッチ INSERT",
    bulkInsert: "INSERT ON DUPLICATE KEY UPDATE",
  };

  while ((fm = fnRe.exec(src)) !== null) {
    const name = fm[2];
    if (name === "__construct") continue;
    result.methods.push({
      name,
      description: methodDescs[name] || name,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// ヘルパー解析: app/View/Helper/*.php
// ---------------------------------------------------------------------------
function analyzeHelpers(appDir) {
  const helperDir = path.join(appDir, "View", "Helper");
  if (!fs.existsSync(helperDir)) return [];

  const files = fs.readdirSync(helperDir).filter((f) => f.endsWith(".php"));
  const helpers = [];

  for (const file of files) {
    const filePath = path.join(helperDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) continue;

    const className = classMatch[1];
    const extendsClass = classMatch[2];

    // 公開メソッド
    const methods = [];
    const fnRe = /(?:public\s+)?function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      const name = fm[1];
      if (!name.startsWith("__")) methods.push(name);
    }

    // 依存ヘルパー
    const depHelpers = [];
    const depMatch = src.match(/\$helpers\s*=\s*array\s*\(([^)]+)\)/);
    if (depMatch) {
      const depRe = /['"](\w+)['"]/g;
      let dm;
      while ((dm = depRe.exec(depMatch[1])) !== null) {
        depHelpers.push(dm[1]);
      }
    }

    helpers.push({
      className,
      extends: extendsClass,
      file: "app/View/Helper/" + file,
      methods,
      dependsOn: depHelpers,
    });
  }

  return helpers;
}

// ---------------------------------------------------------------------------
// ライブラリ解析: app/Lib/*.php
// ---------------------------------------------------------------------------
function analyzeLibraries(appDir) {
  const libDir = path.join(appDir, "Lib");
  if (!fs.existsSync(libDir)) return [];

  const files = fs.readdirSync(libDir).filter((f) => f.endsWith(".php"));
  const libraries = [];

  for (const file of files) {
    const filePath = path.join(libDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)/);
    if (!classMatch) continue;

    const className = classMatch[1];

    // static メソッド
    const staticMethods = [];
    const fnRe = /(?:public\s+)?static\s+function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      staticMethods.push(fm[1]);
    }

    // 通常メソッド
    const methods = [];
    const nfnRe = /(?:public\s+)?function\s+(\w+)\s*\(/g;
    while ((fm = nfnRe.exec(src)) !== null) {
      if (!fm[0].includes("static")) methods.push(fm[1]);
    }

    // メール送信有無
    const hasMail = /CakeEmail/.test(raw);

    libraries.push({
      className,
      file: "app/Lib/" + file,
      staticMethods,
      methods,
      hasMail,
    });
  }

  return libraries;
}

// ---------------------------------------------------------------------------
// ビヘイビア解析: app/Model/Behavior/*.php
// ---------------------------------------------------------------------------
function analyzeBehaviors(appDir) {
  const behaviorDir = path.join(appDir, "Model", "Behavior");
  if (!fs.existsSync(behaviorDir)) return [];

  const files = fs.readdirSync(behaviorDir).filter((f) => f.endsWith(".php"));
  const behaviors = [];

  for (const file of files) {
    const filePath = path.join(behaviorDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) continue;

    const className = classMatch[1];

    const methods = [];
    const fnRe = /(?:public\s+)?function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      const name = fm[1];
      if (!name.startsWith("__") && name !== "setup") methods.push(name);
    }

    behaviors.push({
      className,
      file: "app/Model/Behavior/" + file,
      methods,
    });
  }

  return behaviors;
}

// ---------------------------------------------------------------------------
// SQL テンプレート解析: app/Model/Sql/*.sql
// ---------------------------------------------------------------------------
function analyzeSqlFiles(appDir) {
  const sqlDir = path.join(appDir, "Model", "Sql");
  if (!fs.existsSync(sqlDir)) return [];

  const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith(".sql"));
  const sqlFiles = [];

  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").length;

    // パラメータプレースホルダー: /*param_name*/ パターン
    const params = new Set();
    const paramRe = /\/\*(\w+)\*\//g;
    let pm;
    while ((pm = paramRe.exec(content)) !== null) {
      params.add(pm[1]);
    }

    // 参照テーブル: FROM / JOIN 句
    const tables = new Set();
    const tableRe = /(?:FROM|JOIN)\s+(\w+)/gi;
    let tm;
    while ((tm = tableRe.exec(content)) !== null) {
      const tbl = tm[1].toLowerCase();
      if (tbl !== "select" && tbl !== "where" && tbl !== "set") {
        tables.add(tbl);
      }
    }

    sqlFiles.push({
      file,
      lines,
      params: [...params],
      tables: [...tables].sort(),
    });
  }

  sqlFiles.sort((a, b) => a.file.localeCompare(b.file));
  return sqlFiles;
}

// ---------------------------------------------------------------------------
// レイアウト・エレメント解析
// ---------------------------------------------------------------------------
function analyzeLayouts(appDir) {
  const layoutDir = path.join(appDir, "View", "Layouts");
  if (!fs.existsSync(layoutDir)) return [];

  const layouts = [];
  function walk(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), prefix ? prefix + "/" + entry.name : entry.name);
      } else if (entry.name.endsWith(".ctp")) {
        layouts.push(prefix ? prefix + "/" + entry.name : entry.name);
      }
    }
  }
  walk(layoutDir, "");
  return layouts.sort();
}

function analyzeElements(appDir) {
  const elemDir = path.join(appDir, "View", "Elements");
  if (!fs.existsSync(elemDir)) return [];

  return fs
    .readdirSync(elemDir)
    .filter((f) => f.endsWith(".ctp"))
    .sort();
}

// ---------------------------------------------------------------------------
// フロントエンドアセット解析
// ---------------------------------------------------------------------------
const JS_LIBRARY_PATTERNS = [
  { pattern: /jquery-(\d+\.\d+\.\d+)/i, library: "jQuery" },
  { pattern: /jquery[-.]ui/i, library: "jQuery UI" },
  { pattern: /jquery[-.]cookie/i, library: "jQuery Cookie" },
  { pattern: /jquery[-.]datePicker/i, library: "jQuery DatePicker" },
  { pattern: /jquery[-.]datetimePicker/i, library: "jQuery DateTimePicker" },
  { pattern: /jquery[-.]fancybox/i, library: "FancyBox" },
  { pattern: /jquery[-.]tablefix/i, library: "jQuery TableFix" },
  { pattern: /highcharts/i, library: "Highcharts" },
];

function analyzeAssets(appDir) {
  const jsDir = path.join(appDir, "webroot", "js");
  const cssDir = path.join(appDir, "webroot", "css");
  const result = { js: [], css: [] };

  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"));
    for (const file of jsFiles) {
      const filePath = path.join(jsDir, file);
      const stat = fs.statSync(filePath);
      const entry = { file, size: stat.size };

      // ライブラリ検出
      for (const { pattern, library } of JS_LIBRARY_PATTERNS) {
        const m = file.match(pattern);
        if (m) {
          entry.library = library;
          if (m[1]) entry.version = m[1];
          break;
        }
      }

      if (!entry.library) {
        entry.type = "custom";
      }

      result.js.push(entry);
    }
    result.js.sort((a, b) => a.file.localeCompare(b.file));
  }

  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));
    for (const file of cssFiles) {
      const filePath = path.join(cssDir, file);
      const stat = fs.statSync(filePath);
      const isLib = /jquery|fancybox|datepicker|datetimepicker/i.test(file) || file === "cake.generic.css";
      result.css.push({
        file,
        size: stat.size,
        type: isLib ? "library" : "custom",
      });
    }
    result.css.sort((a, b) => a.file.localeCompare(b.file));
  }

  return result;
}

// ---------------------------------------------------------------------------
// PermissionComponent 解析
// ---------------------------------------------------------------------------
function analyzePermissionComponent(appDir) {
  const filePath = path.join(appDir, "Controller", "Component", "PermissionComponent.php");
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);

  const methods = [];
  const fnRe = /(?:public\s+)?function\s+(\w+)\s*\(/g;
  let fm;
  while ((fm = fnRe.exec(src)) !== null) {
    const name = fm[1];
    if (!name.startsWith("__")) methods.push(name);
  }

  return { file: "app/Controller/Component/PermissionComponent.php", methods };
}

// ---------------------------------------------------------------------------
// Logic クラスメソッド解析: app/Model/Logic/*.php
// ---------------------------------------------------------------------------
function analyzeLogicClasses(appDir) {
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
function analyzeTitlesGraphMapping(appDir) {
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
function analyzeComposerDeps(appDir) {
  const rootDir = path.dirname(appDir);
  const filePath = path.join(rootDir, "composer.json");
  if (!fs.existsSync(filePath)) return { require: {}, requireDev: {} };

  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return {
    require: json.require || {},
    requireDev: json["require-dev"] || {},
  };
}

// ---------------------------------------------------------------------------
// ACL 設定解析: app/Config/acl.php
// ---------------------------------------------------------------------------
function analyzeAcl(appDir) {
  const filePath = path.join(appDir, "Config", "acl.php");
  if (!fs.existsSync(filePath)) return null;

  const raw = stripBlockComments(fs.readFileSync(filePath, "utf8"));

  const aliases = [];
  const aliasSection = raw.match(/\$config\['alias'\]\s*=\s*array\s*\(([\s\S]*?)\)\s*;/);
  if (aliasSection) {
    const re = /['"]([^'"]+)['"]\s*=>\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(aliasSection[1])) !== null) {
      aliases.push({ key: m[1], value: m[2] });
    }
  }

  const roles = [];
  const rolesSection = raw.match(/\$config\['roles'\]\s*=\s*array\s*\(([\s\S]*?)\)\s*;/);
  if (rolesSection) {
    const re = /['"]([^'"]+)['"]\s*=>\s*(null|['"][^'"]*['"])/g;
    let m;
    while ((m = re.exec(rolesSection[1])) !== null) {
      roles.push({ role: m[1], inherits: m[2] === "null" ? null : m[2].replace(/['"]/g, "") });
    }
  }

  const allowRules = [];
  const denyRules = [];
  const rulesSection = raw.match(/\$config\['rules'\]\s*=\s*array\s*\(([\s\S]*?)\)\s*;/);
  if (rulesSection) {
    const body = rulesSection[1];
    const allowSec = body.match(/'allow'\s*=>\s*array\s*\(([\s\S]*?)\)/);
    if (allowSec) {
      const re = /['"]([^'"]*)['"]\s*=>\s*['"]([^'"]+)['"]/g;
      let m;
      while ((m = re.exec(allowSec[1])) !== null) {
        allowRules.push({ resource: m[1], roles: m[2] });
      }
    }
    const denySec = body.match(/'deny'\s*=>\s*array\s*\(([\s\S]*?)\)\s*,?\s*$/);
    if (denySec) {
      const re = /['"]([^'"]*)['"]\s*=>\s*['"]([^'"]+)['"]/g;
      let m;
      while ((m = re.exec(denySec[1])) !== null) {
        denyRules.push({ resource: m[1], roles: m[2] });
      }
    }
  }

  return { aliases, roles, allow: allowRules, deny: denyRules };
}

// ---------------------------------------------------------------------------
// Shell 実行フロー詳細解析
// ---------------------------------------------------------------------------
function analyzeShellDetails(appDir) {
  const shellDir = path.join(appDir, "Console", "Command");
  if (!fs.existsSync(shellDir)) return [];

  const files = fs.readdirSync(shellDir).filter((f) => f.endsWith("Shell.php"));
  const results = [];

  for (const file of files) {
    const filePath = path.join(shellDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) continue;
    if (classMatch[1] === "AppShell") continue;

    const hasMail = /CakeEmail/.test(raw);
    const hasFileOps = /rename\s*\(|file_get_contents|fopen|unlink|file_put_contents/.test(raw);
    const hasTransaction = /begin\s*\(\)|rollback\s*\(\)|commit\s*\(/.test(raw);

    const flowSteps = [];
    if (/getTarget|find\s*\(/.test(src)) flowSteps.push("対象データ取得");
    if (/readdir|scandir|glob\(|file_get_contents/.test(src)) flowSteps.push("ファイル読込");
    if (/import/i.test(src)) flowSteps.push("データインポート");
    if (hasTransaction) flowSteps.push("トランザクション管理");
    if (/createViewReports/.test(src)) flowSteps.push("レポート生成");
    if (hasMail) flowSteps.push("メール通知");
    if (/rename\s*\(/.test(src)) flowSteps.push("ファイルバックアップ");
    if (/unlink\s*\(/.test(src)) flowSteps.push("ファイル削除");

    results.push({
      className: classMatch[1],
      file: "app/Console/Command/" + file,
      hasMail,
      hasFileOps,
      hasTransaction,
      flowSteps,
    });
  }

  results.sort((a, b) => a.className.localeCompare(b.className));
  return results;
}

// ---------------------------------------------------------------------------
// メール通知仕様解析
// ---------------------------------------------------------------------------
function analyzeEmailNotifications(appDir) {
  const result = { config: {}, usages: [] };

  // email.php 設定
  const emailConfigPath = path.join(appDir, "Config", "email.php");
  if (fs.existsSync(emailConfigPath)) {
    const raw = fs.readFileSync(emailConfigPath, "utf8");
    const src = stripBlockComments(raw);
    const defaultMatch = src.match(/\$default\s*=\s*array\s*\(([\s\S]*?)\)\s*;/);
    if (defaultMatch) {
      const body = defaultMatch[1];
      const transport = body.match(/['"]transport['"]\s*=>\s*['"](\w+)['"]/);
      const from = body.match(/['"]from['"]\s*=>\s*['"]([^'"]+)['"]/);
      if (transport) result.config.transport = transport[1];
      if (from) result.config.defaultFrom = from[1];
    }
  }

  // CakeEmail 使用箇所
  const searchDirs = [
    { dir: "Console/Command", prefix: "Console/Command" },
    { dir: "Lib", prefix: "Lib" },
  ];
  for (const { dir, prefix } of searchDirs) {
    const dirPath = path.join(appDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".php"));
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const raw = fs.readFileSync(filePath, "utf8");
      if (!raw.includes("CakeEmail")) continue;

      const subjects = [];
      const subjectStartRe = /->subject\s*\(/g;
      let sm;
      while ((sm = subjectStartRe.exec(raw)) !== null) {
        // balanced-paren で引数全体を取得
        const startIdx = sm.index + sm[0].length;
        let depth = 1;
        let i = startIdx;
        while (i < raw.length && depth > 0) {
          if (raw[i] === "(") depth++;
          else if (raw[i] === ")") depth--;
          i++;
        }
        let subj = raw.slice(startIdx, i - 1).trim();
        subj = subj
          .replace(/Configure::read\(['"]([^'"]+)['"]\)/g, "{$1}")
          .replace(/\s*\.\s*/g, "")
          .replace(/["']/g, "");
        subjects.push(subj);
      }

      const hasCc = /->cc\s*\(/.test(raw);

      result.usages.push({
        file: "app/" + prefix + "/" + file,
        subjects: [...new Set(subjects)],
        hasCc,
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// テスト構成解析
// ---------------------------------------------------------------------------
function analyzeTestStructure(appDir) {
  const testDir = path.join(appDir, "Test");
  if (!fs.existsSync(testDir)) return null;

  const result = { controllerTests: 0, modelTests: 0, fixtures: 0 };

  const caseDir = path.join(testDir, "Case");
  if (fs.existsSync(caseDir)) {
    const ctrlDir = path.join(caseDir, "Controller");
    const modelDir = path.join(caseDir, "Model");
    if (fs.existsSync(ctrlDir)) {
      result.controllerTests = fs.readdirSync(ctrlDir).filter((f) => f.endsWith("Test.php")).length;
    }
    if (fs.existsSync(modelDir)) {
      result.modelTests = fs.readdirSync(modelDir).filter((f) => f.endsWith("Test.php")).length;
    }
  }

  const fixtureDir = path.join(testDir, "Fixture");
  if (fs.existsSync(fixtureDir)) {
    result.fixtures = fs.readdirSync(fixtureDir).filter((f) => f.endsWith("Fixture.php")).length;
  }

  return result;
}

// ---------------------------------------------------------------------------
// メインエクスポート
// ---------------------------------------------------------------------------
export function analyzeExtras(appDir) {
  const constants = analyzeConstants(appDir);
  const bootstrap = analyzeBootstrap(appDir);
  const appController = analyzeAppController(appDir);
  const appModel = analyzeAppModel(appDir);
  const helpers = analyzeHelpers(appDir);
  const libraries = analyzeLibraries(appDir);
  const behaviors = analyzeBehaviors(appDir);
  const sqlFiles = analyzeSqlFiles(appDir);
  const layouts = analyzeLayouts(appDir);
  const elements = analyzeElements(appDir);
  const assets = analyzeAssets(appDir);
  const permissionComponent = analyzePermissionComponent(appDir);
  const logicClasses = analyzeLogicClasses(appDir);
  const titlesGraphMapping = analyzeTitlesGraphMapping(appDir);
  const composerDeps = analyzeComposerDeps(appDir);
  const acl = analyzeAcl(appDir);
  const shellDetails = analyzeShellDetails(appDir);
  const emailNotifications = analyzeEmailNotifications(appDir);
  const testStructure = analyzeTestStructure(appDir);

  return {
    constants,
    bootstrap,
    appController,
    appModel,
    helpers,
    libraries,
    behaviors,
    sqlFiles,
    layouts,
    elements,
    assets,
    permissionComponent,
    logicClasses,
    titlesGraphMapping,
    composerDeps,
    acl,
    shellDetails,
    emailNotifications,
    testStructure,
  };
}
