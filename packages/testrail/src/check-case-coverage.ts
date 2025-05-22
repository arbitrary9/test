import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { env } from './env';
import { api } from './utils/testrail';

/**
 * Check test case coverage between TestRail and automation
 */
async function checkCaseCoverage() {
  console.log('Checking test case coverage...');
  
  if (!env.TESTRAIL_PROJECT_ID) {
    console.error('TestRail project ID is not set. Please set TESTRAIL_PROJECT_ID environment variable.');
    process.exit(1);
  }
  
  try {
    // Get all feature files
    const featureFiles = await glob('../test-framework/src/tests/features/**/*.feature');
    
    if (featureFiles.length === 0) {
      console.warn('No feature files found. Make sure the path is correct.');
      return;
    }
    
    // Set to store all referenced TestRail case IDs
    const referencedCaseIds = new Set<string>();
    
    // Extract TestRail case IDs from feature files
    for (const file of featureFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const matches = line.match(/@testrail:(C\d+|\d+)/g);
        if (matches) {
          for (const match of matches) {
            const caseId = match.replace('@testrail:', '').replace(/^C/i, '');
            referencedCaseIds.add(caseId);
          }
        }
      }
    }
    
    console.log(`Found ${referencedCaseIds.size} referenced TestRail case IDs in feature files.`);
    
    // Get all automation-ready cases from TestRail
    const projectId = parseInt(env.TESTRAIL_PROJECT_ID);
    let automationReadyCases: any[] = [];
    
    // Get all suites for the project
    const suites = await api.getSuites(projectId);
    
    for (const suite of suites) {
      // Get cases marked for automation (customize this filter based on your TestRail configuration)
      const cases = await api.getCases(projectId, { 
        suite_id: suite.id,
        // Filter by automation status (1 might be "Ready for Automation" in your instance)
        // custom_automation_status: 1
      });
      
      automationReadyCases = [...automationReadyCases, ...cases];
    }
    
    console.log(`Found ${automationReadyCases.length} cases in TestRail that should be automated.`);
    
    // Convert to sets for easier comparison
    const testrailCaseIds = new Set(automationReadyCases.map(c => c.id.toString()));
    
    // Find missing coverage
    const notAutomated = [...testrailCaseIds].filter(id => !referencedCaseIds.has(id));
    const notInTestrail = [...referencedCaseIds].filter(id => !testrailCaseIds.has(id));
    
    console.log(`\nCoverage Summary:`);
    console.log(`- Total cases in TestRail: ${testrailCaseIds.size}`);
    console.log(`- Total automated cases: ${referencedCaseIds.size}`);
    console.log(`- Coverage percentage: ${Math.round((referencedCaseIds.size / testrailCaseIds.size) * 100)}%`);
    
    if (notAutomated.length > 0) {
      console.log(`\nCases in TestRail not yet automated (${notAutomated.length}):`);
      for (const id of notAutomated) {
        const caseInfo = automationReadyCases.find(c => c.id.toString() === id);
        console.log(`- C${id}: ${caseInfo?.title || 'Unknown'}`);
      }
    }
    
    if (notInTestrail.length > 0) {
      console.log(`\nAutomated cases not found in TestRail (${notInTestrail.length}):`);
      for (const id of notInTestrail) {
        console.log(`- C${id}`);
      }
    }
    
    console.log('\nCoverage check completed.');
  } catch (error) {
    console.error('Error checking test case coverage:', error);
    process.exit(1);
  }
}

// Run the script
checkCaseCoverage();
