// src/api/ApiFactory.ts
import { Page } from '@playwright/test';
import { step, logStep, Status } from 'allure-js-commons';

export class ApiFactory {
    private readonly page: Page;
    private apis: Map<string, any> = new Map();

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Get an existing API instance or create a new one if it doesn't exist
     * @param key The key for the API instance
     * @param factory A function that creates a new API instance
     */
    private getOrCreateApi<T>(key: string, factory: () => T): T {
        if (!this.apis.has(key)) {
            this.apis.set(key, factory());
        }
        return this.apis.get(key);
    }

    /**
     * Remove all API mocks without reporting
     */
    private async _clearAllMocks(): Promise<void> {
        for (const [_, api] of this.apis) {
            if (typeof api.removeAllMocks === 'function') {
                try {
                    await api.removeAllMocks();
                } catch (error) {
                    console.error(`Error removing mocks for API:`, error);
                }
            }
        }
    }

    /**
     * Remove all API mocks with Allure reporting
     */
    async clearAllMocks(): Promise<void> {
        try {
            await step('Clear all API mocks', async () => {
                await this._clearAllMocks();
            });
        } catch (error: any) {
            await logStep('Failed to clear all API mocks', Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Helper method to wrap API factory actions with Allure reporting
     * @param stepName Name of the step for Allure report
     * @param action Function that performs the action
     */
    async withReporting<T>(
        stepName: string,
        action: () => Promise<T>
    ): Promise<T> {
        try {
            return await step(stepName, async () => {
                return await action();
            });
        } catch (error: any) {
            await logStep(stepName, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Setup multiple mocks at once with Allure reporting
     * @param setupFunction A function that sets up all needed mocks
     */
    async setupMocks(setupFunction: (factory: ApiFactory) => Promise<void>): Promise<void> {
        return this.withReporting(
            'Setup API mocks',
            async () => {
                await setupFunction(this);
            }
        );
    }
}