/**
 * StorageBucketsSource — enrich-based DataSource for storage services.
 *
 * Reads analysis.storage to generate bucket/container tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class StorageBucketsSource extends DataSource {
  /** Storage buckets/containers list. */
  list(analysis, labels) {
    const items = analysis.storage?.buckets;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (b) => [
      b.name || "—",
      b.provider || b.type || "—",
      b.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Bucket", "Provider", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}
