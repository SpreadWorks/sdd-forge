/**
 * ViewsSource — CakePHP 2.x views DataSource.
 */

import fs from "fs";
import path from "path";
import { getFileStats } from "../../../docs/lib/scanner.js";
import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { stripBlockComments } from "../../../docs/lib/php-array-parser.js";

export class ViewEntry extends AnalysisEntry {
  /** "helper" | "layout" | "element" */
  viewType = null;
  className = null;
  extends = null;
  methods = null;
  dependsOn = null;

  static summary = {};
}

export default class CakephpViewsSource extends WebappDataSource {
  static Entry = ViewEntry;

  match(relPath) {
    return /^app\/View\//.test(relPath);
  }

  parse(absPath) {
    const entry = new ViewEntry();

    if (/\/View\/Helper\/[^/]+\.php$/.test(absPath)) {
      entry.viewType = "helper";
      const raw = fs.readFileSync(absPath, "utf8");
      const src = stripBlockComments(raw);

      const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
      if (classMatch) {
        entry.className = classMatch[1];
        entry.extends = classMatch[2];
      }

      const methods = [];
      const fnRe = /(?:public\s+)?function\s+(\w+)\s*\(/g;
      let fm;
      while ((fm = fnRe.exec(src)) !== null) {
        if (!fm[1].startsWith("__")) methods.push(fm[1]);
      }
      entry.methods = methods;

      const depHelpers = [];
      const depMatch = src.match(/\$helpers\s*=\s*array\s*\(([^)]+)\)/);
      if (depMatch) {
        const depRe = /['"](\w+)['"]/g;
        let dm;
        while ((dm = depRe.exec(depMatch[1])) !== null) {
          depHelpers.push(dm[1]);
        }
      }
      entry.dependsOn = depHelpers;
    } else if (/\/View\/Layouts\//.test(absPath) && absPath.endsWith(".ctp")) {
      entry.viewType = "layout";
    } else if (/\/View\/Elements\//.test(absPath) && absPath.endsWith(".ctp")) {
      entry.viewType = "element";
    }

    return entry;
  }

  helpers(analysis, labels) {
    const entries = (analysis.views?.entries || []).filter((e) => e.viewType === "helper");
    if (entries.length === 0) return null;
    const items = this.mergeDesc(entries, "helpers");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (h) => [h.className, h.extends, h.summary || "—"]);
    return this.toMarkdownTable(rows, labels);
  }

  layouts(analysis, labels) {
    const entries = (analysis.views?.entries || []).filter((e) => e.viewType === "layout");
    if (entries.length === 0) return null;
    const rows = this.toRows(entries, (e) => [e.file, this.desc("layouts", e.file)]);
    return this.toMarkdownTable(rows, labels);
  }

  elements(analysis, labels) {
    const entries = (analysis.views?.entries || []).filter((e) => e.viewType === "element");
    if (entries.length === 0) return null;
    const rows = this.toRows(entries, (e) => [e.file, this.desc("elements", e.file)]);
    return this.toMarkdownTable(rows, labels);
  }

  components(analysis, labels) {
    const configEntries = analysis.config?.entries;
    if (!configEntries) return null;
    const permComps = configEntries.filter((e) => e.permissionComponent);
    if (permComps.length === 0) return null;
    const pc = permComps[0].permissionComponent;
    const methods = pc.methods || [];
    if (methods.length === 0) return null;
    const rows = [["PermissionComponent", methods.join(", ")]];
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/views.js
// ---------------------------------------------------------------------------

export function analyzeHelpers(appDir) {
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
export function analyzeLibraries(appDir) {
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
export function analyzeBehaviors(appDir) {
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
export function analyzeSqlFiles(appDir) {
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
export function analyzeLayouts(appDir) {
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

export function analyzeElements(appDir) {
  const elemDir = path.join(appDir, "View", "Elements");
  if (!fs.existsSync(elemDir)) return [];

  return fs
    .readdirSync(elemDir)
    .filter((f) => f.endsWith(".ctp"))
    .sort();
}
