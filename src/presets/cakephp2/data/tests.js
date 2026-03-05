/**
 * TestsSource — CakePHP 2.x test structure DataSource.
 *
 * CakePHP-only category: extends Scannable(DataSource) directly.
 *
 * Available methods (called via @data directives):
 *   tests.list("Item|Count|Directory")
 */

import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeTestStructure } from "../scan/testing.js";

export default class CakephpTestsSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const appDir = path.join(sourceRoot, "app");
    return { testStructure: analyzeTestStructure(appDir) };
  }

  /** Test structure summary. */
  list(analysis, labels) {
    if (!analysis.extras?.testStructure) return null;
    const t = analysis.extras.testStructure;
    const rows = [
      ["コントローラテスト", t.controllerTests, "app/Test/Case/Controller/"],
      ["モデルテスト", t.modelTests, "app/Test/Case/Model/"],
      ["フィクスチャ", t.fixtures, "app/Test/Fixture/"],
    ];
    return this.toMarkdownTable(rows, labels);
  }
}
