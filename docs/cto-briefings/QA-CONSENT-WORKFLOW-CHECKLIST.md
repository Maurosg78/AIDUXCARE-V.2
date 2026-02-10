# QA: Consent + Workflow (checklist guiado)

**Objetivo:** Validar el flujo clínico end-to-end con consentimiento verbal. Tiempo estimado: ~10 min.

**Repo/branch de referencia:** ver `docs/cto-briefings/ESTADO-CONSENT-FIX.md` (repo, branch, commit).

---

## Precondiciones

- App corriendo (ej. `npm run dev`).
- Usuario autenticado (login).
- Navegar a **Flujo profesional** (`/professional-workflow`).

---

## Secuencia de verificación

### 1. Consent gate visible

- [ ] Se muestra la pantalla **"Consent required"** (ConsentGateScreen).
- [ ] Hay botón **"Obtain verbal consent"**.

### 2. Registrar consentimiento verbal

- [ ] Clic en **"Obtain verbal consent"**.
- [ ] Completar el flujo del modal (leer texto, confirmar que el paciente autorizó, checkbox del fisio).
- [ ] Finalizar con **consentimiento concedido** (no declinar).

### 3. Gate se desmonta sin refresh

- [ ] La pantalla de consent **desaparece** sin recargar la página.
- [ ] Aparece el **flujo clínico** (tabs: Análisis inicial, Evaluación física, Informe SOAP).

### 4. Evidencia en consola (orden esperado)

Abrir DevTools → Console. Tras conceder el consentimiento verbal, deben aparecer **en este orden** (criterio de aceptación CTO):

```
[VerbalConsent] ✅ Consent granted and recorded
[CONSENT] verbal_consent_recorded  { channel: 'none', source: 'verbal', consentId: 'latest' }
[CONSENT] consent_status_retrieved  { hasValidConsent: true, status: 'ongoing', consentMethod: 'verbal', channel: 'none' }
[CONSENT] gate_unmounted_after_verbal  {}
[WORKFLOW] Consent resolution from domain
[WORKFLOW] Gate UNMOUNTED, rendering clinical workflow
```

(Si el prefijo es `[ConsentServer]` en lugar de `[CONSENT]` en alguna línea, es una versión anterior; el comportamiento correcto es el desmontaje del gate.)

### 5. Adjuntos / audio (cuando exista la UI)

Si la build incluye UI de adjuntos o audio en el workflow:

- [ ] Subir **audio** (`.m4a` o `.aac`): se sube y aparece en la UI.
- [ ] Subir **imagen**: se sube y aparece.
- [ ] Subir **PDF**: se sube y aparece.
- [ ] No hay bloqueos ni warnings engañosos; los archivos quedan persistidos.

---

## Resultado esperado

| Ítem              | Esperado                          |
|------------------|-----------------------------------|
| Gate visible     | Sí, al entrar sin consentimiento  |
| Tras verbal       | Gate desaparece sin refresh      |
| UI clínica        | Desbloqueada (tabs, análisis)     |
| Audio/adjuntos    | Suben y persisten (si la UI existe)|
| Consola           | Logs en el orden indicado arriba  |

---

## Si algo falla

- **Gate no desaparece:** Revisar que `patients/{patientId}/consent_status/latest` en Firestore tenga `channel: 'none'` y `granted: true` tras el verbal.
- **Consola sin logs:** Verificar que no haya errores de red/Firestore y que la ruta de consent esté permitida en `firestore.rules`.
- **Adjuntos bloqueados:** Confirmar que el gate se desmontó (logs `[WORKFLOW] Gate UNMOUNTED`) y que no quede lógica legacy que exija otro canal de consent.

Referencia técnica: `RUNBOOK-CONSENT-ENTERPRISE.md`, `WO-CONSENT-VERBAL-FIX-ACTIVATION.md`.
