# Checklist de estabilidad – Piloto España (20 usuarios)

**Objetivo:** Asegurar que lo existente no falle en el piloto. Sin nuevas features.

**Criterios:** OK | RIESGO BAJO | RIESGO MEDIO | RIESGO ALTO. Para MEDIO/ALTO se indica mitigación.

---

## 1. INFRAESTRUCTURA MÍNIMA

### 1.1 ¿Está configurado un presupuesto de alertas en GCP para la Cloud Function vertexAIProxy?

**RIESGO MEDIO**

- En el repo **no hay** configuración de presupuestos (budgets) ni alertas de facturación en GCP.
- La función `vertexAIProxy` está en `functions/index.js`; el proyecto es `aiduxcare-v2-uat-dev`, región `northamerica-northeast1`.

**Mitigación antes del piloto:**  
Crear en Google Cloud Console → Billing → Budgets & alerts un presupuesto (p. ej. 50–100 USD/mes) con alertas al 50% y 90%, y opcionalmente una alerta cuando se dispare la función (Cloud Monitoring). No requiere cambios en código.

---

### 1.2 ¿La Cloud Function tiene manejo de errores que evite que una llamada fallida rompa toda la sesión del usuario?

**OK**

- `vertexAIProxy` está dentro de un `try/catch`: cualquier excepción devuelve `500` con `{ ok: false, error: 'vertex_invoke_failed', message }` y no deja la función colgada.
- Para 429 (Resource Exhausted): hasta 3 reintentos con backoff (2s, 4s, 8s); si sigue fallando devuelve `502` con mensaje claro.
- Validaciones de entrada (method, action, inputText) devuelven 400/405 con cuerpo JSON.
- El **cliente** (front) recibe estas respuestas y las trata: `vertex-ai-soap-service.ts` y `vertex-ai-service-firebase.ts` lanzan error o devuelven formas de error (p. ej. `AI_UNAVAILABLE`), y la UI muestra mensaje al usuario sin romper toda la sesión.

---

### 1.3 ¿El plan de Firebase es Blaze o Spark? ¿Hay riesgo de que las cuotas gratuitas se agoten con 300 sesiones/mes?

**RIESGO BAJO** (depende de configuración en Console)

- El **plan** (Spark/Blaze) se define en **Firebase Console**, no en código. No se puede ver en el repo.
- Con **Spark (gratuito):**  
  - Firestore: ~50k lecturas/día, ~20k escrituras/día (límites típicos).  
  - Functions: límites de invocaciones y red saliente.  
  Con **~300 sesiones/mes** y del orden de 15–20 lecturas y 3–8 escrituras por sesión, más listados y dashboards, es posible acercarse o superar los límites gratuitos en picos.
- Con **Blaze:** se paga por uso; para 20 usuarios el coste sigue siendo bajo (ver `docs/COSTO_OPERATIVO_PILOTO_ESPAÑA_20_USUARIOS.md`).

**Mitigación antes del piloto:**  
Confirmar en Firebase Console el plan actual. Si está en Spark, valorar pasar a **Blaze** para evitar cortes por cuota; para este volumen el coste esperado es bajo.

---

## 2. AUTENTICACIÓN Y ACCESO

### 2.1 ¿El flujo de registro de un nuevo usuario funciona de punta a punta sin intervención manual?

**OK**

- **Registro** = `/register` → `ProfessionalOnboardingPage`. Incluye creación de cuenta con `createUserWithEmailAndPassword` (cuando el usuario no está autenticado) y guardado de perfil con `saveProfileForUid(uid)`.
- Tras completar el onboarding, el usuario se redirige a `/command-center` según `isProfileComplete(profile)` (WO-13). En modo piloto no se usa `emailVerified` para el routing.
- No hay pasos que requieran intervención manual en código (invitaciones, aprobación de admin, etc.).

**Nota:** Firebase puede enviar email de verificación según configuración del proyecto; si está activo, el usuario lo recibe pero **no** queda bloqueado para entrar al command-center en el flujo actual (piloto).

---

### 2.2 ¿El consentimiento ES-ES (v1-es-ES-verbal) está correctamente cableado como gate antes del workflow?

**OK**

- **Jurisdicción ES-ES:** `JurisdictionEngine.ts` define `ES-ES` con `verbalVersionId: 'v1-es-ES-verbal'`. Cuando el piloto España está activo (`isEsPilotEnabled()`), `getActiveJurisdiction()` devuelve `ES-ES`.
- **Texto verbal:** `verbalConsentService.getVerbalConsentText()` y `getConsentTextVersionForCurrentJurisdiction()` devuelven la versión `v1-es-ES-verbal` para ES-ES (textos en `consentTexts.ts`).
- **Gate:** En `ProfessionalWorkflowPage`, `useConsentGate` (o equivalente vía `VerbalConsentService.hasValidConsent`) comprueba consent en Firestore (`consent_status/latest` o `patient_consent`). Si no hay consent válido, se muestra `ConsentGateScreen` y se bloquea el workflow (`workflowBlocked`). Si hay consent (verbal registrado o digital), `resolveConsentChannel` devuelve `channel: 'none'` y el gate se desmonta.
- **Registro del verbal:** `VerbalConsentModal` usa `getCurrentJurisdiction()` (ES-ES en piloto) y escribe en la ruta que luego lee `consentServerService`; el gate lee esa misma fuente.

