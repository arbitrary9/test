import { Page } from '@playwright/test';
import { env } from '@config/env';
import {attachment, logStep, Status, step} from 'allure-js-commons';

export abstract class BasePage {
    protected readonly page: Page;
    protected readonly baseUrl: string;
    protected abstract path: string;

    protected constructor(page: Page) {
        this.baseUrl = env.WEB_SITE_URL;
        this.page = page;
    }

    /**
     * Get the full URL for this page
     */
    get url(): string {
        return `${this.baseUrl}${this.path}`;
    }

    protected async _navigateTo(): Promise<void> {
        await this.page.goto(this.url);
    }
    /**
     * Navigate to this page with Allure reporting
     */
    public async navigateTo(): Promise<void> {
        try {
            await step(`Navigate to ${this.constructor.name} (${this.url})`, async (context) => {
                context.parameter("url", this.url);
                await this._navigateTo();
            });
        } catch (error: any) {
            await this.takeScreenshot(`Failed to navigate to ${this.constructor.name}`);
            await logStep(`Failed to navigate to ${this.constructor.name}`, Status.FAILED, error);
        }
    }

    protected async _waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
    }
    /**
     * Wait for the page to be loaded with Allure reporting
     */
    async waitForPageLoad(): Promise<void> {
        try {
            await step(`Wait for ${this.constructor.name} to load`, async (context) => {
                context.parameter("url", this.url);
                await this._waitForPageLoad();
            });
        } catch (error: any) {
            await this.takeScreenshot(`Failed to load ${this.constructor.name}`);
            await logStep(`Failed to load ${this.constructor.name}`, Status.FAILED, error);
        }
    }

    protected async _isCurrentPage(): Promise<boolean> {
        return this.page.url() === this.url;
    }
    /**
     * Check if we are on this page with Allure reporting
     */
    async isCurrentPage(): Promise<boolean> {
        try {
            await step(`Check if current page is ${this.constructor.name}`, async () => {
                if(!await this._isCurrentPage()) throw new Error(`Current page is not ${this.constructor.name}`);
            });
            return true;
        } catch (error: any) {
            await logStep(`Failed to check if current page is ${this.constructor.name}`, Status.FAILED, error);
            return false;
        }
    }

    /**
     * Take a screenshot and attach it to the Allure report
     */
    protected async takeScreenshot(name: string): Promise<void> {
        try {
            const screenshot = await this.page.screenshot();
            await attachment(name, screenshot, 'image/png');
        } catch (error) {
            console.error(`Failed to take screenshot: ${error}`);
        }
    }

    /**
     * Helper method to wrap page actions with Allure reporting
     * @param stepName Name of the step for Allure report
     * @param action Function that performs the action
     * @param screenshotOnSuccess Whether to take a screenshot on successful action
     */
    protected async withReporting<T>(
        stepName: string,
        action: () => Promise<T>,
        screenshotOnSuccess: boolean = false
    ): Promise<T> {
        try {
            return await step(stepName, async () => {
                const result = await action();
                if (screenshotOnSuccess) {
                    await this.takeScreenshot(`${stepName} - success`);
                }
                return result;
            });
        } catch (error: any) {
            await this.takeScreenshot(`${stepName} - failed`);
            await logStep(stepName, Status.FAILED, error);
            throw error;
        }
    }
}