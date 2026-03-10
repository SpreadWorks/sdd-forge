/**
 * DocsSource — common DataSource for docs/ chapter listing.
 *
 * Provides chapter table for README and other docs.
 * Available for all project types.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DataSource } from "../lib/data-source.js";
import { getChapterFiles } from "../lib/command-context.js";
import { loadJsonFile } from "../../lib/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class DocsSource extends DataSource {
  init(ctx) {
    super.init(ctx);
    this._root = ctx.root;
    this._docsDir = ctx.docsDir || null;
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

  /**
   * Language switcher links for the top of each document.
   *
   * Called via: {{data: docs.langSwitcher("relative")}} or {{data: docs.langSwitcher("absolute")}}
   * labels[0] = "relative" or "absolute"
   * labels[1] = relative file path from project root (injected by data.js / readme.js)
   *
   * @returns {string|null} Markdown links or null if single language
   */
  langSwitcher(_analysis, labels) {
    const mode = labels[0] || "relative";
    const filePath = labels[1] || "";
    if (!filePath) return null;

    const config = this._loadConfig();
    if (!config?.output?.languages || config.output.languages.length < 2) return null;

    const languages = config.output.languages;
    const defaultLang = config.output.default;
    const currentLang = this._detectLang(filePath, defaultLang);
    const langNames = this._loadLanguageNames(config.lang || defaultLang);

    const parts = [];
    for (const lang of languages) {
      const displayName = langNames[lang] || lang;
      if (lang === currentLang) {
        parts.push(`**${displayName}**`);
      } else {
        const targetPath = mode === "absolute"
          ? this._computeAbsolutePath(filePath, currentLang, lang, defaultLang)
          : this._computeLangRelativePath(filePath, currentLang, lang, defaultLang);
        parts.push(`[${displayName}](${targetPath})`);
      }
    }

    return parts.join(" | ");
  }

  /**
   * Detect language from file path.
   * Files under docs/{lang}/ → that lang. Others → default.
   */
  _detectLang(filePath, defaultLang) {
    const normalized = filePath.replace(/\\/g, "/");
    const match = normalized.match(/^docs\/([a-z]{2})\//);
    return match ? match[1] : defaultLang;
  }

  /**
   * Compute relative path from current file to same file in another language.
   */
  _computeLangRelativePath(filePath, currentLang, targetLang, defaultLang) {
    const normalized = filePath.replace(/\\/g, "/");
    const fileName = path.basename(normalized);
    const isReadme = fileName === "README.md";

    // README at root (e.g. "README.md")
    if (isReadme && !normalized.includes("/")) {
      // Root README → target lang README
      if (targetLang === defaultLang) return "README.md";
      return `docs/${targetLang}/${fileName}`;
    }

    // README in docs/ja/ etc
    if (isReadme && currentLang !== defaultLang && targetLang === defaultLang) {
      return `../../${fileName}`;
    }
    if (isReadme && currentLang === defaultLang && targetLang !== defaultLang) {
      return `docs/${targetLang}/${fileName}`;
    }

    // Regular docs chapter files
    if (currentLang === defaultLang) {
      return `${targetLang}/${fileName}`;
    } else if (targetLang === defaultLang) {
      return `../${fileName}`;
    } else {
      return `../${targetLang}/${fileName}`;
    }
  }

  /**
   * Compute absolute URL from current file to same file in another language.
   */
  _computeAbsolutePath(filePath, currentLang, targetLang, defaultLang) {
    if (!this._repoUrl) {
      return this._computeLangRelativePath(filePath, currentLang, targetLang, defaultLang);
    }

    const fileName = path.basename(filePath);

    if (targetLang === defaultLang) {
      // Default lang files are at root (README.md) or docs/ (chapters)
      const isReadme = fileName === "README.md";
      if (isReadme) return `${this._repoUrl}/blob/main/README.md`;
      return `${this._repoUrl}/blob/main/docs/${fileName}`;
    }

    // Non-default lang files are in docs/{lang}/
    return `${this._repoUrl}/blob/main/docs/${targetLang}/${fileName}`;
  }

  _loadConfig() {
    try {
      return loadJsonFile(path.join(this._root, ".sdd-forge", "config.json"));
    } catch (_) {
      return {};
    }
  }

  /**
   * Load language display names from locale file.
   */
  _loadLanguageNames(lang) {
    const localeDir = path.resolve(__dirname, "..", "..", "locale");
    const filePath = path.join(localeDir, lang, "ui.json");
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return data.languageNames || {};
    } catch (_) {
      // Fallback to en
      try {
        const fallback = JSON.parse(fs.readFileSync(path.join(localeDir, "en", "ui.json"), "utf8"));
        return fallback.languageNames || {};
      } catch (__) {
        return {};
      }
    }
  }

  /** Chapter table: lists docs/NN_*.md files with title and description. */
  chapters(_analysis, labels) {
    const docsDir = this._docsDir || path.join(this._root, "docs");
    if (!fs.existsSync(docsDir)) return null;

    const files = getChapterFiles(docsDir);

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
        if (/^## (Description|説明|概要)/.test(line)) { inDesc = true; continue; }
        if (inDesc && /^## /.test(line)) break;
        if (inDesc) {
          if (/<!--\s*\{\{(text|data)\s*(\[[^\]]*\])?\s*:/.test(line)) continue;
          if (/<!--\s*\{\{\/(data|text)\}\}\s*-->/.test(line)) continue;
          descLines.push(line);
        }
      }

      const rawDesc = descLines.join(" ").replace(/\s+/g, " ").trim() || "";
      // First sentence: match Japanese (。) or English (. followed by space/end)
      const firstSentence = rawDesc.match(/^.*?[。]|^.*?\.\s/)?.[0]?.trim() || rawDesc;
      const description = firstSentence.length > 120
        ? firstSentence.slice(0, 117) + "…"
        : firstSentence;

      const docsDirRel = this._docsDir
        ? path.relative(this._root, this._docsDir).replace(/\\/g, "/")
        : "docs";
      const link = this._repoUrl
        ? `${this._repoUrl}/blob/main/${docsDirRel}/${f}`
        : `${docsDirRel}/${f}`;
      return [`[${title}](${link})`, description];
    });

    const hdr = labels.length >= 2 ? labels : ["章", "概要"];
    return this.toMarkdownTable(rows, hdr);
  }
}
