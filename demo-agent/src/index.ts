import 'dotenv/config'; // Load environment variables first
import { initializeFeatBit, closeFeatBit } from './featbit-client';
import { executeWorkflow } from './workflow';
import { CustomerInquiry } from './types';

/**
 * Demo: Run agent-flag workflow with different inquiry types
 */
async function runDemo() {
  console.log('\n🎯 Agent Flag Demo\n');
  
  // Initialize FeatBit client
  const client = await initializeFeatBit();
  
  // Create sample inquiries
  const inquiries: CustomerInquiry[] = [
    {
      id: 'INQ-001',
      userId: 'user-123',
      type: 'critical',
      message: 'Our production API is down and returning 500 errors for all requests!'
    },
    {
      id: 'INQ-002',
      userId: 'user-456',
      type: 'feature',
      message: 'How do I configure custom authentication in your SDK?'
    },
    {
      id: 'INQ-003',
      userId: 'user-789',
      type: 'integration',
      message: 'Getting CORS errors when integrating your API with our React app'
    }
  ];
  
  // Process each inquiry through the workflow
  for (const inquiry of inquiries) {
    try {
      const result = await executeWorkflow(client, inquiry);
      
      console.log(`✅ ${inquiry.id}: ${result.intent.category} - ${result.retrieval.documents.length} docs - ${result.executionTimeMs}ms`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`\n❌ Error processing inquiry ${inquiry.id}:`, error);
    }
  }
  
  // Close client and flush events
  await closeFeatBit(client);
  
  console.log('\n✅ Demo completed\n');
}

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
