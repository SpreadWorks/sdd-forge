import { acceptanceTest } from "./lib/test-template.js";

acceptanceTest("webapp", {
  fixtureFrom: "php",
  configOverrides: { type: "webapp" },
});
