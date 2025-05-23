import { z } from "zod";
import * as dotenv from "dotenv";
import { Tag } from "@validators/Tag";
import { tagConfig } from "./config.tags";
import * as process from "node:process";
import appRootPath from "app-root-path";

// Initialize dotenv
dotenv.config();

// Initialize tag configuration
Tag.initialize(tagConfig);

// Create absolute paths with appRootPath
const createAbsolutePath = (relativePath: string): string => {
  return `${appRootPath.path}/${relativePath.replace(/^\.\//, '')}`;
};

// Default relative paths
const DEFAULT_PATHS = {
  SCREENSHOTS_DIR: "./test-results/screenshots/",
  VIDEOS_DIR: "./test-results/videos/",
  TRACES_DIR: "./test-results/traces/",
  ALLURE_RESULTS_DIR: "./test-results/allure-results",
  DOWNLOADS_DIR: "./test-results/downloads/",
};

// Define schema for test framework environment
export const TestFrameworkSchema = z.object({
  WEB_SITE_URL: z.string().url(),
  CHANNEL: z.enum(["chrome", "firefox", "webkit"]).default("chrome"),
  HEADLESS: z.enum(["true", "false"]).default("true").transform(val => val === "true"),
  SLOW_MO: z.number().int().optional(),
  RECORD_VIDEO: z.enum(["true", "false"]).default("false").transform(val => val === "true"),

  SCREENSHOT_ON_FAILURE: z.enum(["true", "false"]).default("true").transform(val => val === "true"),
  TRACE_ON_FAILURE: z.enum(["true", "false"]).default("true").transform(val => val === "true"),

  DEFAULT_TIMEOUT: z.string().default("30000").transform(val => parseInt(val, 10)),
  RETRY_COUNT: z.string().default("0").transform(val => parseInt(val, 10)),

  SCREENSHOTS_DIR: z.string().default(DEFAULT_PATHS.SCREENSHOTS_DIR).transform(createAbsolutePath),
  VIDEOS_DIR: z.string().default(DEFAULT_PATHS.VIDEOS_DIR).transform(createAbsolutePath),
  TRACES_DIR: z.string().default(DEFAULT_PATHS.TRACES_DIR).transform(createAbsolutePath),
  ALLURE_RESULTS_DIR: z.string().default(DEFAULT_PATHS.ALLURE_RESULTS_DIR).transform(createAbsolutePath),
  DOWNLOADS_DIR: z.string().default(DEFAULT_PATHS.DOWNLOADS_DIR).transform(createAbsolutePath),
  TAGS: z.string().optional(),
});

// Type for test framework environment
export type TestFrameworkEnv = z.infer<typeof TestFrameworkSchema>;


export const env: TestFrameworkEnv = TestFrameworkSchema.parse({
  WEB_SITE_URL: process.env.WEB_SITE_URL,
  CHANNEL: process.env.CHANNEL,
  HEADLESS: process.env.HEADLESS,
  SLOW_MO: process.env.SLOW_MO,
  RECORD_VIDEO: process.env.RECORD_VIDEO,

  SCREENSHOT_ON_FAILURE: process.env.SCREENSHOT_ON_FAILURE,
  TRACE_ON_FAILURE: process.env.TRACE_ON_FAILURE,

  DEFAULT_TIMEOUT: process.env.DEFAULT_TIMEOUT,
  RETRY_COUNT: process.env.RETRY_COUNT,

  SCREENSHOTS_DIR: process.env.SCREENSHOTS_DIR,
  VIDEOS_DIR: process.env.VIDEOS_DIR,
  TRACES_DIR: process.env.TRACES_DIR,
  ALLURE_RESULTS_DIR: process.env.ALLURE_RESULTS_DIR,
  DOWNLOADS_DIR: process.env.DOWNLOADS_DIR,
  TAGS: process.env.TAGS
});

export { tagConfig };
