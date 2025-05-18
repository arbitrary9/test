import { After } from "@cucumber/cucumber";
import fs from "fs";
import path from "path";
import { Status, ContentType } from "allure-js-commons";
import { allureRuntime } from "@config/allure-runtime"; // use your path alias

After(async function (scenario) {
    if (scenario.result?.status === "FAILED") {
        const filePath = path.resolve("screenshots", `failed-${Date.now()}.png`);
        await page.screenshot({ path: filePath });

        const buffer = fs.readFileSync(filePath);

        const currentTest = allureRuntime.startTest("failed-scenario");
        currentTest.addAttachment("Screenshot", ContentType.PNG, buffer);
        currentTest.endTest(Status.FAILED);
    }
});
