import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME || '',
  apiKey: process.env.AZURE_API_KEY || '',
});

const azureModel = process.env.AZURE_MODEL_NAME || "gpt-4";
const azureModel51 = process.env.AZURE_MODEL_51_NAME || "gpt-4";

export { azure, azureModel, azureModel51 };
