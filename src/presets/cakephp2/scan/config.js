/**
 * analyze-config.js
 *
 * Config file analyzers: const.php, bootstrap.php
 */

import fs from "fs";
import path from "path";
import { stripBlockComments } from "../../docs/lib/php-array-parser.js";

// ---------------------------------------------------------------------------
// 定数解析: app/Config/const.php
// ---------------------------------------------------------------------------
export function analyzeConstants(appDir) {
  const filePath = path.join(appDir, "Config", "const.php");
  if (!fs.existsSync(filePath)) return { scalars: [], selectOptions: [] };

  const raw = fs.readFileSync(filePath, "utf8");
  const scalars = [];
  const selectOptions = [];

  // 全 $config 行を走査し、array(...) を含むかで分岐
  const allRe = /\$config\s*\[?\s*["']([^"']+)["']\s*\]?\s*=\s*/g;
  let m;
  while ((m = allRe.exec(raw)) !== null) {
    const name = m[1];
    const rest = raw.slice(m.index + m[0].length);

    if (/^\s*array\s*\(/.test(rest)) {
      // 配列定数 → 括弧バランスで中身を抽出
      const openIdx = rest.indexOf("(");
      let depth = 1;
      let i = openIdx + 1;
      while (i < rest.length && depth > 0) {
        if (rest[i] === "(") depth++;
        else if (rest[i] === ")") depth--;
        i++;
      }
      if (depth === 0) {
        const body = rest.slice(openIdx + 1, i - 1);
        const options = [];
        const optRe = /["']([^"']+)["']\s*=>\s*["']([^"']+)["']/g;
        let om;
        while ((om = optRe.exec(body)) !== null) {
          options.push({ key: om[1], label: om[2] });
        }
        selectOptions.push({ name, options });
      }
    } else {
      // スカラー定数
      const valMatch = rest.match(/^(.+?)\s*;/);
      if (valMatch) {
        let value = valMatch[1].trim();
        value = value.replace(/^["']|["']$/g, "");
        scalars.push({ name, value });
      }
    }
  }

  return { scalars, selectOptions };
}

// ---------------------------------------------------------------------------
// Bootstrap 解析: app/Config/bootstrap.php
// ---------------------------------------------------------------------------
export function analyzeBootstrap(appDir) {
  const filePath = path.join(appDir, "Config", "bootstrap.php");
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const src = stripBlockComments(raw);
  // 行コメントも除去（コメント内の CakePlugin::load 等を誤検出しないため）
  const active = src.replace(/(?:^|\n)\s*(?:\/\/|#).*$/gm, "");
  const result = {
    siteTitle: "",
    environments: [],
    plugins: [],
    logChannels: [],
    classPaths: [],
    configureWrites: [],
  };

  // サイトタイトル
  const titleMatch = active.match(/Configure::write\s*\(\s*['"]SITE_TITLE['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
  if (titleMatch) result.siteTitle = titleMatch[1];

  // 環境判定
  const envRe = /CAKE_ENV['"]\s*,\s*['"](\w+)['"]/g;
  const envSet = new Set();
  let em;
  while ((em = envRe.exec(active)) !== null) {
    envSet.add(em[1]);
  }
  result.environments = [...envSet].sort();

  // プラグイン
  const pluginRe = /CakePlugin::load\s*\(\s*['"](\w+)['"]/g;
  while ((em = pluginRe.exec(active)) !== null) {
    result.plugins.push(em[1]);
  }

  // ログチャネル
  const logRe = /CakeLog::config\s*\(\s*['"]([^'"]+)['"]/g;
  while ((em = logRe.exec(active)) !== null) {
    result.logChannels.push(em[1]);
  }

  // App::build クラスパス
  const buildRe = /['"](\w+)['"]\s*=>\s*array\s*\(\s*APP\s*\.\s*['"]([^'"]+)['"]/g;
  while ((em = buildRe.exec(active)) !== null) {
    result.classPaths.push({ type: em[1], path: em[2] });
  }

  // Configure::write 一覧
  const cwRe = /Configure\s*::\s*write\s*\(\s*['"]([^'"]+)["']\s*,\s*(.+?)\s*\)/g;
  while ((em = cwRe.exec(active)) !== null) {
    const key = em[1];
    let value = em[2].trim();
    // 配列値は省略表現にする
    if (value.startsWith("array")) {
      value = "array(...)";
    }
    // クォートを除去
    value = value.replace(/^["']|["']$/g, "");
    result.configureWrites.push({ key, value });
  }

  return result;
}
