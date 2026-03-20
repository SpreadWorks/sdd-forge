import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  resolveTemplates,
  resolveChaptersOrder,
  mergeResolved,
} from "../../../src/docs/lib/template-merger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = path.resolve(__dirname, "../../../src/presets");

/**
 * Parse @block names from a template file content.
 */
function parseBlockNames(content) {
  const re = /<!--\s*@block:\s*(\S+)\s*-->/g;
  const names = [];
  let m;
  while ((m = re.exec(content)) !== null) names.push(m[1]);
  return names;
}

// ---------------------------------------------------------------------------
// api parent templates have required @block markers
// ---------------------------------------------------------------------------

describe("api parent templates (@block markers)", () => {
  for (const lang of ["en", "ja"]) {
    it(`api_overview.md (${lang}) has @block: description`, () => {
      const file = path.join(
        PRESETS_DIR,
        "api/templates",
        lang,
        "api_overview.md",
      );
      const content = fs.readFileSync(file, "utf8");
      const blocks = parseBlockNames(content);
      assert.ok(
        blocks.includes("description"),
        `expected @block: description in api_overview.md (${lang}), found: ${blocks}`,
      );
    });

    it(`authentication.md (${lang}) has @block: description`, () => {
      const file = path.join(
        PRESETS_DIR,
        "api/templates",
        lang,
        "authentication.md",
      );
      const content = fs.readFileSync(file, "utf8");
      const blocks = parseBlockNames(content);
      assert.ok(
        blocks.includes("description"),
        `expected @block: description in authentication.md (${lang}), found: ${blocks}`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// rest / graphql child templates use @extends
// ---------------------------------------------------------------------------

describe("child preset templates use @extends", () => {
  const children = ["rest", "graphql"];
  const sharedChapters = ["api_overview.md", "authentication.md"];

  for (const preset of children) {
    for (const chapter of sharedChapters) {
      for (const lang of ["en", "ja"]) {
        it(`${preset}/${chapter} (${lang}) has @extends directive`, () => {
          const file = path.join(
            PRESETS_DIR,
            preset,
            "templates",
            lang,
            chapter,
          );
          assert.ok(fs.existsSync(file), `file should exist: ${file}`);
          const content = fs.readFileSync(file, "utf8");
          assert.ok(
            content.includes("<!-- @extends -->"),
            `expected <!-- @extends --> in ${preset}/${chapter} (${lang})`,
          );
        });
      }
    }
  }
});

// ---------------------------------------------------------------------------
// child @block overrides match parent @block names
// ---------------------------------------------------------------------------

describe("child overridden blocks exist in parent", () => {
  const children = ["rest", "graphql"];
  const sharedChapters = ["api_overview.md", "authentication.md"];

  for (const preset of children) {
    for (const chapter of sharedChapters) {
      it(`${preset}/${chapter} overrides only blocks defined in api parent`, () => {
        const parentFile = path.join(
          PRESETS_DIR,
          "api/templates/en",
          chapter,
        );
        const childFile = path.join(
          PRESETS_DIR,
          preset,
          "templates/en",
          chapter,
        );
        if (!fs.existsSync(childFile)) return; // skip if not yet created

        const parentBlocks = parseBlockNames(
          fs.readFileSync(parentFile, "utf8"),
        );
        const childBlocks = parseBlockNames(
          fs.readFileSync(childFile, "utf8"),
        );

        for (const block of childBlocks) {
          assert.ok(
            parentBlocks.includes(block),
            `child block "${block}" in ${preset}/${chapter} not found in parent. Parent blocks: ${parentBlocks}`,
          );
        }
      });
    }
  }
});

// ---------------------------------------------------------------------------
// template-merger resolves @extends correctly for rest/graphql
// ---------------------------------------------------------------------------

describe("template-merger resolves api→rest/graphql inheritance", () => {
  for (const preset of ["rest", "graphql"]) {
    it(`${preset} api_overview.md merges with api parent`, () => {
      const chaptersOrder = resolveChaptersOrder(preset);
      assert.ok(
        chaptersOrder.includes("api_overview.md"),
        `${preset} should include api_overview.md`,
      );

      const resolutions = resolveTemplates(preset, "en", { chaptersOrder });
      const apiOverview = resolutions.find(
        (r) => r.fileName === "api_overview.md",
      );
      assert.ok(apiOverview, "should resolve api_overview.md");
      assert.ok(
        apiOverview.sources.length >= 2,
        `expected >=2 sources (child+parent), got ${apiOverview.sources.length}`,
      );

      // child should have extends=true
      const child = apiOverview.sources[0];
      assert.ok(child.extends, "child source should have extends=true");

      // merge should produce combined content
      const merged = mergeResolved(apiOverview.sources);
      assert.ok(merged, "merged content should not be null");
      assert.ok(
        merged.includes("API Overview"),
        "merged should include parent title",
      );
    });
  }
});
