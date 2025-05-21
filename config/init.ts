import { Tag } from "./env/validators/Tag";
import { tagConfig } from "./env/config.tags";
import {env} from "@config/env"
/**
 * Initialize application configurations
 */
export function initializeConfigurations(): void {
  // Initialize Tag configuration
  Tag.initialize(tagConfig);
  
  console.log("Configurations initialized successfully");
}

// Auto-initialize when imported
initializeConfigurations();
