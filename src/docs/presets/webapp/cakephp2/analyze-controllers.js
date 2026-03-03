#!/usr/bin/env node
/**
 * tools/analyzers/analyze-controllers.js
 *
 * app/Controller/*Controller.php を走査し、
 * クラス名・components・uses・アクション一覧を抽出する。
 */

import fs from "fs";
import path from "path";
import {
  stripBlockComments,
  extractArrayBody,
  extractQuotedStrings,
} from "../../../lib/php-array-parser.js";

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

export function analyzeControllers(appDir) {
  const controllerDir = path.join(appDir, "Controller");
  if (!fs.existsSync(controllerDir)) return { controllers: [], summary: {} };

  const files = fs
    .readdirSync(controllerDir)
    .filter((f) => f.endsWith("Controller.php") && f !== "AppController.php");

  const controllers = [];
  for (const file of files) {
    const filePath = path.join(controllerDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const src = stripBlockComments(raw);

    const classMatch = src.match(/class\s+(\w+)\s+extends\s+(\w+)/);
    if (!classMatch) continue;

    const className = classMatch[1];
    const parentClass = classMatch[2];

    const componentsBody = extractArrayBody(src, "components");
    const components = componentsBody
      ? extractQuotedStrings(componentsBody)
      : [];

    const usesBody = extractArrayBody(src, "uses");
    const uses = usesBody ? extractQuotedStrings(usesBody) : [];

    const actions = [];
    const fnRe = /public\s+function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(src)) !== null) {
      const name = fm[1];
      if (!LIFECYCLE_METHODS.has(name) && !name.startsWith("_")) {
        actions.push(name);
      }
    }

    controllers.push({
      file: path.relative(path.resolve(appDir, ".."), filePath),
      className,
      parentClass,
      components,
      uses,
      actions,
    });
  }

  controllers.sort((a, b) => a.className.localeCompare(b.className));

  return {
    controllers,
    summary: {
      total: controllers.length,
      totalActions: controllers.reduce((s, c) => s + c.actions.length, 0),
    },
  };
}
