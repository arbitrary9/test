import { z } from "zod";
import * as dotenv from "dotenv";

// Initialize dotenv
dotenv.config();

// Define schema for TestRail environment
export const TestrailSchema = z.object({
  TESTRAIL_HOST: z.string().url(),
  TESTRAIL_USERNAME: z.string(),
  TESTRAIL_PASSWORD: z.string(),
  TESTRAIL_PROJECT_ID: z.string(),
  TESTRAIL_SUITE_ID: z.string().optional(),
  TESTRAIL_RUN_ID: z.string().optional(),
  TESTRAIL_RUN_NAME: z.string().optional(),
  TESTRAIL_MILESTONE_ID: z.string().optional(),
  ALLURE_RESULTS_DIR: z.string().default("../test-framework/allure-results")
});

// Type for TestRail environment
export type TestrailEnv = z.infer<typeof TestrailSchema>;

// Parse environment variables using the schema
export const env: TestrailEnv = TestrailSchema.parse({
  TESTRAIL_HOST: process.env.TESTRAIL_HOST,
  TESTRAIL_USERNAME: process.env.TESTRAIL_USERNAME,
  TESTRAIL_PASSWORD: process.env.TESTRAIL_PASSWORD,
  TESTRAIL_PROJECT_ID: process.env.TESTRAIL_PROJECT_ID,
  TESTRAIL_SUITE_ID: process.env.TESTRAIL_SUITE_ID,
  TESTRAIL_RUN_ID: process.env.TESTRAIL_RUN_ID,
  TESTRAIL_RUN_NAME: process.env.TESTRAIL_RUN_NAME,
  TESTRAIL_MILESTONE_ID: process.env.TESTRAIL_MILESTONE_ID,
  ALLURE_RESULTS_DIR: process.env.ALLURE_RESULTS_DIR
});
