#!/usr/bin/env ts-node
/**
 * Script to run Cucumber tests with TestRail integration
 * 
 * This script:
 * 1. Creates a TestRail run
 * 2. Executes Cucumber tests
 * 3. Reports results to TestRail
 * 
 * Usage:
 *   npm run test:testrail -- --name "Run Name" --tags "@smoke" --closeRun true
 */
import { spawn } from 'child_process';
import * as path from 'path';
import createTestRailRun from './testrail-create-run';
import reportResultsToTestRail from './testrail-report-results';

// Parse command line arguments
const args = process.argv.slice(2);
const options: Record<string, string> = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      options[key] = args[i + 1];
      i++;
    } else {
      options[key] = 'true';
    }
  }
}

// Get options with defaults
const runName = options.name || `Test Run - ${new Date().toISOString()}`;
const runDescription = options.description || 'Created by automated test script';
const tags = options.tags || '';
const profile = options.profile || 'default';
const closeRun = options.closeRun === 'true';
const outputFormat = options.format || 'json:allure-results/cucumber-results.json';

/**
 * Run the full test process
 */
async function runCucumberWithTestRail() {
  try {
    console.log('Starting Cucumber tests with TestRail integration...');
    
    // Step 1: Create TestRail run
    console.log('\n=== Step 1: Creating TestRail run ===');
    const runId = await createTestRailRun();
    process.env.TESTRAIL_RUN_ID = String(runId);
    
    // Step The 2: Run Cucumber tests
    console.log('\n=== Step 2: Running Cucumber tests ===');
    await runCucumberTests();
    
    // Step 3: Report results to TestRail
    console.log('\n=== Step 3: Reporting results to TestRail ===');
    await reportResultsToTestRail();
    
    console.log('\nCucumber tests with TestRail integration completed successfully!');
  } catch (error) {
    console.error('Error in test execution:', error);
    process.exit(1);
  }
}

/**
 * Run Cucumber tests
 */
async function runCucumberTests(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Running Cucumber with tags: ${tags || '(no tags)'}, profile: ${profile}`);
    
    // Build cucumber command arguments
    const cucumberArgs = [
      '--profile', profile
    ];
    
    // Add tags if specified
    if (tags) {
      cucumberArgs.push('--tags', tags);
    }
    
    // Add format for TestRail reporting
    cucumberArgs.push('--format', outputFormat);
    
    // Run cucumber-js
    const cucumber = spawn(
      'npx', 
      ['cucumber-js', ...cucumberArgs], 
      { 
        stdio: 'inherit',
        shell: true
      }
    );
    
    cucumber.on('close', (code) => {
      if (code !== 0) {
        console.warn(`Cucumber process exited with code ${code}`);
      }
      
      // We continue even if tests failed, to report the failures to TestRail
      resolve();
    });
    
    cucumber.on('error', (error) => {
      reject(error);
    });
  });
}

// Run the function if this script is executed directly
if (require.main === module) {
  runCucumberWithTestRail().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
