/**
 * CommandsSource — Laravel Artisan commands DataSource.
 *
 * Extends webapp CommandsSource with Laravel-specific match logic.
 * Scan is delegated to the parent class.
 *
 * Available methods (called via {{data}} directives):
 *   commands.list("Name|File|Description")   — inherited
 */

import CommandsSource from "../../webapp/data/commands.js";

export default class LaravelCommandsSource extends CommandsSource {
  match(file) {
    return file.relPath.startsWith("app/Console/Commands/")
      && file.relPath.endsWith(".php");
  }
}
