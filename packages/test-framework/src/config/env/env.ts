import { z } from "zod";
import * as dotenv from "dotenv";
import { Tag } from "./validators/Tag";
import { tagConfig } from "./config.tags";

// Initialize dotenv
dotenv.config();

// Initialize tag configuration
Tag.initialize(tagConfig);

// Define schema for test framework environment
export const TestFrameworkSchema = z.object({
  WEB_SITE_URL: z.string().url(),
  BROWSER: z.enum(["chromium", "firefox", "webkit"]).default("chromium"),
  HEADLESS: z.enum(["true", "false"]).default("true").transform(val => val === "true"),
  SCREENSHOT_ON_FAILURE: z.enum(["true", "false"]).default("true").transform(val => val === "true"),
  TRACE_ON_FAILURE: z.enum(["true", "false"]).default("false").transform(val => val === "true"),
  DEFAULT_TIMEOUT: z.string().default("30000").transform(val => parseInt(val, 10)),
  RETRY_COUNT: z.string().default("0").transform(val => parseInt(val, 10)),
  TAGS: z.string().optional()
});

// Type for test framework environment
export type TestFrameworkEnv = z.infer<typeof TestFrameworkSchema>;

// Parse environment variables using the schema
export const env: TestFrameworkEnv = TestFrameworkSchema.parse({
  WEB_SITE_URL: process.env.WEB_SITE_URL,
  BROWSER: process.env.BROWSER,
  HEADLESS: process.env.HEADLESS,
  SCREENSHOT_ON_FAILURE: process.env.SCREENSHOT_ON_FAILURE,
  TRACE_ON_FAILURE: process.env.TRACE_ON_FAILURE,
  DEFAULT_TIMEOUT: process.env.DEFAULT_TIMEOUT,
  RETRY_COUNT: process.env.RETRY_COUNT,
  TAGS: process.env.TAGS
});

// Export the tag configuration
export { tagConfig };
