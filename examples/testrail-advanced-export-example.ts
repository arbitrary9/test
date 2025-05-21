/**
 * Advanced example of exporting TestRail test cases with filtering and customization
 */
import { TestRailService, TestRailExporter, ExportFormat } from '../services/testrail';
import { isTestRailEnabled } from '../config/env/env.testrail';
import * as path from 'path';
import * as fs from 'fs';

/**
 * This example demonstrates:
 * 1. Exporting test cases from specific suites and sections
 * 2. Filtering test cases by criteria
 * 3. Customizing export output
 * 4. Working with the exported test case data
 */
async function advancedTestRailExportExample() {
  // Check if TestRail is configured
  if (!isTestRailEnabled()) {
    console.log('TestRail integration is not configured. Please set the required environment variables.');
    return;
  }

  try {
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // Create TestRail exporter
    const exporter = new TestRailExporter(testrail);
    
    // Example 1: Export by specific tags
    console.log('\n=== Example 1: Export by specific tags ===');
    
    // Mix of case IDs, suite IDs, and other tags
    const tags = [
      '@testrail:C12345',
      '@testrail:C12346',
      '@testsuite:1',
      '@regression',
      '@smoke',
      '@severity:high'
    ];
    
    console.log('Exporting test cases with tags:', tags);
    
    const testCases = await exporter.exportTestCasesByTags(tags);
    
    console.log(`Found ${testCases.length} test cases matching the tags`);
    
    // Example 2: Filter exported test cases by criteria
    console.log('\n=== Example 2: Filter exported test cases by criteria ===');
    
    // Filter test cases by type (e.g., regression tests)
    const regressionTestCases = testCases.filter(tc => 
      tc.tags?.some(tag => tag === '@type:regression')
    );
    
    console.log(`Found ${regressionTestCases.length} regression test cases`);
    
    // Filter test cases by priority (e.g., high priority)
    const highPriorityTestCases = testCases.filter(tc => 
      tc.priority_id === 3 || tc.tags?.some(tag => tag === '@priority:high')
    );
    
    console.log(`Found ${highPriorityTestCases.length} high priority test cases`);
    
    // Example 3: Create custom export directory structure
    console.log('\n=== Example 3: Create custom export directory structure ===');
    
    // Create base export directory
    const exportBaseDir = path.join(process.cwd(), 'exports', 'advanced-example');
    if (!fs.existsSync(exportBaseDir)) {
      fs.mkdirSync(exportBaseDir, { recursive: true });
    }
    
    // Group by suite
    const suiteGroups = new Map<number, typeof testCases>();
    for (const tc of testCases) {
      if (!suiteGroups.has(tc.suite_id)) {
        suiteGroups.set(tc.suite_id, []);
      }
      suiteGroups.get(tc.suite_id)!.push(tc);
    }
    
    // Export each suite to a separate directory
    for (const [suiteId, casesInSuite] of suiteGroups.entries()) {
      const suiteName = casesInSuite[0].suite_name || `Suite-${suiteId}`;
      const safeNameSuite = suiteName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      // Create suite directory
      const suiteDir = path.join(exportBaseDir, safeNameSuite);
      if (!fs.existsSync(suiteDir)) {
        fs.mkdirSync(suiteDir, { recursive: true });
      }
      
      console.log(`Exporting ${casesInSuite.length} test cases for suite: ${suiteName}`);
      
      // Export in different formats for this suite
      await exporter.exportTestCasesToFile(
        casesInSuite, 
        path.join(suiteDir, 'test-cases.json'), 
        ExportFormat.JSON
      );
      
      await exporter.exportTestCasesToFile(
        casesInSuite,
        path.join(suiteDir, 'test-cases.md'),
        ExportFormat.MARKDOWN
      );
    }
    
    // Example 4: Generate a custom report by transforming the test case data
    console.log('\n=== Example 4: Generate a custom report ===');
    
    // Generate a custom summary report
    const summaryReport = {
      exportDate: new Date().toISOString(),
      totalTestCases: testCases.length,
      suites: Object.fromEntries(
        Array.from(suiteGroups.entries()).map(([suiteId, cases]) => [
          cases[0].suite_name || `Suite-${suiteId}`,
          {
            count: cases.length,
            sections: countBySections(cases)
          }
        ])
      ),
      priorityBreakdown: testCases.reduce((acc, tc) => {
        const priority = getPriorityName(tc.priority_id);
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      typeBreakdown: testCases.reduce((acc, tc) => {
        const typeTag = tc.tags?.find(tag => tag.startsWith('@type:'));
        const type = typeTag ? typeTag.replace('@type:', '') : 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    // Write the custom report to a file
    fs.writeFileSync(
      path.join(exportBaseDir, 'summary-report.json'),
      JSON.stringify(summaryReport, null, 2)
    );
    
    console.log('Generated custom summary report');
    console.log('Summary:');
    console.log(`- Total test cases: ${summaryReport.totalTestCases}`);
    console.log(`- Suites: ${Object.keys(summaryReport.suites).length}`);
    console.log('- Priority breakdown:');
    Object.entries(summaryReport.priorityBreakdown).forEach(([priority, count]) => {
      console.log(`  * ${priority}: ${count}`);
    });
    
    console.log('\nAdvanced export completed successfully');
    console.log(`All exports saved to: ${exportBaseDir}`);
    
  } catch (error) {
    console.error('Error in advanced export:', error);
  }
}

/**
 * Count test cases by sections within a suite
 */
function countBySections(testCases: any[]): Record<string, number> {
  return testCases.reduce((acc, tc) => {
    const sectionName = tc.section_name || 'Uncategorized';
    acc[sectionName] = (acc[sectionName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get human-readable priority name from priority ID
 */
function getPriorityName(priorityId?: number): string {
  if (!priorityId) return 'Unspecified';
  
  const priorityMap: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical'
  };
  
  return priorityMap[priorityId] || `Unknown (${priorityId})`;
}

// Run the example
advancedTestRailExportExample().catch(console.error);
