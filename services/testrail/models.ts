import { Case, Suite, Section } from "@dlenroc/testrail";

/**
 * TestRail test status values
 */
export enum TestStatus {
  PASSED = 1,
  BLOCKED = 2,
  UNTESTED = 3,
  RETEST = 4,
  FAILED = 5,
  IN_PROGRESS = 6,
  SKIPPED = 7
}

/**
 * Interface for TestRail test case result
 */
export interface TestResult {
  case_id: number;
  status_id: TestStatus;
  comment?: string;
  elapsed?: string; // Format: e.g. "30s" or "2m 30s"
  defects?: string;
  version?: string;
}

/**
 * Interface for exported test case information
 */
export interface TestCaseExport {
  id: number;
  title: string;
  section_id: number;
  section_name?: string;
  suite_id: number;
  suite_name?: string;
  priority_id?: number;
  type_id?: number;
  refs?: string;
  description?: string;
  preconditions?: string;
  expected?: string;
  steps?: Array<{content: string, expected: string}>;
  custom_fields?: Record<string, any>;
  tags?: string[];
}

/**
 * Cache storage for API data to reduce requests
 */
export interface TestRailCache {
  suites: Map<number, Suite>;
  sections: Map<number, Section[]>;
  cases: Map<number, Case[]>;
}
