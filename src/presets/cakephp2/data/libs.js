/**
 * LibsSource — CakePHP 2.x libraries DataSource.
 */

import fs from "fs";
import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { stripBlockComments } from "../../../docs/lib/php-array-parser.js";

export class LibEntry extends AnalysisEntry {
  /** "library" | "behavior" | "sql" */
  libType = null;
  className = null;
  staticMethods = null;
  methods = null;
  hasMail = null;
  /** For SQL files */
  params = null;
  tables = null;

  static summary = {};
}

export default class CakephpLibsSource extends WebappDataSource {
  static Entry = LibEntry;

  match(relPath) {
    return /^app\/Lib\//.test(relPath)
      || /^app\/Model\/Behavior\//.test(relPath)
      || /^app\/Console\/Command\/Sql\//.test(relPath);
  }

  parse(absPath) {
    const entry = new LibEntry();
    const content = fs.readFileSync(absPath, "utf8");

    if (/\/Lib\/[^/]+\.php$/.test(absPath)) {
      entry.libType = "library";
      const src = stripBlockComments(content);

      const classMatch = src.match(/class\s+(\w+)/);
      if (classMatch) entry.className = classMatch[1];

      const staticMethods = [];
      const fnRe = /(?:public\s+)?static\s+function\s+(\w+)\s*\(/g;
      let fm;
      while ((fm = fnRe.exec(src)) !== null) {
        staticMethods.push(fm[1]);
      }
      entry.staticMethods = staticMethods;

      const methods = [];
      const nfnRe = /(?:public\s+)?function\s+(\w+)\s*\(/g;
      while ((fm = nfnRe.exec(src)) !== null) {
        if (!fm[0].includes("static")) methods.push(fm[1]);
      }
      entry.methods = methods;

      entry.hasMail = /CakeEmail/.test(content);
    } else if (/\/Model\/Behavior\/[^/]+\.php$/.test(absPath)) {
      entry.libType = "behavior";
      const src = stripBlockComments(content);

      const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
      if (classMatch) entry.className = classMatch[1];

      const methods = [];
      const fnRe = /(?:public\s+)?function\s+(\w+)\s*\(/g;
      let fm;
      while ((fm = fnRe.exec(src)) !== null) {
        const name = fm[1];
        if (!name.startsWith("__") && name !== "setup") methods.push(name);
      }
      entry.methods = methods;
    } else if (/\/Sql\/[^/]+\.sql$/.test(absPath)) {
      entry.libType = "sql";

      const params = new Set();
      const paramRe = /\/\*(\w+)\*\//g;
      let pm;
      while ((pm = paramRe.exec(content)) !== null) {
        params.add(pm[1]);
      }
      entry.params = [...params];

      const tables = new Set();
      const tableRe = /(?:FROM|JOIN)\s+(\w+)/gi;
      let tm;
      while ((tm = tableRe.exec(content)) !== null) {
        const tbl = tm[1].toLowerCase();
        if (tbl !== "select" && tbl !== "where" && tbl !== "set") {
          tables.add(tbl);
        }
      }
      entry.tables = [...tables].sort();
    }

    return entry;
  }

  list(analysis, labels) {
    const entries = (analysis.libs?.entries || []).filter((e) => e.libType === "library");
    if (entries.length === 0) return null;
    const items = this.mergeDesc(entries, "libs");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (l) => [l.className, l.file, l.summary || "—"]);
    return this.toMarkdownTable(rows, labels);
  }

  errors(analysis, labels) {
    const entries = (analysis.libs?.entries || []).filter(
      (l) => l.libType === "library"
        && (l.className === "AppError" || l.className === "AppExceptionHandler"),
    );
    if (entries.length === 0) return null;
    const items = this.mergeDesc(entries, "libs");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (l) => [l.className, l.file, l.summary || "—"]);
    return this.toMarkdownTable(rows, labels);
  }

  behaviors(analysis, labels) {
    const entries = (analysis.libs?.entries || []).filter((e) => e.libType === "behavior");
    if (entries.length === 0) return null;
    const rows = this.toRows(entries, (b) => [
      b.className, b.methods?.length > 0 ? b.methods.join(", ") : "—", "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  sql(analysis, labels) {
    const entries = (analysis.libs?.entries || []).filter((e) => e.libType === "sql");
    if (entries.length === 0) return null;
    const rows = this.toRows(entries, (s) => [
      s.file, s.lines,
      s.params?.length > 0 ? s.params.join(", ") : "—",
      s.tables?.length > 0 ? s.tables.join(", ") : "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  appmodel(analysis, labels) {
    const configEntries = analysis.config?.entries;
    if (!configEntries) return null;
    const appModelEntries = configEntries.filter((e) => e.appModel?.methods);
    if (appModelEntries.length === 0) return null;
    const items = appModelEntries[0].appModel.methods;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [m.name, m.description]);
    return this.toMarkdownTable(rows, labels);
  }
}
