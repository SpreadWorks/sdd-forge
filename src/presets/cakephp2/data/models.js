/**
 * ModelsSource — CakePHP 2.x models DataSource.
 *
 * Extends webapp ModelsSource with CakePHP-specific parse logic
 * and resolve methods (logic, er, logicMethods).
 */

import fs from "fs";
import path from "path";
import { getFileStats } from "../../../docs/lib/scanner.js";
import ModelsSource from "../../webapp/data/models.js";
import { ModelEntry } from "../../webapp/data/models.js";
import {
  stripBlockComments,
  extractArrayBody,
  extractTopLevelKeys,
  extractQuotedStrings,
  camelToSnake,
  pluralize,
} from "../../../docs/lib/php-array-parser.js";

const RELATION_TYPES = [
  "belongsTo",
  "hasMany",
  "hasOne",
  "hasAndBelongsToMany",
];

function extractStringProperty(src, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:var|public|protected|private)\\s+\\$${escaped}\\s*=\\s*['"]([^'"]+)['"]`,
  );
  const m = re.exec(src);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------------
// Shared parse helper (used by both parse() and analyzeModels())
// ---------------------------------------------------------------------------

/**
 * Parse CakePHP 2.x model content string (after stripBlockComments) and
 * return raw parse result. No file I/O — caller provides content.
 *
 * @param {string} src - PHP source code with block comments already stripped
 * @returns {null | { className: string, parentClass: string, useTable: string|null, useDbConfig: string|null, primaryKey: string|null, displayField: string|null, tableName: string, relations: Object, validateFields: string[], actsAs: string[] }}
 */
function parseModelContent(src) {
  const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
  if (!classMatch) return null;

  const className = classMatch[1];
  const parentClass = classMatch[2];

  const useTable = extractStringProperty(src, "useTable");
  const useDbConfig = extractStringProperty(src, "useDbConfig");
  const primaryKey = extractStringProperty(src, "primaryKey");
  const displayField = extractStringProperty(src, "displayField");

  const relations = {};
  for (const relType of RELATION_TYPES) {
    const body = extractArrayBody(src, relType);
    if (body) {
      relations[relType] = extractTopLevelKeys(body);
    }
  }

  const validateBody = extractArrayBody(src, "validate");
  const validateFields = validateBody
    ? extractTopLevelKeys(validateBody)
    : [];

  const actsAsBody = extractArrayBody(src, "actsAs");
  const actsAs = actsAsBody ? extractQuotedStrings(actsAsBody) : [];

  const tableName = useTable || pluralize(camelToSnake(className));

  return {
    className,
    parentClass,
    useTable: useTable || null,
    useDbConfig: useDbConfig || null,
    primaryKey: primaryKey || null,
    displayField: displayField || null,
    tableName,
    relations,
    validateFields,
    actsAs,
  };
}

export default class CakephpModelsSource extends ModelsSource {
  static Entry = ModelEntry;

  match(relPath) {
    return /\.php$/.test(relPath)
      && relPath.includes("Model/")
      && !/AppModel\.php$/.test(relPath);
  }

  parse(absPath) {
    const entry = new ModelEntry();
    const raw = fs.readFileSync(absPath, "utf8");
    const src = stripBlockComments(raw);
    const parsed = parseModelContent(src);
    if (!parsed) return entry;

    entry.className = parsed.className;
    entry.parentClass = parsed.parentClass;
    entry.useTable = parsed.useTable;
    entry.useDbConfig = parsed.useDbConfig;
    entry.primaryKey = parsed.primaryKey;
    entry.displayField = parsed.displayField;
    entry.tableName = parsed.tableName;
    entry.relations = parsed.relations;
    entry.validateFields = parsed.validateFields;
    entry.actsAs = parsed.actsAs;
    entry.isLogic = absPath.includes("/Logic/");
    entry.isFe = parsed.className.startsWith("Fe");

    return entry;
  }

  /** Logic class list. */
  logic(analysis, labels) {
    const items = this.mergeDesc(
      (analysis.models?.entries || [])
        .filter((m) => m.isLogic)
        .sort((a, b) => a.className.localeCompare(b.className)),
      "logicClasses",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.className,
      m.file,
      m.summary || "\u2014",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Model association summary (excludes isLogic and isFe models). */
  relations(analysis, labels) {
    const models = (analysis.models?.entries || []).filter((m) => !m.isLogic && !m.isFe);
    const rows = [];
    for (const model of models) {
      if (!model.relations) continue;
      const targets = [];
      for (const [type, list] of Object.entries(model.relations)) {
        if (Array.isArray(list) && list.length > 0) {
          targets.push(`${type}: ${list.join(", ")}`);
        }
      }
      if (targets.length > 0) {
        rows.push([model.className, targets.join(" / ")]);
      }
    }
    rows.sort((a, b) => a[0].localeCompare(b[0]));
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** ER diagram data (parent-child pairs). */
  er(analysis, labels) {
    const models = (analysis.models?.entries || []).filter((m) => !m.isLogic && !m.isFe);
    const rows = [];
    const seen = new Set();

    for (const model of models) {
      if (!model.relations) continue;

      for (const parent of model.relations.belongsTo || []) {
        const pm = models.find((m) => m.className === parent);
        if (!pm) continue;
        const key = `${pm.tableName}--${model.tableName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push([pm.tableName, model.tableName, "belongsTo"]);
      }

      for (const child of model.relations.hasMany || []) {
        const cm = models.find((m) => m.className === child);
        if (!cm) continue;
        const key = `${model.tableName}--${cm.tableName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push([model.tableName, cm.tableName, "hasMany"]);
      }

      for (const target of model.relations.hasOne || []) {
        const tm = models.find((m) => m.className === target);
        if (!tm) continue;
        const key = `${model.tableName}--${tm.tableName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push([model.tableName, tm.tableName, "hasOne"]);
      }
    }

    if (rows.length === 0) return null;
    const hdr = labels.length >= 3 ? labels : ["Parent", "Child", "Relation"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Logic class public methods detail. */
  logicMethods(analysis, labels) {
    const configEntries = analysis.config?.entries;
    if (!configEntries) return null;
    const items = configEntries.flatMap((e) => e.logicClasses || []);
    if (items.length === 0) return null;
    const rows = this.toRows(items, (lc) => {
      const methods = lc.methods
        .filter((m) => m.visibility === "public")
        .map((m) => m.name + "()")
        .join(", ");
      return [lc.className, lc.extends, methods || "\u2014"];
    });
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/models.js
// ---------------------------------------------------------------------------

function inferTableName(className) {
  const snake = camelToSnake(className);
  return pluralize(snake);
}

export function analyzeModels(appDir) {
  const dirs = [
    { dir: path.join(appDir, "Model"), isLogic: false },
    { dir: path.join(appDir, "Model", "Logic"), isLogic: true },
  ];

  const models = [];

  for (const { dir, isLogic } of dirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".php") && f !== "AppModel.php");

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const raw = fs.readFileSync(filePath, "utf8");
      const src = stripBlockComments(raw);
      const parsed = parseModelContent(src);
      if (!parsed) continue;

      const isFe = parsed.className.startsWith("Fe");

      models.push({
        file: path.relative(path.resolve(appDir, ".."), filePath),
        className: parsed.className,
        parentClass: parsed.parentClass,
        isLogic,
        isFe,
        useTable: parsed.useTable,
        useDbConfig: parsed.useDbConfig,
        primaryKey: parsed.primaryKey,
        displayField: parsed.displayField,
        tableName: parsed.tableName,
        relations: parsed.relations,
        validateFields: parsed.validateFields,
        actsAs: parsed.actsAs,
        ...getFileStats(filePath),
      });
    }
  }

  models.sort((a, b) => a.className.localeCompare(b.className));

  const dbGroups = {};
  for (const m of models) {
    const db = m.useDbConfig || "default";
    if (!dbGroups[db]) dbGroups[db] = [];
    dbGroups[db].push(m.className);
  }

  return {
    models,
    summary: {
      total: models.length,
      feModels: models.filter((m) => m.isFe).length,
      logicModels: models.filter((m) => m.isLogic).length,
      dbGroups,
    },
  };
}

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/business.js
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
// TitlesGraphController action -> Logic mapping
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

    let outputType = "\u753B\u9762\u8868\u793A";
    if (/OutputExcel|Excel/i.test(actionName)) outputType = "Excel";
    else if (/OutputCsv|Csv/i.test(actionName)) outputType = "CSV";
    else if (/ajax/i.test(actionName)) outputType = "JSON";

    results.push({ action: actionName, logicClasses: [...logics], outputType });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Composer deps
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

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/base-classes.js
// ---------------------------------------------------------------------------

