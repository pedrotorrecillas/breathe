# Sierra teardown for an AI-native recruitment company

## What Sierra is really building

Sierra is not primarily selling “better support automation”. It is selling a new operating model for customer-facing work: the agent as the company’s front door, capable of understanding intent, taking action in systems of record, and representing brand, policy, and tone across channels. That thesis was there at launch in February 2024, when Sierra described conversational AI as a shift on par with the internet and argued that “every company needs an agent”; by early 2026 it had scaled that idea into a large enterprise business, reporting $100M ARR in November 2025 and over $150M ARR by February 2026. The company was founded by entity["people","Bret Taylor","software executive"] and entity["people","Clay Bavor","google executive"], whose backgrounds at entity["company","Salesforce","crm software company"], entity["company","Google","technology company"], and entity["organization","OpenAI","ai research company"] give Sierra unusual credibility with both enterprise buyers and AI talent. citeturn39search0turn14view0turn24view0turn23search13turn32view0

The wedge is customer service, but the strategic claim is broader: conversation becomes the interface, and support is just the first department where that interface is valuable enough and measurable enough to replace labour. Sierra’s own messaging steadily moved from support resolution to “the AI version of your company”, then to a single agent spanning support, recommendations, subscription management, retention, real-estate search, and even mortgage origination. That is why Sierra increasingly describes its category as customer experience AI agents rather than chatbots or helpdesk AI. citeturn39search0turn6view2turn32view0turn14view0

Why now? Because frontier models made open-ended language understanding good enough, APIs made transactional systems reachable enough, and enterprises finally had enough digital exhaust to define workflows, guardrails, and evaluations. Sierra’s own explanation is that the difference between failed AI pilots and real impact is not “better demos” but starting from a job to be done that can be measured, guarded, and improved. That framing is important: Sierra wins by treating AI as engineering plus operations, not as model theatre. citeturn32view0turn14view2turn10view1

Against incumbents, Sierra’s positioning is clean. Versus classic helpdesk vendors like entity["company","Zendesk","customer service software"], the critique is that seat-based economics conflict with true automation. Versus entity["company","Intercom","customer service software"] and entity["company","Decagon","ai customer support startup"], the real distinction is less “we use better LLMs” and more “we handle the hard production layer”: supervision, release management, simulations, traceability, cross-channel deployment, and forward-deployed partnership. Sierra’s own build-vs-buy argument repeatedly emphasises orchestration, auditability, release management, and integration depth as the submerged iceberg most teams underestimate. citeturn17view0turn21view1turn22view0turn10view1turn27view0

The long-term vision is also unusually explicit. Sierra believes software is moving from code to no-code to “no clicks”; that future software is headless infrastructure used directly by agents; and that teams will increasingly specify desired outcomes while agents build, test, and improve workflows on their behalf. That is not a support-company vision. It is a claim about the future of work: humans define intent, policy, judgement, and taste; agents perform the repetitive, high-volume operational work between those boundaries. citeturn31view0turn19search12turn6view2

**Transferable insight for recruitment:** do not start with “AI recruiter”. Start with one hard, high-volume, measurable job to be done where language understanding plus systems access can replace human coordination work. Sierra’s genius is that the first wedge is narrow enough to ship and broad enough to expand. citeturn32view0turn14view0

## Why the product works

Sierra’s product works because its unit of value is not “an answer” but a completed, policy-compliant outcome inside a live business workflow. In customer support that means a resolved conversation, a saved subscription, a completed change, a routed escalation with full context, or a proactive personalised intervention. That is why Sierra’s agents are built to do things like process returns, update subscriptions, troubleshoot devices, reset radios, verify identity, or route hand-offs, not merely recite documentation. citeturn17view0turn3view3turn6view1turn35search0

The product primitives are surprisingly stable across Sierra’s surface area:

- **Journeys**: explicit workflow definitions for how a task should be handled end to end.  
- **Goals and guardrails**: what the agent is trying to achieve, and what it must never violate.  
- **Skills and tools**: API-connected actions and system integrations.  
- **Knowledge**: policies, FAQs, SOPs, transcripts, and dynamic external data.  
- **Supervision**: real-time correction and safety enforcement.  
- **Monitoring and traces**: evaluation, debugging, and latency visibility.  
- **Simulation**: pre-production stress testing for chat and voice.  
- **Memory and decisioning**: persistent context across sessions and channels.  
- **Human assist**: escalation and agent-assist when full autonomy is not appropriate. citeturn3view1turn3view3turn29view0turn10view6turn6view3

