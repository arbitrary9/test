import API from "@dlenroc/testrail";
import type { Case, Result, Run, Status, Suite, Section } from "@dlenroc/testrail";
import { env } from "@config/env";
import { TestResult, TestStatus, TestRailCache } from "./models";
import TestRailUtils from "./utils";

/**
 * Service for TestRail API interactions
 */
export class TestRailService {
  private api: API;
  private projectId: string;
  private suiteId?: string;
  private runId?: number;
  private runName?: string;
  private cache: TestRailCache = {
    suites: new Map(),
    sections: new Map(),
    cases: new Map()
  };

  /**
   * TestRail service constructor
   */
  constructor() {
    this.api = new API({
      host: env.TESTRAIL!.TESTRAIL_HOST,
      username: env.TESTRAIL!.TESTRAIL_USERNAME,
      password: env.TESTRAIL!.TESTRAIL_PASSWORD
    });

    this.projectId = env.TESTRAIL!.TESTRAIL_PROJECT_ID;
    this.suiteId = env.TESTRAIL!.TESTRAIL_SUITE_ID;
    this.runName = env.TESTRAIL!.TESTRAIL_RUN_NAME;
  }

  /**
   * Get the current test run ID
   */
  public getRunId(): number | undefined {
    return this.runId;
  }

  /**
   * Set an existing test run ID
   * @param id The TestRail test run ID
   */
  public setRunId(id: number): void {
    this.runId = id;
  }

  /**
   * Get the TestRail API instance
   * For use by other related services
   */
  public getApi(): API {
    return this.api;
  }

  /**
   * Get the project ID
   */
  public getProjectId(): string {
    return this.projectId;
  }

  /**
   * Get the default suite ID if any
   */
  public getDefaultSuiteId(): string | undefined {
    return this.suiteId;
  }

  /**
   * Get the cache instance
   */
  public getCache(): TestRailCache {
    return this.cache;
  }

  /**
   * Get all suites for the project
   */
  public async getSuites(): Promise<Suite[]> {
    return await this.api.getSuites(parseInt(this.projectId, 10));
  }

  /**
   * Get a specific suite by ID
   */
  public async getSuite(suiteId: number): Promise<Suite> {
    if (this.cache.suites.has(suiteId)) {
      return this.cache.suites.get(suiteId)!;
    }
    
    const suite = await this.api.getSuite(suiteId);
    this.cache.suites.set(suiteId, suite);
    return suite;
  }

  /**
   * Get all sections for a suite
   */
  public async getSections(suiteId: number): Promise<Section[]> {
    if (this.cache.sections.has(suiteId)) {
      return this.cache.sections.get(suiteId)!;
    }
    
    const sections = await this.api.getSections(parseInt(this.projectId, 10), { suite_id: suiteId });
    this.cache.sections.set(suiteId, sections);
    return sections;
  }

  /**
   * Get all test cases for a specific suite
   */
  public async getCasesBySuite(suiteId: number): Promise<Case[]> {
    if (this.cache.cases.has(suiteId)) {
      return this.cache.cases.get(suiteId)!;
    }
    
    const cases = await this.api.getCases(parseInt(this.projectId, 10), { suite_id: suiteId });
    this.cache.cases.set(suiteId, cases);
    return cases;
  }

  /**
   * Create a new test run in TestRail
   * @param name Name of the test run
   * @param description Optional description
   * @param caseIds Optional list of test case IDs to include
   * @returns The created test run object
   */
  public async createRun(name?: string, description?: string, caseIds?: number[]): Promise<Run> {
    const runName = name || this.runName || `Automated Test Run - ${new Date().toISOString()}`;
    
    const run = await this.api.addRun(parseInt(this.projectId, 10), {
      name: runName,
      description: description || "Automated test run created by the test framework",
      suite_id: this.suiteId ? parseInt(this.suiteId, 10) : undefined,
      include_all: caseIds ? false : true,
      case_ids: caseIds
    });
    
    this.runId = run.id;
    return run;
  }

  /**
   * Close a test run in TestRail
   * @param runId Optional run ID (uses the current run ID if not specified)
   * @returns The closed run
   */
  public async closeRun(runId?: number): Promise<Run> {
    const id = runId || this.runId;
    if (!id) {
      throw new Error("No test run ID specified or set");
    }
    
    return await this.api.closeRun(id);
  }

  /**
   * Get details about a test case
   * @param caseId The test case ID
   * @returns The test case details
   */
  public async getCase(caseId: number): Promise<Case> {
    return await this.api.getCase(caseId);
  }

  /**
   * Add a test result for a test case in the current run
   * @param result The test result to add
   * @returns The added result
   */
  public async addResult(result: TestResult): Promise<Result> {
    if (!this.runId) {
      throw new Error("No test run ID set. Create or set a run first.");
    }
    
    return await this.api.addResultForCase(this.runId, result.case_id, {
      status_id: result.status_id,
      comment: result.comment,
      elapsed: result.elapsed,
      defects: result.defects,
      version: result.version
    });
  }

  /**
   * Add multiple test results in bulk
   * @param results Array of test results
   * @returns The added results
   */
  public async addResults(results: TestResult[]): Promise<Result[]> {
    if (!this.runId) {
      throw new Error("No test run ID set. Create or set a run first.");
    }
    
    const formattedResults = results.map(r => ({
      case_id: r.case_id,
      status_id: r.status_id,
      comment: r.comment,
      elapsed: r.elapsed,
      defects: r.defects,
      version: r.version
    }));
    
    return await this.api.addResults(this.runId, { results: formattedResults });
  }
}
