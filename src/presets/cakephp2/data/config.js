/**
 * ConfigSource — CakePHP 2.x configuration DataSource.
 *
 * CakePHP-only category: extends WebappDataSource.
 */

import WebappDataSource from "../../webapp/data/webapp-data-source.js";
import { analyzeConstants, analyzeBootstrap } from "../scan/config.js";
import { analyzeAppController, analyzeAppModel } from "../scan/base-classes.js";
import { analyzeAssets } from "../scan/assets.js";
import { analyzeAcl, analyzePermissionComponent } from "../scan/security.js";
import { analyzeLogicClasses, analyzeTitlesGraphMapping, analyzeComposerDeps } from "../scan/business.js";
import { analyzeShellDetails } from "../scan/shells-detail.js";

export default class CakephpConfigSource extends WebappDataSource {
  match(file) {
    return /^app\/Config\//.test(file.relPath)
      || /^app\/Controller\/AppController\.php$/.test(file.relPath)
      || /^app\/Model\/AppModel\.php$/.test(file.relPath)
      || file.fileName === "composer.json";
  }

  scan(files) {
    if (files.length === 0) return null;
    const sourceRoot = this.deriveSourceRoot(files);
    const appDir = sourceRoot + "/app";
    return {
      constants: analyzeConstants(appDir),
      bootstrap: analyzeBootstrap(appDir),
      appController: analyzeAppController(appDir),
      appModel: analyzeAppModel(appDir),
      assets: analyzeAssets(appDir),
      acl: analyzeAcl(appDir),
      permissionComponent: analyzePermissionComponent(appDir),
      logicClasses: analyzeLogicClasses(appDir),
      titlesGraphMapping: analyzeTitlesGraphMapping(appDir),
      composerDeps: analyzeComposerDeps(appDir),
      shellDetails: analyzeShellDetails(appDir),
    };
  }

  stack(analysis, labels) {
    const rows = [];
    const deps = analysis.config?.composerDeps;
    if (deps?.require?.php) {
      rows.push(["Language", "PHP", deps.require.php]);
    }
    rows.push(["Framework", "CakePHP", "2.x"]);
    if (analysis.config?.bootstrap?.plugins?.length > 0) {
      rows.push(["Plugins", analysis.config.bootstrap.plugins.join(", "), "—"]);
    }
    const assets = analysis.config?.assets?.js?.filter((a) => a.library) || [];
    for (const a of assets) {
      rows.push(["Frontend", a.library, a.version || "—"]);
    }
    if (rows.length === 0) return null;
    const hdr = labels.length >= 3 ? labels : ["Category", "Technology", "Version"];
    return this.toMarkdownTable(rows, hdr);
  }

  db(analysis, labels) {
    if (!analysis.config?.bootstrap?.environments) return null;
    const envs = analysis.config.bootstrap.environments;
    if (envs.length === 0) return null;
    const rows = this.toRows(envs, (env) => [env, "—", ""]);
    return this.toMarkdownTable(rows, labels);
  }

  composer(analysis, labels) {
    if (!analysis.config?.composerDeps) return null;
    const deps = analysis.config.composerDeps;
    const rows = [];
    for (const [pkg, ver] of Object.entries(deps.require)) {
      rows.push([pkg, ver, this.desc("composerDeps", pkg)]);
    }
    for (const [pkg, ver] of Object.entries(deps.requireDev)) {
      rows.push([`${pkg} (dev)`, ver, this.desc("composerDeps", pkg)]);
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  bootstrap(analysis, labels) {
    if (!analysis.config?.bootstrap) return null;
    const b = analysis.config.bootstrap;
    const rows = [];
    if (b.siteTitle) rows.push(["サイトタイトル", b.siteTitle]);
    if (b.environments?.length > 0) rows.push(["環境", b.environments.join(", ")]);
    if (b.plugins?.length > 0) rows.push(["プラグイン", b.plugins.join(", ")]);
    if (b.logChannels?.length > 0) rows.push(["ログチャネル", b.logChannels.join(", ")]);
    if (b.classPaths?.length > 0) {
      const paths = b.classPaths.map((p) => `${p.type}: ${p.path}`).join(", ");
      rows.push(["クラスパス追加", paths]);
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  constants(analysis, labels) {
    if (!analysis.config?.constants?.scalars) return null;
    const seen = new Set();
    const items = this.mergeDesc(
      analysis.config.constants.scalars.filter((s) => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      }),
      "constants", "name",
    );
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.name, s.value, s.summary || "—",
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  constantsSelect(analysis, labels) {
    if (!analysis.config?.constants?.selectOptions) return null;
    const items = this.mergeDesc(analysis.config.constants.selectOptions, "selectConstants", "name");
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => {
      const opts = s.options.map((o) => `${o.key}=${o.label}`).join(", ");
      return [s.name, `${s.summary || "—"}: ${opts}`];
    });
    return this.toMarkdownTable(rows, labels);
  }

  auth(analysis, labels) {
    if (!analysis.config?.appController) return null;
    const ac = analysis.config.appController;
    const rows = [];
    if (ac.components?.length > 0) rows.push(["コンポーネント", ac.components.join(", ")]);
    if (ac.authConfig?.authorize) rows.push(["認可方式", ac.authConfig.authorize]);
    if (ac.authConfig?.authenticate) rows.push(["認証方式", ac.authConfig.authenticate]);
    if (ac.authConfig?.userModel) rows.push(["ユーザーモデル", ac.authConfig.userModel]);
    if (ac.authConfig?.loginField) rows.push(["ログインフィールド", ac.authConfig.loginField]);
    if (ac.authConfig?.loginRedirect) rows.push(["ログイン後リダイレクト", ac.authConfig.loginRedirect]);
    if (ac.authConfig?.logoutRedirect) rows.push(["ログアウト後リダイレクト", ac.authConfig.logoutRedirect]);
    if (ac.helpers?.length > 0) {
      const helperStr = ac.helpers.map((h) => `${h.name} → ${h.className}`).join(", ");
      rows.push(["ヘルパー", helperStr]);
    }
    if (rows.length === 0) return null;
    return this.toMarkdownTable(rows, labels);
  }

  acl(analysis, labels) {
    if (!analysis.config?.acl) return null;
    const acl = analysis.config.acl;
    if (!acl.aliases || acl.aliases.length === 0) return null;
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
      rows.push([roleName, groupId, permissions]);
    }
    return this.toMarkdownTable(rows, labels);
  }

  assets(analysis, labels) {
    if (!analysis.config?.assets?.js) return null;
    const items = analysis.config.assets.js.filter((asset) => asset.library);
    if (items.length === 0) return null;
    const rows = this.toRows(items, (asset) => [
      asset.library, asset.version || "—", asset.file,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}
