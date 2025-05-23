import { Status } from "allure-js-commons";
import * as os from "os";
import * as process from "process";
import { tagConfig } from "@config/config.tags";

export default {
  resultsDir: "./allure-results",
  labels: tagConfig.labels,
  links: tagConfig.links,
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
