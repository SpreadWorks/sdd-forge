/**
 * RoutesSource — scan + data DataSource for Next.js routes.
 *
 * Analyzes Next.js file-based routing (App Router and Pages Router).
 * Data methods read analysis.routes to generate route tables.
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

const ROUTE_FILES = /^(app|pages|src\/app|src\/pages)\//;
const ROUTE_EXT = /\.(ts|tsx|js|jsx)$/;

/** Convert directory-based path to URL route path. */
function dirToRoute(relPath) {
  const parts = relPath.replace(/\\/g, "/").split("/");
  // Strip leading "app" / "src/app" / "pages" / "src/pages"
  const start = parts[0] === "src" ? 2 : 1;
  // Remove filename
  const dirParts = parts.slice(start, -1);
  if (dirParts.length === 0) return "/";
  return "/" + dirParts.join("/");
}

/** Detect dynamic route segments. */
function extractDynamicParams(routePath) {
  const params = [];
  const re = /\[{1,2}\.{0,3}(\w+)\]{1,2}/g;
  let m;
  while ((m = re.exec(routePath)) !== null) {
    params.push(m[0]);
  }
  return params;
}

/** Detect data fetching method in Pages Router files. */
function detectDataFetch(content) {
  const methods = [];
  if (/export\s+(async\s+)?function\s+getStaticProps/.test(content)) methods.push("getStaticProps");
  if (/export\s+(async\s+)?function\s+getServerSideProps/.test(content)) methods.push("getServerSideProps");
  if (/export\s+(async\s+)?function\s+getStaticPaths/.test(content)) methods.push("getStaticPaths");
  return methods.join(", ") || "\u2014";
}

/** Determine route file type (page, layout, route handler, etc.). */
function classifyRouteFile(fileName) {
  const base = path.basename(fileName, path.extname(fileName));
  const types = {
    page: "page",
    layout: "layout",
    loading: "loading",
    error: "error",
    "not-found": "not-found",
    template: "template",
    default: "default",
    route: "route-handler",
  };
  return types[base] || "other";
}

export default class RoutesSource extends Scannable(DataSource) {
  match(file) {
    return ROUTE_EXT.test(file.relPath) && ROUTE_FILES.test(file.relPath);
  }

  scan(files) {
    if (files.length === 0) return null;

    const app = [];
    const pages = [];
    const dynamic = [];
    const handlers = [];

    for (const f of files) {
      const routePath = dirToRoute(f.relPath);
      const isAppRouter = /^(app|src\/app)\//.test(f.relPath);
      const isPagesRouter = /^(pages|src\/pages)\//.test(f.relPath);
      const fileType = classifyRouteFile(f.fileName);
      const params = extractDynamicParams(routePath);
      const entry = {
        path: routePath,
        file: f.relPath,
        relPath: f.relPath,
        type: fileType,
        lines: f.lines,
        hash: f.hash,
        mtime: f.mtime,
      };

      if (isAppRouter) {
        if (fileType === "route-handler") {
          const content = fs.readFileSync(f.absPath, "utf8");
          const methods = [];
          for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
            const re = new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`);
            if (re.test(content)) methods.push(method);
          }
          handlers.push({ ...entry, method: methods.join(", ") || "\u2014" });
        } else {
          app.push(entry);
        }
      } else if (isPagesRouter) {
        const content = fs.readFileSync(f.absPath, "utf8");
        pages.push({ ...entry, dataFetch: detectDataFetch(content) });
      }

      if (params.length > 0) {
        dynamic.push({
          pattern: routePath,
          params: params.join(", "),
          file: f.relPath,
          hash: f.hash,
          mtime: f.mtime,
        });
      }
    }

    return {
      app,
      pages,
      dynamic,
      handlers,
      summary: {
        totalApp: app.length,
        totalPages: pages.length,
        totalDynamic: dynamic.length,
        totalHandlers: handlers.length,
      },
    };
  }

  /** App Router structure table. */
  app(analysis, labels) {
    const items = analysis.routes?.app;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.path || "\u2014",
      r.type || "\u2014",
      r.file || r.relPath || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Path", "Type", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Pages Router structure table. */
  pages(analysis, labels) {
    const items = analysis.routes?.pages;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.path || "\u2014",
      r.dataFetch || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Page", "Data Fetching", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Dynamic route patterns table. */
  dynamic(analysis, labels) {
    const items = analysis.routes?.dynamic;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.pattern || "\u2014",
      r.params || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Pattern", "Parameters", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** API route handlers table. */
  handlers(analysis, labels) {
    const items = analysis.routes?.handlers;
    if (!Array.isArray(items) || items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.method || "\u2014",
      r.path || "\u2014",
      r.file || r.relPath || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Method", "Path", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}
