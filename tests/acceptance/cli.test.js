import { acceptanceTest } from "./lib/test-template.js";

acceptanceTest("cli", {
  fixtureFrom: "node-cli",
  configOverrides: { type: "cli" },
});
