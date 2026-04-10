/**
 * TestsSource — CakePHP 2.x test structure DataSource.
 */

import fs from "fs";
import path from "path";
import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { hasPathPrefix } from "../../lib/path-match.js";

export class TestEntry extends AnalysisEntry {
  /** "controllerTest" | "modelTest" | "fixture" */
  testType = null;

  static summary = {};
}

export default class CakephpTestsSource extends WebappDataSource {
  static Entry = TestEntry;

  match(relPath) {
    return hasPathPrefix(relPath, "app/Test/");
  }

  parse(absPath) {
    const entry = new TestEntry();

    if (/\/Test\/Case\/Controller\//.test(absPath) && absPath.endsWith("Test.php")) {
      entry.testType = "controllerTest";
    } else if (/\/Test\/Case\/Model\//.test(absPath) && absPath.endsWith("Test.php")) {
      entry.testType = "modelTest";
    } else if (/\/Test\/Fixture\//.test(absPath) && absPath.endsWith("Fixture.php")) {
      entry.testType = "fixture";
    }

    return entry;
  }

  list(analysis, labels) {
    const entries = analysis.tests?.entries || [];
    if (entries.length === 0) return null;

    const controllerTests = entries.filter((e) => e.testType === "controllerTest").length;
    const modelTests = entries.filter((e) => e.testType === "modelTest").length;
    const fixtures = entries.filter((e) => e.testType === "fixture").length;

    const rows = [
      ["コントローラテスト", controllerTests, "app/Test/Case/Controller/"],
      ["モデルテスト", modelTests, "app/Test/Case/Model/"],
      ["フィクスチャ", fixtures, "app/Test/Fixture/"],
    ];
    return this.toMarkdownTable(rows, labels);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzers moved from scan/testing.js
// ---------------------------------------------------------------------------

export function analyzeTestStructure(appDir) {
  const testDir = path.join(appDir, "Test");
  if (!fs.existsSync(testDir)) return null;

  const result = { controllerTests: 0, modelTests: 0, fixtures: 0 };

  const caseDir = path.join(testDir, "Case");
  if (fs.existsSync(caseDir)) {
    const ctrlDir = path.join(caseDir, "Controller");
    const modelDir = path.join(caseDir, "Model");
    if (fs.existsSync(ctrlDir)) {
      result.controllerTests = fs.readdirSync(ctrlDir).filter((f) => f.endsWith("Test.php")).length;
    }
    if (fs.existsSync(modelDir)) {
      result.modelTests = fs.readdirSync(modelDir).filter((f) => f.endsWith("Test.php")).length;
    }
  }

  const fixtureDir = path.join(testDir, "Fixture");
  if (fs.existsSync(fixtureDir)) {
    result.fixtures = fs.readdirSync(fixtureDir).filter((f) => f.endsWith("Fixture.php")).length;
  }

  return result;
}
