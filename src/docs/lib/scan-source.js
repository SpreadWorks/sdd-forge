/**
 * ScanSource — base class for source code analysis.
 *
 * Scannable — mixin to combine ScanSource capabilities with DataSource.
 * Usage: class FooSource extends Scannable(DataSource) { ... }
 */

/**
 * Base class for scan-only modules.
 */
class ScanSource {
  /**
   * Extract raw data from source code.
   * @param {string} sourceRoot - absolute path to the source directory
   * @param {Object} scanCfg - scan configuration from preset.json
   * @returns {Object} extracted data to be stored in analysis.json
   */
  scan(sourceRoot, scanCfg) {
    return {};
  }
}

/**
 * Mixin that adds scan() capability to any base class (typically DataSource).
 *
 * @param {Function} Base - class to extend
 * @returns {Function} class with scan() method
 *
 * @example
 *   import { DataSource } from "./data-source.js";
 *   import { Scannable } from "./scan-source.js";
 *
 *   export default class ControllersSource extends Scannable(DataSource) {
 *     scan(sourceRoot, scanCfg) { ... }
 *     list(analysis, labels) { ... }
 *   }
 */
export const Scannable = (Base) =>
  class extends Base {
    /**
     * このDataSourceが処理対象とするファイルかを判定する。
     * サブクラスでオーバーライドして具体的な条件を定義する。
     *
     * @param {{ absPath: string, relPath: string, hash: string }} file
     * @returns {boolean}
     */
    match(file) {
      return false;
    }

    /**
     * マッチしたファイルリストを受け取り解析する。
     * @param {Array<{ absPath: string, relPath: string, hash: string, lines: number, mtime: string }>} files
     * @returns {Object} extracted data to be stored in analysis.json
     */
    scan(files) {
      return {};
    }
  };
