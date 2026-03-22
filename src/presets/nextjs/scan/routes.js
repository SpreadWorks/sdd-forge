/**
 * Next.js ルート解析器。
 * App Router (app/, src/app/) と Pages Router (pages/, src/pages/) を解析し、
 * ルートパス・動的パラメータ・ルートハンドラの HTTP メソッドを抽出する。
 */

import fs from "fs";
import path from "path";
import { collectFiles } from "../../../docs/lib/scanner.js";

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

/**
 * @param {string} sourceRoot - プロジェクトルート
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
    const fileType = classifyRouteFile(baseName);
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
    // Skip _app, _document, _error (Next.js special files)
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

/** Convert Pages Router file path to URL route path. */
function pageFileToRoute(relPath, baseName) {
  const dir = dirToRoute(relPath);
  if (baseName === "index") return dir;
  return dir === "/" ? `/${baseName}` : `${dir}/${baseName}`;
}

/** Convert directory-based path to URL route path (App Router). */
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

/** Determine route file type. */
function classifyRouteFile(baseName) {
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
