# PLAN OFICIAL DE LIMPIEZA INICIAL DEL PROYECTO

**Versión:** 1.0  
**Fecha:** Julio 2025  
**Autor:** Implementador Técnico (AI)  
**Aprobador:** CEO / CTO

---

## 🎯 **Objetivo**
Realizar una limpieza exhaustiva del proyecto AiDuxCare V.2 para eliminar archivos, configuraciones y dependencias obsoletas, duplicadas o innecesarias, asegurando una base limpia y estable para el desarrollo futuro.

---

## 🧭 **Mantra de Trabajo**
**Crear → Testear → Aprobar → Integrar**
- Nada se da por sentado: todo cambio se valida con tests antes de integrarse.
- Solo lo que pasa los tests y es aprobado explícitamente se integra a la base oficial.

---

## 🧹 **Checklist de Limpieza**

### 1. Configuración y Dependencias
- [ ] Eliminar archivos de configuración de Jest (`jest.config.cjs`, etc.).
- [ ] Eliminar dependencias de Jest y Supabase de `package.json`.
- [ ] Revisar y limpiar dependencias no usadas en `package.json`.

### 2. Archivos y Scripts Legacy
- [ ] Eliminar mocks y servicios legacy (Supabase, etc.).
- [ ] Eliminar scripts duplicados, backups y archivos temporales.
- [ ] Limpiar archivos de test vacíos, skipped o no referenciados (excepto los core).
- [ ] Limpiar carpetas de logs, backups y archivos temporales.

### 3. Validación Post-Limpieza
- [ ] Ejecutar `npm install` y validar que no hay errores de dependencias.
- [ ] Ejecutar `npm run test` y asegurar que la suite core pasa sin fallos.
- [ ] Validar que la app arranca (`npm run dev` o `npm run build`).

### 4. Documentación y Aprobación
- [ ] Documentar todos los cambios de limpieza en un commit y PR específico.
- [ ] Adjuntar evidencia de tests pasando y app funcionando.
- [ ] Solicitar aprobación explícita antes de mergear la limpieza a la rama principal.

---

## 🚦 **Criterios de Aprobación**
- Todos los puntos del checklist completados.
- Evidencia visual de tests y app funcionando adjunta en el PR.
- Aprobación explícita del CEO/CTO antes de mergear.

---

## 📝 **Notas**
- No se eliminará ningún archivo crítico sin validación y evidencia de funcionamiento.
- Cada bloque de limpieza será testeado y documentado antes de integrarse.
- Si surge alguna duda o bloqueo, se tomará la mejor decisión posible a nivel enterprise tras 30 segundos sin respuesta del CEO.

---

**Este documento es la guía y registro oficial para la limpieza inicial del proyecto.** 