/**
 * Trigger.dev Tasks Export
 * 
 * Main entry point for all Trigger.dev workflows and tasks
 */

// Export main workflow
export { processCustomerInquiry } from "./workflows/customer-inquiry";

// Export individual tasks
export { analyzeIntentTask } from "./tasks/intent-analysis";
export { retrieveInformationTask } from "./tasks/info-retrieval";
export { generateResponseTask } from "./tasks/response-generation";

// Export utilities
export {
  initFeatBitClient,
  getFeatBitClient,
  closeFeatBitClient,
  getFbClientConfig,
  createFbClientFromConfig,
} from "./utils/featbit-helper";

// Export types
export type {
  CustomerInquiry,
  IntentResult,
  RetrievalResult,
  ResponseResult,
  PromptConfig,
  WorkflowResult,
  FbClientConfig,
} from "./types";

// Export configurations
export { FLAG_KEYS, WORKFLOW_COMBOS, FEATBIT_CONFIG } from "./config/featbit";
export { azure, azureModel } from "./config/azure";
