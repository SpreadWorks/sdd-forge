#!/usr/bin/env node
/**
 * src/flow/get/issue.js
 *
 * flow get issue <number> — Get GitHub issue content as JSON.
 */

import { execFileSync } from "child_process";
import { runIfDirect } from "../../lib/entrypoint.js";
import { repoRoot } from "../../lib/cli.js";
import { ok, fail, output } from "../../lib/flow-envelope.js";

function main() {
  const root = repoRoot(import.meta.url);
  const number = process.argv[2];

  if (!number || !/^\d+$/.test(number)) {
    output(fail("get", "issue", "INVALID_NUMBER", "issue number required (positive integer)"));
    return;
  }

  try {
    const raw = execFileSync(
      "gh",
      ["issue", "view", number, "--json", "title,body,labels,state"],
      { cwd: root, encoding: "utf8", timeout: 15000 },
    );
    const data = JSON.parse(raw);
    output(ok("get", "issue", {
      number: Number(number),
      title: data.title,
      body: data.body,
      labels: data.labels,
      state: data.state,
    }));
  } catch (e) {
    output(fail("get", "issue", "GH_ERROR", e.message));
  }
}

export { main };
runIfDirect(import.meta.url, main);
