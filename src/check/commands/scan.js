#!/usr/bin/env node
/**
 * src/check/commands/scan.js
 *
 * sdd-forge check scan — scan coverage report.
 *
 * Computes two-level coverage:
 *   Level 1 (include coverage): all project files vs scan.include matched files
 *   Level 2 (datasource coverage): include-matched files vs DataSource-analyzed files
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot, sourceRoot, parseArgs } from "../../lib/cli.js";
import { loadConfig, sddOutputDir } from "../../lib/config.js";
import { globToRegex } from "../../docs/lib/scanner.js";
import { pushSection, DIVIDER } from "../../lib/formatter.js";
import { EXIT_ERROR } from "../../lib/exit-codes.js";

const DEFAULT_MAX_FILES = 10;

// Meta keys to skip when reading analysis categories
const META_KEYS = new Set(["analyzedAt", "enrichedAt"]);

function printHelp() {
  console.log([
    "Usage: sdd-forge check scan [options]",
    "",
    "Show scan coverage report for the current project.",
    "",
    "Options:",
    "  --format <text|json|md>  Output format (default: text)",
    "  --list                   Show all uncovered files (default: up to 10)",
    "  -h, --help               Show this help",
  ].join("\n"));
}

/**
 * Walk baseDir recursively, collecting all files.
 * Skips .git, node_modules, vendor directories.
 * Applies excludeMatchers to relative paths.
 *
 * @param {string} baseDir
 * @param {RegExp[]} excludeMatchers
 * @returns {string[]} relative paths
 */
function walkAllFiles(baseDir, excludeMatchers) {
  const results = [];

  function walk(dir, relPrefix) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "vendor" || entry.name === ".sdd-forge") continue;
        const nextRel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        walk(path.join(dir, entry.name), nextRel);
      } else if (entry.isFile()) {
        const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
        if (excludeMatchers.some((m) => m.test(relPath))) continue;
        results.push(relPath);
      }
    }
  }

  walk(baseDir, "");
  return results.sort();
}

/**
 * Compute coverage data from config and analysis.json.
 *
 * @param {string} root - work root
 * @param {string} src - source root
 * @param {Object} cfg - sdd config
 * @returns {{ includeCoverage, dataSourceCoverage }}
 */
