/**
 * WebappDataSource — common base for all webapp preset DataSources.
 *
 * Provides shared utilities used across webapp-type presets
 * (cakephp2, laravel, symfony).
 */

import { DataSource } from "../../../docs/lib/data-source.js";
import { Scannable } from "../../../docs/lib/scan-source.js";

export default class WebappDataSource extends Scannable(DataSource) {}
