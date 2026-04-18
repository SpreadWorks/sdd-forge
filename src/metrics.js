#!/usr/bin/env node
/**
 * src/metrics.js
 *
 * Metrics dispatcher. Routes metrics subcommands via the unified dispatcher.
 */

import { EXIT_ERROR } from "./lib/constants.js";
import { container, initContainer } from "./lib/container.js";
import { metricsCommands } from "./lib/command-registry.js";
import { dispatch } from "./lib/dispatcher.js";

initContainer();

const args = process.argv.slice(2);
const subCmd = args[0];
const rest = args.slice(1);

if (!subCmd || subCmd === "-h" || subCmd === "--help") {
  console.error("Usage: sdd-forge metrics <command>\n");
  console.error("Available commands:");
  for (const c of Object.keys(metricsCommands)) console.error(`  ${c}`);
  console.error("\nRun: sdd-forge metrics <command> --help");
  process.exit(subCmd ? 0 : EXIT_ERROR);
}

const entry = metricsCommands[subCmd];
if (!entry) {
  console.error(`sdd-forge metrics: unknown command '${subCmd}'`);
  console.error("Run: sdd-forge metrics --help");
  process.exit(EXIT_ERROR);
}

await dispatch({ container, entry, argv: rest });
