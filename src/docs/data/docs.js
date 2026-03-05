/**
 * DocsSource — common DataSource for docs/ chapter listing.
 *
 * Provides chapter table for README and other docs.
 * Available for all project types.
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../lib/data-source.js";

export default class DocsSource extends DataSource {
  init(ctx) {
    super.init(ctx);
    this._root = ctx.root;
  }

  /** Chapter table: lists docs/NN_*.md files with title and description. */
  chapters(_analysis, labels) {
    const docsDir = path.join(this._root, "docs");
    if (!fs.existsSync(docsDir)) return null;

    const files = fs.readdirSync(docsDir)
      .filter((f) => /^\d{2}_.*\.md$/.test(f))
      .sort();

    if (files.length === 0) return null;

    const rows = files.map((f) => {
      const content = fs.readFileSync(path.join(docsDir, f), "utf8");
      const lines = content.split("\n");

      // Title: first # NN. line
      const titleLine = lines.find((l) => /^# \d{2}\./.test(l));
      const title = titleLine ? titleLine.replace(/^# /, "") : f.replace(/\.md$/, "");

      // Description: ## 説明 ~ next ##
      let inDesc = false;
      const descLines = [];
      for (const line of lines) {
        if (/^## 説明/.test(line)) { inDesc = true; continue; }
        if (inDesc && /^## /.test(line)) break;
        if (inDesc) {
          if (/<!--\s*@(text|data)\s*(\[[^\]]*\])?\s*:/.test(line)) continue;
          if (/<!--\s*@end(data|text)\s*-->/.test(line)) continue;
          descLines.push(line);
        }
      }

      const rawDesc = descLines.join(" ").replace(/\s+/g, " ").trim() || "";
      const firstSentence = rawDesc.match(/^[^。]*。/)?.[0] || rawDesc;
      const description = firstSentence.length > 120
        ? firstSentence.slice(0, 117) + "…"
        : firstSentence;

      return [`[${title}](docs/${f})`, description];
    });

    const hdr = labels.length >= 2 ? labels : ["章", "概要"];
    return this.toMarkdownTable(rows, hdr);
  }
}
