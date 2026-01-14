# Azure OpenAI Integration

This demo now includes real Azure OpenAI model calls to demonstrate how Agent Flag works with actual AI workflows.

## 🎯 What's Integrated

Each stage of the workflow now uses Azure OpenAI:

### Stage 1: Intent Analysis
- **Purpose**: Classify customer inquiries into categories (CRITICAL, FEATURE, INTEGRATION, QUICK)
- **Model**: Uses Azure OpenAI with configurable temperature
- **Output**: JSON with category, urgency, and confidence score

### Stage 2: Information Retrieval
- **Purpose**: Find relevant knowledge base articles based on intent
- **Model**: Uses Azure OpenAI to identify relevant documents
- **Output**: List of document IDs and their sources

### Stage 3: Response Generation
- **Purpose**: Generate customer-facing responses
- **Model**: Uses Azure OpenAI to create text or structured responses
- **Output**: Professional support response (text or JSON format)

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Azure OpenAI Configuration
AZURE_RESOURCE_NAME=your-resource-name
AZURE_API_KEY=your-api-key
AZURE_MODEL_NAME=gpt-4
AZURE_MODEL_51_NAME=gpt-4
```

**Important**: Never commit `.env` to git! Use `.env.example` as a template.

### Azure Setup

1. **Get Azure OpenAI Access**: Apply at https://azure.microsoft.com/products/ai-services/openai-service
2. **Create Resource**: Set up an Azure OpenAI resource
3. **Deploy Model**: Deploy a GPT model (gpt-4, gpt-3.5-turbo, etc.)
4. **Get Credentials**:
   - Resource Name: Found in Azure Portal
   - API Key: Found in "Keys and Endpoint" section

## 📦 Dependencies

```json
{
  "@ai-sdk/azure": "^3.0.10",
  "ai": "^6.0.34"
}
```

Already installed via: `pnpm add @ai-sdk/azure ai`

## 💡 How It Works

### 1. Azure Configuration (`src/azure-config.ts`)
```typescript
import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME || '',
  apiKey: process.env.AZURE_API_KEY || '',
});

export { azure, azureModel };
```

### 2. Stage Processors Use Real AI
Each stage processor (`src/stages/*.ts` and `src/app-optimized.ts`) now:
- Constructs appropriate system prompts
- Calls Azure OpenAI via `generateText()`
- Parses AI responses (JSON extraction)
- Has fallback logic if AI call fails

### 3. Feature Flag Control
FeatBit controls which prompt configuration each stage uses:
- **Model**: Which Azure OpenAI model to use
- **Temperature**: Controls response creativity (0.0 = deterministic, 1.0 = creative)
- **Strategy**: Stage-specific behavior (RAG vs standard, structured vs text)
- **System Prompt**: Custom prompts per configuration

## 🧪 Testing

### With Real AI Calls
```bash
pnpm run dev
```

Execution times will be longer (~1-3 seconds per inquiry) as it makes real API calls.

### With Mock Fallbacks
If Azure credentials are missing or API fails, the system automatically falls back to mock responses, so the demo still works.

## 📊 Example Workflow

```
User Inquiry: "Production API is down!"
    ↓
[Intent Analysis]
  → Azure OpenAI analyzes message
  → Returns: { category: "CRITICAL", urgency: "high", confidence: 0.95 }
    ↓
[Information Retrieval]
  → Azure OpenAI finds relevant docs
  → Returns: ["KB-001: Critical Issue Guide", "KB-045: Incident Procedures"]
    ↓
[Response Generation]
  → Azure OpenAI generates response
  → Returns: Professional support message
```

## 🎛️ FeatBit + Azure OpenAI

The power of Agent Flag is combining FeatBit with Azure OpenAI:

### Experiment Without Code Changes
```yaml
# FeatBit Flag: intent-analysis
combo_a:
  model: "gpt-4"
  temperature: 0.7
  systemPrompt: "You are a helpful support assistant..."

combo_b:
  model: "gpt-3.5-turbo"
  temperature: 0.3
  systemPrompt: "You are a critical incident responder..."
```

### A/B Test Prompt Strategies
- Test different models (GPT-4 vs GPT-3.5)
- Test temperature settings (creative vs deterministic)
- Test different system prompts
- Test RAG vs standard retrieval
- Test structured vs text responses

### Results
- No code deployments needed
- Instant rollback if something goes wrong
- Gradual rollout to users (10% → 50% → 100%)
- Real-time metrics on which combo performs better

## 🔒 Security

### API Key Protection
- ✅ `.env` is in `.gitignore`
- ✅ Use `.env.example` for templates
- ✅ Never hardcode credentials
- ✅ Use Azure Key Vault in production

### Best Practices
1. Rotate API keys regularly
2. Use managed identities when possible
3. Monitor API usage and costs
4. Set rate limits and quotas
5. Log AI requests for audit trails

## 🚀 Production Deployment

### Recommended Setup
1. **Azure OpenAI**: Deploy to enterprise Azure OpenAI instance
2. **FeatBit**: Use FeatBit Cloud or self-hosted for flag management
3. **Monitoring**: Add Application Insights or similar
4. **Error Handling**: Current code has fallbacks built-in
5. **Rate Limiting**: Implement per-user/per-org limits

### Environment Variables in Production
```bash
# Use Azure App Service application settings
# Or Azure Key Vault references
AZURE_RESOURCE_NAME=${keyvault:azure-resource-name}
AZURE_API_KEY=${keyvault:azure-api-key}
```

## 📈 Monitoring

Track these metrics:
- **AI Call Latency**: Time for each stage
- **AI Call Success Rate**: Failed vs successful calls
- **Token Usage**: Monitor Azure OpenAI costs
- **Fallback Rate**: How often fallbacks are used
- **User Satisfaction**: Based on combo used

## 🎓 Learn More

- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [FeatBit Documentation](https://docs.featbit.co/)
- [Agent Flag Pattern](../README.md)

## 💰 Cost Considerations

Azure OpenAI pricing varies by model:
- **GPT-4**: ~$0.03/1K tokens (input), ~$0.06/1K tokens (output)
- **GPT-3.5-Turbo**: ~$0.0015/1K tokens (input), ~$0.002/1K tokens (output)

Use FeatBit to:
- Gradually roll out expensive models (GPT-4) to subset of users
- A/B test if GPT-4 provides enough value over GPT-3.5
- Automatically switch to cheaper models during high load
- Target premium users with better models

This demo makes ~3 AI calls per inquiry × 3 inquiries = 9 API calls per run.
