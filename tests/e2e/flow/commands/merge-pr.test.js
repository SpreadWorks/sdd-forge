import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson } from "../../../helpers/tmp-dir.js";
import { setupFlow } from "../../../helpers/flow-setup.js";

const FLOW_CMD = join(process.cwd(), "src/flow.js");

function makeConfig(overrides = {}) {
  return {
    lang: "en",
    type: "node-cli",
    docs: { languages: ["en"], defaultLanguage: "en" },
    ...overrides,
  };
}

describe("flow merge --pr --dry-run", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("shows push + gh pr create commands for branch mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    writeJson(tmp, ".sdd-forge/config.json", makeConfig({
      commands: { gh: "enable" },
    }));
    const result = execFileSync("node", [FLOW_CMD, "merge", "--pr", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git push/);
    assert.match(result, /gh pr create/);
  });

  it("includes fixes #N when issue is set in flow.json", () => {
    tmp = createTmpDir();
    setupFlow(tmp, { issue: 5 });
    writeJson(tmp, ".sdd-forge/config.json", makeConfig({
      commands: { gh: "enable" },
    }));
    const result = execFileSync("node", [FLOW_CMD, "merge", "--pr", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /fixes #5/);
  });

  it("omits fixes when issue is not set", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    writeJson(tmp, ".sdd-forge/config.json", makeConfig({
      commands: { gh: "enable" },
    }));
    const result = execFileSync("node", [FLOW_CMD, "merge", "--pr", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.doesNotMatch(result, /fixes #/);
  });

  it("uses flow.push.remote as push target", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    writeJson(tmp, ".sdd-forge/config.json", makeConfig({
      commands: { gh: "enable" },
      flow: { push: { remote: "upstream" } },
    }));
    const result = execFileSync("node", [FLOW_CMD, "merge", "--pr", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /upstream/);
  });

  it("defaults push remote to origin", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    writeJson(tmp, ".sdd-forge/config.json", makeConfig({
      commands: { gh: "enable" },
    }));
    const result = execFileSync("node", [FLOW_CMD, "merge", "--pr", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /origin/);
  });
});

describe("flow merge --dry-run (existing squash merge)", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("still shows squash merge commands for branch mode", () => {
    tmp = createTmpDir();
    setupFlow(tmp);
    const result = execFileSync("node", [FLOW_CMD, "merge", "--dry-run"], {
      encoding: "utf8",
      env: { ...process.env, SDD_WORK_ROOT: tmp },
    });
    assert.match(result, /git checkout main/);
    assert.match(result, /git merge --squash feature\/001-test/);
  });
});
