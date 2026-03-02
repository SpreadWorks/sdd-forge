/**
 * sdd-forge/engine/resolvers/base.js
 *
 * 汎用カテゴリ → analysis.json データ変換マップ。
 * フレームワーク非依存のカテゴリのみを含む。
 */

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function camelToSnake(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function pluralize(str) {
  if (str.endsWith("y") && !/[aeiou]y$/i.test(str)) {
    return str.slice(0, -1) + "ies";
  }
  if (str.endsWith("s") || str.endsWith("x") || str.endsWith("sh") || str.endsWith("ch")) {
    return str + "es";
  }
  return str + "s";
}

// ---------------------------------------------------------------------------
// 汎用カテゴリマップ
// ---------------------------------------------------------------------------

/**
 * @param {function} desc - description 解決関数 (section, key) => string
 * @returns {Object<string, function>}
 */
export function createBaseCategories(desc) {
  return {
    // ----- controllers -----
    controllers: (a) => {
      return a.controllers.controllers.map((c) => ({
        name: c.className,
        file: c.file,
        description: desc("controllers", c.className),
      }));
    },

    "controllers.deps": (a) => {
      return a.controllers.controllers
        .filter((c) => c.uses.length > 0)
        .map((c) => ({
          controller: c.className,
          models: c.uses.join(", "),
        }));
    },

    // ----- tables -----
    tables: (a) => {
      const models = a.models.models.filter((m) => !m.isLogic && !m.isFe);
      const seen = new Set();
      const rows = [];
      for (const m of models) {
        if (seen.has(m.tableName)) continue;
        seen.add(m.tableName);
        rows.push({
          name: m.tableName,
          db: m.useDbConfig || "default",
          description: desc("tables", m.tableName),
        });
      }
      rows.sort((a, b) => a.name.localeCompare(b.name));
      return rows;
    },

    "tables.fk": (a) => {
      const models = a.models.models.filter((m) => !m.isLogic && !m.isFe);
      const classToTable = Object.fromEntries(models.map((m) => [m.className, m.tableName]));
      const rows = [];
      const seen = new Set();

      for (const model of models) {
        if (!model.relations) continue;

        for (const parent of model.relations.belongsTo || []) {
          const parentTable = classToTable[parent];
          if (!parentTable) continue;
          const key = `${parentTable}->${model.tableName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const fkCol = camelToSnake(parent) + "_id";
          rows.push({ parent: parentTable, child: model.tableName, fkColumn: fkCol, type: "belongsTo" });
        }

        for (const child of model.relations.hasMany || []) {
          const childTable = classToTable[child];
          if (!childTable) continue;
          const key = `${model.tableName}->${childTable}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const fkCol = camelToSnake(model.className) + "_id";
          rows.push({ parent: model.tableName, child: childTable, fkColumn: fkCol, type: "hasMany" });
        }

        for (const target of model.relations.hasOne || []) {
          const targetTable = classToTable[target];
          if (!targetTable) continue;
          const key = `${model.tableName}<->${targetTable}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ parent: model.tableName, child: targetTable, fkColumn: "—", type: "hasOne" });
        }
      }

      rows.sort((a, b) => `${a.parent}${a.child}`.localeCompare(`${b.parent}${b.child}`));
      return rows;
    },

    // ----- models -----
    "models.logic": (a) => {
      return a.models.models
        .filter((m) => m.isLogic)
        .map((m) => ({
          name: m.className,
          file: m.file,
          description: desc("logicClasses", m.className),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    "models.relations": (a) => {
      const models = a.models.models.filter((m) => !m.isLogic && !m.isFe);
      const rows = [];
      for (const model of models) {
        if (!model.relations) continue;
        const targets = [];
        for (const [type, list] of Object.entries(model.relations)) {
          if (Array.isArray(list) && list.length > 0) {
            targets.push(`${type}: ${list.join(", ")}`);
          }
        }
        if (targets.length > 0) {
          rows.push({ model: model.className, associations: targets.join(" / ") });
        }
      }
      rows.sort((a, b) => a.model.localeCompare(b.model));
      return rows;
    },

    "models.er": (a) => {
      const models = a.models.models.filter((m) => !m.isLogic && !m.isFe);
      const rows = [];
      const seen = new Set();

      for (const model of models) {
        if (!model.relations) continue;

        for (const parent of model.relations.belongsTo || []) {
          const pm = models.find((m) => m.className === parent);
          if (!pm) continue;
          const key = `${pm.tableName}--${model.tableName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ parent: pm.tableName, child: model.tableName, type: "belongsTo" });
        }

        for (const child of model.relations.hasMany || []) {
          const cm = models.find((m) => m.className === child);
          if (!cm) continue;
          const key = `${model.tableName}--${cm.tableName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ parent: model.tableName, child: cm.tableName, type: "hasMany" });
        }

        for (const target of model.relations.hasOne || []) {
          const tm = models.find((m) => m.className === target);
          if (!tm) continue;
          const key = `${model.tableName}--${tm.tableName}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ parent: model.tableName, child: tm.tableName, type: "hasOne" });
        }
      }

      return rows;
    },

    // ----- shells -----
    shells: (a) => {
      return a.shells.shells.map((s) => ({
        name: s.className,
        file: s.file,
        description: desc("shells", s.className),
      }));
    },

    "shells.deps": (a) => {
      const rows = [];
      for (const s of a.shells.shells) {
        for (const dep of s.appUses || []) {
          rows.push({ shell: s.className, dependency: dep.class, type: dep.package });
        }
      }
      return rows;
    },

    // ----- config -----
    "config.stack": () => {
      return [];
    },

    "config.db": (a) => {
      if (!a.extras?.bootstrap?.environments) return [];
      return a.extras.bootstrap.environments.map((env) => ({ env, host: "—", note: "" }));
    },

    // ----- libs -----
    libs: (a) => {
      if (!a.extras?.libraries) return [];
      return a.extras.libraries.map((l) => ({
        name: l.className,
        file: l.file,
        description: desc("libs", l.className),
      }));
    },

    // ----- docker -----
    docker: () => {
      return [];
    },
  };
}
