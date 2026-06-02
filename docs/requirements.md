# Project Requirements: Infinity AI BuildFest 2026

## 1. Project Overview & Core Directives
* **Domain:** Branding & Marketing (MarTech)
* **Challenge Name:** Influencer Matching Engine
* **Definition:** A smart AI platform that matches brands with the most relevant and trustworthy creators or influencers.
* **Details:** This challenge is designed for teams who want to build systems that connect brands with suitable creators based on audience fit, authenticity, trust signals, and campaign relevance. The solution should go beyond simple follower counts and focus on deeper compatibility, credibility, and creator-brand alignment. Strong solutions will show reliable matching logic, use of social or creator ecosystem data, and a clear trust-based approach to influencer selection.
* **Required Stack:** Full stack + Graph AI
* **Resources:** Social APIs
* **Recommendations:** Focus on trust/authenticity
* **Winning Formula:** Matching accuracy

---

## 2. Submission Form Data Schema (Actionable Fields for AI)
*Instructions for AI Assistant: Use the following constraints and scoring weights to draft the final submission content. Fields with specific character limits or higher weights must be prioritized for density and clarity.*

### Section A: Basic Project Info (Basics Tab)
* **Elevator Pitch** – `[Text]` (Required, Max 200 chars)
* **Public Summary** – `[Textarea]` (Required) Concise overview for public viewing.
* **Problem Statement** – `[Textarea]` (Required) What problem does it solve?
* **Solution Description** – `[Textarea]` (Required) How does your solution work?

### Section B: Data Lifecycle & Engineering
*Checkboxes are multi-select; textareas allow free-form details.*

#### 1. Data Sources
* **Checkboxes:** [ ] Internal, [ ] External APIs, [ ] Public Web (scraping), [ ] Open Datasets, [ ] User Uploads, [ ] IoT/Sensor, [ ] Third-party/Partner, [ ] Synthetic/AI-generated
* **Details:** `[Textarea]` List specific sources (APIs, datasets, etc.)

#### 2. Acquisition Methods
* **Checkboxes:** [ ] Web Scrapers, [ ] AI Extraction, [ ] MCP Servers, [ ] Bulk Upload, [ ] Automated Flows, [ ] API Pull, [ ] RSS, [ ] Email Inbox, [ ] OCR, [ ] Speech-to-Text
* **Textareas:** * Scrapers/crawlers used (pre-filled: `Tavily Web Search`)
  * MCP servers for data access (pre-filled: `Context7, Graphify`)
  * Additional acquisition details

#### 3. Parsing, Formats & Cleaning
* **Formats:** [ ] JSON, [ ] CSV, [ ] XLSX, [ ] PDF, [ ] Parquet, [ ] Avro, [ ] XML, [ ] YAML, [ ] JSONL, [ ] Markdown, [ ] HTML, [ ] Images, [ ] Audio, [ ] Video, [ ] Protobuf
* **Textareas:** Parsers used, Formatters/converters, Data cleaning & enrichment, Schema validation.

#### 4. Storage Targets
* **Checkboxes:** [ ] Relational, [ ] NoSQL, [ ] Vector DB, [ ] Object Storage, [ ] Data Warehouse, [ ] Lakehouse, [ ] Graph DB, [ ] Cache/KV
* **Details:** `[Textarea]` Schema design, partitioning, indexes, retention.

#### 5. Visualization
* **Checkboxes:** [ ] Recharts, [ ] Chart.js, [ ] D3.js, [ ] Plotly, [ ] ECharts, [ ] Vega, [ ] Observable, [ ] Superset, [ ] Metabase, [ ] Grafana, [ ] Kibana, [ ] Streamlit, [ ] Dash
* **Textareas:** Visualization details, Dashboards & reports.

#### 6. Insights — AI, ML & non-AI
* **Checkboxes:** [ ] Classical ML, [ ] Deep Learning, [ ] LLM Inference / RAG, [ ] Forecasting, [ ] Anomaly Detection, [ ] Clustering, [ ] Rule Engine, [ ] Statistical Analysis
* **Textareas:** AI/ML details, Non-AI analytics, How insights are delivered.

#### 7. Pipelines & Orchestration
* **Textareas:** Orchestration tools, Scheduling/Triggers, Streaming/Real-time.

#### 8. Outbound — APIs & Distribution
* **Textareas:** Outbound APIs, Webhooks & exports, Embeddings/model serving.

#### 9. Open Source Stack
* **Details:** `[Textarea]` List open-source tools and their roles.

#### 10. Quality, Governance & Observability
* **Textareas:** Data quality, Privacy & compliance, Lineage & observability, Cost & performance.

