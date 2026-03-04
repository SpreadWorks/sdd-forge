/**
 * sdd-forge/presets/webapp/laravel/resolver.js
 *
 * Laravel 固有のカテゴリ → analysis.json データ変換マップ。
 * base.js の汎用カテゴリに追加・上書きする。
 */

/**
 * @param {function} desc - description 解決関数 (section, key) => string
 * @param {function} loadOverrides - overrides.json ローダ
 * @returns {Object<string, function>}
 */
export function createLaravelCategories(desc, loadOverrides) {
  return {
    // ----- controllers -----
    controllers: (a) => {
      const ctrls = a.extras?.laravelControllers || a.controllers?.controllers || [];
      return ctrls.map((c) => ({
        name: c.className,
        file: c.file,
        description: desc("controllers", c.className),
      }));
    },

    "controllers.actions": (a) => {
      const ctrls = a.extras?.laravelControllers || [];
      const rows = [];
      for (const c of ctrls) {
        for (const action of c.actions || []) {
          rows.push({
            controller: c.className,
            action,
          });
        }
      }
      return rows;
    },

    "controllers.middleware": (a) => {
      const ctrls = a.extras?.laravelControllers || [];
      const mwSet = new Map();
      for (const c of ctrls) {
        for (const mw of c.middleware || []) {
          if (!mwSet.has(mw)) mwSet.set(mw, []);
          mwSet.get(mw).push(c.className);
        }
      }
      return [...mwSet.entries()].map(([mw, controllers]) => ({
        middleware: mw,
        controllers: controllers.join(", "),
      }));
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

    "tables.indexes": (a) => {
      const tables = a.extras?.migrations || [];
      const rows = [];
      for (const t of tables) {
        for (const idx of t.indexes) {
          rows.push({
            table: t.name,
            type: idx.type,
            columns: idx.columns.join(", "),
          });
        }
      }
      return rows;
    },

    // ----- models -----
    "models.relations": (a) => {
      const models = a.extras?.laravelModels || [];
      const rows = [];
      for (const model of models) {
        if (!model.relations) continue;
        const targets = [];
        for (const [type, list] of Object.entries(model.relations)) {
          if (Array.isArray(list) && list.length > 0) {
            targets.push(`${type}: ${list.map((r) => r.model).join(", ")}`);
          }
        }
        if (targets.length > 0) {
          rows.push({ model: model.className, associations: targets.join(" / ") });
        }
      }
      rows.sort((a, b) => a.model.localeCompare(b.model));
      return rows;
    },

    "models.scopes": (a) => {
      const models = a.extras?.laravelModels || [];
      const rows = [];
      for (const model of models) {
        for (const scope of model.scopes || []) {
          rows.push({ model: model.className, scope });
        }
      }
      return rows;
    },

    "models.casts": (a) => {
      const models = a.extras?.laravelModels || [];
      const rows = [];
      for (const model of models) {
        for (const [attr, type] of Object.entries(model.casts || {})) {
          rows.push({ model: model.className, attribute: attr, castType: type });
        }
      }
      return rows;
    },

    // ----- routes -----
    routes: (a) => {
      const routes = a.extras?.laravelRoutes || [];
      return routes.map((r) => ({
        method: r.httpMethod,
        uri: r.uri,
        controller: r.controller,
        action: r.action,
      }));
    },

    "routes.api": (a) => {
      const routes = a.extras?.laravelRoutes || [];
      return routes
        .filter((r) => r.routeType === "api")
        .map((r) => ({
          method: r.httpMethod,
          uri: r.uri,
          controller: r.controller,
          action: r.action,
        }));
    },

    // ----- commands (Artisan) -----
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

    "config.providers": (a) => {
      if (!a.extras?.providers) return [];
      return a.extras.providers.map((p) => ({
        name: p.className,
        file: p.file,
        register: p.hasRegister ? "YES" : "—",
        boot: p.hasBoot ? "YES" : "—",
      }));
    },

    "config.middleware": (a) => {
      if (!a.extras?.middleware) return [];
      return a.extras.middleware.map((mw) => ({
        name: mw.className,
        file: mw.file,
        description: desc("middleware", mw.className),
      }));
    },

    "config.files": (a) => {
      if (!a.extras?.configFiles) return [];
      return a.extras.configFiles.map((cf) => ({
        file: cf.file,
        keys: cf.keys.join(", ") || "—",
      }));
    },
  };
}
