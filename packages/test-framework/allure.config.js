const { Status } = require("allure-js-commons");
const os = require("os");
const process = require("process");

module.exports = {
  resultsDir: "./allure-results",
  categories: [
    {
      name: "Test failures",
      messageRegex: ".*",
      matchedStatuses: [Status.FAILED]
    },
    {
      name: "Infrastructure issues",
      messageRegex: ".*(ECONNREFUSED|ECONNRESET|ETIMEDOUT).*",
      matchedStatuses: [Status.BROKEN]
    },
    {
      name: "Flaky tests",
      messageRegex: ".*(element click intercepted|element not interactable).*",
      matchedStatuses: [Status.BROKEN]
    }
  ],
  environmentInfo: {
    os_platform: os.platform(),
    os_release: os.release(),
    os_version: os.version(),
    node_version: process.version,
    host_name: os.hostname()
  }
};