---

### 2.3 ¿Hay algún rol o permiso que un usuario nuevo necesite y que no se asigne automáticamente?

**OK**

- El acceso a datos se controla por **Firestore rules** y por **ownership** (`authorUid` / `userId`). No hay en el código un sistema de “roles” (admin, viewer, etc.) que se asigne manualmente.
- El perfil profesional se crea/actualiza en el onboarding (`users/{uid}`); no hay flujo que requiera asignar un rol adicional para que el usuario pueda usar el workflow.

---

## 3. DATOS Y PERSISTENCIA

### 3.1 ¿Las sesiones se guardan correctamente en localStorage antes de que Firestore esté disponible?

**OK**

- **localStorage:** `SessionStorage.saveSession()` (en `session-storage.ts`) escribe en localStorage con clave v2 (`aidux_v2_${userId}_${patientId}_${visitType}_${sessionId}`). Se invoca desde `ProfessionalWorkflowPage` (p. ej. en debounce de estado del workflow) y desde `useSessionPersistence`.
- **Firestore:** `sessionService.createSessionWithId()` escribe en la colección `sessions`. Se llama al iniciar/actualizar sesión y al finalizar (varios puntos en `ProfessionalWorkflowPage`).
- El guardado en **localStorage es independiente** de Firestore: si Firestore falla, el `createSessionWithId` lanza y el flujo puede mostrar error, pero el estado en localStorage ya se ha persistido en los puntos donde se llama `SessionStorage.saveSession`. No hay dependencia “solo Firestore”; hay dos vías (localStorage y Firestore).

---

### 3.2 ¿Hay algún caso conocido donde una sesión clínica se pierda sin aviso al usuario?

**RIESGO BAJO**

- **Escenarios posibles:**  
  - Si **Firestore** falla en `createSessionWithId` o `updateSession`, el código hace `throw new Error(...)`; el usuario puede ver el error en consola o en UI si está manejado, pero en algunos puntos el error podría no mostrarse en un toast/modal explícito.  
  - Si el usuario **borra datos del sitio** o usa **otro dispositivo**, la sesión solo en localStorage no estará disponible (la “sesión en curso” en Firestore tampoco si nunca se escribió).
- No aparece en el código un flujo que **borre** la sesión de localStorage sin aviso; sí hay migración de clave legacy a v2 y limpieza al finalizar.

**Mitigación:**  
Revisar en `ProfessionalWorkflowPage` que todos los `createSessionWithId`/`updateSession` en rutas críticas (inicio sesión, guardar, finalizar) muestren un mensaje claro al usuario en caso de fallo (toast o modal “No se pudo guardar la sesión. Intenta de nuevo.”).

---

### 3.3 ¿El flujo Ongoing → Vertex → baseline SOAP tiene fallback funcional si Vertex falla?

**OK**

- En `OngoingPatientIntakeModal`: primero se construye `fallbackSoap = ongoingFormToBaselineSOAP(data)`. Si `!vertexFailed`, se llama a `generateBaselineSOAPFromOngoingIntake` (Vertex). Si Vertex **lanza**, se captura en `catch`, se muestra `setError(t('shell.workflow...errorVertexFailed'))`, se hace `setVertexFailed(true)` y se hace `return` sin cerrar el modal. En el **siguiente** envío, como `vertexFailed` es true, se usa `fallbackSoap` (formulario → SOAP mínimo) y se continúa con `createBaselineFromMinimalSOAP` y cierre del flujo.
- El usuario puede así completar el baseline sin Vertex; el fallback es explícito y funcional.

---

## 4. EXPERIENCIA EN MÓVIL

### 4.1 ¿La app es usable en móvil o solo está optimizada para desktop?

**RIESGO BAJO**

- La UI usa Tailwind con clases responsivas (`sm:`, `md:`, `lg:`, etc.) en muchas pantallas (landing, workflow, formularios). No hay en el código una indicación de “solo desktop”.
- No se ha hecho una revisión específica de “mobile-first” ni de viewport/gestos en el repo; algunos layouts (workflow con varias columnas, tablas) pueden quedar apretados en pantallas muy pequeñas.

**Mitigación:**  
Hacer una pasada de prueba en 1–2 dispositivos móviles reales (o emulador): login, command-center, apertura de workflow, consent, grabación y pestaña SOAP. Ajustar solo lo que impida uso crítico (botones no accesibles, texto ilegible, teclado que tape campos).

---

### 4.2 ¿El flujo de consentimiento funciona en pantallas pequeñas?

**RIESGO BAJO**

- `VerbalConsentModal` y `ConsentGateScreen` usan contenedores con `max-w-*`, `p-4`, y en `ConsentActionButtons` hay `flex-col sm:flex-row`. No hay media queries que oculten contenido esencial en móvil.
- El modal de consentimiento verbal es scrollable (contenido largo de texto); en pantallas pequeñas puede requerir scroll, pero el flujo es usable.

