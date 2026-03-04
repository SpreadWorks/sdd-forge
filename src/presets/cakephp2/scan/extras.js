/**
 * CakePHP 2.x extras aggregator.
 *
 * Calls all domain-specific analyzers and returns combined extras data.
 * Entry point called by scan.js after generic scan.
 */

import path from "path";
import fs from "fs";

import { analyzeConstants, analyzeBootstrap } from "./config.js";
import { analyzeAppController, analyzeAppModel } from "./base-classes.js";
import { analyzeHelpers, analyzeLibraries, analyzeBehaviors, analyzeSqlFiles, analyzeLayouts, analyzeElements } from "./views.js";
import { analyzeAssets } from "./assets.js";
import { analyzeLogicClasses, analyzeTitlesGraphMapping, analyzeComposerDeps } from "./business.js";
import { analyzePermissionComponent, analyzeAcl } from "./security.js";
import { analyzeEmailNotifications } from "./notifications.js";
import { analyzeShellDetails } from "./shells-detail.js";
import { analyzeTestStructure } from "./testing.js";

/**
 * @param {string} sourceRoot - source code root
 * @param {Object} baseScanResult - result from genericScan
 * @returns {Promise<Object>} extras data
 */
export async function analyzeExtras(sourceRoot, baseScanResult) {
  const appDir = path.join(sourceRoot, "app");
  if (!fs.existsSync(appDir)) {
    console.error("[cakephp2] app/ directory not found, skipping extras");
    return {};
  }

  const extras = {
    constants: analyzeConstants(appDir),
    bootstrap: analyzeBootstrap(appDir),
    appController: analyzeAppController(appDir),
    appModel: analyzeAppModel(appDir),
    helpers: analyzeHelpers(appDir),
    libraries: analyzeLibraries(appDir),
    behaviors: analyzeBehaviors(appDir),
    sqlFiles: analyzeSqlFiles(appDir),
    layouts: analyzeLayouts(appDir),
    elements: analyzeElements(appDir),
    assets: analyzeAssets(appDir),
    permissionComponent: analyzePermissionComponent(appDir),
    logicClasses: analyzeLogicClasses(appDir),
    titlesGraphMapping: analyzeTitlesGraphMapping(appDir),
    composerDeps: analyzeComposerDeps(appDir),
    acl: analyzeAcl(appDir),
    shellDetails: analyzeShellDetails(appDir),
    emailNotifications: analyzeEmailNotifications(appDir),
    testStructure: analyzeTestStructure(appDir),
  };

  // composer.json fallback
  if (!extras.composerDeps) {
    const composerPath = path.join(sourceRoot, "composer.json");
    if (fs.existsSync(composerPath)) {
      try {
        const composer = JSON.parse(fs.readFileSync(composerPath, "utf8"));
        extras.composerDeps = {
          require: composer.require || {},
          requireDev: composer["require-dev"] || {},
        };
      } catch (_) { /* ignore */ }
    }
  }

  return extras;
}
