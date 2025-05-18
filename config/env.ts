import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config(); // Load .env into process.env

const EnvSchema = z.object({
    TAG: z.string().optional(),
    ENV: z.enum(["local", "ci", "docker"]).default("local"),
    DEBUG: z
        .string()
        .optional()
        .transform((val) => val === "true"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;