/**
 * ViewsSource — CakePHP 2.x views DataSource.
 */

import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { analyzeHelpers, analyzeLayouts, analyzeElements } from "../scan/views.js";

export default class CakephpViewsSource extends WebappDataSource {
  match(file) {
    return /^app\/View\//.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
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
    const rows = this.toRows(items, (h) => [h.className, h.extends, this.desc("helpers", h.className, h.summary)]);
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
    const pc = analysis.config.permissionComponent;
    const methods = pc.methods || [];
    if (methods.length === 0) return null;
    const rows = [["PermissionComponent", methods.join(", ")]];
    return this.toMarkdownTable(rows, labels);
  }
}
