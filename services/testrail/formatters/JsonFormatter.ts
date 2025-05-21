import { TestCaseExport } from "../models";
import { TestCaseFormatter } from "./index";

/**
 * Formats test cases as JSON
 */
export class JsonFormatter implements TestCaseFormatter {
  /**
   * Format test cases as JSON
   */
  public format(testCases: TestCaseExport[]): string {
    return JSON.stringify(testCases, null, 2);
  }
}
