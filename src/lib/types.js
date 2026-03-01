/**
 * sdd-forge/lib/types.js
 *
 * JSDoc 型定義と config / context のバリデーション関数。
 */

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
 */

/**
 * @typedef {Object} SddConfig
 * @property {string} lang                    - 言語 ("ja" | "en")
 * @property {string} type                    - プロジェクト種別 ("php-mvc" | "node-cli" | ...)
 * @property {Object} [limits]                - 制限設定
 * @property {number} [limits.designTimeoutMs] - タイムアウト (ms)
 * @property {DocumentStyle} [documentStyle]  - 文書スタイル設定
 * @property {TextFillConfig} [textFill]      - text-fill 設定
 * @property {string} [defaultAgent]          - デフォルトエージェント名
 * @property {Object<string, AgentProvider>} [providers] - エージェント定義
 */

/**
 * @typedef {Object} SddContext
 * @property {string} [projectContext] - プロジェクト概要テキスト
 */

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

const VALID_TONES = new Set(["polite", "formal", "casual"]);

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

  // lang (必須)
  if (typeof raw.lang !== "string" || raw.lang.length === 0) {
    errors.push("'lang' is required and must be a non-empty string");
  }

  // type (必須)
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
