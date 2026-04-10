#!/usr/bin/env node
/**
 * src/metrics/commands/token.js
 *
 * Aggregate token/cache/cost metrics from spec flow.json files and output
 * text/json/csv reports.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, repoRoot } from "../../lib/cli.js";
import { EXIT_ERROR, EXIT_SUCCESS } from "../../lib/exit-codes.js";

const DEFAULT_FORMAT = "text";
const SUPPORTED_FORMATS = new Set(["text", "json", "csv"]);
const MAX_FLOW_FILES = 5000;

function formatUsage() {
  return [
    "Usage: sdd-forge metrics token [options]",
    "",
    "Options:",
    "  --format <text|json|csv>   Output format (default: text)",
    "  -h, --help                 Show this help",
  ].join("\n");
}

function usageError(message) {
  process.stderr.write(`${message}\n`);
  process.stderr.write(`${formatUsage()}\n`);
  process.exit(EXIT_ERROR);
}

function toIsoDateUTC(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function toNumberOrNull(value) {
  return Number.isFinite(value) ? Number(value) : null;
}

function addMetric(acc, field, value) {
  const n = toNumberOrNull(value);
  if (n == null) return;
  acc[field] = acc[field] == null ? n : acc[field] + n;
}

function asDisplayValue(value, kind = "number") {
  if (value == null) return "N/A";
  if (kind === "cost") return Number(value).toFixed(6);
  return String(value);
}

function asCsvValue(value, kind = "number") {
  if (value == null) return "N/A";
  if (kind === "cost") return Number(value).toFixed(6);
  return String(value);
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
    return a.date.localeCompare(b.date);
  });
}

function groupRowsByPhase(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.phase)) groups.set(row.phase, []);
    groups.get(row.phase).push(row);
  }
  return groups;
}

function formatText(rows) {
  if (!rows.length) return "No metrics data found.";

  const lines = [];
  const groups = groupRowsByPhase(sortRows(rows));

  for (const [phase, phaseRows] of groups.entries()) {
    lines.push(`PHASE ${phase}`);
    lines.push("");
    lines.push("             |             | token          | cache          |            |        |");
    lines.push("             | difficulty  | in      out    | read   create  | call count | cost   |");
    lines.push("--------------------------------------------------------------------------------------");
    for (const row of phaseRows) {
      const date = row.date.padEnd(11, " ");
      const diff = asDisplayValue(row.difficulty).padEnd(11, " ");
      const inTok = asDisplayValue(row.tokenInput).padEnd(7, " ");
      const outTok = asDisplayValue(row.tokenOutput).padEnd(7, " ");
      const read = asDisplayValue(row.cacheRead).padEnd(6, " ");
      const create = asDisplayValue(row.cacheCreate).padEnd(7, " ");
      const calls = asDisplayValue(row.callCount).padEnd(10, " ");
      const cost = asDisplayValue(row.cost, "cost");
      lines.push(`${date} | ${diff} | ${inTok} ${outTok} | ${read} ${create} | ${calls} | ${cost}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function formatJson(rows) {
  return JSON.stringify({ rows: sortRows(rows) }, null, 2);
}

function formatCsv(rows) {
  const header = "date,phase,difficulty,tokenInput,tokenOutput,cacheRead,cacheCreate,callCount,cost";
  const lines = [header];
  for (const row of sortRows(rows)) {
    lines.push([
      row.date,
      row.phase,
      asCsvValue(row.difficulty),
      asCsvValue(row.tokenInput),
      asCsvValue(row.tokenOutput),
      asCsvValue(row.cacheRead),
      asCsvValue(row.cacheCreate),
      asCsvValue(row.callCount),
      asCsvValue(row.cost, "cost"),
    ].join(","));
  }
  return lines.join("\n");
}

async function listFlowFiles(specsDir) {
  const files = [];
  const stack = [specsDir];

  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile() || entry.name !== "flow.json") continue;
      const stat = await fs.stat(fullPath);
      files.push({ path: fullPath, mtimeMs: stat.mtimeMs });
      if (files.length > MAX_FLOW_FILES) {
        throw new Error(`flow.json count exceeds limit (${MAX_FLOW_FILES})`);
      }
    }
  }

  return files;
}

async function isCacheFresh(cachePath, flowFiles) {
  if (!flowFiles.length) return false;
  try {
    const stat = await fs.stat(cachePath);
    for (const file of flowFiles) {
      if (stat.mtimeMs < file.mtimeMs) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function toRowKey(date, phase) {
  return `${phase}::${date}`;
}

function createEmptyRow(date, phase) {
  return {
    date,
    phase,
    difficulty: null,
    tokenInput: null,
    tokenOutput: null,
    cacheRead: null,
    cacheCreate: null,
    callCount: null,
    cost: null,
  };
}

async function buildRows(flowFiles) {
  const rows = new Map();
  for (const file of flowFiles) {
    const date = toIsoDateUTC(file.mtimeMs);
    const text = await fs.readFile(file.path, "utf8");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`invalid JSON in ${file.path}: ${err.message}`);
    }
    const metrics = parsed?.metrics;
    if (!metrics || typeof metrics !== "object") continue;

    for (const [phase, phaseData] of Object.entries(metrics)) {
      if (!phaseData || typeof phaseData !== "object") continue;
      const key = toRowKey(date, phase);
      if (!rows.has(key)) rows.set(key, createEmptyRow(date, phase));
      const row = rows.get(key);
      const tokens = phaseData.tokens && typeof phaseData.tokens === "object" ? phaseData.tokens : {};
      addMetric(row, "tokenInput", tokens.input);
      addMetric(row, "tokenOutput", tokens.output);
      addMetric(row, "cacheRead", tokens.cacheRead);
      addMetric(row, "cacheCreate", tokens.cacheCreation);
      addMetric(row, "callCount", phaseData.callCount);
      addMetric(row, "cost", phaseData.cost);
    }
  }
  return sortRows([...rows.values()]);
}

async function readCacheRows(cachePath) {
  const text = await fs.readFile(cachePath, "utf8");
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.rows)) {
    throw new Error(`invalid cache format: ${cachePath}`);
  }
  return sortRows(parsed.rows);
}

async function writeCache(cachePath, rows) {
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    rows: sortRows(rows),
  };
  await fs.writeFile(cachePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function render(rows, format) {
  if (format === "json") return formatJson(rows);
  if (format === "csv") return formatCsv(rows);
  return formatText(rows);
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2), {
      options: ["--format"],
      defaults: { format: DEFAULT_FORMAT },
    });
  } catch (err) {
    usageError(err.message);
  }

  if (opts.help) {
    process.stdout.write(`${formatUsage()}\n`);
    process.exit(EXIT_SUCCESS);
  }
  const format = String(opts.format || DEFAULT_FORMAT).toLowerCase();
  if (!SUPPORTED_FORMATS.has(format)) {
    usageError(`Unknown format: ${format}`);
  }

  const root = repoRoot();
  const specsDir = path.join(root, "specs");
  const cachePath = path.join(root, ".sdd-forge", "output", "metrics.json");

  let specsStat;
  try {
    specsStat = await fs.stat(specsDir);
  } catch (err) {
    throw new Error(`specs directory not found: ${specsDir}`);
  }
  if (!specsStat.isDirectory()) throw new Error(`specs path is not a directory: ${specsDir}`);

  const flowFiles = await listFlowFiles(specsDir);
  let rows;
  const canReuseCache = await isCacheFresh(cachePath, flowFiles);
  if (canReuseCache) {
    rows = await readCacheRows(cachePath);
  } else {
    rows = await buildRows(flowFiles);
    await writeCache(cachePath, rows);
  }

  process.stdout.write(`${render(rows, format)}\n`);
}

main().catch((err) => {
  process.stderr.write(`sdd-forge metrics token: ${err.message}\n`);
  process.exit(EXIT_ERROR);
});
