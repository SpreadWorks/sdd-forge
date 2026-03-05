/**
 * ConfigSource — CakePHP 2.x configuration DataSource.
 *
 * CakePHP-only category: extends Scannable(DataSource) directly.
 *
 * Available methods (called via {{data}} directives):
 *   config.stack("...")
 *   config.db("Env|Host|Note")
 *   config.composer("Package|Version|Description")
 *   config.bootstrap("Key|Value")
 *   config.constants("Name|Value|Description")
 *   config.constantsSelect("Name|Choices")
 *   config.auth("Key|Value")
 *   config.acl("Role|Group ID|Permissions")
 *   config.assets("Library|Version|File")
 */

import path from "path";
import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";
import { analyzeConstants, analyzeBootstrap } from "../scan/config.js";
import { analyzeAppController, analyzeAppModel } from "../scan/base-classes.js";
import { analyzeAssets } from "../scan/assets.js";
import { analyzeAcl, analyzePermissionComponent } from "../scan/security.js";
import { analyzeLogicClasses, analyzeTitlesGraphMapping, analyzeComposerDeps } from "../scan/business.js";
import { analyzeShellDetails } from "../scan/shells-detail.js";

export default class CakephpConfigSource extends Scannable(DataSource) {
  scan(sourceRoot, scanCfg) {
    const appDir = path.join(sourceRoot, "app");
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

  /** Technology stack (empty for CakePHP preset). */
  stack(analysis, labels) {
    return null;
  }

  /** Database environments. */
  db(analysis, labels) {
    if (!analysis.extras?.bootstrap?.environments) return null;
    const envs = analysis.extras.bootstrap.environments;
    if (envs.length === 0) return null;
    const rows = this.toRows(envs, (env) => [env, "—", ""]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Composer dependency packages. */
  composer(analysis, labels) {
    if (!analysis.extras?.composerDeps) return null;
    const deps = analysis.extras.composerDeps;
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

  /** Bootstrap configuration summary. */
  bootstrap(analysis, labels) {
    if (!analysis.extras?.bootstrap) return null;
    const b = analysis.extras.bootstrap;
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

  /** Scalar constants from const.php. */
  constants(analysis, labels) {
    if (!analysis.extras?.constants?.scalars) return null;
    const seen = new Set();
    const items = analysis.extras.constants.scalars.filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => [
      s.name,
      s.value,
      this.desc("constants", s.name),
    ]);
    return this.toMarkdownTable(rows, labels);
  }

  /** Select option constants from const.php. */
  constantsSelect(analysis, labels) {
    if (!analysis.extras?.constants?.selectOptions) return null;
    const items = analysis.extras.constants.selectOptions;
    if (items.length === 0) return null;
    const rows = this.toRows(items, (s) => {
      const descText = this.desc("selectConstants", s.name);
      const opts = s.options.map((o) => `${o.key}=${o.label}`).join(", ");
      return [s.name, `${descText}: ${opts}`];
    });
    return this.toMarkdownTable(rows, labels);
  }

  /** Authentication/authorization configuration from AppController. */
  auth(analysis, labels) {
    if (!analysis.extras?.appController) return null;
    const ac = analysis.extras.appController;
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

  /** ACL role permissions. */
  acl(analysis, labels) {
    if (!analysis.extras?.acl) return null;
    const acl = analysis.extras.acl;
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

  /** Frontend JS library assets. */
  assets(analysis, labels) {
    if (!analysis.extras?.assets?.js) return null;
    const items = analysis.extras.assets.js.filter((asset) => asset.library);
    if (items.length === 0) return null;
    const rows = this.toRows(items, (asset) => [
      asset.library,
      asset.version || "—",
      asset.file,
    ]);
    return this.toMarkdownTable(rows, labels);
  }
}
