# POLÍTICA: NO USO DE PHI PARA ENTRENAMIENTO

**Fecha:** Noviembre 2025  
**Versión:** 1.0  
**Aplicable a:** AiduxCare V.2  
**Status:** ✅ **APROBADA**

---

## DECLARACIÓN DE POLÍTICA

AiduxCare **NO utiliza, procesa, almacena ni transmite Personal Health Information (PHI) para:**

1. **Entrenamiento de modelos de IA**
2. **Desarrollo de productos**
3. **Análisis comerciales agregados**
4. **Cualquier fin no autorizado explícitamente por el custodio de datos (fisioterapeuta)**

---

## IMPLEMENTACIÓN TÉCNICA

### Pseudonymización

- Todos los datos de analytics son pseudonymizados antes de almacenamiento
- User IDs y Session IDs son hasheados (SHA-256)
- K-anonymity aplicado (mínimo 5 eventos para agregación)

**Archivos de implementación:**
- `src/services/pseudonymizationService.ts` - Pseudonymización de datos
- `src/services/analyticsValidationService.ts` - Validación de que queries no contengan PHI

### Validación

- `analyticsValidationService.ts` valida que queries no contengan PHI
- `pseudonymizationService.ts` aplica hashing antes de analytics
- Validación automática en tiempo de ejecución

### Almacenamiento

- **PHI:** Almacenado en Firestore bajo control del fisioterapeuta (custodio)
- **Analytics:** Almacenados sin PHI identificable
- **Logs:** No contienen PHI raw (solo referencias hasheadas)

---

## CUMPLIMIENTO REGULATORIO

### PHIPA (Personal Health Information Protection Act - Ontario)

- Datos solo para fines autorizados por el custodio
- Consentimiento explícito requerido para cualquier uso
- Retención según obligaciones legales del custodio

### PIPEDA (Personal Information Protection and Electronic Documents Act)

- Uso limitado a propósito declarado
- Consentimiento informado requerido
- Minimización de datos recolectados

### CPO (College of Physiotherapists of Ontario)

- Cumplimiento con estándares profesionales
- Documentación adecuada de consentimientos
- Trazabilidad completa de accesos

---

## AUDITORÍA Y VERIFICACIÓN

Esta política es verificable mediante:

1. **Revisión de código fuente:**
   - Verificación de pseudonymización en `pseudonymizationService.ts`
   - Validación de queries en `analyticsValidationService.ts`

2. **Auditoría de queries de analytics:**
   - Verificación de que no contengan PHI identificable
   - Confirmación de K-anonymity aplicado

3. **Verificación de pseudonymización:**
   - Confirmación de hashing SHA-256
   - Validación de que IDs no son reversibles

4. **Revisión de logs:**
   - Confirmación de que logs no contienen PHI raw
   - Verificación de referencias hasheadas únicamente

---

## EXCEPCIONES

**No hay excepciones a esta política.**

Todos los datos PHI deben ser:
- Pseudonymizados antes de analytics
- Usados solo para fines autorizados explícitamente
- Bajo control del custodio (fisioterapeuta)

---

## VIOLACIONES

Cualquier violación de esta política debe ser:
1. Reportada inmediatamente al CTO
2. Documentada en `docs/compliance/INCIDENTS.md`
3. Corregida dentro de 24 horas
4. Auditada para prevenir recurrencia

---

## CONTACTO

Para preguntas sobre esta política:
- **CTO:** [Contacto]
- **Compliance Officer:** [Contacto]
- **Documentación:** `docs/compliance/`

---

## VERSIÓN Y APROBACIÓN

**Versión:** 1.0  
**Fecha de aprobación:** Noviembre 2025  
**Aprobado por:** CTO  
**Próxima revisión:** Diciembre 2025

---

**Esta política es parte del marco de cumplimiento de AiduxCare y debe ser revisada anualmente o cuando cambien las regulaciones aplicables.**

