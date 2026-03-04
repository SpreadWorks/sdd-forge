/**
 * analyze-security.js
 *
 * Security analyzers: PermissionComponent, ACL config.
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../../docs/lib/php-array-parser.js";

// ---------------------------------------------------------------------------
// PermissionComponent 解析
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
