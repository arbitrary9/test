import { loadEnvConfig } from './env/env.base';
import { TestRailSchema, CucumberSchema, EnvironmentSchema, Env } from './env/env.schemas';
import * as process from "node:process";

const load = {
  test: () : Env => ({
    TESTRAIL: loadEnvConfig(TestRailSchema, { envPath: '.env.test', required: false }),
    CUCUMBER: loadEnvConfig(CucumberSchema, { envPath: '.env.test', required: false }),
    ENVIRONMENT: loadEnvConfig(EnvironmentSchema, { envPath: '.env.test' })
  }),
  ci: (): Env => ({
    TESTRAIL: loadEnvConfig(TestRailSchema, { envPath: '.env.ci' }),
    CUCUMBER: loadEnvConfig(CucumberSchema, { envPath: '.env.ci' }),
    ENVIRONMENT: loadEnvConfig(EnvironmentSchema, { envPath: '.env.ci' })
  }),
  local: (): Env => ({
    TESTRAIL: loadEnvConfig(TestRailSchema, { envPath: '.env.local', required: false }),
    CUCUMBER: loadEnvConfig(CucumberSchema, { envPath: '.env.local', required: false }),
    ENVIRONMENT: loadEnvConfig(EnvironmentSchema, { envPath: '.env.local' })
  })
};

function loadEnv(): Env {
  if(process.env.ENV === 'test') {
    return load.test();
  } else if(process.env.ENV === 'ci') {
    return load.ci();
  } else {
    return load.local();
  }
}

export const env = loadEnv();


