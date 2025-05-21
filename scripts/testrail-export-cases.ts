#!/usr/bin/env ts-node
/**
 * Script to export test cases from TestRail for documentation
 * 
 * Usage:
 *   npm run testrail:export -- --format markdown --output ./docs/test-cases
 */
import {TestRailService, TestRailExporter, ExportFormat, TestRailUtils} from '@services/testrail';
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

// Get options with defaults
const format = options.format?.toLowerCase() || 'markdown';
const outputDir = options.output || path.join(process.cwd(), 'test-cases');
const suiteId = options.suiteId || undefined;
const filter = options.filter || undefined;

// Check if TestRail is configured
if (!env.TESTRAIL) {
  console.error('TestRail integration is not configured. Please set the required environment variables.');
  process.exit(1);
}

/**
 * Export test cases from TestRail
 */
async function exportTestCases() {
  try {
    console.log('Exporting test cases from TestRail...');
    
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // Create TestRail exporter
    const exporter = new TestRailExporter(testrail);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get suites to export
    let suites: number[] = [];
    if (suiteId) {
      suites = [parseInt(suiteId, 10)];
    } else {
      const allSuites = await testrail.getSuites();
      suites = allSuites.map(s => s.id);
    }
    
    console.log(`Exporting test cases from ${suites.length} suite(s)...`);
    
    // Process each suite
    for (const sId of suites) {
      const suite = await testrail.getSuite(sId);
      console.log(`Processing suite: ${suite.name} (ID: ${suite.id})`);
      
      // Get all cases in this suite
      const cases = await testrail.getCasesBySuite(sId);
      
      // Filter cases if filter is specified
      let filteredCases = cases;
      if (filter) {
        const filterRegex = new RegExp(filter, 'i');
        filteredCases = cases.filter(c => 
          filterRegex.test(c.title) ||
          filterRegex.test(c.refs || '')
        );
      }
      
      console.log(`Found ${filteredCases.length} test cases${filter ? ' matching filter' : ''}`);
      
      if (filteredCases.length === 0) continue;
      
      // Convert cases to export format
      const testCases = [];
      const sections = await testrail.getSections(sId);
      const sectionMap = new Map();
      sections.forEach(section => sectionMap.set(section.id, section));
      
      for (const testCase of filteredCases) {
        const section = sectionMap.get(testCase.section_id);
        
        testCases.push({
          id: testCase.id,
          title: testCase.title,
          section_id: testCase.section_id,
          section_name: section?.name,
          suite_id: sId,
          suite_name: suite.name,
          priority_id: testCase.priority_id,
          type_id: testCase.type_id,
          refs: testCase.refs,
          description: "custom_description" in testCase
              ? testCase.custom_description as unknown as string
              : undefined,
          preconditions: "custom_preconds" in testCase
              ? testCase.custom_preconds as unknown as string
              : undefined,
          expected: "custom_expected" in testCase
              ? testCase.custom_expected as unknown as string
              : undefined,
          steps: "custom_steps_separated" in testCase
              ? testCase.custom_steps_separated as unknown as {content: string, expected: string}[]
              : "custom_steps" in testCase
                  ? TestRailUtils.parseSteps(testCase.custom_steps as unknown as string)
                  : undefined,
          custom_fields: TestRailUtils.extractCustomFields(testCase),
          tags: TestRailUtils.extractTagsFromCase(testCase)
        });
      }
      
      // Create safe filename
      const safeName = suite.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const outputFile = path.join(outputDir, `${safeName}.${getFormatExtension(format)}`);
      
      // Export to file
      await exporter.exportTestCasesToFile(
        testCases,
        outputFile,
        getExportFormat(format)
      );
      
      console.log(`Exported to ${outputFile}`);
    }
    
    console.log('\nExport completed successfully!');
    
  } catch (error) {
    console.error('Error exporting test cases:', error);
    process.exit(1);
  }
}

/**
 * Get export format from string
 */
function getExportFormat(formatString: string): ExportFormat {
  switch (formatString.toLowerCase()) {
    case 'json':
      return ExportFormat.JSON;
    case 'csv':
      return ExportFormat.CSV;
    case 'markdown':
    case 'md':
      return ExportFormat.MARKDOWN;
    case 'html':
      return ExportFormat.HTML;
    default:
      console.warn(`Unknown format: ${formatString}, using markdown`);
      return ExportFormat.MARKDOWN;
  }
}

/**
 * Get file extension for format
 */
function getFormatExtension(formatString: string): string {
  switch (formatString.toLowerCase()) {
    case 'json': return 'json';
    case 'csv': return 'csv';
    case 'markdown':
    case 'md': return 'md';
    case 'html': return 'html';
    default: return 'md';
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  exportTestCases().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
