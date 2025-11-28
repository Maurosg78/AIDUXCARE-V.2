# PROPUESTA OFICIAL DE TRABAJO
## Operación Deuda Cero - Sprint 1: Tests y CI/CD

**Versión:** 1.0  
**Fecha:** Julio 2025  
**Autor:** Implementador Técnico (AI)  
**Aprobador:** CTO / CEO

---

## 🎯 **Objetivo Estratégico**

Estabilizar el MVP de AiDuxCare V.2 eliminando la deuda técnica crítica en el pipeline de testing y CI/CD, garantizando que la suite de tests sea robusta, reproducible y libre de warnings, especialmente los relacionados con React Router y configuración mixta de Jest/Vitest.

---

## 📚 **Fuente de la Verdad**
- Documento: `DEUDA_TECNICA_ACUMULADA.md`
- Roadmap único del proyecto

---

## 🛑 **Bloqueantes y Dependencias**
- **No se debe iniciar ningún desarrollo funcional nuevo** hasta que este sprint esté 100% completado y mergeado.
- **Dependencias:**
  - Todos los PRs abiertos que afecten archivos de testing/configuración deben resolverse antes de mergear este sprint.
  - Cualquier instrucción técnica futura del CTO debe quedar registrada como issue/epic y no ejecutarse hasta terminar este sprint.

---

## 🧩 **Elementos Críticos para un MVP Estable**

### 1. **Testing Unificado y Robusto**
- Toda la configuración de tests debe estar centralizada en `vitest.config.ts`.
- No debe existir ningún archivo de configuración de Jest ni dependencias relacionadas.
- Todos los tests deben ejecutarse con Vitest y pasar sin warnings ni skips innecesarios.

### 2. **Compatibilidad React Router v7**
- Todos los tests de componentes que usen React Router deben ser compatibles con la versión 7.
- No debe haber warnings en consola relacionados con rutas, hooks o providers de React Router.

### 3. **Mocks Estables y Modernos**
- Todos los mocks (especialmente de Firebase y servicios externos) deben implementarse usando `vi.spyOn` o técnicas equivalentes robustas.
- No debe haber mocks legacy, ni dependencias de Supabase en tests.

### 4. **Pipeline CI/CD Limpio**
- El pipeline debe ejecutar `npm run test` y pasar 100% de los tests sin warnings críticos.
- Debe existir evidencia (captura de pantalla) de la consola con los tests pasando y sin warnings de React Router.

---

## ✅ **Checklist Detallado de Ejecución**

### **Fase 1: Migración Completa a Vitest**
- [ ] Eliminar todos los archivos de configuración de Jest (`jest.config.cjs`, scripts, dependencias en `package.json`).
- [ ] Unificar toda la configuración de testing en `vitest.config.ts`.
- [ ] Revisar y actualizar scripts de NPM para que solo usen Vitest.

### **Fase 2: Resolución de Warnings de React Router**
- [ ] Identificar todos los tests que usan React Router.
- [ ] Actualizar imports, providers y mocks para compatibilidad total con React Router v7.
- [ ] Eliminar todos los warnings de consola relacionados con React Router en la ejecución de tests.

### **Fase 3: Refactorización de Mocks**
- [ ] Auditar todos los tests que mockean servicios externos (Firebase, analytics, etc.).
- [ ] Refactorizar mocks inestables usando `vi.spyOn` y técnicas modernas.
- [ ] Eliminar cualquier mock legacy o dependencias de Supabase en tests.

### **Fase 4: Validación y Evidencia**
- [ ] Ejecutar `npm run test` y asegurar 0 fallos y 0 warnings críticos.
- [ ] Tomar captura de pantalla de la consola con los tests pasando y sin warnings de React Router.
- [ ] Tomar capturas de pantalla de cualquier PR rechazado, bloqueado o con fallos relevantes durante el proceso (por políticas, CI/CD, revisiones, etc.).
- [ ] Adjuntar todas las capturas en la descripción del PR final como evidencia del proceso de estabilización y resolución de deuda técnica.
- [ ] Crear Pull Request desde la rama `sprint/TDP-1-test-stabilization` a `main` con descripción detallada y la evidencia adjunta.

---

## 🔗 **Dependencias y Secuencia Recomendada**

1. **Resolver PRs abiertos** que afecten archivos de tests/configuración.
2. **Eliminar configuración Jest y migrar a Vitest** (Fase 1).
3. **Actualizar tests de React Router** (Fase 2).
4. **Refactorizar mocks** (Fase 3).
5. **Validar, documentar y mergear** (Fase 4).

---

## 📝 **Notas y Justificación**
- Esta propuesta prioriza la estabilidad y reproducibilidad del MVP sobre cualquier feature nueva.
- Eliminar la deuda técnica en testing y CI/CD es condición necesaria para escalar el producto y reducir riesgos en producción.
- Todo lo que no sea core para este objetivo debe diferirse y documentarse como issue/epic para el roadmap futuro.

---

## 🚦 **Definition of Done (DoD)**
- Todos los puntos del checklist completados.
- Suite de tests ejecutándose sin fallos ni warnings críticos.
- Evidencia visual (captura de pantalla) adjunta en el PR.
- Capturas de pantalla de PRs rechazados, bloqueados o con fallos relevantes adjuntas en el PR final.
- Pull Request mergeado a `main`.

---

**Si este documento es aprobado, se integrará como fuente de verdad y se ejecutará la Operación Deuda Cero según lo aquí especificado.** 