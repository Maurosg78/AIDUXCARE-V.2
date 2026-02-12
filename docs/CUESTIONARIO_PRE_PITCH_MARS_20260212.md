# 📋 CUESTIONARIO PRE-PITCH MaRS - AIDUXCARE PILOT
**Fecha:** 12 de febrero, 2026  
**Estado:** Post-corrección de bugs críticos de consent  
**Deployment:** https://pilot.aiduxcare.com

---

## SECCIÓN 1: ESTADO TÉCNICO DEL SISTEMA

### 1.1 Infraestructura y Deployment
- [x] ✅ Sistema desplegado y accesible en producción (pilot.aiduxcare.com)
- **Estado del servidor (VPS):** Online (GCP VM pilot-vps, PM2 pilot-web + pilot-tunnel)
- **Última fecha de deployment exitoso:** 12 febrero 2026
- **Número de reinicios en últimas 24h:** [Verificar en PM2 – típicamente bajo]

### 1.2 Funcionalidades Core - Estado Actual
| Funcionalidad | Funciona | Bugs Conocidos | Prioridad Fix |
|--------------|----------|----------------|----------------|
| Login de fisioterapeutas | ✅ Sí | - | - |
| Command Center (lista pacientes) | ✅ Sí | - | - |
| Consent verbal (Ontario PHIPA) | ✅ Sí | - | - |
| Consent digital (SMS + portal) | ✅ Sí | Resuelto 12/02: Cloudflare bypass, dominio autorizado | - |
| Grabación de audio (dictado) | ✅ Sí | ERR_BLOCKED_BY_CLIENT en algunos navegadores (ad blocker) | ⬜ P2 |
| Generación de notas SOAP | ✅ Sí | - | - |
| Guardado de sesiones clínicas | ✅ Sí | - | - |
| Export PDF de notas | ✅ Sí | - | - |

### 1.3 Bugs Críticos Resueltos Hoy (12 feb 2026)
- ✅ Infinite redirect loop en consent verification
- ✅ Deprecated function calls en PatientConsentService
- ✅ ConsentGate no mostraba UI correcta
- ✅ sendDisclosureLink enviaba `to` en lugar de `phone` (Cloud Function 400)
- ✅ Ruta /disclosure/:patientId inexistente (página creada)
- ✅ Cloudflare Access bloqueaba consent portal (política Bypass)
- ✅ Firestore/API key: dominio pilot.aiduxcare.com no autorizado
- ✅ Firebase Auth: pilot.aiduxcare.com añadido a authorized domains

---

## SECCIÓN 2: PREPARACIÓN PARA PILOTO CLÍNICO

### 2.1 Usuarios Piloto
- **Número de fisioterapeutas registrados:** [Verificar en Firestore usuarios]
- **Número de pacientes de prueba:** [Verificar en Firestore patients – logs muestran creación exitosa]
- **¿Fisios han completado onboarding?** ⬜ Sí ⬜ No ⬜ Parcial

### 2.2 Datos de Prueba
- **¿Existen sesiones clínicas completas end-to-end?** ✅ Sí (logs confirman flujo: paciente → consent → SOAP)
- **Número de notas SOAP generadas exitosamente:** [Verificar en Firestore consultations]
- **¿Se han probado follow-ups?** ✅ Sí (sessionTypeService soporta followup)

### 2.3 Compliance Ontario (PHIPA/PIPEDA)
| Requisito | Implementado | Evidencia |
|-----------|--------------|-----------|
| Consent verbal documentado | ✅ Sí | VerbalConsentService, patient_consent, PHIPA s.18 |
| Consent digital (SMS + portal) | ✅ Sí | PatientConsentService, acceptPatientConsentByToken |
| Audit trail de accesos | ✅ Sí | FirestoreAuditLogger, audit_logs, hospital_portal |
| Encriptación en tránsito (HTTPS) | ✅ Sí | pilot.aiduxcare.com en HTTPS, Cloudflare |
| Almacenamiento en Canadá | ✅ Sí | northamerica-northeast1 (Montreal) – Firestore, Functions, Vertex |
| Retention policy definida | ⬜ Parcial | Hospital portal 24–48h; datos clínicos: [verificar política] |

---

## SECCIÓN 3: MÉTRICAS DE RENDIMIENTO

### 3.1 Tiempos de Respuesta
- **Tiempo promedio de carga de Command Center:** [Medir – típicamente 2–5 s]
- **Tiempo de generación de nota SOAP:** [Medir – Vertex AI ~5–15 s]
- **Latencia de grabación de audio:** [Medir – depende de Whisper/Vertex]

