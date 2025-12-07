# WO-FS-RULES-01 — Desbloquear flujo clínico mínimo en UAT (Firestore rules + índices)

**Estado:** 🟡 EN PROGRESO

**Fecha:** 2025-12-07

**Owner:** Equipo Implementador (backend / infra)

---

## Contexto

Entorno: `aiduxcare-v2-uat-dev`  

Rama: `piloto-ca-dec2025`  

Repo: `~/Dev/AIDUXCARE-V.2`

El frontend carga, pero el flujo clínico se rompe al intentar crear/asegurar un episodio inicial:

- Errores `Missing or insufficient permissions` en Firestore.

- Solicitud de creación de nuevos índices al leer/escribir episodios y sesiones.

- Analytics falla por reglas demasiado restrictivas.

Necesitamos relajar de forma controlada las reglas de Firestore en **UAT** para permitir que un fisioterapeuta:

1. Seleccione paciente

2. Inicie un *initial assessment*

3. Genere SOAP

4. Guarde sesión / episodio

5. Actualice métricas mínimas de analytics

sin errores de permisos.

## Objetivo

Dejar el entorno UAT en un estado donde:

- Cualquier usuario autenticado (fisioterapeuta del piloto) pueda completar el flujo clínico mínimo.

- Firestore no devuelva errores de permisos ni de índices para:

  - `/professionals/{id}`

  - `/patients/{id}`

  - `/episodes/{id}`

  - `/sessions/{id}`

  - `/analytics/{id}` (o colección equivalente)

- Los índices mínimos requeridos estén creados y desplegados.

## Alcance

Incluye:

- Actualización de `firestore.rules` para entorno UAT.

- Actualización/creación de `firestore.indexes.json` según errores de Firestore.

- Despliegue a `aiduxcare-v2-uat-dev` usando Firebase CLI.

- Smoke test del flujo clínico inicial end-to-end en UAT.

No incluye (queda como deuda posterior):

- Hardening fino de reglas por rol/owner/clinic.

- Multi-tenant isolation a nivel producción.

- Encriptación adicional o cambios de modelo de datos.

## Tareas

1. Validar que estamos en el repo y rama correctos:

   ```bash
   cd ~/Dev/AIDUXCARE-V.2

   ./scripts/git-sanity-check.sh
   ```

2. Localizar y revisar:

   - `firestore.rules`

   - `firestore.indexes.json`

3. Implementar reglas "UAT relajadas" que:

   - Requieran `request.auth != null`.

   - Permitan leer/escribir en las colecciones implicadas en el flujo clínico.

4. Aplicar y desplegar:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes --project aiduxcare-v2-uat-dev
   ```

5. Ejecutar flujo clínico mínimo en el frontend (UAT):

   - Login como fisioterapeuta

   - Seleccionar paciente

   - Crear initial assessment

   - Generar SOAP

   - Guardar sesión/episodio

6. Documentar:

   - Capturas de pantalla de:

     - Flujo completado

     - Últimos errores (si los hay) con timestamp.

   - Nota en este WO con:

     - Fecha de despliegue

     - Commit SHA

     - Resumen de cambios funcionales.

## Definition of Done (DoD)

- [ ] `firebase deploy --only firestore:rules,firestore:indexes` exitoso en `aiduxcare-v2-uat-dev`.

- [ ] Un fisioterapeuta autenticado puede:

  - [ ] Seleccionar paciente

  - [ ] Crear initial assessment

  - [ ] Generar SOAP

  - [ ] Guardar sesión y episodio

- [ ] No hay errores `Missing or insufficient permissions` en consola del browser durante el flujo.

- [ ] No aparecen nuevas sugerencias de índices al completar el flujo.

- [ ] Este WO referenciado en el commit (`feat/firestore: unlock UAT clinical flow (WO-FS-RULES-01)`).

---

**Última actualización:** 2025-12-07

