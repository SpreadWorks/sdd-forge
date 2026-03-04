/**
 * analyze-assets.js
 *
 * Frontend asset analyzers: JS/CSS files.
 */

import fs from "fs";
import path from "path";

export const JS_LIBRARY_PATTERNS = [
  { pattern: /jquery-(\d+\.\d+\.\d+)/i, library: "jQuery" },
  { pattern: /jquery[-.]ui/i, library: "jQuery UI" },
  { pattern: /jquery[-.]cookie/i, library: "jQuery Cookie" },
  { pattern: /jquery[-.]datePicker/i, library: "jQuery DatePicker" },
  { pattern: /jquery[-.]datetimePicker/i, library: "jQuery DateTimePicker" },
  { pattern: /jquery[-.]fancybox/i, library: "FancyBox" },
  { pattern: /jquery[-.]tablefix/i, library: "jQuery TableFix" },
  { pattern: /highcharts/i, library: "Highcharts" },
];

export function analyzeAssets(appDir) {
  const jsDir = path.join(appDir, "webroot", "js");
  const cssDir = path.join(appDir, "webroot", "css");
  const result = { js: [], css: [] };

  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"));
    for (const file of jsFiles) {
      const filePath = path.join(jsDir, file);
      const stat = fs.statSync(filePath);
      const entry = { file, size: stat.size };

      // ライブラリ検出
      for (const { pattern, library } of JS_LIBRARY_PATTERNS) {
        const m = file.match(pattern);
        if (m) {
          entry.library = library;
          if (m[1]) entry.version = m[1];
          break;
        }
      }

      if (!entry.library) {
        entry.type = "custom";
      }

      result.js.push(entry);
    }
    result.js.sort((a, b) => a.file.localeCompare(b.file));
  }

  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css"));
    for (const file of cssFiles) {
      const filePath = path.join(cssDir, file);
      const stat = fs.statSync(filePath);
      const isLib = /jquery|fancybox|datepicker|datetimepicker/i.test(file) || file === "cake.generic.css";
      result.css.push({
        file,
        size: stat.size,
        type: isLib ? "library" : "custom",
      });
    }
    result.css.sort((a, b) => a.file.localeCompare(b.file));
  }

  return result;
}
