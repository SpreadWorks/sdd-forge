/**
 * experimental/workflow/lib/board-helpers.js
 *
 * Shared helpers for board item rendering and lookup.
 */

import { extractId } from "./hash.js";

export function findItem(nodes, hash) {
  return nodes.find((n) => {
    const title = n.content?.title || "";
    return title.startsWith(`${hash}: `);
  });
}

export function formatItem(node) {
  const c = node.content || {};
  const status = node.fieldValueByName?.name || "—";
  const id = extractId(c.title || "") || "—";
  return {
    id,
    status,
    title: c.title || "(no title)",
    issueNumber: c.number || null,
    issueUrl: c.url || null,
  };
}

export function parseJsonResponse(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    const lines = trimmed.split("\n");
    if (lines.length >= 3 && lines.at(-1) === "```") {
      return JSON.parse(lines.slice(1, -1).join("\n"));
    }
  }
  return JSON.parse(trimmed);
}
