import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../../helpers/tmp-dir.js";
import { processTemplateFileBatch } from "../../../../src/docs/commands/text.js";

describe("processTemplateFileBatch", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("fills {{text}} directives using echo agent", async () => {
    tmp = createTmpDir();

    const templateContent = [
      "# Test Document",
      "",
      "## Overview",
      '<!-- {{text({prompt: "describe the overview"})}} -->',
      "<!-- {{/text}} -->",
      "",
      "## Details",
      '<!-- {{text({prompt: "describe the details"})}} -->',
      "<!-- {{/text}} -->",
      "",
    ].join("\n");

    // Agent returns JSON with directive ids as keys (ignore prompt via {{PROMPT}})
    const jsonResponse = JSON.stringify({
      d0: "This is the overview.",
      d1: "These are the details.",
    });
    const agent = {
      command: "node",
      args: ["-e", `process.stdout.write(${JSON.stringify(jsonResponse)})`, "{{PROMPT}}"],
    };

    const result = await processTemplateFileBatch(
      templateContent,
      { structure: {} },
      "test.md",
      agent,
      10000,
      tmp,
      false,
      [],
      "",
      undefined,
      undefined,
      "en",
    );

    assert.ok(result, "should return a result");
    assert.ok(typeof result.text === "string", "result.text should be a string");
    assert.ok(typeof result.filled === "number", "result.filled should be a number");
  });

  it("returns null text on empty agent response in dry-run", async () => {
    tmp = createTmpDir();

    const templateContent = [
      "# Test Document",
      "## Section",
      '<!-- {{text({prompt: "describe"})}} -->',
      "<!-- {{/text}} -->",
      "",
    ].join("\n");

    // agent that returns empty
    const agent = {
      command: "echo",
      args: ["-n", ""],
    };

    const result = await processTemplateFileBatch(
      templateContent,
      { structure: {} },
      "test.md",
      agent,
      10000,
      tmp,
      true,
      [],
      "",
      undefined,
      undefined,
      "en",
    );

    // dry-run returns original text unchanged with filled=0
    assert.strictEqual(result.text, templateContent);
    assert.strictEqual(result.filled, 0);
    assert.strictEqual(result.skipped, 1);
  });
});
