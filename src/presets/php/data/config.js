/**
 * ConfigSource — PHP language layer DataSource.
 *
 * Provides config.stack() for PHP projects.
 * Extracts technology stack from composer.json (via analysis.extras.composerDeps).
 */

import { DataSource } from "../../../docs/lib/data-source.js";

export default class PhpConfigSource extends DataSource {
  /** Technology stack table from composer.json. */
  stack(analysis, labels) {
    const rows = [];
    const deps = analysis.extras?.composerDeps;
    if (!deps) return null;

    if (deps.require?.php) {
      rows.push(["Language", "PHP", deps.require.php]);
    }

    // Detect framework from require packages
    const require = deps.require || {};
    const fwDetectors = [
      { pkg: "laravel/framework", name: "Laravel" },
      { pkg: "symfony/framework-bundle", name: "Symfony" },
      { pkg: "symfony/symfony", name: "Symfony" },
      { pkg: "cakephp/cakephp", name: "CakePHP" },
      { pkg: "slim/slim", name: "Slim" },
      { pkg: "yiisoft/yii2", name: "Yii2" },
    ];
    for (const { pkg, name } of fwDetectors) {
      if (require[pkg]) {
        rows.push(["Framework", name, require[pkg]]);
        break;
      }
    }

    // Key packages
    const keyPackages = [
      { pkg: "doctrine/orm", label: "ORM" },
      { pkg: "doctrine/dbal", label: "DBAL" },
      { pkg: "twig/twig", label: "Template Engine" },
      { pkg: "monolog/monolog", label: "Logging" },
      { pkg: "guzzlehttp/guzzle", label: "HTTP Client" },
    ];
    for (const { pkg, label } of keyPackages) {
      if (require[pkg]) {
        rows.push([label, pkg, require[pkg]]);
      }
    }

    if (rows.length === 0) return null;
    const hdr = labels.length >= 3 ? labels : ["Category", "Technology", "Version"];
    return this.toMarkdownTable(rows, hdr);
  }
}
