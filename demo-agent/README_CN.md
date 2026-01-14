# Agent Flag Demo 项目说明

## 项目概述

这是一个简单的 TypeScript 演示项目，展示了 Agent Flag 如何与多阶段 AI 工作流集成，实现智能化的 prompt 组合实验。

## 架构设计

### 三阶段客户支持工作流

1. **意图分析 (Intent Analysis)** - 分类客户咨询
2. **信息检索 (Information Retrieval)** - 检索相关知识库内容
3. **响应生成 (Response Generation)** - 生成客户响应

### 特性标志管理

- **工作流标志**: `customer-support-workflow` - 决定使用哪个 prompt 组合
- **阶段标志**: 
  - `intent-analysis` - 控制第一阶段的 prompt 版本
  - `info-retrieval` - 控制第二阶段的检索策略
  - `response-generation` - 控制第三阶段的输出格式

### 组合策略

- **Combo A (基线)**: Intent v1 + Retrieval v1 + Response v1
- **Combo B (优化)**: Intent v2 + Retrieval RAG v1 + Response Structured v1

## 项目结构

```
demo-agent/
├── src/
│   ├── stages/          # 三个工作流阶段的实现
│   ├── config.ts        # FeatBit 配置
│   ├── types.ts         # TypeScript 类型定义
│   ├── featbit-client.ts # FeatBit 客户端初始化
│   ├── workflow.ts      # 工作流编排逻辑
│   └── index.ts         # 演示入口
├── README.md            # 完整文档（英文）
├── QUICKSTART.md        # 快速开始指南
└── FEATBIT_FLAGS.md     # 特性标志配置示例
```

## 核心特性

### 1. 简化实现
- 每个阶段只使用 `console.log` 模拟实际操作
- 不需要真实的 LLM API 调用
- 专注于展示 Agent Flag 的工作原理

### 2. 灵活配置
- 通过 FeatBit 特性标志动态控制 prompt 版本
- 无需修改代码即可切换不同的组合策略
- 支持基于用户属性的智能路由

### 3. 易于扩展
- 模块化设计，易于添加新阶段
- 可以轻松替换 mock 实现为真实的 LLM 调用
- 支持添加更多 prompt 版本和组合

## 使用场景

### 实验场景 1: A/B 测试
- 80% 用户使用 combo_a（基线）
- 20% 用户使用 combo_b（优化版）
- 通过指标比较确定最佳组合

### 实验场景 2: 基于用户类型路由
- critical 类型的咨询 → combo_b（使用 RAG 和结构化输出）
- feature 类型的咨询 → combo_a（标准流程）
- 自动优化不同场景的处理策略

### 实验场景 3: 渐进式推出
- 第一周：5% 流量使用新组合
- 第二周：20% 流量
- 第三周：50% 流量
- 根据效果决定是否全量

## 快速开始

```bash
# 1. 安装依赖
cd demo-agent
pnpm install

# 2. 配置 FeatBit
# 编辑 src/config.ts，填入你的 environment secret

# 3. 在 FeatBit 中创建特性标志
# 参考 FEATBIT_FLAGS.md

# 4. 运行演示
pnpm run dev
```

## 预期输出

程序会处理 3 个不同类型的客户咨询：
1. Critical - 生产环境 API 故障
2. Feature - SDK 配置问题
3. Integration - CORS 错误

每个咨询都会经过完整的三阶段工作流，并显示：
- 使用的组合策略
- 每个阶段的配置和结果
- 最终的响应内容

## 核心优势

### 相比传统方法
- ❌ 传统：硬编码 if/else，每次改动需要重新部署
- ✅ Agent Flag：动态配置，远程更新，无需部署

### 相比 LLM 观测工具
- ❌ 观测工具：只能监控和记录
- ✅ Agent Flag：监控 + 配置 + 实验 + 优化的闭环

### 开发效率
- 实验周期：从 72 小时降至 30 分钟
- 代码量：约 50 行实现完整实验能力
- ROI：7,980%（根据主 README 数据）

## 下一步

1. **连接真实 LLM**: 替换 mock 函数为 OpenAI/Claude API 调用
2. **添加指标追踪**: 集成 OpenTelemetry，追踪实验效果
3. **创建更多版本**: 添加 v3, v4 等更多 prompt 变体
4. **扩展工作流**: 增加更多阶段（如情感分析、优先级排序等）
5. **自动优化**: 结合指标数据，实现自动选择最佳组合

## 技术栈

- **TypeScript** - 类型安全的开发体验
- **FeatBit Node SDK** - 特性标志管理
- **Node.js** - 运行时环境

## 文档

- [README.md](README.md) - 完整项目文档
- [QUICKSTART.md](QUICKSTART.md) - 5 分钟快速开始
- [FEATBIT_FLAGS.md](FEATBIT_FLAGS.md) - 特性标志配置详解
- [../insights-bh.md](../insights-bh.md) - Agent Flag 深度文章

## 参考资料

- FeatBit 官网: https://featbit.co
- FeatBit 文档: https://docs.featbit.co
- Node SDK: https://github.com/featbit/featbit-node-server-sdk
