/**
 * RoutesSource — scan + data DataSource for Next.js routes.
 *
 * Analyzes Next.js file-based routing (App Router and Pages Router).
 * Each file produces one NextjsRouteEntry with a routeType discriminator.
 * Data methods read analysis.routes to generate route tables.
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { AnalysisEntry } from "../../../docs/lib/analysis-entry.js";
import { collectFiles } from "../../../docs/lib/scanner.js";
import { hasAnyPathPrefix } from "../../lib/path-match.js";

const ROUTE_FILE_PREFIXES = ["app/", "pages/", "src/app/", "src/pages/"];
const ROUTE_EXT = /\.(ts|tsx|js|jsx)$/;

/** Convert directory-based path to URL route path. */
function dirToRoute(relPath) {
  const parts = relPath.replace(/\\/g, "/").split("/");
  const start = parts[0] === "src" ? 2 : 1;
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

export class NextjsRouteEntry extends AnalysisEntry {
  routePath = null;
  routeType = null;
  fileType = null;
  dynamicParams = null;
  method = null;
  dataFetch = null;

  static summary = {};
}

export default class RoutesSource extends Scannable(DataSource) {
  static Entry = NextjsRouteEntry;

  match(relPath) {
    return ROUTE_EXT.test(relPath) && hasAnyPathPrefix(relPath, ROUTE_FILE_PREFIXES);
  }

  parse(absPath) {
    const entry = new NextjsRouteEntry();
    const content = fs.readFileSync(absPath, "utf8");

    // Determine router type from path
    const isAppRouter = /[/\\](app|src[/\\]app)[/\\]/.test(absPath);
    const isPagesRouter = /[/\\](pages|src[/\\]pages)[/\\]/.test(absPath);

    // We need a pseudo-relPath to compute the route path.
    // Extract the relevant portion starting from app/ or pages/
    const normalized = absPath.replace(/\\/g, "/");
    let relLike;
    const appMatch = normalized.match(/((?:src\/)?app\/.*)$/);
    const pagesMatch = normalized.match(/((?:src\/)?pages\/.*)$/);
    relLike = appMatch ? appMatch[1] : pagesMatch ? pagesMatch[1] : path.basename(absPath);

    const routePath = dirToRoute(relLike);
    const fileType = classifyRouteFile(absPath);
    const params = extractDynamicParams(routePath);

    entry.routePath = routePath;
    entry.fileType = fileType;
    entry.dynamicParams = params.length > 0 ? params.join(", ") : null;

    if (isAppRouter) {
      if (fileType === "route-handler") {
        entry.routeType = "handler";
        const methods = [];
        for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
          const re = new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`);
          if (re.test(content)) methods.push(method);
        }
        entry.method = methods.join(", ") || "\u2014";
      } else {
        entry.routeType = "app";
      }
    } else if (isPagesRouter) {
      entry.routeType = "page";
      entry.dataFetch = detectDataFetch(content);
    }

    return entry;
  }

  /** App Router structure table. */
  app(analysis, labels) {
    const items = (analysis.routes?.entries || []).filter(
      (r) => r.routeType === "app",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.routePath || "\u2014",
      r.fileType || "\u2014",
      r.file || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Path", "Type", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Pages Router structure table. */
  pages(analysis, labels) {
    const items = (analysis.routes?.entries || []).filter(
      (r) => r.routeType === "page",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.routePath || "\u2014",
      r.dataFetch || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Page", "Data Fetching", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** Dynamic route patterns table. */
  dynamic(analysis, labels) {
    const items = (analysis.routes?.entries || []).filter(
      (r) => r.dynamicParams != null,
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.routePath || "\u2014",
      r.dynamicParams || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Pattern", "Parameters", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }

  /** API route handlers table. */
  handlers(analysis, labels) {
    const items = (analysis.routes?.entries || []).filter(
      (r) => r.routeType === "handler",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (r) => [
      r.method || "\u2014",
      r.routePath || "\u2014",
      r.file || "\u2014",
      r.summary || "\u2014",
    ]);
    const hdr = labels.length >= 2 ? labels : ["Method", "Path", "File", "Description"];
    return this.toMarkdownTable(rows, hdr);
  }
}

// ---------------------------------------------------------------------------
// Directory-level analyzer (moved from scan/routes.js, used by tests)
// ---------------------------------------------------------------------------

const APP_INCLUDE = [
  "app/**/*.ts", "app/**/*.tsx", "app/**/*.js", "app/**/*.jsx",
  "src/app/**/*.ts", "src/app/**/*.tsx", "src/app/**/*.js", "src/app/**/*.jsx",
];

const PAGES_INCLUDE = [
  "pages/**/*.ts", "pages/**/*.tsx", "pages/**/*.js", "pages/**/*.jsx",
  "src/pages/**/*.ts", "src/pages/**/*.tsx", "src/pages/**/*.js", "src/pages/**/*.jsx",
];

const APP_ROUTER_FILES = new Set([
  "page", "layout", "loading", "error", "not-found", "template", "default", "route",
]);

/** Convert Pages Router file path to URL route path. */
function pageFileToRoute(relPath, baseName) {
  const dir = dirToRoute(relPath);
  if (baseName === "index") return dir;
  return dir === "/" ? `/${baseName}` : `${dir}/${baseName}`;
}

/** Determine route file type (scan-level version). */
function classifyScanRouteFile(baseName) {
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
  return types[baseName] || "other";
}

/**
 * @param {string} sourceRoot
 */
export function analyzeRoutes(sourceRoot) {
  const appFiles = collectFiles(sourceRoot, APP_INCLUDE);
  const pagesFiles = collectFiles(sourceRoot, PAGES_INCLUDE);

  const app = [];
  const pages = [];
  const dynamic = [];
  const handlers = [];

  for (const f of appFiles) {
    const baseName = path.basename(f.fileName, path.extname(f.fileName));
    if (!APP_ROUTER_FILES.has(baseName)) continue;

    const routePath = dirToRoute(f.relPath);
    const fileType = classifyScanRouteFile(baseName);
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

  for (const f of pagesFiles) {
    const baseName = path.basename(f.fileName, path.extname(f.fileName));
    if (baseName.startsWith("_")) continue;

    const routePath = pageFileToRoute(f.relPath, baseName);
    const content = fs.readFileSync(f.absPath, "utf8");
    const dataFetch = detectDataFetch(content);
    const params = extractDynamicParams(routePath);

    pages.push({
      path: routePath,
      file: f.relPath,
      relPath: f.relPath,
      type: "page",
      dataFetch,
      lines: f.lines,
      hash: f.hash,
      mtime: f.mtime,
    });

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
