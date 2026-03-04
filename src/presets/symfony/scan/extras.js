/**
 * Symfony 5/6/7 extras aggregator.
 *
 * Calls all domain-specific analyzers and returns combined extras data.
 */

import path from "path";
import fs from "fs";

/**
 * @param {string} sourceRoot - source code root
 * @param {Object} baseScanResult - result from genericScan
 * @returns {Promise<Object>} extras data
 */
export async function analyzeExtras(sourceRoot, baseScanResult) {
  const srcDir = path.join(sourceRoot, "src");
  const composerJson = path.join(sourceRoot, "composer.json");
  if (!fs.existsSync(srcDir) && !fs.existsSync(composerJson)) {
    console.error("[symfony] Symfony project not detected, skipping extras");
    return {};
  }

  const extras = {};

  try {
    const { analyzeControllers } = await import("./controllers.js");
    const result = analyzeControllers(sourceRoot);
    extras.symfonyControllers = result.controllers;
  } catch (err) {
    console.error(`[symfony] controller analysis failed: ${err.message}`);
  }

  try {
    const { analyzeEntities } = await import("./entities.js");
    const result = analyzeEntities(sourceRoot);
    extras.symfonyEntities = result.entities;
  } catch (err) {
    console.error(`[symfony] entity analysis failed: ${err.message}`);
  }

  try {
    const { analyzeRoutes } = await import("./routes.js");
    const result = analyzeRoutes(sourceRoot);
    extras.symfonyRoutes = result.routes;
    extras.symfonyRoutesSummary = result.summary;
  } catch (err) {
    console.error(`[symfony] route analysis failed: ${err.message}`);
  }

  try {
    const { analyzeMigrations } = await import("./migrations.js");
    const result = analyzeMigrations(sourceRoot);
    extras.migrations = result.tables;
    extras.migrationsSummary = result.summary;
  } catch (err) {
    console.error(`[symfony] migration analysis failed: ${err.message}`);
  }

  try {
    const { analyzeConfig } = await import("./config.js");
    const configExtras = analyzeConfig(sourceRoot);
    Object.assign(extras, configExtras);
  } catch (err) {
    console.error(`[symfony] config analysis failed: ${err.message}`);
  }

  return extras;
}
