import { Status } from "allure-js-commons";
import * as os from "node:os";
import * as process from "node:process";

export default {
    format: ["allure-cucumberjs/reporter:./out/ignoreme.txt"],
    formatOptions: {
        resultsDir: "./out/allure-results",
        labels: [
            {
                pattern: [/@epic:(.*)/],
                name: "epic",
            },
            {
                pattern: [/@severity:(.*)/],
                name: "severity",
            },
        ],
        links: {
            issue: {
                pattern: [/@issue:(.*)/],
                urlTemplate: "https://issues.example.com/%s",
                nameTemplate: "ISSUE %s",
            },
            tms: {
                pattern: [/@tms:(.*)/],
                urlTemplate: "https://tms.example.com/%s",
            },
            jira: {
                pattern: [/@jira:(.*)/],
                urlTemplate: (v: any) => `https://wiswm.atlassian.net/browse/${v}`,
            },
        },
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