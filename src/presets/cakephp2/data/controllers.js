/**
 * ControllersSource — CakePHP 2.x controllers DataSource.
 *
 * Extends webapp ControllersSource with CakePHP-specific parse logic
 * and resolve methods (csv, actions).
 */

import fs from "fs";
import path from "path";
import ControllersSource from "../../webapp/data/controllers.js";
import { ControllerEntry } from "../../webapp/data/controllers.js";
import {
  stripBlockComments,
  extractArrayBody,
  extractQuotedStrings,
} from "../../../docs/lib/php-array-parser.js";

const LIFECYCLE_METHODS = new Set([
  "beforeFilter",
  "afterFilter",
  "beforeRender",
  "beforeRedirect",
  "constructClasses",
  "initialize",
  "startup",
  "shutdownProcess",
]);

export default class CakephpControllersSource extends ControllersSource {
  static Entry = ControllerEntry;

  match(relPath) {
    return /Controller\.php$/.test(relPath)
      && relPath.includes("Controller/")
      && !/AppController\.php$/.test(relPath);
  }

  parse(absPath) {
    const entry = new ControllerEntry();
    const raw = fs.readFileSync(absPath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) return entry;

    entry.className = classMatch[1];
    entry.parentClass = classMatch[2];

    const componentsBody = extractArrayBody(src, "components");
    entry.components = componentsBody
      ? extractQuotedStrings(componentsBody)
      : [];

    const usesBody = extractArrayBody(src, "uses");
    entry.uses = usesBody ? extractQuotedStrings(usesBody) : [];

    const actions = [];
    const fnRe = /public\s+function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      const name = fm[1];
      if (!LIFECYCLE_METHODS.has(name) && !name.startsWith("_")) {
        actions.push(name);
      }
    }
    entry.actions = actions;

    return entry;
  }

  /** CSV import/export capabilities table. */
  csv(analysis, labels) {
    const csvMap = this.overrides().controllersCsv || {};
    const entries = Object.entries(csvMap).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return null;
    const rows = entries.map(([name, ops]) => [
      name,
      ops.csvImport ? "○" : "—",
      ops.csvExport ? "○" : "—",
      ops.excelExport ? "○" : "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Controller actions → Logic class mapping table. */
  actions(analysis, labels) {
    if (!analysis.config?.entries) return null;
    const configEntries = analysis.config.entries;
    const allMappings = configEntries.flatMap((e) => e.titlesGraphMapping || []);
    const items = allMappings.filter((m) => m.logicClasses.length > 0);
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.action,
      m.logicClasses.join(", "),
      m.outputType,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/security.js
// ---------------------------------------------------------------------------

export function analyzePermissionComponent(appDir) {
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
// ACL 設定解析: app/Config/acl.php
// ---------------------------------------------------------------------------
export function analyzeAcl(appDir) {
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
