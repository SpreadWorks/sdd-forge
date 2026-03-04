/**
 * LibsSource — CakePHP 2.x libraries DataSource.
 *
 * Available methods (called via @data directives):
 *   libs.list("Class|File|Description")
 *   libs.errors("Class|File|Description")
 *   libs.behaviors("Class|Methods|Description")
 *   libs.sql("File|Lines|Params|Tables")
 *   libs.appmodel("Method|Description")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import {
  analyzeLibraries,
  analyzeBehaviors,
  analyzeSqlFiles,
} from "../scan/views.js";
import { analyzeAppModel } from "../scan/base-classes.js";

class LibsSource extends DataSource {
  scan(sourceRoot) {
    return {
      libraries: analyzeLibraries(sourceRoot),
      behaviors: analyzeBehaviors(sourceRoot),
      sqlFiles: analyzeSqlFiles(sourceRoot),
      appModel: analyzeAppModel(sourceRoot),
    };
  }

  /** Library class list. */
  list(analysis, labels) {
    if (!analysis.extras?.libraries) return null;
    const items = analysis.extras.libraries;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (l) => [
      l.className,
      l.file,
      this.desc("libs", l.className),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Error/exception handler classes. */
  errors(analysis, labels) {
    if (!analysis.extras?.libraries) return null;
    const items = analysis.extras.libraries.filter(
      (l) => l.className === "AppError" || l.className === "AppExceptionHandler",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (l) => [
      l.className,
      l.file,
      this.desc("libs", l.className),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Model behaviors. */
  behaviors(analysis, labels) {
    if (!analysis.extras?.behaviors) return null;
    const items = analysis.extras.behaviors;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (b) => [
      b.className,
      b.methods.length > 0 ? b.methods.join(", ") : "—",
      "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** SQL template files. */
  sql(analysis, labels) {
    if (!analysis.extras?.sqlFiles) return null;
    const items = analysis.extras.sqlFiles;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.file,
      s.lines,
      s.params.length > 0 ? s.params.join(", ") : "—",
      s.tables.length > 0 ? s.tables.join(", ") : "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** AppModel shared methods. */
  appmodel(analysis, labels) {
    if (!analysis.extras?.appModel?.methods) return null;
    const items = analysis.extras.appModel.methods;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.name,
      m.description,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

export default new LibsSource();
