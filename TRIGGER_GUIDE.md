# How to Manually Trigger Trigger.dev Tasks

This project provides several ways to test and trigger Trigger.dev tasks.

## Method 1: Using the Trigger.dev Console (Recommended for Testing)

This is the simplest way, suitable for quick testing:

1. Visit the project console: https://cloud.trigger.dev/projects/proj_vimroqyctvbzuyhcgzmb
2. Click **"Tasks"** in the left menu
3. Select the task you want to test, e.g. `process-customer-inquiry`
4. Click the **"Test"** button
5. Enter the test payload (JSON format):
```json
{
  "inquiry": {
    "id": "test-001",
    "userId": "user-123",
    "message": "I forgot my password, how can I reset it?",
    "type": "support",
    "timestamp": "2026-01-15T10:00:00Z",
    "metadata": {
      "source": "dashboard-test"
    }
  }
}
```
6. Click **"Run test"** and view the real-time execution logs

## Method 2: Using the Local Trigger Script

Use the provided trigger script:

```powershell
npx ts-node trigger-task.ts
```

This script will:
- Automatically load environment variables
- Initialize the FeatBit client
- Trigger the workflow
- Return the Run ID for tracking

## Method 3: Triggering via Code

Trigger the task in your application code:

```typescript
import { tasks } from "@trigger.dev/sdk";
import type { processCustomerInquiry } from "./trigger/workflows/customer-inquiry";

// Trigger the task
const handle = await tasks.trigger<typeof processCustomerInquiry>(
  "process-customer-inquiry",
  {
    inquiry: {
      id: "inquiry-123",
      userId: "user-456", 
      message: "Need help",
      type: "support",
      timestamp: new Date().toISOString()
    }
  }
);

console.log("Run ID:", handle.id);
```

## Method 4: Using the Trigger.dev CLI

If the task is already deployed, you can trigger it directly with the CLI:

```powershell
# Deploy the task first
npm run trigger:deploy

# Then trigger
npx trigger.dev@latest trigger process-customer-inquiry --payload '{"inquiry":{"id":"test","userId":"user-1","message":"Test message","type":"support"}}'
```

## Method 5: Using the REST API

Use the Trigger.dev REST API (API Key required):

```bash
curl -X POST https://api.trigger.dev/api/v1/tasks/process-customer-inquiry/trigger \
  -H "Authorization: Bearer $TRIGGER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "inquiry": {
        "id": "test-001",
        "userId": "user-123",
        "message": "Test message",
        "type": "support"
      }
    }
  }'
```


## Viewing Execution Results

After triggering by any method, you can view results in the console:

🔗 **Project Console**: https://cloud.trigger.dev/projects/proj_vimroqyctvbzuyhcgzmb

On the **"Runs"** page you can see:
- All task run history
- Real-time execution status
- Detailed logs
- Input/output data
- Error information (if any)

## Local Testing (Without Trigger.dev)

If you only want to test the code logic without involving the Trigger.dev platform:

```powershell
npx ts-node test-local.ts
```

This will run the code directly, testing FeatBit integration and business logic.

## Troubleshooting

### Task Not Found
```
Error: Task "xxx" not found
```
**Solution**: The task is not deployed yet. Run `npm run trigger:deploy` to deploy first.

### Unauthorized
```
Error: Unauthorized
```
**Solution**: Check if `TRIGGER_API_KEY` in your `.env` file is correct.

### FeatBit Connection Failed
```
Error: FEATBIT_SDK_KEY environment variable is required
```
**Solution**: Make sure your `.env` file exists and contains all required environment variables.

## Environment Variables

Make sure your `.env` file contains the following:

```env
# FeatBit Configuration
FEATBIT_SDK_KEY=your_SDK_KEY
FEATBIT_STREAMING_URI=wss://global-eval.featbit.co
FEATBIT_EVENTS_URI=https://global-eval.featbit.co

# Trigger.dev Configuration
TRIGGER_API_KEY=tr_dev_yourKEY
TRIGGER_PROJECT_ID=proj_vimroqyctvbzuyhcgzmb

# Azure OpenAI Configuration
AZURE_RESOURCE_NAME=your_resource_name
AZURE_API_KEY=yourAPI_KEY
AZURE_MODEL_NAME=gpt-4
```
