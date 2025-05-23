import API from '@dlenroc/testrail';

// Load environment variables
const TESTRAIL_HOST = process.env.TESTRAIL_HOST || '';
const TESTRAIL_USERNAME = process.env.TESTRAIL_USERNAME || '';
const TESTRAIL_PASSWORD = process.env.TESTRAIL_PASSWORD || '';
const TESTRAIL_PROJECT_ID = process.env.TESTRAIL_PROJECT_ID || '';
const TESTRAIL_SUITE_ID = process.env.TESTRAIL_SUITE_ID || '';

// Initialize TestRail API
const api = new API({
  host: TESTRAIL_HOST,
  username: TESTRAIL_USERNAME,
  password: TESTRAIL_PASSWORD
});

/**
 * Create a new test run in TestRail
 */
async function createTestRun() {
  console.log('Creating new TestRail test run...');
  
  if (!TESTRAIL_HOST || !TESTRAIL_USERNAME || !TESTRAIL_PASSWORD) {
    console.error('TestRail credentials are not set. Please check your environment variables.');
    process.exit(1);
  }
  
  if (!TESTRAIL_PROJECT_ID) {
    console.error('TestRail project ID is not set. Please set TESTRAIL_PROJECT_ID environment variable.');
    process.exit(1);
  }
  
  try {
    // Current date for run name
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create test run data
    const runData: any = {
      name: `Automated Test Run - ${date}`,
      description: `Automated test run created at ${timestamp}`,
      include_all: true
    };
    
    // Add suite ID if specified
    if (TESTRAIL_SUITE_ID) {
      runData.suite_id = parseInt(TESTRAIL_SUITE_ID);
    }
    
    // Create the test run
    const run = await api.addRun(parseInt(TESTRAIL_PROJECT_ID), runData);
    
    console.log(`Test run created successfully: ID ${run.id}`);
    console.log(`Run URL: ${TESTRAIL_HOST}/index.php?/runs/view/${run.id}`);
    
    // Output the run ID for use in GitHub Actions or other CI systems
    console.log(`::set-output name=run_id::${run.id}`);
    
    return run.id;
  } catch (error) {
    console.error('Error creating TestRail run:', error);
    process.exit(1);
  }
}

// Run the script
createTestRun();
