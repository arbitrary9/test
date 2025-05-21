import { Label, Link } from "allure-js-commons";
import { Tag, TagValue } from "./Tag";

/**
 * Validates and processes Cucumber tags
 */
export class TagValidator {
  /**
   * List of supported tag patterns with descriptions
   */
  private static readonly SUPPORTED_TAGS: Record<string, string> = {
    '@jira:(.*)': 'Jira issue reference',
    '@tms:(.*)': 'Test Management System reference',
    '@epic:(.*)': 'Epic reference',
    '@severity:(.*)': 'Severity level',
    '@story:(.*)': 'Story reference',
    '@feature:(.*)': 'Feature reference', 
    '@bug:(.*)': 'Bug reference',
    '@testrail:(C\\d+|\\d+)': 'TestRail test case ID',
    '@testsuite:(\\d+)': 'TestRail suite ID',
    '@smoke': 'Smoke test',
    '@regression': 'Regression test',
    '@integration': 'Integration test',
    '@e2e': 'End-to-end test',
    '@critical': 'Critical test',
    '@flaky': 'Known flaky test',
    '@slow': 'Slow running test',
    '@manual': 'Manual test',
    '@automated': 'Automated test',
    '@wip': 'Work in progress',
    '@ignore': 'Ignored test',
    '@skip': 'Skipped test',
    '@ci': 'CI-only test',
    '@local': 'Local-only test',
    '@test': 'General test tag',
    '@symbol:(.*)': 'Symbol reference'
  };

  /**
   * Returns the list of all supported tags
   */
  public static getSupportedTags(): string[] {
    return Object.keys(this.SUPPORTED_TAGS);
  }

  /**
   * Returns the description for a specific tag
   */
  public static getTagDescription(tag: string): string | undefined {
    // Direct match first
    if (this.SUPPORTED_TAGS[tag]) {
      return this.SUPPORTED_TAGS[tag];
    }
    
    // Pattern match next
    for (const [pattern, description] of Object.entries(this.SUPPORTED_TAGS)) {
      if (pattern.includes('(.*)')) {
        try {
          const regex = new RegExp(`^${pattern.replace(/\(\.\*\)/g, '.*')}$`);
          if (regex.test(tag)) {
            return description;
          }
        } catch (error) {
          console.warn(`Invalid pattern in SUPPORTED_TAGS: ${pattern}`, error);
        }
      }
    }
    
    return undefined;
  }

  /**
   * Validates a list of tags and returns those that are valid
   */
  public static validateTags(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];

    return tags.filter(tag => {
      // Check if tag starts with @
      if (!tag.startsWith('@')) {
        console.warn(`Warning: Tag '${tag}' does not start with @, it may not work as expected`);
        return false;
      }

      // Check if the tag matches any of our supported patterns
      const isSupported = Object.keys(this.SUPPORTED_TAGS).some(pattern => {
        try {
          // Convert glob pattern to regex
          const regexPattern = new RegExp(`^${pattern.replace(/\(\.\*\)/g, '.*')}$`);
          return regexPattern.test(tag);
        } catch (error) {
          console.warn(`Invalid pattern in SUPPORTED_TAGS: ${pattern}`, error);
          return false;
        }
      });
      
      // Also check if tag matches any pattern in Tag configuration
      const tagInfo = Tag.parse(tag);
      const isConfiguredTag = !!(tagInfo.label || tagInfo.link);
      
      if (!isSupported && !isConfiguredTag) {
        console.warn(`Warning: Tag '${tag}' is not in the list of supported tags`);
      }

      return tag.length > 0;
    });
  }

  /**
   * Parses a comma-separated string of tags and validates them
   */
  public static parseTagsString(tagsString: string | undefined): string[] {
    if (!tagsString) return [];
    
    const tags = tagsString.split(',').map(tag => tag.trim());
    return this.validateTags(tags);
  }

  /**
   * Formats tags for Cucumber (joins with 'or' operator)
   */
  public static formatForCucumber(tags: string[]): string {
    if (!tags || tags.length === 0) return '';
    return tags.join(' or ');
  }

  /**
   * Process a tags string and return a Cucumber-formatted string
   */
  public static process(tagsString: string | undefined): string {
    const validTags = this.parseTagsString(tagsString);
    return this.formatForCucumber(validTags);
  }
  
  /**
   * Checks if a tag is a configured tag from Tag class
   */
  public static isConfiguredTag(tag: string): boolean {
    const tagInfo = Tag.parse(tag);
    return !!(tagInfo.label || tagInfo.link);
  }
  
  /**
   * Gets configured tag information
   */
  public static getTagInfo(tag: string): {
    original: string,
    label?: Label,
    link?: Link,
    value?: TagValue
  } {
    return Tag.parse(tag);
  }
  
  /**
   * Create a new tag with name and value
   */
  public static createTag(name: string, value?: TagValue): string {
    return Tag.create(name, value);
  }
  
  /**
   * Create an Allure label
   */
  public static createLabel(name: string, value: string): Label {
    return Tag.createLabel(name, value);
  }
  
  /**
   * Create an Allure link
   */
  public static createLink(url: string, name?: string, type?: string): Link {
    return Tag.createLink(url, name, type);
  }
  
  /**
   * Extract tag value from a tag string
   */
  public static getTagValue(tag: string): TagValue | undefined {
    const info = Tag.parse(tag);
    if (info.value !== undefined) {
      return info.value;
    }
    if (info.label) {
      return info.label.value;
    }
    return undefined;
  }
  
  /**
   * Extract labels from a list of tags
   */
  public static extractLabels(tags: string[]): Label[] {
    return tags
      .map(tag => Tag.parse(tag).label)
      .filter((label): label is Label => !!label);
  }
  
  /**
   * Extract links from a list of tags
   */
  public static extractLinks(tags: string[]): Link[] {
    return tags
      .map(tag => Tag.parse(tag).link)
      .filter((link): link is Link => !!link);
  }
}
