# AiduxCare – Physical Test Library · Strategic README
Canada-first · en-CA · PHIPA/PIPEDA Ready  
Status: Canonical Companion Document

---

## 1. Vision
The Physical Test Library is a core differentiator of AiduxCare.  
It transforms the physiotherapist’s standard objective assessment into a:

- **consistent**
- **legally defensible**
- **AI-assisted**
- **workflow-driven**

process that reduces documentation burden and increases quality.

Where most EMRs simply provide a blank textbox, AiduxCare offers:
- curated MSK tests,
- structured selection,
- factual result entry,
- clean SOAP integration,
- audit-friendly behaviour.

---

## 2. How It Works (High-level)
### Step 1 — Transcript Parsing  
Vertex suggests tests based on clinician–patient conversation.

### Step 2 — Library Matching  
AiduxCare maps these suggestions to the canonical MSK library using fuzzy similarity.  
Unmatched → becomes “custom test”.

### Step 3 — Physiotherapist Review  
The clinician selects/deselects tests, assigns observed outcomes, adds notes.

### Step 4 — Persistent State  
All selections sync into `SessionContext.physicalEvaluation`.

### Step 5 — SOAP Generation  
Physical evaluation data is included as a factual, non-diagnostic list in the final SOAP output.

---

## 3. Why It Matters Clinically
### ✔ Standardization  
Improves quality across physiotherapists and clinics.

### ✔ Documentation Speed  
Cuts down time spent writing objective findings manually.

### ✔ Legal Protection (PHIPA/PIPEDA)  
Factual documentation + no interpretation = auditor-friendly.

### ✔ AI Transparency  
AI suggests, physiotherapist chooses.  
Full human control, full audit trail.

---

## 4. Why It Matters for Niagara
This module demonstrates:
- robust product thinking,  
- clinical safety,  
- strong engineering discipline,  
- AI capability constrained by compliance boundaries,  
- extensibility for Canada-wide scale.

AiduxCare becomes the first Canada-first clinical copilot for physiotherapists.

---

## 5. How It Will Evolve
Planned expansions (non-breaking):
- Hip and wrist/hand regions  
- Vestibular tests  
- Pain provocation clusters (in factual wording)  
- Evidence abstracts (v3.5+)  
- Region-based suggestions using context models  

This README is part of the canonical AiDux North documentation suite.
