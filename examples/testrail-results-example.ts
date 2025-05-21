/**
 * Example demonstrating how to report test results to TestRail
 */
import { TestRailService, TestStatus } from '../services/testrail';
import { isTestRailEnabled, env } from '../config/env/env.testrail';
import TestRailUtils from '../services/testrail/utils';

/**
 * Example demonstrating how to report test results to TestRail
 */
async function testRailResultsExample() {
  // Check if TestRail is configured
  if (!isTestRailEnabled()) {
    console.log('TestRail integration is not configured. Please set the required environment variables.');
    return;
  }

  try {
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    console.log('Creating a new test run in TestRail...');
    
    // Create a new test run
    const run = await testrail.createRun(
      'API Test Results Example', 
      'Automated test run created from the example script'
    );
    
    console.log(`Created test run with ID: ${run.id}`);
    
    // Simulate running some tests
    const testResults = simulateTestExecution();
    
    console.log(`Reporting ${testResults.length} test results to TestRail...`);
    
    // Report test results in bulk
    const results = await testrail.addResults(testResults);
    
    console.log(`Successfully reported ${results.length} test results`);
    
    // Log a summary of the results
    const statusCount = results.reduce((counts, result) => {
      const statusName = getStatusName(result.status_id ?? 0);
      counts[statusName] = (counts[statusName] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    console.log('\nResults summary:');
    for (const [status, count] of Object.entries(statusCount)) {
      console.log(`${status}: ${count}`);
    }
    
    // Close the test run when finished
    // In a real scenario, you might want to keep the run open until all tests are executed
    console.log('\nClosing test run...');
    await testrail.closeRun();
    
    console.log('Test run closed successfully');
    console.log(`You can view the results at: ${env.TESTRAIL_HOST}/index.php?/runs/view/${run.id}`);
    
  } catch (error) {
    console.error('Error reporting test results:', error);
  }
}

/**
 * Simulate test execution and generate test results
 * In a real scenario, these would come from your test runner
 */
function simulateTestExecution() {
  // Simulated test cases (in a real scenario, these would be your actual test cases)
  const testCases = [
    { id: 12345, name: 'Login functionality', duration: 1500 },
    { id: 12346, name: 'Search functionality', duration: 2200 },
    { id: 12347, name: 'User profile update', duration: 1800 },
    { id: 12348, name: 'Logout functionality', duration: 950 },
    { id: 12349, name: 'Password reset', duration: 3100 }
  ];
  
  // Generate random test results
  return testCases.map(test => {
    // Simulate different test outcomes (80% pass rate)
    const statusId = Math.random() < 0.8 ? TestStatus.PASSED : TestStatus.FAILED;
    
    return {
      case_id: test.id,
      status_id: statusId,
      comment: statusId === TestStatus.PASSED
        ? `Test passed successfully in ${test.duration}ms`
        : 'Test failed due to unexpected condition',
      elapsed: TestRailUtils.formatElapsedTime(test.duration),
      // Add JIRA reference for failed tests
      defects: statusId === TestStatus.FAILED ? `JIRA-${Math.floor(1000 + Math.random() * 9000)}` : undefined
    };
  });
}

/**
 * Get human-readable status name from status ID
 */
function getStatusName(statusId: number): string {
  const statusMap: Record<number, string> = {
    [TestStatus.PASSED]: 'Passed',
    [TestStatus.BLOCKED]: 'Blocked',
    [TestStatus.UNTESTED]: 'Untested',
    [TestStatus.RETEST]: 'Retest',
    [TestStatus.FAILED]: 'Failed',
    [TestStatus.IN_PROGRESS]: 'In Progress',
    [TestStatus.SKIPPED]: 'Skipped'
  };
  
  return statusMap[statusId] || `Unknown Status (${statusId})`;
}

// Run the example
testRailResultsExample().catch(console.error);

