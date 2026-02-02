# Auditoría pre-piloto — AiDuxCare V2

**Fecha:** 2026-02-01  
**Objetivo:** Valorar estado para lanzar el piloto y proponer mejoras (pre-piloto vs futuras).

---

## 1. Veredicto

**El proyecto está en condiciones de arrancar el piloto**, con el modelo clínico cerrado (visitType, encounters, session comparison, billing foundation) y los flujos críticos (consent, SOAP, persistencia) operativos. Las mejoras listadas son **recomendadas** para reducir riesgo y deuda; solo unas pocas son **pre-piloto** si se quiere un margen extra de seguridad.

---

## 2. Lo que está bien (resumen)

| Área | Estado |
|------|--------|
| **Modelo clínico** | visitType persistido, Initial/Follow-up crean encounter, Session 1/2/3… coherente |
| **Consent** | VerbalConsentService, ConsentVerificationPage, PatientConsentPortalPage, checkConsentViaServer |
| **Persistencia** | PersistenceService(Enhanced), consultations + encounters, cifrado (CryptoService) |
| **Seguridad** | Firestore por authorUid, PHIPA/PIPEDA documentado (INFORME_PHIPA_PIPEDA_COMPLIANCE.md) |
| **Error handling** | ErrorBoundary, WorkflowErrorBoundary, NotesErrorBoundary |
| **CI** | Lint, build, varios workflows (e2e, smoke, typecheck) |
| **Billing base** | WO-05: tipos, clasificación, getEncountersForBilling (sin UI) |

---

## 3. Mejoras pre-piloto (recomendadas antes del go-live)

### 3.1 Testing

- **Problema:** El código nuevo de los WO (visitType, encounters, session comparison, billing) no tiene tests unitarios; los tests existentes están concentrados en pocos módulos y muchos viven en `canonical_snapshots`.
- **Propuesta:**
  - Añadir **tests unitarios** para:
    - `BillingClassificationService.classifyEncounter()` (casos PRIVATE/MVA/WSIB/UNKNOWN).
    - `encountersRepo.getEncountersForBilling()` (orden, sessionNumber, billingType) con datos mock.
  - Mantener o ejecutar **smoke/E2E** del flujo crítico (consent → workflow → guardar SOAP) antes de cada release piloto.
- **Prioridad:** Media–alta (reduce riesgo en billing y sesiones).

### 3.2 Verificación en CI

- **Problema:** En `ci.yml` se ve lint + build; no queda explícito si `typecheck` (tsc) se ejecuta en cada PR.
- **Propuesta:** Asegurar que en cada PR se ejecute **lint + typecheck + build** (y, si es viable, un smoke mínimo). Un solo job que falle si typecheck falla evita regresiones silenciosas.
- **Prioridad:** Alta.

### 3.3 Variables de entorno y despliegue

- **Problema:** `.env.local.example` es muy breve; no hay checklist de envs necesarios para UAT/producción (Firebase, Vertex, Twilio, etc.).
- **Propuesta:**
  - Documentar en `docs/` o README las variables **obligatorias** para piloto (por entorno) y marcar cuáles son secretas.
  - Dejar claro el comando/orden de **deploy piloto** (ej. `deploy:staging` + proyecto Firebase) en un único sitio (README o DEPLOY.md).
- **Prioridad:** Alta para quien vaya a desplegar.

### 3.4 Husky pre-commit

- **Problema:** Husky avisa deprecación en `.husky/pre-commit` (v10).
- **Propuesta:** Actualizar el hook según la documentación de Husky v10 (o desactivar temporalmente si bloquea) para que el pre-commit siga siendo fiable.
- **Prioridad:** Baja (no bloquea piloto).

---

## 4. Mejoras futuras (post-piloto o en paralelo)

### 4.1 Calidad de código y mantenibilidad

- **ProfessionalWorkflowPage.tsx** es muy grande (>4000 líneas). A medio plazo: extraer hooks (ej. `useWorkflowSave`, `useWorkflowEncounter`), subcomponentes por pestaña o bloques (consent, last session, SOAP actions), o dividir en páginas/hijos por flujo (Initial vs Follow-up).
- **@ts-nocheck** en algún archivo crítico: ir sustituyendo por tipos reales y quitar `nocheck` para mejorar seguridad de tipos.
- **Consistencia de logging:** unificar uso de `logger` vs `console.*` en módulos críticos (persistencia, consent, billing) para facilitar soporte y auditoría.

