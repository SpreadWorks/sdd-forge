/**
 * sdd-forge/docs/lib/forge-prompts.js
 *
 * Prompt construction for the forge command.
 * Static text (role, rules) is loaded from prompts.json via i18n.
 */

import { createI18n } from "../../lib/i18n.js";

/**
 * summary.json (or full analysis) をプロンプト用テキストに変換する。
 * scan 時に生成される summary.json の構造を想定。
 *
 * @param {Object|null} summary - Parsed summary.json (or analysis.json fallback)
 * @returns {string} Summary text
 */
export function summaryToText(summary) {
  if (!summary) return "";
  const parts = [];
  if (summary.controllers) {
    const c = summary.controllers;
    parts.push(`Controllers: ${c.total} files, ${c.totalActions} actions`);
    if (c.top) {
      for (const ctrl of c.top) {
        const acts = ctrl.actions || [];
        parts.push(`  - ${ctrl.className}: ${acts.length} actions [${acts.slice(0, 5).join(", ")}${acts.length > 5 ? " ..." : ""}]`);
      }
    }
  }
  if (summary.models) {
    const m = summary.models;
    parts.push(`Models: ${m.total} files (fe=${m.feModels || 0}, logic=${m.logicModels || 0})`);
    if (m.dbGroups) {
      for (const [db, models] of Object.entries(m.dbGroups)) {
        parts.push(`  DB[${db}]: ${models.length} models`);
      }
    }
  }
  if (summary.shells) {
    const s = summary.shells;
    parts.push(`Shells: ${s.total} files`);
    if (s.items) {
      for (const sh of s.items) {
        parts.push(`  - ${sh.className}: [${(sh.methods || []).join(", ")}]`);
      }
    }
  }
  if (summary.routes) {
    parts.push(`Routes: ${summary.routes.total} explicit routes`);
  }
  if (summary.files) {
    parts.push(`Files: ${summary.files.summary?.total || 0} total`);
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

/**
 * Build the prompt for context update after review passes.
 *
 * @param {Object} params
 * @param {string} [params.lang]
 * @param {string} params.snippets - Document snippets text
 * @returns {string}
 */
export function buildContextUpdatePrompt({ lang, snippets }) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const instruction = t("forge.contextUpdatePrompt");
  return [instruction, "", snippets].join("\n");
}
