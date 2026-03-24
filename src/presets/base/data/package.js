/**
 * PackageSource — package.json / composer.json DataSource.
 *
 * Extracts dependency and script information from package manifest files.
 * Available for all presets via base preset inheritance.
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";

const PACKAGE_FILES = new Set(["package.json", "composer.json"]);

export class PackageEntry extends AnalysisEntry {
  packageDeps = null;
  packageScripts = null;
  composerDeps = null;
  static summary = {};
}

export default class PackageSource extends Scannable(DataSource) {
  static Entry = PackageEntry;

  match(relPath) {
    return PACKAGE_FILES.has(path.basename(relPath));
  }

  parse(absPath) {
    const entry = new PackageEntry();
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(absPath, "utf8"));
    } catch (_) {
      return entry;
    }

    const fileName = path.basename(absPath);

    if (fileName === "package.json") {
      entry.packageDeps = {
        dependencies: parsed.dependencies || {},
        devDependencies: parsed.devDependencies || {},
      };
      if (parsed.scripts && Object.keys(parsed.scripts).length > 0) {
        entry.packageScripts = parsed.scripts;
      }
    }

    if (fileName === "composer.json") {
      entry.composerDeps = {
        require: parsed.require || {},
        requireDev: parsed["require-dev"] || {},
      };
    }

    return entry;
  }
}
