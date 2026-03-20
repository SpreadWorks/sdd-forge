/**
 * NextjsComponentsSource — enrich-based DataSource for Next.js components.
 *
 * Reads analysis.components to generate component tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

function filterByType(analysis, type) {
  const items = analysis.components?.components;
  if (!Array.isArray(items)) return [];
  return items.filter((c) => c.type === type);
}

export default class NextjsComponentsSource extends DataSource {
  /** Server Components table. */
  server(analysis, labels) {
    const items = filterByType(analysis, "server");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "—",
      c.relPath || "—",
      c.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Client Components table. */
  client(analysis, labels) {
    const items = filterByType(analysis, "client");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "—",
      c.relPath || "—",
      c.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Shared/UI Components table. */
  shared(analysis, labels) {
    const items = filterByType(analysis, "shared");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (c) => [
      c.name || "—",
      c.relPath || "—",
      c.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Component", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}