**Mitigación:**  
Probar en un móvil real el flujo: abrir gate → obtener consentimiento verbal → completar pasos y cerrar. Confirmar que los botones y checkboxes son pulsables y que el texto se lee sin zoom forzado.

---

## 5. ERRORES CONOCIDOS

### 5.1 ¿Hay algún bug conocido sin resolver que pueda afectar a un usuario real en España?

**RIESGO BAJO**

- En docs de troubleshooting hay referencias a: modal de consentimiento verbal que **reaparecía** tras registrar consentimiento (`INFORME_CONSENT_VERBAL_MODAL_REAPARECE.md`), y a posibles re-renders que lo disparaban; se indican mitigaciones (refs, no depender de estado inestable). No aparece un bug abierto crítico que bloquee el flujo ES.
- El único “fail open” explícito encontrado es en el **redirect** a `/consent-verification` (si la comprobación falla por red, no se redirige y se deja al usuario en la página). El **gate principal** que bloquea el workflow por consentimiento es otro `useEffect` que usa `VerbalConsentService.hasValidConsent`; si ese falla por red, no hay un `catch` que ponga `workflowBlocked = false`, por lo que el comportamiento es más bien “quedarse en loading o bloqueado” que “dejar pasar sin consent”.

**Mitigación:**  
Registro de incidencias en piloto; si se observa que el modal de consentimiento reaparece tras registrar, revisar dependencias del efecto que llama a `hasValidConsent` y estabilizar con refs o comprobación única tras “consent granted”.

---

### 5.2 ¿El re-render loop en ProfessionalWorkflowPage.tsx está resuelto o sigue pendiente?

**OK**

- En el código hay un comentario explícito: “FIX: Memoize onWorkflowSelected to prevent infinite loop” y se usan refs (p. ej. `hasRedirectedRef`) para evitar redirecciones múltiples.
- En docs (`SESSION_COMPARISON_LOOP_FIX.md`, `WORKFLOW_SIDEBAR_REFACTOR.md`, `FIRESTORE_INDEX_FIX.md`) se describe que el loop por `buildCurrentSession`/`useEffect` y por SessionComparison se corrigió con uso de refs y desacoplando dependencias. No aparece un issue abierto que indique que el loop sigue ocurriendo en la rama actual.

Se considera **resuelto** para el estado actual del código; si en piloto se ve carga constante o congelamiento, conviene perfilar ese componente.

---

### 5.3 ¿Hay algún TODO o FIXME crítico en el código relacionado con el flujo clínico ES?

**RIESGO BAJO**

- **TODOs en flujo clínico:**  
  - `ProfessionalWorkflowPage.tsx`: varios TODOs (chief complaint desde transcript, `isFirstSession` como prop, región, reviewerName). Son mejoras o datos opcionales, no bloquean el flujo básico ES.  
  - `FollowUpWorkflowPage.tsx`: TODOs “Implement” en 4 lugares (sin detalle en el grep).  
  - `notesRepo.ts`: stubs de Firestore (“reemplazar stubs por implementación Firestore real”); la persistencia de notas clínicas real usa `PersistenceService` y colección `notes` con Firestore en otros servicios, no solo `notesRepo`.  
- **Consent/ES:** No hay TODO/FIXME que diga “ES consent no implementado” o “gate ES pendiente”; el gate y la versión verbal ES-ES están implementados.

**Mitigación:**  
Revisar los TODOs de `FollowUpWorkflowPage` para confirmar que no afectan la ruta principal (generar SOAP follow-up y guardar). El resto se puede dejar para post-piloto.

---

## Resumen por área

| Área                         | OK | Riesgo bajo | Riesgo medio | Riesgo alto |
|-----------------------------|----|-------------|--------------|-------------|
| Infraestructura mínima      | 1  | 1           | 1            | 0           |
| Autenticación y acceso      | 3  | 0           | 0            | 0           |
| Datos y persistencia        | 2  | 1           | 0            | 0           |
| Experiencia en móvil        | 0  | 2           | 0            | 0           |
| Errores conocidos           | 1  | 2           | 0            | 0           |

---

## Acciones recomendadas antes del piloto (prioridad)

1. **GCP:** Crear presupuesto y alertas de facturación para el proyecto (no requiere código).  
2. **Firebase:** Confirmar plan (Spark/Blaze) y pasar a Blaze si el uso puede superar cuotas gratuitas.  
3. **UX:** Comprobar que los fallos de `createSessionWithId`/`updateSession` muestren un mensaje claro al usuario.  
4. **Móvil:** Prueba manual del flujo completo (login → consent → workflow → SOAP) en al menos un dispositivo móvil.  
5. **Consent:** Si en piloto se reporta “el modal de consentimiento vuelve a salir”, revisar el efecto de consent y estabilizar con ref/una sola comprobación tras “consent granted”.

---

*Checklist basado en revisión del código y documentación del repo. Fecha de referencia: febrero 2026.*
