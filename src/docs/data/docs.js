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
    this._repoUrl = this._resolveRepoUrl();
  }

  _resolveRepoUrl() {
    const pkgPath = path.join(this._root, "package.json");
    if (!fs.existsSync(pkgPath)) return null;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const repo = pkg.repository;
    if (!repo) return null;
    const url = typeof repo === "string" ? repo : repo.url;
    if (!url) return null;
    return url.replace(/^git\+/, "").replace(/\.git$/, "");
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

      // Description: ## Description / ## 説明 ~ next ##
      let inDesc = false;
      const descLines = [];
      for (const line of lines) {
        if (/^## (Description|説明)/.test(line)) { inDesc = true; continue; }
        if (inDesc && /^## /.test(line)) break;
        if (inDesc) {
          if (/<!--\s*\{\{(text|data)\s*(\[[^\]]*\])?\s*:/.test(line)) continue;
          if (/<!--\s*\{\{\/data\}\}\s*-->/.test(line)) continue;
          descLines.push(line);
        }
      }

      const rawDesc = descLines.join(" ").replace(/\s+/g, " ").trim() || "";
      // First sentence: match Japanese (。) or English (. followed by space/end)
      const firstSentence = rawDesc.match(/^.*?[。]|^.*?\.\s/)?.[0]?.trim() || rawDesc;
      const description = firstSentence.length > 120
        ? firstSentence.slice(0, 117) + "…"
        : firstSentence;

      const link = this._repoUrl
        ? `${this._repoUrl}/blob/main/docs/${f}`
        : `docs/${f}`;
      return [`[${title}](${link})`, description];
    });

    const hdr = labels.length >= 2 ? labels : ["章", "概要"];
    return this.toMarkdownTable(rows, hdr);
  }
}
