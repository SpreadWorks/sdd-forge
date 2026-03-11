#!/usr/bin/env node
/**
 * src/projects/setdefault.js
 *
 * sdd-forge default [<name>]
 * デフォルトプロジェクトを変更する。引数なしで一覧表示。
 */

import { runIfDirect } from "../../lib/entrypoint.js";
import { setDefault, loadProjects } from "../../lib/projects.js";
import { translate } from "../../lib/i18n.js";

function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    const t = translate();
    const h = t.raw("ui:help.cmdHelp.default");
    console.log([h.usage, "", `  ${h.desc}`, `  ${h.descDetail}`].join("\n"));
    return;
  }

  const [name] = args;
  const t = translate();

  if (!name) {
    const data = loadProjects();
    if (!data) {
      throw new Error(t("messages:default.noProjects"));
    }
    console.log(t("messages:default.registered"));
    for (const [n, p] of Object.entries(data.projects)) {
      const mark = n === data.default ? " (default)" : "";
      console.log(`  ${n}${mark}  →  ${p.path}`);
    }
    return;
  }

  try {
    setDefault(name);
    console.log(t("messages:default.setDefault", { name }));
  } catch (err) {
    throw new Error(err.message);
  }
}

export { main };

runIfDirect(import.meta.url, main);
