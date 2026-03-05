/**
 * ProjectSource — common DataSource for project metadata.
 *
 * Provides package.json values (name, description, version) as {{data}} directives.
 * Available for all project types.
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../lib/data-source.js";

export default class ProjectSource extends DataSource {
  init(ctx) {
    super.init(ctx);
    this._root = ctx.root;
    this._pkgCache = undefined;
  }

  _pkg() {
    if (this._pkgCache !== undefined) return this._pkgCache;
    const pkgPath = path.join(this._root, "package.json");
    if (fs.existsSync(pkgPath)) {
      this._pkgCache = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    } else {
      this._pkgCache = null;
    }
    return this._pkgCache;
  }

  /** Project / package name. */
  name(_analysis, _labels) {
    const pkg = this._pkg();
    return pkg?.name || path.basename(this._root);
  }

  /** Project description. */
  description(_analysis, _labels) {
    const pkg = this._pkg();
    return pkg?.description || "";
  }

  /** Project version. */
  version(_analysis, _labels) {
    const pkg = this._pkg();
    return pkg?.version || "0.0.0";
  }
}
