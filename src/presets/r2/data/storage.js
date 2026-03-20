/**
 * R2StorageSource — enrich-based DataSource for Cloudflare R2.
 *
 * Reads analysis.storage to generate R2-specific tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class R2StorageSource extends DataSource {
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
