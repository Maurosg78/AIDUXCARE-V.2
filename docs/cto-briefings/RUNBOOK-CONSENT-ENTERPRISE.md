# Runbook: Consent (Enterprise)

**Repo/branch:** Ver `ESTADO-CONSENT-FIX.md` (repo, branch, commit y estado FIX A/B).

## Scope

- **Consent path:** `patients/{patientId}/consent_status/latest`
- **Components:** `useConsentGate`, `ConsentGateWrapper`, `ConsentGateScreen`, `VerbalConsentModal`
- **Services:** `verbalConsentService`, `consentServerService`, `consentVerificationService`
- **Domain:** `resolveConsentChannel`, `consentJurisdiction`, `consentLogger` (no PHI in logs)

---

## Deploy checklist

1. **Firestore**
   - Ensure `firestore.rules` includes the consent rule when moving to PROD:
     - `match /patients/{patientId}/consent_status/{docId} { allow read, write: if isAuthenticated(); }`
   - Deploy rules: `firebase deploy --only firestore:rules`

2. **App**
   - Build: `npm run build`
   - Smoke test: open a workflow with a patient; gate shows when no consent, gate unmounts after verbal consent.

3. **Verification**
   - Console: look for `[CONSENT] verbal_consent_recorded` and `[CONSENT] gate_unmounted_after_verbal` (no PHI).
   - UI: attachments / audio available only after consent.

---

## Rollback

- **Code:** Revert the branch that introduced ConsentGateWrapper / useConsentGate if issues.
- **Data:** Consent docs in `consent_status` are additive; no automatic delete. Manual cleanup in Firestore if required.
- **Rules:** Revert `firestore.rules` and redeploy if rule change causes access issues.

---

## Integration (workflow page)

To gate a page by consent:

```tsx
import { ConsentGateWrapper } from '@/components/consent/ConsentGateWrapper';

// In render:
<ConsentGateWrapper
  patientId={patientIdFromUrl}
  patientName={currentPatient?.fullName}
  clinicName={clinicName}
  isFirstSession={true}
>
  { /* clinical content: SOAP, attachments, etc. */ }
</ConsentGateWrapper>
```

Or use the hook and render the gate manually:

```tsx
import { useConsentGate } from '@/hooks/useConsentGate';

const { showGate, consentResolution, handleConsentGranted } = useConsentGate({
  patientId,
  isFirstSession: true,
});

if (showGate && consentResolution) {
  return (
    <ConsentGateScreen
      patientId={patientId}
      consentResolution={consentResolution}
      physiotherapistId={user?.uid}
      physiotherapistName={clinicianDisplayName}
      onConsentGranted={handleConsentGranted}
    />
  );
}
return <>{/* clinical content */}</>;
```

---

## Log events (no PHI)

| Event | When |
|-------|------|
| `verbal_consent_recorded` | After successful write to `consent_status/latest` |
| `consent_status_retrieved` | After read; includes hasValidConsent, status, consentMethod |
| `consent_status_missing` | No document at path |
| `gate_unmounted_after_verbal` | Refetch after verbal consent returned hasValidConsent |
| `obtain_consent_failed` / `consent_status_read_failed` | On error (message only) |

---

## Nota operativa para pilotos

La UI clínica se habilita automáticamente tras consentimiento verbal registrado. Si no ocurre, revisar `patients/{patientId}/consent_status/latest` en Firestore (`channel: 'none'`, `granted: true`) y los logs `[CONSENT]` / `[WORKFLOW] Gate UNMOUNTED` en consola. Detalle en `ESTADO-CONSENT-FIX.md`.

---

## Contacts

- **Cerrar PR (GH):** `PR-CONSENT-GATE-CLOSE.md`
- Estado oficial (repo, branch, FIX A/B): `ESTADO-CONSENT-FIX.md`
- QA guiado: `QA-CONSENT-WORKFLOW-CHECKLIST.md`
- Domain/UX: `WO-CONSENT-VERBAL-FIX-ACTIVATION.md`
- Firestore: `firestore.rules` (PROD block)
