import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { join } from "path";
import { checkSpecText } from "../../../src/spec/commands/gate.js";
import { createTmpDir, removeTmpDir, writeFile } from "../../helpers/tmp-dir.js";
import { execFileSync } from "child_process";

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

  it("detects unapproved spec", () => {
    const text = [
      "# Spec",
      "## Clarifications (Q&A)",
      "## Open Questions",
      "## User Confirmation",
      "- [ ] User approved this spec",
      "## Acceptance Criteria",
    ].join("\n");
    const issues = checkSpecText(text);
    assert.ok(issues.some((i) => i.includes("user confirmation is required")));
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
      join(process.cwd(), "src/spec/commands/gate.js"),
      "--spec", join(tmp, "spec.md"),
    ], { encoding: "utf8", env: { ...process.env, SDD_WORK_ROOT: tmp } });
    assert.match(result, /PASSED/);
  });

  it("exits non-zero on invalid spec", () => {
    tmp = createTmpDir();
    writeFile(tmp, "spec.md", "# Empty spec\n");

    try {
      execFileSync("node", [
        join(process.cwd(), "src/spec/commands/gate.js"),
        "--spec", join(tmp, "spec.md"),
      ], { encoding: "utf8", env: { ...process.env, SDD_WORK_ROOT: tmp } });
      assert.fail("should have exited non-zero");
    } catch (err) {
      assert.match(err.stderr, /FAILED/);
    }
  });
});
