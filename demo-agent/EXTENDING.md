# Extending the Demo with Real LLM Calls

This guide shows how to replace the mock implementations with actual LLM API calls.

## Option 1: Using OpenAI

### Install OpenAI SDK

```bash
pnpm add openai
```

### Update intent-analysis.ts

```typescript
import { IntentResult, PromptConfig } from '../types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeIntent(
  message: string,
  config: PromptConfig
): Promise<IntentResult> {
  console.log('  🧠 [Stage 1] Intent Analysis');
  console.log(`     Model: ${config.model}, Temp: ${config.temperature}`);
  
  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      messages: [
        {
          role: 'system',
          content: config.systemPrompt || 'Classify customer inquiries'
        },
        {
          role: 'user',
          content: `Classify this inquiry and respond with JSON: ${message}`
        }
      ],
      response_format: { type: 'json_object' }
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log(`     Result: ${result.category} (confidence: ${result.confidence})`);
    
    return result as IntentResult;
    
  } catch (error) {
    console.error('     Error calling OpenAI:', error);
    throw error;
  }
}
```

### Add Environment Variable

Create `.env` file:
```
OPENAI_API_KEY=sk-your-api-key-here
```

Install dotenv:
```bash
npm install dotenv
```

Update `src/index.ts`:
```typescript
import 'dotenv/config';
// ... rest of code
```

## Option 2: Using Azure OpenAI

### Install Azure SDK

```bash
pnpm add @azure/openai
```

### Update intent-analysis.ts

```typescript
import { IntentResult, PromptConfig } from '../types';
import { AzureOpenAI } from '@azure/openai';

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-02-15-preview'
});

export async function analyzeIntent(
  message: string,
  config: PromptConfig
): Promise<IntentResult> {
  console.log('  🧠 [Stage 1] Intent Analysis');
  
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
  
  const response = await client.chat.completions.create({
    model: deployment,
    temperature: config.temperature,
    messages: [
      {
        role: 'system',
        content: config.systemPrompt || 'Classify customer inquiries'
      },
      {
        role: 'user',
        content: message
      }
    ]
  });
  
  // Parse response and return
  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result as IntentResult;
}
```

### Environment Variables

```
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

## Option 3: Using Anthropic Claude

### Install Anthropic SDK

```bash
pnpm add @anthropic-ai/sdk
```

### Update intent-analysis.ts

```typescript
import { IntentResult, PromptConfig } from '../types';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function analyzeIntent(
  message: string,
  config: PromptConfig
): Promise<IntentResult> {
  console.log('  🧠 [Stage 1] Intent Analysis');
  
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    temperature: config.temperature,
    system: config.systemPrompt || 'Classify customer inquiries',
    messages: [
      {
        role: 'user',
        content: message
      }
    ]
  });
  
  const result = JSON.parse(response.content[0].text);
  return result as IntentResult;
}
```

### Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

## Adding Retry Logic

For production use, add retry logic:

```typescript
import { IntentResult, PromptConfig } from '../types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30000
});

