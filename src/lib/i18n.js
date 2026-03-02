/**
 * sdd-forge/lib/i18n.js
 *
 * Internationalization module.
 * Loads locale-specific message files and provides a translation function.
 *
 * Usage:
 *   import { createI18n } from "../lib/i18n.js";
 *   const t = createI18n("ja");
 *   console.log(t("setup.title"));
 *   console.log(t("setup.greet", { name: "SDD" }));
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_LOCALE_DIR = path.resolve(__dirname, "..", "templates", "locale");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a dot-separated key from a nested object.
 *
 * @param {Object} obj
 * @param {string} key - e.g. "setup.questions.uiLang"
 * @returns {*} resolved value or undefined
 */
function getNestedValue(obj, key) {
  const parts = key.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Replace {{placeholder}} tokens in a string with values from params.
 *
 * @param {string} template
 * @param {Object} [params]
 * @returns {string}
 */
function interpolate(template, params) {
  if (!params || typeof template !== "string") return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Load a JSON message file for the given locale and domain.
 *
 * @param {string} lang     - Locale code (e.g. "ja", "en")
 * @param {string} domain   - Message domain / filename without extension (e.g. "ui", "prompts")
 * @param {string} [localeDir] - Override locale directory
 * @returns {Object} parsed message object (empty object if file not found)
 */
function loadMessages(lang, domain, localeDir) {
  const dir = localeDir || DEFAULT_LOCALE_DIR;
  const filePath = path.join(dir, lang, `${domain}.json`);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an i18n translation function for the given locale.
 *
 * The returned function `t(key, params?)` resolves dot-separated keys
 * from the loaded message file and interpolates {{placeholder}} tokens.
 *
 * @param {string} lang            - Locale code (e.g. "ja", "en")
 * @param {Object} [options]
 * @param {string} [options.domain="ui"]      - Message domain to load
 * @param {string} [options.localeDir]        - Override locale directory
 * @param {string} [options.fallbackLang="en"] - Fallback locale if key not found
 * @returns {function(string, Object?): string} Translation function
 */
export function createI18n(lang, options = {}) {
  const domain = options.domain || "ui";
  const localeDir = options.localeDir || DEFAULT_LOCALE_DIR;
  const fallbackLang = options.fallbackLang || "en";

  const messages = loadMessages(lang, domain, localeDir);
  const fallbackMessages = lang !== fallbackLang
    ? loadMessages(fallbackLang, domain, localeDir)
    : {};

  /**
   * Translate a key with optional parameter interpolation.
   *
   * @param {string} key    - Dot-separated message key (e.g. "setup.title")
   * @param {Object} [params] - Interpolation parameters
   * @returns {string} Translated string (falls back to key if not found)
   */
  function t(key, params) {
    let value = getNestedValue(messages, key);
    if (value === undefined) {
      value = getNestedValue(fallbackMessages, key);
    }
    if (value === undefined) return key;
    return interpolate(value, params);
  }

  /**
   * Get a raw (non-interpolated) value for a key.
   * Returns the value as-is (could be string, array, object).
   *
   * @param {string} key
   * @returns {*} Raw value or undefined
   */
  t.raw = function raw(key) {
    let value = getNestedValue(messages, key);
    if (value === undefined) {
      value = getNestedValue(fallbackMessages, key);
    }
    return value;
  };

  /** Current language code */
  t.lang = lang;

  return t;
}
