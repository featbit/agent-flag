import { IntentResult, RetrievalResult, ResponseResult, PromptConfig } from '../types';
import { azure, azureModel } from '../azure-config';
import { generateText } from 'ai';

/**
 * Stage 3: Response Generation
 * Generates customer-facing response using real LLM
 */
export async function generateResponse(
  intent: IntentResult,
  retrieval: RetrievalResult,
  config: PromptConfig
): Promise<ResponseResult> {
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

    const { text } = await generateText({
      model: azure(config.model || azureModel),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a ${isStructured ? 'structured JSON' : 'text'} response for this support inquiry.` }
      ],
      temperature: config.temperature,
    });

    if (isStructured) {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return {
          message: jsonMatch[0],
          format: 'structured'
        };
      }
      // Fallback structured response
      return {
        message: JSON.stringify({
          greeting: 'Thank you for contacting support',
          assessment: `We've identified this as a ${intent.category} issue`,
          action: 'Our team will respond within 1 hour',
          resources: retrieval.documents,
          ticketId: 'TKT-' + Math.floor(10000 + Math.random() * 90000)
        }, null, 2),
        format: 'structured'
      };
    } else {
      return {
        message: text.trim(),
        format: 'text'
      };
    }
  } catch (error) {
    console.error('Response generation failed:', error);
    // Fallback to strategy-based logic
    const isStructured = config.strategy === 'structured';
    return isStructured
      ? {
          message: JSON.stringify({
            greeting: 'Thank you for contacting support',
            assessment: `We've identified this as a ${intent.category} issue`,
            action: 'Our team will respond within 1 hour',
            resources: retrieval.documents,
            ticketId: 'TKT-12345'
          }, null, 2),
          format: 'structured'
        }
      : {
          message: `Thank you for contacting support. We've identified this as a ${intent.category} issue. Based on our knowledge base, we found ${retrieval.documents.length} relevant documents. Our team will respond shortly.`,
          format: 'text'
        };
  }
}
