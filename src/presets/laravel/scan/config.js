/**
 * Laravel 設定解析器。
 * composer.json, .env.example, config/ ディレクトリ, app/Providers/ を解析する。
 */

import fs from "fs";
import path from "path";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {Object} extras データ
 */
export function analyzeConfig(sourceRoot) {
  const extras = {};

  // composer.json
  extras.composerDeps = parseComposer(sourceRoot);

  // .env.example
  extras.envKeys = parseEnvExample(sourceRoot);

  // config/*.php
  extras.configFiles = parseConfigDir(sourceRoot);

  // app/Providers/
  extras.providers = parseProviders(sourceRoot);

  // app/Http/Middleware/
  extras.middleware = parseMiddleware(sourceRoot);

  return extras;
}

function parseComposer(sourceRoot) {
  const composerPath = path.join(sourceRoot, "composer.json");
  if (!fs.existsSync(composerPath)) return { require: {}, requireDev: {} };
  try {
    const composer = JSON.parse(fs.readFileSync(composerPath, "utf8"));
    return {
      require: composer.require || {},
      requireDev: composer["require-dev"] || {},
    };
  } catch (_) {
    return { require: {}, requireDev: {} };
  }
}

function parseEnvExample(sourceRoot) {
  const envPath = path.join(sourceRoot, ".env.example");
  if (!fs.existsSync(envPath)) return [];
  const content = fs.readFileSync(envPath, "utf8");
  const keys = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match) {
      const value = trimmed.slice(match[0].length);
      keys.push({ key: match[1], defaultValue: value });
    }
  }

  return keys;
}

function parseConfigDir(sourceRoot) {
  const configDir = path.join(sourceRoot, "config");
  if (!fs.existsSync(configDir)) return [];

  return fs.readdirSync(configDir)
    .filter((f) => f.endsWith(".php"))
    .sort()
    .map((f) => {
      const content = fs.readFileSync(path.join(configDir, f), "utf8");
      // トップレベルのキーを抽出
      const topKeys = [];
      const keyRegex = /['"](\w+)['"]\s*=>/g;
      let m;
      // 最初の return [ の後のキーのみ
      const returnPos = content.indexOf("return [");
      if (returnPos >= 0) {
        const body = content.slice(returnPos, returnPos + 2000);
        while ((m = keyRegex.exec(body)) !== null) {
          if (!topKeys.includes(m[1])) topKeys.push(m[1]);
          if (topKeys.length >= 20) break;
        }
      }
      return { file: f, keys: topKeys };
    });
}

function parseProviders(sourceRoot) {
  const provDir = path.join(sourceRoot, "app", "Providers");
  if (!fs.existsSync(provDir)) return [];

  return fs.readdirSync(provDir)
    .filter((f) => f.endsWith(".php"))
    .sort()
    .map((f) => {
      const content = fs.readFileSync(path.join(provDir, f), "utf8");
      const classMatch = content.match(/class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : f.replace(".php", "");
      // register/boot メソッドの有無
      const hasRegister = /public\s+function\s+register\s*\(/.test(content);
      const hasBoot = /public\s+function\s+boot\s*\(/.test(content);
      return { file: path.join("app/Providers", f), className, hasRegister, hasBoot };
    });
}

function parseMiddleware(sourceRoot) {
  const mwDir = path.join(sourceRoot, "app", "Http", "Middleware");
  if (!fs.existsSync(mwDir)) return [];

  return fs.readdirSync(mwDir)
    .filter((f) => f.endsWith(".php"))
    .sort()
    .map((f) => {
      const content = fs.readFileSync(path.join(mwDir, f), "utf8");
      const classMatch = content.match(/class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : f.replace(".php", "");
      return { file: path.join("app/Http/Middleware", f), className };
    });
}
