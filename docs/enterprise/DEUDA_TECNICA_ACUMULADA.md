# INFORME DE DEUDA TÉCNICA ACUMULADA
## AiDuxCare V.2 - Julio 2025

---

## 📋 RESUMEN EJECUTIVO

**Estado actual:** Sistema funcional con deuda técnica significativa que requiere atención prioritaria antes de escalar a producción.

**Impacto:** Riesgo alto de fallos en CI/CD, inconsistencias de entorno, y problemas de mantenibilidad.

**Recomendación:** Sprint dedicado de 2-3 semanas para resolver deuda técnica crítica antes de nuevas features.

---

## 🚨 PROBLEMAS CRÍTICOS (PRIORIDAD ALTA)

### 1. **Tests Inconsistentes y Frágiles**

#### 1.1 Tests de Fechas y Zona Horaria
- **Problema:** Tests fallan en CI/CD vs local debido a diferencias de zona horaria
- **Impacto:** Pipeline de CI/CD bloqueado, falsos positivos/negativos
- **Solución implementada:** `date-fns-tz` con zona horaria explícita
- **Estado:** ✅ RESUELTO

#### 1.2 Tests de React Router
- **Problema:** Warnings de React Router v7 en tests
- **Archivos afectados:** `Layout.test.tsx`, `LoginPage.test.tsx`, `RegisterPage.test.tsx`
- **Impacto:** Ruido en logs, posibles incompatibilidades futuras
- **Solución:** Actualizar configuración de tests para React Router v7

#### 1.3 Tests de Network/Async
- **Problema:** Tests de `AgentSuggestionsViewer` con errores de red simulados
- **Impacto:** Tests inestables, falsos fallos
- **Solución:** Mejorar mocks de servicios de red

### 2. **Conflictos de Dependencias**

#### 2.1 Peer Dependencies
- **Problema:** Conflictos entre `@types/react`, `@testing-library/react-hooks`
- **Impacto:** Instalación de dependencias requiere `--legacy-peer-deps`
- **Solución:** Actualizar dependencias a versiones compatibles

#### 2.2 Dependencias Obsoletas
- **Problema:** `@testing-library/react-hooks@8.0.1` (obsoleto)
- **Impacto:** Warnings, posibles incompatibilidades
- **Solución:** Migrar a `@testing-library/react` hooks

#### 2.3 Vulnerabilidades de dependencias de desarrollo (pendiente de actualización)
- **Problema:** Existen vulnerabilidades moderadas en dependencias de desarrollo (`brace-expansion`, `esbuild`, `vite`, `vitest`, `@vitest/coverage-c8`).
- **Impacto:** No afecta producción, pero puede afectar seguridad en entornos de desarrollo y CI/CD.
- **Motivo:** No se puede aplicar el fix automático por conflicto de versiones entre `vitest` y `@vitest/coverage-c8`.
- **Acción recomendada:** Planificar actualización de todas las dependencias de testing en un sprint de mantenimiento. Revisar breaking changes y ajustar configuración de tests si es necesario.
- **Estado:** Documentado, pendiente de resolución.

---

## ⚠️ PROBLEMAS MEDIOS (PRIORIDAD MEDIA)

### 3. **Configuración de Testing**

#### 3.1 Vitest vs Jest
- **Problema:** Mezcla de configuraciones Vitest/Jest
- **Archivos:** `config/jest.config.cjs`, `config/vitest.config.ts`
- **Impacto:** Confusión, configuración duplicada
- **Solución:** Migración completa a Vitest

#### 3.2 Setup de Tests
- **Problema:** `src/setupTests.ts` con configuración mixta
- **Impacto:** Tests inconsistentes
- **Solución:** Configuración unificada para Vitest

### 4. **Mocks y Stubs**

#### 4.1 Mocks de Supabase
- **Problema:** Mocks inconsistentes tras migración a Firebase
- **Impacto:** Tests que dependen de Supabase fallan
- **Solución:** Actualizar mocks para Firebase o eliminar dependencias

#### 4.2 Mocks de Servicios
- **Problema:** Mocks de servicios de red inestables
- **Impacto:** Tests flaky
- **Solución:** Implementar mocks robustos con MSW

---

## 🔧 PROBLEMAS BAJOS (PRIORIDAD BAJA)

### 5. **Linting y Formateo**

