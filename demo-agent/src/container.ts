/**
 * Application container for dependency injection
 * Manages lifecycle of all services and dependencies
 */

import { IWorkflowExecutor, IFeatureFlagService, ILogger } from '../core/interfaces';
import { AppConfig, ConfigLoader } from '../core/config';
import { ConsoleLogger } from '../core/logger';
import { FeatBitService } from '../services/feature-flag.service';
import { WorkflowExecutor } from '../workflow/workflow-executor';

export class AppContainer {
  private static instance: AppContainer | null = null;
  
  private readonly _config: AppConfig;
  private readonly _logger: ILogger;
  private readonly _flagService: IFeatureFlagService;
  private readonly _workflowExecutor: IWorkflowExecutor;
  private _initialized = false;

  private constructor() {
    // Load configuration
    this._config = ConfigLoader.load();

    // Create logger
    this._logger = new ConsoleLogger(this._config.logging.level);

    // Create feature flag service
    this._flagService = new FeatBitService(this._config, this._logger);

    // Create workflow executor
    this._workflowExecutor = new WorkflowExecutor(
      this._flagService,
      this._logger,
      this._config
    );
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AppContainer {
    if (!this.instance) {
      this.instance = new AppContainer();
    }
    return this.instance;
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    this._logger.info('Initializing application...');

    // Initialize FeatBit service
    const result = await (this._flagService as FeatBitService).initialize();
    
    if (!result.success) {
      throw new Error('Failed to initialize FeatBit service');
    }

    this._initialized = true;
    this._logger.info('Application initialized successfully');
  }

  /**
   * Shutdown all services
   */
  async shutdown(): Promise<void> {
    if (!this._initialized) {
      return;
    }

    this._logger.info('Shutting down application...');

    // Close FeatBit service
    await this._flagService.close();

    this._initialized = false;
    this._logger.info('Application shut down successfully');
  }

  /**
   * Get workflow executor
   */
  get workflowExecutor(): IWorkflowExecutor {
    if (!this._initialized) {
      throw new Error('Application not initialized. Call initialize() first.');
    }
    return this._workflowExecutor;
  }

  /**
   * Get logger
   */
  get logger(): ILogger {
    return this._logger;
  }

  /**
   * Get configuration
   */
  get config(): AppConfig {
    return this._config;
  }

  /**
   * Reset singleton (useful for testing)
   */
  static reset(): void {
    this.instance = null;
    ConfigLoader.reset();
  }
}
