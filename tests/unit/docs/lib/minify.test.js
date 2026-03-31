import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { minify } from "../../../../src/docs/lib/minify.js";

// ---------------------------------------------------------------------------
// Generic minify (all extensions)
// ---------------------------------------------------------------------------

describe("generic minify", () => {
  it("removes blank lines", () => {
    const code = "line1\n\nline2\n\n\nline3\n";
    const result = minify(code, "file.unknown");
    assert.ok(!result.includes("\n\n"));
    assert.ok(result.includes("line1"));
    assert.ok(result.includes("line2"));
    assert.ok(result.includes("line3"));
  });

  it("removes trailing whitespace", () => {
    const code = "line1   \nline2\t\nline3\n";
    const result = minify(code, "file.unknown");
    assert.ok(!result.match(/[ \t]+\n/));
  });

  it("applies only generic minify for unknown extensions", () => {
    const code = "// this stays\nline1\n\nline2  \n";
    const result = minify(code, "file.xyz");
    assert.ok(result.includes("// this stays"));
  });
});

// ---------------------------------------------------------------------------
// JS/TS minify
// ---------------------------------------------------------------------------

describe("JS/TS minify", () => {
  it("removes line comments", () => {
    const code = "const x = 1; // comment\nconst y = 2;\n";
    const result = minify(code, "file.js");
    assert.ok(!result.includes("// comment"));
    assert.ok(result.includes("const x = 1;"));
    assert.ok(result.includes("const y = 2;"));
  });

  it("removes full-line comments", () => {
    const code = "// full line comment\nconst x = 1;\n";
    const result = minify(code, "file.ts");
    assert.ok(!result.includes("full line comment"));
    assert.ok(result.includes("const x = 1;"));
  });

  it("removes block comments", () => {
    const code = "/* block\ncomment */\nconst x = 1;\n";
    const result = minify(code, "file.js");
    assert.ok(!result.includes("block"));
    assert.ok(!result.includes("comment */"));
    assert.ok(result.includes("const x = 1;"));
  });

  it("does not remove // inside URLs", () => {
    const code = 'const url = "https://example.com";\n';
    const result = minify(code, "file.js");
    assert.ok(result.includes("https://example.com"));
  });

  it("normalizes indentation from 4 spaces to 2 spaces", () => {
    const code = "function f() {\n    const x = 1;\n        const y = 2;\n}\n";
    const result = minify(code, "file.js");
    assert.ok(result.includes("  const x = 1;"));
    assert.ok(result.includes("    const y = 2;"));
  });

  it("works with .mjs, .cjs, .jsx, .tsx extensions", () => {
    const code = "// comment\nconst x = 1;\n";
    for (const ext of [".mjs", ".cjs", ".jsx", ".tsx"]) {
      const result = minify(code, `file${ext}`);
      assert.ok(!result.includes("// comment"), `failed for ${ext}`);
      assert.ok(result.includes("const x = 1;"), `failed for ${ext}`);
    }
  });
});

// ---------------------------------------------------------------------------
// PHP minify
// ---------------------------------------------------------------------------

describe("PHP minify", () => {
  it("removes // comments", () => {
    const code = '$x = 1; // comment\n$y = 2;\n';
    const result = minify(code, "file.php");
    assert.ok(!result.includes("// comment"));
  });

  it("removes block comments", () => {
    const code = "/* block */\n$x = 1;\n";
    const result = minify(code, "file.php");
    assert.ok(!result.includes("block"));
  });

  it("removes # comments", () => {
    const code = "# comment\n$x = 1;\n";
    const result = minify(code, "file.php");
    assert.ok(!result.includes("# comment"));
  });

  it("preserves shebang lines", () => {
    const code = "#!/usr/bin/env php\n# comment\n$x = 1;\n";
    const result = minify(code, "file.php");
    assert.ok(result.includes("#!/usr/bin/env php"));
    assert.ok(!result.includes("# comment"));
  });

  it("does not remove // inside URLs", () => {
    const code = '$url = "https://example.com";\n';
    const result = minify(code, "file.php");
    assert.ok(result.includes("https://example.com"));
  });
});

// ---------------------------------------------------------------------------
// Python minify
// ---------------------------------------------------------------------------

describe("Python minify", () => {
  it("removes # comments", () => {
    const code = "# comment\nx = 1\n";
    const result = minify(code, "file.py");
    assert.ok(!result.includes("# comment"));
    assert.ok(result.includes("x = 1"));
  });

  it("preserves shebang lines", () => {
    const code = "#!/usr/bin/env python3\n# comment\nx = 1\n";
    const result = minify(code, "file.py");
    assert.ok(result.includes("#!/usr/bin/env python3"));
    assert.ok(!result.includes("# comment"));
  });

  it("does NOT normalize indentation", () => {
    const code = "def f():\n    x = 1\n    if True:\n        y = 2\n";
    const result = minify(code, "file.py");
    assert.ok(result.includes("    x = 1"));
    assert.ok(result.includes("        y = 2"));
  });
});

// ---------------------------------------------------------------------------
// YAML minify
// ---------------------------------------------------------------------------

describe("YAML minify", () => {
  it("removes # comments", () => {
    const code = "# comment\nkey: value\n";
    const result = minify(code, "file.yaml");
    assert.ok(!result.includes("# comment"));
    assert.ok(result.includes("key: value"));
  });

  it("works with .yml extension", () => {
    const code = "# comment\nkey: value\n";
    const result = minify(code, "file.yml");
    assert.ok(!result.includes("# comment"));
  });

  it("preserves shebang lines", () => {
    const code = "#!/usr/bin/env yaml-lint\n# comment\nkey: value\n";
    const result = minify(code, "file.yaml");
    assert.ok(result.includes("#!/usr/bin/env yaml-lint"));
  });

  it("does NOT normalize indentation", () => {
    const code = "root:\n    child:\n        value: 1\n";
    const result = minify(code, "file.yaml");
    assert.ok(result.includes("    child:"));
    assert.ok(result.includes("        value: 1"));
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("minify edge cases", () => {
  it("handles empty string", () => {
    const result = minify("", "file.js");
    assert.equal(result, "");
  });

  it("handles code with only comments", () => {
    const code = "// comment 1\n// comment 2\n/* block */\n";
    const result = minify(code, "file.js");
    assert.equal(result.trim(), "");
  });

  it("handles inline block comments", () => {
    const code = "const x = /* inline */ 1;\n";
    const result = minify(code, "file.js");
    assert.ok(result.includes("const x ="));
    assert.ok(result.includes("1;"));
    assert.ok(!result.includes("inline"));
  });
});
