/**
 * Feature flag service implementation using FeatBit
 */

import { FbClientBuilder, UserBuilder } from '@featbit/node-server-sdk';
import type { IFbClient, IUser } from '@featbit/node-server-sdk';
import { IFeatureFlagService, IUserFactory, PromptConfig, ILogger, Result } from '../core/interfaces';
import { AppConfig } from '../core/config';

/**
 * User factory for creating FeatBit users
 */
export class UserFactory implements IUserFactory {
  createUser(userId: string, attributes: Record<string, string>): IUser {
    const builder = new UserBuilder(userId);
    
    // Add custom attributes
    Object.entries(attributes).forEach(([key, value]) => {
      builder.custom(key, value);
    });
    
    return builder.build();
  }
}

/**
 * FeatBit feature flag service
 */
export class FeatBitService implements IFeatureFlagService {
  private client: IFbClient | null = null;
  private readonly userFactory: IUserFactory;

  constructor(
    private readonly config: AppConfig,
    private readonly logger: ILogger,
    userFactory?: IUserFactory
  ) {
    this.userFactory = userFactory || new UserFactory();
  }

  /**
   * Initialize the FeatBit client
   */
  async initialize(): Promise<Result<void>> {
    try {
      this.logger.info('Initializing FeatBit client', {
        streamingUri: this.config.featbit.streamingUri,
        eventsUri: this.config.featbit.eventsUri,
      });

      this.client = new FbClientBuilder()
        .sdkKey(this.config.featbit.sdkKey)
        .streamingUri(this.config.featbit.streamingUri)
        .eventsUri(this.config.featbit.eventsUri)
        .build();

      await this.client.waitForInitialization();
      
      this.logger.info('FeatBit client initialized successfully');
      
      return { success: true, value: undefined };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Failed to initialize FeatBit client', err);
      return { success: false, error: err };
    }
  }

  /**
   * Get workflow combo for a user
   */
  async getWorkflowCombo(user: IUser): Promise<string> {
    if (!this.client) {
      throw new Error('FeatBit client not initialized');
    }

    try {
      const flag = await this.client.jsonVariation(
        this.config.flags.workflow,
        user,
        { combo: this.config.combos.baseline }
      );
      
      return (flag as { combo: string }).combo;
    } catch (error) {
      this.logger.warn('Failed to get workflow combo, using default', { error });
      return this.config.combos.baseline;
    }
  }

  /**
   * Get stage configuration from feature flag
   */
  async getStageConfig(flagKey: string, user: IUser): Promise<PromptConfig> {
    if (!this.client) {
      throw new Error('FeatBit client not initialized');
    }

    try {
      const config = await this.client.jsonVariation(
        flagKey,
        user,
        this.getDefaultConfig(flagKey)
      );
      
      return config as PromptConfig;
    } catch (error) {
      this.logger.warn(`Failed to get config for ${flagKey}, using default`, { error });
      return this.getDefaultConfig(flagKey);
    }
  }

  /**
   * Close the FeatBit client
   */
  async close(): Promise<void> {
    if (this.client) {
      this.logger.info('Closing FeatBit client');
      await this.client.close();
      this.client = null;
    }
  }

  /**
   * Get default configuration for a flag
   */
  private getDefaultConfig(flagKey: string): PromptConfig {
    const defaults: Record<string, PromptConfig> = {
      [this.config.flags.intentAnalysis]: {
        model: 'gpt-4',
        temperature: 0.7,
        systemPrompt: 'Classify customer inquiries',
      },
      [this.config.flags.infoRetrieval]: {
        model: 'gpt-4',
        temperature: 0.3,
        strategy: 'standard',
      },
      [this.config.flags.responseGeneration]: {
        model: 'gpt-4',
        temperature: 0.8,
        strategy: 'text',
      },
    };

    return defaults[flagKey] || {
      model: 'gpt-4',
      temperature: 0.5,
    };
  }
}
