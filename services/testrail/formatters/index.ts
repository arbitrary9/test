import { JsonFormatter } from './JsonFormatter';
import { CsvFormatter } from './CsvFormatter';
import { MarkdownFormatter } from './MarkdownFormatter';
import { HtmlFormatter } from './HtmlFormatter';

/**
 * Base interface for test case formatters
 */
export interface TestCaseFormatter {
  format(testCases: any[]): string;
}

export {
  JsonFormatter,
  CsvFormatter,
  MarkdownFormatter,
  HtmlFormatter
};
