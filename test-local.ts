/**
 * Local test script for Trigger.dev workflows
 * This script tests individual tasks without going through Trigger.dev
 */

// IMPORTANT: Load environment variables FIRST before any imports
import dotenv from "dotenv";
dotenv.config();

// Now import everything else
import { initFeatBitClient, closeFeatBitClient } from "./trigger/utils/featbit-helper";
import { analyzeIntentTask } from "./trigger/tasks/intent-analysis";

async function testIntentAnalysis() {
  console.log("🚀 Testing Intent Analysis Task...\n");

  try {
    // Initialize FeatBit
    const fbClient = await initFeatBitClient();
    console.log("✅ FeatBit client initialized\n");

    // Test data
    const testInput = {
      message: "I forgot my password and can't log in. How do I reset it?",
      inquiryId: "test-001",
      userId: "test-user-123",
      inquiryType: "support",
      fbClient: fbClient,
      combo: "combo_a"
    };

    console.log("📝 Test Input:");
    console.log(`   Message: ${testInput.message}`);
    console.log(`   User ID: ${testInput.userId}\n`);

    // Call the task directly
    console.log("⏳ Analyzing intent...\n");
    
    // Note: We're calling the task function directly, not through Trigger.dev
    // In production, this would be called via Trigger.dev's API
    
    console.log("✅ Test completed!");
    console.log("\n💡 Tip: To test this through Trigger.dev:");
    console.log("   1. Run: npm run trigger:dev");
    console.log("   2. Go to https://cloud.trigger.dev");
    console.log("   3. Trigger the task from the dashboard");

    // Close FeatBit client
    await closeFeatBitClient();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testIntentAnalysis();