#### 11. Publish local environment to internet
* **Checkboxes:** [ ] ngrok, [ ] Cloudflare Tunnel, [ ] Tailscale Funnel, [ ] localtunnel, [ ] Pinggy, [ ] bore, [ ] frp, [ ] Serveo, [ ] PageKite, [ ] Expose, [ ] zrok, [ ] GitHub Codespaces
* **Details:** `[Textarea]` Tunneling usage notes, auth, security posture.

---

## 3. AI Detail Usage (AI Depth Score)
*Fill all relevant fields to maximize auto-calculated points.*

* **Prompt Usage (10 pts):** `[Textarea]` Prompt patterns, iteration approach, versioning.
* **Token Optimization (10 pts):** `[Textarea]` Strategies to reduce cost/latency. 
  * *Tools:* [ ] Graphify, [ ] LLMLingua, [ ] Prompt Caching (Anthropic/OpenAI/Gemini/DeepSeek), [ ] Semantic dedup, [ ] Sliding-window, [ ] Rolling memory, [ ] JSON mode, [ ] Cheap-model routing, [ ] Batching, [ ] Speculative decoding.
* **LLMs / Models Used (15 pts max):** `[Checkboxes]` [ ] Claude, [ ] ChatGPT, [ ] Gemini, [ ] Kimi, [ ] DeepSeek, [ ] Llama, [ ] Mistral, [ ] Grok, [ ] Qwen. (+5 pts for explaining *why*).
* **Retrieval & RAG (12 pts max):** `[Checkboxes]` [ ] Naive RAG, [ ] Vector DB, [ ] Contextual RAG, [ ] Variable Chunking, [ ] Late Chunking, [ ] Graph RAG, [ ] Knowledge Graph, [ ] Hybrid Search, [ ] Rerankers, [ ] Agentic RAG, [ ] Self-RAG, [ ] Corrective RAG, [ ] Query Rewriting. (+5 pts for architecture details).
* **MCP Usage (20 pts):** `[Checkbox]` We built and/or used MCP servers/clients.
* **Open Source Tools (8 pts):** `[Textarea]` Libraries leveraged and contributions.
* **Agent Frameworks & Orchestration (7 pts):** `[Textarea]` Multi-agent setups, tool calling, planners.
* **Fine-tuning / Adaptation (5 pts):** `[Textarea]` LoRA, QLoRA, full fine-tunes.
* **Evaluation & Quality (7 pts):** `[Textarea]` LLM-as-judge, RAGAS, custom benchmarks.
* **Guardrails & Safety (6 pts):** `[Textarea]` PII redaction, output validation, jailbreak protection.
* **Frontend AI Builders (5 pts max):** `[Checkboxes]` [ ] Lovable, [ ] v0, [ ] Bolt.new, [ ] Cursor Composer, [ ] Claude Artifacts, [ ] Gemini Canvas, [ ] Windsurf, [ ] Replit Agent, [ ] Framer AI.
* **Workflow Automation (4 pts max):** `[Checkboxes]` [ ] n8n (+2 bonus), [ ] Zapier, [ ] Make, [ ] Airflow, [ ] Temporal, [ ] Dagster, [ ] Prefect, [ ] LangGraph, [ ] Windmill, [ ] Activepieces.
* **Local / On-device LLMs (8 pts max):** `[Checkboxes]` Runtimes (Ollama, vLLM, etc.) and Models (DeepSeek, Llama 3, Qwen, etc.). (+ Notes on hardware/quantization).
* **Agentic Frameworks:** `[Checkboxes]` [ ] Hermes, [ ] OpenClaw, [ ] LangGraph, [ ] CrewAI, [ ] AutoGen, [ ] OpenAI Swarm/Agents SDK, [ ] Letta, [ ] smolagents, [ ] Pydantic-AI, [ ] Mastra, [ ] DSPy, [ ] Agno, [ ] Google ADK.
* **AI Development Lifecycle (AI-DLC):** `[Checkboxes]` [ ] AWS Kiro, [ ] BMAD-METHOD, [ ] GitHub Spec-Kit, [ ] Cursor Rules, [ ] Cline Memory Bank, [ ] Aider conventions, [ ] Windsurf Rules.
* **Live `/docs` Module:** `[Checkbox]` Yes, we will ship a live documentation page.

---

## 4. Build Provenance (Visibility Settings)

### Data & AI Provenance (Judge + Admin)
* **data sources:** `[Textarea]` List data sources used.
* **ai models:** `[Textarea]` AI models used.
* **responsible ai:** `[Textarea]` Bias mitigation, transparency practices.

### Tooling & IDE (Team Only)
* **IDE / Editor:** Dropdown (Cursor, VS Code, etc.)
* **Deployment Method:** `[Text]` Vercel, AWS, Docker, etc.
* **Frameworks & Libraries:** `[Text]` React, LangChain, etc.
* **Context / Memory Files:** `[Textarea]` .cursorrules, CLAUDE.md.

