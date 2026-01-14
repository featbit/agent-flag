/**
 * Optimized demo with TypeScript best practices
 * All in one file for simplicity while maintaining clean architecture
 */

import 'dotenv/config';
import { FbClientBuilder, UserBuilder } from '@featbit/node-server-sdk';
import type { IFbClient, IUser } from '@featbit/node-server-sdk';
import { z } from 'zod';
import { azure, azureModel } from './azure-config';
import { generateText } from 'ai';

// ==================== Configuration ====================

const ConfigSchema = z.object({
  featbit: z.object({
    sdkKey: z.string().min(1),
    streamingUri: z.string().url(),
    eventsUri: z.string().url(),
  }),
  flags: z.object({
    workflow: z.string().default('customer-support-workflow'),
    intentAnalysis: z.string().default('intent-analysis'),
    infoRetrieval: z.string().default('info-retrieval'),
    responseGeneration: z.string().default('response-generation'),
  }),
});

type AppConfig = z.infer<typeof ConfigSchema>;

function loadConfig(): AppConfig {
  const rawConfig = {
    featbit: {
      sdkKey: process.env.FEATBIT_SDK_KEY,
      streamingUri: process.env.FEATBIT_STREAMING_URI || 'wss://global-eval.featbit.co',
      eventsUri: process.env.FEATBIT_EVENTS_URI || 'https://global-eval.featbit.co',
    },
    flags: {
      workflow: 'customer-support-workflow',
      intentAnalysis: 'intent-analysis',
      infoRetrieval: 'info-retrieval',
      responseGeneration: 'response-generation',
    },
  };

  const result = ConfigSchema.safeParse(rawConfig);
  if (!result.success) {
    console.error('❌ Configuration validation failed:', result.error.format());
    throw new Error('Invalid configuration');
  }

  return result.data;
}

// ==================== Interfaces ====================

interface CustomerInquiry {
  readonly id: string;
  readonly userId: string;
  readonly type: 'critical' | 'feature' | 'integration' | 'quick';
  readonly message: string;
}

interface PromptConfig {
  readonly model: string;
  readonly temperature: number;
  readonly systemPrompt?: string;
  readonly strategy?: string;
}

interface IntentResult {
  readonly category: string;
  readonly urgency: string;
  readonly confidence: number;
}

interface RetrievalResult {
  readonly documents: readonly string[];
  readonly sources: readonly string[];
}

interface ResponseResult {
  readonly message: string;
  readonly format: 'text' | 'structured';
}

interface WorkflowResult {
  readonly inquiryId: string;
  readonly combo: string;
  readonly intent: IntentResult;
  readonly retrieval: RetrievalResult;
  readonly response: ResponseResult;
  readonly executionTimeMs: number;
}

type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

// ==================== Logger ====================

class Logger {
  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`❌ ${message}`, error?.message || '');
  }
}

// ==================== Feature Flag Service ====================

class FeatureFlagService {
  private client: IFbClient | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger
  ) {}

  async initialize(): Promise<Result<void>> {
    try {
      this.client = new FbClientBuilder()
        .sdkKey(this.config.featbit.sdkKey)
        .streamingUri(this.config.featbit.streamingUri)
        .eventsUri(this.config.featbit.eventsUri)
        .build();

      await this.client.waitForInitialization();
      this.logger.info('FeatBit client initialized');
      
      return { success: true, value: undefined };
    } catch (error) {
      this.logger.error('Failed to initialize FeatBit client', error as Error);
      return { success: false, error: error as Error };
    }
  }

  async getWorkflowCombo(user: IUser): Promise<string> {
    if (!this.client) throw new Error('Client not initialized');

    try {
      const flag = await this.client.jsonVariation(
        this.config.flags.workflow,
        user,
        { combo: 'combo_a' }
      );
      return (flag as { combo: string }).combo;
    } catch (error) {
      this.logger.error('Failed to get workflow combo', error as Error);
      return 'combo_a';
    }
  }

  async getStageConfig(flagKey: string, user: IUser): Promise<PromptConfig> {
    if (!this.client) throw new Error('Client not initialized');

    try {
      const config = await this.client.jsonVariation(
        flagKey,
        user,
        this.getDefaultConfig(flagKey)
      );
      return config as PromptConfig;
    } catch (error) {
      return this.getDefaultConfig(flagKey);
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      this.logger.info('Closing FeatBit client');
      await this.client.close();
      this.client = null;
    }
  }

  private getDefaultConfig(flagKey: string): PromptConfig {
    const defaults: Record<string, PromptConfig> = {
      [this.config.flags.intentAnalysis]: {
        model: 'gpt-4',
        temperature: 0.7,
        systemPrompt: 'Classify customer inquiries',
      },
      [this.config.flags.infoRetrieval]: {
        model: 'gpt-4',
        temperature: 0.3,
        strategy: 'standard',
      },
      [this.config.flags.responseGeneration]: {
        model: 'gpt-4',
        temperature: 0.8,
        strategy: 'text',
      },
    };
    return defaults[flagKey] || { model: 'gpt-4', temperature: 0.5 };
  }
}

