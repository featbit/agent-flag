/**
 * FeatBit Configuration
 */

export const FEATBIT_CONFIG = {
  sdkKey: process.env.FEATBIT_SDK_KEY || '',
  streamingUri: process.env.FEATBIT_STREAMING_URI || 'wss://global-eval.featbit.co',
  eventsUri: process.env.FEATBIT_EVENTS_URI || 'https://global-eval.featbit.co',
};

export const FLAG_KEYS = {
  workflow: 'demo-trigger-dev',
  intentAnalysis: 'intent-analysis',
  infoRetrieval: 'info-retrieval',
  responseGeneration: 'response-generation',
};

export const WORKFLOW_COMBOS = {
  COMBO_A: 'combo_a',
  COMBO_B: 'combo_b',
};