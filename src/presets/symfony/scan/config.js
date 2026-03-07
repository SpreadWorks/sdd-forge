/**
 * Symfony 設定解析器。
 * composer.json, .env, config/packages/, src/Kernel.php を解析する。
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

  // .env
  extras.envKeys = parseEnvFile(sourceRoot, [".env", ".env.example"]);

  // config/packages/*.yaml
  extras.configFiles = parseConfigPackages(sourceRoot);

  // config/services.yaml
  extras.services = parseServicesYaml(sourceRoot);

  // src/Kernel.php
  extras.kernel = parseKernel(sourceRoot);

  // config/bundles.php
  extras.bundles = parseBundles(sourceRoot);

  return extras;
}


function parseConfigPackages(sourceRoot) {
  const configDir = path.join(sourceRoot, "config", "packages");
  if (!fs.existsSync(configDir)) return [];

  return fs.readdirSync(configDir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort()
    .map((f) => {
      const content = fs.readFileSync(path.join(configDir, f), "utf8");
      // トップレベルキーを抽出（YAML のインデントなし行）
      const topKeys = [];
      for (const line of content.split("\n")) {
        const keyMatch = line.match(/^(\w[\w_-]*):/);
        if (keyMatch && !topKeys.includes(keyMatch[1])) {
          topKeys.push(keyMatch[1]);
          if (topKeys.length >= 20) break;
        }
      }
      return { file: f, keys: topKeys };
    });
}

function parseServicesYaml(sourceRoot) {
  const servicesPath = path.join(sourceRoot, "config", "services.yaml");
  if (!fs.existsSync(servicesPath)) return { autowire: false, autoconfigure: false };

  const content = fs.readFileSync(servicesPath, "utf8");
  return {
    autowire: /autowire:\s*true/.test(content),
    autoconfigure: /autoconfigure:\s*true/.test(content),
  };
}

function parseKernel(sourceRoot) {
  const kernelPath = path.join(sourceRoot, "src", "Kernel.php");
  if (!fs.existsSync(kernelPath)) return null;

  const content = fs.readFileSync(kernelPath, "utf8");
  const classMatch = content.match(/class\s+(\w+)\s+extends\s+(\w+)/);
  return {
    className: classMatch ? classMatch[1] : "Kernel",
    parentClass: classMatch ? classMatch[2] : "",
  };
}

function parseBundles(sourceRoot) {
  const bundlesPath = path.join(sourceRoot, "config", "bundles.php");
  if (!fs.existsSync(bundlesPath)) return [];

  const content = fs.readFileSync(bundlesPath, "utf8");
  const bundles = [];

  // Xxx\XxxBundle::class => ['all' => true]
  const bundleRegex = /([\w\\]+)::class\s*=>/g;
  let m;
  while ((m = bundleRegex.exec(content)) !== null) {
    const fullName = m[1];
    const shortName = fullName.split("\\").pop();
    bundles.push({ fullName, shortName });
  }

  return bundles;
}
