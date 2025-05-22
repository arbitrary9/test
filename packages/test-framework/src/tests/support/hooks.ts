import { After, Before, BeforeAll, AfterAll, setDefaultTimeout, Status, ITestCaseHookParameter } from "@cucumber/cucumber";
import { chromium, firefox, webkit, Browser, BrowserContext } from "@playwright/test";
import * as allure from "allure-js-commons";
import { TestContext } from "./TestContext";
import { env } from "../../config/env/env";

// Set default timeout
setDefaultTimeout(env.DEFAULT_TIMEOUT);

// Initialize browser before all tests
let browser: Browser;

BeforeAll(async function() {
  console.log(`Starting tests with ${env.BROWSER} browser in ${env.HEADLESS ? 'headless' : 'headed'} mode`);
  
  // Select browser based on configuration
  switch (env.BROWSER) {
    case 'firefox':
      browser = await firefox.launch({ headless: env.HEADLESS });
      break;
    case 'webkit':
      browser = await webkit.launch({ headless: env.HEADLESS });
      break;
    case 'chromium':
    default:
      browser = await chromium.launch({ headless: env.HEADLESS });
      break;
  }
});

// Setup test context before each scenario
Before(async function(this: TestContext) {
  this.browser = browser;
  this.context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: env.TRACE_ON_FAILURE ? { dir: 'trace/videos/' } : undefined
  });
  this.page = await this.context.newPage();
  
  // Start tracing if enabled
  if (env.TRACE_ON_FAILURE) {
    await this.context.tracing.start({ screenshots: true, snapshots: true });
  }
});

// Cleanup after each scenario
After(async function(this: TestContext, scenario: ITestCaseHookParameter) {
  // Capture screenshot on failure if enabled
  if (scenario.result?.status === Status.FAILED && env.SCREENSHOT_ON_FAILURE) {
    const screenshot = await this.page?.screenshot({ 
      path: `screenshots/failure-${scenario.pickle.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.png`,
      type: 'png', 
      fullPage: true 
    });
    
    // Attach screenshot to Allure report
    if (screenshot) {
      allure.attachment('Screenshot on failure', screenshot, 'image/png');
    }
  }
  
  // Stop and export tracing on failure if enabled
  if (scenario.result?.status === Status.FAILED && env.TRACE_ON_FAILURE) {
    await this.context?.tracing.stop({
      path: `trace/trace-${scenario.pickle.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.zip`
    });
  }
  
  // Cleanup resources
  await this.cleanup();
});

// Close browser after all tests
AfterAll(async function() {
  await browser?.close();
  console.log('Tests completed');
});
