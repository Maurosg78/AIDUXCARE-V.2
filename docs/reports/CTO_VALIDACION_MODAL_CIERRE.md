# CTO: Validación del modal de cierre — try/catch y orden del flujo

**Fecha:** 2026-01-31  
**Objetivo:** Confirmar que el modal solo se muestra DESPUÉS de `createBaseline` y `updatePatient` exitosos, y que el `catch` está bien conectado.

---

## 1. Output solicitado

```bash
sed -n '3270,3320p' src/pages/ProfessionalWorkflowPage.tsx
```

**Resultado (líneas 3270-3320):**

```ts
    const pid = patientIdFromUrl || demoPatient.id;
    const uid = user?.uid;
    if (!uid) {
      setAnalysisError('User not authenticated.');
      return;
    }
    setAnalysisError(null);
    try {
      const sourceSessionId = sessionId || `${uid}-${sessionStartTime.getTime()}`;
      const baselineId = await createBaseline({
        patientId: pid,
        sourceSoapId: sourceSessionId,
        sourceSessionId,
        snapshot: {
          primaryAssessment: localSoapNote.assessment ?? '',
          keyFindings: [localSoapNote.subjective ?? '', localSoapNote.objective ?? ''].filter(Boolean),
          precautions: localSoapNote.precautions ? [localSoapNote.precautions] : undefined,
          planSummary: localSoapNote.plan ?? '',
        },
        createdBy: uid,
      });
      await PatientService.updatePatient(pid, { activeBaselineId: baselineId });
      const now = new Date().toISOString();
      setInitialAssessmentClosedAt(now);
      setBaselineIdFromSession(baselineId);
      const userId = uid || TEMP_USER_ID;
      const currentSessionId = sessionId || `${userId}-${sessionStartTime.getTime()}`;
      SessionStorage.saveSession(pid, {
        transcript: transcript || '',
        niagaraResults: niagaraResults || null,
        evaluationTests: evaluationTests || [],
        activeTab,
        selectedEntityIds: selectedEntityIds || [],
        localSoapNote: localSoapNote || null,
        soapStatus,
        visitType: visitType || 'initial',
        timestamp: now,
        version: '1.0',
        initialAssessmentClosedAt: now,
        baselineId,
      }, userId, visitType || 'initial', currentSessionId);
      setCloseInitialConfirmData({
        patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || 'Patient',
        baselineId,
      });
      setShowCloseInitialConfirmModal(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to close initial assessment.';
      setAnalysisError(message);
    }
```

---

## 2. Validación

| Punto | Estado |
|-------|--------|
| **Orden del flujo** | Correcto: `createBaseline()` → `updatePatient()` → `SessionStorage.saveSession()` → `setCloseInitialConfirmData()` → `setShowCloseInitialConfirmModal(true)`. |
| **Modal solo tras éxito** | El modal se muestra **solo** dentro del `try`, después de que ambos `await` (createBaseline y updatePatient) hayan resuelto. No hay otro path que setee el modal sin haber pasado por createBaseline. |
| **Catch conectado** | Si `createBaseline()` o `updatePatient()` lanzan, se entra al `catch`, se hace `setAnalysisError(message)` y **no** se llama a `setShowCloseInitialConfirmModal(true)`. El fisio ve el error, no el modal. |
| **navigate()** | No aparece en este bloque. La redirección ocurre **solo** cuando el fisio pulsa "Go to Command Center" en el modal (en `CloseInitialAssessmentConfirmModal`). |

**Conclusión:** El flujo es el que definiste. El modal solo se setea después de createBaseline y updatePatient exitosos; si algo falla, el catch muestra el error y no se muestra el modal. Listo para producción desde el punto de vista de orden del flujo y manejo de errores.

---

## 3. Riesgo “fallo silencioso” de Firestore

Si `setDoc` en Firestore no lanzara y tampoco escribiera (caso teórico del SDK/red), el modal diría "Baseline saved" sin persistencia real. Eso no se mitiga con el try/catch actual; si quisieras garantía extra, habría que hacer un **read-after-write** (p. ej. `getBaselineById(baselineId)` tras `createBaseline`) y solo entonces mostrar el modal; si el read falla o no devuelve el doc, tratar como error y no mostrar el modal. No está implementado hoy; el código asume que `createBaseline()` solo resuelve cuando `setDoc` ha tenido éxito (comportamiento estándar del SDK).
