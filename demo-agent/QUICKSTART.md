# Quick Start Guide

Get the Agent Flag demo running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- FeatBit account (free at https://featbit.co)

## Step 1: Install Dependencies

```bash
cd demo-agent
pnpm install
```

## Step 2: Configure FeatBit

1. Create a FeatBit account at https://featbit.co
2. Create a new project or use existing one
3. Copy your environment secret key
4. Update `src/config.ts` with your credentials:

```typescript
export const featbitConfig = {
  envSecret: 'your-actual-env-secret-here',  // Update this!
  streamingUri: 'wss://app.featbit.co',
  eventsUri: 'https://app.featbit.co'
};
```

## Step 3: Create Feature Flags

Create the following flags in your FeatBit dashboard:

1. **customer-support-workflow** - Returns JSON: `{ "combo": "combo_a" }` or `{ "combo": "combo_b" }`
2. **intent-analysis** - Returns configuration for Stage 1
3. **info-retrieval** - Returns configuration for Stage 2
4. **response-generation** - Returns configuration for Stage 3

See [FEATBIT_FLAGS.md](FEATBIT_FLAGS.md) for detailed flag configurations.

### Quick Flag Setup (Minimal)

For a quick test, create these flags with simple default values:

**customer-support-workflow**:
- Default value: `{ "combo": "combo_a" }`

**intent-analysis**:
- Default value: `{ "model": "gpt-4", "temperature": 0.7, "systemPrompt": "Classify inquiries" }`

**info-retrieval**:
- Default value: `{ "model": "gpt-4", "temperature": 0.3, "strategy": "standard" }`

**response-generation**:
- Default value: `{ "model": "gpt-4", "temperature": 0.8, "strategy": "text" }`

## Step 4: Run the Demo

```bash
# Build TypeScript
pnpm run build

# Run the demo
pnpm start
```

Or run directly without building:

```bash
pnpm run dev
```

## What You'll See

The demo will process 3 different customer inquiries:

1. **Critical** - Production API down
2. **Feature** - How to configure SDK
3. **Integration** - CORS errors

Each inquiry goes through the 3-stage workflow:
- 🧠 Intent Analysis
- 📚 Information Retrieval
- 💬 Response Generation

## Expected Output

```
🎯 Agent Flag Demo - Multi-Stage AI Workflow

🔧 Initializing FeatBit client...
✅ FeatBit client initialized successfully

============================================================
🚀 Processing inquiry: INQ-001
   User: user-123, Type: critical
============================================================

📋 [Flag Evaluation] Getting workflow combination...
   Assigned combo: combo_b

  🧠 [Stage 1] Intent Analysis
     Model: gpt-4, Temp: 0.5
     ...

  📚 [Stage 2] Information Retrieval
     Model: gpt-4, Temp: 0.3
     ...

  💬 [Stage 3] Response Generation
     Model: gpt-4, Temp: 0.7
     ...

============================================================
✅ Workflow completed successfully
============================================================

📊 Result Summary:
   Combo Used: combo_b
   Intent: CRITICAL (95% confidence)
   ...
```

## Troubleshooting

### "Client initialization failed"
- Check your FeatBit environment secret key
- Verify your network can reach FeatBit endpoints
- Make sure the endpoints in config.ts are correct

### "Cannot find flag"
- Ensure all 4 flags are created in FeatBit
- Verify flag keys match exactly: `customer-support-workflow`, `intent-analysis`, `info-retrieval`, `response-generation`

### TypeScript errors
- Run `pnpm install` again
- Check Node.js version: `node --version` (should be 16+)
- Delete `node_modules` and `dist` folders, then reinstall

## Next Steps

1. **Experiment with different combos**: Update flag targeting rules to route different users to different combos
2. **Add metrics**: Track which combo performs better for your use case
3. **Create new variations**: Add v3, v4 prompt versions to test
4. **Implement real LLM calls**: Replace mock functions with actual OpenAI/Claude/etc. calls
5. **Add more stages**: Extend the workflow with additional stages

## Learn More

- [Main README](README.md) - Full documentation
- [FEATBIT_FLAGS.md](FEATBIT_FLAGS.md) - Detailed flag configurations
- [FeatBit Documentation](https://docs.featbit.co) - FeatBit guides
- [Agent Flag Article](../insights-bh.md) - Deep dive into the concept

## Need Help?

- GitHub Issues: https://github.com/featbit/agent-flag
- FeatBit Discord: https://discord.gg/featbit
- Documentation: https://docs.featbit.co
