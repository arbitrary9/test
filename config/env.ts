import { loadEnvConfig } from './env/env.base';
import { TestRailSchema, CucumberSchema, EnvironmentSchema, Env } from './env/env.schemas';
import * as process from "node:process";

function loadEnv(): Env {
  let env = process.env.ENV;
  if(env === undefined) env = "local";
  return {
    TESTRAIL: loadEnvConfig(TestRailSchema, { envPath: `.env.${env}`, required: false }),
    CUCUMBER: loadEnvConfig(CucumberSchema, { envPath: `.env.${env}`, required: false }),
    ENVIRONMENT: loadEnvConfig(EnvironmentSchema, { envPath: `.env.${env}` })
  }
}

export const env = loadEnv();


