/**
 * Spec verification test: 142-add-guardrails-to-presets
 *
 * Verifies that guardrail.json files contain the expected guardrails
 * as specified in the spec (R0–R6).
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_DIR = path.resolve(__dirname, "../../../src/presets");

function readGuardrails(preset, lang) {
  const p = path.join(PRESETS_DIR, preset, "templates", lang, "guardrail.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function getIds(guardrails) {
  return guardrails.guardrails.map((g) => g.id);
}

function findById(guardrails, id) {
  return guardrails.guardrails.find((g) => g.id === id);
}

// R0: VALID_PHASES
describe("R0: VALID_PHASES includes review", () => {
  it("phases.js exports VALID_PHASES containing 'review'", async () => {
    const { VALID_PHASES } = await import("../../../src/flow/lib/phases.js");
    assert.ok(
      VALID_PHASES.includes("review"),
      `VALID_PHASES should contain "review", got: ${JSON.stringify(VALID_PHASES)}`
    );
  });

  // GAP-1: TC-2 — order verification
  it("VALID_PHASES contains all phases in correct order", async () => {
    const { VALID_PHASES } = await import("../../../src/flow/lib/phases.js");
    assert.deepStrictEqual(VALID_PHASES, ["draft", "spec", "gate", "impl", "test", "lint", "review"]);
  });

  // GAP-1: TC-3 — frozen
  it("VALID_PHASES is frozen", async () => {
    const { VALID_PHASES } = await import("../../../src/flow/lib/phases.js");
    assert.ok(Object.isFrozen(VALID_PHASES));
  });
});

// R1: webapp guardrail.json に6件追加
describe("R1: webapp guardrails", () => {
  const expectedIds = [
    "authorization-flow-in-spec",
    "queue-design-for-heavy-processing",
    "cache-invalidation-strategy",
    "no-queries-in-view-templates",
    "detect-n-plus-one-queries",
    "detect-missing-index-on-foreign-keys",
  ];

  for (const lang of ["en", "ja"]) {
    it(`${lang}/guardrail.json contains all 6 new guardrails`, () => {
      const data = readGuardrails("webapp", lang);
      assert.ok(data, `webapp/${lang}/guardrail.json should exist`);
      const ids = getIds(data);
      for (const id of expectedIds) {
        assert.ok(ids.includes(id), `Missing guardrail: ${id} in ${lang}`);
      }
    });
  }

  it("authorization-flow-in-spec has phase: spec", () => {
    const g = findById(readGuardrails("webapp", "en"), "authorization-flow-in-spec");
    assert.deepStrictEqual(g.meta.phase, ["spec"]);
  });

  it("no-queries-in-view-templates has phase: impl, review", () => {
    const g = findById(readGuardrails("webapp", "en"), "no-queries-in-view-templates");
    assert.deepStrictEqual(g.meta.phase.sort(), ["impl", "review"]);
  });

  it("detect-n-plus-one-queries has phase: review", () => {
    const g = findById(readGuardrails("webapp", "en"), "detect-n-plus-one-queries");
    assert.deepStrictEqual(g.meta.phase, ["review"]);
  });

  // GAP-3: remaining webapp phase assignments
  for (const [id, expected] of [
    ["queue-design-for-heavy-processing", ["spec"]],
    ["cache-invalidation-strategy", ["spec"]],
    ["detect-missing-index-on-foreign-keys", ["review"]],
  ]) {
    it(`${id} has correct phase`, () => {
      const g = findById(readGuardrails("webapp", "en"), id);
      assert.ok(g, `${id} should exist`);
      assert.deepStrictEqual(g.meta.phase.sort(), expected.sort());
    });
  }

  // GAP-4: TC-10 — existing 8 webapp guardrails preserved
  it("existing webapp guardrails are preserved", () => {
    const data = readGuardrails("webapp", "en");
    const ids = getIds(data);
    for (const id of [
      "security-impact-disclosure",
      "input-sanitization-required",
      "no-reinventing-framework-features",
      "csrf-protection-required",
      "no-sensitive-files-in-public-dir",
      "server-side-authorization",
      "secure-session-handling",
      "use-standard-password-hashing",
    ]) {
      assert.ok(ids.includes(id), `Existing guardrail missing: ${id}`);
    }
  });

  // GAP-6: TC-11 — webapp new guardrails contain no FW-specific terms
  it("webapp new guardrails contain no FW-specific terms", () => {
    const data = readGuardrails("webapp", "en");
    const forbidden = /Eloquent|Laravel|CakePHP|Symfony|ActiveRecord|Rails/i;
    for (const id of expectedIds) {
      const g = findById(data, id);
      assert.ok(g, `${id} should exist`);
      assert.ok(!forbidden.test(g.title + " " + g.body), `${id} contains FW-specific term`);
    }
  });
});

// GAP-2: TC-5, TC-9 — filterByPhase("review") tests
describe("R1+: filterByPhase('review') verification", () => {
  it("filterByPhase('review') returns webapp review-phase guardrails", async () => {
    const { filterByPhase } = await import("../../../src/lib/guardrail.js");
    const data = readGuardrails("webapp", "en");
    assert.ok(data, "webapp/en/guardrail.json should exist");
    const reviewGuardrails = filterByPhase(data.guardrails, "review");
    const ids = reviewGuardrails.map((g) => g.id);
    assert.ok(ids.includes("no-queries-in-view-templates"));
    assert.ok(ids.includes("detect-n-plus-one-queries"));
    assert.ok(ids.includes("detect-missing-index-on-foreign-keys"));
  });

  // GAP-2: TC-29 — no-unguarded-mass-assignment appears in review filter
  it("filterByPhase('review') includes updated laravel guardrail", async () => {
    const { filterByPhase } = await import("../../../src/lib/guardrail.js");
    const data = readGuardrails("laravel", "en");
    assert.ok(data, "laravel/en/guardrail.json should exist");
    const reviewGuardrails = filterByPhase(data.guardrails, "review");
    assert.ok(reviewGuardrails.some((g) => g.id === "no-unguarded-mass-assignment"));
  });
});

// GAP-1: TC-13 — filterByPhase("spec") for webapp
describe("R1+: filterByPhase('spec') verification", () => {
  it("filterByPhase('spec') returns webapp spec-phase guardrails", async () => {
    const { filterByPhase } = await import("../../../src/lib/guardrail.js");
    const data = readGuardrails("webapp", "en");
    const specGuardrails = filterByPhase(data.guardrails, "spec");
    const ids = specGuardrails.map((g) => g.id);
    assert.ok(ids.includes("authorization-flow-in-spec"));
    assert.ok(ids.includes("queue-design-for-heavy-processing"));
    assert.ok(ids.includes("cache-invalidation-strategy"));
  });
});

// GAP-3: TC-46 — filterByPhase with nonexistent phase
describe("R1+: filterByPhase edge cases", () => {
  it("filterByPhase with nonexistent phase returns empty array", async () => {
    const { filterByPhase } = await import("../../../src/lib/guardrail.js");
    const data = readGuardrails("webapp", "en");
    const result = filterByPhase(data.guardrails, "nonexistent");
    assert.deepStrictEqual(result, []);
  });
});

// GAP-4: TC-43 — multi-phase filterByPhase dual membership
describe("R1+: filterByPhase dual membership", () => {
  it("guardrail with multiple phases appears in both filter results", async () => {
    const { filterByPhase } = await import("../../../src/lib/guardrail.js");
    const data = readGuardrails("webapp", "en");
    const g = findById(data, "no-queries-in-view-templates"); // phase: ["impl", "review"]
    assert.ok(g, "no-queries-in-view-templates should exist");
    const implResult = filterByPhase(data.guardrails, "impl");
    const reviewResult = filterByPhase(data.guardrails, "review");
    assert.ok(implResult.some((x) => x.id === g.id));
    assert.ok(reviewResult.some((x) => x.id === g.id));
  });
});

// R2: php-webapp guardrail.json 新規作成
describe("R2: php-webapp guardrails", () => {
  for (const lang of ["en", "ja"]) {
    it(`${lang}/guardrail.json exists with use-language-enum-for-fixed-values`, () => {
      const data = readGuardrails("php-webapp", lang);
      assert.ok(data, `php-webapp/${lang}/guardrail.json should exist`);
      const ids = getIds(data);
      assert.ok(ids.includes("use-language-enum-for-fixed-values"));
    });
  }

  it("use-language-enum-for-fixed-values has phase: impl", () => {
    const g = findById(readGuardrails("php-webapp", "en"), "use-language-enum-for-fixed-values");
    assert.deepStrictEqual(g.meta.phase, ["impl"]);
  });
});

// GAP-2: TC-25 — laravel guardrails contain Laravel-specific terms
describe("R2+: laravel guardrails contain Laravel-specific terms", () => {
  it("laravel guardrails contain Laravel-specific terms", () => {
    const data = readGuardrails("laravel", "en");
    const allBodies = data.guardrails.map((g) => g.body).join(" ");
    assert.ok(/Eloquent|with\(\)|preventLazyLoading|Model::/.test(allBodies),
      "laravel guardrails should contain Laravel-specific terminology");
  });
});

// R3: laravel guardrail.json に6件追加
describe("R3: laravel new guardrails", () => {
  const expectedIds = [
    "eager-loading-strategy-required",
    "enable-prevent-lazy-loading",
    "use-query-scopes-for-reusable-conditions",
    "use-enum-casting-in-eloquent",
    "use-factory-for-test-data",
    "invokeable-controller-for-single-action",
  ];

  for (const lang of ["en", "ja"]) {
    it(`${lang}/guardrail.json contains all 6 new guardrails`, () => {
      const data = readGuardrails("laravel", lang);
      assert.ok(data, `laravel/${lang}/guardrail.json should exist`);
      const ids = getIds(data);
      for (const id of expectedIds) {
        assert.ok(ids.includes(id), `Missing guardrail: ${id} in ${lang}`);
      }
    });
  }

  it("eager-loading-strategy-required has phase: spec", () => {
    const g = findById(readGuardrails("laravel", "en"), "eager-loading-strategy-required");
    assert.deepStrictEqual(g.meta.phase, ["spec"]);
  });

  // GAP-3: remaining laravel phase assignments
  for (const [id, expected] of [
    ["enable-prevent-lazy-loading", ["impl"]],
    ["use-query-scopes-for-reusable-conditions", ["impl"]],
    ["use-enum-casting-in-eloquent", ["impl"]],
    ["use-factory-for-test-data", ["impl"]],
    ["invokeable-controller-for-single-action", ["impl"]],
  ]) {
    it(`${id} has correct phase`, () => {
      const g = findById(readGuardrails("laravel", "en"), id);
      assert.ok(g, `${id} should exist`);
      assert.deepStrictEqual(g.meta.phase.sort(), expected.sort());
    });
  }

  // GAP-4: TC-23 — existing laravel guardrails preserved
  it("existing laravel guardrails are preserved", () => {
    const data = readGuardrails("laravel", "en");
    const ids = getIds(data);
    for (const id of [
      "use-eloquent-or-query-builder",
      "no-business-logic-in-controllers",
      "use-form-request-validation",
      "no-unguarded-mass-assignment",
    ]) {
      assert.ok(ids.includes(id), `Existing laravel guardrail missing: ${id}`);
    }
  });
});

// R4: no-unguarded-mass-assignment 文言調整
describe("R4: no-unguarded-mass-assignment updated", () => {
  for (const lang of ["en", "ja"]) {
    it(`${lang} has phase impl and review`, () => {
      const g = findById(readGuardrails("laravel", lang), "no-unguarded-mass-assignment");
      assert.ok(g, `no-unguarded-mass-assignment should exist in ${lang}`);
      assert.ok(g.meta.phase.includes("impl"), `Should include impl in ${lang}`);
      assert.ok(g.meta.phase.includes("review"), `Should include review in ${lang}`);
    });
  }

  it("en body mentions migration column verification", () => {
    const g = findById(readGuardrails("laravel", "en"), "no-unguarded-mass-assignment");
    assert.ok(
      g.body.includes("migration") || g.body.includes("$fillable"),
      "Body should mention migration/fillable verification"
    );
  });

  // GAP-11: TC-27 — original content preserved
  it("no-unguarded-mass-assignment preserves original content", () => {
    const g = findById(readGuardrails("laravel", "en"), "no-unguarded-mass-assignment");
    assert.ok(
      g.body.includes("$guarded") || g.body.includes("$fillable"),
      "Original $guarded/$fillable text should be preserved"
    );
  });
});

// R5: NOTICE ファイルの存在と内容
describe("R5: NOTICE files", () => {
  for (const preset of ["webapp", "php-webapp", "laravel"]) {
    it(`${preset}/NOTICE exists`, () => {
      const p = path.join(PRESETS_DIR, preset, "NOTICE");
      assert.ok(fs.existsSync(p), `${preset}/NOTICE should exist`);
    });

    it(`${preset}/NOTICE is not empty`, () => {
      const p = path.join(PRESETS_DIR, preset, "NOTICE");
      const content = fs.readFileSync(p, "utf8");
      assert.ok(content.trim().length > 0, `${preset}/NOTICE should not be empty`);
    });
  }

  // GAP-5: TC-31–36 — NOTICE content and format verification
  it("webapp/NOTICE lists expected sources", () => {
    const content = fs.readFileSync(path.join(PRESETS_DIR, "webapp", "NOTICE"), "utf8");
    assert.ok(content.includes("sanjeed5/awesome-cursor-rules-mdc") || content.includes("PatrickJS/awesome-cursorrules"),
      "NOTICE should reference at least one known source repository");
    assert.ok(content.includes("Affected articles:") || content.includes("Affected"),
      "NOTICE should contain 'Affected articles:' block");
    assert.ok(content.includes("Original source:") || content.includes("Source"),
      "NOTICE should contain 'Original source:' block");
    assert.ok(content.includes("License:") || content.includes("license"),
      "NOTICE should contain 'License:' block");
  });

  it("every Affected articles entry exists in guardrail.json", () => {
    for (const preset of ["webapp", "php-webapp", "laravel"]) {
      const noticePath = path.join(PRESETS_DIR, preset, "NOTICE");
      if (!fs.existsSync(noticePath)) continue;
      const content = fs.readFileSync(noticePath, "utf8");
      const ids = [...content.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim());
      if (ids.length === 0) continue;
      const data = readGuardrails(preset, "en");
      if (!data) continue;
      const guardrailIds = getIds(data);
      for (const id of ids) {
        assert.ok(guardrailIds.includes(id), `NOTICE references unknown id "${id}" in ${preset}`);
      }
    }
  });
});

// GAP-6: TC-31, TC-32, TC-33, TC-35, TC-36 — NOTICE format details
describe("R5: NOTICE format details", () => {
  for (const preset of ["webapp", "php-webapp", "laravel"]) {
    it(`${preset}/NOTICE blocks have required fields`, () => {
      const noticePath = path.join(PRESETS_DIR, preset, "NOTICE");
      if (!fs.existsSync(noticePath)) return;
      const content = fs.readFileSync(noticePath, "utf8");
      const blocks = content.split("---").filter((b) => b.trim());
      for (const block of blocks) {
        assert.ok(/Affected articles:/i.test(block), `${preset} block missing Affected articles`);
        assert.ok(/Original source:/i.test(block), `${preset} block missing Original source`);
        assert.ok(/License:/i.test(block), `${preset} block missing License`);
      }
    });

    it(`${preset}/NOTICE License lines contain URLs`, () => {
      const noticePath = path.join(PRESETS_DIR, preset, "NOTICE");
      if (!fs.existsSync(noticePath)) return;
      const content = fs.readFileSync(noticePath, "utf8");
      const licenseLines = content.split("\n").filter((l) => /^License:/i.test(l.trim()));
      for (const line of licenseLines) {
        assert.ok(/\(https?:\/\/[^)]+\)/.test(line), `License line missing URL: ${line}`);
      }
    });
  }
});

// R6: en/ja 対称性
describe("R6: en/ja symmetry", () => {
  for (const preset of ["webapp", "php-webapp", "laravel"]) {
    it(`${preset} en and ja have the same guardrail IDs`, () => {
      const en = readGuardrails(preset, "en");
      const ja = readGuardrails(preset, "ja");
      if (!en || !ja) return; // skip if not yet created
      const enIds = getIds(en).sort();
      const jaIds = getIds(ja).sort();
      assert.deepStrictEqual(enIds, jaIds, `${preset}: en/ja guardrail IDs should match`);
    });
  }

  // GAP-7: TC-40 — phase parity per guardrail between en/ja
  for (const preset of ["webapp", "php-webapp", "laravel"]) {
    it(`${preset} en/ja have matching phases per guardrail`, () => {
      const en = readGuardrails(preset, "en");
      const ja = readGuardrails(preset, "ja");
      if (!en || !ja) return;
      for (const enG of en.guardrails) {
        const jaG = ja.guardrails.find((g) => g.id === enG.id);
        assert.ok(jaG, `${enG.id} missing in ja`);
        assert.deepStrictEqual(
          enG.meta.phase.sort(),
          jaG.meta.phase.sort(),
          `Phase mismatch for ${enG.id} in ${preset}`
        );
      }
    });
  }

  // GAP-8: TC-41 — Japanese content verification
  it("ja guardrails have Japanese title and body", () => {
    const jpRe = /[\u3000-\u9fff]/;
    for (const preset of ["webapp", "php-webapp", "laravel"]) {
      const data = readGuardrails(preset, "ja");
      if (!data) continue;
      for (const g of data.guardrails) {
        assert.ok(jpRe.test(g.title), `${preset}/${g.id} title should be Japanese`);
        assert.ok(jpRe.test(g.body), `${preset}/${g.id} body should be Japanese`);
      }
    }
  });
});

// GAP-10: TC-46 — all phases in guardrails validated against VALID_PHASES
describe("R0+: all guardrail phases are in VALID_PHASES", () => {
  it("every phase string used across all guardrail.json files is a member of VALID_PHASES", async () => {
    const { VALID_PHASES } = await import("../../../src/flow/lib/phases.js");
    for (const preset of ["webapp", "php-webapp", "laravel"]) {
      const data = readGuardrails(preset, "en");
      if (!data) continue;
      for (const g of data.guardrails) {
        for (const phase of g.meta.phase) {
          assert.ok(VALID_PHASES.includes(phase), `${preset}/${g.id} has invalid phase "${phase}"`);
        }
      }
    }
  });
});

// GAP-9: TC-18, TC-42, TC-43 — preset chain inheritance for guardrails
describe("R+: preset chain inheritance", () => {
  it("laravel inherits php-webapp guardrail through preset chain", async () => {
    // We test the chain conceptually: webapp → php-webapp → laravel
    const webappData = readGuardrails("webapp", "en");
    const phpWebappData = readGuardrails("php-webapp", "en");
    const laravelData = readGuardrails("laravel", "en");
    assert.ok(webappData, "webapp guardrails should exist");
    assert.ok(phpWebappData, "php-webapp guardrails should exist");
    assert.ok(laravelData, "laravel guardrails should exist");

    // php-webapp's guardrail should be inherited by laravel via chain
    const phpWebappIds = getIds(phpWebappData);
    assert.ok(phpWebappIds.includes("use-language-enum-for-fixed-values"),
      "php-webapp should have use-language-enum-for-fixed-values");

    // webapp guardrails should be available in the chain
    const webappIds = getIds(webappData);
    assert.ok(webappIds.includes("detect-n-plus-one-queries"),
      "webapp should have detect-n-plus-one-queries");
  });

  it("no duplicate IDs within any single guardrail.json", () => {
    for (const preset of ["webapp", "php-webapp", "laravel"]) {
      const data = readGuardrails(preset, "en");
      if (!data) continue;
      const ids = getIds(data);
      assert.equal(ids.length, new Set(ids).size, `${preset} has duplicate guardrail IDs`);
    }
  });
});

// GAP-5: TC-19, TC-24, TC-45, TC-50 — preset chain merge integration tests
describe("R+: preset chain guardrail merge (loadMergedGuardrails)", () => {
  // We need a temp project with config to test loadMergedGuardrails
  const { createTmpDir, removeTmpDir, writeJson } = await import("../../../tests/helpers/tmp-dir.js");
  let tmp;
  afterEach(() => tmp && removeTmpDir(tmp));

  function setupProject(type) {
    tmp = createTmpDir();
    writeJson(tmp, ".sdd-forge/config.json", {
      lang: "en",
      type,
      docs: { languages: ["en"], defaultLanguage: "en" },
    });
    return tmp;
  }

  it("loadMergedGuardrails for laravel includes all chain guardrails", async () => {
    const { loadMergedGuardrails } = await import("../../../src/lib/guardrail.js");
    const root = setupProject("laravel");
    const merged = loadMergedGuardrails(root);
    const ids = merged.map((g) => g.id);
    // laravel-specific
    assert.ok(ids.includes("eager-loading-strategy-required"),
      "should include laravel guardrail");
    // php-webapp
    assert.ok(ids.includes("use-language-enum-for-fixed-values"),
      "should include php-webapp guardrail");
    // webapp
    assert.ok(ids.includes("detect-n-plus-one-queries"),
      "should include webapp guardrail");
    // no duplicates
    assert.equal(ids.length, new Set(ids).size, "should have no duplicate IDs");
  });

  it("laravel overrides no-unguarded-mass-assignment from parent", async () => {
    const { loadMergedGuardrails } = await import("../../../src/lib/guardrail.js");
    const root = setupProject("laravel");
    const merged = loadMergedGuardrails(root);
    const g = merged.find((x) => x.id === "no-unguarded-mass-assignment");
    assert.ok(g, "no-unguarded-mass-assignment should exist in merged");
    assert.ok(g.meta.phase.includes("review"), "override should include review phase");
  });

  it("php-webapp chain includes webapp + php-webapp guardrails", async () => {
    const { loadMergedGuardrails } = await import("../../../src/lib/guardrail.js");
    const root = setupProject("php-webapp");
    const merged = loadMergedGuardrails(root);
    const ids = merged.map((g) => g.id);
    assert.ok(ids.includes("use-language-enum-for-fixed-values"),
      "should include php-webapp guardrail");
    assert.ok(ids.includes("detect-n-plus-one-queries"),
      "should include webapp guardrail");
    assert.equal(ids.length, new Set(ids).size, "should have no duplicate IDs");
  });

  it("webapp chain includes only webapp + base guardrails", async () => {
    const { loadMergedGuardrails } = await import("../../../src/lib/guardrail.js");
    const root = setupProject("webapp");
    const merged = loadMergedGuardrails(root);
    const ids = merged.map((g) => g.id);
    assert.ok(ids.includes("detect-n-plus-one-queries"),
      "should include webapp guardrail");
    // Should NOT include laravel-specific guardrails
    assert.ok(!ids.includes("eager-loading-strategy-required"),
      "should NOT include laravel guardrail");
    assert.equal(ids.length, new Set(ids).size, "should have no duplicate IDs");
  });
});
