import { Status } from "allure-js-commons";
import * as os from "node:os";
import * as process from "node:process";
import { tagConfig } from "./env/config.tags";
import "./init";

export default {
    format: ["allure-cucumberjs/reporter:./out/ignoreme.txt"],
    formatOptions: {
        resultsDir: "./out/allure-results",
        labels: tagConfig.labels,
        links: tagConfig.links,
        categories: [
            {
                name: "foo",
                messageRegex: "bar",
                traceRegex: "baz",
                matchedStatuses: [Status.FAILED, Status.BROKEN],
            },
        ],
        environmentInfo: {
            os_platform: os.platform(),
            os_release: os.release(),
            os_version: os.version(),
            node_version: process.version,
        },
    },
};