/**
 * Stage 3 Task: Response Generation
 * Generates customer-facing response using LLM with feature flag control
 */
import { logger, task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { IntentResult, RetrievalResult, ResponseResult, PromptConfig } from "../types";
import { azure, azureModel } from "../config/azure";

export const generateResponseTask = task({
  id: "generate-response",
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
    retrieval: RetrievalResult;
    config: PromptConfig;
    inquiryId: string;
  }) => {
    const { intent, retrieval, config, inquiryId } = payload;

    try {
      const isStructured = config.strategy === 'structured';
      
      const systemPrompt = isStructured
        ? `You are a customer support response generator. Generate a structured JSON response for the customer.

Intent: ${intent.category} (${intent.urgency} urgency, ${intent.confidence} confidence)
Available Documents: ${retrieval.documents.join(', ')}
Sources: ${retrieval.sources.join(', ')}

Respond in JSON format: { "greeting": "...", "assessment": "...", "action": "...", "resources": [...], "ticketId": "TKT-12345" }`
        : `You are a customer support response generator. Generate a helpful text response for the customer.

Intent: ${intent.category} (${intent.urgency} urgency)
Available Documents: ${retrieval.documents.length} relevant documents found
Sources: ${retrieval.sources.join(', ')}

Generate a concise, professional response explaining how we can help.`;

      // Reasoning models (o1, o3, gpt-5.x) don't support temperature parameter
      const isReasoningModel = (config.model || azureModel).match(/o1|o3|gpt-5/i);
      
      const { text, usage } = await generateText({
        model: azure(config.model || azureModel),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a ${isStructured ? 'structured JSON' : 'text'} response for this support inquiry.` }
        ],
        ...(isReasoningModel ? {} : { temperature: config.temperature }),
      });

      let result: ResponseResult;

      if (isStructured) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        result = {
          message: jsonMatch ? jsonMatch[0] : JSON.stringify({
            greeting: "Thank you for contacting support",
            assessment: `We've identified this as a ${intent.category} inquiry`,
            action: "Our team will assist you shortly",
            resources: retrieval.documents,
            ticketId: `TKT-${Date.now()}`
          }),
          format: 'structured'
        };
      } else {
        result = {
          message: text,
          format: 'text'
        };
      }

      return result;
    } catch (error) {
      logger.error("❌ Response generation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        inquiryId,
      });
      
      const fallbackResult: ResponseResult = {
        message: "Thank you for your inquiry. Our support team will review your request and respond shortly.",
        format: 'text'
      };

      logger.warn("⚠️ Using fallback response", fallbackResult as unknown as Record<string, unknown>);
      return fallbackResult;
    }
  },
});
