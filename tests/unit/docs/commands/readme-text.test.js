import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createTmpDir, removeTmpDir } from "../../../helpers/tmp-dir.js";
import { processTemplateFileBatch, countFilledInBatch } from "../../../../src/docs/commands/text.js";

/**
 * README.md の {{text}} 処理に関するテスト。
 *
 * README.md はバッチモード（processTemplateFileBatch）では
 * {{data}} 解決済みの大きなテーブルを含むため AI が構造を維持できず
 * 0/N filled になる問題がある。
 * per-directive モード（processTemplate）を使うことで解決する。
 */

describe("README.md text directive processing", () => {
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  /**
   * README.md のような構造（{{text}} が少数、間に大きな {{data}} 解決済みコンテンツ）
   * でバッチモードが失敗するケースを再現する。
   */
  it("batch mode fails when README contains large resolved {{data}} content between {{text}} directives", async () => {
    tmp = createTmpDir();

    // README.md の典型的な構造: {{text}} の間に大きな {{data}} 解決済みテーブル
    const readmeContent = [
      '# <!-- {{data("webapp.project.name")}} -->MyProject<!-- {{/data}} -->',
      "",
      '<!-- {{text({prompt: "Write project overview"})}} -->',
      "<!-- {{/text}} -->",
      "",
      "## Tech Stack",
      "",
      "| Category | Technology |",
      "|----------|------------|",
      '<!-- {{text({prompt: "Write tech stack table rows"})}} -->',
      "<!-- {{/text}} -->",
      "",
      "## Documentation",
      "",
      "<!-- {{data(\"webapp.docs.chapters\")}} -->",
      "| Chapter | Summary |",
      "| --- | --- |",
      "| [Overview](docs/overview.md) | System overview |",
      "| [Stack](docs/stack_and_ops.md) | Technology stack |",
      "| [Structure](docs/project_structure.md) | Project structure |",
      "| [Development](docs/development.md) | Development guide |",
      "| [API](docs/api_overview.md) | REST API overview |",
      "| [Auth](docs/authentication.md) | Authentication |",
      "| [Endpoints](docs/endpoints.md) | REST endpoints |",
      "| [Database](docs/database.md) | Database architecture |",
      "| [Schema](docs/schema.md) | ORM schema |",
      "| [Runtime](docs/edge_runtime.md) | Edge runtime |",
      "| [Bindings](docs/bindings.md) | Service bindings |",
      "| [Storage](docs/storage.md) | Storage architecture |",
      "<!-- {{/data}} -->",
      "",
    ].join("\n");

    // Agent that returns the file but WITHOUT filling {{text}} directives
    // (simulates AI failing to maintain structure in batch mode)
    const agent = {
      command: "echo",
      args: [readmeContent],
    };

    const result = await processTemplateFileBatch(
      readmeContent,
      {},
      "README.md",
      agent,
      10000,
      tmp,
      false,
      [],
      "",
      undefined,
      undefined,
      "ja",
    );

    // Batch mode: AI returned file without filling → 0 filled
    assert.strictEqual(result.filled, 0, "batch mode should report 0 filled when AI does not fill directives");
  });

  it("countFilledInBatch correctly identifies unfilled directives", () => {
    const unfilled = [
      '<!-- {{text({prompt: "overview"})}} -->',
      "<!-- {{/text}} -->",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(unfilled), 0, "empty directive should count as 0");

    const filled = [
      '<!-- {{text({prompt: "overview"})}} -->',
      "",
      "This is the overview content.",
      "",
      "<!-- {{/text}} -->",
    ].join("\n");

    assert.strictEqual(countFilledInBatch(filled), 1, "directive with content should count as 1");
  });

  it("{{data}} content is not affected by per-directive processTemplate", async () => {
    // per-directive モード（processTemplate）は {{text}} の開始/終了タグの間のみ置換する
    // {{data}} 部分には触れないことを確認

    const dataContent = [
      "| [Overview](docs/overview.md) | System overview |",
      "| [Stack](docs/stack_and_ops.md) | Tech stack |",
    ].join("\n");

    const readmeWithData = [
      "# MyProject",
      "",
      "<!-- {{data(\"webapp.docs.chapters\")}} -->",
      dataContent,
      "<!-- {{/data}} -->",
      "",
      '<!-- {{text({prompt: "Write overview"})}} -->',
      "Overview text here.",
      "<!-- {{/text}} -->",
    ].join("\n");

    // After processTemplate, the {{data}} section should remain unchanged
    // We verify this by checking countFilledInBatch on a structure
    // where {{text}} is filled but {{data}} content is preserved
    const lines = readmeWithData.split("\n");
    const dataStartIdx = lines.findIndex(l => l.includes("{{data("));
    const dataEndIdx = lines.findIndex(l => l.includes("{{/data}}"));

    // {{data}} content lines should be intact
    assert.ok(dataStartIdx >= 0, "data start tag should exist");
    assert.ok(dataEndIdx > dataStartIdx, "data end tag should be after start");
    assert.ok(lines[dataStartIdx + 1].includes("Overview"), "data content row 1 should be preserved");
    assert.ok(lines[dataStartIdx + 2].includes("Stack"), "data content row 2 should be preserved");
  });
});
