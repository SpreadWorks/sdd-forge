/**
 * ViewsSource — CakePHP 2.x views DataSource.
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeHelpers, analyzeLayouts, analyzeElements } from "../scan/views.js";

export default class CakephpViewsSource extends Scannable(DataSource) {
  match(file) {
    return /^app\/View\//.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = deriveSourceRoot(files);
    const appDir = sourceRoot + "/app";
    return {
      helpers: analyzeHelpers(appDir),
      layouts: analyzeLayouts(appDir),
      elements: analyzeElements(appDir),
    };
  }

  helpers(analysis, labels) {
    if (!analysis.views?.helpers) return null;
    const items = analysis.views.helpers;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (h) => [h.className, h.extends, this.desc("helpers", h.className)]);
    return this.toMarkdownTable(rows, labels);
  }

  layouts(analysis, labels) {
    if (!analysis.views?.layouts) return null;
    const items = analysis.views.layouts;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (file) => [file, this.desc("layouts", file)]);
    return this.toMarkdownTable(rows, labels);
  }

  elements(analysis, labels) {
    if (!analysis.views?.elements) return null;
    const items = analysis.views.elements;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (file) => [file, this.desc("elements", file)]);
    return this.toMarkdownTable(rows, labels);
  }

  components(analysis, labels) {
    if (!analysis.config?.permissionComponent) return null;
    const methods = analysis.config.permissionComponent.methods;
    if (!methods || methods.length === 0) return null;
    const permDescs = this.overrides().permissionMethods || {};
    const rows = this.toRows(methods, (m) => [m, permDescs[m] || m]);
    return this.toMarkdownTable(rows, labels);
  }
}

function deriveSourceRoot(files) {
  const f = files[0];
  return f.absPath.slice(0, f.absPath.length - f.relPath.length).replace(/\/$/, "");
}
