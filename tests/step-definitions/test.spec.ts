import {Given} from "@cucumber/cucumber";
import * as allure from "allure-js-commons";

Given(/^I do something$/, async () => {
    await allure.step("User does something", async (context) => {
        context.parameter("param", "value");
        console.log("It works");
    });
    console.log("It works");
});