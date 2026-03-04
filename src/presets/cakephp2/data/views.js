/**
 * ViewsSource — CakePHP 2.x views DataSource.
 *
 * Available methods (called via @data directives):
 *   views.helpers("Class|Extends|Description")
 *   views.layouts("File|Description")
 *   views.elements("File|Description")
 *   views.components("Method|Description")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import {
  analyzeHelpers,
  analyzeLayouts,
  analyzeElements,
} from "../scan/views.js";

class ViewsSource extends DataSource {
  scan(sourceRoot) {
    return {
      helpers: analyzeHelpers(sourceRoot),
      layouts: analyzeLayouts(sourceRoot),
      elements: analyzeElements(sourceRoot),
    };
  }

  /** View helpers list. */
  helpers(analysis, labels) {
    if (!analysis.extras?.helpers) return null;
    const items = analysis.extras.helpers;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (h) => [
      h.className,
      h.extends,
      this.desc("helpers", h.className),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Layout template files. */
  layouts(analysis, labels) {
    if (!analysis.extras?.layouts) return null;
    const items = analysis.extras.layouts;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (file) => [
      file,
      this.desc("layouts", file),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Element template files. */
  elements(analysis, labels) {
    if (!analysis.extras?.elements) return null;
    const items = analysis.extras.elements;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (file) => [
      file,
      this.desc("elements", file),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** PermissionComponent methods. */
  components(analysis, labels) {
    if (!analysis.extras?.permissionComponent) return null;
    const methods = analysis.extras.permissionComponent.methods;
    if (!methods || methods.length === 0) return null;
    const permDescs = this.overrides().permissionMethods || {};
    const rows = this.toRows(methods, (m) => [
      m,
      permDescs[m] || m,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}

export default new ViewsSource();
