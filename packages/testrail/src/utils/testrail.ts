import API from '@dlenroc/testrail';
import { env } from '../env';

// TestRail status IDs
export const STATUS = {
  PASSED: 1,
  BLOCKED: 2,
  UNTESTED: 3,
  RETEST: 4,
  FAILED: 5,
  IN_PROGRESS: 6
};

// Initialize TestRail API
export const api = new API({
  host: env.TESTRAIL_HOST,
  username: env.TESTRAIL_USERNAME,
  password: env.TESTRAIL_PASSWORD
});

/**
 * Extract test case IDs from tags
 * @param tags Array of tags
 * @returns Array of TestRail case IDs
 */
export function extractTestCaseIds(tags: string[]): string[] {
  const caseIds: string[] = [];
  
  for (const tag of tags) {
    const match = tag.match(/@testrail:(C\d+|\d+)/);
    if (match && match[1]) {
      // Convert C12345 format to just numeric ID
      const caseId = match[1].toString().replace(/^C/i, '');
      caseIds.push(caseId);
    }
  }
  
  return caseIds;
}

/**
 * Extract suite ID from tags
 * @param tags Array of tags
 * @returns TestRail suite ID or undefined
 */
export function extractSuiteId(tags: string[]): string | undefined {
  for (const tag of tags) {
    const match = tag.match(/@testsuite:(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return undefined;
}

/**
 * Map test status to TestRail status ID
 * @param status Test status
 * @returns TestRail status ID
 */
export function mapStatusToTestRail(status: string): number {
  switch (status.toLowerCase()) {
    case 'passed':
      return STATUS.PASSED;
    case 'failed':
      return STATUS.FAILED;
    case 'skipped':
      return STATUS.UNTESTED;
    case 'blocked':
      return STATUS.BLOCKED;
    default:
      return STATUS.RETEST;
  }
}

/**
 * Format elapsed time for TestRail
 * @param durationMs Duration in milliseconds
 * @returns Formatted string for TestRail
 */
export function formatElapsedTime(durationMs: number): string {
  const seconds = Math.ceil(durationMs / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}
