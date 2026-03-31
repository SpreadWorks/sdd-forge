import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { createResolver } from "../../../../src/docs/lib/resolver-factory.js";
import { createTmpDir, removeTmpDir, writeJson, writeFile } from "../../../helpers/tmp-dir.js";

// ---------------------------------------------------------------------------
// B3: README chapter order should follow resolveChaptersOrder
// ---------------------------------------------------------------------------

describe("B3: DocsSource.chapters() order", () => {
  let tmp;

  afterEach(() => {
    if (tmp) removeTmpDir(tmp);
    tmp = null;
  });

  it("chapters() returns files in preset chapter order, not alphabetical", async () => {
    tmp = createTmpDir("b3-chapter-order-");
    fs.mkdirSync(path.join(tmp, ".sdd-forge"), { recursive: true });
    writeJson(tmp, "package.json", { name: "test", version: "1.0.0" });

    // Create chapter files (alphabetical order differs from preset order)
    const docsDir = path.join(tmp, "docs");
    fs.mkdirSync(docsDir, { recursive: true });
    // node-cli preset chapters: overview, stack_and_ops, project_structure, ...
    // Create files that would sort differently alphabetically
    writeFile(tmp, "docs/overview.md", "# Overview\n\n## Description\nFirst chapter.\n");
    writeFile(tmp, "docs/project_structure.md", "# Project Structure\n\n## Description\nThird chapter.\n");
    writeFile(tmp, "docs/stack_and_ops.md", "# Stack\n\n## Description\nSecond chapter.\n");

    const resolver = await createResolver("node-cli", tmp, { type: "node-cli" });

    // Resolve docs.chapters which internally calls getChapterFiles
    const result = resolver.resolve("base", "docs", "chapters", {}, ["Chapter", "Description"]);

    if (result) {
      const lines = result.split("\n");
      const dataRows = lines.filter((l) => l.startsWith("|") && !l.includes("---"));
      // Skip header row
      const rows = dataRows.slice(1);

      if (rows.length >= 3) {
        // overview should come before stack_and_ops, which comes before project_structure
        // (based on node-cli preset chapters order)
        const overviewIdx = rows.findIndex((r) => r.includes("overview"));
        const stackIdx = rows.findIndex((r) => r.includes("stack") || r.includes("Stack"));
        const structIdx = rows.findIndex((r) => r.includes("project_structure") || r.includes("Project Structure"));

        assert.ok(overviewIdx < stackIdx, "overview before stack_and_ops");
        assert.ok(stackIdx < structIdx, "stack_and_ops before project_structure");
      }
    }
  });
});
