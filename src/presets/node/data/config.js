/**
 * ConfigSource — Node.js language layer DataSource.
 *
 * Provides config.stack() for Node.js projects.
 * Extracts technology stack from package.json (via analysis.extras.packageDeps).
 */

import fs from "fs";
import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";

export default class NodeConfigSource extends DataSource {
  init(ctx) {
    super.init(ctx);
    this._root = ctx.root;
  }

  /** Technology stack table from package.json. */
  stack(analysis, labels) {
    const rows = [];

    // Node.js version from package.json engines
    const pkg = this._loadPkg();
    if (pkg?.engines?.node) {
      rows.push(["Runtime", "Node.js", pkg.engines.node]);
    }

    const deps = analysis.extras?.packageDeps?.dependencies || {};
    const devDeps = analysis.extras?.packageDeps?.devDependencies || {};

    // Module system
    if (pkg?.type === "module") {
      rows.push(["Module", "ES Modules", "—"]);
    }

    // Detect framework
    const fwDetectors = [
      { pkg: "next", name: "Next.js" },
      { pkg: "nuxt", name: "Nuxt" },
      { pkg: "express", name: "Express" },
      { pkg: "fastify", name: "Fastify" },
      { pkg: "koa", name: "Koa" },
      { pkg: "hono", name: "Hono" },
      { pkg: "@nestjs/core", name: "NestJS" },
      { pkg: "react", name: "React" },
      { pkg: "vue", name: "Vue.js" },
      { pkg: "svelte", name: "Svelte" },
      { pkg: "astro", name: "Astro" },
    ];
    for (const { pkg: pkgName, name } of fwDetectors) {
      if (deps[pkgName]) {
        rows.push(["Framework", name, deps[pkgName]]);
        break;
      }
    }

    // Language (TypeScript)
    if (deps.typescript || devDeps.typescript) {
      rows.push(["Language", "TypeScript", deps.typescript || devDeps.typescript]);
    }

    // Key packages
    const keyPackages = [
      { pkg: "prisma", label: "ORM", src: devDeps },
      { pkg: "@prisma/client", label: "ORM Client", src: deps },
      { pkg: "drizzle-orm", label: "ORM", src: deps },
      { pkg: "sequelize", label: "ORM", src: deps },
      { pkg: "mongoose", label: "ODM", src: deps },
      { pkg: "tailwindcss", label: "CSS", src: devDeps },
      { pkg: "eslint", label: "Linter", src: devDeps },
      { pkg: "prettier", label: "Formatter", src: devDeps },
    ];
    for (const { pkg: pkgName, label, src } of keyPackages) {
      if (src[pkgName]) {
        rows.push([label, pkgName, src[pkgName]]);
      }
    }

    // Test framework
    const testFws = [
      { pkg: "jest", name: "Jest" },
      { pkg: "vitest", name: "Vitest" },
      { pkg: "mocha", name: "Mocha" },
    ];
    for (const { pkg: pkgName, name } of testFws) {
      if (devDeps[pkgName]) {
        rows.push(["Testing", name, devDeps[pkgName]]);
        break;
      }
    }

    if (rows.length === 0) return null;
    const hdr = labels.length >= 3 ? labels : ["Category", "Technology", "Version"];
    return this.toMarkdownTable(rows, hdr);
  }

  _loadPkg() {
    if (!this._root) return null;
    const pkgPath = path.join(this._root, "package.json");
    if (!fs.existsSync(pkgPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    } catch (_) {
      return null;
    }
  }
}
