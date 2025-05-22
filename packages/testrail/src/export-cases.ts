import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { env } from './env';
import { api } from './utils/testrail';

/**
 * Export test cases from TestRail
 */
async function exportTestCases() {
  console.log('Exporting test cases from TestRail...');
  
  if (!env.TESTRAIL_PROJECT_ID) {
    console.error('TestRail project ID is not set. Please set TESTRAIL_PROJECT_ID environment variable.');
    process.exit(1);
  }
  
  try {
    // Get all suites for the project
    const suites = await api.getSuites(parseInt(env.TESTRAIL_PROJECT_ID));
    
    if (suites.length === 0) {
      console.log('No test suites found for the project.');
      return;
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.resolve('testrail-export');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Process each suite
    for (const suite of suites) {
      console.log(`Processing suite: ${suite.name} (ID: ${suite.id})`);
      
      // Get all cases for the suite
      const cases = await api.getCases(parseInt(env.TESTRAIL_PROJECT_ID), { suite_id: suite.id });
      
      if (cases.length === 0) {
        console.log(`No test cases found for suite ${suite.name}.`);
        continue;
      }
      
      // Format cases data
      const casesData = cases.map(c => ({
        id: c.id,
        title: c.title,
        section: c.section_id,
        priority: c.priority_id,
        type: c.type_id,
        steps: c.custom_steps,
        expected: c.custom_expected,
        preconds: c.custom_preconds,
        refs: c.refs,
        automation_status: c.custom_automation_status
      }));
      
      // Write to file
      const fileName = `${suite.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cases.json`;
      fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(casesData, null, 2));
      
      console.log(`Exported ${cases.length} cases for suite ${suite.name} to ${fileName}`);
    }
    
    console.log('Test case export completed successfully.');
  } catch (error) {
    console.error('Error exporting test cases from TestRail:', error);
    process.exit(1);
  }
}

// Run the script
exportTestCases();
