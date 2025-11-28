# Physical Test Library – Speaker Notes

**For:** CTO / Niagara Presentation | **Duration:** 10–12 minutes

---

## Slide 1 – Title (30 seconds)

**What to say:**
"Today I'm presenting the Physical Test Library and Evaluation Engine for AiduxCare. This is a core clinical asset that transforms how physiotherapists document physical exams, making them structured, auditable, and ready for legal-grade SOAP notes."

**Key points:**
- This is not just UI—it's a clinical catalog
- Built for Niagara Innovation Hub MVP
- Focus: documentation, not diagnosis

---

## Slide 2 – Problem & Opportunity (1 minute)

**What to say:**
"Physiotherapy clinics face two major pain points. First, physical exams are time-consuming to document, inconsistent between therapists, and weak from a medico-legal perspective. Second, generic AI chatbots are unsafe, non-auditable, and misaligned with Canadian privacy regulations."

**Transition:**
"Our opportunity is to build an EMR-native physical test engine that documents what really happened, feeds legal-grade SOAP notes, and stays within 'assist, don't decide' guardrails."

---

## Slide 3 – Design Principles (1.5 minutes)

**What to say:**
"We've established four core principles. First, truth-first: every field must be something the physio can actually observe or measure—no diagnosis encoding. Second, normal templates are descriptive, not interpretative. Third, each test has its own specific fields—no generic boxes for core library tests. Fourth, English en-CA is canonical—all content in Canadian English."

**Emphasize:**
"These principles ensure we're building documentation tools, not decision systems."

---

## Slide 4 – Architecture Overview (1.5 minutes)

**What to say:**
"Our architecture has four bounded contexts. The Clinical Catalog is static and versioned—test definitions, field schemas, normal templates. The Session Engine handles PHI—what happened in this specific visit. The Decision Engine provides optional AI suggestions, strictly separated from PHI. And the Audit Layer tracks who saw what, when, and what was suggested versus accepted."

**Key point:**
"This separation is critical for PHIPA/PIPEDA compliance and future audits."

---

## Slide 5 – Current Implementation (1.5 minutes)

**What to say:**
"Currently, we have a library of MSK tests with structured field definitions. Each test has an ID, region, name, description, typical use, normal template, and specific fields. In the UI, users can accept AI-suggested tests, add from the library by region, or create custom tests."

**Show:**
"Let me show you an example of how this works in practice."

---

## Slide 6 – Example: Test-Specific Fields (1.5 minutes)

**What to say:**
"For Straight Leg Raise, instead of a generic text box, we capture: right SLR angle, left SLR angle, whether radicular pain was reproduced, and a symptom description. For Cervical Rotation, we capture right and left rotation angles plus symptoms. The outcome is that every captured value is directly usable in SOAP notes and audits—no interpretation needed."

**Demonstrate:**
"Notice how each test has fields that match how physiotherapists actually document these tests in practice."

---

## Slide 7 – SOAP Integration (1.5 minutes)

**What to say:**
"Before calling the SOAP generator, we build factual sentences from structured data: 'Right SLR: 60°, sharp pain radiating to posterior calf.' The physical evaluation summary includes the list of tests, objective values, and symptom descriptions—all without diagnostic wording."

**AI role:**
"AI's role is optional—it can propose wording and suggest draft plans, but everything is labeled as 'suggested' and requires physiotherapist review and acceptance."

---

## Slide 8 – Custom Tests & Templates (1 minute)

**What to say:**
"Currently, custom tests use a generic form, which loses structure. Our proposal is to introduce templates for frequent patterns like range of motion, strength testing, palpation, and functional tests. When creating a custom test, the therapist picks a template and gets structured fields, or chooses fully generic mode as a fallback."

**Benefit:**
"This gives customization without losing structure, consistency, or auditability."

---

## Slide 9 – Governance & Versioning (1 minute)

**What to say:**
"For clinical governance, we're starting with a single content owner and will move to an external advisory group. For versioning, each test has a semantic version and source. Sessions log the test ID and version used, enabling audit reconstruction, safe rollback, and historical queries like 'What content did we show in 2026 Q2?'"

---

## Slide 10 – Regulatory Fit (1 minute)

**What to say:**
"AiduxCare is positioned as an EMR plus documentation assistant, not an autonomous decision system. We focus on capturing the reality of the exam and improving documentation. Our compliance-by-design approach separates clinical catalog, session data, decision logic, and audit logs—preparing us for PHIPA/PIPEDA expectations and future SOC2 or ISO 27001 evidence requirements."

---

## Slide 11 – Roadmap & Decisions Needed (1.5 minutes)

**What to say:**
"Our roadmap includes expanding the MSK library per region, adding Geriatric and Pregnancy verticals, introducing the template system, and gradually linking to evidence-based protocols. We need four decisions from you: First, how many templates in the first release—we propose 5 to 10. Second, when and how to start annotating tests with guideline references. Third, when to move from single owner to advisory group. Fourth, clear boundary between what ships for Niagara demo versus what stays in the roadmap."

**Pause for questions:**
"These are the key decision points we'd like to discuss."

---

## Slide 12 – Closing (30 seconds)

**What to say:**
"The AiduxCare Physical Test Engine is grounded in real physiotherapy practice, structured for documentation not diagnosis, designed for regulatory scrutiny and audit, and ready to become the clinical spine of an intelligent, compliant EMR. As we say: 'We don't invent tests. We capture them truthfully and make them auditable.'"

**Call to action:**
"Thank you. I'm ready for your questions and decisions on the roadmap."

---

## Appendix Slides (if time permits)

**Slide 13 – Current Library Status:**
"Quick overview: 21 structured tests, 9 legacy tests, covering 7 regions. Examples include Neer, Spurling, SLR, Lachman, and many more."

**Slide 14 – Technical Stack:**
"TypeScript definitions, fuzzy matching, React components, structured data flow from AI suggestion through documentation to SOAP generation."

---

## Tips for Delivery

1. **Pace:** 1–1.5 minutes per slide, 10–12 minutes total
2. **Emphasize:** Compliance, auditability, clinical truth
3. **Demo:** If possible, show a live example of SLR with fields
4. **Questions:** Pause after Slide 11 for discussion
5. **Close:** End with the quote—it's memorable and sets the tone

---

## Backup Slides (if needed)

- **Q: What if a test isn't in the library?**  
  A: Custom test with template or generic fallback—always flexible.

- **Q: How do we ensure tests are accurate?**  
  A: Clinical governance, versioning, and advisory group review.

- **Q: What about other specialties?**  
  A: MSK is MVP; Geriatric and Pregnancy are next verticals.