export function analyzeAppController(appDir) {
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

  // components array - extract top-level only via bracket balancing
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
    const helperRe = /['"](\w+)['"]\s*=>\s*array\s*\(\s*['"]className['"]\s*=>\s*['"](\w+)['"]/g;
    let hm;
    while ((hm = helperRe.exec(body)) !== null) {
      result.helpers.push({ name: hm[1], className: hm[2] });
    }
  }

  // Auth config
  const authSection = src.match(/'Auth'\s*=>\s*array\s*\(([\s\S]*?)\),\s*'Acl'/);
  if (authSection) {
    const authBody = authSection[1];
    const authorizeMatch = authBody.match(/['"]authorize['"]\s*=>\s*array\s*\(\s*['"](\w+)['"]/);
    if (authorizeMatch) result.authConfig.authorize = authorizeMatch[1];
    const authMatch = authBody.match(/['"]authenticate['"]\s*=>\s*array\s*\(\s*['"](\w+)['"]/);
    if (authMatch) result.authConfig.authenticate = authMatch[1];
    const userModelMatch = authBody.match(/['"]userModel['"]\s*=>\s*['"](\w+)['"]/);
    if (userModelMatch) result.authConfig.userModel = userModelMatch[1];
    const fieldMatch = authBody.match(/['"]username['"]\s*=>\s*['"](\w+)['"]/);
    if (fieldMatch) result.authConfig.loginField = fieldMatch[1];
    const loginRedirMatch = authBody.match(/['"]loginRedirect['"]\s*=>\s*array\s*\(\s*['"]controller['"]\s*=>\s*['"](\w+)['"]/);
    if (loginRedirMatch) result.authConfig.loginRedirect = loginRedirMatch[1] + "/index";
    const logoutRedirMatch = authBody.match(/['"]logoutRedirect['"]\s*=>\s*array\s*\(\s*['"]controller['"]\s*=>\s*['"](\w+)['"][^)]*['"]action['"]\s*=>\s*['"](\w+)['"]/);
    if (logoutRedirMatch) result.authConfig.logoutRedirect = logoutRedirMatch[1] + "/" + logoutRedirMatch[2];
  }

  // Methods
  const fnRe = /(public|protected|private)\s+function\s+(\w+)\s*\(/g;
  let fm;
  while ((fm = fnRe.exec(src)) !== null) {
    result.methods.push({ name: fm[2], visibility: fm[1] });
  }

  return result;
}

// ---------------------------------------------------------------------------
// AppModel analysis
// ---------------------------------------------------------------------------
export function analyzeAppModel(appDir) {
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

  const actsAsMatch = src.match(/\$actsAs\s*=\s*array\s*\(\s*["'](\w+)["']/);
  if (actsAsMatch) result.behaviors.push(actsAsMatch[1]);

  if (/function\s+beforeSave\s*\(/.test(src)) result.callbacks.push("beforeSave");
  if (/function\s+afterSave\s*\(/.test(src)) result.callbacks.push("afterSave");

  const auditFields = ["created_by", "created_ts", "updated_by", "updated_ts"];
  for (const field of auditFields) {
    if (src.includes(`'${field}'`)) result.auditFields.push(field);
  }

  const fnRe = /(public\s+)?function\s+(\w+)\s*\(/g;
  let fm;
  const methodDescs = {
    picureWithSize: "\u753B\u50CF\u6A2A\u5E45\u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3\uFF08\u30D1\u30A4\u30D7\u533A\u5207\u308A\uFF09",
    beforeSave: "\u81EA\u52D5\u30BF\u30A4\u30E0\u30B9\u30BF\u30F3\u30D7\u30FB\u76E3\u67FB\u30D5\u30A3\u30FC\u30EB\u30C9\u8A2D\u5B9A",
    afterSave: "\u9032\u6357\u7BA1\u7406\u66F4\u65B0\u30FBFE\u30C7\u30FC\u30BF\u524A\u9664\u30D5\u30E9\u30B0\u51E6\u7406",
    invalidDate: "\u65E5\u4ED8\u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3",
    sqldump: "SQL \u30C7\u30D0\u30C3\u30B0\u30C0\u30F3\u30D7",
    sql: "SQL \u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u30D5\u30A1\u30A4\u30EB\u8AAD\u307F\u8FBC\u307F\u30FB\u5B9F\u884C",
    escapeQuote: "\u30B7\u30F3\u30B0\u30EB\u30AF\u30A9\u30FC\u30C8\u30A8\u30B9\u30B1\u30FC\u30D7",
    replaseParam: "SQL \u30D1\u30E9\u30E1\u30FC\u30BF\u7F6E\u63DB",
    updateProcessUpdate: "\u30B3\u30F3\u30C6\u30F3\u30C4\u30FB\u30BF\u30A4\u30C8\u30EB\u6700\u7D42\u66F4\u65B0\u65E5\u6642\u306E\u66F4\u65B0",
    saveAllAtOnce: "500\u4EF6\u5358\u4F4D\u30D0\u30C3\u30C1 INSERT",
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
