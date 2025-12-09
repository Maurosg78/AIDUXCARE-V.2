# 📊 QA Checklist - Piloto CA-DEC2025

**Versión:** 1.0  
**Fecha:** Diciembre 2025  
**Para:** Testers (Fisioterapeutas) y Equipo Técnico

---

## 🎯 Cómo usar este checklist

Este documento puede ser usado por:
- **Fisioterapeutas:** Como guía paso a paso para probar el sistema
- **Equipo técnico:** Como checklist de validación antes del piloto
- **QA:** Como base para casos de prueba

**Instrucciones:**
- Marca ✅ si el paso funciona correctamente
- Marca ❌ si hay un error o problema
- Marca ⚠️ si funciona pero con limitaciones
- Anota comentarios en la sección de notas

---

## Escenario 1 – Initial Assessment

### Paso 1: Crear paciente

- [ ] Acceder a la aplicación UAT
- [ ] Iniciar sesión con credenciales de prueba
- [ ] Navegar a "Pacientes" o "Patients"
- [ ] Hacer clic en "Nuevo Paciente" / "New Patient"
- [ ] Completar formulario mínimo:
  - [ ] Nombre
  - [ ] Fecha de nacimiento
  - [ ] Número de teléfono
- [ ] Guardar paciente
- [ ] Verificar que paciente aparece en la lista

**Notas:** _________________________________________________

---

### Paso 2: Crear episodio

- [ ] Abrir paciente creado
- [ ] Hacer clic en "Nuevo Episodio" / "New Episode"
- [ ] Completar información básica del episodio
- [ ] Guardar episodio
- [ ] Verificar que episodio aparece en la lista del paciente

**Notas:** _________________________________________________

---

### Paso 3: Iniciar Initial Assessment

- [ ] Abrir episodio creado
- [ ] Hacer clic en "Initial Assessment" / "Evaluación Inicial"
- [ ] Verificar que se abre la interfaz de grabación/transcripción

**Notas:** _________________________________________________

---

### Paso 4: Grabar / escribir motivo de consulta

- [ ] Opción A: Grabar audio
  - [ ] Hacer clic en "Grabar" / "Record"
  - [ ] Hablar motivo de consulta (ejemplo: "Paciente de 45 años con dolor lumbar de 3 semanas")
  - [ ] Detener grabación
  - [ ] Verificar que audio se transcribe correctamente

- [ ] Opción B: Escribir texto
  - [ ] Escribir motivo de consulta directamente
  - [ ] Verificar que texto se guarda correctamente

**Notas:** _________________________________________________

---

### Paso 5: Generar nota AI

- [ ] Hacer clic en "Generar Nota" / "Generate Note"
- [ ] Esperar procesamiento (puede tardar 10-30 segundos)
- [ ] Verificar que aparece nota generada con estructura SOAP:
  - [ ] **S**ubjective (subjetivo)
  - [ ] **O**bjective (objetivo)
  - [ ] **A**ssessment (evaluación)
  - [ ] **P**lan (plan)

**Notas:** _________________________________________________

---

### Paso 6: Revisar y editar nota

- [ ] Leer nota generada completamente
- [ ] Verificar que información es clínicamente relevante
- [ ] Editar secciones si es necesario
- [ ] Verificar que cambios se guardan correctamente

**Notas:** _________________________________________________

---

### Paso 7: Guardar y firmar

- [ ] Hacer clic en "Guardar" / "Save"
- [ ] Verificar que nota se guarda como "draft" o "signed"
- [ ] Verificar que nota aparece en el historial del episodio
- [ ] Verificar que ETP (plan de tratamiento) se genera correctamente

**Notas:** _________________________________________________

---

## Escenario 2 – Follow-up

### Paso 1: Abrir episodio existente

- [ ] Acceder a paciente con episodio previo
- [ ] Abrir episodio que tiene ETP (plan de tratamiento) previo
- [ ] Verificar que ETP previo es visible

**Notas:** _________________________________________________

---

### Paso 2: Añadir follow-up

