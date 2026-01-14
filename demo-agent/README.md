# Agent Flag Demo - TypeScript

A simple demonstration of how Agent Flag works with multi-stage AI workflows using FeatBit feature flags.

## Architecture

This demo implements a 3-stage customer support workflow:

1. **Intent Analysis** - Classifies customer inquiries
2. **Information Retrieval** - Retrieves relevant information based on intent
3. **Response Generation** - Generates customer-facing response

## Features

- ✅ Multi-stage workflow orchestration
- ✅ Feature flag-based prompt combination management
- ✅ Support for A/B testing different prompt versions
- ✅ Mock implementations for easy demonstration
- ✅ User segmentation based on inquiry type

## Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run the demo
pnpm start

# Or run directly with ts-node
pnpm run dev
```

## Configuration

Update the FeatBit configuration in `src/config.ts`:
- `envSecret`: Your FeatBit environment secret
- `streamingUri`: FeatBit streaming endpoint
- `eventsUri`: FeatBit events endpoint

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
