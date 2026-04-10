/**
 * CommandsSource — Laravel Artisan commands DataSource.
 *
 * Extends webapp CommandsSource with Laravel-specific match logic.
 * Scan/resolve are delegated to the parent class.
 *
 * Available methods (called via {{data}} directives):
 *   commands.list("Name|File|Description")   — inherited
 */

import CommandsSource from "../../webapp/data/commands.js";
import { CommandEntry } from "../../webapp/data/commands.js";
import { hasPathPrefix } from "../../lib/path-match.js";

export default class LaravelCommandsSource extends CommandsSource {
  static Entry = CommandEntry;

  match(relPath) {
    return hasPathPrefix(relPath, "app/Console/Commands/")
      && relPath.endsWith(".php");
  }
}
