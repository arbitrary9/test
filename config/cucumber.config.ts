import * as path from "node:path";
import { env } from "@config/env"

const isDist = process.env.NODE_ENV === 'production';

const requirePaths = isDist
    ? [path.resolve("dist/tests/step-definitions/**/*.js"), path.resolve("dist/tests/support/**/*.js")]
    : [path.resolve("tests/step-definitions/**/*.ts"), path.resolve("tests/support/**/*.ts")];

const formatters = ["progress-bar"];

if (env.TESTRAIL !== undefined) {
    formatters.push("json:allure-results/cucumber-results.json");
}

module.exports = {
    default: {
        require: [...requirePaths],
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