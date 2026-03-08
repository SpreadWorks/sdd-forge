#!/usr/bin/env node
/**
 * src/projects/setdefault.js
 *
 * sdd-forge default [<name>]
 * デフォルトプロジェクトを変更する。引数なしで一覧表示。
 */

import fs from "fs";
import path from "path";
import { runIfDirect } from "../../lib/entrypoint.js";
import { setDefault, loadProjects } from "../../lib/projects.js";
import { createI18n } from "../../lib/i18n.js";
import { DEFAULT_LANG } from "../../lib/config.js";

function loadLang() {
  try {
    const home = process.env.HOME || process.env.USERPROFILE;
    const raw = JSON.parse(fs.readFileSync(path.join(home, ".sdd-forge", "config.json"), "utf8"));
    return raw.lang || DEFAULT_LANG;
  } catch (_) { return DEFAULT_LANG; }
}

function main() {
  const [name] = process.argv.slice(2);
  const t = createI18n(loadLang(), { domain: "messages" });

  if (!name) {
    const data = loadProjects();
    if (!data) {
      throw new Error(t("default.noProjects"));
    }
    console.log(t("default.registered"));
    for (const [n, p] of Object.entries(data.projects)) {
      const mark = n === data.default ? " (default)" : "";
      console.log(`  ${n}${mark}  →  ${p.path}`);
    }
    return;
  }

  try {
    setDefault(name);
    console.log(t("default.setDefault", { name }));
  } catch (err) {
    throw new Error(err.message);
  }
}

export { main };

runIfDirect(import.meta.url, main);
