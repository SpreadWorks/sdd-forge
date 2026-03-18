import { acceptanceTest } from "./lib/test-template.js";

acceptanceTest("base", {
  fixtureFrom: "node",
  configOverrides: { type: "base" },
});
