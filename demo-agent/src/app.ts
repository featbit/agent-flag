/**
 * Main application entry point
 * Uses dependency injection and clean architecture
 */

import 'dotenv/config';
import { AppContainer } from './container';
import { CustomerInquiry } from './core/interfaces';

/**
 * Sample inquiries for demonstration
 */
const sampleInquiries: CustomerInquiry[] = [
  {
    id: 'INQ-001',
    userId: 'user-123',
    type: 'critical',
    message: 'Our production API is down and returning 500 errors for all requests!',
    timestamp: new Date(),
  },
  {
    id: 'INQ-002',
    userId: 'user-456',
    type: 'feature',
    message: 'How do I configure custom authentication in your SDK?',
    timestamp: new Date(),
  },
  {
    id: 'INQ-003',
    userId: 'user-789',
    type: 'integration',
    message: 'Getting CORS errors when integrating your API with our React app',
    timestamp: new Date(),
  },
];

/**
 * Main demo function
 */
async function runDemo(): Promise<void> {
  console.log('🎯 Agent Flag Demo - Multi-Stage AI Workflow\n');

  // Get application container
  const container = AppContainer.getInstance();
  const logger = container.logger;

  try {
    // Initialize application
    await container.initialize();

    // Get workflow executor
    const executor = container.workflowExecutor;

    // Process each inquiry
    for (const inquiry of sampleInquiries) {
      console.log(`\n${'='.repeat(60)}`);
      
      const result = await executor.execute(inquiry);

      if (result.success) {
        const { value } = result;
        
        console.log('\n📊 Result Summary:');
        console.log(`   Combo Used: ${value.combo}`);
        console.log(`   Intent: ${value.intent.category} (${Math.round(value.intent.confidence * 100)}% confidence)`);
        console.log(`   Retrieved: ${value.retrieval.documents.length} documents`);
        console.log(`   Response Format: ${value.response.format}`);
        console.log(`   Response Preview: ${value.response.message.substring(0, 100)}...`);
        console.log(`   Execution Time: ${value.executionTimeMs}ms`);
      } else {
        logger.error(`Failed to process inquiry ${inquiry.id}`, result.error);
      }

      // Add delay for readability
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✨ Demo completed!\n');
    console.log('💡 Key Takeaways:');
    console.log('   • Clean architecture with dependency injection');
    console.log('   • Type-safe configuration management');
    console.log('   • Proper error handling with Result types');
    console.log('   • Modular processors for each stage');
    console.log('   • Easy to test and extend\n');

  } catch (error) {
    logger.error('Fatal error in demo', error as Error);
    process.exit(1);
  } finally {
    // Cleanup
    await container.shutdown();
  }
}

// Run the demo
runDemo().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
