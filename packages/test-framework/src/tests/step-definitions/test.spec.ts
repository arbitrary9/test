import {Given} from "@cucumber/cucumber";
import * as allure from "allure-js-commons";
import {TestContext} from "../support/TestContext";

Given(/^I do something$/, async function (this: TestContext) {
    await allure.step("User does something", async (context) => {
        context.parameter("param", "value");
        console.log("It works");
    });
    console.log("It works");
});
