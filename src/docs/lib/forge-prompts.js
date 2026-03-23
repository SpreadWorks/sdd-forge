/**
 * sdd-forge/docs/lib/forge-prompts.js
 *
 * Prompt construction for the forge command.
 * Static text (role, rules) is loaded from prompts.json via i18n.
 */

import { createI18n } from "../../lib/i18n.js";

const ANALYSIS_META_KEYS = new Set(["analyzedAt", "enrichedAt", "generatedAt", "files", "root"]);

/**
 * analysis.json をプロンプト用テキストに変換する。
 * enrichedAt がある場合は enriched entries の summary を使用する。
 *
 * @param {Object|null} analysis - Parsed analysis.json
 * @returns {string} Summary text
 */
export function summaryToText(analysis) {
  if (!analysis) return "";

  // Enriched mode: collect summary from all enriched entries
  if (analysis.enrichedAt) {
    return enrichedSummaryToText(analysis);
  }

  // Legacy fallback: structured summary fields
  const parts = [];
  if (analysis.controllers) {
    const c = analysis.controllers;
    parts.push(`Controllers: ${c.total} files, ${c.totalActions} actions`);
    if (c.top) {
      for (const ctrl of c.top) {
        const acts = ctrl.actions || [];
        parts.push(`  - ${ctrl.className}: ${acts.length} actions [${acts.slice(0, 5).join(", ")}${acts.length > 5 ? " ..." : ""}]`);
      }
    }
  }
  if (analysis.models) {
    const m = analysis.models;
    parts.push(`Models: ${m.total} files (fe=${m.feModels || 0}, logic=${m.logicModels || 0})`);
    if (m.dbGroups) {
      for (const [db, models] of Object.entries(m.dbGroups)) {
        parts.push(`  DB[${db}]: ${models.length} models`);
      }
    }
  }
  if (analysis.commands) {
    const c = analysis.commands;
    parts.push(`Commands: ${c.total} files`);
    if (c.items) {
      for (const cmd of c.items) {
        parts.push(`  - ${cmd.className}: [${(cmd.methods || []).join(", ")}]`);
      }
    }
  }
  if (analysis.routes) {
    parts.push(`Routes: ${analysis.routes.total} explicit routes`);
  }
  if (analysis.files) {
    parts.push(`Files: ${analysis.files.summary?.total || 0} total`);
  }
  return parts.join("\n");
}

/**
 * enriched analysis から全カテゴリの summary を収集してテキスト化する。
 *
 * @param {Object} analysis - Enriched analysis.json
 * @returns {string}
 */
function enrichedSummaryToText(analysis) {
  const parts = [];

  for (const cat of Object.keys(analysis)) {
    if (ANALYSIS_META_KEYS.has(cat)) continue;
    const data = analysis[cat];
    if (!data || typeof data !== "object") continue;
    const items = data[cat];
    if (!Array.isArray(items)) continue;

    const enrichedItems = items.filter((item) => item.summary);
    if (enrichedItems.length === 0) continue;

    parts.push(`${cat} (${enrichedItems.length} entries):`);
    for (const item of enrichedItems) {
      const name = item.file || item.name || item.className || "unknown";
      parts.push(`  - ${name}: ${item.summary}`);
    }
  }

  return parts.join("\n");
}

/**
 * Build the system prompt (shared across all files in a round).
 * Contains: role, rules, user request, spec, analysis summary.
 *
 * @param {Object} params
 * @param {string} [params.lang] - Locale (default: "ja")
 * @param {string} params.userPrompt
 * @param {string} [params.specPath]
 * @param {string} [params.specText]
 * @param {string} [params.analysisSummary]
 * @returns {string}
 */
export function buildForgeSystemPrompt({ lang, userPrompt, specPath, specText, analysisSummary }) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const role = t("forge.systemRole");
  const rules = t.raw("forge.rules") || [];

  const specBlock = specPath
    ? ["[SPEC_PATH]", specPath, "", "[SPEC_CONTENT]", specText || "(empty)", ""]
    : [];
  return [
    role,
    "",
    "[USER_PROMPT]",
    userPrompt,
    "",
    ...specBlock,
    "[RULES]",
    ...rules.map((r) => `- ${r}`),
    "",
    ...(analysisSummary ? ["[SOURCE_ANALYSIS]", analysisSummary, ""] : []),
  ].join("\n");
}

/**
 * Build the user prompt for a single file.
 *
 * @param {Object} params
 * @param {string} [params.lang]
 * @param {string} params.targetFile
 * @param {number} params.round
 * @param {number} params.maxRuns
 * @param {string} [params.reviewFeedback]
 * @returns {string}
 */
export function buildForgeFilePrompt({ lang, targetFile, round, maxRuns, reviewFeedback }) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const noFeedback = t("forge.noFeedback");
  return [
    `round: ${round}/${maxRuns}`,
    "",
    "[TARGET_FILE]",
    targetFile,
    "",
    "[PREVIOUS_REVIEW_FEEDBACK]",
    reviewFeedback || noFeedback,
  ].join("\n");
}

/**
 * Build a combined prompt (for providers without system prompt support).
 *
 * @param {Object} params
 * @param {string} [params.lang]
 * @param {string} params.userPrompt
 * @param {number} params.round
 * @param {number} params.maxRuns
 * @param {string} [params.reviewFeedback]
 * @param {string} [params.specPath]
 * @param {string} [params.specText]
 * @param {string} [params.analysisSummary]
 * @param {string[]} params.targetFiles
 * @returns {string}
 */
export function buildForgePrompt({ lang, userPrompt, round, maxRuns, reviewFeedback, specPath, specText, analysisSummary, targetFiles }) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const role = t("forge.systemRole");
  const rules = t.raw("forge.rules") || [];
  const noFeedback = t("forge.noFeedback");

  const files = targetFiles.map((f) => `- ${f}`).join("\n");
  const specBlock = specPath
    ? ["[SPEC_PATH]", specPath, "", "[SPEC_CONTENT]", specText || "(empty)", ""]
    : [];
  return [
    role,
    "",
    `round: ${round}/${maxRuns}`,
    "",
    "[USER_PROMPT]",
    userPrompt,
    "",
    ...specBlock,
    "[TARGET_FILES]",
    files,
    "",
    "[RULES]",
    ...rules.map((r) => `- ${r}`),
    "",
    ...(analysisSummary ? ["[SOURCE_ANALYSIS]", analysisSummary, ""] : []),
    "[PREVIOUS_REVIEW_FEEDBACK]",
    reviewFeedback || noFeedback,
  ].join("\n");
}

