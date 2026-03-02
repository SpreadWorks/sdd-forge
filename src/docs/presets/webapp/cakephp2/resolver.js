/**
 * sdd-forge/engine/resolvers/cakephp2.js
 *
 * CakePHP 2.x 固有のカテゴリ → analysis.json データ変換マップ。
 * base.js の汎用カテゴリに追加・上書きする。
 */

// ---------------------------------------------------------------------------
// CakePHP 固有マッピング
// ---------------------------------------------------------------------------

const DB_CONFIG_MAP = {
  default: "cms",
  crankin_db: "crankin",
  contents_db: "contents",
  contents_staging_db: "contents_staging",
  hollywood_db: "hollywood_db",
};

function resolveDbName(useDbConfig) {
  if (!useDbConfig) return "cms";
  return DB_CONFIG_MAP[useDbConfig] || useDbConfig;
}

/**
 * @param {function} desc - description 解決関数 (section, key) => string
 * @param {function} loadOverrides - overrides.json ローダ
 * @returns {Object<string, function>}
 */
export function createCakephp2Categories(desc, loadOverrides) {
  return {
    // tables を上書き: DB名をCakePHP用に解決
    tables: (a) => {
      const models = a.models.models.filter((m) => !m.isLogic && !m.isFe);
      const seen = new Set();
      const rows = [];
      for (const m of models) {
        if (seen.has(m.tableName)) continue;
        seen.add(m.tableName);
        rows.push({
          name: m.tableName,
          db: resolveDbName(m.useDbConfig),
          description: desc("tables", m.tableName),
        });
      }
      rows.sort((a, b) => a.name.localeCompare(b.name));
      return rows;
    },

    "tables.sync": (a) => {
      const feModels = a.models.models.filter((m) => m.isFe);
      const contentsModels = feModels.filter((m) => m.useDbConfig === "contents_db" && m.useTable);
      const stagingModels = feModels.filter((m) => m.useDbConfig === "contents_staging_db" && m.useTable);

      const tableMap = new Map();
      for (const m of contentsModels) {
        if (!tableMap.has(m.useTable)) tableMap.set(m.useTable, {});
        tableMap.get(m.useTable).contents = m.className;
      }
      for (const m of stagingModels) {
        if (!tableMap.has(m.useTable)) tableMap.set(m.useTable, {});
        tableMap.get(m.useTable).staging = m.className;
      }

      return [...tableMap.keys()].sort().map((table) => {
        const entry = tableMap.get(table);
        return {
          cmsTable: table,
          feModel: entry.contents || "—",
          feStagingModel: entry.staging || "—",
        };
      });
    },

    "controllers.csv": (a) => {
      const o = loadOverrides();
      const csvMap = o.controllersCsv || {};
      return Object.entries(csvMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, ops]) => ({
          name,
          csvImport: !!ops.csvImport,
          csvExport: !!ops.csvExport,
          excelExport: !!ops.excelExport,
        }));
    },

    "controllers.actions": (a) => {
      if (!a.extras?.titlesGraphMapping) return [];
      return a.extras.titlesGraphMapping
        .filter((m) => m.logicClasses.length > 0)
        .map((m) => ({
          action: m.action,
          logic: m.logicClasses.join(", "),
          outputType: m.outputType,
        }));
    },

    "models.logic.methods": (a) => {
      if (!a.extras?.logicClasses) return [];
      return a.extras.logicClasses.map((lc) => {
        const methods = lc.methods
          .filter((m) => m.visibility === "public")
          .map((m) => m.name + "()")
          .join(", ");
        return {
          name: lc.className,
          extends: lc.extends,
          methods: methods || "—",
        };
      });
    },

    "shells.flow": (a) => {
      if (!a.extras?.shellDetails) return [];
      return a.extras.shellDetails.map((s) => ({
        shell: s.className,
        summary: s.flowSteps.join(" → "),
        mail: s.hasMail ? "あり" : "なし",
        fileOps: s.hasFileOps ? "あり" : "なし",
        tx: s.hasTransaction ? "あり" : "なし",
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

    "config.assets": (a) => {
      if (!a.extras?.assets?.js) return [];
      return a.extras.assets.js
        .filter((asset) => asset.library)
        .map((asset) => ({
          library: asset.library,
          version: asset.version || "—",
          description: asset.file,
        }));
    },

    "config.bootstrap": (a) => {
      if (!a.extras?.bootstrap) return [];
      const b = a.extras.bootstrap;
      const rows = [];
      if (b.siteTitle) rows.push({ key: "サイトタイトル", value: b.siteTitle });
      if (b.environments?.length > 0) rows.push({ key: "環境", value: b.environments.join(", ") });
      if (b.plugins?.length > 0) rows.push({ key: "プラグイン", value: b.plugins.join(", ") });
      if (b.logChannels?.length > 0) rows.push({ key: "ログチャネル", value: b.logChannels.join(", ") });
      if (b.classPaths?.length > 0) {
        const paths = b.classPaths.map((p) => `${p.type}: ${p.path}`).join(", ");
        rows.push({ key: "クラスパス追加", value: paths });
      }
      return rows;
    },

    "config.constants": (a) => {
      if (!a.extras?.constants?.scalars) return [];
      const seen = new Set();
      return a.extras.constants.scalars.filter((s) => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      }).map((s) => ({
        name: s.name,
        value: s.value,
        description: desc("constants", s.name),
      }));
    },

    "config.constants.select": (a) => {
      if (!a.extras?.constants?.selectOptions) return [];
      return a.extras.constants.selectOptions.map((s) => {
        const descText = desc("selectConstants", s.name);
        const opts = s.options.map((o) => `${o.key}=${o.label}`).join(", ");
        return {
          name: s.name,
          choices: `${descText}: ${opts}`,
        };
      });
    },

    "config.auth": (a) => {
      if (!a.extras?.appController) return [];
      const ac = a.extras.appController;
      const rows = [];
      if (ac.components?.length > 0) rows.push({ key: "コンポーネント", value: ac.components.join(", ") });
      if (ac.authConfig?.authorize) rows.push({ key: "認可方式", value: ac.authConfig.authorize });
      if (ac.authConfig?.authenticate) rows.push({ key: "認証方式", value: ac.authConfig.authenticate });
      if (ac.authConfig?.userModel) rows.push({ key: "ユーザーモデル", value: ac.authConfig.userModel });
      if (ac.authConfig?.loginField) rows.push({ key: "ログインフィールド", value: ac.authConfig.loginField });
      if (ac.authConfig?.loginRedirect) rows.push({ key: "ログイン後リダイレクト", value: ac.authConfig.loginRedirect });
      if (ac.authConfig?.logoutRedirect) rows.push({ key: "ログアウト後リダイレクト", value: ac.authConfig.logoutRedirect });
      if (ac.helpers?.length > 0) {
        const helperStr = ac.helpers.map((h) => `${h.name} → ${h.className}`).join(", ");
        rows.push({ key: "ヘルパー", value: helperStr });
      }
      return rows;
    },

    "config.acl": (a) => {
      if (!a.extras?.acl) return [];
      const acl = a.extras.acl;
      const rows = [];
      for (const alias of acl.aliases) {
        const groupId = alias.key.replace("Role/", "");
        const roleName = alias.value.replace("Role/", "");
        const allowRules = [...new Set(
          acl.allow.filter((r) => r.roles.includes(roleName)).map((r) => `許可: ${r.resource}`),
        )];
        const denyRules = [...new Set(
          acl.deny.filter((r) => r.roles.includes(roleName)).map((r) => `拒否: ${r.resource}`),
        )];
        const permissions = [...allowRules, ...denyRules].join(", ") || "デフォルト（権限定義なし）";
        rows.push({ role: roleName, groupId, permissions });
      }
      return rows;
    },

    // ----- views -----
    "views.helpers": (a) => {
      if (!a.extras?.helpers) return [];
      return a.extras.helpers.map((h) => ({
        name: h.className,
        extends: h.extends,
        description: desc("helpers", h.className),
      }));
    },

    "views.layouts": (a) => {
      if (!a.extras?.layouts) return [];
      return a.extras.layouts.map((l) => ({
        file: l,
        description: desc("layouts", l),
      }));
    },

    "views.elements": (a) => {
      if (!a.extras?.elements) return [];
      return a.extras.elements.map((e) => ({
        file: e,
        description: desc("elements", e),
      }));
    },

    "views.components": (a) => {
      if (!a.extras?.permissionComponent) return [];
      const o = loadOverrides();
      const permDescs = o.permissionMethods || {};
      return a.extras.permissionComponent.methods.map((m) => ({
        name: m,
        description: permDescs[m] || m,
      }));
    },

    // ----- libs (CakePHP specific) -----
    "libs.errors": (a) => {
      if (!a.extras?.libraries) return [];
      return a.extras.libraries
        .filter((l) => l.className === "AppError" || l.className === "AppExceptionHandler")
        .map((l) => ({
          name: l.className,
          file: l.file,
          description: desc("libs", l.className),
        }));
    },

    "libs.behaviors": (a) => {
      if (!a.extras?.behaviors) return [];
      return a.extras.behaviors.map((b) => ({
        name: b.className,
        methods: b.methods.length > 0 ? b.methods.join(", ") : "—",
        description: "—",
      }));
    },

    "libs.sql": (a) => {
      if (!a.extras?.sqlFiles) return [];
      return a.extras.sqlFiles.map((s) => ({
        file: s.file,
        lines: s.lines,
        params: s.params.length > 0 ? s.params.join(", ") : "—",
        tables: s.tables.length > 0 ? s.tables.join(", ") : "—",
      }));
    },

    "libs.appmodel": (a) => {
      if (!a.extras?.appModel?.methods) return [];
      return a.extras.appModel.methods.map((m) => ({
        key: m.name,
        value: m.description,
      }));
    },

    // ----- email -----
    email: (a) => {
      if (!a.extras?.emailNotifications) return [];
      const email = a.extras.emailNotifications;
      const from = email.config?.defaultFrom || "—";
      const transport = email.config?.transport || "—";
      const rows = [{ file: `（デフォルト送信元: ${from}）`, subject: "", cc: "" }];
      for (const usage of email.usages) {
        const fileName = usage.file.split("/").pop();
        const subjects = usage.subjects.length > 0 ? usage.subjects.join("; ") : "（動的生成）";
        rows.push({ file: fileName, subject: subjects, cc: transport });
      }
      return rows;
    },

    // ----- tests -----
    tests: (a) => {
      if (!a.extras?.testStructure) return [];
      const t = a.extras.testStructure;
      return [
        { item: "コントローラテスト", count: t.controllerTests, directory: "app/Test/Case/Controller/" },
        { item: "モデルテスト", count: t.modelTests, directory: "app/Test/Case/Model/" },
        { item: "フィクスチャ", count: t.fixtures, directory: "app/Test/Fixture/" },
      ];
    },
  };
}
