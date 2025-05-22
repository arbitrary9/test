import { World, IWorldOptions } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page } from "@playwright/test";

/**
 * Context for test execution, extends Cucumber World
 */
export class TestContext extends World {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;
  
  // Store test data
  private testData: Map<string, any> = new Map();
  
  constructor(options: IWorldOptions) {
    super(options);
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
   * Cleanup resources when test finishes
   */
  public async cleanup(): Promise<void> {
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
  }
}
