/**
 * src/docs/lib/test-env-detection.js
 *
 * analysis.json からテスト環境の有無を自動判定する。
 */

const TEST_FRAMEWORKS = [
  // Node.js / JavaScript
  "jest", "mocha", "vitest", "ava", "tap", "jasmine",
  // PHP
  "phpunit/phpunit", "pestphp/pest",
];

/**
 * analysis.json のデータからテスト環境を検出する。
 *
 * @param {Object} analysis - analysis.json データ
 * @returns {{ hasTestEnv: boolean, frameworks: string[], testCommand: string|null }}
 */
export function detectTestEnvironment(analysis) {
  const frameworks = [];
  let testCommand = null;

  // entries から依存・スクリプト情報を集約
  const entries = analysis.package?.entries || [];
  const devDeps = {};
  const composerDevDeps = {};
  let scripts = null;

  for (const entry of entries) {
    Object.assign(devDeps, entry.packageDeps?.devDependencies);
    Object.assign(composerDevDeps, entry.composerDeps?.requireDev);
    if (entry.packageScripts) scripts = entry.packageScripts;
  }

  // devDependencies からフレームワークを検出
  for (const fw of TEST_FRAMEWORKS) {
    if (devDeps[fw] || composerDevDeps[fw]) {
      frameworks.push(fw);
    }
  }

  // scripts.test からテストコマンドを検出
  if (scripts?.test) {
    testCommand = scripts.test;
  }

  // Node.js 組み込みテスト（node --test）の検出
  if (testCommand && testCommand.includes("node") && testCommand.includes("--test")) {
    if (!frameworks.includes("node:test")) {
      frameworks.push("node:test");
    }
  }

  const hasTestEnv = frameworks.length > 0 || testCommand !== null;

  return { hasTestEnv, frameworks, testCommand };
}
