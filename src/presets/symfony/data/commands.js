/**
 * CommandsSource — Symfony console commands DataSource.
 *
 * Extends webapp CommandsSource with Symfony-specific match logic.
 * Scan is delegated to the parent class.
 *
 * Available methods (called via {{data}} directives):
 *   commands.list("Name|File|Description")   — inherited
 */

import CommandsSource from "../../webapp/data/commands.js";

export default class SymfonyCommandsSource extends CommandsSource {
  match(file) {
    return file.relPath.startsWith("src/Command/")
      && file.relPath.endsWith(".php");
  }
}
