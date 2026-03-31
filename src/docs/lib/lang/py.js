/**
 * Python language handler.
 * Provides minify only.
 */

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

export function minify(code) {
  return removeHashComments(code);
}
