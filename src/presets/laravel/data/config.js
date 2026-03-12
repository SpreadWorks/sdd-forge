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

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeConfig } from "../scan/config.js";

function deriveSourceRoot(files) {
  const f = files[0];
  return f.absPath.slice(0, f.absPath.length - f.relPath.length).replace(/\/$/, "");
}

export default class ConfigSource extends Scannable(DataSource) {
  match(file) {
    return (
      (file.relPath.startsWith("config/") && file.relPath.endsWith(".php")) ||
      file.relPath === ".env.example" ||
      file.relPath === "composer.json"
    );
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = deriveSourceRoot(files);
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
    const rows = this.toRows(envKeys, (e) => [
      e.key,
      e.defaultValue || "\u2014",
      this.desc("env", e.key),
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
    const rows = this.toRows(mw, (m) => [
      m.className,
      m.file,
      this.desc("middleware", m.className),
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
