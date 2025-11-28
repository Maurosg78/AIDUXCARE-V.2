# ❓ PREGUNTAS PARA CTO: COMMAND CENTER ARCHITECTURE
## Funcionalidades y Ubicación de Features

**Fecha:** Noviembre 2025  
**Contexto:** Sprint 1 completado, necesitamos clarificar arquitectura para próximas features

---

## 🎯 CONTEXTO

Después de completar Sprint 1 (Session Comparison), identificamos que varias funcionalidades deberían estar en el **Command Center** en lugar de (o además de) en el ProfessionalWorkflowPage.

**Features identificadas:**
1. Tipo de sesión (evaluación inicial, final, follow up, certificado, WSIB/MVA)
2. Cuadro comparativo (Session Comparison)
3. Cantidad de tokens restantes
4. Otras funcionalidades de control/supervisión

---

## ❓ PREGUNTAS PARA CTO

### **1. ARQUITECTURA DEL COMMAND CENTER**

**Pregunta 1.1:** ¿Cuál es el propósito principal del Command Center?
- [ ] Dashboard de control/supervisión
- [ ] Panel de configuración de sesión
- [ ] Centro de métricas y analytics
- [ ] Otro: _______________

**Pregunta 1.2:** ¿Qué funcionalidades deberían estar SOLO en Command Center vs. disponibles en ambos lugares?

**Pregunta 1.3:** ¿El Command Center es para:
- [ ] Configuración PRE-sesión (antes de iniciar workflow)
- [ ] Supervisión DURANTE sesión (monitoring)
- [ ] Análisis POST-sesión (después de completar)
- [ ] Todo lo anterior

---

### **2. TIPO DE SESIÓN**

**Pregunta 2.1:** ¿Dónde debería configurarse el tipo de sesión?
- [ ] Command Center (antes de iniciar workflow)
- [ ] ProfessionalWorkflowPage (durante workflow)
- [ ] Ambos lugares

**Pregunta 2.2:** ¿Qué tipos de sesión debemos soportar?
- [ ] Evaluación inicial
- [ ] Evaluación final/re-evaluación
- [ ] Follow-up
- [ ] Certificado médico
- [ ] WSIB (Workplace Safety and Insurance Board)
- [ ] MVA (Motor Vehicle Accident)
- [ ] Otros: _______________

**Pregunta 2.3:** ¿El tipo de sesión afecta:
- [ ] El flujo del workflow
- [ ] Los campos del SOAP
- [ ] Los templates/documentos generados
- [ ] Las métricas capturadas
- [ ] Todo lo anterior

**Pregunta 2.4:** ¿Ya existe alguna implementación de tipos de sesión?
- [ ] Sí, en: _______________
- [ ] No, necesita implementarse

---

### **3. SESSION COMPARISON (CUADRO COMPARATIVO)**

**Pregunta 3.1:** ¿Dónde debería estar Session Comparison?
- [ ] Solo en Command Center (vista de todas las sesiones)
- [ ] Solo en ProfessionalWorkflowPage (durante sesión actual)
- [ ] En ambos lugares (con diferentes propósitos)

**Pregunta 3.2:** En Command Center, ¿qué debería mostrar?
- [ ] Comparación entre sesiones seleccionadas
- [ ] Comparación automática con última sesión
- [ ] Vista histórica de todas las sesiones
- [ ] Gráficos de progreso longitudinal
- [ ] Todo lo anterior

**Pregunta 3.3:** ¿Session Comparison en ProfessionalWorkflowPage debería:
- [ ] Mostrarse siempre (actual)
- [ ] Mostrarse solo cuando hay sesión previa
- [ ] Ser opcional/configurable
- [ ] Moverse completamente a Command Center

---

### **4. TOKENS Y QUOTAS**

**Pregunta 4.1:** ¿Existe un sistema de tokens/quota?
- [ ] Sí, implementado en: _______________
- [ ] No, necesita implementarse
- [ ] Planificado pero no implementado

**Pregunta 4.2:** ¿Qué tipo de tokens/quota necesitamos?
- [ ] Tokens de Vertex AI (LLM)
- [ ] Tokens de Whisper (STT)
- [ ] Sesiones por mes
- [ ] Pacientes por mes
- [ ] Otros: _______________

**Pregunta 4.3:** ¿Dónde debería mostrarse la información de tokens?
- [ ] Command Center (dashboard principal)
- [ ] ProfessionalWorkflowPage (durante sesión)
- [ ] Ambos lugares
- [ ] Settings/Account page

**Pregunta 4.4:** ¿Qué información mostrar?
- [ ] Tokens restantes
- [ ] Tokens usados hoy/semana/mes
- [ ] Proyección de uso
- [ ] Alertas cuando quedan pocos tokens
- [ ] Todo lo anterior

---

### **5. WSIB/MVA Y DOCUMENTOS ESPECIALES**

**Pregunta 5.1:** ¿WSIB/MVA está implementado?
- [ ] Sí, en: _______________
- [ ] No, necesita implementarse
- [ ] Parcialmente implementado

**Pregunta 5.2:** ¿Qué documentos especiales necesitamos?
- [ ] Formularios WSIB
- [ ] Formularios MVA
- [ ] Certificados médicos
- [ ] Reportes de progreso
- [ ] Otros: _______________

**Pregunta 5.3:** ¿Dónde se generan estos documentos?
- [ ] Command Center (vista de paciente)
- [ ] ProfessionalWorkflowPage (después de SOAP)
- [ ] Página separada de documentos
- [ ] Automáticamente según tipo de sesión