export async function analyzeIntent(
  message: string,
  config: PromptConfig,
  retries = 3
): Promise<IntentResult> {
  console.log('  🧠 [Stage 1] Intent Analysis');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: config.model,
        temperature: config.temperature,
        messages: [
          {
            role: 'system',
            content: config.systemPrompt || 'Classify customer inquiries'
          },
          {
            role: 'user',
            content: message
          }
        ]
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      console.log(`     ✅ Success on attempt ${attempt}`);
      return result as IntentResult;
      
    } catch (error) {
      console.error(`     ❌ Attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`     ⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('All retry attempts failed');
}
```

## Adding Caching

Optimize costs by caching similar queries:

```typescript
import { IntentResult, PromptConfig } from '../types';
import OpenAI from 'openai';
import crypto from 'crypto';

const cache = new Map<string, IntentResult>();

function getCacheKey(message: string, config: PromptConfig): string {
  return crypto
    .createHash('md5')
    .update(JSON.stringify({ message, config }))
    .digest('hex');
}

export async function analyzeIntent(
  message: string,
  config: PromptConfig
): Promise<IntentResult> {
  // Check cache first
  const cacheKey = getCacheKey(message, config);
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.log('     💾 Cache hit!');
    return cached;
  }
  
  // Call LLM if not cached
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.chat.completions.create({
    model: config.model,
    temperature: config.temperature,
    messages: [
      {
        role: 'system',
        content: config.systemPrompt || 'Classify customer inquiries'
      },
      {
        role: 'user',
        content: message
      }
    ]
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  // Store in cache
  cache.set(cacheKey, result);
  
  return result;
}
```

## Adding Metrics Tracking

Track LLM calls for cost and performance monitoring:

```typescript
import { IntentResult, PromptConfig } from '../types';
import OpenAI from 'openai';

interface Metrics {
  stage: string;
  model: string;
  tokensUsed: number;
  latencyMs: number;
  cost: number;
}

const metrics: Metrics[] = [];

export async function analyzeIntent(
  message: string,
  config: PromptConfig
): Promise<IntentResult> {
  const startTime = Date.now();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.chat.completions.create({
    model: config.model,
    temperature: config.temperature,
    messages: [
      {
        role: 'system',
        content: config.systemPrompt || 'Classify customer inquiries'
      },
      {
        role: 'user',
        content: message
      }
    ]
  });
  
  const latencyMs = Date.now() - startTime;
  const tokensUsed = response.usage?.total_tokens || 0;
  
  // Calculate cost (example rates)
  const costPerToken = config.model === 'gpt-4' ? 0.00003 : 0.000001;
  const cost = tokensUsed * costPerToken;
  
  // Store metrics
  metrics.push({
    stage: 'intent-analysis',
    model: config.model,
    tokensUsed,
    latencyMs,
    cost
  });
  
  console.log(`     📊 Tokens: ${tokensUsed}, Latency: ${latencyMs}ms, Cost: $${cost.toFixed(4)}`);
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result;
}

// Export metrics for analysis
export function getMetrics(): Metrics[] {
  return metrics;
}
```

## Integration with OpenTelemetry

For production monitoring:

```bash
pnpm add @opentelemetry/api @opentelemetry/sdk-trace-node
```

```typescript
import { trace } from '@opentelemetry/api';
import { IntentResult, PromptConfig } from '../types';
import OpenAI from 'openai';

const tracer = trace.getTracer('agent-flag-demo');

export async function analyzeIntent(
  message: string,
  config: PromptConfig
): Promise<IntentResult> {
  return tracer.startActiveSpan('intent-analysis', async (span) => {
    try {
      span.setAttribute('model', config.model);
      span.setAttribute('temperature', config.temperature);
      span.setAttribute('message.length', message.length);
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: config.model,
        temperature: config.temperature,
        messages: [
          {
            role: 'system',
            content: config.systemPrompt || 'Classify customer inquiries'
          },
          {
            role: 'user',
            content: message
          }
        ]
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      span.setAttribute('result.category', result.category);
      span.setAttribute('result.confidence', result.confidence);
      span.setStatus({ code: 1 }); // OK
      
      return result;
      
    } catch (error) {
      span.setStatus({ code: 2, message: error.message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Best Practices

1. **Error Handling**: Always wrap LLM calls in try-catch
2. **Timeouts**: Set reasonable timeouts (30-60 seconds)
3. **Retries**: Implement exponential backoff for transient failures
4. **Rate Limiting**: Respect API rate limits
5. **Caching**: Cache responses for identical inputs
6. **Monitoring**: Track tokens, latency, costs, and errors
7. **Fallbacks**: Have fallback responses for API failures
8. **Security**: Never commit API keys, use environment variables
9. **Cost Control**: Set budget alerts and usage limits
10. **Testing**: Test with various input types and edge cases

## Complete Example

See `examples/real-llm-implementation.ts` for a complete working example with all best practices implemented.
