#!/usr/bin/env node
/**
 * src/check/commands/config.js
 *
 * sdd-forge check config — config.json validation report.
 *
 * Runs three checks in order:
 *   1. File existence and JSON parse
 *   2. Schema validation (required fields, type constraints)
 *   3. Preset existence (type values must match known presets)
 */

import fs from "fs";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, parseArgs } from "../../lib/cli.js";
import { sddConfigPath, validate } from "../../lib/config.js";
import { PRESETS } from "../../lib/presets.js";
import { EXIT_ERROR } from "../../lib/exit-codes.js";

const MAX_SCHEMA_ERRORS = 50;

function printHelp() {
  console.log(
    [
      "Usage: sdd-forge check config [options]",
      "",
      "Validate .sdd-forge/config.json for required fields, preset existence,",
      "and schema consistency.",
      "",
      "Options:",
      "  --format <text|json>  Output format (default: text)",
      "  -h, --help            Show this help",
    ].join("\n")
  );
}

/**
 * Run all config checks and return check results.
 * Stops early if file or schema check fails.
 *
 * @param {string} root - repo root
 * @returns {{ name: string, result: "pass"|"fail", errors: string[] }[]}
 */
function runChecks(root) {
  const configPath = sddConfigPath(root);
  const checks = [];

  // Check 1: file existence + JSON parse
  if (!fs.existsSync(configPath)) {
    checks.push({ name: "file", result: "fail", errors: [`config.json not found: ${configPath}`] });
    return checks;
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    checks.push({ name: "file", result: "fail", errors: [`Failed to parse config.json: ${err.message}`] });
    return checks;
  }
  checks.push({ name: "file", result: "pass", errors: [] });

  // Check 2: schema validation
  try {
    validate(raw);
    checks.push({ name: "schema", result: "pass", errors: [] });
  } catch (err) {
    const errors = err.message
      .replace(/^Config validation failed:\n/, "")
      .split(/\n\s*-\s*/)
      .map((e) => e.trim())
      .filter(Boolean)
      .slice(0, MAX_SCHEMA_ERRORS);
    checks.push({ name: "schema", result: "fail", errors });
    return checks;
  }

  // Check 3: preset existence
  const types = Array.isArray(raw.type) ? raw.type : [raw.type];
  const validKeys = new Set(PRESETS.map((p) => p.key));
  const unknownPresets = types.filter((t) => !validKeys.has(t));

  if (unknownPresets.length > 0) {
    checks.push({
      name: "presets",
      result: "fail",
      errors: unknownPresets.map((t) => `Preset not found: ${t}`),
    });
  } else {
    checks.push({ name: "presets", result: "pass", errors: [] });
  }

  return checks;
}

async function main() {
  const cli = parseArgs(process.argv.slice(2), {
    options: ["--format"],
    defaults: { format: "text" },
  });

  if (cli.help) {
    printHelp();
    return;
  }

  const format = cli.format || "text";
  if (!["text", "json"].includes(format)) {
    process.stderr.write(`sdd-forge check config: unknown format '${format}'. Use text or json.\n`);
    process.exit(EXIT_ERROR);
  }

  const root = repoRoot();
  const checks = runChecks(root);
  const ok = checks.every((c) => c.result === "pass");

  if (format === "json") {
    process.stdout.write(JSON.stringify({ ok, checks }, null, 2) + "\n");
    if (!ok) process.exit(EXIT_ERROR);
    return;
  }

  // text format
  if (ok) {
    process.stdout.write("config is valid\n");
  } else {
    for (const check of checks) {
      if (check.result === "fail") {
        for (const err of check.errors) {
          process.stderr.write(`  - ${err}\n`);
        }
      }
    }
    process.exit(EXIT_ERROR);
  }
}

export { main };
runIfDirect(import.meta.url, main);
