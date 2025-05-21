/**
 * Example demonstrating how to integrate CucumberJS with TestRail
 * 
 * This shows how to:
 * 1. Link Cucumber scenarios with TestRail test cases via tags
 * 2. Report CucumberJS test results to TestRail
 * 3. Map Cucumber scenario outcomes to TestRail statuses
 */
import { TestRailService, TestStatus, TestResult } from '../services/testrail';
import { isTestRailEnabled } from '../config/env/env.testrail';
import TestRailUtils from '../services/testrail/utils';

/**
 * Example showing how to integrate CucumberJS with TestRail
 */
async function cucumberJsIntegrationExample() {
  // Check if TestRail is configured
  if (!isTestRailEnabled()) {
    console.log('TestRail integration is not configured. Please set the required environment variables.');
    return;
  }

  try {
    console.log('Starting CucumberJS TestRail integration example...');
    
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // Create a new test run for the Cucumber scenarios
    const run = await testrail.createRun(
      'CucumberJS Integration Test Run',
      'Test run from CucumberJS integration example'
    );
    
    console.log(`Created test run with ID: ${run.id}`);
    
    // Simulated Cucumber scenario results
    // In a real project, these would come from Cucumber's JSON formatter output
    const cucumberResults = simulateCucumberResults();
    
    console.log(`Processing ${cucumberResults.length} Cucumber scenario results...`);
    
    // Convert Cucumber results to TestRail results
    const testRailResults = mapCucumberResultsToTestRail(cucumberResults);
    
    console.log(`Mapped ${testRailResults.length} results for TestRail`);
    
    // Submit results to TestRail
    if (testRailResults.length > 0) {
      const results = await testrail.addResults(testRailResults);
      console.log(`Successfully reported ${results.length} test results to TestRail`);
    } else {
      console.log('No TestRail test case IDs found in Cucumber scenarios');
    }
    
    // Close the test run
    await testrail.closeRun();
    console.log('Test run closed successfully');
    
    console.log('\nCucumberJS integration example completed successfully');
    
  } catch (error) {
    console.error('Error in CucumberJS integration:', error);
  }
}

/**
 * Simulate Cucumber scenario execution results
 * In a real project, these would come from your Cucumber JSON output
 */
function simulateCucumberResults() {
  return [
    {
      name: 'User can log in with valid credentials',
      tags: ['@login', '@smoke', '@testrail:C12345'],
      status: 'passed',
      duration: 3500,  // in milliseconds
      steps: [
        { text: 'Given I am on the login page', status: 'passed' },
        { text: 'When I enter valid credentials', status: 'passed' },
        { text: 'And I click the login button', status: 'passed' },
        { text: 'Then I should be logged in', status: 'passed' }
      ]
    },
    {
      name: 'User cannot log in with invalid credentials',
      tags: ['@login', '@negative', '@testrail:C12346'],
      status: 'passed',
      duration: 2800,  // in milliseconds
      steps: [
        { text: 'Given I am on the login page', status: 'passed' },
        { text: 'When I enter invalid credentials', status: 'passed' },
        { text: 'And I click the login button', status: 'passed' },
        { text: 'Then I should see an error message', status: 'passed' }
      ]
    },
    {
      name: 'User can search for products',
      tags: ['@search', '@regression', '@testrail:C12347'],
      status: 'failed',
      duration: 4200,  // in milliseconds
      steps: [
        { text: 'Given I am on the home page', status: 'passed' },
        { text: 'When I search for "test product"', status: 'passed' },
        { text: 'Then I should see search results', status: 'failed', error: 'Expected 5 results but found 0' }
      ]
    },
    {
      name: 'User can view product details',
      tags: ['@product', '@regression'],  // No TestRail tag
      status: 'passed',
      duration: 3100,  // in milliseconds
      steps: [
        { text: 'Given I am on the product listing page', status: 'passed' },
        { text: 'When I click on a product', status: 'passed' },
        { text: 'Then I should see the product details', status: 'passed' }
      ]
    },
    {
      name: 'User can add product to cart',
      tags: ['@cart', '@smoke', '@testrail:C12348'],
      status: 'skipped',
      duration: 0,  // skipped scenarios have no duration
      steps: [
        { text: 'Given I am on the product page', status: 'skipped' },
        { text: 'When I click add to cart', status: 'skipped' },
        { text: 'Then the product should be in my cart', status: 'skipped' }
      ]
    }
  ];
}

/**
 * Map Cucumber scenario results to TestRail test results
 */
function mapCucumberResultsToTestRail(cucumberResults: any[]): TestResult[] {
  const testRailResults: TestResult[] = [];
  
  for (const scenario of cucumberResults) {
    // Extract TestRail case ID from tags
    const testRailTag = scenario.tags.find((tag: string) => tag.match(/@testrail:C?\d+/i));
    if (!testRailTag) {
      continue;  // Skip scenarios without a TestRail tag
    }
    
    const caseId = TestRailUtils.extractCaseId(testRailTag);
    if (!caseId) {
      console.warn(`Invalid TestRail tag format: ${testRailTag}`);
      continue;
    }
    
    // Map Cucumber status to TestRail status
    const statusId = mapCucumberStatusToTestRail(scenario.status);
    
    // Format elapsed time
    const elapsed = scenario.duration ? TestRailUtils.formatElapsedTime(scenario.duration) : undefined;
    
    // Build comment with step details
    let comment = `Cucumber Scenario: ${scenario.name}\n\n`;
    if (scenario.steps && scenario.steps.length > 0) {
      comment += `Steps:\n`;
      for (const step of scenario.steps) {
        comment += `- ${step.text} (${step.status})\n`;
        if (step.error) {
          comment += `  Error: ${step.error}\n`;
        }
      }
    }
    
    // Add to results
    testRailResults.push({
      case_id: caseId,
      status_id: statusId,
      comment,
      elapsed
    });
  }
  
  return testRailResults;
}

/**
 * Map Cucumber scenario status to TestRail status ID
 */
function mapCucumberStatusToTestRail(cucumberStatus: string): TestStatus {
  switch (cucumberStatus.toLowerCase()) {
    case 'passed':
      return TestStatus.PASSED;
    case 'failed':
      return TestStatus.FAILED;
    case 'skipped':
    case 'undefined':
      return TestStatus.SKIPPED;
    case 'pending':
      return TestStatus.BLOCKED;
    default:
      return TestStatus.UNTESTED;
  }
}

// Run the example
cucumberJsIntegrationExample().catch(console.error);
