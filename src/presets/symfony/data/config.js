/**
 * ConfigSource — Symfony configuration DataSource.
 *
 * Symfony-only category using Scannable(DataSource) directly.
 *
 * Available methods (called via {{data}} directives):
 *   config.composer("Package|Version|Description")
 *   config.env("Key|Default|Description")
 *   config.bundles("Bundle|FullName|Description")
 *   config.packages("File|Keys")
 *   config.services("Autowire|Autoconfigure")
 */

import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { analyzeConfig } from "../scan/config.js";

export default class ConfigSource extends WebappDataSource {
  match(file) {
    return file.relPath.startsWith("config/") ||
      file.fileName === ".env" ||
      file.fileName === ".env.local" ||
      file.fileName === "composer.json";
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
    for (const [pkg, ver] of Object.entries(req || {})) {
      rows.push([pkg, ver, this.desc("composerDeps", pkg)]);
    }
    for (const [pkg, ver] of Object.entries(requireDev || {})) {
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
      this.desc("env", e.key, e.summary),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Symfony bundles table. */
  bundles(analysis, labels) {
    const bundles = analysis.config?.bundles;
    if (!bundles || bundles.length === 0) return null;
    const rows = this.toRows(bundles, (b) => [
      b.shortName,
      b.fullName,
      this.desc("bundles", b.shortName, b.summary),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Config packages table. */
  packages(analysis, labels) {
    const configFiles = analysis.config?.configFiles;
    if (!configFiles || configFiles.length === 0) return null;
    const rows = this.toRows(configFiles, (cf) => [
      cf.file,
      cf.keys.join(", ") || "\u2014",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Services configuration table. */
  services(analysis, labels) {
    const services = analysis.config?.services;
    if (!services) return null;
    const rows = [
      [services.autowire ? "YES" : "NO", services.autoconfigure ? "YES" : "NO"],
    ];
    return this.toMarkdownTable(rows, labels);
  }
}
