/**
 * TestsSource — CakePHP 2.x test structure DataSource.
 */

import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { analyzeTestStructure } from "../scan/testing.js";

export default class CakephpTestsSource extends WebappDataSource {
  match(file) {
    return /^app\/Test\//.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    const appDir = sourceRoot + "/app";
    return { testStructure: analyzeTestStructure(appDir) };
  }

  list(analysis, labels) {
    if (!analysis.tests?.testStructure) return null;
    const t = analysis.tests.testStructure;
    const rows = [
      ["コントローラテスト", t.controllerTests, "app/Test/Case/Controller/"],
      ["モデルテスト", t.modelTests, "app/Test/Case/Model/"],
      ["フィクスチャ", t.fixtures, "app/Test/Fixture/"],
    ];
    return this.toMarkdownTable(rows, labels);
  }
}
