import { z } from "zod";
import * as dotenv from "dotenv";
import { Tag } from "@validators/Tag";
import { tagConfig } from "./config.tags";
import * as process from "node:process";
import appRootPath from "app-root-path";
import * as path from "node:path";

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

function loadEnvConfig<T extends z.ZodTypeAny>(schema: T, options?: {
  envPath?: string;
  required?: boolean;
}): z.infer<T> {
  const envFile = options?.envPath || '.env';
  const required = options?.required ?? true;

  const result = dotenv.config({
    path: path.resolve(process.cwd(), envFile),
  });

  if (result.error && required) {
    console.error(`Failed to load environment file: ${envFile}`);
    process.exit(1);
  }

  const parsed = schema.safeParse(process.env);

  if (!parsed.success && required) {
    console.error("Invalid environment variables:", parsed.error.format());
    process.exit(1);
  }

  console.log(`Loaded environment variables from ${envFile}`);
  return parsed.data;
}
export const env = loadEnvConfig(TestFrameworkSchema);

export { tagConfig };
