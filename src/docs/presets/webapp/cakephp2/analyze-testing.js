/**
 * analyze-testing.js
 *
 * Test structure analyzer.
 */

import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// テスト構成解析
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
