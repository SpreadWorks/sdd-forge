/**
 * ModelsSource — webapp common models scan + resolve.
 *
 * Child presets extend this class to add FW-specific scan logic
 * and resolve methods.
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { parseFile, camelToSnake, pluralize } from "../../../docs/lib/scanner.js";

export default class ModelsSource extends Scannable(DataSource) {
  match(file) {
    return false;
  }

  scan(files) {
    if (files.length === 0) return null;

    const models = [];
    const dbGroups = {};

    for (const f of files) {
      const parsed = parseFile(f.absPath);
      const isLogic = f.relPath.includes("Logic");
      const isFe = parsed.className.startsWith("Fe");
      const useTable = parsed.properties.useTable || null;
      const useDbConfig = parsed.properties.useDbConfig || null;
      const tableName = useTable || pluralize(camelToSnake(parsed.className));
      const dbKey = useDbConfig || "default";

      if (!dbGroups[dbKey]) dbGroups[dbKey] = [];
      dbGroups[dbKey].push(parsed.className);

      models.push({
        file: f.relPath,
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
        lines: f.lines,
        hash: f.hash,
        mtime: f.mtime,
      });
    }

    const feModels = models.filter((m) => m.isFe).length;
    const logicModels = models.filter((m) => m.isLogic).length;

    return {
      models,
      summary: { total: models.length, feModels, logicModels, dbGroups },
    };
  }

  /** Model association summary. */
  relations(analysis, labels) {
    const models = analysis.models?.models || [];
    if (models.length === 0) return null;
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
}
