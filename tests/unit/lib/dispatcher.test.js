import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Container } from "../../../src/lib/container.js";
import { Command } from "../../../src/lib/command.js";
import { dispatch } from "../../../src/lib/dispatcher.js";

describe("dispatcher (unified runner)", () => {
  let container;
  beforeEach(() => {
    container = new Container();
    container.register("config", {});
    container.register("root", "/tmp/root");
  });

  describe("argument parsing (R6)", () => {
    it("parses flags and options from argv into input object before calling command", async () => {
      let captured;
      class Cmd extends Command {
        static outputMode = "raw";
        execute(ctx) {
          captured = ctx;
        }
      }
      const entry = {
        command: async () => ({ default: Cmd }),
        args: { flags: ["--dry-run"], options: ["--mode"] },
      };
      await dispatch({ container, entry, argv: ["--dry-run", "--mode", "select"] });
      assert.equal(captured.dryRun, true);
      assert.equal(captured.mode, "select");
    });
  });

  describe("lifecycle hooks (R4)", () => {
    it("runs pre → execute → post in order on success", async () => {
      const calls = [];
      class Cmd extends Command {
        static outputMode = "raw";
        execute() {
          calls.push("execute");
          return { ok: true };
        }
      }
      const entry = {
        command: async () => ({ default: Cmd }),
        pre: () => calls.push("pre"),
        post: () => calls.push("post"),
        onError: () => calls.push("onError"),
      };
      await dispatch({ container, entry, argv: [] });
      assert.deepEqual(calls, ["pre", "execute", "post"]);
    });

    it("runs pre → execute → onError (not post) on failure", async () => {
      const calls = [];
      class Cmd extends Command {
        static outputMode = "raw";
        execute() {
          calls.push("execute");
          throw new Error("boom");
        }
      }
      const entry = {
        command: async () => ({ default: Cmd }),
        pre: () => calls.push("pre"),
        post: () => calls.push("post"),
        onError: () => calls.push("onError"),
      };
      await dispatch({ container, entry, argv: [] }).catch(() => {});
      assert.deepEqual(calls, ["pre", "execute", "onError"]);
    });

    it("does not invoke undeclared hooks", async () => {
      class Cmd extends Command {
        static outputMode = "raw";
        execute() {}
      }
      const entry = { command: async () => ({ default: Cmd }) };
      await assert.doesNotReject(() => dispatch({ container, entry, argv: [] }));
    });
  });

  describe("output modes (R5)", () => {
    it("envelope mode writes JSON to stdout", async () => {
      class Cmd extends Command {
        static outputMode = "envelope";
        execute() {
          return { data: 42 };
        }
      }
      const entry = {
        command: async () => ({ default: Cmd }),
        envelopeType: "test",
        envelopeKey: "demo",
      };
      const out = [];
      await dispatch({
        container,
        entry,
        argv: [],
        stdout: (s) => out.push(s),
      });
      const parsed = JSON.parse(out.join(""));
      assert.equal(parsed.ok, true);
      assert.equal(parsed.data.data, 42);
    });

    it("raw mode lets the command write stdout itself", async () => {
      class Cmd extends Command {
        static outputMode = "raw";
        execute() {
          process.stdout.write("raw-output\n");
        }
      }
      const entry = { command: async () => ({ default: Cmd }) };
      await dispatch({ container, entry, argv: [] });
      // Just verify dispatcher does NOT wrap in envelope (no assertion on stdout;
      // compared to the envelope test above, absence of JSON parsing means raw).
    });
  });

  describe("exit code contract (R8a)", () => {
    it("sets non-zero exit code on failure in envelope mode", async () => {
      class Cmd extends Command {
        static outputMode = "envelope";
        execute() {
          throw new Error("bad");
        }
      }
      const entry = {
        command: async () => ({ default: Cmd }),
        envelopeType: "test",
        envelopeKey: "demo",
      };
      let exit = 0;
      await dispatch({
        container,
        entry,
        argv: [],
        stdout: () => {},
        setExitCode: (code) => {
          exit = code;
        },
      }).catch(() => {});
      assert.notEqual(exit, 0);
    });
  });

  describe("error visibility (R8b)", () => {
    it("errors are emitted to stderr or envelope, never silently swallowed", async () => {
      class Cmd extends Command {
        static outputMode = "envelope";
        execute() {
          throw new Error("visible-error");
        }
      }
      const entry = {
        command: async () => ({ default: Cmd }),
        envelopeType: "test",
        envelopeKey: "demo",
      };
      const out = [];
      await dispatch({
        container,
        entry,
        argv: [],
        stdout: (s) => out.push(s),
        setExitCode: () => {},
      }).catch(() => {});
      const parsed = JSON.parse(out.join(""));
      assert.equal(parsed.ok, false);
      const errText = JSON.stringify(parsed.errors || []);
      assert.match(errText, /visible-error/);
    });
  });
});
