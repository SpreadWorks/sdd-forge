import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { checkSpecText } from "../../../../src/flow/lib/run-gate.js";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../../helpers/tmp-dir.js";
import { execFileSync } from "child_process";
import { setupFlow } from "../../../helpers/flow-setup.js";

function initGateProject(tmp) {
  execFileSync("git", ["init", tmp], { stdio: "ignore" });
  execFileSync("git", ["-C", tmp, "commit", "--allow-empty", "-m", "init"], { stdio: "ignore" });
  setupFlow(tmp);
  writeJson(tmp, ".sdd-forge/config.json", {
    lang: "en", type: "node-cli",
    docs: { languages: ["en"], defaultLanguage: "en" },
  });
}

describe("checkSpecText", () => {
  it("returns no issues for a valid spec", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
      "- test passes",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.deepEqual(issues, []);
  });

  it("detects missing Clarifications section", () => {
    const text = [
      "# Spec",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.ok(issues.some((i) => i.includes("Clarifications")));
  });

  it("detects missing Open Questions section", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.ok(issues.some((i) => i.includes("Open Questions")));
  });

  it("detects missing User Confirmation section", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.ok(issues.some((i) => i.includes("User Confirmation")));
  });

  it("detects unapproved spec in post phase", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [ ] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text, { phase: "post" });
    assert.ok(issues.some((i) => i.includes("user confirmation is required")));
  });

  it("skips approval check in pre phase", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [ ] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text, { phase: "pre" });
    assert.ok(!issues.some((i) => i.includes("user confirmation is required")));
  });

  it("detects missing Acceptance Criteria", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.ok(issues.some((i) => i.includes("Acceptance Criteria")));
  });

  it("detects TBD/TODO/FIXME tokens", () => {
    const text = [
      "# Spec",
      "- TBD: decide later",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.ok(issues.some((i) => i.includes("unresolved token")));
  });

  it("detects unchecked tasks", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "- [ ] Need to clarify",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.ok(issues.some((i) => i.includes("unchecked task")));
  });

  it("accepts User Scenarios & Testing as alternative", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## User Scenarios & Testing",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.deepEqual(issues, []);
  });

  it("pre phase skips unchecked items in Acceptance Criteria", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
      "- [ ] feature works",
      "- [ ] tests pass",
    ].join("\n");
    const issues = checkSpecText(text, { phase: "pre" });
    assert.deepEqual(issues, []);
  });

  it("pre phase skips unchecked items in Status section", () => {
    const text = [
      "# Spec",
      "## Status",
      "- [x] Spec created",
      "- [ ] Implementation complete",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
      "- [ ] done",
    ].join("\n");
    const issues = checkSpecText(text, { phase: "pre" });
    assert.deepEqual(issues, []);
  });

  it("post phase detects unchecked items in Acceptance Criteria", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
      "- [ ] feature works",
    ].join("\n");
    const issues = checkSpecText(text, { phase: "post" });
    assert.ok(issues.some((i) => i.includes("unchecked task")));
  });

  it("pre phase still detects unchecked items in Open Questions", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "- [ ] unresolved question",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
      "- [ ] done",
    ].join("\n");
    const issues = checkSpecText(text, { phase: "pre" });
    assert.ok(issues.some((i) => i.includes("unchecked task")));
  });

  it("default phase is pre (skips Acceptance Criteria unchecked)", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
      "- [ ] not done yet",
    ].join("\n");
    // No opts passed = default pre
    const issues = checkSpecText(text);
    assert.deepEqual(issues, []);
  });

  it("ignores unresolved tokens inside table rows", () => {
    const text = [
      "# Spec",
      "| Phase | TODO |",
      "| --- | --- |",
      "| pre | skip TODO items |",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.deepEqual(issues, []);
  });
});

describe("gate CLI", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("exits 0 on valid spec", () => {
    tmp = createTmpDir();
    initGateProject(tmp);
    const specContent = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [x] User approved this spec",
      "## Acceptance Criteria",
      "- done",
    ].join("\n");
    writeFile(tmp, "spec.md", specContent);

    const result = execFileSync("node", [
      join(process.cwd(), "src/sdd-forge.js"),
      "flow", "run", "gate",
      "--spec", join(tmp, "spec.md"),
    ], { encoding: "utf8", env: { ...process.env, SDD_WORK_ROOT: tmp } });
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
  });

  it("returns ok:true with result:fail on invalid spec (R5)", () => {
    tmp = createTmpDir();
    initGateProject(tmp);
    writeFile(tmp, "spec.md", "# Empty spec\n");

    const result = execFileSync("node", [
      join(process.cwd(), "src/sdd-forge.js"),
      "flow", "run", "gate",
      "--spec", join(tmp, "spec.md"),
    ], { encoding: "utf8", env: { ...process.env, SDD_WORK_ROOT: tmp } });
    const envelope = JSON.parse(result);
    assert.equal(envelope.ok, true);
    assert.equal(envelope.data.result, "fail");
    assert.ok(envelope.data.artifacts.issues.length > 0);
  });
});
