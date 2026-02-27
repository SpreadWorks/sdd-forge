#!/usr/bin/env node
/**
 * src/projects/setdefault.js
 *
 * sdd-forge default [<name>]
 * デフォルトプロジェクトを変更する。引数なしで一覧表示。
 */

import { setDefault, loadProjects } from "./projects.js";

function main() {
  const [name] = process.argv.slice(2);

  if (!name) {
    const data = loadProjects();
    if (!data) {
      console.error("No projects registered. Run: sdd-forge add <name> <path>");
      process.exit(1);
    }
    console.log("Registered projects:");
    for (const [n, p] of Object.entries(data.projects)) {
      const mark = n === data.default ? " (default)" : "";
      console.log(`  ${n}${mark}  →  ${p.path}`);
    }
    return;
  }

  try {
    setDefault(name);
    console.log(`Default project set to '${name}'.`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
