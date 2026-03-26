/**
 * CommandsSource — Symfony console commands DataSource.
 *
 * Extends webapp CommandsSource with Symfony-specific match/parse logic.
 *
 * Available methods (called via {{data}} directives):
 *   commands.list("Name|File|Description")   — inherited
 */

import fs from "fs";
import CommandsSource from "../../webapp/data/commands.js";
import { CommandEntry } from "../../webapp/data/commands.js";

export default class SymfonyCommandsSource extends CommandsSource {
  static Entry = CommandEntry;

  match(relPath) {
    return relPath.startsWith("src/Command/") && relPath.endsWith(".php");
  }

  parse(absPath) {
    const entry = new CommandEntry();
    const content = fs.readFileSync(absPath, "utf8");

    const classMatch = content.match(/class\s+(\w+)\s+(?:extends\s+(\w+))?/);
    if (!classMatch) return entry;

    entry.className = classMatch[1];

    const methods = [];
    const fnRe = /public\s+function\s+(\w+)\s*\(/g;
    let fm;
    while ((fm = fnRe.exec(content)) !== null) {
      if (!fm[1].startsWith("_")) methods.push(fm[1]);
    }
    entry.publicMethods = methods;
    entry.appUses = [];

    return entry;
  }
}
