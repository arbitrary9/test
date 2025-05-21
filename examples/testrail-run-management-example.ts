/**
 * Example demonstrating test run management in TestRail
 */
import { TestRailService } from '../services/testrail';
import { isTestRailEnabled } from '../config/env/env.testrail';

/**
 * This example demonstrates:
 * 1. Creating a test run with specific test cases
 * 2. Creating a test run with all test cases from a suite
 * 3. Using an existing test run by ID
 * 4. Closing test runs
 */
async function testRailRunManagementExample() {
  // Check if TestRail is configured
  if (!isTestRailEnabled()) {
    console.log('TestRail integration is not configured. Please set the required environment variables.');
    return;
  }

  try {
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // EXAMPLE 1: Create a test run with specific test cases
    console.log('\n=== Example 1: Creating a run with specific test cases ===');
    
    // Specific test case IDs to include in the run
    const specificCaseIds = [12345, 12346, 12347];
    
    console.log(`Creating test run with ${specificCaseIds.length} specific test cases...`);
    
    const specificRun = await testrail.createRun(
      'Specific Test Cases Run',
      'Run with specific test cases selected',
      specificCaseIds
    );
    
    console.log(`Created run with ID: ${specificRun.id}`);
    console.log(`Run includes ${specificRun.case_ids && Array.isArray(specificRun.case_ids) ? specificRun.case_ids.length : 0} test cases`);
    
    // Close this run
    await testrail.closeRun();
    console.log('Closed run with specific test cases');
    
    // EXAMPLE 2: Create a test run with all test cases from a suite
    console.log('\n=== Example 2: Creating a run with all test cases ===');
    
    // Create a run with all test cases in the default suite
    const fullRun = await testrail.createRun(
      'Full Suite Run',
      'Run with all test cases in the suite'
    );
    
    console.log(`Created full run with ID: ${fullRun.id}`);
    console.log(`Run includes ${fullRun.case_ids && Array.isArray(fullRun.case_ids) ? fullRun.case_ids.length : 0} test cases`);
    
    // Close this run
    await testrail.closeRun();
    console.log('Closed full suite run');
    
    // EXAMPLE 3: Using an existing test run by ID
    console.log('\n=== Example 3: Using an existing test run by ID ===');
    
    // Create a new run to demonstrate using an existing run
    const existingRun = await testrail.createRun(
      'Existing Run Example',
      'This run will be used as an existing run'
    );
    
    // Store the run ID
    const existingRunId = existingRun.id;
    console.log(`Created a run with ID: ${existingRunId} to use as existing run`);
    
    // Create a new TestRail service instance (simulating a different session)
    const anotherService = new TestRailService();
    
    // Set the existing run ID
    anotherService.setRunId(existingRunId);
    console.log(`Set existing run ID: ${anotherService.getRunId()}`);
    
    // Now you can add results to this existing run
    console.log('Now can add results to this existing run...');
    
    // Close the run
    await anotherService.closeRun();
    console.log('Closed the existing run');

    console.log('\nRun management example completed successfully');
    
  } catch (error) {
    console.error('Error in test run management:', error);
  }
}

// Run the example
testRailRunManagementExample().catch(console.error);