That stack produces a customer experience that feels simple on the surface but is rich underneath. Customers interact through chat, voice, email, SMS, app, web, WhatsApp, contact centre tooling, and increasingly general AI channels; the business sees one logical agent with one body of knowledge and one set of journeys deployed everywhere. Sierra states this directly: build once, deploy everywhere. citeturn6view2turn3view2turn33view0

Human-in-the-loop is used more intelligently than most AI products. Sierra does not treat human involvement as failure. It uses humans for escalation, assisted execution, review, and improvement. Live Assist gives reps real-time guidance, drafted responses, and one-click actions. Expert Answers turns human resolutions into reviewable knowledge articles that feed back into the agent. Monitors surface problematic conversations for inspection. This is a critical non-obvious point: Sierra is not replacing the care team first; it is turning the care team into the training and exception system for the agent. citeturn3view2turn5view2turn29view0

The UX pattern is also notable. Sierra separates **authoring** from **runtime**. Runtime should feel conversational and invisible; authoring should feel like product development, with workspaces, snapshots, release pipelines, CI/CD support, simulations, rollbacks, and collaboration across CX, ops, product, and engineering. That is why Agent Studio and the Agent SDK coexist. Sierra understood earlier than most that the real buyer does not want an “AI tool”; they want a development system for a new class of production software. citeturn27view0turn10view2turn3view4

You can summarise Sierra’s product model like this:

```text
Brand policy + SOPs + data + integrations
            ↓
      journeys and tools
            ↓
 multi-model agent runtime
            ↓
 supervisors + monitors + traces
            ↓
 automated resolution / assisted resolution
            ↓
 feedback, simulations, knowledge updates
            ↓
 better next release
```

That loop is what makes Sierra replicable in principle but hard in practice. The front-end conversation is the least defensible part. The closed loop between workflow authoring, action-taking, supervision, evaluation, and improvement is the actual product. citeturn27view0turn29view0turn10view6turn5view2

## How Sierra makes AI production-grade

The single best way to understand Sierra’s architecture is this: it does not trust a single LLM call to behave like production software. Instead, it decomposes behaviour into tasks, wraps those tasks with deterministic controls where needed, adds supervisory agents around them, and evaluates everything continuously. Sierra itself says its agents use 15+ frontier, open-weight, and proprietary models depending on the job to be done. Different sub-tasks get different latency, reasoning, classification, retrieval, and tone models. citeturn11view0turn6view1

At a high level, the architecture looks like this:

```text
User input
  → channel adapter
  → journey / orchestration layer
      → retrieval + memory
      → planning / classification
      → tool selection and API actions
      → response generation
  → supervisor models
  → output / handoff
  → monitors, traces, simulations, analytics
```

Sierra’s own technical writing consistently points to four design choices.

First, **declarative workflows with deterministic boundaries**. The Agent SDK lets teams define goals and hard guardrails in a way abstracted from the underlying LLMs. Sierra repeatedly uses the example that an exchange policy with a 30-day limit should be strictly enforced even if the rest of the interaction remains flexible and conversational. This is the correct design choice for any high-stakes workflow: use LLMs for interpretation and adaptation, deterministic logic for compliance-critical state transitions. citeturn3view4turn6view1

Second, **supervisors as a systems pattern**. Sierra’s supervisors run in parallel, verify facts, enforce policy, detect misuse, and can observe, redirect, intercept, escalate, or end the conversation depending on risk. Importantly, Sierra does not use one generic safety wrapper. It uses several supervisors with different roles and sometimes different models, each independently evaluated and tuned. That is a very strong production pattern: decompose safety and quality into specialised checks instead of hoping one giant prompt will do everything. citeturn6view0turn29view0turn3view0

Third, **evaluation before and after launch**. Sierra customers reportedly run more than 35,000 simulations a day, and Voice Sims reproduce noisy, emotional, interrupted conversations using a dual-loop architecture plus an LLM judge. Agent Traces capture reasoning paths, tool calls, knowledge lookups, network requests, timings, and bottlenecks in both testing and production. Monitors then evaluate every conversation at scale across coherence, repetitiveness, factual grounding, sentiment, and custom business attributes. Sierra is doing what most AI startups postpone: building QA as a first-class product. citeturn29view1turn29view2turn10view6turn29view0