function computeCoverage(root, src, cfg) {
  const outputPath = path.join(sddOutputDir(root), "analysis.json");
  if (!fs.existsSync(outputPath)) {
    throw new Error(`analysis.json not found: ${outputPath}\nRun 'sdd-forge docs scan' first.`);
  }

  let analysis;
  try {
    analysis = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse analysis.json: ${err.message}`);
  }

  // Resolve scan patterns
  const include = cfg.scan?.include || [];
  const exclude = cfg.scan?.exclude || [];
  const excludeMatchers = exclude.map((p) => globToRegex(p));
  const includeMatchers = include.map((p) => globToRegex(p));

  // Level 1: all project files (excluding .git/node_modules/vendor + scan.exclude)
  const allFiles = walkAllFiles(src, excludeMatchers);
  const includedFiles = allFiles.filter((f) => includeMatchers.some((m) => m.test(f)));
  const uncoveredByInclude = allFiles.filter((f) => !includeMatchers.some((m) => m.test(f)));

  // Level 2: files analyzed by any DataSource (from analysis.json entries)
  const analyzedFiles = new Set();
  for (const key of Object.keys(analysis)) {
    if (META_KEYS.has(key)) continue;
    const cat = analysis[key];
    if (!cat || !Array.isArray(cat.entries)) continue;
    for (const entry of cat.entries) {
      if (entry?.file) analyzedFiles.add(entry.file);
    }
  }

  const includedSet = new Set(includedFiles);
  const uncoveredByDataSource = includedFiles.filter((f) => !analyzedFiles.has(f));

  return {
    includeCoverage: {
      total: allFiles.length,
      matched: includedFiles.length,
      uncovered: uncoveredByInclude,
    },
    dataSourceCoverage: {
      total: includedFiles.length,
      analyzed: analyzedFiles.size,
      uncovered: uncoveredByDataSource,
    },
  };
}

/**
 * Format as plain text (same layout as flow report).
 */
function formatText(data, showAll) {
  const { includeCoverage: inc, dataSourceCoverage: ds } = data;
  const lines = [];
  const incPct = inc.total === 0 ? 0 : Math.round((inc.matched / inc.total) * 100);
  const dsPct = ds.total === 0 ? 0 : Math.round((ds.analyzed / ds.total) * 100);

  lines.push("  Scan Coverage");

  pushSection(lines, "Include Coverage  (scan.include vs all project files)");
  lines.push(`    ${inc.matched} / ${inc.total} files  (${incPct}%)`);
  if (inc.uncovered.length > 0) {
    const display = showAll ? inc.uncovered : inc.uncovered.slice(0, DEFAULT_MAX_FILES);
    for (const f of display) lines.push(`      - ${f}`);
    if (!showAll && inc.uncovered.length > DEFAULT_MAX_FILES) {
      lines.push(`      ... and ${inc.uncovered.length - DEFAULT_MAX_FILES} more (use --list to show all)`);
    }
  }

  pushSection(lines, "DataSource Coverage  (analyzed vs include-matched files)");
  lines.push(`    ${ds.analyzed} / ${ds.total} files  (${dsPct}%)`);
  if (ds.uncovered.length > 0) {
    const display = showAll ? ds.uncovered : ds.uncovered.slice(0, DEFAULT_MAX_FILES);
    for (const f of display) lines.push(`      - ${f}`);
    if (!showAll && ds.uncovered.length > DEFAULT_MAX_FILES) {
      lines.push(`      ... and ${ds.uncovered.length - DEFAULT_MAX_FILES} more (use --list to show all)`);
    }
  }

  return lines.join("\n");
}

/**
 * Format as Markdown.
 */
function formatMarkdown(data, showAll) {
  const { includeCoverage: inc, dataSourceCoverage: ds } = data;
  const incPct = inc.total === 0 ? 0 : Math.round((inc.matched / inc.total) * 100);
  const dsPct = ds.total === 0 ? 0 : Math.round((ds.analyzed / ds.total) * 100);

  const lines = [];
  lines.push("# Scan Coverage Report");
  lines.push("");
  lines.push("## Include Coverage");
  lines.push(`_scan.include vs all project files_`);
  lines.push("");
  lines.push(`**${inc.matched} / ${inc.total} files (${incPct}%)**`);
  if (inc.uncovered.length > 0) {
    lines.push("");
    lines.push("Uncovered files:");
    const display = showAll ? inc.uncovered : inc.uncovered.slice(0, DEFAULT_MAX_FILES);
    for (const f of display) lines.push(`- \`${f}\``);
    if (!showAll && inc.uncovered.length > DEFAULT_MAX_FILES) {
      lines.push(`- _...and ${inc.uncovered.length - DEFAULT_MAX_FILES} more (use --list to show all)_`);
    }
  }

  lines.push("");
  lines.push("## DataSource Coverage");
  lines.push(`_analyzed vs include-matched files_`);
  lines.push("");
  lines.push(`**${ds.analyzed} / ${ds.total} files (${dsPct}%)**`);
  if (ds.uncovered.length > 0) {
    lines.push("");
    lines.push("Unmatched files:");
    const display = showAll ? ds.uncovered : ds.uncovered.slice(0, DEFAULT_MAX_FILES);
    for (const f of display) lines.push(`- \`${f}\``);
    if (!showAll && ds.uncovered.length > DEFAULT_MAX_FILES) {
      lines.push(`- _...and ${ds.uncovered.length - DEFAULT_MAX_FILES} more (use --list to show all)_`);
    }
  }

  return lines.join("\n");
}

async function main() {
  const cli = parseArgs(process.argv.slice(2), {
    flags: ["--list"],
    options: ["--format"],
    defaults: { list: false, format: "text" },
  });

  if (cli.help) {
    printHelp();
    return;
  }

  const format = cli.format || "text";
  if (!["text", "json", "md"].includes(format)) {
    process.stderr.write(`sdd-forge check scan: unknown format '${format}'. Use text, json, or md.\n`);
    process.exit(EXIT_ERROR);
  }

  const root = repoRoot();
  const src = sourceRoot();

  let cfg;
  try {
    cfg = loadConfig(root);
  } catch (err) {
    process.stderr.write(`sdd-forge check scan: failed to load config: ${err.message}\n`);
    process.exit(EXIT_ERROR);
  }

  let data;
  try {
    data = computeCoverage(root, src, cfg);
  } catch (err) {
    process.stderr.write(`sdd-forge check scan: ${err.message}\n`);
    process.exit(EXIT_ERROR);
  }

  const showAll = cli.list;

  if (format === "json") {
    const { includeCoverage: inc, dataSourceCoverage: ds } = data;
    const incPct = inc.total === 0 ? 0 : Math.round((inc.matched / inc.total) * 100);
    const dsPct = ds.total === 0 ? 0 : Math.round((ds.analyzed / ds.total) * 100);
    const out = {
      includeCoverage: {
        total: inc.total,
        matched: inc.matched,
        percent: incPct,
        uncovered: showAll ? inc.uncovered : inc.uncovered.slice(0, DEFAULT_MAX_FILES),
        uncoveredTotal: inc.uncovered.length,
      },
      dataSourceCoverage: {
        total: ds.total,
        analyzed: ds.analyzed,
        percent: dsPct,
        uncovered: showAll ? ds.uncovered : ds.uncovered.slice(0, DEFAULT_MAX_FILES),
        uncoveredTotal: ds.uncovered.length,
      },
    };
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } else if (format === "md") {
    process.stdout.write(formatMarkdown(data, showAll) + "\n");
  } else {
    process.stdout.write(formatText(data, showAll) + "\n");
  }
}

export { main };
runIfDirect(import.meta.url, main);
