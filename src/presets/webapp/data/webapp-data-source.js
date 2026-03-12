/**
 * WebappDataSource — common base for all webapp preset DataSources.
 *
 * Provides shared utilities used across webapp-type presets
 * (cakephp2, laravel, symfony).
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

export default class WebappDataSource extends Scannable(DataSource) {
  /**
   * Derive the source root directory from a file list.
   *
   * Webapp DataSources receive a pre-filtered file list from the scanner,
   * but some analyzer functions still require a sourceRoot path.
   * This extracts it by stripping the relPath suffix from the first file.
   *
   * @param {Array<{ absPath: string, relPath: string }>} files
   * @returns {string} absolute path to source root
   */
  deriveSourceRoot(files) {
    const f = files[0];
    return f.absPath.slice(0, f.absPath.length - f.relPath.length).replace(/\/$/, "");
  }
}