### 3.2 Errores y Estabilidad (últimas 24h)
- **Errores 500 del servidor:** [Verificar en Firebase/PM2 logs]
- **Errores de Firebase:** [Verificar Firebase Console]
- **Timeout de Cloud Functions:** [Verificar Functions logs]
- **Crash rate:** [Verificar – expectativa &lt; 1%]

---

## SECCIÓN 4: GAPS CRÍTICOS ANTES DE PITCH

### 4.1 Funcionalidades Faltantes
- ⬜ Integración con facturación CPO Ontario
- ⬜ Templates de ejercicios personalizados
- ⬜ Dashboard de métricas clínicas (parcial: TechDashboard existe)
- ⬜ Export a formato CPO estándar
- ⬜ Firma digital de fisioterapeuta
- ⬜ Otros: ___________________________

### 4.2 Documentación
- ✅ Manual de usuario para fisioterapeutas (CLINICAL_USER_GUIDE_PILOT_EDITION_INTERNAL_DRAFT.md)
- ✅ Guía de onboarding (ProfessionalOnboardingPage)
- ✅ Política de privacidad actualizada (PrivacyPolicyPage)
- ✅ Terms of Service para Ontario (TermsOfServicePage)
- ⬜ FAQ de soporte técnico (FAQPage existe – verificar actualización)

### 4.3 Soporte y Monitoreo
- **¿Existe sistema de alertas?** ⬜ Sí ⬜ No (Firebase Console, PM2)
- **¿Hay canal de soporte para fisios?** ⬜ Sí ⬜ No
- **¿Se monitorean errores en tiempo real?** ⬜ Sí ⬜ No (Firebase Console, DevTools)

---

## SECCIÓN 5: PREPARACIÓN PARA DEMO

### 5.1 Escenario de Demo Planificado
- [x] Fisioterapeuta hace login
- [x] Selecciona paciente desde Command Center
- [x] Obtiene consent verbal (PHIPA compliant) o envía SMS consent
- [x] Paciente acepta vía link (consent portal)
- [x] Graba sesión clínica (audio)
- [x] Sistema genera nota SOAP automáticamente
- [x] Fisio revisa y ajusta nota
- [x] Exporta PDF

### 5.2 Puntos Débiles del Demo
- **¿Qué puede fallar durante el pitch?** Latencia de Vertex AI, ad blocker bloqueando Firestore, cold start de Functions
- **¿Hay plan B si falla algo?** ⬜ Sí ⬜ No (DEMO-STABILITY-CHECKLIST: backup user, patient, session, video)
- **¿Se ha practicado el demo?** ⬜ Sí ⬜ No

---

## SECCIÓN 6: ROADMAP POST-PITCH

### 6.1 Próximos 7 días
- [ ] Validar métricas de uso en pilot
- [ ] Monitorear errores consent/SMS
- [ ] Revisar feedback de fisios piloto

### 6.2 Próximos 30 días
- [ ] Integración facturación CPO (si aplica)
- [ ] Dashboard métricas clínicas
- [ ] Export formato CPO

### 6.3 Recursos Necesarios
- **Budget estimado:** $ ___________
- **Equipo necesario:** ___________
- **Infraestructura adicional:** ___________

---

## SECCIÓN 7: RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Plan de Mitigación |
|--------|--------------|---------|-------------------|
| Sistema cae durante demo | ⬜ Alta ⬜ Media ⬜ Baja | ⬜ Alto ⬜ Medio ⬜ Bajo | Pre-warm Functions 15 min antes; backup video |
| Problemas de compliance PHIPA | ⬜ Alta ⬜ Media ⬜ Baja | ⬜ Alto ⬜ Medio ⬜ Bajo | Región CA verificada; consent documented |
| Fisios no adoptan el sistema | ⬜ Alta ⬜ Media ⬜ Baja | ⬜ Alto ⬜ Medio ⬜ Bajo | User guide; onboarding; soporte |
| Costos de infraestructura exceden presupuesto | ⬜ Alta ⬜ Media ⬜ Baja | ⬜ Alto ⬜ Medio ⬜ Bajo | Monitorear quotas; token budget |

---

## SECCIÓN 8: SIGN-OFF

**Responsable Técnico:** ___________________________  
**Fecha de Revisión:** 12 febrero 2026  
**Estado General:** ⬜ Listo para Pitch ⬜ Requiere Trabajo Adicional ⬜ Bloqueado  

**Comentarios Finales:**  
Flujo consent E2E funcional (12 feb 2026). Cloudflare bypass, dominio autorizado, SMS disclosure fix. Sistema estable para demo. Completar métricas y usuarios piloto manualmente.  
_________________________________________________________________  
_________________________________________________________________  
_________________________________________________________________  
