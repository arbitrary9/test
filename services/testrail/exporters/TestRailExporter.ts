import type { Case, Section, Suite } from "@dlenroc/testrail";
import { TestCaseExport } from "../models";
import { TestRailService } from "../TestRailService";
import TestRailUtils from "../utils";
import * as fs from 'fs';
import * as path from 'path';
import { JsonFormatter, CsvFormatter, MarkdownFormatter, HtmlFormatter } from "../formatters";

/**
 * Available export formats for test cases
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  MARKDOWN = 'md',
  HTML = 'html'
}

/**
 * Service for exporting TestRail test cases
 */
export class TestRailExporter {
  private testrailService: TestRailService;

  /**
   * Create a new test case exporter
   * @param testrailService TestRail service instance
   */
  constructor(testrailService: TestRailService) {
    this.testrailService = testrailService;
  }

  /**
   * Export test cases by tag information 
   * @param tags List of tags containing TestRail case IDs and/or suite IDs
   * @returns Array of exported test cases
   */
  public async exportTestCasesByTags(tags: string[]): Promise<TestCaseExport[]> {
    // Extract case IDs from tags
    const caseIds = TestRailUtils.extractCaseIdsFromTags(tags);
    if (caseIds.length === 0) {
      console.warn('No TestRail case IDs found in provided tags');
      return [];
    }

    // Extract suite IDs from tags or use default
    const suiteIds = TestRailUtils.extractSuiteIdsFromTags(tags);
    const defaultSuiteId = this.testrailService.getDefaultSuiteId();
    if (suiteIds.length === 0 && defaultSuiteId) {
      suiteIds.push(parseInt(defaultSuiteId, 10));
    }

    // If no suites specified and no default, get all suites
    if (suiteIds.length === 0) {
      const allSuites = await this.testrailService.getSuites();
      allSuites.forEach(suite => suiteIds.push(suite.id));
    }

    // Collect test cases from each suite
    const result: TestCaseExport[] = [];
    
    for (const suiteId of suiteIds) {
      try {
        const suite = await this.testrailService.getSuite(suiteId);
        const sections = await this.testrailService.getSections(suiteId);
        const cases = await this.testrailService.getCasesBySuite(suiteId);

        // Create section lookup
        const sectionMap = new Map<number, Section>();
        sections.forEach(section => sectionMap.set(section.id, section));

        // Find matching cases
        for (const testCase of cases) {
          if (caseIds.includes(testCase.id)) {
            const section = sectionMap.get(testCase.section_id);
            
            result.push({
              id: testCase.id,
              title: testCase.title,
              section_id: testCase.section_id,
              section_name: section?.name,
              suite_id: suiteId,
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
        }
      } catch (error) {
        console.error(`Error processing suite ID ${suiteId}:`, error);
      }
    }

    return result;
  }

  /**
   * Export test cases to file in the specified format
   * @param testCases Array of test cases to export
   * @param outputPath File path for the export
   * @param format Format for the export (JSON, CSV, Markdown, HTML)
   */
  public async exportTestCasesToFile(
    testCases: TestCaseExport[],
    outputPath: string,
    format: ExportFormat = ExportFormat.JSON
  ): Promise<void> {
    // Create directory if it doesn't exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let content: string;

    // Generate content based on format
    switch (format) {
      case ExportFormat.JSON:
        content = new JsonFormatter().format(testCases);
        break;
      case ExportFormat.CSV:
        content = new CsvFormatter().format(testCases);
        break;
      case ExportFormat.MARKDOWN:
        content = new MarkdownFormatter().format(testCases);
        break;
      case ExportFormat.HTML:
        content = new HtmlFormatter().format(testCases);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Write the file
    fs.writeFileSync(outputPath, content);
  }
}
