import { TestCaseExport } from "../models";
import { TestCaseFormatter } from "./index";
import TestRailUtils from "../utils";

/**
 * Formats test cases as HTML
 */
export class HtmlFormatter implements TestCaseFormatter {
  /**
   * Format test cases as HTML
   */
  public format(testCases: TestCaseExport[]): string {
    if (testCases.length === 0) {
      return '<html><body><h1>No test cases found</h1></body></html>';
    }
    
    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>TestRail Test Cases</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #2980b9; }
    h2 { color: #3498db; border-bottom: 1px solid #3498db; padding-bottom: 5px; }
    h3 { color: #2c3e50; }
    h4 { color: #34495e; }
    .case { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .case h4 { margin-top: 0; background-color: #f8f9fa; padding: 10px; border-radius: 3px; }
    .tags { color: #7f8c8d; font-size: 0.9em; }
    .steps { border-collapse: collapse; width: 100%; }
    .steps th, .steps td { border: 1px solid #ddd; padding: 8px; }
    .steps th { background-color: #f8f9fa; text-align: left; }
    .steps tr:nth-child(even) { background-color: #f9f9f9; }
    .label { font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>TestRail Test Cases</h1>
`;
    
    // Group by suite
    const suiteGroups = new Map<number, TestCaseExport[]>();
    for (const tc of testCases) {
      if (!suiteGroups.has(tc.suite_id)) {
        suiteGroups.set(tc.suite_id, []);
      }
      suiteGroups.get(tc.suite_id)!.push(tc);
    }
    
    // Generate HTML for each suite
    for (const [suiteId, cases] of suiteGroups.entries()) {
      const suiteName = cases[0].suite_name || `Suite ${suiteId}`;
      html += `<h2>Suite: ${TestRailUtils.escapeHtml(suiteName)}</h2>`;
      
      // Group by section
      const sectionGroups = new Map<number, TestCaseExport[]>();
      for (const tc of cases) {
        if (!sectionGroups.has(tc.section_id)) {
          sectionGroups.set(tc.section_id, []);
        }
        sectionGroups.get(tc.section_id)!.push(tc);
      }
      
      // Generate HTML for each section
      for (const [sectionId, sectionCases] of sectionGroups.entries()) {
        const sectionName = sectionCases[0].section_name || `Section ${sectionId}`;
        html += `<h3>Section: ${TestRailUtils.escapeHtml(sectionName)}</h3>`;
        
        // Generate HTML for each case
        for (const tc of sectionCases) {
          html += `
          <div class="case">
            <h4>C${tc.id}: ${TestRailUtils.escapeHtml(tc.title)}</h4>
          `;
          
          if (tc.tags && tc.tags.length > 0) {
            html += `<div class="tags">Tags: ${TestRailUtils.escapeHtml(tc.tags.join(', '))}</div>`;
          }
          
          if (tc.description) {
            html += `
            <div class="label">Description:</div>
            <div>${TestRailUtils.formatHtmlContent(tc.description)}</div>
            `;
          }
          
          if (tc.preconditions) {
            html += `
            <div class="label">Preconditions:</div>
            <div>${TestRailUtils.formatHtmlContent(tc.preconditions)}</div>
            `;
          }
          
          if (tc.steps && tc.steps.length > 0) {
            html += `
            <div class="label">Steps:</div>
            <table class="steps">
              <tr>
                <th>#</th>
                <th>Step</th>
                <th>Expected Result</th>
              </tr>
            `;
            
            tc.steps.forEach((step, index) => {
              html += `
              <tr>
                <td>${index + 1}</td>
                <td>${TestRailUtils.formatHtmlContent(step.content)}</td>
                <td>${TestRailUtils.formatHtmlContent(step.expected)}</td>
              </tr>
              `;
            });
            
            html += `</table>`;
          } else if (tc.expected) {
            html += `
            <div class="label">Expected Result:</div>
            <div>${TestRailUtils.formatHtmlContent(tc.expected)}</div>
            `;
          }
          
          html += `</div>`;
        }
      }
    }
    
    html += `
</body>
</html>
`;
    
    return html;
  }
}
