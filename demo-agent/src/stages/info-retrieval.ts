import { IntentResult, RetrievalResult, PromptConfig } from '../types';
import { azure, azureModel } from '../azure-config';
import { generateText } from 'ai';

/**
 * Stage 2: Information Retrieval
 * Retrieves relevant information based on intent using real LLM
 */
export async function retrieveInformation(
  intent: IntentResult,
  config: PromptConfig
): Promise<RetrievalResult> {
  try {
    const systemPrompt = `You are a knowledge base retrieval assistant. Based on the customer inquiry category and urgency, identify relevant knowledge base articles.

Category: ${intent.category}
Urgency: ${intent.urgency}
Confidence: ${intent.confidence}

Respond with a JSON array of relevant document IDs and sources.
Format: { "documents": ["KB-001", "KB-045"], "sources": ["knowledge-base", "vector-db"] }`;

    const { text } = await generateText({
      model: azure(config.model || azureModel),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Find relevant documents for a ${intent.category} inquiry with ${intent.urgency} urgency.` }
      ],
      temperature: config.temperature,
    });

    // Parse the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        documents: parsed.documents || ['KB-001', 'KB-045'],
        sources: parsed.sources || ['knowledge-base']
      };
    }

    // Fallback based on strategy
    const isRAG = config.strategy === 'rag';
    return isRAG
      ? {
          documents: [
            'KB-001: Critical Issue Resolution Guide',
            'KB-045: Production Incident Procedures',
            'KB-089: Emergency Contact List'
          ],
          sources: ['knowledge-base', 'vector-db', 'recent-tickets']
        }
      : {
          documents: [
            'KB-001: Critical Issue Resolution Guide',
            'KB-045: Production Incident Procedures'
          ],
          sources: ['knowledge-base']
        };
  } catch (error) {
    console.error('Information retrieval failed:', error);
    // Fallback to strategy-based logic
    const isRAG = config.strategy === 'rag';
    return isRAG
      ? {
          documents: [
            'KB-001: Critical Issue Resolution Guide',
            'KB-045: Production Incident Procedures',
            'KB-089: Emergency Contact List'
          ],
          sources: ['knowledge-base', 'vector-db', 'recent-tickets']
        }
      : {
          documents: [
            'KB-001: Critical Issue Resolution Guide',
            'KB-045: Production Incident Procedures'
          ],
          sources: ['knowledge-base']
        };
  }
}
