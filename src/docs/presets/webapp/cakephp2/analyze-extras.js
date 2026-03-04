/**
 * analyze-extras.js
 *
 * Aggregator for all CakePHP 2.x extra analyzers.
 * Each domain is implemented in its own module; this file re-exports the
 * combined analyzeExtras() entry point.
 */

import { analyzeConstants, analyzeBootstrap } from "./analyze-config.js";
import { analyzeAppController, analyzeAppModel } from "./analyze-base-classes.js";
import { analyzeHelpers, analyzeLibraries, analyzeBehaviors, analyzeSqlFiles, analyzeLayouts, analyzeElements } from "./analyze-views.js";
import { analyzeAssets } from "./analyze-assets.js";
import { analyzeLogicClasses, analyzeTitlesGraphMapping, analyzeComposerDeps } from "./analyze-business.js";
import { analyzePermissionComponent, analyzeAcl } from "./analyze-security.js";
import { analyzeEmailNotifications } from "./analyze-notifications.js";
import { analyzeShellDetails } from "./analyze-shells-detail.js";
import { analyzeTestStructure } from "./analyze-testing.js";

export function analyzeExtras(appDir) {
  return {
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
}
