/**
 * Basic example of exporting test cases from TestRail
 */
import { TestRailService, TestRailExporter, ExportFormat } from '../services/testrail';
import { isTestRailEnabled } from '../config/env/env.testrail';
import * as path from 'path';
import * as fs from 'fs';

/**
 * This example demonstrates basic test case export functionality:
 * 1. Exporting test cases by TestRail case IDs
 * 2. Saving exports in different formats (JSON, CSV, Markdown, HTML)
 */
async function testRailExportExample() {
  // Check if TestRail is configured
  if (!isTestRailEnabled()) {
    console.log('TestRail integration is not configured. Please set the required environment variables.');
    return;
  }

  try {
    console.log('Starting TestRail export example...');
    
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // Create TestRail exporter
    const exporter = new TestRailExporter(testrail);
    
    // Example 1: Export test cases by specific case IDs via tags
    console.log('\n=== Example 1: Export by specific case IDs ===');
    
    // List of tags containing TestRail case IDs
    const tags = [
      '@testrail:C12345',
      '@testrail:C12346',
      '@testrail:C12347'
    ];
    
    console.log('Exporting test cases with IDs:', tags);
    
    // Export test cases by tags
    const testCases = await exporter.exportTestCasesByTags(tags);
    
    console.log(`Found ${testCases.length} test cases`);
    
    if (testCases.length === 0) {
      console.log('No test cases found. This could be because:');
      console.log('1. The test case IDs do not exist in TestRail');
      console.log('2. You do not have access to these test cases');
      console.log('3. The TestRail configuration is incorrect');
      console.log('\nFor demo purposes, continuing with mock data...');
      
      // Create mock test cases for demonstration
      mockTestCases().forEach(tc => testCases.push(tc));
      console.log(`Created ${testCases.length} mock test cases for demonstration`);
    }
    
    // Example 2: Export test cases in different formats
    console.log('\n=== Example 2: Export in different formats ===');
    
    // Create export directory
    const exportDir = path.join(process.cwd(), 'exports', 'basic-example');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    // Export in JSON format
    console.log('Exporting as JSON...');
    await exporter.exportTestCasesToFile(
      testCases,
      path.join(exportDir, 'test-cases.json'),
      ExportFormat.JSON
    );
    
    // Export in CSV format
    console.log('Exporting as CSV...');
    await exporter.exportTestCasesToFile(
      testCases,
      path.join(exportDir, 'test-cases.csv'),
      ExportFormat.CSV
    );
    
    // Export in Markdown format
    console.log('Exporting as Markdown...');
    await exporter.exportTestCasesToFile(
      testCases,
      path.join(exportDir, 'test-cases.md'),
      ExportFormat.MARKDOWN
    );
    
    // Export in HTML format
    console.log('Exporting as HTML...');
    await exporter.exportTestCasesToFile(
      testCases,
      path.join(exportDir, 'test-cases.html'),
      ExportFormat.HTML
    );
    
    console.log(`All exports saved to: ${exportDir}`);
    
    // Display summary of exported cases
    console.log('\nTest Case Summary:');
    testCases.forEach(tc => {
      console.log(`- C${tc.id}: ${tc.title} (Suite: ${tc.suite_name}, Section: ${tc.section_name || 'None'})`);
    });
    
    console.log('\nTestRail export example completed successfully');
    
  } catch (error) {
    console.error('Error in TestRail export:', error);
  }
}

/**
 * Create mock test cases for demonstration when real test cases are not available
 */
function mockTestCases() {
  return [
    {
      id: 12345,
      title: 'Verify user login with valid credentials',
      section_id: 1,
      section_name: 'Authentication',
      suite_id: 1,
      suite_name: 'Functional Tests',
      priority_id: 3,
      type_id: 1,
      refs: 'JIRA-123',
      description: 'Test case to verify that users can login with valid credentials',
      preconditions: 'User account exists in the system',
      expected: 'User should be logged in and redirected to the dashboard',
      steps: [
        { content: 'Navigate to login page', expected: 'Login page is displayed' },
        { content: 'Enter valid username and password', expected: 'Credentials are accepted' },
        { content: 'Click on login button', expected: 'User is logged in successfully' }
      ],
      tags: ['@type:functional', '@feature:authentication', '@priority:high']
    },
    {
      id: 12346,
      title: 'Verify user login with invalid credentials',
      section_id: 1,
      section_name: 'Authentication',
      suite_id: 1,
      suite_name: 'Functional Tests',
      priority_id: 2,
      type_id: 1,
      refs: 'JIRA-124',
      description: 'Test case to verify that users cannot login with invalid credentials',
      preconditions: 'None',
      expected: 'User should see an error message',
      steps: [
        { content: 'Navigate to login page', expected: 'Login page is displayed' },
        { content: 'Enter invalid username and password', expected: 'Credentials are rejected' },
        { content: 'Click on login button', expected: 'Error message is displayed' }
      ],
      tags: ['@type:functional', '@feature:authentication', '@priority:medium']
    },
    {
      id: 12347,
      title: 'Verify password reset functionality',
      section_id: 2,
      section_name: 'Password Management',
      suite_id: 1,
      suite_name: 'Functional Tests',
      priority_id: 3,
      type_id: 1,
      refs: 'JIRA-125',
      description: 'Test case to verify that users can reset their password',
      preconditions: 'User account exists in the system',
      expected: 'User should receive a password reset email',
      steps: [
        { content: 'Navigate to login page', expected: 'Login page is displayed' },
        { content: 'Click on "Forgot Password" link', expected: 'Password reset page is displayed' },
        { content: 'Enter email address', expected: 'Email field accepts the input' },
        { content: 'Click on reset button', expected: 'Confirmation message is displayed' }
      ],
      tags: ['@type:functional', '@feature:password_reset', '@priority:high']
    }
  ];
}

// Run the example
testRailExportExample().catch(console.error);