// ==================== Stage Processors ====================

class IntentAnalysisProcessor {
  constructor(private readonly logger: Logger) {}

  async execute(message: string, config: PromptConfig): Promise<Result<IntentResult>> {
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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          value: {
            category: parsed.category || 'FEATURE',
            urgency: parsed.urgency || 'medium',
            confidence: parsed.confidence || 0.85
          }
        };
      }

      return {
        success: true,
        value: {
          category: 'FEATURE',
          urgency: 'medium',
          confidence: 0.75
        }
      };
    } catch (error) {
      // Fallback
      const result: IntentResult = config.temperature < 0.6
        ? { category: 'CRITICAL', urgency: 'high', confidence: 0.95 }
        : { category: 'FEATURE', urgency: 'medium', confidence: 0.85 };
      return { success: true, value: result };
    }
  }
}

class InfoRetrievalProcessor {
  constructor(private readonly logger: Logger) {}

  async execute(intent: IntentResult, config: PromptConfig): Promise<Result<RetrievalResult>> {
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

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          value: {
            documents: parsed.documents || ['KB-001', 'KB-045'],
            sources: parsed.sources || ['knowledge-base']
          }
        };
      }

      // Fallback
      const isRAG = config.strategy === 'rag';
      return {
        success: true,
        value: isRAG
          ? {
              documents: ['KB-001', 'KB-045', 'KB-089'],
              sources: ['knowledge-base', 'vector-db', 'recent-tickets'],
            }
          : {
              documents: ['KB-001', 'KB-045'],
              sources: ['knowledge-base'],
            }
      };
    } catch (error) {
      const isRAG = config.strategy === 'rag';
      return {
        success: true,
        value: isRAG
          ? {
              documents: ['KB-001', 'KB-045', 'KB-089'],
              sources: ['knowledge-base', 'vector-db', 'recent-tickets'],
            }
          : {
              documents: ['KB-001', 'KB-045'],
              sources: ['knowledge-base'],
            }
      };
    }
  }
}

class ResponseGenerationProcessor {
  constructor(private readonly logger: Logger) {}

  async execute(
    intent: IntentResult,
    retrieval: RetrievalResult,
    config: PromptConfig
  ): Promise<Result<ResponseResult>> {
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
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return {
            success: true,
            value: {
              message: jsonMatch[0],
              format: 'structured'
            }
          };
        }
        // Fallback
        return {
          success: true,
          value: {
            message: JSON.stringify({
              greeting: 'Thank you for contacting support',
              assessment: `We've identified this as a ${intent.category} issue`,
              resources: retrieval.documents,
              ticketId: 'TKT-' + Math.floor(10000 + Math.random() * 90000)
            }, null, 2),
            format: 'structured'
          }
        };
      } else {
        return {
          success: true,
          value: {
            message: text.trim(),
            format: 'text'
          }
        };
      }
    } catch (error) {
      // Fallback
      const isStructured = config.strategy === 'structured';
      return {
        success: true,
        value: isStructured
          ? {
              message: JSON.stringify({
                greeting: 'Thank you for contacting support',
                assessment: `We've identified this as a ${intent.category} issue`,
                resources: retrieval.documents,
                ticketId: 'TKT-12345',
              }, null, 2),
              format: 'structured',
            }
          : {
              message: `Thank you for contacting support. We've identified this as a ${intent.category} issue.`,
              format: 'text',
            }
      };
    }
  }
}

// ==================== Workflow Executor ====================

class WorkflowExecutor {
  private readonly intentProcessor: IntentAnalysisProcessor;
  private readonly retrievalProcessor: InfoRetrievalProcessor;
  private readonly responseProcessor: ResponseGenerationProcessor;

