/**
 * sdd-forge/presets/webapp/symfony/resolver.js
 *
 * Symfony 固有のカテゴリ → analysis.json データ変換マップ。
 * base.js の汎用カテゴリに追加・上書きする。
 */

/**
 * @param {function} desc - description 解決関数 (section, key) => string
 * @param {function} loadOverrides - overrides.json ローダ
 * @returns {Object<string, function>}
 */
export function createSymfonyCategories(desc, loadOverrides) {
  return {
    // ----- controllers -----
    controllers: (a) => {
      const ctrls = a.extras?.symfonyControllers || a.controllers?.controllers || [];
      return ctrls.map((c) => ({
        name: c.className,
        file: c.file,
        description: desc("controllers", c.className),
      }));
    },

    "controllers.actions": (a) => {
      const ctrls = a.extras?.symfonyControllers || [];
      const rows = [];
      for (const c of ctrls) {
        for (const action of c.actions || []) {
          rows.push({
            controller: c.className,
            action: action.name,
          });
        }
      }
      return rows;
    },

    "controllers.di": (a) => {
      const ctrls = a.extras?.symfonyControllers || [];
      const rows = [];
      for (const c of ctrls) {
        for (const dep of c.diDeps || []) {
          rows.push({
            controller: c.className,
            dependency: dep,
          });
        }
      }
      return rows;
    },

    // ----- tables (from migrations) -----
    tables: (a) => {
      const tables = a.extras?.migrations || [];
      return tables.map((t) => ({
        name: t.name,
        columns: t.columns.length,
        description: desc("tables", t.name),
      }));
    },

    "tables.columns": (a) => {
      const tables = a.extras?.migrations || [];
      const rows = [];
      for (const t of tables) {
        for (const col of t.columns) {
          rows.push({
            table: t.name,
            column: col.name,
            type: col.type,
            nullable: col.nullable ? "YES" : "NO",
          });
        }
      }
      return rows;
    },

    "tables.fk": (a) => {
      const tables = a.extras?.migrations || [];
      const rows = [];
      for (const t of tables) {
        for (const fk of t.foreignKeys) {
          rows.push({
            table: t.name,
            column: fk.column,
            references: `${fk.on}.${fk.references}`,
          });
        }
      }
      return rows;
    },

    // ----- entities (Doctrine) -----
    "entities.relations": (a) => {
      const entities = a.extras?.symfonyEntities || [];
      const rows = [];
      for (const entity of entities) {
        if (!entity.relations) continue;
        const targets = [];
        for (const [type, list] of Object.entries(entity.relations)) {
          if (Array.isArray(list) && list.length > 0) {
            targets.push(`${type}: ${list.map((r) => r.target).join(", ")}`);
          }
        }
        if (targets.length > 0) {
          rows.push({ entity: entity.className, associations: targets.join(" / ") });
        }
      }
      rows.sort((a, b) => a.entity.localeCompare(b.entity));
      return rows;
    },

    "entities.columns": (a) => {
      const entities = a.extras?.symfonyEntities || [];
      const rows = [];
      for (const entity of entities) {
        for (const col of entity.columns || []) {
          rows.push({
            entity: entity.className,
            column: col.name,
            type: col.type,
            nullable: col.nullable ? "YES" : "NO",
            id: col.id ? "PK" : "",
          });
        }
      }
      return rows;
    },

    // ----- routes -----
    routes: (a) => {
      const routes = a.extras?.symfonyRoutes || [];
      return routes.map((r) => ({
        method: (r.methods || []).join("|") || "*",
        path: r.path,
        controller: r.controller,
        name: r.name || "",
      }));
    },

    "routes.attribute": (a) => {
      const routes = a.extras?.symfonyRoutes || [];
      return routes
        .filter((r) => r.source === "attribute")
        .map((r) => ({
          method: (r.methods || []).join("|") || "*",
          path: r.path,
          controller: r.controller,
          name: r.name || "",
        }));
    },

    "routes.yaml": (a) => {
      const routes = a.extras?.symfonyRoutes || [];
      return routes
        .filter((r) => r.source === "yaml")
        .map((r) => ({
          method: (r.methods || []).join("|") || "*",
          path: r.path,
          controller: r.controller,
          name: r.name || "",
        }));
    },

    // ----- commands (Console) -----
    commands: (a) => {
      const shells = a.shells?.shells || [];
      return shells.map((s) => ({
        name: s.className,
        file: s.file,
        description: desc("commands", s.className),
      }));
    },

    // ----- config -----
    "config.composer": (a) => {
      if (!a.extras?.composerDeps) return [];
      const rows = [];
      for (const [pkg, ver] of Object.entries(a.extras.composerDeps.require)) {
        rows.push({ package: pkg, version: ver, description: desc("composerDeps", pkg) });
      }
      for (const [pkg, ver] of Object.entries(a.extras.composerDeps.requireDev)) {
        rows.push({ package: `${pkg} (dev)`, version: ver, description: desc("composerDeps", pkg) });
      }
      return rows;
    },

    "config.env": (a) => {
      if (!a.extras?.envKeys) return [];
      return a.extras.envKeys.map((e) => ({
        key: e.key,
        default: e.defaultValue || "—",
        description: desc("env", e.key),
      }));
    },

    "config.bundles": (a) => {
      if (!a.extras?.bundles) return [];
      return a.extras.bundles.map((b) => ({
        bundle: b.shortName,
        fullName: b.fullName,
        description: desc("bundles", b.shortName),
      }));
    },

    "config.packages": (a) => {
      if (!a.extras?.configFiles) return [];
      return a.extras.configFiles.map((cf) => ({
        file: cf.file,
        keys: cf.keys.join(", ") || "—",
      }));
    },

    "config.services": (a) => {
      if (!a.extras?.services) return [];
      return [{
        autowire: a.extras.services.autowire ? "YES" : "NO",
        autoconfigure: a.extras.services.autoconfigure ? "YES" : "NO",
      }];
    },
  };
}