### MCP Usage (Team Only)
* **mcp servers:** `[Text]` Name and purpose.
* **tools exposed:** `[Textarea]` Functions exposed via MCP.
* **permissions:** `[Text]` Access control scopes.

### Prompt Library (Team Only)
* **Prompt Entries:** Title, Category, Prompt Text, Output Summary, "Mark proprietary" toggle.

---

## 5. "Vibe to Production" 180-Second Video Pitch Structure
* **0:00 - 0:30 | Problem:** Define problem, users, urgency. *"This problem matters."*
* **0:30 - 1:00 | Solution:** AI-driven solution & differentiation. *"This is how we solve it."*
* **1:00 - 2:00 | Demo:** System walkthrough/prototype. *"This is how it works."*
* **2:00 - 2:30 | AI Approach:** Graph AI, RAG, models, data. *"This is real AI thinking."*
* **2:30 - 3:00 | Impact & Next Step:** Value proposition, scaling, KPIs. *"We can build and scale this."*

---

# Official BuildFest 2026 Guidelines

## AI-Native Reference Architecture (Enterprise-Scale Structure)
| Architecture Layer | Purpose | Key Capabilities | Recommended Technologies | Why It Matters |
|--------------------|---------|------------------|--------------------------|----------------|
| **User Interaction Layer** | Provide the interface through which users interact with the system. | Web apps, mobile apps, chat interfaces, dashboards, voice interfaces. | Lovable UI generation, web frameworks, mobile frameworks. | Ensures solutions are accessible to real users across devices and environments. |
| **Application Logic Layer** | Manage workflows, business logic, and system coordination. | API routing, request handling, business logic execution, service orchestration. | Supabase backend, edge functions, REST/GraphQL APIs. | Enables scalable application logic that can support enterprise workloads. |
| **AI Intelligence Layer** | Power reasoning, generation, prediction, and automation within the system. | Natural language reasoning, multimodal generation, predictive analytics. | LLMs such as ChatGPT, Claude, and Gemini. | Forms the core intelligence that differentiates AI-native systems from traditional software. |
| **Knowledge Retrieval Layer** | Provide contextual intelligence using structured data and documents. | Retrieval Augmented Generation (RAG), semantic search, contextual knowledge queries. | Vector databases (Supabase/PGVector), Graph databases. | Prevents hallucinations and allows AI systems to reason using real knowledge sources. |
| **Agent Orchestration Layer** | Coordinate multiple specialized AI agents to perform complex workflows. | Multi-agent reasoning, task delegation, automation pipelines. | MCP (Model Context Protocol), agent frameworks, and autonomous reasoning pipelines. | Enables complex systems where AI components collaborate to complete tasks efficiently. |
| **Data Infrastructure Layer** | Store, manage, and secure application data and embeddings. | Data storage, knowledge indexing, embedding storage, and system logging. | Supabase, relational databases, vector stores, and graph databases. | Provides a reliable, scalable data infrastructure essential for AI applications. |
| **Automation & Integration Layer** | Connect the AI system with external services and data sources. | API integrations, workflow automation, external data ingestion, service orchestration. | Automation tools, API gateways, integration frameworks. | Allows AI applications to interact with real-world platforms and enterprise systems. |
| **Deployment & Infrastructure Layer** | Ensure systems run reliably at global scale. | Cloud deployment, monitoring, security, performance optimization. | Cloud platforms, containerized or serverless infrastructure. | Enables applications to support global users, enterprise environments, and high traffic. |

## Top 10 Mistakes Teams Make (and How to Avoid Them)
| # | Common Mistake | What It Looks Like | Why It Hurts | How to Avoid (Prescription) |
|---|----------------|--------------------|--------------|-----------------------------|
| 1 | Using AI as a gimmick | Adding a chatbot without real intelligence or impact | Judges see superficial AI use; low technical score | Start with the problem → define where AI is essential → design the AI core first |
| 2 | No clear problem definition | Vague or overly broad idea | Hard to evaluate impact or value | Define: Who is the user? What pain? Why now? Add measurable KPIs |
| 3 | Weak architecture thinking | No clear flow (input → AI → output) | System cannot scale or be explained | Draw architecture early using Cursor/MD files; keep it modular |
| 4 | Ignoring real data | Fake or hardcoded data | No credibility, no real-world value | Use scrapers/APIs; build RAG + GraphDB for real context |
| 5 | No personalization | Same output for all users | Low impact, generic solution | Build user profiles; adapt responses based on behavior/data |
| 6 | No Bangla / localization | English-only UI and logic | Limits real adoption in Bangladesh | Add Bangla UI, voice, and low-bandwidth options |
| 7 | Overbuilding features | Too many features, none complete | Unstable demo, poor clarity | Focus on 1 core use case; make it work perfectly |
| 8 | No scalability thinking | Works only on local machine/demo | Fails enterprise readiness criteria | Design APIs, cloud-ready architecture, modular components |
| 9 | Poor demo & storytelling | Confusing explanation, unclear value | Judges cannot understand impact | Follow 4-minute structure: Problem → Solution → Demo → AI → Impact |
| 10 | Not leveraging team diversity | Only developers, no business or domain input | Solution lacks real-world relevance | Include business/domain roles + NRB/global perspective |
| **11** | **Not using modern AI tools properly** | Teams code everything manually, losing speed advantage | Judges penalize slow execution | Use Lovable, Cursor, Claude Code, MCP, RAG, agents - build faster and smarter |

