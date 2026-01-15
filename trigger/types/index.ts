/**
 * Type definitions for the AI workflow
 */

/**
 * Customer inquiry data
 */
export interface CustomerInquiry {
  id: string;
  userId: string;
  type: 'critical' | 'feature' | 'integration' | 'quick';
  message: string;
}

/**
 * Intent analysis result
 */
export interface IntentResult {
  category: string;
  urgency: string;
  confidence: number;
}

/**
 * Information retrieval result
 */
export interface RetrievalResult {
  documents: string[];
  sources: string[];
}

/**
 * Final response
 */
export interface ResponseResult {
  message: string;
  format: 'text' | 'structured';
}

/**
 * Prompt configuration from feature flag
 */
export interface PromptConfig {
  model: string;
  temperature: number;
  systemPrompt?: string;
  strategy?: string;
}

/**
 * Workflow result
 */
export interface WorkflowResult {
  combo: string;
  intent: IntentResult;
  retrieval: RetrievalResult;
  response: ResponseResult;
  executionTimeMs: number;
}

/**
 * FeatBit client configuration
 */
export interface FbClientConfig {
  sdkKey: string;
  streamingUri?: string;
  eventsUri?: string;
}
