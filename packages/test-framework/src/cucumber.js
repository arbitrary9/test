const { env } = require('./config/env/env');

module.exports = {
  default: {
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
    retry: env.RETRY_COUNT || 0,
    parallel: 1,
    tags: env.TAGS || ""
  }
};
