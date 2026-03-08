/**
 * src/docs/lib/text-prompts.js
 *
 * {{text}} ディレクティブ処理用のプロンプト構築ユーティリティ。
 * text.js から分離。
 */

import { createI18n } from "../../lib/i18n.js";

/**
 * {{data}} カテゴリ名 → analysis.json の必要セクションへのマッピング。
 */
export const CATEGORY_TO_SECTIONS = {
  controllers:             (a) => ({ controllers: a.controllers }),
  "controllers.deps":      (a) => ({ controllers: a.controllers }),
  "controllers.csv":       (a) => ({ controllers: a.controllers }),
  "controllers.actions":   (a) => ({ titlesGraphMapping: a.extras?.titlesGraphMapping }),
  tables:                  (a) => ({ models: a.models }),
  "tables.fk":             (a) => ({ models: a.models }),
  "tables.sync":           (a) => ({ models: a.models }),
  "models.logic":          (a) => ({ logicClasses: a.extras?.logicClasses }),
  "models.logic.methods":  (a) => ({ logicClasses: a.extras?.logicClasses }),
  "models.relations":      (a) => ({ models: a.models }),
  "models.er":             (a) => ({ models: a.models }),
  shells:                  (a) => ({ shells: a.shells }),
  "shells.deps":           (a) => ({ shells: a.shells }),
  "shells.flow":           (a) => ({ shellDetails: a.extras?.shellDetails }),
  "config.stack":          ()  => ({}),
  "config.composer":       (a) => ({ composerDeps: a.extras?.composerDeps }),
  "config.assets":         (a) => ({ assets: a.extras?.assets }),
  "config.bootstrap":      (a) => ({ bootstrap: a.extras?.bootstrap }),
  "config.db":             (a) => ({ bootstrap: a.extras?.bootstrap }),
  "config.constants":      (a) => ({ constants: a.extras?.constants }),
  "config.constants.select":(a) => ({ constants: a.extras?.constants }),
  "config.auth":           (a) => ({ appController: a.extras?.appController }),
  "config.acl":            (a) => ({ acl: a.extras?.acl }),
  "views.helpers":         (a) => ({ helpers: a.extras?.helpers }),
  "views.layouts":         (a) => ({ layouts: a.extras?.layouts }),
  "views.elements":        (a) => ({ elements: a.extras?.elements }),
  "views.components":      (a) => ({ permissionComponent: a.extras?.permissionComponent }),
  libs:                    (a) => ({ libraries: a.extras?.libraries }),
  "libs.errors":           (a) => ({ libraries: a.extras?.libraries }),
  "libs.behaviors":        (a) => ({ behaviors: a.extras?.behaviors }),
  "libs.sql":              (a) => ({ sqlFiles: a.extras?.sqlFiles }),
  "libs.appmodel":         (a) => ({ appModel: a.extras?.appModel }),
  email:                   (a) => ({ emailNotifications: a.extras?.emailNotifications }),
  tests:                   (a) => ({ testStructure: a.extras?.testStructure }),
  docker:                  ()  => ({}),
};

/**
 * ファイル内の全ディレクティブから、{{text}} に必要なコンテキストデータを動的に収集する。
 */
export function getAnalysisContext(analysis, directives) {
  if (!analysis) return {};
  const data = {};

  if (analysis.controllers?.summary) data.controllersSummary = analysis.controllers.summary;
  if (analysis.models?.summary) data.modelsSummary = analysis.models.summary;
  if (analysis.shells?.summary) data.shellsSummary = analysis.shells.summary;
  if (analysis.routes?.summary) data.routesSummary = analysis.routes.summary;

  const dataFills = directives.filter((d) => d.type === "data");
  for (const d of dataFills) {
    const extractor = CATEGORY_TO_SECTIONS[d.category];
    if (extractor) {
      const section = extractor(analysis);
      for (const [key, value] of Object.entries(section)) {
        if (value != null && !(key in data)) {
          data[key] = value;
        }
      }
    }
  }

  if (analysis.extras) {
    for (const [key, value] of Object.entries(analysis.extras)) {
      if (!(key in data) && value != null) {
        if (Array.isArray(value)) {
          data[key] = { _count: value.length, _sample: value.slice(0, 3) };
        } else if (typeof value === "object") {
          data[key] = value;
        }
      }
    }
  }

  return data;
}

