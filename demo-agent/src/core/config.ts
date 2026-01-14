/**
 * Application configuration management
 * Centralized, type-safe configuration with validation
 */

import { z } from 'zod';

/**
 * Configuration schema using Zod for runtime validation
 */
const ConfigSchema = z.object({
  featbit: z.object({
    sdkKey: z.string().min(1, 'SDK Key is required'),
    streamingUri: z.string().url('Invalid streaming URI'),
    eventsUri: z.string().url('Invalid events URI'),
  }),
  flags: z.object({
    workflow: z.string().default('customer-support-workflow'),
    intentAnalysis: z.string().default('intent-analysis'),
    infoRetrieval: z.string().default('info-retrieval'),
    responseGeneration: z.string().default('response-generation'),
  }),
  combos: z.object({
    baseline: z.string().default('combo_a'),
    optimized: z.string().default('combo_b'),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

/**
 * Configuration loader with validation
 */
export class ConfigLoader {
  private static instance: AppConfig | null = null;

  static load(): AppConfig {
    if (this.instance) {
      return this.instance;
    }

    const rawConfig = {
      featbit: {
        sdkKey: process.env.FEATBIT_SDK_KEY,
        streamingUri: process.env.FEATBIT_STREAMING_URI || 'wss://global-eval.featbit.co',
        eventsUri: process.env.FEATBIT_EVENTS_URI || 'https://global-eval.featbit.co',
      },
      flags: {
        workflow: process.env.FLAG_WORKFLOW || 'customer-support-workflow',
        intentAnalysis: process.env.FLAG_INTENT_ANALYSIS || 'intent-analysis',
        infoRetrieval: process.env.FLAG_INFO_RETRIEVAL || 'info-retrieval',
        responseGeneration: process.env.FLAG_RESPONSE_GENERATION || 'response-generation',
      },
      combos: {
        baseline: process.env.COMBO_BASELINE || 'combo_a',
        optimized: process.env.COMBO_OPTIMIZED || 'combo_b',
      },
      logging: {
        level: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
      },
    };

    // Validate configuration
    const result = ConfigSchema.safeParse(rawConfig);
    
    if (!result.success) {
      console.error('❌ Configuration validation failed:', result.error.format());
      throw new Error('Invalid configuration');
    }

    this.instance = result.data;
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }
}