- [ ] Hacer clic en "Follow-up" / "Seguimiento"
- [ ] Verificar que se abre interfaz de follow-up
- [ ] Grabar o escribir progreso del paciente:
  - [ ] Mejora en síntomas
  - [ ] Adherencia al plan
  - [ ] Nuevos síntomas o preocupaciones

**Notas:** _________________________________________________

---

### Paso 3: Generar nota de follow-up

- [ ] Hacer clic en "Generar Nota" / "Generate Note"
- [ ] Esperar procesamiento
- [ ] Verificar que nota generada:
  - [ ] Hace referencia al ETP previo
  - [ ] Documenta progreso vs. baseline
  - [ ] Respeta objetivos del plan previo
  - [ ] **NO** propone nuevos tests físicos (solo en initial)

**Notas:** _________________________________________________

---

### Paso 4: Verificar continuidad clínica

- [ ] Leer nota de follow-up completamente
- [ ] Verificar que menciona objetivos del ETP previo
- [ ] Verificar que documenta progreso correctamente
- [ ] Verificar que sugiere ajustes al plan si es necesario

**Notas:** _________________________________________________

---

## Escenario 3 – Imaging Report

### Paso 1: Subir PDF MRI lumbar

- [ ] Abrir episodio (initial o follow-up)
- [ ] Navegar a sección "Imaging Reports" / "Informes de Imagen"
- [ ] Hacer clic en "Subir PDF" / "Upload PDF"
- [ ] Seleccionar archivo PDF de MRI lumbar
- [ ] Verificar que archivo se sube correctamente
- [ ] Verificar que aparece mensaje "Procesando..." / "Processing..."

**Notas:** _________________________________________________

---

### Paso 2: Verificar procesamiento

- [ ] Esperar 30-60 segundos para procesamiento
- [ ] Verificar que aparece resumen del informe:
  - [ ] Texto extraído visible (o indicador de éxito)
  - [ ] Resumen clínico corto generado
  - [ ] Campos inferidos:
    - [ ] Modality: "MRI"
    - [ ] Body Region: "Lumbar spine"
    - [ ] Lateralidad (si aplica)
    - [ ] Año del estudio (si aplica)

**Notas:** _________________________________________________

---

### Paso 3: Verificar uso en nota AI

- [ ] Generar nueva nota (initial o follow-up) después de subir PDF
- [ ] Verificar que nota AI menciona información del informe de imagen
- [ ] Verificar que contexto de imagen se usa correctamente
- [ ] Verificar que no hay información inventada

**Notas:** _________________________________________________

---

### Paso 4: Verificar estabilidad

- [ ] Verificar que no hay errores 500
- [ ] Verificar que sistema no se queda "pensando infinito"
- [ ] Verificar que PDF se puede abrir y ver
- [ ] Verificar que resumen es clínicamente relevante

**Notas:** _________________________________________________

---

## 🚨 Problemas Comunes y Soluciones

### Problema: "Nota AI no se genera"
- **Solución:** Verificar conexión a internet
- **Solución:** Esperar 30 segundos más
- **Solución:** Verificar que transcript no está vacío

### Problema: "PDF no se procesa"
- **Solución:** Verificar que PDF tiene texto extraíble (no es escaneado)
- **Solución:** Esperar más tiempo (puede tardar hasta 2 minutos)
- **Solución:** Verificar que archivo es PDF válido

### Problema: "Sistema se queda cargando"
- **Solución:** Refrescar página
- **Solución:** Verificar logs en consola del navegador
- **Solución:** Contactar soporte técnico

---

## 📝 Feedback General

**¿Qué funcionó bien?**
_________________________________________________

**¿Qué no funcionó?**
_________________________________________________

**¿Qué mejoras sugerirías?**
_________________________________________________

**¿Usarías esto en tu práctica diaria?**
- [ ] Sí
- [ ] No
- [ ] Con mejoras

**Comentarios adicionales:**
_________________________________________________

---

**Última actualización:** 2025-12-07  
**Versión:** 1.0  
**Estado:** ✅ Listo para distribución a testers