**Pregunta 5.4:** ¿Los documentos WSIB/MVA requieren:
- [ ] Templates específicos
- [ ] Campos adicionales en SOAP
- [ ] Flujo de aprobación/firma
- [ ] Exportación en formatos específicos
- [ ] Todo lo anterior

---

### **6. ESTRUCTURA DEL COMMAND CENTER**

**Pregunta 6.1:** ¿Cómo debería estructurarse el Command Center?
- [ ] Dashboard único con todas las funciones
- [ ] Tabs/secciones (Patients, Sessions, Analytics, Settings)
- [ ] Sidebar con navegación
- [ ] Otro: _______________

**Pregunta 6.2:** ¿Qué secciones debería tener?
- [ ] Lista de pacientes
- [ ] Sesiones activas/recientes
- [ ] Analytics y métricas
- [ ] Configuración de sesión
- [ ] Documentos y reportes
- [ ] Tokens y quotas
- [ ] Otros: _______________

**Pregunta 6.3:** ¿El Command Center debería ser:
- [ ] Punto de entrada principal (home)
- [ ] Accesible desde cualquier página
- [ ] Solo para administradores/supervisores
- [ ] Para todos los profesionales

---

### **7. FLUJO DE TRABAJO**

**Pregunta 7.1:** ¿Cuál debería ser el flujo ideal?

**Opción A: Command Center → Workflow**
```
Command Center → Seleccionar paciente → Configurar tipo sesión → 
Iniciar workflow → ProfessionalWorkflowPage
```

**Opción B: Workflow → Command Center**
```
ProfessionalWorkflowPage → Completar sesión → 
Command Center para revisar/comparar/generar documentos
```

**Opción C: Ambos**
```
Command Center para configuración PRE-sesión
ProfessionalWorkflowPage para sesión actual
Command Center para análisis POST-sesión
```

**Pregunta 7.2:** ¿Cuál prefieres? ¿Otra opción?

---

### **8. PRIORIZACIÓN**

**Pregunta 8.1:** ¿Qué es más crítico para el pilot en Ontario?
- [ ] Tipo de sesión (WSIB/MVA)
- [ ] Session Comparison visible
- [ ] Tokens/quota tracking
- [ ] Documentos especiales
- [ ] Otro: _______________

**Pregunta 8.2:** ¿Qué puede esperar post-pilot?
- [ ] _______________
- [ ] _______________

---

### **9. INTEGRACIÓN ACTUAL**

**Pregunta 9.1:** ¿Qué funcionalidades ya están en Command Center?
- [ ] Lista de pacientes ✅
- [ ] Crear paciente ✅
- [ ] Appointments/calendario ✅
- [ ] Otras: _______________

**Pregunta 9.2:** ¿Qué falta agregar?
- [ ] Tipo de sesión
- [ ] Session Comparison
- [ ] Tokens/quota
- [ ] Documentos WSIB/MVA
- [ ] Otras: _______________

---

### **10. DECISIONES TÉCNICAS**

**Pregunta 10.1:** ¿Session Comparison debería:
- [ ] Usar el mismo componente en ambos lugares
- [ ] Tener versiones diferentes (simple vs. detallada)
- [ ] Ser un componente reutilizable con props diferentes

**Pregunta 10.2:** ¿Tipo de sesión debería:
- [ ] Ser un campo en la sesión (Firestore)
- [ ] Ser parte del contexto de SOAP
- [ ] Ser configuración de paciente
- [ ] Ser seleccionable al iniciar workflow

**Pregunta 10.3:** ¿Tokens deberían:
- [ ] Trackearse en tiempo real
- [ ] Actualizarse después de cada llamada API
- [ ] Mostrarse con cache/actualización periódica
- [ ] Integrarse con sistema de billing

---

## 📋 RESUMEN DE DECISIONES NECESARIAS

### **Críticas (necesitan respuesta antes de implementar):**
1. ✅ Ubicación de Session Comparison (ya implementado en WorkflowPage, ¿mover a Command Center?)
2. ⏳ Ubicación de configuración de tipo de sesión
3. ⏳ Ubicación de tokens/quota display
4. ⏳ Estructura y propósito del Command Center

### **Importantes (pueden definirse durante implementación):**
5. ⏳ Flujo de trabajo ideal
6. ⏳ Priorización para pilot
7. ⏳ Integración de WSIB/MVA

---

## 🎯 OBJETIVO

**Obtener claridad sobre:**
- Arquitectura del Command Center
- Ubicación de features críticas
- Flujo de trabajo ideal
- Priorización para pilot

**Para poder:**
- Implementar features en los lugares correctos
- Evitar refactoring innecesario
- Cumplir con requisitos del pilot
- Mantener arquitectura consistente

---

**Status:** ✅ **CTO RESPONDIDO - ESPERANDO SPRINT 2**  
**Urgencia:** Alta (afecta próximos sprints)  
**Impacto:** Arquitectura y UX del sistema

---

## 📋 **RESPUESTAS DEL CTO**

**Fecha de respuesta:** Noviembre 2025  
**Status:** ✅ Decisiones ejecutivas recibidas

**Ver documento completo:** `docs/north/CTO_RESPONSES_COMMAND_CENTER.md` (próximamente)

### **Resumen de Decisiones Clave:**

1. **Command Center = Hub Central** (PRE, DURANTE, POST sesión)
2. **Tipo de sesión** → Command Center (PRE-workflow)
3. **Session Comparison** → Ambos lugares (diferentes propósitos)
4. **Tokens tracking** → Command Center + Header global
5. **WSIB/MVA** → Sprint 3 (crítico para pilot)
6. **Flujo:** Command Center → Workflow → Command Center (analytics)

**Próximos pasos:** Esperar orden del CTO para Sprint 2

