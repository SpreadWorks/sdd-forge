#!/usr/bin/env node
/**
 * src/spec.js
 *
 * Spec dispatcher. Routes spec-related subcommands.
 */

import { fileURLToPath } from "url";
import path from "path";

const PKG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const SCRIPTS = {
  spec: "specs/commands/init.js",
  gate: "specs/commands/gate.js",
};

const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

const scriptRelPath = SCRIPTS[subCmd];
if (!scriptRelPath) {
  console.error(`sdd-forge spec: unknown command '${subCmd}'`);
  process.exit(1);
}

const scriptPath = path.join(PKG_DIR, scriptRelPath);
process.argv = [process.argv[0], scriptPath, ...rest];

await import(scriptPath);
