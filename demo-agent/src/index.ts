import 'dotenv/config'; // Load environment variables first
import { initializeFeatBit, closeFeatBit } from './featbit-client';
import { executeWorkflow } from './workflow';
import { CustomerInquiry } from './types';

/**
 * Demo: Run agent-flag workflow with different inquiry types
 */
async function runDemo() {
  console.log('🎯 Agent Flag Demo - Multi-Stage AI Workflow\n');
  
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
      
      // Display result summary
      console.log('\n📊 Result Summary:');
      console.log(`   Combo Used: ${result.combo}`);
      console.log(`   Intent: ${result.intent.category} (${result.intent.confidence * 100}% confidence)`);
      console.log(`   Retrieved: ${result.retrieval.documents.length} documents`);
      console.log(`   Response Format: ${result.response.format}`);
      console.log(`   Response Preview: ${result.response.message.substring(0, 100)}...`);
      
      // Add delay between inquiries for readability
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`\n❌ Error processing inquiry ${inquiry.id}:`, error);
    }
  }
  
  // Close client and flush events
  await closeFeatBit(client);
  
  console.log('\n✨ Demo completed!\n');
  console.log('💡 Key Takeaways:');
  console.log('   • Different inquiries can be routed to different workflow combos');
  console.log('   • Each stage uses its own prompt configuration from feature flags');
  console.log('   • Workflow combinations are managed without code changes');
  console.log('   • Perfect for A/B testing different prompt strategies\n');
}

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
