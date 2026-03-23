/**
 * StructureSource — enrich-based DataSource for project structure.
 *
 * Reads enriched analysis items to generate directory tree and role tables.
 */

import { DataSource } from "../../../docs/lib/data-source.js";

const META_KEYS = new Set(["analyzedAt", "enrichedAt", "generatedAt", "files", "root"]);

/** Collect all items across all analysis categories. */
function allItems(analysis) {
  const items = [];
  for (const [key, val] of Object.entries(analysis)) {
    if (META_KEYS.has(key)) continue;
    if (!val || typeof val !== "object") continue;
    const arr = Array.isArray(val) ? val : val[key] || Object.values(val).find(Array.isArray);
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const p = item?.relPath || item?.file;
      if (p) items.push({ ...item, relPath: p });
      }
    }
  }
  return items;
}

/** Extract parent directories from items and count files per directory. */
function buildDirectoryMap(items) {
  const dirs = new Map();
  for (const item of items) {
    const parts = item.relPath.split("/");
    if (parts.length < 2) continue;
    const dir = parts.slice(0, -1).join("/");
    if (!dirs.has(dir)) dirs.set(dir, { count: 0, roles: new Set() });
    const entry = dirs.get(dir);
    entry.count++;
    if (item.role) entry.roles.add(item.role);
  }
  return dirs;
}

export default class StructureSource extends DataSource {
  /** Directory tree as a code block. */
  tree(analysis, _labels) {
    if (!analysis?.enrichedAt) return null;
    const items = allItems(analysis);
    if (items.length === 0) return null;
    const dirs = buildDirectoryMap(items);
    if (dirs.size === 0) return null;

    const sorted = [...dirs.keys()].sort();
    const lines = ["```"];
    for (const dir of sorted) {
      const info = dirs.get(dir);
      const roles = [...info.roles].join(", ");
      lines.push(`${dir}/    ${roles ? `(${roles})` : ""}`);
    }
    lines.push("```");
    return lines.join("\n");
  }

  /** Major directories with file counts and roles. */
  directories(analysis, labels) {
    if (!analysis?.enrichedAt) return null;
    const items = allItems(analysis);
    if (items.length === 0) return null;
    const dirs = buildDirectoryMap(items);
    if (dirs.size === 0) return null;

    // Only top-level directories
    const topDirs = new Map();
    for (const [dir, info] of dirs) {
      const top = dir.split("/")[0];
      if (!topDirs.has(top)) topDirs.set(top, { count: 0, roles: new Set() });
      const entry = topDirs.get(top);
      entry.count += info.count;
      for (const r of info.roles) entry.roles.add(r);
    }

    const rows = [...topDirs.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([dir, info]) => [dir, String(info.count), [...info.roles].join(", ") || "—"]);
    const hdr = labels.length >= 2 ? labels : ["Directory", "Files", "Role"];
    return this.toMarkdownTable(rows, hdr);
  }
}
