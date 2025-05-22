import * as path from "node:path";
import { env } from "@config/env"


const formatters = ["progress-bar"];

if (env.TESTRAIL !== undefined) {
    formatters.push("json:allure-results/cucumber-results.json");
}

module.exports = {
    default: {
        require: [
            path.resolve("dist/tests/step-definitions/**/*.js"),
            path.resolve("dist/tests/support/**/*.js"),
        ],
        format: formatters,
        paths: ["features/**/*.feature"],
        tags: env.CUCUMBER?.TAGS || "",
    },
    // // TestRail specific profile
    // testrail: {
    //     require: [...requirePaths],
    //     format: [...formatters],
    //     paths: ["features/**/*.feature"],
    //     tags: env.TAGS || "",
    //     publishQuiet: true
    // }
};