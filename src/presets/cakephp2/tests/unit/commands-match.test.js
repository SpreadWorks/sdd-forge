/**
 * I/O tests for CakePHP2 CommandsSource.match().
 *
 * Verifies that match() correctly identifies CakePHP shell files
 * in Console/Command/ while excluding AppShell.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import CakephpCommandsSource from "../../data/commands.js";

describe("CakephpCommandsSource.match()", () => {
  const source = new CakephpCommandsSource();

  it("matches *Shell.php in Console/Command/", () => {
    assert.equal(
      source.match({ relPath: "app/Console/Command/CleanupShell.php" }),
      true,
    );
  });

  it("matches nested Shell files", () => {
    assert.equal(
      source.match({ relPath: "app/Console/Command/ImportShell.php" }),
      true,
    );
  });

  it("excludes AppShell.php", () => {
    assert.equal(
      source.match({ relPath: "app/Console/Command/AppShell.php" }),
      false,
    );
  });

  it("excludes files not in Console/Command/", () => {
    assert.equal(
      source.match({ relPath: "app/Model/TaskShell.php" }),
      false,
    );
  });

  it("excludes non-Shell PHP files in Console/Command/", () => {
    assert.equal(
      source.match({ relPath: "app/Console/Command/Helper.php" }),
      false,
    );
  });
});