#### 5.1 ESLint Warnings
- **Problema:** Variables no usadas, imports innecesarios
- **Impacto:** Ruido en logs, código no limpio
- **Solución:** Limpieza automática con `--fix`

#### 5.2 TypeScript Strict Mode
- **Problema:** Configuración TypeScript no estricta
- **Impacto:** Posibles errores en runtime
- **Solución:** Habilitar `strict: true`

### 6. **Documentación**

#### 6.1 Tests Sin Documentar
- **Problema:** Tests sin comentarios explicativos
- **Impacto:** Mantenimiento difícil
- **Solución:** Documentar casos de prueba

---

## 📊 MÉTRICAS DE DEUDA TÉCNICA

### Tests
- **Total de archivos de test:** 48
- **Tests que fallan:** 3 (resueltos)
- **Tests skipped:** 15
- **Cobertura estimada:** 60-70%

### Dependencias
- **Dependencias con conflictos:** 3
- **Dependencias obsoletas:** 2
- **Dependencias con vulnerabilidades:** 5

### Configuración
- **Archivos de configuración duplicados:** 2
- **Configuraciones mixtas:** 3

---

## 🎯 PLAN DE ACCIÓN PRIORITARIO

### Sprint 1: Tests y CI/CD (1 semana)
1. **Resolver tests de React Router**
   - Actualizar configuración para v7
   - Eliminar warnings

2. **Migración completa a Vitest**
   - Eliminar configuración Jest
   - Unificar setup de tests

3. **Mejorar mocks**
   - Implementar MSW para servicios
   - Actualizar mocks de Firebase

### Sprint 2: Dependencias y Configuración (1 semana)
1. **Actualizar dependencias**
   - Resolver conflictos de peer dependencies
   - Eliminar dependencias obsoletas

2. **Configuración TypeScript**
   - Habilitar modo estricto
   - Corregir tipos

3. **Linting y formateo**
   - Configurar auto-fix
   - Limpiar warnings

### Sprint 3: Documentación y Optimización (1 semana)
1. **Documentar tests**
   - Comentarios explicativos
   - Casos de prueba documentados

2. **Optimización**
   - Revisar performance de tests
   - Optimizar configuración

---

## 💰 COSTO ESTIMADO

### Tiempo de desarrollo
- **Sprint 1:** 40 horas
- **Sprint 2:** 32 horas
- **Sprint 3:** 24 horas
- **Total:** 96 horas (2.5 semanas)

### Recursos necesarios
- **Desarrollador Senior:** 1
- **QA:** 0.5 (para validación)
- **DevOps:** 0.25 (para CI/CD)

### ROI esperado
- **Reducción de bugs:** 40%
- **Velocidad de desarrollo:** +25%
- **Estabilidad de CI/CD:** 95%

---

## 🚀 RECOMENDACIONES INMEDIATAS

### Para el equipo de desarrollo:
1. **No agregar nuevas features** hasta resolver deuda crítica
2. **Implementar tests obligatorios** para nuevas funcionalidades
3. **Revisar PRs** con foco en calidad de tests

### Para el CTO:
1. **Asignar sprint dedicado** a deuda técnica
2. **Establecer métricas** de calidad de código
3. **Implementar gates** de calidad en CI/CD

### Para el Product Owner:
1. **Priorizar estabilidad** sobre nuevas features
2. **Aceptar impacto** en velocidad temporal
3. **Planificar roadmap** considerando deuda técnica

---

## 📈 MÉTRICAS DE SEGUIMIENTO

### KPIs a monitorear:
- **Tests passing:** 100%
- **Cobertura de tests:** >80%
- **Tiempo de CI/CD:** <10 minutos
- **Vulnerabilidades:** 0 críticas
- **Warnings:** <5

### Herramientas recomendadas:
- **SonarQube** para análisis de código
- **Codecov** para cobertura
- **Dependabot** para actualizaciones automáticas

---

## 📝 NOTAS ADICIONALES

### Contexto del proyecto:
- **Migración reciente** de Supabase a Firebase
- **Cambios de configuración** de Jest a Vitest
- **Actualizaciones de React Router** pendientes

### Riesgos identificados:
- **Regresión** en funcionalidad existente
- **Tiempo de inactividad** durante refactoring
- **Incompatibilidades** con dependencias externas

