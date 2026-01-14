/**
 * Core domain interfaces for the Agent Flag system
 * These define the contracts that all implementations must follow
 */

import type { IFbClient, IUser } from '@featbit/node-server-sdk';

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Base interface for all stage processors
 */
export interface IStageProcessor<TInput, TOutput> {
  readonly stageName: string;
  execute(input: TInput, config: PromptConfig): Promise<Result<TOutput>>;
}

/**
 * Feature flag service interface
 */
export interface IFeatureFlagService {
  getWorkflowCombo(user: IUser): Promise<string>;
  getStageConfig(flagKey: string, user: IUser): Promise<PromptConfig>;
  close(): Promise<void>;
}

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Customer inquiry domain model
 */
export interface CustomerInquiry {
  readonly id: string;
  readonly userId: string;
  readonly type: InquiryType;
  readonly message: string;
  readonly timestamp?: Date;
}

export type InquiryType = 'critical' | 'feature' | 'integration' | 'quick';

/**
 * Intent analysis result
 */
export interface IntentResult {
  readonly category: string;
  readonly urgency: string;
  readonly confidence: number;
}

/**
 * Information retrieval result
 */
export interface RetrievalResult {
  readonly documents: readonly string[];
  readonly sources: readonly string[];
}

/**
 * Response generation result
 */
export interface ResponseResult {
  readonly message: string;
  readonly format: ResponseFormat;
}

export type ResponseFormat = 'text' | 'structured';

/**
 * Prompt configuration from feature flags
 */
export interface PromptConfig {
  readonly model: string;
  readonly temperature: number;
  readonly systemPromptUrl?: string;
  readonly systemPrompt?: string;
  readonly strategy?: string;
}

/**
 * Complete workflow execution result
 */
export interface WorkflowResult {
  readonly inquiryId: string;
  readonly combo: string;
  readonly intent: IntentResult;
  readonly retrieval: RetrievalResult;
  readonly response: ResponseResult;
  readonly executionTimeMs: number;
}

/**
 * Workflow executor interface
 */
export interface IWorkflowExecutor {
  execute(inquiry: CustomerInquiry): Promise<Result<WorkflowResult>>;
}

/**
 * User builder interface for creating FeatBit users
 */
export interface IUserFactory {
  createUser(userId: string, attributes: Record<string, string>): IUser;
}
