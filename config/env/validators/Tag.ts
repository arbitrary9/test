import { z } from "zod";
import { Label, Link } from "allure-js-commons";

/**
 * Interface for label tag configuration
 */
export interface ILabelTag {
  /** Regular expression pattern for tag matching */
  pattern: RegExp[];
  /** Name of the label */
  name: string;
}

/**
 * Interface for link tag configuration
 */
export interface ILinkTag {
  /** Regular expression pattern for tag matching */
  pattern: RegExp[];
  /** URL template for the link, can contain %s placeholder for the tag value */
  urlTemplate: string | ((value: any) => string);
  /** Optional name template for the link, can contain %s placeholder for the tag value */
  nameTemplate?: string;
}

/**
 * Interface for all tag configurations
 */
export interface ITagConfiguration {
  /** Label tags configuration */
  labels: ILabelTag[];
  /** Link tags configuration */
  links: {
    [key: string]: ILinkTag;
  };
}

/**
 * Tag value types that can be extracted from a tag
 */
export type TagValue = string | number | boolean | object;

/**
 * Tag class to handle tag instances based on patterns
 */
export class Tag {
  private static configuration: ITagConfiguration;

  /**
   * Initialize the Tag configuration
   * @param config The tag configuration
   */
  public static initialize(config: ITagConfiguration): void {
    this.configuration = config;
  }

  /**
   * Get the current tag configuration
   */
  public static getConfiguration(): ITagConfiguration {
    return this.configuration;
  }

  /**
   * Safely extract and decode the value from a tag match
   * @param value The extracted value from regex match
   * @returns The processed value
   */
  private static processTagValue(value: string): TagValue {
    // If the value is a simple string without special characters, return as is
    if (/^[\w\-]+$/.test(value)) {
      return value;
    }

    try {
      // For more complex values, try to parse them
      // First check if it's a JSON object
      if ((value.startsWith('{') && value.endsWith('}')) || 
          (value.startsWith('[') && value.endsWith(']'))) {
        return JSON.parse(value);
      }
      
      // Check if it's a number
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return Number(value);
      }

      // Check if it's a boolean
      if (value === 'true' || value === 'false') {
        return value === 'true';
      }

      // For function-like strings or complex expressions, keep as string
      return value;
    } catch (error) {
      // If parsing fails, return as string
      console.warn(`Failed to parse tag value: ${value}`, error);
      return value;
    }
  }

  /**
   * Check if a tag matches any of the configured label patterns
   * @param tag The tag to check
   * @returns Label object if found, undefined otherwise
   */
  public static matchLabel(tag: string): Label | undefined {
    if (!this.configuration) {
      throw new Error('Tag configuration not initialized');
    }

    for (const label of this.configuration.labels) {
      for (const pattern of label.pattern) {
        try {
          const match = tag.match(pattern);
          
          if (match && match.length > 1) {
            return {
              name: label.name,
              value: String(this.processTagValue(match[1]))
            };
          }
        } catch (error) {
          console.warn(`Invalid pattern in label tag: ${pattern}`, error);
        }
      }
    }
    
    return undefined;
  }

  /**
   * Check if a tag matches any of the configured link patterns
   * @param tag The tag to check
   * @returns Link object if found, undefined otherwise
   */
  public static matchLink(tag: string): Link | undefined {
    if (!this.configuration) {
      throw new Error('Tag configuration not initialized');
    }

    for (const [type, link] of Object.entries(this.configuration.links)) {
      for (const pattern of link.pattern) {
        try {
          const match = tag.match(pattern);
          
          if (match && match.length > 1) {
            const value = match[1];
            let url: string;
            
            if (typeof link.urlTemplate === 'function') {
              url = link.urlTemplate(this.processTagValue(value));
            } else {
              url = link.urlTemplate.replace('%s', encodeURIComponent(value));
            }
            
            let name: string | undefined;
            if (link.nameTemplate) {
              name = link.nameTemplate.replace('%s', value);
            }
            
            return {
              type,
              url,
              name
            };
          }
        } catch (error) {
          console.warn(`Invalid pattern in link tag: ${pattern}`, error);
        }
      }
    }
    
    return undefined;
  }

  /**
   * Parse a tag and return its processed information
   * @param tag The tag to parse
   * @returns Object containing the parsed tag information
   */
  public static parse(tag: string): {
    original: string,
    label?: Label,
    link?: Link,
    value?: TagValue
  } {
    // Handle basic @tag format (without value)
    const basicTagMatch = /^@(\w+)$/.exec(tag);
    let value: TagValue | undefined = undefined;
    
    if (basicTagMatch) {
      value = true; // Simple flag tag
    } else {
      // Try to extract value from @tag:value format
      const valueTagMatch = /^@(\w+):(.+)$/.exec(tag);
      if (valueTagMatch) {
        value = this.processTagValue(valueTagMatch[2]);
      }
    }
    
    const result = {
      original: tag,
      label: this.matchLabel(tag),
      link: this.matchLink(tag),
      value
    };
    
    return result;
  }

  /**
   * Create a tag string from name and value
   * @param name Tag name (without @)
   * @param value Optional value to append
   * @returns Formatted tag string
   */
  public static create(name: string, value?: TagValue): string {
    if (value === undefined || value === true) {
      return `@${name}`;
    }
    
    if (typeof value === 'object') {
      return `@${name}:${JSON.stringify(value)}`;
    }
    
    return `@${name}:${value}`;
  }

  /**
   * Create an Allure label from name and value
   * @param name Label name
   * @param value Label value
   * @returns Allure Label object
   */
  public static createLabel(name: string, value: string): Label {
    return {
      name,
      value
    };
  }

  /**
   * Create an Allure link with type, name and url
   * @param url Link URL
   * @param name Optional link name
   * @param type Optional link type
   * @returns Allure Link object
   */
  public static createLink(url: string, name?: string, type?: string): Link {
    return {
      url,
      name,
      type
    };
  }

  /**
   * Generate tag configuration schema for validation with Zod
   */
  public static getConfigSchema(): z.ZodType<ITagConfiguration> {
    const linkTagSchema = z.object({
      pattern: z.array(z.instanceof(RegExp)),
      urlTemplate: z.union([
        z.string(),
        z.function().args(z.any()).returns(z.string())
      ]),
      nameTemplate: z.string().optional()
    });
    
    const labelTagSchema = z.object({
      pattern: z.array(z.instanceof(RegExp)),
      name: z.string()
    });
    
    return z.object({
      labels: z.array(labelTagSchema),
      links: z.record(z.string(), linkTagSchema)
    });
  }
}