### Oportunidades:
- **Mejora significativa** en estabilidad
- **Base sólida** para escalabilidad
- **Reducción de bugs** en producción

---

**Documento generado:** Julio 2025  
**Responsable:** CTO  
**Revisión:** Mensual  
**Próxima actualización:** Agosto 2025 

---

## 📢 PROPUESTA DE EQUILIBRIO TÉCNICO PARA EL CTO (JULIO 2025)

### 1. Diagnóstico del Estado Actual
- El pipeline clínico real (MVP) está conformado por los módulos MCP, RAGMedicalMCP, NLPServiceOllama, AgentExecutor y ClinicalAgent.
- Existen archivos legacy, rails antiguos, mocks y componentes de analytics/UX avanzada que no son críticos para el MVP.
- Hay tests skipped o vacíos en componentes secundarios, pero la cobertura del core es buena.

### 2. Recomendaciones de Organización y Priorización

#### **Prioridad MVP (debe estar cubierto y probado):**
- MCPContextBuilder y RAGMedicalMCP (core y chunking)
- NLPServiceOllama (integración básica con RAG)
- AgentExecutor y ClinicalAgent (sugerencias clínicas)
- Pipeline end-to-end: Audio → STT → NLP → RAG → Agentes → Output
- Tests de integración y evals principales (no dejar skipped los del core)

#### **Dejar para Post-MVP:**
- Componentes de analytics avanzados y feedback forms
- Tests de hooks personalizados y reporting granular
- Optimización de prompts y A/B testing de NLP
- Benchmarks académicos y comparativas con otros LLMs
- Expansión de la base de conocimiento RAG (más allá de PubMed)
- UI avanzada para evidencia y métricas de uso

### 3. Acciones Sugeridas
- Documentar explícitamente en la deuda técnica los archivos y tests que son core del pipeline y deben mantenerse/expandirse, y los que pueden diferirse a post-MVP (marcar con TODO o // POST-MVP).
- Crear un board de issues/tickets: un ticket por cada gap de test o feature diferida, con etiquetas `MVP`, `Post-MVP`, `Testing`, `Refactor`, `Cleanup`.
- Planificar un sprint de estabilización post-MVP para revisar archivos huérfanos, completar tests skipped/vacíos del core y mejorar cobertura de edge cases.

### 4. Tabla de Estado de Archivos Core y Testing

| Archivo/Componente                        | ¿En pipeline real? | ¿Tiene test? | ¿Crítico MVP? | ¿Dejar post-MVP? |
|-------------------------------------------|:------------------:|:------------:|:-------------:|:----------------:|
| `src/core/mcp/MCPContextBuilder.ts`       |        ✅          |      ✅      |      ✅       |        ❌        |
| `src/core/mcp/RAGMedicalMCP.ts`           |        ✅          |      ⚠️      |      ✅       |        ❌        |
| `src/services/nlpServiceOllama.ts`        |        ✅          |      ⚠️      |      ✅       |        ❌        |
| `src/core/agent/AgentExecutor.ts`         |        ✅          |      ✅      |      ✅       |        ❌        |
| `src/core/agent/ClinicalAgent.ts`         |        ✅          |      ✅      |      ✅       |        ❌        |
| `src/components/evidence/EvidencePanel.tsx`|       ✅          |      ❌      |      ⚠️      |        ❌        |
| `src/core/mcp/debugMCP.ts`                |        ⚠️         |      ❌      |      ⚠️      |        ✅        |
| `src/shared/components/Agent/__tests__/future_evals/` | ❌ | ⚠️ (skipped) | ❌ | ✅ |
| Otros rails, mocks legacy, analytics      |        ❌          |      ❌      |      ❌       |        ✅        |

### 5. Conclusión
- Enfocarse en mantener y testear el pipeline core (MCP, RAG, NLP, agentes) para el MVP.
- Todo lo que sea analytics, reporting avanzado, feedback forms, hooks personalizados y UI secundaria puede diferirse a post-MVP.
- Marcar en el código y en la deuda técnica lo que es post-MVP para evitar confusión.
- Revisar y eliminar archivos huérfanos tras el MVP para mantener la base limpia.

**Esta propuesta busca maximizar la estabilidad y calidad del MVP, permitiendo iterar rápido y con bajo riesgo, y dejando espacio para innovación y mejoras en la siguiente fase.** 