  constructor(
    private readonly flagService: FeatureFlagService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {
    this.intentProcessor = new IntentAnalysisProcessor(logger);
    this.retrievalProcessor = new InfoRetrievalProcessor(logger);
    this.responseProcessor = new ResponseGenerationProcessor(logger);
  }

  async execute(inquiry: CustomerInquiry): Promise<Result<WorkflowResult>> {
    const startTime = Date.now();

    try {
      // Create user
      const user = new UserBuilder(inquiry.userId)
        .custom('inquiryType', inquiry.type)
        .build();

      // Get workflow combo
      const combo = await this.flagService.getWorkflowCombo(user);

      // Create user with combo
      const userWithCombo = new UserBuilder(inquiry.userId)
        .custom('inquiryType', inquiry.type)
        .custom('combo', combo)
        .build();

      // Execute stages
      const intentConfig = await this.flagService.getStageConfig(
        this.config.flags.intentAnalysis,
        userWithCombo
      );
      const intentResult = await this.intentProcessor.execute(inquiry.message, intentConfig);
      if (!intentResult.success) return intentResult;

      const retrievalConfig = await this.flagService.getStageConfig(
        this.config.flags.infoRetrieval,
        userWithCombo
      );
      const retrievalResult = await this.retrievalProcessor.execute(
        intentResult.value,
        retrievalConfig
      );
      if (!retrievalResult.success) return retrievalResult;

      const responseConfig = await this.flagService.getStageConfig(
        this.config.flags.responseGeneration,
        userWithCombo
      );
      const responseResult = await this.responseProcessor.execute(
        intentResult.value,
        retrievalResult.value,
        responseConfig
      );
      if (!responseResult.success) return responseResult;

      const executionTimeMs = Date.now() - startTime;
      const result: WorkflowResult = {
        inquiryId: inquiry.id,
        combo,
        intent: intentResult.value,
        retrieval: retrievalResult.value,
        response: responseResult.value,
        executionTimeMs,
      };

      return { success: true, value: result };
    } catch (error) {
      this.logger.error(`Workflow execution failed`, error as Error);
      return { success: false, error: error as Error };
    }
  }
}

// ==================== Application ====================

class Application {
  private readonly config: AppConfig;
  private readonly logger: Logger;
  private readonly flagService: FeatureFlagService;
  private readonly workflowExecutor: WorkflowExecutor;

  constructor() {
    this.config = loadConfig();
    this.logger = new Logger();
    this.flagService = new FeatureFlagService(this.config, this.logger);
    this.workflowExecutor = new WorkflowExecutor(
      this.flagService,
      this.logger,
      this.config
    );
  }

  async initialize(): Promise<void> {
    const result = await this.flagService.initialize();
    if (!result.success) {
      throw new Error('Failed to initialize');
    }
  }

  async shutdown(): Promise<void> {
    await this.flagService.close();
  }

  async processInquiries(inquiries: CustomerInquiry[]): Promise<void> {
    for (const inquiry of inquiries) {
      console.log(`\n${'='.repeat(60)}`);
      
      const result = await this.workflowExecutor.execute(inquiry);

      if (result.success) {
        const { value } = result;
        console.log('\n📊 Result Summary:');
        console.log(`   Combo Used: ${value.combo}`);
        console.log(`   Intent: ${value.intent.category} (${Math.round(value.intent.confidence * 100)}% confidence)`);
        console.log(`   Retrieved: ${value.retrieval.documents.length} documents`);
        console.log(`   Response Format: ${value.response.format}`);
        console.log(`   Response Preview: ${value.response.message.substring(0, 100)}...`);
        console.log(`   Execution Time: ${value.executionTimeMs}ms`);
      } else {
        this.logger.error(`Failed to process inquiry ${inquiry.id}`, result.error);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// ==================== Main ====================

async function main(): Promise<void> {
  console.log('\n🎯 Agent Flag Demo\n');

  const inquiries: CustomerInquiry[] = [
    {
      id: 'INQ-001',
      userId: 'user-123',
      type: 'critical',
      message: 'Our production API is down and returning 500 errors!',
    },
    {
      id: 'INQ-002',
      userId: 'user-456',
      type: 'feature',
      message: 'How do I configure custom authentication in your SDK?',
    },
    {
      id: 'INQ-003',
      userId: 'user-789',
      type: 'integration',
      message: 'Getting CORS errors when integrating your API with React',
    },
  ];

  const app = new Application();

  try {
    await app.initialize();
    await app.processInquiries(inquiries);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✅ Demo completed\n');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await app.shutdown();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
