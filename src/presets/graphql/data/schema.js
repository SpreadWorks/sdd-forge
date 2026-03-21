/**
 * GraphqlSchemaSource — Scannable DataSource for GraphQL schema.
 *
 * Scans .graphql/.gql files to extract type definitions,
 * queries, and mutations via regex.
 *
 * Available methods:
 *   schema.types("Type|Fields|Description")
 *   schema.queries("Query|Args|Return|Description")
 *   schema.mutations("Mutation|Args|Return|Description")
 */

import fs from "fs";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

/** Match type definitions: type Foo implements Bar { ... } */
const TYPE_RE = /type\s+(\w+)\s*(?:implements\s+[\w\s&]+)?\s*\{([^}]*)\}/g;

/** Match fields inside a type: name(args): ReturnType */
const FIELD_RE = /(\w+)\s*(?:\([^)]*\))?\s*:\s*([^\n]+)/g;

/** Match field with args for query/mutation: name(arg: Type, ...): ReturnType */
const FIELD_ARGS_RE = /(\w+)\s*(?:\(([^)]*)\))?\s*:\s*([^\n]+)/g;

export default class GraphqlSchemaSource extends Scannable(DataSource) {
  match(file) {
    return /\.(?:graphql|gql)$/.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;

    const types = [];
    const queries = [];
    const mutations = [];

    for (const f of files) {
      const content = fs.readFileSync(f.absPath, "utf8");

      for (const m of content.matchAll(TYPE_RE)) {
        const typeName = m[1];
        const body = m[2];

        if (typeName === "Query") {
          for (const fm of body.matchAll(FIELD_ARGS_RE)) {
            queries.push({
              name: fm[1],
              args: fm[2] ? fm[2].trim() : "—",
              returnType: fm[3].trim(),
            });
          }
        } else if (typeName === "Mutation") {
          for (const fm of body.matchAll(FIELD_ARGS_RE)) {
            mutations.push({
              name: fm[1],
              args: fm[2] ? fm[2].trim() : "—",
              returnType: fm[3].trim(),
            });
          }
        } else {
          const fields = [];
          for (const fm of body.matchAll(FIELD_RE)) {
            fields.push(fm[1]);
          }
          types.push({ name: typeName, fields });
        }
      }
    }

    return {
      types,
      queries,
      mutations,
      summary: { totalTypes: types.length, totalQueries: queries.length, totalMutations: mutations.length },
    };
  }

  /** GraphQL types table. */
  types(analysis, labels) {
    const items = analysis.schema?.types;
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
    const items = analysis.schema?.queries;
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
    const items = analysis.schema?.mutations;
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
