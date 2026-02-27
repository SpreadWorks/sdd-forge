#!/usr/bin/env node
/**
 * sdd-forge/analyzers/scan.js
 *
 * 全解析器を実行し、結合結果を .sdd-forge/output/analysis.json へ出力する。
 * オプション: --only controllers|models|shells|routes, --stdout
 */

import fs from "fs";
import path from "path";
import { analyzeControllers } from "./analyze-controllers.js";
import { analyzeModels } from "./analyze-models.js";
import { analyzeShells } from "./analyze-shells.js";
import { analyzeRoutes } from "./analyze-routes.js";
import { analyzeExtras } from "./analyze-extras.js";
import { repoRoot, parseArgs } from "../lib/cli.js";

function printHelp() {
  console.log(
    [
      "Usage: node sdd-forge/analyzers/scan.js [options]",
      "",
      "Options:",
      "  --only <type>   controllers|models|shells|routes|extras のいずれか",
      "  --stdout        結果を stdout に出力（ファイル書き込みしない）",
      "  -h, --help      このヘルプを表示",
    ].join("\n"),
  );
}

const VALID_ONLY = new Set(["controllers", "models", "shells", "routes", "extras"]);

function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--stdout"],
    options: ["--only"],
    defaults: { only: "", stdout: false },
  });
  if (cli.help) {
    printHelp();
    return;
  }

  if (cli.only && !VALID_ONLY.has(cli.only)) {
    throw new Error(
      `--only must be one of: ${[...VALID_ONLY].join(", ")}`,
    );
  }

  const root = repoRoot(import.meta.url);
  const appDir = path.join(root, "app");

  if (!fs.existsSync(appDir)) {
    throw new Error(`app/ directory not found: ${appDir}`);
  }

  const result = { analyzedAt: new Date().toISOString() };
  const run = !cli.only;

  if (run || cli.only === "controllers") {
    console.error("[analyze] controllers ...");
    result.controllers = analyzeControllers(appDir);
    console.error(
      `[analyze] controllers: ${result.controllers.summary.total} files, ${result.controllers.summary.totalActions} actions`,
    );
  }

  if (run || cli.only === "models") {
    console.error("[analyze] models ...");
    result.models = analyzeModels(appDir);
    console.error(
      `[analyze] models: ${result.models.summary.total} files (fe=${result.models.summary.feModels}, logic=${result.models.summary.logicModels})`,
    );
  }

  if (run || cli.only === "shells") {
    console.error("[analyze] shells ...");
    result.shells = analyzeShells(appDir);
    console.error(
      `[analyze] shells: ${result.shells.summary.total} files`,
    );
  }

  if (run || cli.only === "routes") {
    console.error("[analyze] routes ...");
    result.routes = analyzeRoutes(appDir);
    console.error(
      `[analyze] routes: ${result.routes.summary.total} routes`,
    );
  }

  if (run || cli.only === "extras") {
    console.error("[analyze] extras ...");
    result.extras = analyzeExtras(appDir);
    const extrasKeys = Object.keys(result.extras);
    console.error(
      `[analyze] extras: ${extrasKeys.length} categories (${extrasKeys.join(", ")})`,
    );
  }

  const json = JSON.stringify(result, null, 2);

  if (cli.stdout) {
    process.stdout.write(json + "\n");
  } else {
    const outputDir = path.join(root, ".sdd-forge", "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "analysis.json");
    fs.writeFileSync(outputPath, json + "\n");
    console.error(`[analyze] output: ${path.relative(root, outputPath)}`);
  }
}

main();
