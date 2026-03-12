/**
 * PackageSource — package.json / composer.json DataSource.
 *
 * Extracts dependency and script information from package manifest files.
 * Available for all presets via base preset inheritance.
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

const PACKAGE_FILES = new Set(["package.json", "composer.json"]);

export default class PackageSource extends Scannable(DataSource) {
  match(file) {
    return PACKAGE_FILES.has(file.fileName);
  }

  scan(files) {
    if (files.length === 0) return null;

    const result = {};

    for (const f of files) {
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(f.absPath, "utf8"));
      } catch (_) {
        continue;
      }

      if (f.fileName === "package.json") {
        result.packageDeps = {
          dependencies: parsed.dependencies || {},
          devDependencies: parsed.devDependencies || {},
        };
        if (parsed.scripts && Object.keys(parsed.scripts).length > 0) {
          result.packageScripts = parsed.scripts;
        }
      }

      if (f.fileName === "composer.json") {
        result.composerDeps = {
          require: parsed.require || {},
          requireDev: parsed["require-dev"] || {},
        };
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }
}
