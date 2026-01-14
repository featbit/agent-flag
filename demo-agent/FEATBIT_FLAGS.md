# FeatBit Flag Configuration Examples

This document shows example configurations for the feature flags used in this demo.

## 1. Workflow Flag: `customer-support-workflow`

This flag determines which workflow combination to use.

```json
{
  "flagKey": "customer-support-workflow",
  "name": "Customer Support Workflow",
  "description": "Controls which prompt combination is used in the multi-stage workflow",
  "variations": [
    {
      "id": "combo_a",
      "name": "Combo A - Baseline",
      "value": {
        "combo": "combo_a"
      }
    },
    {
      "id": "combo_b",
      "name": "Combo B - Optimized",
      "value": {
        "combo": "combo_b"
      }
    }
  ],
  "targeting": {
    "rules": [
      {
        "name": "Critical inquiries get combo_b",
        "conditions": [
          {
            "property": "inquiryType",
            "op": "==",
            "value": "critical"
          }
        ],
        "variations": [
          {
            "id": "combo_b",
            "rollout": [0, 100]
          }
        ]
      }
    ],
    "defaultRollout": [
      {
        "id": "combo_a",
        "rollout": [0, 80]
      },
      {
        "id": "combo_b",
        "rollout": [80, 100]
      }
    ]
  }
}
```

## 2. Intent Analysis Flag: `intent-analysis`

Controls which version of the intent analysis prompt is used.

```json
{
  "flagKey": "intent-analysis",
  "name": "Intent Analysis Configuration",
  "description": "Controls the prompt configuration for Stage 1: Intent Analysis",
  "variations": [
    {
      "id": "v1",
      "name": "Version 1 - Original",
      "value": {
        "model": "gpt-4",
        "temperature": 0.7,
        "systemPrompt": "You are a customer support AI. Classify inquiries into categories."
      }
    },
    {
      "id": "v2",
      "name": "Version 2 - Optimized",
      "value": {
        "model": "gpt-4",
        "temperature": 0.5,
        "systemPrompt": "You are a customer support AI. Classify inquiries as: CRITICAL (production issues), FEATURE (how-to), INTEGRATION (API/SDK), QUICK (yes/no). Respond with JSON including category, urgency, and confidence."
      }
    }
  ],
  "targeting": {
    "rules": [
      {
        "name": "Use v2 for combo_b",
        "conditions": [
          {
            "property": "combo",
            "op": "in",
            "values": ["combo_b"]
          }
        ],
        "variations": [
          {
            "id": "v2",
            "rollout": [0, 100]
          }
        ]
      }
    ],
    "defaultVariation": "v1"
  }
}
```

## 3. Information Retrieval Flag: `info-retrieval`

Controls the retrieval strategy and configuration.

```json
{
  "flagKey": "info-retrieval",
  "name": "Information Retrieval Configuration",
  "description": "Controls the prompt configuration for Stage 2: Information Retrieval",
  "variations": [
    {
      "id": "v1",
      "name": "Version 1 - Standard",
      "value": {
        "model": "gpt-4",
        "temperature": 0.3,
        "strategy": "standard",
        "systemPrompt": "Retrieve relevant documents from knowledge base."
      }
    },
    {
      "id": "rag_v1",
      "name": "RAG Version 1",
      "value": {
        "model": "gpt-4",
        "temperature": 0.3,
        "strategy": "rag",
        "systemPrompt": "Use RAG (Retrieval-Augmented Generation) to search vector database and knowledge base for most relevant information."
      }
    }
  ],
  "targeting": {
    "rules": [
      {
        "name": "Use RAG for combo_b",
        "conditions": [
          {
            "property": "combo",
            "op": "in",
            "values": ["combo_b"]
          }
        ],
        "variations": [
          {
            "id": "rag_v1",
            "rollout": [0, 100]
          }
        ]
      }
    ],
    "defaultVariation": "v1"
  }
}
```

## 4. Response Generation Flag: `response-generation`

Controls how the final response is generated.

```json
{
  "flagKey": "response-generation",
  "name": "Response Generation Configuration",
  "description": "Controls the prompt configuration for Stage 3: Response Generation",
  "variations": [
    {
      "id": "v1",
      "name": "Version 1 - Text",
      "value": {
        "model": "gpt-4",
        "temperature": 0.8,
        "strategy": "text",
        "systemPrompt": "Generate a helpful customer support response in natural language."
      }
    },
    {
      "id": "structured_v1",
      "name": "Structured Version 1",
      "value": {
        "model": "gpt-4",
        "temperature": 0.7,
        "strategy": "structured",
        "systemPrompt": "Generate a structured JSON response with greeting, assessment, action, resources, and ticket ID."
      }
    }
  ],
  "targeting": {
    "rules": [
      {
        "name": "Use structured for combo_b",
        "conditions": [
          {
            "property": "combo",
            "op": "in",
            "values": ["combo_b"]
          }
        ],
        "variations": [
          {
            "id": "structured_v1",
            "rollout": [0, 100]
          }
        ]
      }
    ],
    "defaultVariation": "v1"
  }
}
```

## How to Set Up in FeatBit

1. Log into your FeatBit account
2. Navigate to your environment
3. Create each flag with the configurations above
4. The demo will automatically use these flags when you run it

## Testing Different Scenarios

### Scenario 1: Baseline (combo_a)
- User with `inquiryType: "feature"`
- Gets: Intent v1 + Retrieval v1 + Response v1

### Scenario 2: Optimized (combo_b)  
- User with `inquiryType: "critical"`
- Gets: Intent v2 + Retrieval RAG v1 + Response Structured v1

### Scenario 3: A/B Test
- 80% traffic gets combo_a
- 20% traffic gets combo_b
- Compare metrics to determine winner
