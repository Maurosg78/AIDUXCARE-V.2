# Demo Patients — UAT Pilot

Goal: provide a small, well-defined set of test patients that cover frequent MSK scenarios and allow testing of initial assessment + follow-up flows.

## General specification

- All patients are fictitious.
- Data does NOT correspond to real individuals.
- Use is restricted to the `aiduxcare-v2-uat-dev` environment.

## Demo patient list

1. **PD-001 — Acute mechanical low back pain**
   - Name: `Daniel Ruiz`
   - Patient code: `PD-001`
   - Approx. age: 38 years
   - Sex: M
   - Main complaint: Low back pain after lifting at work.
   - Key flags:
     - Pain 7/10
     - No red flags
     - Physical job

2. **PD-002 — Neck pain + tension-type headaches**
   - Name: `Marta Ibanez`
   - Patient code: `PD-002`
   - Approx. age: 32 years
   - Sex: F
   - Main complaint: Neck pain associated with prolonged computer work.

3. **PD-003 — Shoulder pain (rotator cuff)**
   - Name: `Jose Martinez`
   - Patient code: `PD-003`
   - Approx. age: 45 years
   - Sex: M
   - Main complaint: Right shoulder pain when lifting the arm and at night.

4. **PD-004 — Post-meniscectomy knee pain**
   - Name: `Carolina Soto`
   - Patient code: `PD-004`
   - Approx. age: 29 years
   - Sex: F
   - Main complaint: Post-operative knee rehabilitation (meniscus).

5. **PD-005 — Recurrent lateral ankle sprain**
   - Name: `Pablo Herrera`
   - Patient code: `PD-005`
   - Approx. age: 22 years
   - Sex: M
   - Main complaint: Lateral ankle sprain in a recreational athlete.

6. **PD-006 — Chronic non-specific low back pain (>6 months)**
   - Name: `Laura Campos`
   - Patient code: `PD-006`
   - Approx. age: 50 years
   - Sex: F
   - Main complaint: Chronic non-specific low back pain with functional impact.

7. **PD-007 — Older adult with falls risk**
   - Name: `Antonio Valdes`
   - Patient code: `PD-007`
   - Approx. age: 78 years
   - Sex: M
   - Main complaint: Gait instability and recurrent falls.

8. **PD-008 — Patellofemoral pain in a runner**
   - Name: `Sara Molina`
   - Patient code: `PD-008`
   - Approx. age: 27 years
   - Sex: F
   - Main complaint: Anterior knee pain while running and going downstairs.

## Suggested Firestore structure

Collection: `/patients`

Minimum recommended fields:

```jsonc
{
  "code": "PD-001",
  "firstName": "Daniel",
  "lastName": "Ruiz",
  "sex": "M",
  "approxAge": 38,
  "primaryComplaint": "Acute mechanical low back pain after lifting at work.",
  "status": "active",
  "createdAt": "<timestamp>",
  "createdBy": "<uid of the professional who created the record or 'system'>"
}
```

You can decide whether to create them manually via the UI (one by one) or by using a small script/seed for Firestore. For the pilot, 8 well-described demo patients is more than enough to test multiple combinations.

