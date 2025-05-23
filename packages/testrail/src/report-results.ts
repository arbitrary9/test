import * as fs from 'fs';
import { glob } from 'glob';
import API from '@dlenroc/testrail';

// Load environment variables
const TESTRAIL_HOST = process.env.TESTRAIL_HOST || '';
const TESTRAIL_USERNAME = process.env.TESTRAIL_USERNAME || '';
const TESTRAIL_PASSWORD = process.env.TESTRAIL_PASSWORD || '';
const TESTRAIL_PROJECT_ID = process.env.TESTRAIL_PROJECT_ID || '';
const TESTRAIL_RUN_ID = process.env.TESTRAIL_RUN_ID || '';

// TestRail status IDs
const STATUS = {
  PASSED: 1,
  BLOCKED: 2,
  UNTESTED: 3,
  RETEST: 4,
  FAILED: 5,
  IN_PROGRESS: 6
};

// Initialize TestRail API
const api = new API({
  host: TESTRAIL_HOST,
  username: TESTRAIL_USERNAME,
  password: TESTRAIL_PASSWORD
});

/**
 * Extract test case IDs from tags
 */
function extractTestCaseIds(tags: string[]): string[] {
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
 * Report test results to TestRail
 */
async function reportResults() {
  console.log('Starting TestRail reporting...');
  
  if (!TESTRAIL_HOST || !TESTRAIL_USERNAME || !TESTRAIL_PASSWORD) {
    console.error('TestRail credentials are not set. Please check your environment variables.');
    process.exit(1);
  }
  
  if (!TESTRAIL_RUN_ID) {
    console.error('TestRail run ID is not set. Please set TESTRAIL_RUN_ID environment variable.');
    process.exit(1);
  }
  
  try {
    // Find all Allure result files
    const files = await glob('../test-framework/allure-results/*.json');
    
    if (files.length === 0) {
      console.warn('No test result files found. Make sure tests have been run.');
      return;
    }
    
    const results: any[] = [];
    
    // Process each result file
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const testResult = JSON.parse(content);
      
      // Skip if no labels (which contain tags)
      if (!testResult.labels) continue;
      
      // Extract tags from labels
      const tags = testResult.labels
        .filter((label: any) => label.name === 'tag')
        .map((label: any) => label.value);
      
      // Extract TestRail case IDs
      const caseIds = extractTestCaseIds(tags);
      
      if (caseIds.length === 0) continue;
      
      // Determine test status
      let status_id = STATUS.PASSED;
      if (testResult.status === 'failed') {
        status_id = STATUS.FAILED;
      } else if (testResult.status === 'skipped') {
        status_id = STATUS.UNTESTED;
      }
      
      // Add results for each case ID
      for (const case_id of caseIds) {
        results.push({
          case_id: parseInt(case_id),
          status_id,
          comment: testResult.statusDetails?.message || `Test ${testResult.status}`,
          elapsed: `${Math.ceil(testResult.time.duration / 1000)}s`
        });
      }
    }
    
    if (results.length === 0) {
      console.log('No TestRail test cases found in results.');
      return;
    }
    
    console.log(`Reporting ${results.length} results to TestRail run ID ${TESTRAIL_RUN_ID}`);
    
    // Send results to TestRail
    await api.addResultsForCases(parseInt(TESTRAIL_RUN_ID), { results });
    
    console.log('Results reported successfully to TestRail.');
  } catch (error) {
    console.error('Error reporting results to TestRail:', error);
    process.exit(1);
  }
}

// Run the script
reportResults();
