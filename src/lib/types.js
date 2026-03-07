/**
 * sdd-forge/lib/types.js
 *
 * JSDoc 型定義と config / context のバリデーション関数。
 */

import { buildTypeAliases } from "./presets.js";

// ---------------------------------------------------------------------------
// JSDoc 型定義
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} DocumentStyle
 * @property {string} purpose   - "developer-guide" | "user-guide" | "api-reference" | 自由文字列
 * @property {string} tone      - "polite" | "formal" | "casual"
 * @property {string} [customInstruction] - 任意の追加指示
 */

/**
 * @typedef {Object} PreamblePattern
 * @property {string} pattern - 正規表現パターン
 * @property {string} [flags] - 正規表現フラグ
 */

/**
 * @typedef {Object} TextFillConfig
 * @property {string} [projectContext]       - プロジェクト概要テキスト
 * @property {PreamblePattern[]} [preamblePatterns] - LLM 出力から除去するプレフィックスパターン
 */

/**
 * @typedef {Object} AgentProvider
 * @property {string} name       - 表示名
 * @property {string} command    - 実行コマンド
 * @property {string[]} args     - コマンド引数（{{PROMPT}} プレースホルダー対応）
 * @property {number} [timeoutMs] - タイムアウト (ms)
 * @property {string} [systemPromptFlag] - system prompt フラグ (例: "--system-prompt", "--system-prompt-file")
 */

/**
 * @typedef {Object} OutputConfig
 * @property {string[]} languages - Output languages (e.g. ["ja"], ["en", "ja"])
 * @property {string}   default   - Default output language
 * @property {"translate"|"generate"} [mode] - How non-default languages are produced
 */

/**
 * @typedef {Object} FlowConfig
 * @property {string} [merge] - Merge strategy: "squash" | "ff-only" | "merge" (default: "squash")
 */

/**
 * @typedef {Object} SddConfig
 * @property {string} [uiLang]                - UI language ("en" | "ja")
 * @property {OutputConfig} [output]          - Output language configuration
 * @property {string} lang                    - Output default language (= output.default)
 * @property {string} type                    - Project type ("webapp/cakephp2" | "cli" | ...)
 * @property {Object} [limits]                - Limit settings
 * @property {number} [limits.designTimeoutMs] - Timeout (ms)
 * @property {number} [limits.concurrency]    - Per-file concurrency (default: 5)
 * @property {DocumentStyle} [documentStyle]  - Document style settings
 * @property {TextFillConfig} [textFill]      - text-fill settings
 * @property {string} [defaultAgent]          - Default agent name
 * @property {Object<string, AgentProvider>} [providers] - Agent definitions
 * @property {FlowConfig} [flow]              - Flow configuration
 */

/**
 * @typedef {Object} SddContext
 * @property {string} [projectContext] - プロジェクト概要テキスト
 */

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const VALID_TONES = new Set(["polite", "formal", "casual"]);

/**
 * type 名 → 正規パスのエイリアスマップ。
 * 短縮名（例: "cakephp2"）を正規パス（例: "webapp/cakephp2"）に解決する。
 */
export const TYPE_ALIASES = buildTypeAliases();

/**
 * type 名をエイリアス解決する。エイリアスがなければそのまま返す。
 *
 * @param {string} type
 * @returns {string}
 */
export function resolveType(type) {
  return TYPE_ALIASES[type] || type;
}

// ---------------------------------------------------------------------------
// バリデーション
// ---------------------------------------------------------------------------

/**
 * config.json のバリデーション。不正時はエラー一覧をまとめて throw する。
 *
 * @param {*} raw - パース済み config オブジェクト
 * @returns {SddConfig} バリデーション済み config
 */
