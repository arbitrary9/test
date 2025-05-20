import {After, Before, setWorldConstructor} from "@cucumber/cucumber";
import fs from "fs";
import path from "path";
import * as allure from "allure-js-commons";
import { ContentType } from "allure-js-commons";
import {TestContext} from "./TestContext";
import {chromium} from "@playwright/test"

setWorldConstructor(TestContext);

Before(async function (this: TestContext, scenario) {
    this.parameters.browser = await chromium.launch();
    this.parameters.context = await this.parameters.browser.newContext({baseURL: this.parameters.webSiteUrl});
    this.parameters.page = await this.parameters.context.newPage();
    await this.parameters.context.tracing.start({ screenshots: true, snapshots: true });
})
After(async function (this: TestContext, scenario) {
    if (scenario.result?.status === "FAILED") {
        const filePath = path.resolve("screenshots", `failed-${Date.now()}.png`);
        await this.parameters.page.screenshot({ path: filePath });

        const buffer = fs.readFileSync(filePath);
        await allure.attachment(scenario.pickle.name, buffer, ContentType.PNG);
    }
    const tracePath = path.resolve("trace", `trace-${Date.now()}.zip`);
    await this.parameters.context.tracing.stop({ path: tracePath });
    await allure.attachTrace(scenario.pickle.id, tracePath);
});
