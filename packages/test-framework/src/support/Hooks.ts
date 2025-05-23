import { Before, After, BeforeAll, AfterAll, Status as CucumberStatus } from '@cucumber/cucumber';
import { TestContext } from './TestContext';
import { env } from '@config/env';

Before(async function(this: TestContext) {
  await this.init({
    browserOptions: {
      headless: env.HEADLESS,
      channel: env.CHANNEL,
      slowMo: env.SLOW_MO,
      args: [ '--disable-extensions' ],
      tracesDir: env.TRACES_DIR,
      downloadsPath: env.DOWNLOADS_DIR
    },
    contextOptions: {
      screen: { width: 1920, height: 1080 },
      viewport: { width: 1920, height: 1080 },
      recordVideo: env.RECORD_VIDEO ? {
        dir: env.VIDEOS_DIR
      } : undefined
    }
  });
});

After(async function(this: TestContext, scenario) {
  if (scenario.result?.status === CucumberStatus.FAILED) {
    await this.takeScreenshot('Failed scenario screenshot');
  }

  await this.cleanup();
});

BeforeAll(async function() {
  console.log('Starting test run');
});


AfterAll(async function() {
  console.log('Test run complete');
});