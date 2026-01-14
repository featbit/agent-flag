import { IntentResult, PromptConfig } from '../types';
import { azure, azureModel } from '../azure-config';
import { generateText } from 'ai';

/**
 * Stage 1: Intent Analysis
 * Classifies customer inquiries into categories using real LLM
 */
export async function analyzeIntent(
  message: string,
  config: PromptConfig
): Promise<IntentResult> {
  try {
    const systemPrompt = config.systemPrompt || `You are a customer support assistant. Analyze the customer inquiry and classify it into one of these categories: CRITICAL, FEATURE, INTEGRATION, QUICK.
Also determine the urgency level (high, medium, low) and provide a confidence score (0.0 to 1.0).

Respond in JSON format: { "category": "CATEGORY", "urgency": "URGENCY", "confidence": 0.95 }`;

    const { text } = await generateText({
      model: azure(config.model || azureModel),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: config.temperature,
    });

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        category: parsed.category || 'FEATURE',
        urgency: parsed.urgency || 'medium',
        confidence: parsed.confidence || 0.85
      };
    }

    // Fallback if parsing fails
    return {
      category: 'FEATURE',
      urgency: 'medium',
      confidence: 0.75
    };
  } catch (error) {
    console.error('Intent analysis failed:', error);
    // Fallback to temperature-based logic
    const result: IntentResult = config.temperature < 0.6
      ? {
          category: 'CRITICAL',
          urgency: 'high',
          confidence: 0.95
        }
      : {
          category: 'FEATURE',
          urgency: 'medium',
          confidence: 0.85
        };
    return result;
  }
}
