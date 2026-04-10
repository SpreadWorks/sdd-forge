import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../../helpers/tmp-dir.js";

const CMD = join(process.cwd(), "src/docs/commands/data.js");

function makeEnv(tmp) {
  return { ...process.env, SDD_FORGE_WORK_ROOT: tmp, SDD_FORGE_SOURCE_ROOT: tmp };
}

function setupProject(tmp, opts = {}) {
  writeJson(tmp, ".sdd-forge/config.json", {
    lang: "ja", type: "node-cli",
    docs: { languages: ["ja"], defaultLanguage: "ja" },
    ...opts.config,
  });
  writeJson(tmp, "package.json", { name: "test-pkg", version: "1.0.0" });
  writeJson(tmp, ".sdd-forge/output/analysis.json", {
    analyzedAt: "2026-01-01", extras: {}, ...opts.analysis,
  });
}

// Block data directive helper
function dataBlock(source, method, labels, placeholder) {
  const labelsOpt = labels ? `, {labels: "${labels}"}` : "";
  return `<!-- {{data("node-cli.${source}.${method}"${labelsOpt})}} -->\n${placeholder}\n<!-- {{/data}} -->`;
}

describe("data CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setup(docContent, opts) {
    tmp = createTmpDir();
    setupProject(tmp, opts);
    if (docContent) writeFile(tmp, "docs/overview.md", docContent);
    return tmp;
  }

  function runData(args = []) {
    return execFileSync("node", [CMD, ...args], {
      encoding: "utf8",
      env: makeEnv(tmp),
    });
  }

  function readDoc(file = "docs/overview.md") {
    return fs.readFileSync(join(tmp, file), "utf8");
  }

  it("runs without error on docs with no directives", () => {
    setup("# Overview\n\nNo directives here\n");
    runData();
  });

  it("dry-run does not modify files", () => {
    const original = `# Overview\n\n${dataBlock("project", "name", "", "placeholder")}\n`;
    setup(original);
    runData(["--dry-run"]);
    assert.equal(readDoc(), original);
  });

  it("resolves {{data: project.name}} directive", () => {
    setup(`# Overview\n\n${dataBlock("project", "name", "", "placeholder")}\n`);
    runData();
    assert.ok(readDoc().includes("test-pkg"));
  });

  it("resolves {{data: project.version}} directive", () => {
    setup(`# Overview\n\n${dataBlock("project", "version", "", "placeholder")}\n`);
    runData();
    assert.ok(readDoc().includes("1.0.0"));
  });

  it("preserves {{text}} directives (skips them)", () => {
    setup([
      "# Overview", "",
      '<!-- {{text({prompt: "Describe the project overview"})}} -->',
      "Some placeholder text",
      "<!-- {{/text}} -->", "",
    ].join("\n"));
    runData();
    const content = readDoc();
    assert.ok(content.includes("{{text("), "{{text}} directives should be preserved");
    assert.ok(content.includes("{{/text}}"), "Closing tag should be preserved");
  });

  it("handles multiple directives in one file", () => {
    setup([
      "# Overview", "",
      dataBlock("project", "name", "", "placeholder-name"), "",
      "Version:", "",
      dataBlock("project", "version", "", "placeholder-ver"), "",
    ].join("\n"));
    runData();
    const content = readDoc();
    assert.ok(content.includes("test-pkg"));
    assert.ok(content.includes("1.0.0"));
  });

  it("shows help with --help", () => {
    setup(null);
    try { runData(["--help"]); } catch (_) { /* help may exit 0 */ }
  });

  it("stdout mode reports changes", () => {
    setup(`# Overview\n\n${dataBlock("project", "name", "", "placeholder")}\n`);
    const stdout = runData(["--stdout"]);
    assert.ok(stdout.includes("overview.md"));
  });
});
