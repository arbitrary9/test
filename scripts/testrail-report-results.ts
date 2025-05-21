#!/usr/bin/env ts-node
/**
 * Script to report Cucumber test results to TestRail
 * 
 * Usage: 
 *   npm run testrail:report -- --results ./allure-results/cucumber-results.json
 */
import { TestRailService, TestStatus, TestResult } from '@services/testrail';

import TestRailUtils from '../services/testrail/utils';
import * as fs from 'fs';
import * as path from 'path';
import {env} from "@config/env";

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

// Get results file from arguments
const resultsFile = options.results || path.join(process.cwd(), 'allure-results', 'cucumber-results.json');
const runIdFile = options.runIdFile || path.join(process.cwd(), '.testrail', 'current-run.json');
const closeRun = options.closeRun === 'true';

// Check if TestRail is configured
if (!env.TESTRAIL) {
  console.error('TestRail integration is not configured. Please set the required environment variables.');
  process.exit(1);
}

/**
 * Process Cucumber results and report to TestRail
 */
async function reportResultsToTestRail() {
  try {
    console.log('Reporting test results to TestRail...');
    
    // Check if results file exists
    if (!fs.existsSync(resultsFile)) {
      console.error(`Results file not found: ${resultsFile}`);
      process.exit(1);
    }
    
    // Read and parse Cucumber results
    const cucumberResultsJson = fs.readFileSync(resultsFile, 'utf8');
    const cucumberResults = JSON.parse(cucumberResultsJson);
    
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // Get run ID from file or environment variable
    let runId: number;
    
    if (process.env.TESTRAIL_RUN_ID) {
      runId = parseInt(process.env.TESTRAIL_RUN_ID, 10);
    } else if (fs.existsSync(runIdFile)) {
      const runInfo = JSON.parse(fs.readFileSync(runIdFile, 'utf8'));
      runId = runInfo.id;
    } else {
      console.error('No TestRail run ID found. Please create a run first using testrail-create-run script.');
      process.exit(1);
    }
    
    console.log(`Using TestRail run ID: ${runId}`);
    testrail.setRunId(runId);
    
    // Process Cucumber results
    const testRailResults = processResults(cucumberResults);
    
    console.log(`Reporting ${testRailResults.length} results to TestRail...`);
    
    // Report results in batches of 50 to avoid overwhelming the API
    const batchSize = 50;
    for (let i = 0; i < testRailResults.length; i += batchSize) {
      const batch = testRailResults.slice(i, i + batchSize);
      await testrail.addResults(batch);
      console.log(`Reported batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(testRailResults.length / batchSize)}`);
    }
    
    console.log(`Successfully reported ${testRailResults.length} results to TestRail`);
    
    // Close the run if requested
    if (closeRun) {
      console.log('Closing TestRail run...');
      await testrail.closeRun();
      console.log('TestRail run closed successfully');
    }
    
  } catch (error) {
    console.error('Error reporting to TestRail:', error);
    process.exit(1);
  }
}

/**
 * Process Cucumber results and convert to TestRail format
 */
function processResults(cucumberResults: any): TestResult[] {
  const testRailResults: TestResult[] = [];
  
  // Process each feature
  for (const feature of cucumberResults) {
    // Process each scenario in the feature
    for (const element of feature.elements) {
      // Skip if not a scenario
      if (element.type !== 'scenario') continue;
      
      // Extract tags from feature and scenario
      const featureTags = feature.tags?.map((tag: any) => tag.name) || [];
      const scenarioTags = element.tags?.map((tag: any) => tag.name) || [];
      const allTags = [...featureTags, ...scenarioTags];
      
      // Look for TestRail case ID tag
      const testRailTag = allTags.find((tag: string) => tag.match(/@testrail:C?\d+/i));
      if (!testRailTag) continue;
      
      const caseId = TestRailUtils.extractCaseId(testRailTag);
      if (!caseId) {
        console.warn(`Invalid TestRail tag format: ${testRailTag}`);
        continue;
      }
      
      // Calculate scenario status
      const status = calculateCucumberStatus(element);
      
      // Calculate duration
      const duration = calculateScenarioDuration(element);
      const elapsed = duration ? TestRailUtils.formatElapsedTime(duration) : undefined;
      
      // Build detailed comment
      const comment = buildDetailedComment(feature, element);
      
      // Add to results
      testRailResults.push({
        case_id: caseId,
        status_id: mapCucumberStatusToTestRail(status),
        comment,
        elapsed
      });
    }
  }
  
  return testRailResults;
}

/**
 * Calculate scenario status based on all steps
 */
function calculateCucumberStatus(scenario: any): string {
  if (!scenario.steps || scenario.steps.length === 0) {
    return 'undefined';
  }
  
  const statuses = scenario.steps.map((step: any) => step.result?.status);
  
  if (statuses.includes('failed')) return 'failed';
  if (statuses.includes('undefined') || statuses.includes('pending')) return 'pending';
  if (statuses.includes('skipped') && !statuses.includes('passed')) return 'skipped';
  if (statuses.every((s: string) => s === 'passed')) return 'passed';
  
  return 'unknown';
}

/**
 * Calculate total scenario duration
 */
function calculateScenarioDuration(scenario: any): number {
  if (!scenario.steps || scenario.steps.length === 0) {
    return 0;
  }
  
  return scenario.steps.reduce((total: number, step: any) => {
    return total + (step.result?.duration || 0);
  }, 0) / 1000000; // Convert from nanoseconds to milliseconds
}

/**
 * Build detailed comment for TestRail
 */
function buildDetailedComment(feature: any, scenario: any): string {
  let comment = `Feature: ${feature.name}\n`;
  comment += `Scenario: ${scenario.name}\n\n`;
  
  comment += `Steps:\n`;
  for (const step of scenario.steps) {
    const status = step.result?.status || 'unknown';
    comment += `- ${step.keyword}${step.name} (${status})\n`;
    
    // Add error message for failed steps
    if (status === 'failed' && step.result?.error_message) {
      // Format and truncate error message
      const errorLines = step.result.error_message.split('\n');
      const formattedError = errorLines.slice(0, 5).join('\n  ');
      comment += `  Error: ${formattedError}${errorLines.length > 5 ? '\n  ...' : ''}\n`;
    }
    
    // Add data table if present
    if (step.rows && step.rows.length > 0) {
      comment += `  Data Table:\n`;
      for (const row of step.rows) {
        comment += `    | ${row.cells.join(' | ')} |\n`;
      }
    }
  }
  
  return comment;
}

/**
 * Map Cucumber status to TestRail status
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

// Run the function if this script is executed directly
if (require.main === module) {
  reportResultsToTestRail().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default reportResultsToTestRail;
