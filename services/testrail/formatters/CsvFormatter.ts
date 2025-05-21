import { TestCaseExport } from "../models";
import { TestCaseFormatter } from "./index";
import TestRailUtils from "../utils";

/**
 * Formats test cases as CSV
 */
export class CsvFormatter implements TestCaseFormatter {
  /**
   * Format test cases as CSV
   */
  public format(testCases: TestCaseExport[]): string {
    if (testCases.length === 0) {
      return '';
    }
    
    const headers = [
      'ID', 'Title', 'Suite', 'Section', 'Description', 
      'Preconditions', 'Steps', 'Expected Result', 'Tags'
    ];
    
    const rows = testCases.map(tc => [
      `C${tc.id}`,
      `"${tc.title.replace(/"/g, '""')}"`,
      `"${(tc.suite_name || '').replace(/"/g, '""')}"`,
      `"${(tc.section_name || '').replace(/"/g, '""')}"`,
      `"${(tc.description || '').replace(/"/g, '""')}"`,
      `"${(tc.preconditions || '').replace(/"/g, '""')}"`,
      `"${TestRailUtils.formatStepsAsString(tc.steps).replace(/"/g, '""')}"`,
      `"${(tc.expected || '').replace(/"/g, '""')}"`,
      `"${(tc.tags || []).join(', ').replace(/"/g, '""')}"`
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}
