/**
 * TestRail integration package
 * 
 * This package provides integrations with TestRail for test case and test run management.
 * It supports reporting test results and exporting test cases in various formats.
 */

// Export core service
export { TestRailService } from './TestRailService';

// Export data models
export * from './models';

// Export utilities
export { default as TestRailUtils } from './utils';

// Export exporters
export { TestRailExporter, ExportFormat } from './exporters/TestRailExporter';

// Export formatters
export * from './formatters';
