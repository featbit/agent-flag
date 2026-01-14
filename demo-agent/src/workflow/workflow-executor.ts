/**
 * Workflow Executor
 * Orchestrates the multi-stage workflow with dependency injection
 */

import { UserBuilder } from '@featbit/node-server-sdk';
import {
  IWorkflowExecutor,
  IFeatureFlagService,
  ILogger,
  CustomerInquiry,
  WorkflowResult,
  Result,
} from '../core/interfaces';
import { IntentAnalysisProcessor } from '../processors/intent-analysis.processor';
import { InfoRetrievalProcessor } from '../processors/info-retrieval.processor';
import { ResponseGenerationProcessor } from '../processors/response-generation.processor';
import { AppConfig } from '../core/config';

export class WorkflowExecutor implements IWorkflowExecutor {
  private readonly intentProcessor: IntentAnalysisProcessor;
  private readonly retrievalProcessor: InfoRetrievalProcessor;
  private readonly responseProcessor: ResponseGenerationProcessor;

  constructor(
    private readonly flagService: IFeatureFlagService,
    private readonly logger: ILogger,
    private readonly config: AppConfig
  ) {
    // Initialize processors with logger dependency
    this.intentProcessor = new IntentAnalysisProcessor(logger);
    this.retrievalProcessor = new InfoRetrievalProcessor(logger);
    this.responseProcessor = new ResponseGenerationProcessor(logger);
  }

  async execute(inquiry: CustomerInquiry): Promise<Result<WorkflowResult>> {
    const startTime = Date.now();

    try {
      this.logger.info(`🚀 Processing inquiry: ${inquiry.id}`, {
        userId: inquiry.userId,
        type: inquiry.type,
      });

      // Step 1: Create user for feature flag evaluation
      const user = new UserBuilder(inquiry.userId)
        .custom('inquiryType', inquiry.type)
        .build();

      // Step 2: Get workflow combo
      const combo = await this.flagService.getWorkflowCombo(user);
      this.logger.info(`Assigned combo: ${combo}`);

      // Step 3: Create user with combo context
      const userWithCombo = new UserBuilder(inquiry.userId)
        .custom('inquiryType', inquiry.type)
        .custom('combo', combo)
        .build();

      // Step 4: Execute Stage 1 - Intent Analysis
      const intentConfig = await this.flagService.getStageConfig(
        this.config.flags.intentAnalysis,
        userWithCombo
      );
      const intentResult = await this.intentProcessor.execute(inquiry.message, intentConfig);
      
      if (!intentResult.success) {
        return { success: false, error: intentResult.error };
      }

      // Step 5: Execute Stage 2 - Information Retrieval
      const retrievalConfig = await this.flagService.getStageConfig(
        this.config.flags.infoRetrieval,
        userWithCombo
      );
      const retrievalResult = await this.retrievalProcessor.execute(
        intentResult.value,
        retrievalConfig
      );

      if (!retrievalResult.success) {
        return { success: false, error: retrievalResult.error };
      }

      // Step 6: Execute Stage 3 - Response Generation
      const responseConfig = await this.flagService.getStageConfig(
        this.config.flags.responseGeneration,
        userWithCombo
      );
      const responseResult = await this.responseProcessor.execute(
        {
          intent: intentResult.value,
          retrieval: retrievalResult.value,
        },
        responseConfig
      );

      if (!responseResult.success) {
        return { success: false, error: responseResult.error };
      }

      // Step 7: Build workflow result
      const executionTimeMs = Date.now() - startTime;
      const result: WorkflowResult = {
        inquiryId: inquiry.id,
        combo,
        intent: intentResult.value,
        retrieval: retrievalResult.value,
        response: responseResult.value,
        executionTimeMs,
      };

      this.logger.info(`✅ Workflow completed successfully`, {
        inquiryId: inquiry.id,
        executionTimeMs,
      });

      return { success: true, value: result };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Workflow execution failed for inquiry ${inquiry.id}`, err);
      return { success: false, error: err };
    }
  }
}
