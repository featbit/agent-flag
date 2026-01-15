/**
 * Azure OpenAI Configuration
 */
import { createAzure } from "@ai-sdk/azure";

export const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME || '',
  apiKey: process.env.AZURE_API_KEY || '',
});

export const azureModel = process.env.AZURE_MODEL_NAME || "gpt-4";
