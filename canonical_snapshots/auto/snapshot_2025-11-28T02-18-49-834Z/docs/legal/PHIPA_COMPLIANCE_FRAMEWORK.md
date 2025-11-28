# 🏛️ PHIPA Compliance Framework

## Resumen Ejecutivo

Este documento establece el marco de cumplimiento con PHIPA (Personal Health Information Protection Act, 2004) para el procesamiento de información de salud personal mediante inteligencia artificial en servidores estadounidenses.

---

## Sección 18 - Divulgación Transfronteriza

### Requisitos Clave

**PHIPA s. 18** establece que un custodio de información de salud personal puede divulgar información de salud personal a una persona fuera de Ontario solo si:

1. El paciente ha dado consentimiento expreso
2. La divulgación es para el propósito de tratamiento
3. Se cumplen los requisitos de safeguards apropiados

### Aplicación a AiduxCare

- ✅ **Consentimiento expreso requerido** - No puede ser implícito
- ✅ **Propósito de tratamiento** - Documentación clínica asistida por IA
- ✅ **Safeguards** - Contratos con Google Vertex AI, encriptación, etc.

---

## Knowledgeable Consent

### Elementos Obligatorios

El consentimiento debe ser "knowledgeable", lo que significa que el paciente debe entender:

1. **Qué información** se está divulgando
2. **A quién** se está divulgando
3. **Para qué propósito** se está divulgando
4. **Riesgos** asociados con la divulgación
5. **Derechos** del paciente (acceso, corrección, retiro)

### Aplicación al Documento Legal

El documento debe incluir claramente:
- ✅ Tipo de información (datos clínicos, transcripciones, notas)
- ✅ Destinatario (Google Vertex AI, servidores US)
- ✅ Propósito (análisis mediante IA para documentación clínica)
- ✅ Riesgos (CLOUD Act, acceso por autoridades US)
- ✅ Derechos del paciente (completos)

---

## Express vs Implied Consent

### Express Consent Requerido Para:

- Divulgación transfronteriza (PHIPA s. 18)
- Uso de terceros para procesamiento
- Tecnologías nuevas o experimentales
- Procesamiento mediante IA

### Implied Consent Solo Para:

- Divulgación dentro de Ontario
- Propósitos de tratamiento directo
- Situaciones de emergencia

### Aplicación a AiduxCare

**Express consent es obligatorio** porque:
- ✅ Divulgación transfronteriza (US servers)
- ✅ Uso de terceros (Google Vertex AI)
- ✅ Tecnología de IA

---

## Withdrawal Procedures

### Requisitos de Retiro

1. **Proceso claro** - El paciente debe saber cómo retirar
2. **Efecto inmediato** - El retiro debe ser efectivo inmediatamente
3. **Notificación** - El custodio debe ser notificado
4. **Opciones** - El paciente debe entender las consecuencias

### Aplicación a AiduxCare

El documento debe incluir:
- ✅ Instrucciones claras para retirar consentimiento
- ✅ Contacto para retiro (clínica o compliance@aiduxcare.com)
- ✅ Efecto del retiro (no más procesamiento mediante IA)
- ✅ Opciones alternativas (EMR tradicional)

---

## Patient Rights

### Derechos Bajo PHIPA

1. **Acceso** - Derecho a ver su información
2. **Corrección** - Derecho a corregir información incorrecta
3. **Retiro** - Derecho a retirar consentimiento
4. **Quejas** - Derecho a presentar quejas al IPC

### Aplicación al Documento

El documento debe informar claramente:
- ✅ Cómo acceder a su información
- ✅ Cómo solicitar correcciones
- ✅ Cómo retirar consentimiento
- ✅ Cómo presentar quejas al IPC Ontario

---

## Compliance Checklist

### Elementos Requeridos en el Documento Legal

- [ ] Propósito del procesamiento claramente explicado
- [ ] Ubicación específica de servidores (US, Google Vertex AI)
- [ ] Divulgación de CLOUD Act y acceso por autoridades US
- [ ] Período de retención de datos (10+ años según CPO)
- [ ] Derechos del paciente (acceso, corrección, retiro)
- [ ] Proceso de quejas (IPC Ontario)
- [ ] Instrucciones para retirar consentimiento
- [ ] Contacto para preguntas o retiro

### Validación Legal

- [ ] Revisión por legal counsel
- [ ] Validación con CPO guidance
- [ ] Consulta con privacy officer (si disponible)
- [ ] Revisión de compliance con PHIPA s. 18

---

## Notas de Implementación

### Versión del Documento Legal

El documento debe incluir:
- Versión legal (ej: "v1.0 - PHIPA Compliance")
- Fecha de vigencia
- Historial de cambios

### Audit Trail

Cada consentimiento debe registrar:
- Versión del documento legal aceptado
- Timestamp de aceptación
- IP address
- Digital signature (si aplica)
- Método de consentimiento (ongoing, session-only, declined)

---

**Estado:** Pendiente de investigación completa de PHIPA s. 18
**Próximos pasos:** Investigación legal completa, revisión por counsel
**Responsable:** Implementador / Legal Counsel

