
## Schema Features (Etapa 2)

### Flexible Timestamps
Schemas accept multiple timestamp formats:
- Firestore: `{_seconds, _nanoseconds}`
- Alternative: `{seconds, nanoseconds}`
- ISO 8601: `"2025-10-14T10:00:00Z"`
- Epoch: `1734200000` (seconds) / `1734200000000` (ms)

**Rationale:** Backward compatibility with legacy data.

### Field Aliasing
**Notes**
- `patient_id` → `patientId`
- `clinician_id` → `clinicianId`
- `created_at`/`signed_at` → `createdAt`/`signedAt`
- SOAP short-hands: `subj/obj/assess` → `subjective/objective/assessment`

**Audit Logs**
- `actor_id` → `userId`
- `entity_type` → `entityType`
- `entity_id` → `entityId`
- `note.created`/`note.signed` → `CREATE`/`SIGN`

**Consents**
- `consent_type`/`type`/`kind`/`category`/`consent` → `consentType`
- `accepted`/`consented`/`is_granted`/`value:boolean` → `granted`

### Immutability Enforcement (Notes)
When `status = 'signed'`:
- `immutable_hash` **required**
- `immutable_signed = true` **required**

### SOAP Normalization (Draft)
Draft notes allow optional SOAP fields; schema defaultiza a `""` si faltan.

**Market:** CA · **Language:** en-CA
