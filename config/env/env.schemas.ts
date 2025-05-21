import { z } from "zod";
import { TagValidator } from "./validators/TagValidator";

export const TestRailSchema = z.object({
    TESTRAIL_HOST: z.string().url(),
    TESTRAIL_USERNAME: z.string(),
    TESTRAIL_PASSWORD: z.string(),
    TESTRAIL_PROJECT_ID: z.string(),
    TESTRAIL_SUITE_ID: z.string().optional(),
    TESTRAIL_RUN_NAME: z.string().optional()
});
export type TestRailEnv = z.infer<typeof TestRailSchema>;

export const CucumberSchema = z.object({
    TAGS: z.string().optional()
        // .describe(`Comma-separated list of supported tags: ${TagValidator.getSupportedTags().join(', ')}`)
        // .transform((val) => TagValidator.process(val))
});
export type CucumberEnv = z.infer<typeof CucumberSchema>;

export const EnvironmentSchema = z.object({
    WEB_SITE_URL: z.string().url(),
});
export type EnvironmentEnv = z.infer<typeof EnvironmentSchema>;

export const EnvSchema = z.object({
    TESTRAIL: TestRailSchema.optional(),
    CUCUMBER: CucumberSchema.optional(),
    ENVIRONMENT: EnvironmentSchema
});
export type Env = z.infer<typeof EnvSchema>;