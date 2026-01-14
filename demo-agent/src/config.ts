/**
 * FeatBit SDK Configuration
 * 
 * Configuration is loaded from environment variables for security
 * Create a .env file in the project root with your credentials
 */
export const featbitConfig = {
  // Your FeatBit environment secret key (SDK Key)
  sdkKey: process.env.FEATBIT_SDK_KEY || '_Gmd7OF3FECJsGwmd_f1nQ19IYD1kroUu27N-wKg9Kyw',
  
  // FeatBit streaming endpoint (WebSocket)
  streamingUri: process.env.FEATBIT_STREAMING_URI || 'wss://global-eval.featbit.co',
  
  // FeatBit events endpoint
  eventsUri: process.env.FEATBIT_EVENTS_URI || 'https://global-eval.featbit.co'
};

/**
 * Feature Flag Keys
 */
export const flagKeys = {
  // Workflow-level flag (determines which combo to use)
  workflow: 'customer-support-workflow',
  
  // Stage-level flags (determine specific prompt versions)
  intentAnalysis: 'intent-analysis',
  infoRetrieval: 'info-retrieval',
  responseGeneration: 'response-generation'
};

/**
 * Workflow Combinations
 */
export const workflowCombos = {
  COMBO_A: 'combo_a',  // Baseline
  COMBO_B: 'combo_b'   // Optimized
};
