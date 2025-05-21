import type { Case } from "@dlenroc/testrail";

/**
 * Utility functions for TestRail operations
 */
class TestRailUtils {
  /**
   * Extract TestRail case ID from a tag string
   * @param tag The tag string in format @testrail:C12345
   * @returns The case ID or undefined if not found
   */
  public static extractCaseId(tag: string): number | undefined {
    // Match patterns like @testrail:C12345 or @testrail:12345
    const match = tag.match(/@testrail:(C)?(\d+)/i);
    if (match && match[2]) {
      return parseInt(match[2], 10);
    }
    return undefined;
  }
  
  /**
   * Extract TestRail suite ID from a tag string
   * @param tag The tag string in format @testsuite:123
   * @returns The suite ID or undefined if not found
   */
  public static extractSuiteId(tag: string): number | undefined {
    // Match patterns like @testsuite:123
    const match = tag.match(/@testsuite:(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return undefined;
  }
  
  /**
   * Create a formatted time string for TestRail elapsed time
   * @param milliseconds Elapsed time in milliseconds
   * @returns Formatted time string (e.g., "2m 30s" or "45s")
   */
  public static formatElapsedTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Extract case IDs from tags
   */
  public static extractCaseIdsFromTags(tags: string[]): number[] {
    const caseIds: number[] = [];
    
    for (const tag of tags) {
      const caseId = TestRailUtils.extractCaseId(tag);
      if (caseId && !caseIds.includes(caseId)) {
        caseIds.push(caseId);
      }
    }
    
    return caseIds;
  }

  /**
   * Extract suite IDs from tags
   */
  public static extractSuiteIdsFromTags(tags: string[]): number[] {
    const suiteIds: number[] = [];
    
    for (const tag of tags) {
      const suiteId = TestRailUtils.extractSuiteId(tag);
      if (suiteId && !suiteIds.includes(suiteId)) {
        suiteIds.push(suiteId);
      }
    }
    
    return suiteIds;
  }

  /**
   * Parse steps from string format
   */
  public static parseSteps(stepsString?: string): Array<{content: string, expected: string}> | undefined {
    if (!stepsString) return undefined;
    
    // Simple parsing logic - assumes steps are in pairs of lines (step + expected)
    const lines = stepsString.split('\n');
    const steps: Array<{content: string, expected: string}> = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      steps.push({
        content: lines[i] || '',
        expected: lines[i + 1] || ''
      });
    }
    
    return steps;
  }

  /**
   * Extract custom fields from a test case
   */
  public static extractCustomFields(testCase: Case): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(testCase)) {
      if (key.startsWith('custom_') && 
          key !== 'custom_steps' && 
          key !== 'custom_steps_separated' &&
          key !== 'custom_description' &&
          key !== 'custom_preconds' &&
          key !== 'custom_expected') {
        const fieldName = key.replace('custom_', '');
        result[fieldName] = value;
      }
    }
    
    return result;
  }

  /**
   * Extract tags from a test case
   */
  public static extractTagsFromCase(testCase: Case): string[] {
    const tags: string[] = [];
    
    // Add TestRail ID as tag
    tags.push(`@testrail:C${testCase.id}`);
    
    // Add suite ID as tag
    if (testCase.suite_id) {
      tags.push(`@testsuite:${testCase.suite_id}`);
    }
    
    // Extract from custom_tags field if it exists
    if (testCase.custom_tags) {
      const customTags = String(testCase.custom_tags)
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
        
      tags.push(...customTags);
    }
    
    // Map priority to tag
    if (testCase.priority_id) {
      const priorityMap: Record<number, string> = {
        1: '@priority:low',
        2: '@priority:medium',
        3: '@priority:high',
        4: '@priority:critical'
      };
      
      if (priorityMap[testCase.priority_id]) {
        tags.push(priorityMap[testCase.priority_id]);
      }
    }
    
    // Map type to tag
    if (testCase.type_id) {
      const typeMap: Record<number, string> = {
        1: '@type:acceptance',
        2: '@type:accessibility',
        3: '@type:automated',
        4: '@type:compatibility',
        5: '@type:destructive',
        6: '@type:functional',
        7: '@type:performance',
        8: '@type:regression',
        9: '@type:security',
        10: '@type:smoke',
        11: '@type:usability'
      };
      
      if (typeMap[testCase.type_id]) {
        tags.push(typeMap[testCase.type_id]);
      }
    }
    
    // Add references
    if (testCase.refs) {
      const refs = testCase.refs.split(',').map(ref => ref.trim());
      for (const ref of refs) {
        if (ref.match(/^[A-Z]+-\d+$/)) {
          tags.push(`@jira:${ref}`);
        }
      }
    }
    
    return tags;
  }

  /**
   * Format steps as a string
   */
  public static formatStepsAsString(steps?: Array<{content: string, expected: string}>): string {
    if (!steps || steps.length === 0) {
      return '';
    }
    
    return steps.map((step, index) => 
      `${index + 1}. ${step.content}\nExpected: ${step.expected}`
    ).join('\n\n');
  }

  /**
   * Escape HTML special characters
   */
  public static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format HTML content with line breaks preserved
   */
  public static formatHtmlContent(content: string): string {
    if (!content) return '';
    return TestRailUtils.escapeHtml(content).replace(/\n/g, '<br>');
  }
}

export default TestRailUtils;
