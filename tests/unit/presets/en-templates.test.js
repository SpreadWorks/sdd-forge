import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  resolveTemplates,
  resolveChaptersOrder,
} from "../../../src/docs/lib/template-merger.js";
import { parseDirectives } from "../../../src/docs/lib/directive-parser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = path.resolve(__dirname, "../../../src/presets");

// webapp chapters from preset.json
const WEBAPP_CHAPTERS = [
  "overview.md",
  "stack_and_ops.md",
  "project_structure.md",
  "development.md",
  "auth_and_session.md",
  "database_architecture.md",
  "db_tables.md",
  "controller_routes.md",
  "business_logic.md",
  "batch_and_shell.md",
];

// Chapters that are webapp-specific (not in base)
const WEBAPP_ONLY_CHAPTERS = [
  "auth_and_session.md",
  "database_architecture.md",
  "db_tables.md",
  "controller_routes.md",
  "business_logic.md",
  "batch_and_shell.md",
];

// ---------------------------------------------------------------------------
// Helper: extract directive structure from a template
// ---------------------------------------------------------------------------

function extractDirectiveStructure(content) {
  const directives = parseDirectives(content);
  return directives
    // Exclude langSwitcher — some ja templates have escaped comments (<\!--)
    // that prevent parsing, so comparing langSwitcher presence is unreliable
    .filter((d) => !(d.type === "data" && d.source === "docs" && d.method === "langSwitcher"))
    .map((d) => {
      if (d.type === "data") {
        return { type: "data", source: d.source, method: d.method };
      }
      return { type: "text", hasPrompt: d.prompt.length > 0 };
    });
}

// ---------------------------------------------------------------------------
// webapp: en templates resolve all chapters
// ---------------------------------------------------------------------------