/**
 * documentStyle → プロンプトヘッダー行を生成する。
 */
export function buildPromptHeader(projectContext, documentStyle, lang) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const header = [];
  if (documentStyle) {
    const purposes = t.raw("text.purposes") || {};
    const tones = t.raw("text.tones") || {};
    const purposeLabel = purposes[documentStyle.purpose] || documentStyle.purpose;
    header.push(t("text.roleTemplate", { purpose: purposeLabel }));
    if (documentStyle.tone) {
      header.push(tones[documentStyle.tone] || documentStyle.tone);
    }
    if (documentStyle.customInstruction) {
      header.push("", documentStyle.customInstruction);
    }
  } else {
    header.push(t("text.defaultRole"));
  }
  if (projectContext) {
    header.push("", t("text.projectInfoHeading"), projectContext);
  }
  return header;
}

/**
 * ディレクティブの params から出力ルール文字列を生成する。
 */
export function formatLimitRule(params) {
  const parts = [];
  if (params?.maxLines) {
    parts.push(`max ${params.maxLines} lines`);
  }
  if (params?.maxChars) {
    parts.push(`max ${params.maxChars} chars`);
  }
  if (parts.length > 0) {
    return `Concise and accurate (${parts.join(", ")})`;
  }
  return "Concise and accurate (3–15 lines)";
}

/**
 * システムプロンプトを構築する。
 */
/** Map of language codes to display names for output language instruction. */
const LANG_NAMES = {
  en: "English", ja: "Japanese", zh: "Chinese", ko: "Korean",
  fr: "French", de: "German", es: "Spanish", pt: "Portuguese",
  it: "Italian", ru: "Russian",
};

export function buildTextSystemPrompt(projectContext, documentStyle, lang) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const header = buildPromptHeader(projectContext, documentStyle, lang);
  const outputRules = t.raw("text.outputRules") || [];
  const langName = LANG_NAMES[lang] || lang;
  return [
    ...header,
    "",
    t("text.instruction"),
    "",
    "## Output Rules (strict)",
    `- Write all output in ${langName}`,
    ...outputRules.map((r) => `- ${r}`),
  ].join("\n");
}

/**
 * 個別ディレクティブ用プロンプトを構築する。
 */
export function buildPrompt(directive, fileName, lines) {
  const directiveLine = directive.line;
  const contextStart = Math.max(0, directiveLine - 20);
  const contextEnd = Math.min(lines.length, directiveLine + 21);
  const surroundingLines = lines.slice(contextStart, contextEnd).join("\n");

  return [
    "## Instructions",
    directive.prompt,
    "",
    `- ${formatLimitRule(directive.params)}`,
    "",
    `## Insertion Context (${fileName})`,
    surroundingLines,
  ].join("\n");
}

/**
 * 解析データをシステムプロンプトに付与する。
 */
export function buildFileSystemPrompt(baseSystemPrompt, contextData, lang) {
  if (!contextData || Object.keys(contextData).length === 0) {
    return baseSystemPrompt;
  }
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const contextJson = JSON.stringify(contextData, null, 2);
  const truncatedJson = contextJson.length > 8000
    ? contextJson.slice(0, 8000) + "\n... (truncated)"
    : contextJson;
  return baseSystemPrompt + "\n\n" + t("text.analysisDataHeading") + "\n" + truncatedJson;
}

/**
 * バッチプロンプトを構築する。
 */
export function buildBatchPrompt(fileName, text, textFills, lang) {
  const t = createI18n(lang || "ja", { domain: "prompts" });
  const batchRules = t.raw("text.batchRules") || [];

  const perDirectiveRules = [];
  for (const d of textFills) {
    if (d.params && (d.params.maxLines || d.params.maxChars)) {
      perDirectiveRules.push(`- "${d.prompt.slice(0, 40)}..." → ${formatLimitRule(d.params)}`);
    }
  }
  const defaultRule = perDirectiveRules.length === textFills.length
    ? ""
    : `- ${t("text.batchDefaultLimit")}`;

  return [
    t("text.batchInstruction", { fileName }),
    "",
    "## Output Rules (strict)",
    ...batchRules.map((r) => `- ${r}`),
    ...(defaultRule ? [defaultRule] : []),
    ...perDirectiveRules,
    `- ${t("text.batchNoHr")}`,
    "",
    `## ${fileName}`,
    "",
    text,
  ].join("\n");
}
