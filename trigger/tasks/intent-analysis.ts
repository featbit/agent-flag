/**
 * Stage 1 Task: Intent Analysis
 * Classifies customer inquiries using LLM with feature flag control
 */
import { logger, task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { IntentResult, PromptConfig } from "../types";
import { azure, azureModel } from "../config/azure";

export const analyzeIntentTask = task({
  id: "analyze-intent",
  machine: {
    preset: "small-1x",
  },
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload: { 
    message: string; 
    config: PromptConfig;
    inquiryId: string;
    userId: string;
  }) => {
    const { message, config, inquiryId, userId } = payload;

    try {
      const systemPrompt = config.systemPrompt || 
        `You are a customer support assistant. Analyze the customer inquiry and classify it into one of these categories: CRITICAL, FEATURE, INTEGRATION, QUICK.
Also determine the urgency level (high, medium, low) and provide a confidence score (0.0 to 1.0).

Respond in JSON format: { "category": "CATEGORY", "urgency": "URGENCY", "confidence": 0.95 }`;

      // Reasoning models (o1, o3, gpt-5.x) don't support temperature parameter
      const isReasoningModel = (config.model || azureModel).match(/o1|o3|gpt-5/i);
      
      const { text, usage } = await generateText({
        model: azure(config.model || azureModel),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        ...(isReasoningModel ? {} : { temperature: config.temperature }),
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let result: IntentResult;

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          category: parsed.category || 'FEATURE',
          urgency: parsed.urgency || 'medium',
          confidence: parsed.confidence || 0.85
        };
      } else {
        result = {
          category: 'FEATURE',
          urgency: 'medium',
          confidence: 0.75
        };
      }

      return result;
    } catch (error) {
      logger.error("❌ Intent analysis failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        inquiryId,
      });
      
      const fallbackResult: IntentResult = config.temperature < 0.6
        ? { category: 'CRITICAL', urgency: 'high', confidence: 0.5 }
        : { category: 'FEATURE', urgency: 'medium', confidence: 0.5 };

      logger.warn("⚠️ Using fallback intent", fallbackResult as unknown as Record<string, unknown>);
      return fallbackResult;
    }
  },
});
