#!/usr/bin/env ts-node
/**
 * Script to create a new TestRail run before test execution
 * 
 * Usage: 
 *   npm run testrail:create-run -- --name "Run Name" --description "Run Description"
 */
import { TestRailService } from '@services/testrail';
import {env} from "@config/env"
import * as fs from 'fs';
import * as path from 'path';

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

// Get run name and description from arguments or defaults
const runName = options.name || `Automated Test Run - ${new Date().toISOString()}`;
const runDescription = options.description || 'Created by automated test script';
const includeAll = options.includeAll === 'true';
const caseIds = options.caseIds ? options.caseIds.split(',').map(id => parseInt(id.trim(), 10)) : undefined;

// Check if TestRail is configured
if (!env.TESTRAIL) {
  console.error('TestRail integration is not configured. Please set the required environment variables.');
  process.exit(1);
}

/**
 * Create a new TestRail run and save the run ID for later use
 */
async function createTestRailRun() {
  try {
    console.log('Creating new TestRail run...');
    
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // Create a new test run
    const run = await testrail.createRun(
      runName,
      runDescription,
      caseIds
    );
    
    console.log(`Created TestRail run with ID: ${run.id}`);
    
    // Save run ID to a file for later use by other scripts
    const dataDir = path.join(process.cwd(), '.testrail');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(dataDir, 'current-run.json'),
      JSON.stringify({ 
        id: run.id, 
        name: run.name, 
        description: run.description,
        created_on: new Date().toISOString()
      }, null, 2)
    );
    
    console.log(`TestRail run ID saved to .testrail/current-run.json`);
    
    // Also set this as an environment variable for child processes
    process.env.TESTRAIL_RUN_ID = String(run.id);
    
    return run.id;
  } catch (error) {
    console.error('Error creating TestRail run:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createTestRailRun().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default createTestRailRun;
