/**
 * TestsSource — CakePHP 2.x test structure DataSource.
 *
 * Available methods (called via @data directives):
 *   tests.list("Item|Count|Directory")
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { analyzeTestStructure } from "../scan/testing.js";

class TestsSource extends DataSource {
  scan(sourceRoot) {
    return analyzeTestStructure(sourceRoot);
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

export default new TestsSource();
