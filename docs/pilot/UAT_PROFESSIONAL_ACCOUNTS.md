# Professional Accounts — UAT Pilot (AiduxCare)

These accounts are ONLY for the pilot in the `aiduxcare-v2-uat-dev` environment.

## General specification

- Role: `physio`
- Environment: `uat`
- Language: `en-CA`
- Suggested password (can be changed later):
  - `AiduxUAT2025!`  (same for all, to simplify support during the pilot)

## Account list

1. Physio 01 — General MSK
   - Name: `Laura Torres`
   - Email: `pilot.physio01@aiduxcare.com`

2. Physio 02 — Shoulder / sports
   - Name: `Carlos Medina`
   - Email: `pilot.physio02@aiduxcare.com`

3. Physio 03 — Lumbar spine
   - Name: `Ana Rios`
   - Email: `pilot.physio03@aiduxcare.com`

4. Physio 04 — Cervical / headaches
   - Name: `Javier Lopez`
   - Email: `pilot.physio04@aiduxcare.com`

5. Physio 05 — Knee / post-op
   - Name: `Maria Gonzalez`
   - Email: `pilot.physio05@aiduxcare.com`

6. Physio 06 — Ankle / recurrent sprains
   - Name: `Diego Perez`
   - Email: `pilot.physio06@aiduxcare.com`

7. Physio 07 — Persistent pain / chronic
   - Name: `Sofia Navarro`
   - Email: `pilot.physio07@aiduxcare.com`

8. Physio 08 — Older adult / falls risk
   - Name: `Luis Romero`
   - Email: `pilot.physio08@aiduxcare.com`

9. Physio 09 — Higher-level athletes
   - Name: `Elena Martin`
   - Email: `pilot.physio09@aiduxcare.com`

10. Physio 10 — Mixed / complex cases
    - Name: `Miguel Herrera`
    - Email: `pilot.physio10@aiduxcare.com`

## Recommended claims / metadata (Firebase Auth / Firestore)

For each account, recommended structure:

```jsonc
{
  "role": "physio",
  "environment": "uat",
  "canUsePilot": true
}
```

Note: whether this is stored as Firebase Auth custom claims or as a document in `/professionals` depends on the current model. For this pilot, the critical point is that current UAT rules only require `request.auth != null`, so being authenticated is enough for the clinical flow to run.

