/**
 * Main Orchestrator Workflow: Customer Inquiry
 * Coordinates the 3-stage workflow with FeatBit feature flags
 */
import { logger, task } from "@trigger.dev/sdk";
import { UserBuilder } from "@featbit/node-server-sdk";
import type { IFbClient } from "@featbit/node-server-sdk";
import { CustomerInquiry, WorkflowResult, PromptConfig } from "../types";
import { FLAG_KEYS } from "../config/featbit";
import { analyzeIntentTask } from "../tasks/intent-analysis";
import { retrieveInformationTask } from "../tasks/info-retrieval";
import { generateResponseTask } from "../tasks/response-generation";
import { initFeatBitClient } from "../utils/featbit-helper";

// Default configurations
const DEFAULT_CONFIGS = {
  intent: {
    model: "gpt-4",
    temperature: 0.7,
    systemPrompt: "Classify customer inquiries",
  } as PromptConfig,
  retrieval: {
    model: "gpt-4",
    temperature: 0.3,
    strategy: "standard",
  } as PromptConfig,
  response: {
    model: "gpt-4",
    temperature: 0.8,
    strategy: "text",
  } as PromptConfig,
};

export const processCustomerInquiry = task({
  id: "process-customer-inquiry",
  retry: {
    maxAttempts: 5,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: { inquiry: CustomerInquiry; fbClient?: IFbClient }) => {
    const { inquiry } = payload;
    const fbClient = payload.fbClient ?? (await initFeatBitClient());
    const startTime = Date.now();

    logger.info("🚀 Starting Customer Inquiry Workflow", {
      inquiryId: inquiry.id,
      userId: inquiry.userId,
      type: inquiry.type,
      messagePreview: inquiry.message.substring(0, 50) + "...",
    });

    try {
      // Step 1: Get Workflow Combo from FeatBit
      const combo = (await fbClient.stringVariation(
        FLAG_KEYS.workflow,
        new UserBuilder(inquiry.userId)
          .custom("inquiryType", inquiry.type)
          .build(),
        "combo_a"
      )) as string;

      logger.info("🎲 Feature Flag Combo Assigned", {
        combo,
        userId: inquiry.userId,
      });

      // Step 2: Build User Context with Combo
      const comboContext = new UserBuilder(inquiry.userId)
        .custom("inquiryType", inquiry.type)
        .custom("combo", combo)
        .build();

      // Step 3: Execute Stage 1 - Intent Analysis
      const intentConfig = (await fbClient.jsonVariation(
        FLAG_KEYS.intentAnalysis,
        comboContext,
        DEFAULT_CONFIGS.intent
      )) as PromptConfig;
      logger.info("📋 Stage 1 Config Retrieved", {
        model: intentConfig.model,
        temperature: intentConfig.temperature,
      });
      const intentHandle = await analyzeIntentTask.triggerAndWait({
        message: inquiry.message,
        config: intentConfig,
        inquiryId: inquiry.id,
        userId: inquiry.userId,
      });
      if (!intentHandle.ok) {
        logger.error("❌ Stage 1 Failed", {
          error: intentHandle.error,
          runId: intentHandle.id,
        });
        throw new Error(`Intent Analysis failed: ${intentHandle.error}`);
      }

      const intent = intentHandle.output;
      logger.info("✅ Stage 1 Complete", {
        category: intent.category,
        urgency: intent.urgency,
        confidence: intent.confidence,
      });

      // Step 4: Execute Stage 2 - Information Retrieval
      const retrievalConfig = (await fbClient.jsonVariation(
        FLAG_KEYS.infoRetrieval,
        comboContext,
        DEFAULT_CONFIGS.retrieval
      )) as PromptConfig;
      logger.info("📋 Stage 2 Config Retrieved", {
        model: retrievalConfig.model,
        strategy: retrievalConfig.strategy,
      });
      const retrievalHandle = await retrieveInformationTask.triggerAndWait({
        intent,
        config: retrievalConfig,
        inquiryId: inquiry.id,
      });
      if (!retrievalHandle.ok) {
        logger.error("❌ Stage 2 Failed", {
          error: retrievalHandle.error,
          runId: retrievalHandle.id,
        });
        throw new Error(
          `Information Retrieval failed: ${retrievalHandle.error}`
        );
      }

      const retrieval = retrievalHandle.output;
      logger.info("✅ Stage 2 Complete", {
        documentCount: retrieval.documents.length,
        sources: retrieval.sources.join(", "),
      });

      // Step 5: Execute Stage 3 - Response Generation
      const responseConfig = (await fbClient.jsonVariation(
        FLAG_KEYS.responseGeneration,
        comboContext,
        DEFAULT_CONFIGS.response
      )) as PromptConfig;
      logger.info("📋 Stage 3 Config Retrieved", {
        model: responseConfig.model,
        strategy: responseConfig.strategy,
      });
      const responseHandle = await generateResponseTask.triggerAndWait({
        intent,
        retrieval,
        config: responseConfig,
        inquiryId: inquiry.id,
      });
      if (!responseHandle.ok) {
        logger.error("❌ Stage 3 Failed", {
          error: responseHandle.error,
          runId: responseHandle.id,
        });
        throw new Error(`Response Generation failed: ${responseHandle.error}`);
      }

      const response = responseHandle.output;
      logger.info("✅ Stage 3 Complete", {
        format: response.format,
        messageLength: response.message.length,
      });

      // Step 6: Return Complete Workflow Result
      const executionTimeMs = Date.now() - startTime;
      const result: WorkflowResult = {
        combo,
        intent,
        retrieval,
        response,
        executionTimeMs,
      };

      logger.info("🎉 Workflow Complete", {
        inquiryId: inquiry.id,
        executionTimeMs,
        combo,
        category: intent.category,
      });

      return result;
    } catch (error) {
      logger.error("💥 Workflow Failed", {
        inquiryId: inquiry.id,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTimeMs: Date.now() - startTime,
      });
      throw error;
    }
  },
});
