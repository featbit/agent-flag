## Pain Scenario: Combinatorial Prompt Management

In modern AI orchestration flows, every stage owns its own prompt (often with multiple revisions or wrappers), so swapping a single prompt for an experiment is easy, but coordinating a full end-to-end combination of prompt variants is brittle: engineers end up hard-coding `if/else` ladders or tangled config files just to express pairings, the cross-stage combinations cannot be visualized or audited, and experiment runs rarely sync with product metrics, making it impossible to tell which compound prompt stack actually improved conversion, latency, or safety rates.

```mermaid
graph LR
	subgraph Stage 1
		P1A[Prompt v1]
		P1B[Prompt v2]
	end

	subgraph Stage 2
		P2A[Prompt v1]
		P2B[Prompt v2]
		P2C[Wrapper CC]
	end

	subgraph Stage 3
		P3A[Prompt v1]
		P3B[Prompt with Toolchain]
	end

	P1A -->|Combo A| P2A --> P3A
	P1B -->|Combo B| P2B --> P3B
	P1A -. ad hoc logic .-> P2C
	P2C -. opaque path .-> P3B

	Note over P1A,P3B: Metric alignment unclear<br/>Traceability lost

	classDef risk fill:#ffe0e0,stroke:#ff4d4f
	class P2C,P3B risk
```
