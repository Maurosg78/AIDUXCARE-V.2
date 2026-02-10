# Opción A — Activar FIX A en el workflow completo

## Objetivo

Que el **ConsentGate se desmonte correctamente** tras consentimiento verbal y, como efecto directo:

- Se desbloquee **toda la UI clínica**
- Funcione **la subida de audio / imágenes / adjuntos**
- Sin tocar el dominio ni romper compliance

---

## PASO 0 — Precondición (imprescindible)

Trabajar en un **repo / branch** que **ya tenga**:

- `ConsentGateScreen`
- `VerbalConsentModal`
- Workflow largo (no la versión corta)
- Dependencias tipo `SOAPContextBuilder`

👉 Este repo actual puede no ser ese; el fix está listo para aplicarse donde sí exista el workflow completo.

---

## PASO 1 — Restaurar la página base correcta

Usar el backup como **base canónica**:

```bash
cp src/pages/ProfessionalWorkflowPage.tsx.bak.20260131-095757 \
   src/pages/ProfessionalWorkflowPage.tsx
```

Alternativa: abrir ambos archivos y **fusionar manualmente** solo:

- ConsentGate
- Polling de consentimiento
- Estado `workflowConsentStatus`

---

## PASO 2 — Cablear ConsentGate con FIX A (clave)

En `ProfessionalWorkflowPage.tsx`:

### 2.1 Props correctas al gate

```tsx
<ConsentGateScreen
  patientId={patientIdFromUrl}
  patientName={currentPatient?.fullName || `${currentPatient?.firstName ?? ''} ${currentPatient?.lastName ?? ''}`.trim()}
  patientPhone={currentPatient?.phone || currentPatient?.personalInfo?.phone}
  clinicName={clinicName}
  physiotherapistId={user?.uid}
  physiotherapistName={clinicianDisplayName}
  consentResolution={consentResolution}
  onConsentGranted={handleConsentGranted}
  onConsentDeclined={...}  // mantener el que ya tengas
/>
```

### 2.2 Handler `onConsentGranted` (corazón del fix)

Añadir en el componente (junto al resto de handlers):

```ts
const handleConsentGranted = async () => {
  await new Promise((r) => setTimeout(r, 500));

  const result = await checkConsentViaServer(patientIdFromUrl ?? '');

  if (result.hasValidConsent) {
    setWorkflowConsentStatus({
      hasValidConsent: true,
      isDeclined: false,
      status: result.status ?? 'ongoing',
      consentMethod: result.consentMethod ?? 'verbal',
    });
    consentGrantedRef.current = true;
  }
};
```

Con esto se conectan:

- Escritura (`VerbalConsentService.obtainConsent`)
- Lectura (`checkConsentViaServer`)
- Dominio (`resolveConsentChannel`)
- UI (desmontaje del gate)

---

## PASO 3 — Asegurar que el dominio manda

Debe existir (o mantenerse) esta lógica:

```ts
const consentResolution = resolveConsentChannel({
  hasValidConsent: workflowConsentStatus.hasValidConsent,
  isDeclined: workflowConsentStatus.isDeclined,
  jurisdiction: getCurrentJurisdiction(),
  isFirstSession,
});
```

Y **solo** esto debe bloquear la UI:

```ts
if (consentResolution.channel !== 'none') {
  return <ConsentGateScreen ... />;
}
```

- No añadir checks extra.
- No aceptar `verbal` como canal.
- El contrato ya está normalizado en escritura.

---

## PASO 4 — Firestore Rules (cuando vaya a PROD)

Regla mínima (ajustar a tu modelo de pacientes):

```
match /patients/{patientId}/consent_status/{docId} {
  allow read, write: if request.auth != null;
}
```

---

## PASO 5 — Prueba funcional (criterio DONE)

En consola **debe verse este orden**:

```
[VerbalConsent] ✅ Consent granted and recorded
[ConsentServer] Consent status retrieved: { channel: 'none', granted: true }
[WORKFLOW] Consent resolution from domain
[WORKFLOW] Gate UNMOUNTED, rendering clinical workflow
```

Después de eso:

- Adjuntar **audio** ✅
- Adjuntar **imagen** ✅
- UI desbloqueada sin refresh ✅

---

## Estado final (para comunicar)

> El consentimiento verbal ahora es una fuente válida de verdad para el dominio. Al registrarse, se normaliza a `channel: 'none'`, el ConsentGate se desmonta y la UI clínica queda habilitada de forma inmediata (incluidos adjuntos de audio).

---

## Archivos del fix en este repo

| Archivo | Descripción |
|---------|-------------|
| `src/services/verbalConsentService.ts` | Escritura con contrato dominio |
| `src/services/consentServerService.ts` | Lectura desde mismo path |
| `src/services/consentVerificationService.ts` | Delegación a checkConsentViaServer |
| `src/domain/consent/resolveConsentChannel.ts` | Resolución dominio |
| `src/core/consent/consentJurisdiction.ts` | getCurrentJurisdiction() |
| `src/core/consent/consentLanguagePolicy.ts` | Stub ConsentTextVersion |
| `src/components/consent/ConsentGateScreen.tsx` | UI gate + modal verbal |
| `src/components/consent/VerbalConsentModal.tsx` | Modal que llama obtainConsent() |
| `src/components/consent/DeclinedConsentModal.tsx` | Modal “consent declined” |

---

## Siguiente paso

Cuando tengas claro **en qué repo/branch exacto** vas a aplicar esto, se puede revisar **línea por línea** hasta ver el log `Gate UNMOUNTED` en vivo.
