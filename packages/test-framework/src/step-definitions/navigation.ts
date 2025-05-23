import { Given, When } from "@cucumber/cucumber";
import * as allure from "allure-js-commons";
import { TestContext } from "@support/TestContext";
import { env } from "@config/env";

Given(/^I navigate to the website$/, async function(this: TestContext) {
  await allure.step("Navigate to website", async () => {
    await this.page?.goto(env.WEB_SITE_URL);
    console.log(`Navigated to ${env.WEB_SITE_URL}`);
  });
});

Given(/^I navigate to "([^"]*)"$/, async function(this: TestContext, url: string) {
  await allure.step(`Navigate to ${url}`, async () => {
    // Handle relative URLs
    if (!url.startsWith('http')) {
      url = new URL(url, env.WEB_SITE_URL).toString();
    }
    await this.page?.goto(url);
  });
});

When(/^I click on "([^"]*)"$/, async function(this: TestContext, selector: string) {
  await allure.step(`Click on ${selector}`, async () => {
    await this.page?.click(selector);
  });
});

When(/^I click the button containing "([^"]*)"$/, async function(this: TestContext, text: string) {
  await allure.step(`Click button containing "${text}"`, async () => {
    await this.page?.getByRole('button', { name: new RegExp(text, 'i') }).click();
  });
});

When(/^I fill in "([^"]*)" with "([^"]*)"$/, async function(this: TestContext, field: string, value: string) {
  await allure.step(`Fill in "${field}" with "${value}"`, async () => {
    await this.page?.fill(field, value);
  });
});

When(/^I wait for (\d+) seconds$/, async function(this: TestContext, seconds: number) {
  await allure.step(`Wait for ${seconds} seconds`, async () => {
    await this.page?.waitForTimeout(seconds * 1000);
  });
});
