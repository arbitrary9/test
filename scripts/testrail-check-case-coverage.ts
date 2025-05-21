#!/usr/bin/env ts-node
/**
 * Script to check test case coverage in feature files
 * 
 * Usage:
 *   npm run testrail:coverage -- --features ./features
 */
import { TestRailService } from '@services/testrail';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import {env} from "@config/env";

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
const featuresDir = options.features || path.join(process.cwd(), 'features');
const output = options.output || 'stdout';
const requiredTags = options.required?.split(',') || [];

// Check if TestRail is configured
if (!env.TESTRAIL) {
  console.error('TestRail integration is not configured. Please set the required environment variables.');
  process.exit(1);
}

interface CoverageSummary {
  total: number;
  covered: number;
  missing: number;
  percentage: number;
  coveredCases: { id: number; title: string; featureFile: string }[];
  missingCases: { id: number; title: string; priority: string }[];
  unmappedScenarios: { name: string; featureFile: string; tags: string[] }[];
}

/**
 * Check test case coverage
 */
async function checkTestCaseCoverage() {
  try {
    console.log('Checking TestRail test case coverage...');
    
    // Create TestRail service instance
    const testrail = new TestRailService();
    
    // Get all test cases from TestRail
    console.log('Fetching test cases from TestRail...');
    const suites = await testrail.getSuites();
    
    const allCases: any[] = [];
    for (const suite of suites) {
      console.log(`Fetching cases for suite: ${suite.name}`);
      const cases = await testrail.getCasesBySuite(suite.id);
      allCases.push(...cases);
    }
    
    console.log(`Found ${allCases.length} total test cases in TestRail`);
    
    // Find all feature files
    console.log(`Scanning feature files in: ${featuresDir}`);
    const featureFiles = glob.sync(path.join(featuresDir, '**/*.feature'));
    console.log(`Found ${featureFiles.length} feature files`);
    
    // Parse feature files to extract scenarios with TestRail tags
    const coveredCases: { id: number; title: string; featureFile: string }[] = [];
    const unmappedScenarios: { name: string; featureFile: string; tags: string[] }[] = [];
    
    // Parse feature files
    for (const file of featureFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const scenarios = extractScenarios(content);
      
      for (const scenario of scenarios) {
        const testRailTag = scenario.tags.find(tag => tag.match(/@testrail:C?\d+/i));
        
        if (testRailTag) {
          const caseId = extractCaseId(testRailTag);
          if (caseId) {
            coveredCases.push({
              id: caseId,
              title: scenario.name,
              featureFile: path.relative(process.cwd(), file)
            });
          }
        } else {
          // Scenario without TestRail tag
          unmappedScenarios.push({
            name: scenario.name,
            featureFile: path.relative(process.cwd(), file),
            tags: scenario.tags
          });
        }
      }
    }
    
    // Find missing cases
    const coveredIds = new Set(coveredCases.map(c => c.id));
    const missingCases = allCases
      .filter(c => !coveredIds.has(c.id))
      // Filter by required tags if specified
      .filter(c => {
        if (requiredTags.length === 0) return true;
        const caseTags = extractTagsFromCase(c);
        return requiredTags.some(tag => caseTags.includes(tag));
      })
      .map(c => ({
        id: c.id,
        title: c.title,
        priority: getPriorityName(c.priority_id)
      }));
    
    // Create coverage summary
    const summary: CoverageSummary = {
      total: allCases.length,
      covered: coveredCases.length,
      missing: missingCases.length,
      percentage: Math.round((coveredCases.length / allCases.length) * 100),
      coveredCases,
      missingCases,
      unmappedScenarios
    };
    
    // Output results
    if (output === 'json') {
      const outputFile = options.file || 'coverage-report.json';
      fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
      console.log(`Coverage report written to: ${outputFile}`);
    } else {
      // Print to console
      console.log('\n=== TestRail Coverage Summary ===');
      console.log(`Total Test Cases: ${summary.total}`);
      console.log(`Covered Test Cases: ${summary.covered}`);
      console.log(`Missing Test Cases: ${summary.missing}`);
      console.log(`Coverage Percentage: ${summary.percentage}%`);
      
      if (summary.missingCases.length > 0) {
        console.log('\nMissing Test Cases:');
        summary.missingCases.sort((a, b) => {
          // Sort by priority first (Critical > High > Medium > Low)
          const priorityOrder: Record<string, number> = {
            'Critical': 0,
            'High': 1,
            'Medium': 2,
            'Low': 3,
            'Unknown': 4
          };
          
          const aPriority = priorityOrder[a.priority] || 4;
          const bPriority = priorityOrder[b.priority] || 4;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // Then sort by ID
          return a.id - b.id;
        }).forEach(c => {
          console.log(`- C${c.id} [${c.priority}] ${c.title}`);
        });
      }
      
      if (summary.unmappedScenarios.length > 0) {
        console.log('\nUnmapped Scenarios:');
        summary.unmappedScenarios.forEach(s => {
          console.log(`- ${s.name} (${s.featureFile})`);
          if (s.tags.length > 0) {
            console.log(`  Tags: ${s.tags.join(', ')}`);
          }
        });
      }
    }
    
    // Exit with non-zero code if coverage is not 100%
    if (summary.percentage < 100 && options.strict === 'true') {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error checking test case coverage:', error);
    process.exit(1);
  }
}

/**
 * Extract scenarios from feature file content
 */
function extractScenarios(content: string): { name: string; tags: string[] }[] {
  const scenarios: { name: string; tags: string[] }[] = [];
  const lines = content.split('\n');
  
  let currentTags: string[] = [];
  let featureTags: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Extract tags
    if (line.startsWith('@')) {
      currentTags = line.split(' ').filter(t => t.startsWith('@'));
      
      // If next line is Feature, these are feature tags
      if (i + 1 < lines.length && lines[i + 1].trim().startsWith('Feature:')) {
        featureTags = [...currentTags];
        currentTags = [];
      }
    }
    
    // Extract scenarios
    else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
      const name = line.substring(line.indexOf(':') + 1).trim();
      
      // Combine feature tags and scenario tags
      const allTags = [...featureTags, ...currentTags];
      
      scenarios.push({
        name,
        tags: allTags
      });
      
      currentTags = [];
    }
  }
  
  return scenarios;
}

