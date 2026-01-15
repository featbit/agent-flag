/**
 * Stage 2 Task: Information Retrieval
 * Retrieves relevant knowledge base documents using LLM with feature flag control
 */
import { logger, task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { IntentResult, RetrievalResult, PromptConfig } from "../types";
import { azure, azureModel } from "../config/azure";

export const retrieveInformationTask = task({
  id: "retrieve-information",
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
    intent: IntentResult;
    config: PromptConfig;
    inquiryId: string;
  }) => {
    const { intent, config, inquiryId } = payload;

    try {
      const systemPrompt = `You are a knowledge base retrieval assistant. Based on the customer inquiry category and urgency, identify relevant knowledge base articles.

Category: ${intent.category}
Urgency: ${intent.urgency}
Confidence: ${intent.confidence}

Respond with a JSON array of relevant document IDs and sources.
Format: { "documents": ["KB-001", "KB-045"], "sources": ["knowledge-base", "vector-db"] }`;

      // Reasoning models (o1, o3, gpt-5.x) don't support temperature parameter
      const isReasoningModel = (config.model || azureModel).match(/o1|o3|gpt-5/i);
      
      const { text, usage } = await generateText({
        model: azure(config.model || azureModel),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Find relevant documents for a ${intent.category} inquiry with ${intent.urgency} urgency.` }
        ],
        ...(isReasoningModel ? {} : { temperature: config.temperature }),
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let result: RetrievalResult;

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result = {
          documents: parsed.documents || ['KB-001', 'KB-045'],
          sources: parsed.sources || ['knowledge-base']
        };
      } else {
        const isRAG = config.strategy === 'rag';
        result = isRAG
          ? {
              documents: [
                'KB-001: Critical Issue Resolution Guide',
                'KB-045: Production Incident Procedures',
                'KB-089: Emergency Contact List'
              ],
              sources: ['vector-db', 'knowledge-base']
            }
          : {
              documents: [
                'KB-012: Feature Request Guidelines',
                'KB-034: Standard Support Process'
              ],
              sources: ['knowledge-base']
            };
      }

      return result;
    } catch (error) {
      logger.error("❌ Information retrieval failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        inquiryId,
      });
      
      const fallbackResult: RetrievalResult = {
        documents: ['KB-001: General Support'],
        sources: ['knowledge-base']
      };

      logger.warn("⚠️ Using fallback retrieval", fallbackResult as unknown as Record<string, unknown>);
      return fallbackResult;
    }
  },
});
