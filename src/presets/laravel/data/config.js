/**
 * ConfigSource — Laravel configuration DataSource.
 *
 * Combines scan (source code extraction) and resolve (Markdown rendering)
 * into a single self-contained class.
 *
 * Available methods (called via {{data}} directives):
 *   config.composer("Package|Version|Description")
 *   config.env("Key|Default|Description")
 *   config.providers("Name|File|Register|Boot")
 *   config.middleware("Name|File|Description")
 *   config.files("File|Keys")
 */

import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { analyzeConfig } from "../scan/config.js";

export default class ConfigSource extends WebappDataSource {
  match(file) {
    return (
      (file.relPath.startsWith("config/") && file.relPath.endsWith(".php")) ||
      file.relPath === ".env.example" ||
      file.relPath === "composer.json"
    );
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    return analyzeConfig(sourceRoot);
  }

  /** Composer dependencies table. */
  composer(analysis, labels) {
    if (!analysis.config?.composerDeps) return null;
    const { require: req, requireDev } = analysis.config.composerDeps;
    const rows = [];
    for (const [pkg, ver] of Object.entries(req)) {
      rows.push([pkg, ver, this.desc("composerDeps", pkg)]);
    }
    for (const [pkg, ver] of Object.entries(requireDev)) {
      rows.push([`${pkg} (dev)`, ver, this.desc("composerDeps", pkg)]);
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  /** Environment variables table. */
  env(analysis, labels) {
    const envKeys = analysis.config?.envKeys;
    if (!envKeys || envKeys.length === 0) return null;
    const items = this.mergeDesc(envKeys, "env", "key");
    const rows = this.toRows(items, (e) => [
      e.key,
      e.defaultValue || "\u2014",
      e.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Service providers table. */
  providers(analysis, labels) {
    const providers = analysis.config?.providers;
    if (!providers || providers.length === 0) return null;
    const rows = this.toRows(providers, (p) => [
      p.className,
      p.file,
      p.hasRegister ? "YES" : "\u2014",
      p.hasBoot ? "YES" : "\u2014",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** HTTP middleware table. */
  middleware(analysis, labels) {
    const mw = analysis.config?.middleware;
    if (!mw || mw.length === 0) return null;
    const items = this.mergeDesc(mw, "middleware");
    const rows = this.toRows(items, (m) => [
      m.className,
      m.file,
      m.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Config files and their top-level keys. */
  files(analysis, labels) {
    const configFiles = analysis.config?.configFiles;
    if (!configFiles || configFiles.length === 0) return null;
    const rows = this.toRows(configFiles, (cf) => [
      cf.file,
      cf.keys.join(", ") || "\u2014",
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}