Fourth, **infrastructure that preserves behaviour under provider instability**. Sierra’s multi-model reality created a new reliability problem: if routing silently swaps providers or models, agent behaviour can drift. Its published solution is a Multi-Model Router plus a congestion-aware provider selector with admission control, so failover preserves pre-validated task-level model choices where possible instead of opportunistically changing behaviour. That is one of the most non-obvious and transferable insights in the whole teardown: in agent systems, uptime is not enough; behavioural consistency is part of reliability. citeturn11view1

Two additional technical moves matter a lot. Sierra built custom retrieval and reranking models, Linnaeus and Darwin, because support search is not generic semantic search; it is resolution-oriented retrieval over messy, shifting policy corpora. And it added an Agent Data Platform so the agent can remember cross-session and cross-channel context, joining structured data with unstructured interaction history. In plain English: Sierra realised that support quality breaks on memory and on retrieval long before it breaks on raw language generation. citeturn30view0turn6view3

This is why Sierra feels “AI-native” rather than “software with AI added”. The LLM is not the product. The product is the control plane around non-deterministic intelligence. That pattern is absolutely transferable to recruitment. citeturn11view0turn3view4turn29view0

## Business model and go-to-market

Sierra’s pricing philosophy is outcome-based. It says publicly that it gets paid when it completes a task, that outcome criteria are agreed upfront, that many escalations are not charged, and that simpler routing or greeter interactions can be handled under blended consumption pricing. That is a material strategic choice because it moves the commercial conversation from activity to business value. Sierra is selling labour replacement and outcome delivery, not seats. citeturn17view0

The exact price card is not public, but the available signal is strong. Sierra’s founders told the market it books revenue through upfront enterprise contracts, often at least 12 months and sometimes multi-year, billed annually up front. That means Sierra has married an AI-native outcome story to classic enterprise-software revenue discipline. This is one reason its ARR claims matter more than a typical usage-based AI startup’s run rate. citeturn17view1

That model also clarifies how Sierra positions against incumbents. Intercom’s Fin is publicly priced at $0.99 per outcome, and if customers use Intercom’s helpdesk they also pay seat fees. Salesforce’s Agentforce for Service is still explicitly user-per-month. Decagon publicly supports both per-conversation and per-resolution pricing and says many customers choose per-conversation for predictability. Sierra’s bet is more aggressive: if the agent is genuinely autonomous, pricing should tie directly to completed work, not software access or mere traffic volume. citeturn21view1turn21view2turn21view3turn21view5turn22view0turn17view0

Margin-wise, Sierra does not disclose gross margin, so any comparison to BPOs is necessarily inferential. Still, the logic is straightforward. Traditional BPO economics are labour-heavy and structurally capped; public comps such as entity["company","Concentrix","bpo company"] reported 12.8% non-GAAP operating margin for fiscal 2025, while entity["company","TaskUs","bpo company"] reported 21.0% adjusted EBITDA margin for 2025. Sierra’s own view of voice economics is that many support calls historically cost $10–$20 each, and that lowering that to cents changes the economics of talking to customers entirely. The implication is that an AI-native service layer can undercut or augment BPOs while retaining more software-like contribution margins over time, provided forward-deployed services and inference costs do not swallow the software margin. citeturn25search1turn25search2turn34view0

The GTM motion is enterprise, top-down, and operationally heavy. Sierra sells to businesses where support quality is strategic, support volume is high, and compliance matters: financial services, healthcare, telecom, media, travel, retail, and technology. It claims to work with 40% of the Fortune 50, and states that one in four customers has revenue above $10B and half above $1B. That is not a PLG business. It is a board-level, VP-level, and operations-level sale. citeturn38view0turn32view0

But the entry motion is surprisingly practical. Sierra lands with a narrow, high-frequency wedge and promises speed. Public examples include a global retailer launched in six weeks, a large healthcare deployment launched in seven weeks, a Singtel pilot launched in under ten weeks, and early WeightWatchers traffic tested on a small percentage of sessions before broader rollout. This matters because Sierra has learned the right lesson about AI buying: “time to trustworthy value” beats “breadth of vision” in the first sale. citeturn15search1turn32view0turn12search3turn12search1

Expansion then follows a predictable staircase:

```text
FAQ / simple support
  → transactional support
  → voice
  → agent assist
  → proactive personalisation
  → retention / sales / growth use cases
```

Sierra’s public customer stories show exactly this pattern, moving from support containment to subscription management, content recommendations, conversational search, mortgage origination, and proactive retention. The lesson for recruitment is that the first sale should solve an obvious operational bottleneck, but the roadmap should point to revenue, not admin efficiency alone. citeturn35search0turn32view0turn12search5

## Organisation, moats, and where Sierra can still fail

Sierra’s org design is one of its most underrated advantages. The company explicitly says everyone spends time with customers, and its operating values place customer obsession, trust, craftsmanship, and intensity at the centre. More importantly, it created new job categories around the product itself: Agent Engineers, Agent Product Managers, forward-deployed agent development teams, and an APX rotation that trains early hires across engineering and product while putting them in direct exposure to customers, founders, and business reviews. That is exactly what an AI-native company should do: organise around deployed workflows, not departmental turf. citeturn24view0turn18search2turn27view0

The hiring footprint reinforces this. Sierra’s careers page spans Agent Architecture, Agent Data Platform, Agent Studio, Insights, Intelligence, Voice, Infrastructure, SRE, Security, Product, and language-specific Agent Engineering roles, alongside a new President of Field Operations leading global Sales, Sales Engineering, and Partnerships. That is a revealing shape: Sierra is not staffing a model lab with a sales team attached. It is staffing a product company whose product happens to be AI agents. citeturn18search1turn38view0

The real moats are therefore not the obvious ones. Model access is not a moat. A no-code UI is not a moat. A generic RAG stack is not a moat. Sierra’s defensibility is stronger in five areas.

The first moat is **workflow depth**: customer journeys encoded in reusable abstractions, with system actions, policy logic, and evaluation history attached. The second is **operational data**: not just transcripts, but labelled failure modes, simulation suites, monitor logic, traces, escalation outcomes, and release history. The third is **trust infrastructure**: compliance posture, deterministic controls, supervision, PII masking, and production-grade auditability. The fourth is **organisation**: forward-deployed teams plus product infrastructure plus enterprise sales. The fifth is **distribution into regulated enterprises**, where procurement, security review, and proof of reliability are themselves barriers to entry. citeturn3view0turn27view0turn10view6turn29view0turn32view0

There are also real non-replicables. The founders’ credibility is one. Early design-partner access with brands like entity["company","WeightWatchers","wellness company"], entity["company","SiriusXM","satellite radio company"], entity["company","Sonos","audio company"], and entity["company","OluKai","footwear brand"] is another. The ability to acquire voice capability early via Receptive AI, expand globally, and attract a seasoned field-ops leader are advantages that a copycat will not get on demand. citeturn39search0turn37search0turn24view0turn38view0

Still, Sierra can fail. The hardest unsolved problems remain real. Outcome pricing can create billing disputes if definitions blur. Enterprise partnership can quietly turn into expensive services drag. AI assistants outside the company’s control can threaten channel ownership. Incumbents still win on installed base, existing workflow ownership, and procurement familiarity. And even Sierra’s own technical writing makes clear that hallucinations, latency, abuse, and behavioural drift are not “solved”; they are managed as systems problems. citeturn17view0turn20search0turn21view5turn6view0turn11view1

The most important critical take is this: Sierra is defensible if it remains the best **agent operating system plus deployment machine**. It is much less defensible if it lets itself be perceived as “the company that builds nice support bots”. citeturn27view0turn31view0

## Blueprint for Sierra for Recruitment

The cleanest translation is not “support, but for hiring”. It is:

```text
Support ticket      → candidate case
Support resolution  → stage-complete hiring outcome
Contact-centre rep  → recruiter / coordinator / hiring manager
Knowledge base      → hiring policy, role rubric, process SOP, employer brand
CRM / order systems → ATS, scheduling, HRIS, assessment, background-check systems
CSAT / resolution   → candidate NPS, stage completion, time-to-schedule, show-up rate, offer accept
```

That mapping matters because it avoids the most common HR-tech mistake: pricing and designing around the final hire. In Sierra terms, the equivalent of “automated resolution” in recruitment is **a policy-compliant stage transition completed without human intervention**. Examples: applicant screened, missing documents collected, scheduling completed, interview rescheduled, candidate query resolved, scorecards chased, references completed, offer questions answered, onboarding paperwork submitted. “Hire” is too infrequent and too downstream to be your core unit of value. citeturn17view0turn27view0

