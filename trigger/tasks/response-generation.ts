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

    logger.info("✍️ Stage 3: Response Generation starting", {
      inquiryId,
      strategy: config.strategy,
      documentCount: retrieval.documents.length,
    });

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

      const { text, usage } = await generateText({
        model: azure(config.model || azureModel),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a ${isStructured ? 'structured JSON' : 'text'} response for this support inquiry.` }
        ],
        temperature: config.temperature,
      });

      logger.info("🤖 LLM Response received", {
        tokens: usage,
        responseLength: text.length,
        format: isStructured ? 'structured' : 'text',
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

      logger.info("✅ Response Generation complete", {
        format: result.format,
        messageLength: result.message.length,
      });

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
