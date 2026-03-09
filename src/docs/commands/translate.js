#!/usr/bin/env node
/**
 * src/docs/commands/translate.js
 *
 * Translate default-language documents to non-default languages.
 * Compares mtime of source vs target file; re-translates only when needed.
 *
 * Usage:
 *   sdd-forge translate [--dry-run] [--force] [--lang <lang>]
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { parseArgs } from "../../lib/cli.js";
import { resolveOutputConfig } from "../../lib/types.js";
import { callAgentAsync, LONG_AGENT_TIMEOUT_MS } from "../../lib/agent.js";
import { createLogger } from "../../lib/progress.js";
import { resolveCommandContext, getChapterFiles, stripResponsePreamble } from "../lib/command-context.js";

const logger = createLogger("translate");
const DEFAULT_TIMEOUT_MS = LONG_AGENT_TIMEOUT_MS;

/**
 * Translate a Markdown document from one language to another via AI agent.
 *
 * @param {string} content - Source document content
 * @param {string} fromLang - Source language code
 * @param {string} toLang - Target language code
 * @param {Object} agent - Agent config
 * @param {string} root - Project root
 * @returns {Promise<string>} Translated content
 */
async function translateDocument(content, fromLang, toLang, agent, root) {
  const systemPrompt = [
    `You are a professional technical document translator.`,
    `Translate the following Markdown document from ${fromLang} to ${toLang}.`,
    "",
    "Rules:",
    "- Preserve ALL Markdown formatting (headings, tables, code blocks, links)",
    "- Preserve ALL directives exactly as-is: <!-- {{data: ...}} -->, <!-- {{text: ...}} -->, <!-- {{/data}} -->",
    "- Translate prose content, headings, and descriptions naturally",
    "- Keep code snippets, file paths, command names, and technical terms unchanged",
    "- Maintain the same document structure and line count where possible",
    "- Output ONLY the translated document, no commentary",
  ].join("\n");

  const prompt = content;

  const result = await callAgentAsync(agent, prompt, DEFAULT_TIMEOUT_MS, root, {
    systemPrompt,
  });

  if (!result || result.trim().length === 0) {
    throw new Error("Empty translation response");
  }

  return stripResponsePreamble(result, 5);
}

/**
 * Check if source file is newer than target file.
 */
function needsTranslation(sourcePath, targetPath) {
  if (!fs.existsSync(targetPath)) return true;
  const srcMtime = fs.statSync(sourcePath).mtimeMs;
  const tgtMtime = fs.statSync(targetPath).mtimeMs;
  return srcMtime > tgtMtime;
}

async function main(ctx) {
  if (!ctx) {
    const cli = parseArgs(process.argv.slice(2), {
      flags: ["--dry-run", "--force"],
      options: ["--lang"],
      defaults: { dryRun: false, force: false, lang: "" },
    });

    if (cli.help) {
      const { loadLang } = await import("../../lib/config.js");
      const { createI18n } = await import("../../lib/i18n.js");
      const { repoRoot } = await import("../../lib/cli.js");
      const tu = createI18n(loadLang(repoRoot()));
      const h = tu.raw("help.cmdHelp.translate");
      const o = h.options;
      console.log([h.usage, "", `  ${h.desc}`, "", "Options:", `  ${o.lang}`, `  ${o.force}`, `  ${o.dryRun}`, `  ${o.help}`].join("\n"));
      return;
    }

    ctx = resolveCommandContext(cli);
    ctx.dryRun = cli.dryRun;
    ctx.force = cli.force;
    ctx.targetLang = cli.lang;
  }

  const { root, config: cfg, docsDir, t } = ctx;
  const outputCfg = resolveOutputConfig(cfg);

  if (!outputCfg.isMultiLang) {
    logger.log("Single language configured. Nothing to translate.");
    return;
  }

  if (outputCfg.mode !== "translate") {
    logger.log(`Output mode is '${outputCfg.mode}', not 'translate'. Use 'sdd-forge build' for generate mode.`);
    return;
  }

  if (!ctx.agent) {
    throw new Error("No agent configured. Set 'defaultAgent' in config.json.");
  }
  const agent = ctx.agent;

  const defaultLang = outputCfg.default;
  const targetLangs = ctx.targetLang
    ? [ctx.targetLang]
    : outputCfg.languages.filter((l) => l !== defaultLang);

  if (!fs.existsSync(docsDir)) {
    throw new Error("docs/ directory not found. Run 'sdd-forge init' first.");
  }

  // Collect source files
  const sourceFiles = getChapterFiles(docsDir);

  // Also include README.md if it exists
  const readmePath = path.join(root, "README.md");
  const hasReadme = fs.existsSync(readmePath);

  let totalTranslated = 0;
  let totalSkipped = 0;

  for (const lang of targetLangs) {
    const langDir = path.join(docsDir, lang);
    if (!ctx.dryRun) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    logger.log(`Translating to ${lang}...`);

    // Translate chapter files
    for (const file of sourceFiles) {
      const sourcePath = path.join(docsDir, file);
      const targetPath = path.join(langDir, file);

      if (!ctx.force && !needsTranslation(sourcePath, targetPath)) {
        logger.verbose(`SKIP (up-to-date): ${lang}/${file}`);
        totalSkipped++;
        continue;
      }

      if (ctx.dryRun) {
        logger.log(`DRY-RUN: would translate ${file} → ${lang}/${file}`);
        totalSkipped++;
        continue;
      }

      logger.verbose(`Translating: ${file} → ${lang}/${file}`);
      const content = fs.readFileSync(sourcePath, "utf8");

      try {
        const translated = await translateDocument(content, defaultLang, lang, agent, root);
        fs.writeFileSync(targetPath, translated, "utf8");
        totalTranslated++;
        logger.verbose(`DONE: ${lang}/${file}`);
      } catch (err) {
        logger.log(`ERROR translating ${file} to ${lang}: ${err.message}`);
      }
    }

    // Translate README.md
    if (hasReadme) {
      const targetReadme = path.join(langDir, "README.md");
      if (ctx.force || needsTranslation(readmePath, targetReadme)) {
        if (ctx.dryRun) {
          logger.log(`DRY-RUN: would translate README.md → ${lang}/README.md`);
        } else {
          logger.verbose(`Translating: README.md → ${lang}/README.md`);
          const content = fs.readFileSync(readmePath, "utf8");
          try {
            const translated = await translateDocument(content, defaultLang, lang, agent, root);
            fs.writeFileSync(targetReadme, translated, "utf8");
            totalTranslated++;
          } catch (err) {
            logger.log(`ERROR translating README.md to ${lang}: ${err.message}`);
          }
        }
      } else {
        totalSkipped++;
      }
    }
  }

  logger.log(`Done. ${totalTranslated} file(s) translated, ${totalSkipped} skipped.`);
}

export { main };

runIfDirect(import.meta.url, main);