So the product concept should be a **Recruitment Agent OS**, not a “sourcing assistant” or “AI recruiter”. It should own everything between application and hire, with one agent across SMS, email, WhatsApp, voice, career site, recruiter console, and ATS surfaces. The candidate sees a single coherent hiring interface. The recruiting team sees journeys, monitors, traces, live assist, and stage outcomes. That is the recruitment equivalent of Sierra’s build-once, deploy-everywhere model. citeturn6view2turn3view2turn33view0

The core features should follow Sierra’s primitives almost exactly.

A **Candidate Journeys** layer should encode each role family’s process: hourly retail hiring, customer support hiring, graduate recruiting, nursing, warehouse, GTM, executive. Each journey defines steps, required information, fairness boundaries, role-specific knockouts, escalation rules, and employer-brand tone. Use natural language authoring for talent ops and code-level control for complex or regulated roles. citeturn3view1turn27view0

A **Tool and Action Layer** should connect to the ATS, calendar, communications tools, assessment vendors, identity verification, background checks, HRIS, and offer systems. The agent must not stop at “here is what to do next”; it should do the next thing when allowed. Sierra’s lesson is clear: RAG without systems access does not automate workflows; it only decorates them. citeturn3view3turn3view5

A **Recruiter Live Assist** layer should mirror Sierra’s Live Assist. During calls or candidate chats, recruiters get real-time guidance, auto-drafted updates, next-best actions, interviewer briefs, and one-click workflows. That has two benefits: it improves human productivity immediately, and it turns assisted conversations into feedback and training data for the autonomous agent later. citeturn3view2turn5view2

A **Hiring Knowledge Engine** should unify policy docs, role rubrics, FAQs, process docs, interviewer guidance, compensation bands, and candidate communications. Over time it should do what Expert Answers does for Sierra: turn recruiter resolutions into reviewed, reusable knowledge. The non-obvious recruitment advantage is that many “exceptions” are not true exceptions; they are undocumented edge cases. citeturn5view2turn30view0

A **Compliance and Fairness Control Plane** should sit above the journey engine. In recruitment this is even more important than in support. You need deterministic boundaries around protected characteristics, jurisdictional hiring rules, accommodation handling, adverse-action rules, data retention, explanation logging, and role-specific qualification thresholds. Sierra’s supervisor pattern is directly portable here, but the monitors should include fairness and adverse-impact checks, not just coherence and sentiment. citeturn3view0turn29view0turn6view0

A **Hiring Simulation and Trace Layer** should be non-negotiable. Run synthetic candidate scenarios across languages, messy CVs, conflicting histories, accommodation requests, flaky scheduling, bad audio, no-shows, salary objections, and hostile edge cases. Use traces to explain why the agent screened in, screened out, escalated, or scheduled. Recruitment buyers will ask for auditability long before they ask for more “AI magic”. citeturn29view2turn10view6turn10view5

A **Hiring Memory Platform** should store candidate context across sessions and channels: past applications, role preferences, geography, availability, prior rejections, interview history, communication history, and consent state. This is the recruitment analogue of Sierra’s Agent Data Platform. Without memory, your agent will feel like a stateless scheduler. With memory, it can behave like a serious candidate-ops system. citeturn6view3

Where can the agent be fully autonomous? Application FAQs, eligibility collection, missing-document chasing, scheduling and rescheduling, reminders, interview logistics, travel coordination, post-interview updates, reference collection, basic offer clarification, onboarding checklist completion. Where should humans remain central? Final evaluation, close persuasion for top candidates, compensation negotiation, sensitive accommodation handling, exceptions to policy, and final hiring decision. Sierra’s philosophy of “augment first, automate with proof” is the right one here. citeturn24view0turn3view2turn5view2

The right pricing model for recruitment is a Sierra-style blend, but with better units than “per hire”. I would price on **stage-complete outcomes**:

- per qualified screen completed  
- per interview scheduled and attended  
- per reference/background package completed  
- per offer accepted  
- plus a platform fee for integrations, observability, compliance, and recruiter assist

