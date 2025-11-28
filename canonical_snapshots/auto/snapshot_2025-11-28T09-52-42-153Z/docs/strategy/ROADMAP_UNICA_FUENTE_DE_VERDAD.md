# 🏥 ROADMAP ÚNICA FUENTE DE VERDAD — AiDuxCare V.2

## 📋 Estado actual (MVP)
- ✅ LoginPage con gradiente fucsia‑azul
- ✅ Wizard LEGACY 3 pasos (Personal/Professional/Location)
- ✅ Orquestador OnboardingPage.tsx y ruta /register
- ✅ Firebase UAT configurado
- ✅ Servicios de persistencia (OnboardingService, AuditService)
- ⚠️ Persistencia temporal en localStorage → migrar a Firestore

## 🏗️ Arquitectura actual
- ✅ Pipeline único de registro
- ✅ Basura aislada en `src/_deprecated` y `src/z_trash`
- ✅ CI/CD, ESLint (boundaries), TypeScript estricto

## 🚀 Próximos sprints
### Sprint 1: Estabilización MVP
- [ ] Validar wizard LEGACY de punta a punta
- [ ] Migrar persistencia a Firestore (reglas mínimas)
- [ ] Auditoría inmutable operativa
- [ ] Tests unitarios del flujo

### Sprint 2: Compliance y seguridad
- [ ] Aplicar checklist SECURITY_COMPLIANCE.md (obligatorio en PR)
- [ ] Reglas Firestore restringidas y auditadas
- [ ] Validación de datos clínicos y consentimiento
- [ ] Logs completos (login/logout/acceso/modificación)

### Sprint 3: Escalabilidad
- [ ] Performance wizard
- [ ] Manejo de errores robusto
- [ ] Monitoreo/alertas
- [ ] Documentación de API

## 🗂️ Archivos críticos (NO TOCAR sin aprobación CTO)
- `src/pages/LoginPage.tsx`
- `src/pages/OnboardingPage.tsx`
- `src/components/wizard/*`
- `src/features/auth/RegisterPage.tsx`
- `src/router/router.tsx`
- `src/lib/firebase.ts`
- `src/services/OnboardingService.ts`
- `src/services/AuditService.ts`

## 🚫 Prohibido
- Imports desde `src/_deprecated/**` o `src/z_trash/**`
- Desactivar reglas ESLint
- Usar `any`

## ✅ Métricas de éxito
- Wizard OK, Firestore OK, Auditoría OK
- 0 imports desde `_deprecated/`
- CI/CD verde, TS y ESLint en 0 errores

## 🔁 Flujo obligatorio
1) LEER este Roadmap  
2) Verificar alineación con MVP  
3) NO eliminar archivos sin clasificación (ver docs/_scans/md_classification.tsv)  
4) Archivar lo no listado aquí en `docs/_archive/`  
5) Incluir checklist SECURITY_COMPLIANCE.md en cada PR

**Última actualización:** $(date)
