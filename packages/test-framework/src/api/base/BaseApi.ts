import { Page, Request, Route } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { attachment, logStep, Status, step } from 'allure-js-commons';
import { glob } from 'glob';

export interface MockOptions {
    status?: number;
    contentType?: string;
    delay?: number;
}

export class BaseApi {
    protected readonly page: Page;
    protected readonly fixturesBasePath: string;
    private readonly mockedRoutes: Map<string, string | RegExp> = new Map();

    constructor(page: Page, fixturesBasePath: string = 'src/fixtures') {
        this.page = page;
        this.fixturesBasePath = fixturesBasePath;
    }

    /**
     * Find a fixture file in fixtures directory
     */
    private async _findFixture(fixturePath: string): Promise<string> {
        const fullPath = path.resolve(this.fixturesBasePath, fixturePath);

        if (fs.existsSync(fullPath)) {
            return fullPath;
        }

        // Try to find with .json extension if not provided
        if (!path.extname(fullPath) && fs.existsSync(`${fullPath}.json`)) {
            return `${fullPath}.json`;
        }

        throw new Error(`Fixture file not found: ${fixturePath}`);
    }

    /**
     * Find a fixture file with Allure reporting
     */
    async findFixture(fixturePath: string): Promise<string> {
        try {
            return await step(`Find fixture file: ${fixturePath}`, async (context) => {
                context.parameter("fixturePath", fixturePath);
                return await this._findFixture(fixturePath);
            });
        } catch (error: any) {
            await logStep(`Failed to find fixture: ${fixturePath}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Load fixture content without reporting
     */
    private async _loadFixture(fixturePath: string): Promise<string | Buffer> {
        const fullPath = await this._findFixture(fixturePath);
        return fs.readFileSync(fullPath);
    }

    /**
     * Load fixture content with Allure reporting
     */
    async loadFixture(fixturePath: string): Promise<string | Buffer> {
        try {
            return await step(`Load fixture file: ${fixturePath}`, async (context) => {
                context.parameter("fixturePath", fixturePath);
                const content = await this._loadFixture(fixturePath);

                // Attach fixture content to Allure report
                const fullPath = await this._findFixture(fixturePath);
                if (path.extname(fullPath) === '.json') {
                    const jsonContent = JSON.parse(content.toString());
                    await attachment('Fixture content', JSON.stringify(jsonContent, null, 2), 'application/json');
                } else {
                    await attachment('Fixture content', content.toString(), 'text/plain');
                }

                return content;
            });
        } catch (error: any) {
            await attachment('Error loading fixture', String(error), 'text/plain');
            await logStep(`Failed to load fixture: ${fixturePath}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * List available fixtures without reporting
     */
    private async _listFixtures(directoryPath: string = ''): Promise<string[]> {
        const fullPath = path.resolve(this.fixturesBasePath, directoryPath);
        return await glob('**/*', { cwd: fullPath, nodir: true });
    }

    /**
     * List available fixtures with Allure reporting
     */
    async listFixtures(directoryPath: string = ''): Promise<string[]> {
        try {
            return await step(`List fixtures in directory: ${directoryPath}`, async (context) => {
                context.parameter("directoryPath", directoryPath);
                const files = await this._listFixtures(directoryPath);
                await attachment('Available fixtures', files.join('\n'), 'text/plain');
                return files;
            });
        } catch (error: any) {
            await attachment('Error listing fixtures', String(error), 'text/plain');
            await logStep(`Failed to list fixtures: ${directoryPath}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Mock API response without reporting
     */
    private async _mockResponse(
        url: string | RegExp,
        fixturePath: string,
        options: MockOptions = {}
    ): Promise<void> {
        const fixtureContent = await this._loadFixture(fixturePath);
        const status = options.status || 200;
        const contentType = options.contentType || 'application/json';
        const delay = options.delay || 0;

        await this.page.route(url, async (route) => {
            // Log request details
            this._logRequest(route.request());

            // Delay response if specified
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            // Fulfill with fixture content
            await route.fulfill({
                status,
                contentType,
                body: fixtureContent,
            });
        });

        // Store route for later unrouting
        const urlDesc = url instanceof RegExp ? url.toString() : url;
        this.mockedRoutes.set(urlDesc, url);
    }

    /**
     * Mock API response with Allure reporting
     */
    async mockResponse(
        url: string | RegExp,
        fixturePath: string,
        options: MockOptions = {}
    ): Promise<void> {
        const urlDesc = url instanceof RegExp ? url.toString() : url;

        try {
            await step(`Mock API response for: ${urlDesc}`, async (context) => {
                context.parameter("url", urlDesc);
                context.parameter("fixturePath", fixturePath);
                context.parameter("options", JSON.stringify(options));

                await this._mockResponse(url, fixturePath, options);

                // Attach fixture content
                const content = await this._loadFixture(fixturePath);
                const contentType = options.contentType || 'application/json';

                if (contentType === 'application/json') {
                    const jsonContent = JSON.parse(content.toString());
                    await attachment('Mocked response', JSON.stringify(jsonContent, null, 2), 'application/json');
                } else {
                    await attachment('Mocked response', content.toString(), 'text/plain');
                }
            });
        } catch (error: any) {
            await attachment('Error mocking response', String(error), 'text/plain');
            await logStep(`Failed to mock response for: ${urlDesc}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Mock API response with custom handler without reporting
     */
    private async _mockWithHandler(
        url: string | RegExp,
        handler: (route: Route, request: Request) => Promise<void>
    ): Promise<void> {
        await this.page.route(url, async (route) => {
            // Log request details
            this._logRequest(route.request());

            // Call custom handler
            await handler(route, route.request());
        });

        // Store route for later unrouting
        const urlDesc = url instanceof RegExp ? url.toString() : url;
        this.mockedRoutes.set(urlDesc, url);
    }

    /**
     * Mock API response with custom handler with Allure reporting
     */
    async mockWithHandler(
        url: string | RegExp,
        handler: (route: Route, request: Request) => Promise<void>
    ): Promise<void> {
        const urlDesc = url instanceof RegExp ? url.toString() : url;

        try {
            await step(`Mock API response for: ${urlDesc} with custom handler`, async (context) => {
                context.parameter("url", urlDesc);

                // Custom handler that adds reporting
                const reportingHandler = async (route: Route, request: Request) => {
                    try {
                        await step(`Custom handler for: ${request.url()}`, async () => {
                            await handler(route, request);
                        });
                    } catch (error: any) {
                        await attachment('Error in custom handler', String(error), 'text/plain');
                        await logStep(`Failed in custom handler for: ${request.url()}`, Status.FAILED, error);
                        throw error;
                    }
                };

                await this._mockWithHandler(url, reportingHandler);
            });
        } catch (error: any) {
            await attachment('Error setting up custom mock', String(error), 'text/plain');
            await logStep(`Failed to set up custom mock for: ${urlDesc}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Remove a specific mock without reporting
     */
    private async _removeMock(url: string | RegExp): Promise<void> {
        const urlDesc = url instanceof RegExp ? url.toString() : url;

        if (this.mockedRoutes.has(urlDesc)) {
            await this.page.unroute(url);
            this.mockedRoutes.delete(urlDesc);
        } else {
            throw new Error(`No mock found for URL: ${urlDesc}`);
        }
    }

    /**
     * Remove a specific mock with Allure reporting
     */
    async removeMock(url: string | RegExp): Promise<void> {
        const urlDesc = url instanceof RegExp ? url.toString() : url;

        try {
            await step(`Remove mock for: ${urlDesc}`, async (context) => {
                context.parameter("url", urlDesc);
                await this._removeMock(url);
            });
        } catch (error: any) {
            await logStep(`Failed to remove mock for: ${urlDesc}`, Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Remove all mocks without reporting
     */
    private async _removeAllMocks(): Promise<void> {
        for (const [urlDesc, url] of this.mockedRoutes.entries()) {
            try {
                await this.page.unroute(url);
                this.mockedRoutes.delete(urlDesc);
            } catch (error) {
                console.error(`Error removing mock for ${urlDesc}:`, error);
            }
        }
    }

    /**
     * Remove all mocks with Allure reporting
     */
    async removeAllMocks(): Promise<void> {
        try {
            await step('Remove all API mocks', async () => {
                await this._removeAllMocks();
            });
        } catch (error: any) {
            await attachment('Error removing all mocks', String(error), 'text/plain');
            await logStep('Failed to remove all mocks', Status.FAILED, error);
            throw error;
        }
    }

    /**
     * Log request details without reporting
     */
    private _logRequest(request: Request): void {
        try {
            const url = request.url();
            const method = request.method();
            const headers = request.headers();
            const postData = request.postData();

            let logContent = `URL: ${url}\nMethod: ${method}\n\nHeaders:\n`;

            for (const [key, value] of Object.entries(headers)) {
                logContent += `${key}: ${value}\n`;
            }

            if (postData) {
                logContent += `\nRequest Body:\n${postData}`;
            }

            console.log("Request details:", logContent);
        } catch (error) {
            console.error('Error logging request:', error);
        }
    }

    /**
     * Log request details with Allure reporting
     */
    async logRequest(request: Request): Promise<void> {
        try {
            await step(`Log request details for: ${request.url()}`, async () => {
                const url = request.url();
                const method = request.method();
                const headers = request.headers();
                const postData = request.postData();

                let logContent = `URL: ${url}\nMethod: ${method}\n\nHeaders:\n`;

                for (const [key, value] of Object.entries(headers)) {
                    logContent += `${key}: ${value}\n`;
                }

                await attachment('Request details', logContent, 'text/plain');

                if (postData) {
                    // Try to parse and format JSON
                    try {
                        const jsonData = JSON.parse(postData);
                        await attachment('Request body (JSON)', JSON.stringify(jsonData, null, 2), 'application/json');
                    } catch (e) {
                        // Not JSON, use plain text
                        await attachment('Request body', postData, 'text/plain');
                    }
                }
            });
        } catch (error: any) {
            console.error('Error logging request with Allure:', error);
        }
    }

    /**
     * Helper method to wrap API actions with Allure reporting
     * @param stepName Name of the step for Allure report
     * @param action Function that performs the action
     */
    protected async withReporting<T>(
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
}