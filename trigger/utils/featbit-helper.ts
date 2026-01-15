/**
 * FeatBit Client Helper for Trigger.dev Tasks
 */
import { IFbClient, FbClientBuilder } from '@featbit/node-server-sdk';
import { logger } from "@trigger.dev/sdk";
import { FEATBIT_CONFIG } from '../config/featbit';
import type { FbClientConfig } from '../types';

let globalFbClient: IFbClient | null = null;

/**
 * Initialize FeatBit client singleton
 */
export async function initFeatBitClient(): Promise<IFbClient> {
  if (globalFbClient) {
    return globalFbClient;
  }

  if (!FEATBIT_CONFIG.sdkKey) {
    throw new Error('FEATBIT_SDK_KEY environment variable is required');
  }

  logger.info('🔧 Initializing FeatBit client...');

  const client = new FbClientBuilder()
    .sdkKey(FEATBIT_CONFIG.sdkKey)
    .streamingUri(FEATBIT_CONFIG.streamingUri)
    .eventsUri(FEATBIT_CONFIG.eventsUri)
    .build();

  await client.waitForInitialization();

  logger.info('✅ FeatBit client initialized');

  globalFbClient = client;
  return client;
}

/**
 * Get the FeatBit client instance
 */
export function getFeatBitClient(): IFbClient {
  if (!globalFbClient) {
    throw new Error('FeatBit client not initialized. Call initFeatBitClient() first.');
  }
  return globalFbClient;
}

/**
 * Close the FeatBit client
 */
export async function closeFeatBitClient(): Promise<void> {
  if (globalFbClient) {
    logger.info('🔒 Closing FeatBit client...');
    await globalFbClient.close();
    globalFbClient = null;
    logger.info('✅ FeatBit client closed');
  }
}

/**
 * Get FeatBit client configuration
 */
export function getFbClientConfig(): FbClientConfig {
  return {
    sdkKey: FEATBIT_CONFIG.sdkKey,
    streamingUri: FEATBIT_CONFIG.streamingUri,
    eventsUri: FEATBIT_CONFIG.eventsUri,
  };
}

/**
 * Create FeatBit client from configuration
 */
export async function createFbClientFromConfig(config: FbClientConfig): Promise<IFbClient> {
  const client = new FbClientBuilder()
    .sdkKey(config.sdkKey)
    .streamingUri(config.streamingUri || 'wss://global-eval.featbit.co')
    .eventsUri(config.eventsUri || 'https://global-eval.featbit.co')
    .build();

  await client.waitForInitialization();
  return client;
}