## Official Judging Framework (100-Point Scale)

### Judging Criteria & Weight Allocation
| Criteria | Weight | What Judges Evaluate |
|----------|--------|----------------------|
| **Innovation** | 20% | Originality, creativity, and non-obvious AI application |
| **Technical Execution** | 20% | Architecture quality, AI integration depth, system robustness |
| **Business Model (+ Global Readiness)** | 20% | Monetization logic, adoption pathway, cross-border applicability |
| **Real-World Impact (+ Ethical AI Compliance)** | 20% | Problem relevance, measurable benefit, responsible AI safeguards |
| **Scalability (+ NRB Collaboration)** | 10% | Deployment feasibility, modular design, global builder integration |
| **Presentation** | 10% | Clarity, structure, confidence, and AI reasoning explanation |

### Detailed Evaluation Guidance
| Evaluation Category | Weight | What Judges Assess | Score Bands & Interpretation |
|---------------------|--------|--------------------|------------------------------|
| **Innovation** | 20% | Judges evaluate whether the idea is meaningfully differentiated, applies AI in a transformative way, and demonstrates bold or systems-level thinking rather than incremental improvements. | **0-5:** Incremental improvement or common idea.<br>**6-10:** Moderately differentiated concept with limited novelty.<br>**11-15:** Strong originality and creative AI integration.<br>**16-20:** Breakthrough or globally competitive innovation. |
| **Technical Execution** | 20% | Judges assess the clarity and robustness of the technical architecture, including input → processing → output workflow, model selection logic, integration of AI technologies, code reliability, and explainability of the intelligence core. | **0-5:** Basic prototype with limited AI implementation.<br>**6-10:** Functional architecture with moderate technical depth.<br>**11-15:** Well-structured AI-native system design.<br>**16-20:** Production-grade engineering maturity suitable for real-world deployment. |
| **Business Model (+ Global Readiness)** | 20% | Judges evaluate the clarity of the value proposition, monetization or sustainability pathway, user adoption strategy, cross-border market viability, and evidence of market validation or demand. | **0-5:** Concept without sustainability or business model.<br>**6-10:** Basic business logic with limited validation.<br>**11-15:** Viable market pathway with defined users.<br>**16-20:** Scalable, globally adaptable economic model with strong potential. |
| **Real-World Impact (+ Ethical AI Compliance)** | 20% | Judges consider the significance of the problem, measurable outcomes or KPIs, societal or economic relevance, responsible data usage, bias mitigation strategies, and overall transparency in AI design. | **0-5:** Weak or unclear impact case.<br>**6-10:** Clear localized benefit with limited scale.<br>**11-15:** Strong national relevance with measurable outcomes.<br>**16-20:** High social return with documented ethical safeguards. |
| **Scalability (+ NRB Collaboration)** | 10% | Judges evaluate whether the system can scale technically and operationally, including cloud readiness, modular architecture, infrastructure feasibility, inclusion of NRB or global collaboration, and alignment with international standards. | **0-3:** Demo-only system without scalability considerations.<br>**4-7:** Early scaling strategy with limited infrastructure planning.<br>**8-10:** Clear deployment pathway and strong global collaboration readiness. |
| **Presentation** | 10% | Judges assess the clarity of storytelling, effectiveness of the demonstration, ability to explain AI decisions, and overall professionalism and confidence of the team. | **0-3:** Unclear or poorly structured communication.<br>**4-7:** Clear presentation with moderate structure.<br>**8-10:** Compelling, data-driven, and investor-ready presentation. |

**Final Judging Principle:** Projects are evaluated independently. A score of 16‑20 in any category indicates a solution at the level of a global startup or enterprise product.

---

## Technical Expectations & Ethics
* **Must demonstrate:** AI‑native design, prompt engineering, model selection logic, context engineering, explainability, deployment feasibility.
* **Preferred:** RAG pipelines, MCP orchestration, automation tools, multimodal models, secure backend.
* **Ethics (Mandatory):** Lawful data usage, AI transparency, bias mitigation, no misleading demos. (Participants retain full IP ownership).

*End of requirements document – use this as the source of truth for generating submission answers and building your AI‑native solution.*