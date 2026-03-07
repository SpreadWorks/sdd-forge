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

function loadLang() {
  try {
    const home = process.env.HOME || process.env.USERPROFILE;
    const raw = JSON.parse(fs.readFileSync(path.join(home, ".sdd-forge", "config.json"), "utf8"));
    return raw.lang || "en";
  } catch (_) { return "en"; }
}

function main() {
  const [name] = process.argv.slice(2);
  const t = createI18n(loadLang(), { domain: "messages" });

  if (!name) {
    const data = loadProjects();
    if (!data) {
      console.error(t("default.noProjects"));
      process.exit(1);
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
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

export { main };

runIfDirect(import.meta.url, main);
