import path from "node:path";

// ---------------------------------------------------------------------------
// Generic utilities
// ---------------------------------------------------------------------------

function removeBlankLines(code) {
  return code
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
}

function removeTrailingWhitespace(code) {
  return code
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
}

function removeLineComments(code, pattern) {
  return code
    .split("\n")
    .map((line) => line.replace(pattern, "").trimEnd())
    .filter((line) => line.trim() !== "")
    .join("\n");
}

function removeBlockComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, "");
}

function removeHashComments(code) {
  return code
    .split("\n")
    .map((line) => {
      if (line.match(/^#!/)) return line;
      return line.replace(/(?:^|\s)#.*$/, "").trimEnd();
    })
    .filter((line) => line.trim() !== "")
    .join("\n");
}

function normalizeIndent(code, from, to) {
  return code
    .split("\n")
    .map((line) => {
      const match = line.match(/^( +)/);
      if (!match) return line;
      const spaces = match[1].length;
      const level = Math.floor(spaces / from);
      const remainder = spaces % from;
      return " ".repeat(level * to + remainder) + line.slice(spaces);
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Language-specific minifiers
// ---------------------------------------------------------------------------

const LINE_COMMENT_PATTERN = /(?<!:)\/\/.*/;

function minifyJsLike(code) {
  let result = removeBlockComments(code);
  result = removeLineComments(result, LINE_COMMENT_PATTERN);
  result = normalizeIndent(result, 4, 2);
  return result;
}

function minifyPhp(code) {
  let result = removeBlockComments(code);
  result = removeLineComments(result, LINE_COMMENT_PATTERN);
  result = removeHashComments(result);
  return result;
}

function minifyPython(code) {
  return removeHashComments(code);
}

function minifyYaml(code) {
  return removeHashComments(code);
}

// ---------------------------------------------------------------------------
// Extension → minifier mapping
// ---------------------------------------------------------------------------

const LANG_MINIFIERS = {
  ".js": minifyJsLike,
  ".ts": minifyJsLike,
  ".mjs": minifyJsLike,
  ".cjs": minifyJsLike,
  ".jsx": minifyJsLike,
  ".tsx": minifyJsLike,
  ".php": minifyPhp,
  ".py": minifyPython,
  ".yaml": minifyYaml,
  ".yml": minifyYaml,
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function minify(code, filePath) {
  if (!code) return code;

  let result = removeBlankLines(code);
  result = removeTrailingWhitespace(result);

  const ext = path.extname(filePath).toLowerCase();
  const langMinifier = LANG_MINIFIERS[ext];
  if (langMinifier) {
    result = langMinifier(result);
  }

  // Final cleanup: remove blank lines introduced by comment removal
  result = removeBlankLines(result);

  return result;
}
