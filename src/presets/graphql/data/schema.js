/**
 * GraphqlSchemaSource — enrich-based DataSource for GraphQL schema.
 *
 * Reads analysis.graphql to generate type/query/mutation tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class GraphqlSchemaSource extends DataSource {
  /** GraphQL types table. */
  types(analysis, labels) {
    const items = analysis.graphql?.types;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (t) => [
      t.name,
      Array.isArray(t.fields) ? t.fields.join(", ") : (t.fields || "—"),
      t.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Type", "Fields", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** GraphQL queries table. */
  queries(analysis, labels) {
    const items = analysis.graphql?.queries;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (q) => [
      q.name,
      q.args || "—",
      q.returnType || "—",
      q.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Query", "Args", "Return", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** GraphQL mutations table. */
  mutations(analysis, labels) {
    const items = analysis.graphql?.mutations;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (m) => [
      m.name,
      m.args || "—",
      m.returnType || "—",
      m.summary || "—",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Mutation", "Args", "Return", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}
