/**
 * Information Retrieval Stage Processor
 */

import { IStageProcessor, IntentResult, RetrievalResult, PromptConfig, ILogger, Result } from '../core/interfaces';

export class InfoRetrievalProcessor implements IStageProcessor<IntentResult, RetrievalResult> {
  readonly stageName = 'Information Retrieval';

  constructor(private readonly logger: ILogger) {}

  async execute(intent: IntentResult, config: PromptConfig): Promise<Result<RetrievalResult>> {
    try {
      this.logger.info(`📚 [Stage 2] ${this.stageName}`, {
        model: config.model,
        strategy: config.strategy,
        intentCategory: intent.category,
      });

      // Mock implementation - in production, this would query a knowledge base
      const isRAG = config.strategy === 'rag';

      const result: RetrievalResult = isRAG
        ? {
            documents: [
              'KB-001: Critical Issue Resolution Guide',
              'KB-045: Production Incident Procedures',
              'KB-089: Emergency Contact List',
            ],
            sources: ['knowledge-base', 'vector-db', 'recent-tickets'],
          }
        : {
            documents: [
              'KB-001: Critical Issue Resolution Guide',
              'KB-045: Production Incident Procedures',
            ],
            sources: ['knowledge-base'],
          };

      this.logger.debug(`Retrieved ${result.documents.length} documents`);

      return { success: true, value: result };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Information retrieval failed', err);
      return { success: false, error: err };
    }
  }
}