You can add a premium “growth” metric for hard-to-fill or high-volume roles, but avoid pure contingent pricing. Final hires are too noisy, too delayed, and too affected by employer brand, comp, and manager quality to be the only commercial metric. Sierra’s own move to blend outcome and consumption pricing for different interaction types supports this logic. citeturn17view0

The GTM motion should mirror Sierra’s. Do not start in executive search or highly bespoke knowledge-work hiring. Start where volume, coordination pain, and SLA pressure are brutal: frontline retail, logistics, hospitality, customer support, healthcare ops, field services, and BPO hiring. Sell to Heads of Talent Operations, TA leaders, and CHROs, with the CFO-friendly story being reduced time-to-fill and recruiter cost-to-serve, and the COO-friendly story being show-up rates and staffing reliability. The first pilot should be one role family, one geography, one ATS, four to eight weeks to launch, with clear metrics: time-to-schedule, completion rate, recruiter hours saved, candidate satisfaction, show-up rate, and conversion to manager screen. That is the recruitment version of Sierra’s “jobs to be done” discipline. citeturn32view0turn15search1turn12search3

The org should also copy Sierra more than traditional HR tech. Early on you need:

- a founder with recruiting workflow credibility  
- a founder or senior leader with AI systems and reliability depth  
- forward-deployed Agent Engineers embedded with customers  
- Agent Product Managers who own workflow design and expansion  
- a Policy and Fairness lead  
- integrations engineers for ATS/HRIS/ecosystem tooling  
- an evals and simulations team  
- recruiter-assist / candidate-experience product design  
- enterprise sales plus sales engineering, not self-serve growth first

In other words: build a workflow company with an AI backbone, not an AI company looking for an HR use case. That is one of Sierra’s clearest lessons. citeturn18search2turn27view0turn18search1turn38view0

## Key insights

- Sierra wins because it prices completed work, not software access. That forces product, GTM, and customer success to align around true operational outcomes. citeturn17view0turn17view1

- The real product is not the conversation. It is the control plane around the conversation: journeys, tools, supervision, monitoring, traces, and release management. citeturn27view0turn29view0turn10view6

- “Every company needs an agent” is not marketing fluff; it is Sierra’s architecture brief. Everything it builds assumes conversation will replace much of the current app and help-centre surface area. citeturn39search0turn6view2

- Sierra’s non-obvious moat is eval infrastructure. Simulations, Voice Sims, monitors, traces, and benchmark work are what turn AI from demo to deployment. citeturn29view1turn29view2turn10view5turn10view6

- Multi-model orchestration matters less for raw model quality than for task separation. Sierra’s advantage is choosing the right model for each sub-task and isolating those choices behind abstractions. citeturn11view0turn11view1

- Deterministic rules still matter. Sierra uses LLM flexibility at the edges and hard business logic at the moment of consequence. Recruitment should do the same. citeturn3view4turn6view1

- The fastest path to enterprise trust is not “more autonomy”; it is auditable autonomy. Sierra’s traces and monitors are as important as its runtime. citeturn10view6turn29view0

- Voice is not just another channel. It changes economics, increases accessible surface area, and exposes latency and empathy problems that text can hide. citeturn34view0turn29view2

- Sierra’s forward-deployed partnership model is part of the product. In applied AI, services are not a necessary evil at the start; they are how product and workflow learning compound. citeturn27view0turn12search2

- Customer support was the right wedge because it is both painful and measurable. Recruitment needs the same discipline: start with stage completion and coordination work, not “AI hiring” as an abstract promise. citeturn32view0turn17view0

- In recruitment, the equivalent of a “resolved ticket” is a compliant stage transition. Price and optimise around that, not around the final hire alone. citeturn17view0turn27view0

- The best recruitment version of Sierra will not be a sourcing tool. It will be a candidate-operations system that automates the messy space between application and decision. citeturn3view3turn6view3turn27view0

- Generic AI features are cheap to copy. Deep integrations, evaluation loops, policy controls, memory, and organisation design are not. Build there first. citeturn10view1turn11view0turn29view0

- If you want Sierra-like defensibility in recruitment, your moat should be the dataset of resolved exceptions, fairness-safe workflow logic, and ATS-integrated stage outcomes — not CV parsing. citeturn5view2turn30view0turn10view6

- Sierra’s deepest lesson is strategic, not technical: AI-native companies win when they define a new unit of work, a new unit of value, and a new operating system to deliver both. citeturn19search12turn17view0turn31view0