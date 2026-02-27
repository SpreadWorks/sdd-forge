#!/usr/bin/env node
/**
 * src/projects/add.js
 *
 * sdd-forge add <name> <path>
 * プロジェクトを projects.json に登録し、projects/<name>/ を初期化する。
 */

import fs from "fs";
import path from "path";
import { addProject, workRootFor } from "./projects.js";

const DEFAULT_CONFIG = {
  lang: "ja",
  limits: { designTimeoutMs: 900000 },
};

function main() {
  const [name, projectPath] = process.argv.slice(2);

  if (!name || !projectPath) {
    console.error("Usage: sdd-forge add <name> <path>");
    process.exit(1);
  }

  const resolved = path.resolve(projectPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: path does not exist: ${resolved}`);
    process.exit(1);
  }

  let data;
  try {
    data = addProject(name, resolved);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const isDefault = data.default === name;

  // projects/<name>/ のディレクトリ構造を作成
  const workRoot = workRootFor(name);
  const sddDir   = path.join(workRoot, ".sdd-forge");
  const outputDir = path.join(sddDir, "output");
  const docsDir  = path.join(workRoot, "docs");
  const specsDir = path.join(workRoot, "specs");

  [sddDir, outputDir, docsDir, specsDir].forEach((d) =>
    fs.mkdirSync(d, { recursive: true }),
  );

  // config.json: ソースプロジェクトのものをコピー、なければデフォルト生成
  const configDest = path.join(sddDir, "config.json");
  const configSrc  = path.join(resolved, ".sdd-forge", "config.json");
  if (fs.existsSync(configSrc)) {
    fs.copyFileSync(configSrc, configDest);
    console.log(`  config : copied from source project`);
  } else {
    fs.writeFileSync(configDest, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
    console.log(`  config : created with defaults`);
  }

  fs.writeFileSync(path.join(outputDir, ".gitkeep"), "");

  console.log(`\nProject '${name}' added.`);
  console.log(`  source : ${resolved}`);
  console.log(`  workdir: ${workRoot}`);
  if (isDefault) console.log(`  default: yes`);
  console.log(`\nRun: sdd-forge scan`);
}

main();
