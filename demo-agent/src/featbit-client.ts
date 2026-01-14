import { FbClientBuilder } from '@featbit/node-server-sdk';
import type { IFbClient } from '@featbit/node-server-sdk';
import { featbitConfig } from './config';

/**
 * Initialize FeatBit client using best practices
 * - Uses FbClientBuilder for configuration
 * - Properly handles initialization errors
 * - Returns typed client instance
 */
export async function initializeFeatBit(): Promise<IFbClient> {
  console.log('🔧 Initializing FeatBit client...');
  console.log(`   SDK Key: ${featbitConfig.sdkKey.substring(0, 10)}...`);
  console.log(`   Streaming URI: ${featbitConfig.streamingUri}`);
  console.log(`   Events URI: ${featbitConfig.eventsUri}`);
  
  // Build FeatBit client with proper configuration
  const fbClient = new FbClientBuilder()
    .sdkKey(featbitConfig.sdkKey)
    .streamingUri(featbitConfig.streamingUri)
    .eventsUri(featbitConfig.eventsUri)
    .build();
  
  // Wait for initialization with error handling
  try {
    await fbClient.waitForInitialization();
    console.log('✅ FeatBit client initialized successfully\n');
  } catch (err) {
    console.error('❌ Failed to initialize FeatBit client:', err);
    throw err;
  }
  
  return fbClient;
}

/**
 * Close FeatBit client
 * Ensures all events are flushed before closing
 */
export async function closeFeatBit(client: IFbClient): Promise<void> {
  console.log('\n🔒 Closing FeatBit client...');
  // close() returns a Promise that resolves when events are flushed
  await client.close();
  console.log('✅ FeatBit client closed successfully');
}
