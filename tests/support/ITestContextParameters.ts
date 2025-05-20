import {Browser, Page, BrowserContext} from "@playwright/test"

export interface ITestContextParameters {
    webSiteUrl: string;
    browser: Browser;
    context: BrowserContext;
    page: Page;
}