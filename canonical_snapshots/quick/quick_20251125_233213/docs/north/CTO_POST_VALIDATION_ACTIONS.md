# 🎯 **ACCIONES POST-VALIDACIÓN CTO**

Guía de qué hacer después de completar la validación del Sprint 1.

---

## **📊 ESCENARIO 1: TODOS LOS TESTS PASAN (6/6)** 🟩

### **✅ ACCIONES INMEDIATAS:**

1. **Marcar Sprint 1 como VALIDADO:**
   ```bash
   # Actualizar estado en documentación
   echo "✅ Sprint 1 VALIDADO - $(date)" >> docs/north/SPRINT_STATUS.md
   ```

2. **Generar orden para Sprint 2:**
   - Crear `docs/north/SPRINT_2_ORDER.md`
   - Incluir tareas priorizadas
   - Estimar tiempo (6-8 horas)

3. **Notificar al implementador:**
   - Sprint 1 completado y validado
   - Sprint 2 listo para iniciar
   - Prioridades y timeline

4. **Actualizar documentación:**
   - Guardar reporte de validación
   - Actualizar estado del proyecto
   - Documentar decisiones tomadas

---

## **📊 ESCENARIO 2: ALGUNOS TESTS FALLAN** 🟥

### **❌ ACCIONES INMEDIATAS:**

1. **Generar orden de HOTFIX:**
   - Crear `docs/north/HOTFIX_SPRINT_1.md`
   - Listar tests que fallan
   - Priorizar por criticidad
   - Estimar tiempo de corrección

2. **Documentar problemas encontrados:**
   - Usar `CTO_VALIDATION_REPORT_TEMPLATE.md`
   - Incluir screenshots si es posible
   - Incluir logs de consola/servidor
   - Incluir pasos para reproducir

3. **Notificar al implementador:**
   - Sprint 1 requiere correcciones
   - Lista de problemas encontrados
   - Prioridades y timeline
   - NO iniciar Sprint 2 hasta que se resuelvan

4. **Preparar debugging:**
   - Usar `CTO_DEBUGGING_COMMANDS.md`
   - Verificar logs del servidor
   - Verificar consola del navegador
   - Verificar Firestore si aplica

---

## **📋 TEMPLATE DE ORDEN SPRINT 2**

```markdown
# 📋 SPRINT 2 ORDER – [TÍTULO]

**Prioridad:** ALTA / MEDIA / BAJA  
**Tiempo estimado:** 6-8 horas  
**Fecha inicio:** _______________  
**Fecha fin esperada:** _______________

## 🎯 OBJETIVOS

1. [Objetivo 1]
2. [Objetivo 2]
3. [Objetivo 3]

## 📌 TAREAS

### P1. [Tarea crítica]
- **Problema:** [Descripción]
- **Orden:** [Instrucciones]
- **DoD:** [Criterios]
- **Tests:** [Requisitos]

### P2. [Tarea alta]
- ...

## 🧪 REQUISITOS DE TESTING

- [ ] Unit tests
- [ ] Integration tests
- [ ] Snapshot tests
- [ ] E2E tests (si aplica)

## ✅ DEFINITION OF DONE

- [ ] Todas las tareas completadas
- [ ] Todos los tests pasan
- [ ] Sin errores de linter
- [ ] Documentación actualizada
- [ ] Listo para validación CTO

## 🚫 ZONA PROTEGIDA

- Audio pipeline core
- Recorder UI
- HTTPS + certificado
- Mobile Harness
```

---

## **📋 TEMPLATE DE ORDEN HOTFIX**

```markdown
# 🔥 HOTFIX ORDER – SPRINT 1

**Prioridad:** CRÍTICA  
**Tiempo estimado:** 2-4 horas  
**Fecha inicio:** _______________  
**Fecha fin esperada:** _______________

## 🚨 PROBLEMAS ENCONTRADOS

### Test 1: [Nombre del test]
- **Estado:** ❌ FALLA
- **Problema:** [Descripción detallada]
- **Pasos para reproducir:**
  1. ...
  2. ...
  3. ...
- **Comportamiento esperado:** ...
- **Comportamiento actual:** ...
- **Logs:** [si aplica]

### Test 2: [Nombre del test]
- ...

## 🔧 CORRECCIONES REQUERIDAS

### Fix 1: [Título]
- **Archivo:** `src/...`
- **Cambio:** [Descripción]
- **DoD:** [Criterios]

### Fix 2: [Título]
- ...

## 🧪 TESTS DE VERIFICACIÓN

- [ ] Test 1 pasa después de fix
- [ ] Test 2 pasa después de fix
- [ ] Sin regresiones en otros tests

## ✅ DEFINITION OF DONE

- [ ] Todos los problemas corregidos
- [ ] Todos los tests pasan
- [ ] Validación CTO exitosa
- [ ] Listo para Sprint 2
```

---

## **📝 CHECKLIST POST-VALIDACIÓN**

### **Si todos pasan:**
- [ ] Marcar Sprint 1 como VALIDADO
- [ ] Generar orden Sprint 2
- [ ] Notificar al implementador
- [ ] Actualizar documentación
- [ ] Guardar reporte de validación

### **Si alguno falla:**
- [ ] Documentar problemas encontrados
- [ ] Generar orden HOTFIX
- [ ] Priorizar por criticidad
- [ ] Notificar al implementador
- [ ] Preparar debugging
- [ ] NO iniciar Sprint 2

---

## **📧 TEMPLATE DE MENSAJE AL IMPLEMENTADOR**

### **Si todos pasan:**
```
✅ Sprint 1 VALIDADO

Todos los tests pasaron exitosamente en iPhone real.
Sprint 2 listo para iniciar.

Ver: docs/north/SPRINT_2_ORDER.md
```

### **Si alguno falla:**
```
❌ Sprint 1 REQUIERE HOTFIX

Se encontraron problemas durante la validación en iPhone.
Sprint 2 NO se iniciará hasta que se resuelvan.

Tests que fallan:
- Test 1: [Nombre]
- Test 2: [Nombre]

Ver: docs/north/HOTFIX_SPRINT_1.md
```

---

## **📊 MÉTRICAS DE VALIDACIÓN**

### **Registrar:**
- Tiempo total de validación: ___ minutos
- Tests que pasan: ___/6
- Tests que fallan: ___/6
- Severidad de problemas: ⬜ CRÍTICA / ⬜ ALTA / ⬜ MEDIA / ⬜ BAJA

### **Documentar:**
- Dispositivo usado: iPhone [Modelo]
- iOS version: ___
- Safari version: ___
- Fecha y hora: ___

---

**Última actualización:** _______________