describe("webapp en templates", () => {
  it("resolveTemplates resolves all webapp chapters for en", () => {
    const chaptersOrder = resolveChaptersOrder("webapp");
    const resolutions = resolveTemplates("webapp", "en", { chaptersOrder });

    const resolvedFiles = resolutions.map((r) => r.fileName);
    for (const ch of WEBAPP_CHAPTERS) {
      assert.ok(
        resolvedFiles.includes(ch),
        `missing chapter: ${ch} (resolved: ${resolvedFiles.join(", ")})`,
      );
    }
  });

  it("all webapp en resolutions have action 'use' (no fallback needed)", () => {
    const chaptersOrder = resolveChaptersOrder("webapp");
    const resolutions = resolveTemplates("webapp", "en", { chaptersOrder });

    for (const r of resolutions) {
      if (r.fileName === "README.md") continue;
      assert.equal(r.action, "use", `${r.fileName} should be action=use`);
    }
  });

  for (const chapter of WEBAPP_ONLY_CHAPTERS) {
    it(`en/${chapter} has same directive structure as ja/${chapter}`, () => {
      const jaPath = path.join(PRESETS_DIR, "webapp", "templates", "ja", chapter);
      const enPath = path.join(PRESETS_DIR, "webapp", "templates", "en", chapter);

      assert.ok(fs.existsSync(jaPath), `ja template missing: ${jaPath}`);
      assert.ok(fs.existsSync(enPath), `en template missing: ${enPath}`);

      const jaContent = fs.readFileSync(jaPath, "utf8");
      const enContent = fs.readFileSync(enPath, "utf8");

      const jaStructure = extractDirectiveStructure(jaContent);
      const enStructure = extractDirectiveStructure(enContent);

      assert.deepEqual(
        enStructure,
        jaStructure,
        `directive structure mismatch in ${chapter}`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// laravel: en templates resolve all chapters
// ---------------------------------------------------------------------------

describe("laravel en templates", () => {
  it("resolveTemplates resolves all webapp chapters for en", () => {
    const chaptersOrder = resolveChaptersOrder("webapp/laravel");
    const resolutions = resolveTemplates("webapp/laravel", "en", { chaptersOrder });

    const resolvedFiles = resolutions.map((r) => r.fileName);
    for (const ch of WEBAPP_CHAPTERS) {
      assert.ok(
        resolvedFiles.includes(ch),
        `missing chapter: ${ch} (resolved: ${resolvedFiles.join(", ")})`,
      );
    }
  });

  for (const chapter of ["auth_and_session.md", "controller_routes.md", "db_tables.md", "project_structure.md", "stack_and_ops.md"]) {
    it(`en/${chapter} has same directive structure as ja/${chapter}`, () => {
      const jaPath = path.join(PRESETS_DIR, "laravel", "templates", "ja", chapter);
      const enPath = path.join(PRESETS_DIR, "laravel", "templates", "en", chapter);

      assert.ok(fs.existsSync(jaPath), `ja template missing: ${jaPath}`);
      assert.ok(fs.existsSync(enPath), `en template missing: ${enPath}`);

      const jaStructure = extractDirectiveStructure(fs.readFileSync(jaPath, "utf8"));
      const enStructure = extractDirectiveStructure(fs.readFileSync(enPath, "utf8"));

      assert.deepEqual(enStructure, jaStructure, `directive structure mismatch in ${chapter}`);
    });
  }
});

// ---------------------------------------------------------------------------
// symfony: en templates resolve all chapters
// ---------------------------------------------------------------------------

describe("symfony en templates", () => {
  it("resolveTemplates resolves all webapp chapters for en", () => {
    const chaptersOrder = resolveChaptersOrder("webapp/symfony");
    const resolutions = resolveTemplates("webapp/symfony", "en", { chaptersOrder });

    const resolvedFiles = resolutions.map((r) => r.fileName);
    for (const ch of WEBAPP_CHAPTERS) {
      assert.ok(
        resolvedFiles.includes(ch),
        `missing chapter: ${ch} (resolved: ${resolvedFiles.join(", ")})`,
      );
    }
  });

  for (const chapter of ["auth_and_session.md", "controller_routes.md", "db_tables.md", "project_structure.md", "stack_and_ops.md"]) {
    it(`en/${chapter} has same directive structure as ja/${chapter}`, () => {
      const jaPath = path.join(PRESETS_DIR, "symfony", "templates", "ja", chapter);
      const enPath = path.join(PRESETS_DIR, "symfony", "templates", "en", chapter);

      assert.ok(fs.existsSync(jaPath), `ja template missing: ${jaPath}`);
      assert.ok(fs.existsSync(enPath), `en template missing: ${enPath}`);

      const jaStructure = extractDirectiveStructure(fs.readFileSync(jaPath, "utf8"));
      const enStructure = extractDirectiveStructure(fs.readFileSync(enPath, "utf8"));

      assert.deepEqual(enStructure, jaStructure, `directive structure mismatch in ${chapter}`);
    });
  }
});

// ---------------------------------------------------------------------------
// cakephp2: en templates resolve all chapters
// ---------------------------------------------------------------------------

describe("cakephp2 en templates", () => {
  it("resolveTemplates resolves all webapp chapters for en", () => {
    const chaptersOrder = resolveChaptersOrder("webapp/cakephp2");
    const resolutions = resolveTemplates("webapp/cakephp2", "en", { chaptersOrder });

    const resolvedFiles = resolutions.map((r) => r.fileName);
    for (const ch of WEBAPP_CHAPTERS) {
      assert.ok(
        resolvedFiles.includes(ch),
        `missing chapter: ${ch} (resolved: ${resolvedFiles.join(", ")})`,
      );
    }
  });

  for (const chapter of ["auth_and_session.md", "controller_routes.md", "db_tables.md", "development.md", "project_structure.md", "stack_and_ops.md"]) {
    it(`en/${chapter} has same directive structure as ja/${chapter}`, () => {
      const jaPath = path.join(PRESETS_DIR, "cakephp2", "templates", "ja", chapter);
      const enPath = path.join(PRESETS_DIR, "cakephp2", "templates", "en", chapter);

      assert.ok(fs.existsSync(jaPath), `ja template missing: ${jaPath}`);
      assert.ok(fs.existsSync(enPath), `en template missing: ${enPath}`);

      const jaStructure = extractDirectiveStructure(fs.readFileSync(jaPath, "utf8"));
      const enStructure = extractDirectiveStructure(fs.readFileSync(enPath, "utf8"));

      assert.deepEqual(enStructure, jaStructure, `directive structure mismatch in ${chapter}`);
    });
  }
});

// ---------------------------------------------------------------------------
// No Japanese text in en templates
// ---------------------------------------------------------------------------

describe("en templates contain no Japanese", () => {
  const JAPANESE_RE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

  const presets = [
    { name: "webapp", chapters: WEBAPP_ONLY_CHAPTERS },
    { name: "laravel", chapters: ["auth_and_session.md", "controller_routes.md", "db_tables.md", "project_structure.md", "stack_and_ops.md"] },
    { name: "symfony", chapters: ["auth_and_session.md", "controller_routes.md", "db_tables.md", "project_structure.md", "stack_and_ops.md"] },
    { name: "cakephp2", chapters: ["auth_and_session.md", "controller_routes.md", "db_tables.md", "development.md", "project_structure.md", "stack_and_ops.md"] },
  ];

  for (const preset of presets) {
    for (const chapter of preset.chapters) {
      it(`${preset.name}/en/${chapter} has no Japanese characters`, () => {
        const enPath = path.join(PRESETS_DIR, preset.name, "templates", "en", chapter);
        assert.ok(fs.existsSync(enPath), `en template missing: ${enPath}`);

        const content = fs.readFileSync(enPath, "utf8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip directive lines (may contain Japanese in data labels of inherited content)
          if (/<!--\s*\{\{/.test(line)) continue;
          if (/<!--\s*@/.test(line)) continue;

          assert.ok(
            !JAPANESE_RE.test(line),
            `Japanese text found in ${preset.name}/en/${chapter} line ${i + 1}: ${line.trim().slice(0, 80)}`,
          );
        }
      });
    }
  }
});
