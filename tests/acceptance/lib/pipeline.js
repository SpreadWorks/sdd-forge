/**
 * tests/acceptance/lib/pipeline.js
 *
 * Runs the sdd-forge pipeline (scan → enrich → init → data → text → readme)
 * against a fixture project using in-process main() calls.
 */

import fs from "fs";
import path from "path";
import { createTmpDir, removeTmpDir } from "../../helpers/tmp-dir.js";
import { validateConfig } from "../../../src/lib/types.js";
import { loadJsonFile } from "../../../src/lib/config.js";
import { resolveAgent } from "../../../src/lib/agent.js";
import { createI18n } from "../../../src/lib/i18n.js";
import { resolveChaptersOrder } from "../../../src/docs/lib/template-merger.js";

/**
 * Copy a fixture directory to a temporary directory.
 *
 * @param {string} fixtureDir - Absolute path to fixture
 * @param {Object} [configOverrides] - Fields to merge into config.json
 * @returns {string} Absolute path to tmp dir
 */
export function copyFixture(fixtureDir, configOverrides) {
  const tmp = createTmpDir("acceptance-");
  copyDirSync(fixtureDir, tmp);

  if (configOverrides) {
    const configPath = path.join(tmp, ".sdd-forge", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    Object.assign(config, configOverrides);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  // Ensure output directory exists
  const outputDir = path.join(tmp, ".sdd-forge", "output");
  fs.mkdirSync(outputDir, { recursive: true });

  // Ensure docs directory exists
  const docsDir = path.join(tmp, "docs");
  fs.mkdirSync(docsDir, { recursive: true });

  return tmp;
}

/**
 * Build a command context object compatible with resolveCommandContext() output.
 */
export function buildCtx(tmp) {
  const configPath = path.join(tmp, ".sdd-forge", "config.json");
  const config = validateConfig(loadJsonFile(configPath));
  const lang = config.lang || "en";
  const outputLang = config.docs?.defaultLanguage || lang;
  const type = config.type || "base";
  const docsDir = path.join(tmp, "docs");
  const agent = resolveAgent(config, undefined);
  const t = createI18n(lang, { domain: "messages" });

  return {
    root: tmp,
    srcRoot: tmp,
    config,
    lang,
    outputLang,
    type,
    docsDir,
    agent,
    t,
  };
}

/**
 * Run a single pipeline step with timing and status tracking.
 *
 * @param {string} name - Step name
 * @param {() => Promise<void>} fn - Step function
 * @returns {Promise<{ name: string, status: string, durationMs: number }>}
 */
async function runStep(name, fn) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round(performance.now() - start);
    console.log(`  [pipeline] ${name}: ok (${durationMs}ms)`);
    return { name, status: "ok", durationMs };
  } catch (e) {
    const durationMs = Math.round(performance.now() - start);
    console.error(`  [pipeline] ${name}: error (${durationMs}ms) — ${e.message}`);
    throw Object.assign(e, { stepResult: { name, status: "error", durationMs } });
  }
}

/**
 * Run the full pipeline on a fixture in a tmp directory.
 *
 * @param {string} tmp - Absolute path to tmp project
 * @returns {Promise<{ ctx: Object, steps: { name: string, status: string, durationMs: number }[] }>}
 */
export async function runPipeline(tmp) {
  const ctx = buildCtx(tmp);
  const steps = [];

  // 1. scan
  const { main: scanMain } = await import("../../../src/docs/commands/scan.js");
  steps.push(await runStep("scan", () => scanMain({ ...ctx })));

  // 2. enrich (non-fatal — AI response parsing may fail intermittently)
  if (ctx.agent) {
    const { main: enrichMain } = await import("../../../src/docs/commands/enrich.js");
    try {
      steps.push(await runStep("enrich", () =>
        enrichMain({ ...ctx, agentName: ctx.config.agent?.default }),
      ));
    } catch (e) {
      steps.push(e.stepResult);
      console.error(`[acceptance] enrich warning: continuing without enrichment`);
    }
  } else {
    steps.push({ name: "enrich", status: "skipped", durationMs: 0 });
  }

  // 3. init
  const { main: initMain } = await import("../../../src/docs/commands/init.js");
  steps.push(await runStep("init", () => initMain({ ...ctx, force: true })));

  // 4. data
  const { main: dataMain } = await import("../../../src/docs/commands/data.js");
  steps.push(await runStep("data", () => dataMain({ ...ctx })));

  // 5. text
  if (ctx.agent) {
    const { main: textMain } = await import("../../../src/docs/commands/text.js");
    steps.push(await runStep("text", () =>
      textMain({ ...ctx, agentName: ctx.config.agent?.default }),
    ));
  } else {
    steps.push({ name: "text", status: "skipped", durationMs: 0 });
  }

  // 6. readme
  const { main: readmeMain } = await import("../../../src/docs/commands/readme.js");
  steps.push(await runStep("readme", () => readmeMain({ ...ctx })));

  return { ctx, steps };
}

/**
 * Recursively copy a directory.
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export { removeTmpDir };
