import allureConfig from "@config/allure.config";
import { env } from "@config/env";
import * as path from "node:path";

const isCompiled = __dirname.includes("dist");

const requirePaths = isCompiled
    ? [path.resolve("dist/tests/step-definitions/**/*.js")]
    : [path.resolve("tests/step-definitions/**/*.ts")];

module.exports = {
    default: {
        require: requirePaths,
        format: ["progress-bar", allureConfig.format[0]],
        paths: ["features/**/*.feature"],
        tags: env.TAG || "", // pass via ENV
    },
};