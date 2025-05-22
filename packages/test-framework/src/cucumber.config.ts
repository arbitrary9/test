import { IConfiguration } from "@cucumber/cucumber";
import { tagConfig } from "./config/env/config.tags";
import { Tag } from "./config/env/validators/Tag";

// Initialize tag configuration
Tag.initialize(tagConfig);

// Cucumber configuration
const config: IConfiguration = {
  paths: ["src/tests/features/**/*.feature"],
  require: [
    "src/tests/step-definitions/**/*.ts",
    "src/tests/support/**/*.ts"
  ],
  requireModule: ["ts-node/register"],
  format: [
    "summary",
    "progress-bar",
    "html:reports/cucumber-report.html",
    "@cucumber/pretty-formatter",
    "allure-cucumberjs"
  ],
  formatOptions: {
    snippetInterface: "async-await"
  },
  publishQuiet: true,
  retry: 0,
  parallel: 1
};

export default config;