/**
 * Extract case ID from TestRail tag
 */
function extractCaseId(tag: string): number | null {
  const match = tag.match(/@testrail:C?(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Extract tags from TestRail case
 */
function extractTagsFromCase(testCase: any): string[] {
  // Implementation depends on how your tags are stored in TestRail
  // This is just a placeholder
  const tags: string[] = [];
  
  // Extract tags from custom fields if available
  if (testCase.custom_tags) {
    tags.push(...testCase.custom_tags.split(',').map((t: string) => t.trim()));
  }
  
  // Add priority and type as tags
  if (testCase.priority_id) {
    tags.push(`@priority:${getPriorityName(testCase.priority_id).toLowerCase()}`);
  }
  
  if (testCase.type_id) {
    const typeMap: Record<number, string> = {
      1: 'functional',
      2: 'regression',
      3: 'automated',
      4: 'performance',
      5: 'usability',
      6: 'security'
    };
    
    const typeName = typeMap[testCase.type_id] || `type${testCase.type_id}`;
    tags.push(`@type:${typeName}`);
  }
  
  return tags;
}

/**
 * Get priority name from ID
 */
function getPriorityName(priorityId?: number): string {
  if (!priorityId) return 'Unknown';
  
  const priorityMap: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical'
  };
  
  return priorityMap[priorityId] || 'Unknown';
}

// Run the function if this script is executed directly
if (require.main === module) {
  checkTestCaseCoverage().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
