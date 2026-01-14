# Agent Flag Demo - TypeScript

A demonstration of how Agent Flag works with multi-stage AI workflows using FeatBit feature flags and real Azure OpenAI integration.

## Architecture

This demo implements a 3-stage customer support workflow:

1. **Intent Analysis** - Uses Azure OpenAI to classify customer inquiries
2. **Information Retrieval** - Uses Azure OpenAI to retrieve relevant documents
3. **Response Generation** - Uses Azure OpenAI to generate customer-facing responses

## Features

- ✅ Real Azure OpenAI integration for all stages
- ✅ Multi-stage workflow orchestration
- ✅ Feature flag-based prompt combination management
- ✅ Support for A/B testing different prompt versions
- ✅ Automatic fallback if AI calls fail
- ✅ User segmentation based on inquiry type
- ✅ Two versions: simple (`index.ts`) and optimized (`app-optimized.ts`)

## Setup

```bash
# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your FeatBit and Azure OpenAI credentials

# Run the optimized demo (recommended)
pnpm run dev

# Or run the simple version
pnpm run dev:simple
```

## Configuration

### FeatBit
Create a `.env` file with your FeatBit credentials:
```env
FEATBIT_SDK_KEY=your_sdk_key_here
FEATBIT_STREAMING_URI=wss://global-eval.featbit.co
FEATBIT_EVENTS_URI=https://global-eval.featbit.co
```

### Azure OpenAI
Add your Azure OpenAI credentials to `.env`:
```env
AZURE_RESOURCE_NAME=your_azure_resource_name
AZURE_API_KEY=your_azure_api_key
AZURE_MODEL_NAME=gpt-4
```

See [AZURE_OPENAI_INTEGRATION.md](./AZURE_OPENAI_INTEGRATION.md) for detailed setup instructions.

## Workflow Combinations

The demo supports multiple workflow combinations:

- **combo_a** (Baseline):
  - Intent Analysis v1
  - Retrieval v1  
  - Response v1

- **combo_b** (Optimized):
  - Intent Analysis v2 (optimized)
  - Retrieval RAG v1 (RAG strategy)
  - Response Structured v1 (structured output)

## Usage Example

The demo simulates different types of customer inquiries:
- Critical production issues
- Feature questions
- Integration help
- Quick questions

Each inquiry is processed through the 3-stage workflow, with the specific prompt versions determined by feature flags.

## How It Works

1. **Workflow Flag** determines which combination to use based on user context
2. **Stage Flags** (intent-analysis, info-retrieval, response-generation) determine specific prompt versions
3. Flags are evaluated using composite keys (userId + inquiryType + combo)
4. The workflow executes stages sequentially with the resolved configuration

## Extending the Demo

- Add more prompt versions to stage flags
- Create new workflow combinations
- Implement actual LLM calls (replace mock functions)
- Add metrics tracking and experiment analysis
