# 🚨 SECURITY_COMPLIANCE.md - FUENTE DE VERDAD ENTERPRISE 🚨

## **¡ESTE ARCHIVO ES OBLIGATORIO LEER Y REVISAR EN CADA PR Y CADA CAMBIO CRÍTICO!**

---

## 1. **Principios y Estándares**
- **HIPAA** (Health Insurance Portability and Accountability Act)
- **EDGR** (European Data Governance Regulation)
- **ISO 27001** (Gestión de Seguridad de la Información)
- **SOC 2 Type II** (Controles de Seguridad y Privacidad)
- **GDPR** (Reglamento General de Protección de Datos)

**Auditoría esperada por Deloitte, Bureau Veritas o equivalente.**

---

## 2. **Checklist de Compliance para TODO cambio**
- [ ] ¿Toda acción sobre datos clínicos queda registrada (usuario, timestamp, acción, resultado)?
- [ ] ¿El acceso a datos está restringido por rol y autenticación?
- [ ] ¿Se usa cifrado en tránsito (TLS 1.2+) y en reposo (AES-256)?
- [ ] ¿Hay logs de login, logout, acceso, modificación y eliminación de datos?
- [ ] ¿Se puede exportar el historial de logs para auditoría externa?
- [ ] ¿Se respeta el principio de mínimo privilegio en cada endpoint y función?
- [ ] ¿Hay mecanismos de detección de accesos no autorizados o anómalos?
- [ ] ¿Se documenta y revisa cada excepción o bypass de seguridad?
- [ ] ¿Se respeta el consentimiento y los derechos del paciente (acceso, rectificación, borrado)?
- [ ] ¿Se actualizó este archivo si hubo cambios en la arquitectura, roles, logging o políticas?

---

## 3. **Política de Revisión Obligatoria**
- **Cada PR debe incluir el checklist de compliance marcado.**
- **Cada 1000 líneas de código nuevas o cada 2 semanas, es OBLIGATORIO revisar y actualizar este archivo.**
- **Nadie puede mergear a main/production sin marcar el checklist y confirmar lectura de este archivo.**
- **Las revisiones deben quedar registradas aquí (fecha, responsable, hallazgos, acciones):**

### Historial de Revisiones
| Fecha       | Responsable | Descripción / Hallazgos / Acciones |
|-------------|-------------|-------------------------------------|
| YYYY-MM-DD  | Nombre      | Ejemplo: Se migró login a Firebase, logging de acceso implementado |

---

## 3. Registro de migración crítica: Supabase → Firebase/Firestore

- **Fecha:** 2025-07-18
- **Responsable técnico:** Equipo AiDuxCare (Lead: Mauricio Sobarzo)
- **Motivo:** Cumplimiento HIPAA, EDGR, ISO 27001, SOC 2, auditoría Deloitte/Bureau Veritas.
- **Acciones ejecutadas:**
  - Eliminación total de dependencias, lógica, mocks y tests de Supabase.
  - Migración de autenticación, persistencia y acceso a datos a Firebase Auth y Firestore.
  - Refactor de login, sesión, contexto de usuario y servicios críticos.
  - Validación de build y arranque sin errores de imports ni referencias rotas.
  - Checklist de compliance revisado y marcado.
- **Resultado:**
  - El sistema cumple con los estándares de seguridad, trazabilidad y privacidad exigidos para software médico enterprise.
  - Listo para auditoría externa y certificación.

---

## 4. **Ejemplo de Logging Estructurado (Auditoría)**
```json
{
  "timestamp": "2025-07-16T12:34:56Z",
  "userId": "uid-123",
  "action": "LOGIN_SUCCESS",
  "ip": "192.168.1.10",
  "result": "OK",
  "details": { "method": "email", "role": "PHYSICIAN" }
}
```

---

## 5. **Protocolo de Emergencia**
- Si se detecta una brecha de compliance, el merge debe ser bloqueado y reportado a management.
- Si hay dudas sobre la interpretación de un estándar, consultar a un experto externo antes de avanzar.

---

## 6. **Plantilla de PR (copiar/pegar en cada Pull Request)**
```
### Compliance Check (SECURITY_COMPLIANCE.md)
- [ ] He leído y revisado la fuente de verdad de compliance.
- [ ] Este cambio cumple con todos los puntos aplicables del checklist.
- [ ] Si hay dudas o excepciones, las he documentado en el PR.
```

---

## 7. **Notas**
- Este archivo es la ÚNICA FUENTE DE VERDAD para compliance y auditoría.
- Si no está aquí, no está hecho.
- El proyecto puede caerse por completo si fallamos en este aspecto.

---

**¡NO MERGEAR NADA SIN REVISAR ESTE ARCHIVO!** 

---

## 4. PRINCIPIOS HIPAA/GDPR/XAI PARA ARQUITECTURA AIDUXCARE (Resumen Ejecutivo)

**Este resumen es de cumplimiento obligatorio para todo desarrollo, revisión y arquitectura.**

### 1. Privacidad y seguridad desde el diseño
- Privacy by design y privacy by default en cada módulo, flujo y modelo de IA.
- Minimización de datos, cifrado extremo a extremo, controles de acceso granulares.

### 2. Gobernanza de IA y explicabilidad
- Modelos de IA explicables (XAI) o capas XAI dedicadas.
- Documentación y trazabilidad de decisiones algorítmicas.

### 3. Consentimiento y derechos del paciente
- Consentimiento explícito y granular para cada uso de IA.
- Ejercicio de derechos GDPR: acceso, rectificación, supresión, portabilidad, oposición, revisión humana.

### 4. Auditoría, logging y monitoreo continuo
- Logs inmutables y auditables, retención mínima 6 años (HIPAA).
- Auditoría continua, detección de incidentes y notificación proactiva.

### 5. Anonimización, seudonimización y ciclo de vida
- Anonimización/seudonimización de datos de IA.
- Ciclo de vida de datos/modelos: reentrenamiento, validación, eliminación, monitoreo de sesgo y degradación.

### 6. Comités y roles de compliance
- Comité de Gobernanza de IA multidisciplinario y DPD designado.
- Evaluaciones de Impacto de Protección de Datos (EIPD) periódicas.

### 7. Interoperabilidad y portabilidad
- Formatos interoperables (FHIR, HL7, JSON) y APIs abiertas.

**Referencia completa: ver archivo HIPAA_GDPR_XAI_ENTERPRISE.md** 