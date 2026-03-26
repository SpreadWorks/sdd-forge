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

export function copyFixtureInto(fixtureDir, dest, configOverrides) {
  copyDirSync(fixtureDir, dest);

  if (configOverrides) {
    const configPath = path.join(dest, ".sdd-forge", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    Object.assign(config, configOverrides);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  fs.mkdirSync(path.join(dest, ".sdd-forge", "output"), { recursive: true });
  fs.mkdirSync(path.join(dest, "docs"), { recursive: true });

  return dest;
}

/**
 * Copy a fixture directory to a temporary directory.
 *
 * @param {string} fixtureDir - Absolute path to fixture
 * @param {Object} [configOverrides] - Fields to merge into config.json
 * @returns {string} Absolute path to tmp dir
 */
export function copyFixture(fixtureDir, configOverrides) {
  const tmp = createTmpDir("acceptance-");
  return copyFixtureInto(fixtureDir, tmp, configOverrides);
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

export async function runPipeline(tmp) {
  const ctx = buildCtx(tmp);
  const steps = [];

  const { main: scanMain } = await import("../../../src/docs/commands/scan.js");
  steps.push(await runStep("scan", () => scanMain({ ...ctx })));

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

  const { main: initMain } = await import("../../../src/docs/commands/init.js");
  steps.push(await runStep("init", () => initMain({ ...ctx, force: true })));

  const { main: dataMain } = await import("../../../src/docs/commands/data.js");
  steps.push(await runStep("data", () => dataMain({ ...ctx })));

  if (ctx.agent) {
    const { main: textMain } = await import("../../../src/docs/commands/text.js");
    steps.push(await runStep("text", () =>
      textMain({ ...ctx, agentName: ctx.config.agent?.default }),
    ));
  } else {
    steps.push({ name: "text", status: "skipped", durationMs: 0 });
  }

  const { main: readmeMain } = await import("../../../src/docs/commands/readme.js");
  steps.push(await runStep("readme", () => readmeMain({ ...ctx })));

  return { ctx, steps };
}

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
