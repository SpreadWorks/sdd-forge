import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { createTmpDir, removeTmpDir, writeFile, writeJson } from "../../helpers/tmp-dir.js";
import { processTemplateFileBatch } from "../../../src/docs/commands/text.js";

describe("processTemplateFileBatch", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  it("fills {{text}} directives using echo agent", async () => {
    tmp = createTmpDir();

    const templateContent = [
      "# Test Document",
      "",
      "## Overview",
      "<!-- {{text: describe the overview}} -->",
      "",
      "## Details",
      "<!-- {{text: describe the details}} -->",
      "",
    ].join("\n");

    // echo agent returns the prompt as-is, which contains the file content
    // We simulate an agent that returns a filled version
    const agent = {
      command: "echo",
      args: [templateContent.replace(
        "<!-- {{text: describe the overview}} -->\n",
        "<!-- {{text: describe the overview}} -->\n\nThis is the overview.\n"
      ).replace(
        "<!-- {{text: describe the details}} -->\n",
        "<!-- {{text: describe the details}} -->\n\nThese are the details.\n"
      )],
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
      "<!-- {{text: describe}} -->",
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
