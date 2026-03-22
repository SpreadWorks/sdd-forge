/**
 * Laravel 設定解析器。
 * composer.json, .env.example, config/ ディレクトリ, app/Providers/ を解析する。
 */

import fs from "fs";
import path from "path";
import { parseComposer, parseEnvFile } from "../../lib/composer-utils.js";

/**
 * @param {string} sourceRoot - プロジェクトルート
 * @returns {Object} extras データ
 */
export function analyzeConfig(sourceRoot) {
  const extras = {};

  // composer.json
  extras.composerDeps = parseComposer(sourceRoot);

  // .env.example
  extras.envKeys = parseEnvFile(sourceRoot, [".env.example"]);

  // config/*.php
  extras.configFiles = parseConfigDir(sourceRoot);

  // app/Providers/
  extras.providers = parseProviders(sourceRoot);

  // app/Http/Middleware/
  extras.middleware = parseMiddleware(sourceRoot);

  // Middleware registration (Kernel.php or bootstrap/app.php)
  extras.middlewareRegistration = parseMiddlewareRegistration(sourceRoot);

  return extras;
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

function parseMiddlewareRegistration(sourceRoot) {
  const result = { global: [], groups: {}, aliases: {} };

  // Laravel 10: app/Http/Kernel.php
  const kernelPath = path.join(sourceRoot, "app", "Http", "Kernel.php");
  if (fs.existsSync(kernelPath)) {
    const content = fs.readFileSync(kernelPath, "utf8");
    Object.assign(result, parseKernelMiddleware(content));
  }

  // Laravel 11: bootstrap/app.php
  const bootstrapPath = path.join(sourceRoot, "bootstrap", "app.php");
  if (fs.existsSync(bootstrapPath)) {
    const content = fs.readFileSync(bootstrapPath, "utf8");
    mergeMiddlewareRegistration(result, parseBootstrapMiddleware(content));
  }

  return result;
}

function parseKernelMiddleware(content) {
  const result = { global: [], groups: {}, aliases: {} };

  // $middleware = [...]
  const globalMatch = content.match(/\$middleware\s*=\s*\[([\s\S]*?)\];/);
  if (globalMatch) {
    result.global = extractClassNames(globalMatch[1]);
  }

  // $middlewareGroups = ['web' => [...], 'api' => [...]]
  const groupsMatch = content.match(/\$middlewareGroups\s*=\s*\[([\s\S]*?)\];/);
  if (groupsMatch) {
    const groupRegex = /['"](\w+)['"]\s*=>\s*\[([\s\S]*?)\]/g;
    let gm;
    while ((gm = groupRegex.exec(groupsMatch[1])) !== null) {
      result.groups[gm[1]] = extractClassNames(gm[2]);
    }
  }

  // $middlewareAliases = ['auth' => Authenticate::class, ...]
  // also $routeMiddleware (older Laravel versions)
  const aliasMatch = content.match(/\$(?:middlewareAliases|routeMiddleware)\s*=\s*\[([\s\S]*?)\];/);
  if (aliasMatch) {
    result.aliases = parseAliasMap(aliasMatch[1]);
  }

  return result;
}

function parseBootstrapMiddleware(content) {
  const result = { global: [], groups: {}, aliases: {} };

  // ->append(ClassName::class) or ->prepend(ClassName::class)
  const appendRegex = /->(?:append|prepend)\s*\(\s*([\w\\]+)(?:::class)?\s*\)/g;
  let m;
  while ((m = appendRegex.exec(content)) !== null) {
    result.global.push(m[1].split("\\").pop());
  }

  // ->alias([...])
  const aliasMatch = content.match(/->alias\s*\(\s*\[([\s\S]*?)\]\s*\)/);
  if (aliasMatch) {
    result.aliases = parseAliasMap(aliasMatch[1]);
  }

  // ->group('name', [...])
  const groupRegex = /->group\s*\(\s*['"](\w+)['"]\s*,\s*\[([\s\S]*?)\]\s*\)/g;
  while ((m = groupRegex.exec(content)) !== null) {
    result.groups[m[1]] = extractClassNames(m[2]);
  }

  return result;
}

function parseAliasMap(str) {
  const aliases = {};
  const re = /['"](\w+)['"]\s*=>\s*([\w\\]+)(?:::class)?/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    aliases[m[1]] = m[2].split("\\").pop();
  }
  return aliases;
}

function extractClassNames(str) {
  const names = [];
  const re = /([\w\\]+)(?:::class)?/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    const name = m[1].split("\\").pop();
    if (name && name[0] === name[0].toUpperCase() && name !== "class") {
      names.push(name);
    }
  }
  return names;
}

function mergeMiddlewareRegistration(target, source) {
  target.global.push(...source.global);
  for (const [key, value] of Object.entries(source.groups)) {
    target.groups[key] = (target.groups[key] || []).concat(value);
  }
  Object.assign(target.aliases, source.aliases);
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
