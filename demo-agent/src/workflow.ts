import type { IFbClient } from '@featbit/node-server-sdk';
import { UserBuilder } from '@featbit/node-server-sdk';
import { CustomerInquiry, WorkflowResult, PromptConfig } from './types';
import { flagKeys, workflowCombos } from './config';
import { analyzeIntent } from './stages/intent-analysis';
import { retrieveInformation } from './stages/info-retrieval';
import { generateResponse } from './stages/response-generation';

/**
 * Execute multi-stage customer support workflow
 * Uses feature flags to determine which prompt versions to use
 */
export async function executeWorkflow(
  client: IFbClient,
  inquiry: CustomerInquiry
): Promise<WorkflowResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Processing inquiry: ${inquiry.id}`);
  console.log(`   User: ${inquiry.userId}, Type: ${inquiry.type}`);
  console.log(`${'='.repeat(60)}`);
  
  // Step 1: Build user using UserBuilder (FeatBit best practice)
  const user = new UserBuilder(inquiry.userId)
    .custom('inquiryType', inquiry.type)
    .build();
  
  // Step 2: Get workflow combo from flag
  console.log('\n📋 [Flag Evaluation] Getting workflow combination...');
  const workflowFlag = await client.jsonVariation(
    flagKeys.workflow,
    user,
    { combo: workflowCombos.COMBO_A }
  );
  const combo = workflowFlag.combo as string;
  console.log(`   Assigned combo: ${combo}`);
  
  // Step 3: Add combo to user context for stage flags
  const userWithCombo = new UserBuilder(inquiry.userId)
    .custom('inquiryType', inquiry.type)
    .custom('combo', combo)
    .build();
  
  // Step 4: Execute Stage 1 - Intent Analysis
  const intentConfig = await client.jsonVariation(
    flagKeys.intentAnalysis,
    userWithCombo,
    getDefaultIntentConfig()
  ) as PromptConfig;
  
  const intent = await analyzeIntent(inquiry.message, intentConfig);
  
  // Step 5: Execute Stage 2 - Information Retrieval
  const retrievalConfig = await client.jsonVariation(
    flagKeys.infoRetrieval,
    userWithCombo,
    getDefaultRetrievalConfig()
  ) as PromptConfig;
  
  const retrieval = await retrieveInformation(intent, retrievalConfig);
  
  // Step 6: Execute Stage 3 - Response Generation
  const responseConfig = await client.jsonVariation(
    flagKeys.responseGeneration,
    userWithCombo,
    getDefaultResponseConfig()
  ) as PromptConfig;
  
  const response = await generateResponse(intent, retrieval, responseConfig);
  
  // Return complete workflow result
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Workflow completed successfully');
  console.log(`${'='.repeat(60)}`);
  
  return {
    combo,
    intent,
    retrieval,
    response
  };
}

/**
 * Default configurations for fallback
 */
function getDefaultIntentConfig(): PromptConfig {
  return {
    model: 'gpt-4',
    temperature: 0.7,
    systemPrompt: 'Classify customer inquiries'
  };
}

function getDefaultRetrievalConfig(): PromptConfig {
  return {
    model: 'gpt-4',
    temperature: 0.3,
    strategy: 'standard'
  };
}

function getDefaultResponseConfig(): PromptConfig {
  return {
    model: 'gpt-4',
    temperature: 0.8,
    strategy: 'text'
  };
}
