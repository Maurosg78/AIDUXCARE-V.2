# 📁 Plan de Reorganización de Documentación

**Fecha:** Noviembre 2025  
**Objetivo:** Organizar 167 archivos .md en estructura lógica y purgar redundancias

---

## 🎯 Estructura Propuesta

```
docs/
├── README.md (índice principal)
├── compliance/          # Legal, PHIPA, PIPEDA, CPO
├── implementation/      # Handoffs, implementaciones completadas
├── testing/            # Testing guides, instrucciones
├── deployment/         # Firebase, deploy guides
├── architecture/       # Arquitectura técnica, blueprints
├── strategy/           # Análisis estratégico, métricas, roadmap
├── troubleshooting/    # Soluciones a problemas específicos
├── user-guides/        # Instrucciones para usuarios (fisios)
├── cto-briefings/      # Briefings ejecutivos
└── _archive/          # Documentos obsoletos (ya existe)
```

---

## 📋 Mapeo de Archivos

### `compliance/`
- `LEGAL_DELIVERY_FRAMEWORK.md`
- `LEGAL_COMPLIANCE_VALIDATION.md`
- `COMPLIANCE_IMPLEMENTATION_STATUS.md`
- `ANALISIS_LEGAL_FRAMEWORK_EXPANDED.md`
- `ANALISIS_CONSENTIMIENTO_AI_REGION.md`
- `legal/LEGAL_POLICY_AIDUXCARE.md` → mover aquí

### `implementation/`
- `HANDOFF_DIA1_CONSENT_WORKFLOW.md`
- `HANDOFF_DIA2_CPO_REVIEW_GATE.md`
- `HANDOFF_DIA3_TRANSPARENCY_REPORT.md`
- `IMPLEMENTACION_CONSENT_VERIFICATION_COMPLETADA.md`
- `IMPLEMENTACION_SMS_CONSENT_COMPLETADA.md`
- `FASE1_COMPLETADO.md` → consolidar con `FASE1_RESUMEN_FINAL.md`
- `FASE1_BUG_FIXES_SUMMARY.md` → consolidar
- `RESUMEN_DIA1_DEPLOY.md`
- `RESUMEN_DIA2_IMPLEMENTACION.md`

### `testing/`
- `TESTING_CONSENT_VERIFICATION_FLOW.md`
- `TESTING_FLUJO_COMPLETO_PASO_A_PASO.md`
- `INSTRUCCIONES_CREAR_PACIENTE_TEST.md`

### `deployment/`
- `GUIA_DEPLOY_MANUAL_FIREBASE.md`
- `DEPLOY_INSTRUCTIONS_FIREBASE.md` → consolidar con GUIA
- `FIRESTORE_CLI_SETUP.md`
- `FIRESTORE_VALUE_ANALYTICS_SETUP.md`
- `SOLUCION_FINAL_INDICES.md`
- `FIRESTORE_INDEXES.md` (raíz) → mover aquí

### `troubleshooting/`
- `TWILIO_SMS_SETUP.md`
- `TWILIO_CREDENTIALS_CHECK.md`
- `TWILIO_GEO_PERMISSIONS_SETUP.md`
- `TWILIO_VERIFICACION_NUMERO_CANADA.md`
- `TWILIO_VERIFICACION_TRIAL_LIMITACIONES.md`
- `TWILIO_CODIGO_NO_ACEPTADO.md` → consolidar
- `SOLUCION_LOGIN_CREDENCIALES.md`
- `SOLUCION_LOGIN_CACHE_AGRESIVA.md`
- `LOGIN_CANONICO_FUNCIONANDO.md` → consolidar
- `LOGIN_CANONICO_VERIFICACION.md` → consolidar
- `SNAPSHOT_CANONICO_LOGIN_VERIFICADO.md` → consolidar
- `SISTEMA_CUARENTENA_COMPLETADO.md`
- `ARCHIVOS_CANONICOS.md`
- `CANONICAL_FILES_VERIFICATION.md` (raíz) → mover aquí

### `architecture/`
- `CLINICAL_COPILOT_ARCHITECTURE.md`
- `SOAP_GENERATION_ARCHITECTURE.md`
- `PHYSICAL_TEST_LIBRARY.md`
- `PHYSICAL_TEST_LIBRARY_README.md`
- `PHYSICAL_TEST_LIBRARY_CHANGELOG.md`
- `VERTEX_RATE_LIMITING.md`
- `MASTER_PROMPT_COMPLETE.md`
- `MASTER_PROMPT_DESIGN_CTO.md`
- `MASTER_PROMPT_CTO_SUMMARY.md`
- `PROMPT_VALIDATION_REPORT.md`
- `blueprints/` → mover contenido relevante aquí

### `strategy/`
- `STRATEGIC_METRICS_ANALYSIS.md`
- `STRATEGIC_METRICS_FRAMEWORK.md` (raíz) → mover aquí
- `ANALISIS_ESTRATEGICO_MERCADO_2025.md`
- `IMPLEMENTATION_PLAN_MVP_METRICS.md`
- `NORTH_ROADMAP.md`
- `ROADMAP_UNICA_FUENTE_DE_VERDAD.md` (raíz) → mover aquí
- `SPRINT2_REDEFINITION.md`
- `SPRINT2_NOTESREPO_REPORT.md`

### `user-guides/`
- `INSTRUCCIONES_BASICAS_FISIOS.md`
- `ENGINEER_FIRST_APPROACH.md`

### `cto-briefings/`
- `DAY4_CTO_BRIEFING.md`
- `PHYSICAL_TEST_LIBRARY_STATUS_CTO.md`
- `PHYSICAL_TEST_LIBRARY_EXECUTIVE_SUMMARY.md`
- `PHYSICAL_TEST_LIBRARY_SLIDE_DECK.md`
- `PHYSICAL_TEST_LIBRARY_SPEAKER_NOTES.md`

### `_archive/` (purgar o consolidar)
- `PROPUESTA_CONSENTIMIENTO_PACIENTE_SMS.md` → consolidar en implementation
- `PROPUESTA_UX_TESTS_FISICOS.md` → consolidar
- `PROPUESTA_IMPLEMENTACION_GAPS_CRITICOS.md` → mover a implementation
- `PLAN_VERSION_DEMO_TESTEO_1MES.md` → consolidar con FASE1
- `INDICE_DOCUMENTACION_CRITICA.md` → actualizar README principal
- `STATUS_DOCUMENTACION_CRITICA.md` → consolidar

---

## 🔄 Consolidaciones Propuestas

1. **FASE1 docs** → Un solo `FASE1_COMPLETADO.md` consolidado
2. **Login docs** → Un solo `LOGIN_TROUBLESHOOTING.md`
3. **Twilio docs** → Un solo `TWILIO_SETUP_TROUBLESHOOTING.md`
4. **Deploy docs** → Un solo `FIREBASE_DEPLOYMENT_GUIDE.md`
5. **Physical Test Library** → Mantener solo los esenciales, archivar presentaciones

---

## ✅ Acciones Rápidas

1. Crear estructura de carpetas
2. Mover archivos a carpetas correspondientes
3. Consolidar documentos redundantes
4. Actualizar README principal con índice
5. Purgar documentos obsoletos a `_archive/`

**Tiempo estimado:** 15-20 minutos

