#!/usr/bin/env node
/**
 * src/presets-cmd.js
 *
 * `sdd-forge presets list` — display the preset inheritance tree.
 */

import fs from "fs";
import path from "path";
import { PRESETS, presetByLeaf } from "./lib/presets.js";

const subCmd = process.argv[2];

if (!subCmd || subCmd === "list") {
  printTree();
} else if (subCmd === "-h" || subCmd === "--help") {
  console.log("Usage: sdd-forge presets list");
  console.log("\nDisplay the preset inheritance tree.");
} else {
  console.error(`sdd-forge presets: unknown command '${subCmd}'`);
  process.exit(1);
}

function printTree() {
  const archMap = new Map();

  for (const p of PRESETS) {
    if (p.isArch) {
      if (!archMap.has(p.key)) archMap.set(p.key, []);
    } else {
      if (!archMap.has(p.arch)) archMap.set(p.arch, []);
      archMap.get(p.arch).push(p);
    }
  }

  const base = presetByLeaf("base");
  console.log(`${base.key}/  (${base.label})`);

  const archKeys = [...archMap.keys()].filter((k) => k !== "base").sort();

  for (let ai = 0; ai < archKeys.length; ai++) {
    const archKey = archKeys[ai];
    const arch = presetByLeaf(archKey);
    const leaves = archMap.get(archKey);
    const isLast = ai === archKeys.length - 1;
    const prefix = isLast ? "└── " : "├── ";
    const childIndent = isLast ? "    " : "│   ";

    const label = arch ? arch.label : archKey;
    const tplDir = arch ? path.join(arch.dir, "templates") : null;
    const hasTpl = tplDir && fs.existsSync(tplDir);
    console.log(`${prefix}${archKey}/  (${label})${hasTpl ? "" : "  [no templates]"}`);

    for (let li = 0; li < leaves.length; li++) {
      const leaf = leaves[li];
      const isLastLeaf = li === leaves.length - 1;
      const leafPrefix = isLastLeaf ? "└── " : "├── ";
      const parts = [leaf.label];
      if (leaf.aliases.length > 0) parts.push(`aliases: ${leaf.aliases.join(", ")}`);
      const scanKeys = Object.keys(leaf.scan);
      if (scanKeys.length > 0) parts.push(`scan: [${scanKeys.join(", ")}]`);
      console.log(`${childIndent}${leafPrefix}${leaf.key}/  (${parts.join(", ")})`);
    }
  }
}
