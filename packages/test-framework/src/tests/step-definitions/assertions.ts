import { Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import * as allure from "allure-js-commons";
import { TestContext } from "../support/TestContext";

Then(/^I verify it works$/, async function(this: TestContext) {
  await allure.step("Verify it works", async () => {
    // Simple assertion example
    expect(true).toBeTruthy();
    console.log("Verification complete");
  });
});

Then(/^I should see "([^"]*)" on the page$/, async function(this: TestContext, text: string) {
  await allure.step(`Verify text "${text}" is visible`, async () => {
    await expect(this.page?.getByText(text)).toBeVisible();
  });
});

Then(/^I should see element "([^"]*)"$/, async function(this: TestContext, selector: string) {
  await allure.step(`Verify element "${selector}" is visible`, async () => {
    await expect(this.page?.locator(selector)).toBeVisible();
  });
});

Then(/^the page title should be "([^"]*)"$/, async function(this: TestContext, title: string) {
  await allure.step(`Verify page title is "${title}"`, async () => {
    await expect(this.page).toHaveTitle(title);
  });
});

Then(/^the page URL should contain "([^"]*)"$/, async function(this: TestContext, urlPart: string) {
  await allure.step(`Verify URL contains "${urlPart}"`, async () => {
    await expect(this.page).toHaveURL(new RegExp(urlPart));
  });
});
