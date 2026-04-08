/**
 * sdd-forge/lib/types.js
 *
 * JSDoc 型定義と config / context のバリデーション関数。
 */

import { BUILTIN_PROVIDERS } from "./agent.js";

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
 * @typedef {Object} AgentProvider
 * @property {string} name       - 表示名
 * @property {string} command    - 実行コマンド
 * @property {string[]} args     - コマンド引数（{{PROMPT}} プレースホルダー対応）
 * @property {number} [timeoutMs] - タイムアウト (ms)
 * @property {string} [systemPromptFlag] - system prompt フラグ (例: "--system-prompt", "--system-prompt-file")
 * @property {string} [jsonOutputFlag] - JSON 出力フラグ (例: "--output-format json" for claude, "--json" for codex)
 */

/**
 * @typedef {Object} DocsConfig
 * @property {string[]} languages            - Output languages (e.g. ["ja"], ["en", "ja"])
 * @property {string}   defaultLanguage      - Default output language
 * @property {"translate"|"generate"} [mode] - How non-default languages are produced
 * @property {DocumentStyle} [style]         - Document style settings
 * (enrichBatchSize/enrichBatchLines removed — replaced by agent.batchTokenLimit)
 */

/**
 * @typedef {Object} FlowPushConfig
 * @property {string} [remote] - Push remote name (default: "origin")
 */

/**
 * @typedef {Object} FlowConfig
 * @property {string} [merge] - Merge strategy: "squash" | "ff-only" | "merge" (default: "squash")
 * @property {FlowPushConfig} [push] - Push configuration
 */

/**
 * @typedef {Object} CommandsConfig
 * @property {"enable"|"disable"} [gh] - GitHub CLI availability (default: "disable")
 */

/**
 * @typedef {Object} AgentConfig
 * @property {string} [default]              - Default agent provider name
 * @property {string} [workDir]              - Working directory for agent execution
 * @property {number} [timeout]              - Agent execution timeout in seconds
 * @property {number} [retryCount]           - Retry count for docs enrich agent calls
 * @property {Object<string, AgentProvider>} [providers] - Agent provider definitions
 * @property {Object<string, Object<string, string>>} [profiles] - Named profiles mapping commandId prefixes to provider keys
 */

/**
 * @typedef {Object} LogsConfig
 * @property {boolean} [enabled] - Enable unified JSONL logging (default: false)
 * @property {string}  [dir]     - Log output directory (default: {agent.workDir}/logs)
 */

