# 🧩 CA-DEC2025 Pilot Scope

**Fecha:** Diciembre 2025  
**Versión:** 1.0  
**Audiencia:** Fisioterapeutas participantes, Auditores, Equipo técnico

---

## 🎯 Objetivo del Piloto

Este piloto tiene como objetivo validar la **utilidad clínica** y **estabilidad técnica** de AiDux en un entorno controlado con 10 fisioterapeutas canadienses.

**No es una demo comercial.** Es un laboratorio para recoger feedback real sobre:
- Qué funcionalidades aportan valor real
- Qué limitaciones son aceptables vs. bloqueantes
- Qué mejoras son prioritarias para producción

---

## ✅ Escenarios Soportados

### 1. Initial Assessment + Plan

**Qué puede hacer:**
- Crear paciente nuevo
- Crear episodio de atención
- Generar nota inicial (initial assessment) con AI basada en transcripción de audio
- Generar plan de tratamiento (ETP) estructurado
- Editar y firmar nota antes de guardar

**Flujo típico:**
1. Fisio crea paciente en sistema
2. Inicia sesión de "Initial Assessment"
3. Graba o transcribe motivo de consulta y evaluación inicial
4. AI genera nota SOAP estructurada
5. Fisio revisa, edita si necesario
6. Guarda y firma nota

---

### 2. Follow-up Basado en Plan

**Qué puede hacer:**
- Abrir episodio existente con ETP previo
- Generar nota de seguimiento que referencia el plan anterior
- AI respeta objetivos y progreso documentado
- Mantiene continuidad clínica entre sesiones

**Flujo típico:**
1. Fisio abre episodio con ETP previo
2. Inicia sesión de "Follow-up"
3. Graba o transcribe progreso del paciente
4. AI genera nota de seguimiento que:
   - Referencia objetivos del ETP
   - Documenta progreso vs. baseline
   - Sugiere ajustes al plan si es necesario
5. Fisio revisa, edita, guarda

---

### 3. Ingesta de Informe de Imagen (MRI Lumbar)

**Qué puede hacer:**
- Subir PDF de informe de imagen (MRI, CT, X-Ray)
- Extraer texto del PDF automáticamente
- Generar resumen clínico corto (≤900 chars) con AI
- Inferir campos básicos:
  - Modality (MRI/CT/XR)
  - Body region (Lumbar spine, Cervical spine, etc.)
  - Lateralidad (left/right/bilateral) cuando sea evidente
  - Año del estudio
- Mostrar resumen y campos en la interfaz
- Usar contexto de imagen en la generación de notas AI

**Flujo típico:**
1. Fisio sube PDF de informe de imagen
2. Sistema procesa PDF (extrae texto, genera resumen)
3. Resumen aparece en panel de "Imaging Reports"
4. Al generar nota inicial o follow-up, AI considera el contexto de imagen
5. Fisio puede ver PDF original y resumen lado a lado

---

## ❌ Qué NO Hace

### Limitaciones Clínicas

**No genera diagnósticos nuevos:**
- AI no inventa diagnósticos que no estén en el informe
- AI no hace recomendaciones de tratamiento sin supervisión clínica
- AI es una **asistente**, no un reemplazo del juicio clínico

**No decide tratamiento:**
- Todas las decisiones de tratamiento son del fisioterapeuta
- AI solo sugiere intervenciones basadas en evidencia
- El fisio siempre tiene la última palabra

**No reemplaza juicio clínico:**
- AI expone información y patrones, no toma decisiones
- El fisio debe validar toda la información generada
- AI puede tener errores o sesgos que el fisio debe detectar

---

### Limitaciones Técnicas Conocidas

**PDFs:**
- ✅ Solo PDFs con texto extraíble (digitales)
- ❌ No soporta PDFs escaneados/imagen pura (requiere OCR futuro)
- ❌ No soporta otros formatos (Word, imágenes sueltas)

**Idiomas:**
- ✅ Inglés (en-CA) - completamente soportado
- ⚠️ Español - soporte parcial (puede funcionar pero no optimizado)
- ❌ Francés - no soportado

**Regiones corporales:**
- ✅ Lumbar spine - completamente soportado
- ✅ Cervical spine - soportado
- ✅ Knee, Shoulder - soportado básico
- ⚠️ Otras regiones - puede funcionar pero inferencia limitada

**Casos clínicos:**
- ✅ Casos MSK (musculoesqueléticos) - completamente soportado
- ⚠️ Casos neurológicos - soporte parcial
- ❌ Casos pediátricos - no validado
- ❌ Casos complejos multi-sistémicos - no optimizado

**Conectividad:**
- Requiere conexión a internet estable
- Si Vertex AI está caído, la generación de notas falla
- Si Storage está caído, no se pueden subir PDFs

---

## 🔒 Seguridad y Cumplimiento

**Cumplimiento:**
- ✅ PHIPA/PIPEDA compliant
- ✅ Datos almacenados en Canadá (northamerica-northeast1)
- ✅ Logs sin PHI/PII
- ✅ Acceso controlado por autenticación

**Limitaciones de seguridad:**
- ⚠️ Consentimiento SMS funcional pero UI básica
- ⚠️ Auditoría básica (logs de acciones críticas)
- ❌ Digital signatures avanzadas - no implementado
- ❌ Multi-factor authentication - no requerido en piloto

---

## 📊 Métricas de Éxito del Piloto

**Técnicas:**
- < 5% de errores 500 en funciones críticas
- Tiempo de respuesta < 10s para generación de notas
- Tasa de éxito > 95% en extracción de PDFs con texto

**Clínicas:**
- > 70% de fisios reportan ahorro de tiempo
- > 80% de fisios encuentran útil el resumen de imágenes
- < 20% de fisios reportan errores que bloquean su flujo

**Feedback cualitativo:**
- Identificar top 3 funcionalidades más valiosas
- Identificar top 3 limitaciones más bloqueantes
- Recoger sugerencias de mejora prioritarias

---

## 🚨 Qué Hacer Si Algo Falla

### Si Imaging falla:
- **Solución temporal:** Fisio puede subir PDF pero documentar resumen manualmente
- **Impacto:** No bloquea el flujo, solo pierde automatización

### Si SMS falla:
- **Solución temporal:** Consentimiento por email o papel
- **Impacto:** No bloquea el flujo, solo pierde automatización

### Si Nota AI falla:
- **Solución temporal:** Nota manual + copiar/pegar texto si es necesario
- **Impacto:** Bloquea parcialmente el flujo, pero el sistema sigue funcionando

### Si Vertex AI está caído:
- **Solución temporal:** Notas manuales únicamente
- **Impacto:** Bloquea funcionalidad core, pero sistema no se cae

**Contacto de soporte técnico durante piloto:**
- Email: [TBD]
- Slack: [TBD]
- Horario: [TBD]

---

## 📝 Documentación Adicional

- [QA Checklist](./QA_CHECKLIST_DEC2025.md) - Guía paso a paso para testers
- [Ops Plan](./OPS_PLAN_DEC2025.md) - Plan de soporte técnico
- [Consent Flow](./CONSENT_FLOW_MINIMAL.md) - Flujo de consentimiento

---

**Última actualización:** 2025-12-07  
**Versión:** 1.0  
**Estado:** ✅ Listo para distribución a participantes del piloto

