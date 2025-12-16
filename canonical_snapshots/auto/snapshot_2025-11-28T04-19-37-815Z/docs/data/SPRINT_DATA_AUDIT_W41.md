# SPRINT DATA AUDIT W41

## Summary
- Notes: **2**  (draft: 1 / submitted: 0 / signed: 1)
- Patients with notes: **1**
- Consents: **2**, Audit Logs: **2**

## Issues
- ❌ SIGNED_WITHOUT_HASH — note: note-001 (patient: patient-001)

## Notes (detail)
| id | patientId | status | createdAt | signedAt | hash |
|---|---|---|---|---|---|
| note-001 | patient-001 | signed | 2023-10-11T16:00:00.000Z | 2023-10-11T16:16:40.000Z | — |
| note-002 | patient-001 | draft | 2023-10-12T16:00:00.000Z | — | — |

## Consents (sample)
| id | patientId | type | active | granted |
|---|---|---|---|---|
| consent-001 | patient-001 | data_processing | true | true |
| consent-002 | patient-001 | ai_assisted | true | true |

## Audit Logs (sample)
| id | userId | action | entityType | entityId | timestamp |
|---|---|---|---|---|---|
| audit-001 | — | CREATE | note | note-001 | — |
| audit-002 | — | SIGN | note | note-001 | — |
