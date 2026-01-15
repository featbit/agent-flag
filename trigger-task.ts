/**
 * 手动触发 Trigger.dev 任务的脚本
 * 
 * 使用方法:
 *   npx ts-node trigger-task.ts
 */

// 先加载环境变量
import dotenv from "dotenv";
dotenv.config();

import { tasks } from "@trigger.dev/sdk";
import type { processCustomerInquiry } from "./trigger/workflows/customer-inquiry";
import { initFeatBitClient } from "./trigger/utils/featbit-helper";

async function triggerCustomerInquiryWorkflow() {
  console.log("🚀 手动触发客户询问工作流...\n");

  try {
    // 初始化 FeatBit 客户端
    const fbClient = await initFeatBitClient();
    console.log("✅ FeatBit 客户端已初始化\n");

    // 触发任务
    const handle = await tasks.trigger<typeof processCustomerInquiry>(
      "process-customer-inquiry",
      {
        inquiry: {
          id: "inquiry-" + Date.now(),
          userId: "user-test-123",
          message: "我忘记密码了，无法登录。如何重置？",
          type: "critical",  // 可选: 'critical' | 'feature' | 'integration' | 'quick'
        },
        fbClient: fbClient
      }
    );

    console.log("✅ 任务已触发!");
    console.log(`📋 Run ID: ${handle.id}`);
    console.log(`🔗 查看运行详情: https://cloud.trigger.dev/projects/${process.env.TRIGGER_PROJECT_ID}/runs/${handle.id}\n`);

    console.log("💡 提示:");
    console.log("   - 任务正在后台运行");
    console.log("   - 可以在 Trigger.dev 控制台查看实时日志");
    console.log("   - 访问: https://cloud.trigger.dev/projects/proj_vimroqyctvbzuyhcgzmb");

  } catch (error) {
    console.error("❌ 触发任务失败:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("deployed")) {
        console.log("\n💡 看起来任务还没有部署。请先部署:");
        console.log("   npm run trigger:deploy");
      }
    }
  }
}

// 运行
triggerCustomerInquiryWorkflow();
