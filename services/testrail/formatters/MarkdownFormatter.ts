import { TestCaseExport } from "../models";
import { TestCaseFormatter } from "./index";

/**
 * Formats test cases as Markdown
 */
export class MarkdownFormatter implements TestCaseFormatter {
  /**
   * Format test cases as Markdown
   */
  public format(testCases: TestCaseExport[]): string {
    if (testCases.length === 0) {
      return '# No test cases found';
    }
    
    let markdown = '# TestRail Test Cases\n\n';
    
    // Group by suite
    const suiteGroups = new Map<number, TestCaseExport[]>();
    for (const tc of testCases) {
      if (!suiteGroups.has(tc.suite_id)) {
        suiteGroups.set(tc.suite_id, []);
      }
      suiteGroups.get(tc.suite_id)!.push(tc);
    }
    
    // Generate markdown for each suite
    for (const [suiteId, cases] of suiteGroups.entries()) {
      const suiteName = cases[0].suite_name || `Suite ${suiteId}`;
      markdown += `## Suite: ${suiteName}\n\n`;
      
      // Group by section
      const sectionGroups = new Map<number, TestCaseExport[]>();
      for (const tc of cases) {
        if (!sectionGroups.has(tc.section_id)) {
          sectionGroups.set(tc.section_id, []);
        }
        sectionGroups.get(tc.section_id)!.push(tc);
      }
      
      // Generate markdown for each section
      for (const [sectionId, sectionCases] of sectionGroups.entries()) {
        const sectionName = sectionCases[0].section_name || `Section ${sectionId}`;
        markdown += `### Section: ${sectionName}\n\n`;
        
        // Generate markdown for each case
        for (const tc of sectionCases) {
          markdown += `#### C${tc.id}: ${tc.title}\n\n`;
          
          if (tc.tags && tc.tags.length > 0) {
            markdown += `**Tags:** ${tc.tags.join(', ')}\n\n`;
          }
          
          if (tc.description) {
            markdown += `**Description:**\n${tc.description}\n\n`;
          }
          
          if (tc.preconditions) {
            markdown += `**Preconditions:**\n${tc.preconditions}\n\n`;
          }
          
          if (tc.steps && tc.steps.length > 0) {
            markdown += '**Steps:**\n\n';
            markdown += '| # | Step | Expected Result |\n';
            markdown += '|---|------|----------------|\n';
            
            tc.steps.forEach((step, index) => {
              markdown += `| ${index + 1} | ${step.content.replace(/\|/g, '\\|')} | ${step.expected.replace(/\|/g, '\\|')} |\n`;
            });
            
            markdown += '\n';
          } else if (tc.expected) {
            markdown += `**Expected Result:**\n${tc.expected}\n\n`;
          }
          
          markdown += '---\n\n';
        }
      }
    }
    
    return markdown;
  }
}
