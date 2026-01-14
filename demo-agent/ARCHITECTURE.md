# Agent Flag Demo Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FeatBit Platform                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │ Workflow Flag    │  │ Stage Flags      │  │ User Targeting ││
│  │ (combo routing)  │  │ (prompt configs) │  │ (rules/rollout)││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Feature Flag API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Demo Agent Application                        │
│                                                                  │
│  ┌────────────────┐                                            │
│  │ index.ts       │  Main entry point, runs demo scenarios     │
│  └────────┬───────┘                                            │
│           │                                                     │
│           ▼                                                     │
│  ┌────────────────┐                                            │
│  │ workflow.ts    │  Orchestrates 3-stage workflow            │
│  └────────┬───────┘                                            │
│           │                                                     │
│           ├─────────────┬─────────────┬────────────────┐      │
│           ▼             ▼             ▼                │      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐   │      │
│  │ Stage 1:   │  │ Stage 2:    │  │ Stage 3:     │   │      │
│  │ Intent     │→ │ Info        │→ │ Response     │   │      │
│  │ Analysis   │  │ Retrieval   │  │ Generation   │   │      │
│  └────────────┘  └─────────────┘  └──────────────┘   │      │
│       │               │                  │             │      │
│       └───────────────┴──────────────────┘             │      │
│                       │                                │      │
│                       ▼                                │      │
│  ┌────────────────────────────────────────┐           │      │
│  │ featbit-client.ts                      │           │      │
│  │ (FeatBit SDK wrapper)                  │◄──────────┘      │
│  └────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Inquiry Received
```
Customer Inquiry
└─> { userId, type, message }
```

### 2. Flag Evaluation
```
User Context                    FeatBit Flags
┌────────────────┐             ┌───────────────────────────┐
│ userId: "123"  │────────────>│ customer-support-workflow │
│ type: "critical"│             │   ├─> combo_a (baseline)  │
└────────────────┘             │   └─> combo_b (optimized) │
                               └───────────────────────────┘
         │                              │
         │                              │
         └──────────┬───────────────────┘
                    ▼
              Selected Combo
              (e.g., combo_b)
```

### 3. Stage Execution with Combo Context
```
Context: { userId, type, combo }
         │
         ├──────────────────────────────────────┐
         │                                       │
         ▼                                       │
Stage 1: intent-analysis flag                   │
├─> combo_b condition matched                   │
├─> Returns: { model, temp, prompt }            │
└─> Execute: analyzeIntent()                    │
         │                                       │
         │ Result: intent classification         │
         ▼                                       │
Stage 2: info-retrieval flag                    │
├─> combo_b condition matched                   │
├─> Returns: { strategy: "rag" }                │
└─> Execute: retrieveInformation()              │
         │                                       │
         │ Result: relevant documents            │
         ▼                                       │
Stage 3: response-generation flag ──────────────┘
├─> combo_b condition matched
├─> Returns: { strategy: "structured" }
└─> Execute: generateResponse()
         │
         │ Result: final response
         ▼
    Complete Workflow Result
```

## Workflow Combinations

### Combo A (Baseline)
```
┌───────────────┐    ┌──────────────┐    ┌──────────────────┐
│ Intent v1     │───>│ Retrieval v1 │───>│ Response v1      │
│               │    │              │    │                  │
│ - GPT-4       │    │ - Standard   │    │ - Text format    │
│ - Temp: 0.7   │    │ - KB search  │    │ - Temp: 0.8      │
└───────────────┘    └──────────────┘    └──────────────────┘
```

### Combo B (Optimized)
```
┌───────────────┐    ┌──────────────┐    ┌──────────────────┐
│ Intent v2     │───>│ Retrieval    │───>│ Response         │
│               │    │ RAG v1       │    │ Structured v1    │
│ - GPT-4       │    │              │    │                  │
│ - Temp: 0.5   │    │ - RAG        │    │ - JSON format    │
│ - Optimized   │    │ - Vector DB  │    │ - Temp: 0.7      │
└───────────────┘    └──────────────┘    └──────────────────┘
```

## User Routing

```
┌──────────────────────────────────────────────────────────────┐
│                    Targeting Rules                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Rule 1: Critical Inquiries                                  │
│  ┌────────────────────────────────────────┐                 │
│  │ IF inquiryType == "critical"           │                 │
│  │ THEN combo_b (100%)                    │                 │
│  └────────────────────────────────────────┘                 │
│                                                               │
│  Default: A/B Test                                           │
│  ┌────────────────────────────────────────┐                 │
│  │ 80% → combo_a                          │                 │
│  │ 20% → combo_b                          │                 │
│  └────────────────────────────────────────┘                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Experiment Workflow

```
1. Setup
   └─> Create flags in FeatBit
   └─> Configure combos and targeting

2. Execution
   └─> Application queries flags
   └─> Users routed to different combos
   └─> Workflow executes with assigned configs

3. Measurement
   └─> Collect metrics per combo
   └─> Compare performance
   └─> Identify winner

4. Optimization
   └─> Adjust traffic allocation
   └─> Create new prompt versions
   └─> Repeat experiment
```

## Code Structure

```
src/
├── index.ts                    # Entry point
│   └─> Creates sample inquiries
│   └─> Calls workflow for each
│
├── workflow.ts                 # Main orchestrator
│   └─> Evaluates workflow flag
│   └─> Evaluates stage flags
│   └─> Executes stages sequentially
│
├── stages/
│   ├── intent-analysis.ts     # Stage 1
│   ├── info-retrieval.ts      # Stage 2
│   └── response-generation.ts # Stage 3
│
├── featbit-client.ts          # SDK wrapper
│   └─> Initialize client
│   └─> Manage connection
│
├── config.ts                  # Configuration
│   └─> FeatBit settings
│   └─> Flag keys
│
└── types.ts                   # Type definitions
    └─> Interfaces for all data structures
```

## Key Benefits Illustrated

```
Traditional Approach          Agent Flag Approach
═══════════════════          ═══════════════════

Hard-coded logic              Dynamic configuration
     │                             │
     ▼                             ▼
┌────────────┐              ┌────────────┐
│ if/else    │              │ Flag query │
│ ladders    │              │ (runtime)  │
└────────────┘              └────────────┘
     │                             │
     ▼                             ▼
Needs deployment             No deployment needed
     │                             │
     ▼                             ▼
72 hour cycle                30 minute cycle
     │                             │
     ▼                             ▼
High risk                    Instant rollback
```

## Mock Implementation Note

All stage functions use `console.log` for demonstration:
- No actual LLM API calls
- Simulates different behaviors based on config
- Easy to understand and extend
- Can be replaced with real implementations

This keeps the demo simple while showing the complete Agent Flag pattern.
