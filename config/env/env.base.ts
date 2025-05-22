import { z } from "zod";
import * as dotenv from "dotenv";
import path from "path";

export function loadEnvConfig<T extends z.ZodTypeAny>(schema: T, options?: {
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
