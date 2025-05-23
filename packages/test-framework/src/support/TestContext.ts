import { World, IWorldOptions } from '@cucumber/cucumber';
import {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  LaunchOptions,
  Page,
  chromium,
  firefox,
  webkit
} from '@playwright/test';
import { PageFactory } from '@utils/PageFactory';
import { ApiFactory } from '@utils/ApiFactory';
import { step, logStep, Status, attachment } from 'allure-js-commons';

/**
 * Context for test execution, extends Cucumber World
 */
export class TestContext extends World {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;

  private _pageFactory?: PageFactory;
  private _apiFactory?: ApiFactory;

  private testData: Map<string, any> = new Map();

  constructor(options: IWorldOptions) {
    super(options);
  }

  /**
   * Get the page factory, creating it if it doesn't exist
   */
  public get pageFactory(): PageFactory {
    if (!this._pageFactory && this.page) {
      this._pageFactory = new PageFactory(this.page);
    } else if (!this.page) {
      throw new Error('Page is not initialized. Cannot create PageFactory.');
    }

    return this._pageFactory!;
  }

  /**
   * Get the API factory, creating it if it doesn't exist
   */
  public get apiFactory(): ApiFactory {
    if (!this._apiFactory && this.page) {
      this._apiFactory = new ApiFactory(this.page);
    } else if (!this.page) {
      throw new Error('Page is not initialized. Cannot create ApiFactory.');
    }

    return this._apiFactory!;
  }

  /**
   * Set test data
   */
  public setData(key: string, value: any): void {
    this.testData.set(key, value);
  }

  /**
   * Get test data
   */
  public getData<T>(key: string): T | undefined {
    return this.testData.get(key) as T;
  }

  /**
   * Clear all test data
   */
  public clearData(): void {
    this.testData.clear();
  }

  /**
   * Take a screenshot and attach it to the Allure report
   */
  public async takeScreenshot(name: string): Promise<void> {
    if (!this.page) {
      console.error('Cannot take screenshot: Page is not initialized');
      return;
    }

    try {
      const screenshot = await this.page.screenshot();
      await attachment(name, screenshot, 'image/png');
    } catch (error) {
      console.error(`Failed to take screenshot: ${error}`);
    }
  }

  /**
   * Helper method to wrap test context actions with Allure reporting
   * @param stepName Name of the step for Allure report
   * @param action Function that performs the action
   * @param screenshotOnSuccess Whether to take a screenshot on successful action
   */
  public async withReporting<T>(
      stepName: string,
      action: () => Promise<T>,
      screenshotOnSuccess: boolean = false
  ): Promise<T> {
    try {
      return await step(stepName, async () => {
        const result = await action();
        if (screenshotOnSuccess && this.page) {
          await this.takeScreenshot(`${stepName} - success`);
        }
        return result;
      });
    } catch (error: any) {
      if (this.page) {
        await this.takeScreenshot(`${stepName} - failed`);
      }
      await logStep(stepName, Status.FAILED, error);
      throw error;
    }
  }

  /**
   * Initialize browser context and page for the test
   */
  public async init(options?: { browserOptions?: LaunchOptions, contextOptions?: BrowserContextOptions }): Promise<void> {
    try {
      await step('Initialize test context', async () => {
        if (!this.browser) {
          this.browser = await this.launchBrowser(options?.browserOptions);
        }

        this.context = await this.browser.newContext(options?.contextOptions);
        this.page = await this.context.newPage();

        this._pageFactory = undefined;
        this._apiFactory = undefined;
      });
    } catch (error: any) {
      await logStep('Failed to initialize test context', Status.FAILED, error);
      throw error;
    }
  }

  private async launchBrowser(browserOptions?: LaunchOptions): Promise<Browser> {
    const browserLaunchers = {
      'chrome': chromium,
      'firefox': firefox,
      'webkit': webkit
    };

    const channel = browserOptions?.channel ?? 'chrome';
    const launcher = browserLaunchers[channel as keyof typeof browserLaunchers] || chromium;

    return launcher.launch(browserOptions);
  }

  /**
   * Cleanup resources when the test finishes
   */
  public async cleanup(): Promise<void> {
    try {
      await step('Cleanup test context', async () => {
        // Clear API mocks if available
        if (this._apiFactory) {
          await this._apiFactory.clearAllMocks();
          this._apiFactory = undefined;
        }

        // Reset page factory
        this._pageFactory = undefined;

        // Close page if exists
        if (this.page) {
          await this.page.close();
          this.page = undefined;
        }

        // Close context if exists
        if (this.context) {
          await this.context.close();
          this.context = undefined;
        }

        // Clear test data
        this.clearData();
      });
    } catch (error: any) {
      console.error('Error during cleanup:', error);
    }
  }
}