export function validateConfig(raw) {
  const errors = [];

  if (!raw || typeof raw !== "object") {
    throw new Error("config must be a non-null object");
  }

  // uiLang (optional)
  if (raw.uiLang != null && (typeof raw.uiLang !== "string" || raw.uiLang.length === 0)) {
    errors.push("'uiLang' must be a non-empty string if provided");
  }

  // output (optional, new structure)
  if (raw.output != null) {
    if (typeof raw.output !== "object") {
      errors.push("'output' must be an object");
    } else {
      if (!Array.isArray(raw.output.languages) || raw.output.languages.length === 0) {
        errors.push("'output.languages' must be a non-empty array");
      }
      if (typeof raw.output.default !== "string" || raw.output.default.length === 0) {
        errors.push("'output.default' must be a non-empty string");
      }
      if (Array.isArray(raw.output.languages) && typeof raw.output.default === "string") {
        if (!raw.output.languages.includes(raw.output.default)) {
          errors.push("'output.default' must be one of 'output.languages'");
        }
      }
      const validModes = new Set(["translate", "generate"]);
      if (raw.output.mode != null && !validModes.has(raw.output.mode)) {
        errors.push(`'output.mode' must be one of: ${[...validModes].join(", ")}`);
      }
    }
  }

  // lang (required)
  if (typeof raw.lang !== "string" || raw.lang.length === 0) {
    errors.push("'lang' is required and must be a non-empty string");
  }

  // type (required)
  if (typeof raw.type !== "string" || raw.type.length === 0) {
    errors.push("'type' is required and must be a non-empty string");
  }

  // documentStyle (省略可)
  if (raw.documentStyle != null) {
    const ds = raw.documentStyle;
    if (typeof ds !== "object") {
      errors.push("'documentStyle' must be an object");
    } else {
      if (typeof ds.purpose !== "string" || ds.purpose.length === 0) {
        errors.push("'documentStyle.purpose' must be a non-empty string");
      }
      if (typeof ds.tone !== "string" || !VALID_TONES.has(ds.tone)) {
        errors.push(`'documentStyle.tone' must be one of: ${[...VALID_TONES].join(", ")}`);
      }
      if (ds.customInstruction != null && typeof ds.customInstruction !== "string") {
        errors.push("'documentStyle.customInstruction' must be a string if provided");
      }
    }
  }

  // flow (省略可)
  if (raw.flow != null) {
    if (typeof raw.flow !== "object") {
      errors.push("'flow' must be an object");
    } else {
      const validMerge = new Set(["squash", "ff-only", "merge"]);
      if (raw.flow.merge != null && !validMerge.has(raw.flow.merge)) {
        errors.push(`'flow.merge' must be one of: ${[...validMerge].join(", ")}`);
      }
    }
  }

  // providers (省略可)
  if (raw.providers != null) {
    if (typeof raw.providers !== "object") {
      errors.push("'providers' must be an object");
    } else {
      for (const [key, prov] of Object.entries(raw.providers)) {
        if (typeof prov !== "object" || prov == null) {
          errors.push(`'providers.${key}' must be an object`);
          continue;
        }
        if (typeof prov.command !== "string" || prov.command.length === 0) {
          errors.push(`'providers.${key}.command' must be a non-empty string`);
        }
        if (!Array.isArray(prov.args)) {
          errors.push(`'providers.${key}.args' must be an array`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n  - ${errors.join("\n  - ")}`);
  }

  return /** @type {SddConfig} */ (raw);
}

/**
 * config から多言語出力設定を抽出する。
 * 単一言語の場合も統一的に扱えるようにする。
 *
 * @param {SddConfig} cfg
 * @returns {{ languages: string[], default: string, mode: "translate"|"generate", isMultiLang: boolean }}
 */
export function resolveOutputConfig(cfg) {
  const languages = cfg.output?.languages || [cfg.lang || "ja"];
  const defaultLang = cfg.output?.default || cfg.lang || "ja";
  const mode = cfg.output?.mode || "translate";
  return {
    languages,
    default: defaultLang,
    mode,
    isMultiLang: languages.length >= 2,
  };
}

/**
 * context.json のバリデーション。
 *
 * @param {*} raw - パース済み context オブジェクト
 * @returns {SddContext} バリデーション済み context
 */
export function validateContext(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("context must be a non-null object");
  }
  if (raw.projectContext != null && typeof raw.projectContext !== "string") {
    throw new Error("'projectContext' must be a string");
  }
  return /** @type {SddContext} */ (raw);
}
