/**
 * LibsSource — CakePHP 2.x libraries DataSource.
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeLibraries, analyzeBehaviors, analyzeSqlFiles } from "../scan/views.js";

export default class CakephpLibsSource extends Scannable(DataSource) {
  match(file) {
    return /^app\/Lib\//.test(file.relPath)
      || /^app\/Model\/Behavior\//.test(file.relPath)
      || /^app\/Console\/Command\/Sql\//.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = deriveSourceRoot(files);
    const appDir = sourceRoot + "/app";
    return {
      libraries: analyzeLibraries(appDir),
      behaviors: analyzeBehaviors(appDir),
      sqlFiles: analyzeSqlFiles(appDir),
    };
  }

  list(analysis, labels) {
    if (!analysis.libs?.libraries) return null;
    const items = analysis.libs.libraries;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (l) => [l.className, l.file, this.desc("libs", l.className)]);
    return this.toMarkdownTable(rows, labels);
  }

  errors(analysis, labels) {
    if (!analysis.libs?.libraries) return null;
    const items = analysis.libs.libraries.filter(
      (l) => l.className === "AppError" || l.className === "AppExceptionHandler",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (l) => [l.className, l.file, this.desc("libs", l.className)]);
    return this.toMarkdownTable(rows, labels);
  }

  behaviors(analysis, labels) {
    if (!analysis.libs?.behaviors) return null;
    const items = analysis.libs.behaviors;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (b) => [
      b.className, b.methods.length > 0 ? b.methods.join(", ") : "—", "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  sql(analysis, labels) {
    if (!analysis.libs?.sqlFiles) return null;
    const items = analysis.libs.sqlFiles;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.file, s.lines,
      s.params.length > 0 ? s.params.join(", ") : "—",
      s.tables.length > 0 ? s.tables.join(", ") : "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  appmodel(analysis, labels) {
    if (!analysis.config?.appModel?.methods) return null;
    const items = analysis.config.appModel.methods;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (m) => [m.name, m.description]);
    return this.toMarkdownTable(rows, labels);
  }
}

function deriveSourceRoot(files) {
  const f = files[0];
  return f.absPath.slice(0, f.absPath.length - f.relPath.length).replace(/\/$/, "");
}
