// src/pages/PageFactory.ts
import { Page } from '@playwright/test';
import { step, logStep, Status, attachment } from 'allure-js-commons';

// Import your page classes here
// Example:
// import { LoginPage } from '@pages/LoginPage';
// import { HomePage } from '@pages/HomePage';
// import { ProductPage } from '@pages/ProductPage';

export class PageFactory {
    private readonly page: Page;
    private pages: Map<string, any> = new Map();

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Get an existing page instance or create a new one if it doesn't exist
     * @param key The key for the page instance
     * @param factory A function that creates a new page instance
     */
    private getOrCreatePage<T>(key: string, factory: () => T): T {
        if (!this.pages.has(key)) {
            this.pages.set(key, factory());
        }
        return this.pages.get(key);
    }

    /**
     * Take a screenshot and attach it to the Allure report
     */
    private async takeScreenshot(name: string): Promise<void> {
        try {
            const screenshot = await this.page.screenshot();
            await attachment(name, screenshot, 'image/png');
        } catch (error) {
            console.error(`Failed to take screenshot: ${error}`);
        }
    }

    // Define page accessor methods here
    // Example:
    // login(): LoginPage {
    //     return this.getOrCreatePage('login', () => new LoginPage(this.page));
    // }
    //
    // home(): HomePage {
    //     return this.getOrCreatePage('home', () => new HomePage(this.page));
    // }
    //
    // product(): ProductPage {
    //     return this.getOrCreatePage('product', () => new ProductPage(this.page));
    // }

    /**
     * Navigate to a specific page with Allure reporting
     * @param getPage Function that returns the page to navigate to
     * @param pageDescription Human-readable description of the page
     */
    async navigateTo<T>(getPage: () => T, pageDescription: string): Promise<T> {
        try {
            return await step(`Navigate to ${pageDescription}`, async () => {
                const page = getPage();
                // This assumes the page has a navigateTo method
                if (typeof (page as any).navigateTo === 'function') {
                    await (page as any).navigateTo();
                } else {
                    throw new Error(`Page ${pageDescription} does not have a navigateTo method`);
                }
                return page;
            });
        } catch (error: any) {
            await this.takeScreenshot(`Failed to navigate to ${pageDescription}`);
            await logStep(`Failed to navigate to ${pageDescription}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Navigate to a specific page and wait for it to load with Allure reporting
     * @param getPage Function that returns the page to navigate to
     * @param pageDescription Human-readable description of the page
     */
    async navigateToAndWaitForLoad<T>(getPage: () => T, pageDescription: string): Promise<T> {
        try {
            return await step(`Navigate to ${pageDescription} and wait for load`, async () => {
                const page = getPage();
                // This assumes the page has navigateTo and waitForPageLoad methods
                if (typeof (page as any).navigateTo === 'function' &&
                    typeof (page as any).waitForPageLoad === 'function') {
                    await (page as any).navigateTo();
                    await (page as any).waitForPageLoad();
                } else {
                    throw new Error(`Page ${pageDescription} does not have required navigation methods`);
                }
                return page;
            });
        } catch (error: any) {
            await this.takeScreenshot(`Failed to navigate to and load ${pageDescription}`);
            await logStep(`Failed to navigate to and load ${pageDescription}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Helper method to wrap page factory actions with Allure reporting
     * @param stepName Name of the step for Allure report
     * @param action Function that performs the action
     * @param screenshotOnSuccess Whether to take a screenshot on successful action
     */
    async withReporting<T>(
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

    /**
     * Execute a workflow sequence with Allure reporting
     * @param workflowName Name of the workflow for reporting
     * @param workflowSteps Array of workflow step functions
     */
    async executeWorkflow(
        workflowName: string,
        workflowSteps: Array<(factory: PageFactory) => Promise<void>>
    ): Promise<void> {
        return this.withReporting(
            `Execute workflow: ${workflowName}`,
            async () => {
                for (let i = 0; i < workflowSteps.length; i++) {
                    const stepFunction = workflowSteps[i];
                    await this.withReporting(
                        `Workflow step ${i + 1}`,
                        async () => await stepFunction(this)
                    );
                }
            }
        );
    }
}