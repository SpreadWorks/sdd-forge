/**
 * Laravel 8+ extras aggregator.
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
  const artisan = path.join(sourceRoot, "artisan");
  const appDir = path.join(sourceRoot, "app");
  if (!fs.existsSync(artisan) && !fs.existsSync(appDir)) {
    console.error("[laravel] Laravel project not detected, skipping extras");
    return {};
  }

  const extras = {};

  try {
    const { analyzeControllers } = await import("./controllers.js");
    const result = analyzeControllers(sourceRoot);
    extras.laravelControllers = result.controllers;
  } catch (err) {
    console.error(`[laravel] controller analysis failed: ${err.message}`);
  }

  try {
    const { analyzeModels } = await import("./models.js");
    const result = analyzeModels(sourceRoot);
    extras.laravelModels = result.models;
  } catch (err) {
    console.error(`[laravel] model analysis failed: ${err.message}`);
  }

  try {
    const { analyzeRoutes } = await import("./routes.js");
    const result = analyzeRoutes(sourceRoot);
    extras.laravelRoutes = result.routes;
    extras.laravelRoutesSummary = result.summary;
  } catch (err) {
    console.error(`[laravel] route analysis failed: ${err.message}`);
  }

  try {
    const { analyzeMigrations } = await import("./migrations.js");
    const result = analyzeMigrations(sourceRoot);
    extras.migrations = result.tables;
    extras.migrationsSummary = result.summary;
  } catch (err) {
    console.error(`[laravel] migration analysis failed: ${err.message}`);
  }

  try {
    const { analyzeConfig } = await import("./config.js");
    const configExtras = analyzeConfig(sourceRoot);
    Object.assign(extras, configExtras);
  } catch (err) {
    console.error(`[laravel] config analysis failed: ${err.message}`);
  }

  return extras;
}
