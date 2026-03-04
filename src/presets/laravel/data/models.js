/**
 * ModelsSource — Laravel Eloquent models DataSource.
 *
 * Combines scan (source code extraction) and resolve (Markdown rendering)
 * into a single self-contained class.
 *
 * Available methods (called via @data directives):
 *   models.relations("Model|Associations")
 *   models.scopes("Model|Scope")
 *   models.casts("Model|Attribute|Cast Type")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { analyzeModels } from "../scan/models.js";

class ModelsSource extends DataSource {
  scan(sourceRoot) {
    return analyzeModels(sourceRoot);
  }

  /** Model relations table. */
  relations(analysis, labels) {
    const models = analysis.extras?.laravelModels || [];
    if (models.length === 0) return null;
    const rows = [];
    for (const model of models) {
      if (!model.relations) continue;
      const targets = [];
      for (const [type, list] of Object.entries(model.relations)) {
        if (Array.isArray(list) && list.length > 0) {
          targets.push(`${type}: ${list.map((r) => r.model).join(", ")}`);
        }
      }
      if (targets.length > 0) {
        rows.push([model.className, targets.join(" / ")]);
      }
    }
    if (rows.length === 0) return null;
    rows.sort((a, b) => a[0].localeCompare(b[0]));
    return this.toMarkdownTable(rows, labels);
  }

  /** Model scopes table. */
  scopes(analysis, labels) {
    const models = analysis.extras?.laravelModels || [];
    if (models.length === 0) return null;
    const rows = [];
    for (const model of models) {
      for (const scope of model.scopes || []) {
        rows.push([model.className, scope]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Model attribute casts table. */
  casts(analysis, labels) {
    const models = analysis.extras?.laravelModels || [];
    if (models.length === 0) return null;
    const rows = [];
    for (const model of models) {
      for (const [attr, type] of Object.entries(model.casts || {})) {
        rows.push([model.className, attr, type]);
      }
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }
}

export default new ModelsSource();