/**
 * @typedef {Object} SddConfig
 * @property {string} [name]                 - Project name (optional, set by setup wizard)
 * @property {DocsConfig} docs               - Documentation configuration (required)
 * @property {string} lang                   - Operating language for CLI, AGENTS.md, skills, specs
 * @property {string|string[]} type          - Preset name(s) (e.g. "symfony" or ["symfony", "postgres"])
 * @property {number} [concurrency]          - Per-file concurrency (default: 5)
 * @property {AgentConfig} [agent]           - AI agent invocation settings
 * @property {FlowConfig} [flow]             - Flow configuration
 * @property {CommandsConfig} [commands]     - External command availability
 * @property {LogsConfig} [logs]             - Logging configuration
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

  // docs (required)
  if (raw.docs == null || typeof raw.docs !== "object") {
    errors.push("'docs' is required and must be an object");
  } else {
    if (!Array.isArray(raw.docs.languages) || raw.docs.languages.length === 0) {
      errors.push("'docs.languages' must be a non-empty array");
    }
    if (typeof raw.docs.defaultLanguage !== "string" || raw.docs.defaultLanguage.length === 0) {
      errors.push("'docs.defaultLanguage' must be a non-empty string");
    }
    if (Array.isArray(raw.docs.languages) && typeof raw.docs.defaultLanguage === "string") {
      if (!raw.docs.languages.includes(raw.docs.defaultLanguage)) {
        errors.push("'docs.defaultLanguage' must be one of 'docs.languages'");
      }
    }
    const validModes = new Set(["translate", "generate"]);
    if (raw.docs.mode != null && !validModes.has(raw.docs.mode)) {
      errors.push(`'docs.mode' must be one of: ${[...validModes].join(", ")}`);
    }

    // docs.style (省略可)
    if (raw.docs.style != null) {
      const ds = raw.docs.style;
      if (typeof ds !== "object") {
        errors.push("'docs.style' must be an object");
      } else {
        if (typeof ds.purpose !== "string" || ds.purpose.length === 0) {
          errors.push("'docs.style.purpose' must be a non-empty string");
        }
        if (typeof ds.tone !== "string" || !VALID_TONES.has(ds.tone)) {
          errors.push(`'docs.style.tone' must be one of: ${[...VALID_TONES].join(", ")}`);
        }
        if (ds.customInstruction != null && typeof ds.customInstruction !== "string") {
          errors.push("'docs.style.customInstruction' must be a string if provided");
        }
      }
    }

    // docs.exclude (省略可)
    if (raw.docs.exclude != null) {
      if (!Array.isArray(raw.docs.exclude)) {
        errors.push("'docs.exclude' must be an array of glob pattern strings");
      } else if (raw.docs.exclude.some((e) => typeof e !== "string")) {
        errors.push("'docs.exclude' entries must be strings");
      }
    }
  }

  // lang (required)
  if (typeof raw.lang !== "string" || raw.lang.length === 0) {
    errors.push("'lang' is required and must be a non-empty string");
  }

  // type (required — string or non-empty string[])
  if (typeof raw.type === "string") {
    if (raw.type.length === 0) {
      errors.push("'type' must be a non-empty string");
    }
  } else if (Array.isArray(raw.type)) {
    if (raw.type.length === 0) {
      errors.push("'type' array must not be empty");
    } else if (raw.type.some((t) => typeof t !== "string" || t.length === 0)) {
      errors.push("'type' array entries must be non-empty strings");
    }
  } else {
    errors.push("'type' is required and must be a string or string[]");
  }

  // concurrency (省略可)
  if (raw.concurrency != null && (typeof raw.concurrency !== "number" || raw.concurrency < 1)) {
    errors.push("'concurrency' must be a positive number if provided");
  }

  // chapters (省略可 — オブジェクト配列形式)
  if (raw.chapters != null) {
    if (!Array.isArray(raw.chapters)) {
      errors.push("'chapters' must be an array. Run 'sdd-forge upgrade' to migrate.");
    } else {
      for (let i = 0; i < raw.chapters.length; i++) {
        const entry = raw.chapters[i];
        if (typeof entry === "string") {
          errors.push(`'chapters' format has changed. Run 'sdd-forge upgrade' to migrate automatically.`);
          break;
        }
        if (typeof entry !== "object" || entry === null) {
          errors.push(`'chapters[${i}]' must be an object with { chapter: "name.md" }`);
          continue;
        }
        if (typeof entry.chapter !== "string") {
          errors.push(`'chapters[${i}].chapter' must be a string`);
        }
        if (entry.desc != null && typeof entry.desc !== "string") {
          errors.push(`'chapters[${i}].desc' must be a string if provided`);
        }
        if (entry.exclude != null && typeof entry.exclude !== "boolean") {
          errors.push(`'chapters[${i}].exclude' must be a boolean if provided`);
        }
      }
    }
  }

  // agent.workDir (省略可)
  if (raw.agent?.workDir != null && typeof raw.agent.workDir !== "string") {
    errors.push("'agent.workDir' must be a string if provided");
  }

  // agent.timeout (省略可)
  if (raw.agent?.timeout != null && (typeof raw.agent.timeout !== "number" || raw.agent.timeout < 1)) {
    errors.push("'agent.timeout' must be a positive number if provided");
  }

  // agent.retryCount (省略可)
  if (raw.agent?.retryCount != null && (typeof raw.agent.retryCount !== "number" || raw.agent.retryCount < 1)) {
    errors.push("'agent.retryCount' must be a positive number if provided");
  }

  // agent.batchTokenLimit (省略可)
  if (raw.agent?.batchTokenLimit != null && (typeof raw.agent.batchTokenLimit !== "number" || raw.agent.batchTokenLimit < 1000)) {
    errors.push("'agent.batchTokenLimit' must be a number >= 1000 if provided");
  }

  // scan (省略可)
  if (raw.scan != null) {
    if (typeof raw.scan !== "object") {
      errors.push("'scan' must be an object");
    } else {
      if (!Array.isArray(raw.scan.include) || raw.scan.include.length === 0) {
        errors.push("'scan.include' must be a non-empty array of strings");
      }
      if (raw.scan.exclude != null && !Array.isArray(raw.scan.exclude)) {
        errors.push("'scan.exclude' must be an array of strings if provided");
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
      if (raw.flow.push != null) {
        if (typeof raw.flow.push !== "object") {
          errors.push("'flow.push' must be an object");
        } else {
          if (raw.flow.push.remote != null && typeof raw.flow.push.remote !== "string") {
            errors.push("'flow.push.remote' must be a string if provided");
          }
        }
      }
      const searchMode = raw.flow.commands?.context?.search?.mode;
      if (searchMode != null) {
        const validSearchModes = new Set(["ngram", "ai"]);
        if (!validSearchModes.has(searchMode)) {
          errors.push(`'flow.commands.context.search.mode' must be one of: ${[...validSearchModes].join(", ")}`);
        }
      }
    }
  }

  // commands (省略可)
  if (raw.commands != null) {
    if (typeof raw.commands !== "object") {
      errors.push("'commands' must be an object");
    } else {
      const validGh = new Set(["enable", "disable"]);
      if (raw.commands.gh != null && !validGh.has(raw.commands.gh)) {
        errors.push(`'commands.gh' must be one of: ${[...validGh].join(", ")}`);
      }
    }
  }

  // experimental (省略可)
  if (raw.experimental != null) {
    if (typeof raw.experimental !== "object") {
      errors.push("'experimental' must be an object");
    } else if (raw.experimental.workflow != null) {
      const wf = raw.experimental.workflow;
      if (typeof wf !== "object") {
        errors.push("'experimental.workflow' must be an object");
      } else {
        if (wf.enable != null && typeof wf.enable !== "boolean") {
          errors.push("'experimental.workflow.enable' must be a boolean if provided");
        }
        if (wf.languages != null) {
          if (typeof wf.languages !== "object") {
            errors.push("'experimental.workflow.languages' must be an object");
          } else {
            if (wf.languages.source != null && typeof wf.languages.source !== "string") {
              errors.push("'experimental.workflow.languages.source' must be a string if provided");
            }
            if (wf.languages.publish != null && typeof wf.languages.publish !== "string") {
              errors.push("'experimental.workflow.languages.publish' must be a string if provided");
            }
          }
        }
      }
    }
  }

  // logs (省略可)
  if (raw.logs != null) {
    if (typeof raw.logs !== "object") {
      errors.push("'logs' must be an object");
    } else {
      if (raw.logs.enabled != null && typeof raw.logs.enabled !== "boolean") {
        errors.push("'logs.enabled' must be a boolean if provided");
      }
      if (raw.logs.dir != null && typeof raw.logs.dir !== "string") {
        errors.push("'logs.dir' must be a string if provided");
      }
    }
  }

  // agent.providers (省略可)
  if (raw.agent?.providers != null) {
    if (typeof raw.agent.providers !== "object") {
      errors.push("'agent.providers' must be an object");
    } else {
      for (const [key, prov] of Object.entries(raw.agent.providers)) {
        if (typeof prov !== "object" || prov == null) {
          errors.push(`'agent.providers.${key}' must be an object`);
          continue;
        }
        if (typeof prov.command !== "string" || prov.command.length === 0) {
          errors.push(`'agent.providers.${key}.command' must be a non-empty string`);
        }
        if (!Array.isArray(prov.args)) {
          errors.push(`'agent.providers.${key}.args' must be an array`);
        }
      }
    }
  }

  // agent.profiles (省略可)
  if (raw.agent?.profiles != null) {
    if (typeof raw.agent.profiles !== "object" || Array.isArray(raw.agent.profiles)) {
      errors.push("'agent.profiles' must be an object");
    } else {
      const allProviders = { ...BUILTIN_PROVIDERS, ...(raw.agent?.providers || {}) };
      for (const [profileName, profile] of Object.entries(raw.agent.profiles)) {
        if (typeof profile !== "object" || profile == null || Array.isArray(profile)) {
          errors.push(`'agent.profiles.${profileName}' must be an object`);
          continue;
        }
        for (const [commandId, providerKey] of Object.entries(profile)) {
          if (typeof providerKey !== "string") {
            errors.push(`'agent.profiles.${profileName}.${commandId}' must be a string`);
          } else if (!allProviders[providerKey]) {
            errors.push(`'agent.profiles.${profileName}.${commandId}': unknown provider "${providerKey}"`);
          }
        }
      }
    }
  }

  // agent.useProfile (省略可)
  if (raw.agent?.useProfile != null) {
    if (typeof raw.agent.useProfile !== "string") {
      errors.push("'agent.useProfile' must be a string");
    } else if (raw.agent.profiles && !raw.agent.profiles[raw.agent.useProfile]) {
      errors.push(`'agent.useProfile': profile "${raw.agent.useProfile}" is not defined in agent.profiles`);
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
  const languages = cfg.docs.languages;
  const defaultLang = cfg.docs.defaultLanguage;
  const mode = cfg.docs.mode || "translate";
  return {
    languages,
    default: defaultLang,
    mode,
    isMultiLang: languages.length >= 2,
  };
}