### 4.2 Observabilidad y operaciones

- **Logging estructurado:** estándar (niveles, contexto sin datos de salud) y, si aplica, integración con sistema de log (Firebase, Datadog, etc.) para entornos piloto/producción.
- **Métricas de negocio:** ya hay tracking (workflow, SOAP, etc.); definir 2–3 KPIs piloto (sesiones completadas, SOAP finalizados, errores de guardado) y dónde se consultan (dashboard interno o Analytics).
- **Health check:** endpoint o página mínima “/health” (sin datos sensibles) para comprobar que la app y dependencias críticas (Firebase, etc.) responden.

### 4.3 Seguridad y cumplimiento

- **Revisión periódica de Firestore rules:** sobre todo en `consultations`, `encounters`, `verbal_consents`, alineadas con PHIPA/PIPEDA y con el principio de mínimo privilegio.
- **Auditoría de acceso a datos:** quién puede leer qué (por colección y por rol si se añaden roles); documentar en INFORME_PHIPA o anexo.
- **Consent:** ya bien cubierto; futuro: retención y revocación de consentimiento (flujo y documentación).

### 4.4 Billing y reporting

- **Export audit-ready:** WO-05 deja la base; siguiente paso: export estable (JSON/CSV) con lista de encounters por paciente/periodo, firmado o con checksum para auditoría.
- **WSIB/MVA mapping fino:** cuando existan señales claras en el encounter (source, billingType, etc.), completar reglas en `BillingClassificationService` y tests para cada tipo.
- **UI de billing:** solo cuando el piloto lo requiera; mantener “solo datos, sin facturación real” hasta tener requisitos claros.

### 4.5 Testing y calidad

- **Cobertura mínima en dominios críticos:** persistencia (PersistenceService/Enhanced), consent (VerbalConsentService, checkConsentViaServer), encounters (create/update/getEncountersForBilling), session comparison (getEncountersComparisonState).
- **E2E estable:** un “happy path” piloto (login → consent → workflow → SOAP → guardar) automatizado y estable en entorno de pruebas.
- **Tests de regresión visual (opcional):** si se prioriza UI (formularios, modales), considerar Playwright con snapshots en flujos clave.

### 4.6 Documentación y onboarding

- **README:** descripción del producto, requisitos (Node, envs), comandos principales (dev, build, deploy), enlace a docs de consent/PHIPA y a esta auditoría.
- **Runbook piloto:** una página con pasos para desplegar, rollback, variables críticas y contacto en caso de incidencia.
- **Glosario técnico-clínico:** encounter vs consultation, visitType, session number, para alinear dev y producto.

### 4.7 Infra y despliegue

- **Entornos:** definir explícitamente dev / UAT / piloto (y producción cuando aplique) y qué proyecto Firebase y envs usa cada uno.
- **Secrets:** todas las claves y tokens en variables de entorno o gestor de secretos; nada de credenciales en repo.
- **Limpieza de raíz:** muchos scripts y .md en la raíz; a medio plazo mover a `scripts/`, `docs/` o `tools/` para reducir ruido.

---

## 5. Checklist rápido pre-piloto

| # | Acción | Hecho |
|---|--------|--------|
| 1 | typecheck + lint + build en CI en cada PR | [ ] |
| 2 | Smoke o E2E del flujo consent → workflow → guardar SOAP | [ ] |
| 3 | Documentar envs necesarios para UAT/piloto | [ ] |
| 4 | Un lugar con el comando/orden de deploy piloto | [ ] |
| 5 | Tests unitarios para BillingClassificationService y getEncountersForBilling | [ ] |
| 6 | (Opcional) Actualizar Husky pre-commit | [ ] |

---

## 6. Conclusión

- **Lanzar el piloto es razonable** con el estado actual: modelo clínico consistente, consent y persistencia sólidos, base de billing sin impacto en flujos clínicos.
- **Pre-piloto:** priorizar CI (typecheck + build + smoke), documentación de envs y deploy, y tests mínimos de billing/sesiones para ganar confianza.
- **Futuro:** enfocarse en mantenibilidad (dividir ProfessionalWorkflowPage), observabilidad, y en extender billing/reporting y tests en dominios críticos.

Si quieres, el siguiente paso puede ser bajar una de estas mejoras a un WO concreto (por ejemplo “CI: typecheck + smoke en PR” o “Tests: BillingClassificationService + getEncountersForBilling”) con alcance y criterios de aceptación definidos.
