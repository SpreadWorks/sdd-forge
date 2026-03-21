/**
 * R2StorageSource — Scannable DataSource for Cloudflare R2.
 *
 * Scans wrangler.toml to extract R2 bucket configuration.
 * Reads analysis.storage to generate R2-specific tables.
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { parseTOML } from "../../../docs/lib/toml-parser.js";

export default class R2StorageSource extends Scannable(DataSource) {
  match(file) {
    return file.fileName === "wrangler.toml" || file.fileName === "wrangler.json" || file.fileName === "wrangler.jsonc";
  }

  scan(files) {
    const wranglerFile = files.find(
      (f) => f.fileName === "wrangler.toml" || f.fileName === "wrangler.json" || f.fileName === "wrangler.jsonc",
    );
    if (!wranglerFile) return null;

    const raw = fs.readFileSync(wranglerFile.absPath, "utf8");
    const isToml = wranglerFile.fileName === "wrangler.toml";
    const cfg = isToml ? parseTOML(raw) : JSON.parse(raw);

    const r2Buckets = cfg.r2_buckets || [];
    if (r2Buckets.length === 0) return null;

    const buckets = r2Buckets.map((b) => ({
      name: b.bucket_name || b.binding || "",
      binding: b.binding || "",
      preview_bucket_name: b.preview_bucket_name || "",
    }));

    return {
      buckets,
      summary: {
        totalBuckets: buckets.length,
      },
    };
  }

  /** R2 buckets list. */
  buckets(analysis, labels) {
    const items = analysis.storage?.buckets;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (b) => [
      b.name || "—",
      b.binding || "—",
      b.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Bucket", "Binding", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Access patterns table. */
  access(analysis, labels) {
    const items = analysis.storage?.access;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (a) => [
      a.method || "—",
      a.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Method", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}
