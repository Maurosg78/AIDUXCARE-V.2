# AiDuxCare — Clinical User Guide (Pilot Edition)

**Version:** Pilot v1.1 (Internal draft)  
**Date:** February 2026  
**Audience:** Pilot clinicians, implementation team, institutional reviewers  
**Status:** Pilot use only — non-commercial  

---

## 1. Purpose of this guide

This document explains **how AiDuxCare is intended to be used during a clinical pilot**, from the perspective of the end clinician.

It serves three parallel purposes:

* to guide physiotherapists using the system,
* to provide clarity to institutional partners observing the pilot,
* and to align the implementation team on **intended product behavior**.

> **Important:** This guide describes *intended use*.
> It does not replace professional standards or clinical judgment.

---

## 2. What AiDuxCare is — and what it is not

### What AiDuxCare is

AiDuxCare is a **clinical documentation support tool** designed to assist physiotherapists with:

* structured capture of clinical information (SOAP),
* continuity across sessions,
* reduction of documentation friction during care,
* compliance-aware note organization.

AiDuxCare supports both **Initial Assessments** and **Follow-up sessions** using a consistent workflow.

### What AiDuxCare is not

AiDuxCare:

* ❌ does not diagnose,
* ❌ does not recommend treatments,
* ❌ does not replace clinical judgment,
* ❌ does not make autonomous decisions.

All clinical responsibility remains with the treating professional.

**Implementation note (internal):**  
Language here must remain conservative. Avoid any copy elsewhere in the app that contradicts this section (e.g. “AI decides”, “recommended plan”).

---

## 3. Preconditions: consent and professional responsibility

### Professional access

* Each clinician accesses AiDuxCare using their own authenticated account.
* Access is individual and auditable.

### Patient consent

Before starting a clinical session in AiDuxCare:

* Valid patient consent must exist.
* Consent may be:

  * verbal (recorded by the clinician), or
  * digital (via patient-facing consent flow, where enabled).

If consent is not valid, the clinical workflow **must not proceed**.

**Implementation note (internal):**  
Consent check must remain a **hard gate**, not a warning.  
UX should be calm and explanatory, but blocking.

### Professional responsibility

Using AiDuxCare does not modify the clinician’s legal or professional obligations.

The clinician remains responsible for:

* accuracy of notes,
* appropriateness of care,
* compliance with local standards.

---

## 4. Accessing AiDuxCare

AiDuxCare is accessed via a secure web environment.

### Secure access flow

* Users access the pilot URL.
* Identity is verified via a **one-time code sent by email**.
* No password is stored or reused for pilot access.

This ensures that only authorized users can access clinical data.

📸 **Screenshot placeholder (external version)**  
Landing / secure access screen  
*(No real emails, no personal identifiers)*

**Implementation note (internal):**  
Cloudflare Access copy must stay human-readable (“one-time code”), not technical.

---

## 5. Command Center (starting point)

The Command Center is the first screen clinicians see after access.

Its primary purpose is to allow clinicians to **start a clinical session quickly and confidently**.

### Design intent

* Minimize cognitive load.
* Make the *next clinical action* obvious.
* Avoid exposing technical concepts (tokens, limits, plans).

**Implementation note (internal):**  
All token-related UI must be removed or hidden at this level.

---

## 6. Core clinical workflow

AiDuxCare supports two visit types:

* **Initial Assessment**
* **Follow-up session**

The workflow structure is intentionally similar for both.

### Step 1 — Select patient

The clinician selects the relevant patient record.

**Implementation note (internal):**  
Patient selection must be fast. Avoid deep navigation or modal stacking.

---

### Step 2 — Select visit type

The clinician chooses:

* Initial Assessment (first time with patient), or
* Follow-up (continuation of care).

This selection determines session metadata, not clinical logic.

---

### Step 3 — Clinical documentation workflow

During the session, AiDuxCare supports structured capture of:

* Subjective
* Objective
* Assessment
* Plan

The clinician may speak, type, or interact depending on the setup.

**Implementation note (internal):**  
Workflow must tolerate pauses and real-world interruptions (session not continuous).

---

### Step 4 — Review and finalize

Before saving, the clinician reviews the generated note.

Expected actions:

* verify correctness,
* edit content if needed,
* confirm that the note reflects clinical reasoning.

No note is saved without clinician confirmation.

---

### Step 5 — Save session

Once finalized:

* the session is saved,
* it becomes part of the patient’s history,
* session numbering is updated.

📸 **Screenshot placeholders (external version)**

* Workflow screen
* SOAP review screen
* Confirmation / saved state

---

## 7. Sessions and continuity

### Session definition

A **session** represents one completed clinical encounter.

Sessions are numbered chronologically:

* Session 1
* Session 2
* Session 3
* …

Session number is based on **time order**, not visit type.

### Initial vs Follow-up

* Initial Assessment is typically Session 1.
* Follow-ups are subsequent sessions.

Legacy data without explicit visit type may be inferred by order.

**Implementation note (internal):**  
Ordinal labels must be derived from encounter order, not flags.

---

## 8. Data protection and privacy (summary)

AiDuxCare is designed with privacy by design principles.

In summary:

* Data is encrypted at rest.
* Access is restricted to the authoring clinician.
* No data is sold or shared.
* Pilot follows a Canada-first data residency approach.

This guide provides a usage overview; full compliance documentation exists separately.

---

## 9. Known limitations (pilot phase)

AiDuxCare is currently in pilot.

Users may encounter:

* minor UI inconsistencies,
* evolving workflows,
* features still under refinement.

This is expected during pilot operation.

Feedback is actively encouraged.

**Implementation note (internal):**  
Do not hide limitations. Transparency builds institutional trust.

---

## 10. Feedback and issue reporting

AiDuxCare includes an in-app feedback mechanism.

### Intended use

* Report usability issues.
* Report unexpected behavior.
* Suggest improvements.

### Privacy

* Feedback does not require patient data.
* Feedback focuses on system behavior.

**Implementation note (internal):**  
Feedback payloads must avoid PHI by default.

---

## 11. Support during the pilot

If a blocking issue occurs:

* Consult the pilot runbook.
* Contact the designated pilot support contact.

When reporting issues, users should include:

* what they were trying to do,
* what happened,
* whether care was interrupted.

---

## End of document (internal draft)

---

## How to use this with the implementation team

1. **Primera lectura conjunta (30–45 min)**  
   Producto + dev + responsable. Leer secciones 5–7 con foco en fricción real.

2. **Marcar gaps**  
   “Esto ya está” / “Esto está a medias” / “Esto no existe aún”.

3. **De aquí salen WOs**  
   WO-UX-01 (Command Center Fast Path), WO-CONSENT-UX (consent gate copy), WO-FEEDBACK-HARDENING (feedback sin PHI).
