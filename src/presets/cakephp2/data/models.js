/**
 * ModelsSource — CakePHP 2.x models DataSource.
 *
 * Extends webapp ModelsSource with CakePHP-specific scan logic
 * and resolve methods (logic, er, logicMethods).
 */

import ModelsSource from "../../webapp/data/models.js";
import { analyzeModels } from "../scan/models.js";

export default class CakephpModelsSource extends ModelsSource {
  match(file) {
    return /\.php$/.test(file.relPath)
      && file.relPath.includes("Model/")
      && !/AppModel\.php$/.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    return analyzeModels(sourceRoot + "/app");
  }

  /** Logic class list. */
  logic(analysis, labels) {
    const items = this.mergeDesc(
      analysis.models.models
        .filter((m) => m.isLogic)
        .sort((a, b) => a.className.localeCompare(b.className)),
      "logicClasses",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.className,
      m.file,
      m.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Model association summary (excludes isLogic and isFe models). */
  relations(analysis, labels) {
    const models = analysis.models.models.filter((m) => !m.isLogic && !m.isFe);
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
    const models = analysis.models.models.filter((m) => !m.isLogic && !m.isFe);
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
    if (!analysis.config?.logicClasses) return null;
    const items = analysis.config.logicClasses;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (lc) => {
      const methods = lc.methods
        .filter((m) => m.visibility === "public")
        .map((m) => m.name + "()")
        .join(", ");
      return [lc.className, lc.extends, methods || "—"];
    });
    return this.toMarkdownTable(rows, labels);
  }
}
