# WO-PILOT-UAT-01 — Preparar entorno para 10 fisios del piloto

**Estado:** 🟡 EN PROGRESO

**Fecha:** 2025-12-07

**Owner:** Equipo Implementador (backend / ops)

---

## Contexto

Entorno: `aiduxcare-v2-uat-dev`  

Rama: `piloto-ca-dec2025`  

Repo: `~/Dev/AIDUXCARE-V.2`

Con WO-FS-RULES-01 completado, el entorno UAT ya no tiene bloqueos técnicos de Firestore. El siguiente paso es preparar el entorno **operativo** para que 10 fisioterapeutas puedan comenzar a usar el sistema sin fricciones.

## Objetivo

Dejar UAT listo para entregar a 10 fisios **sin tener que tocar nada técnico más** cuando se sienten a probar. Esto incluye:

- Cuentas de profesional creadas y verificadas
- Pacientes demo disponibles
- Documentación clara para primera sesión
- Proceso de onboarding básico

## Alcance

Incluye:

- Crear/verificar 10 cuentas de profesional (emails, nombres, clinics)
- Crear 5–10 pacientes demo por cuenta (o compartidos)
- Configurar texto breve de onboarding dentro del flujo
- Documentar "happy path" tipo checklist para el fisio
- Crear guía "1ª sesión con Aidux" para los fisios
- Establecer registro de feedback (tabla simple)

No incluye:

- Hardening de seguridad adicional
- Multi-tenant isolation completo
- Sistema de tickets/helpdesk
- Integraciones con sistemas externos

## Tareas

### 1. Crear/verificar cuentas de profesional

**Objetivo:** 10 cuentas de fisioterapeuta listas para usar.

**Pasos:**

1. Listar emails de los 10 fisios del piloto

2. Para cada fisio:

   ```bash
   # Usar script de creación de usuarios o Firebase Console
   # Verificar que cada usuario tiene:
   # - Email verificado
   # - Rol: professional/clinician
   # - Profile completo en /users/{userId}
   ```

3. Documentar en tabla:

   | Email | Nombre | Clinic | UserId | Estado |
   |-------|--------|--------|--------|--------|
   | ...   | ...    | ...    | ...    | ...    |

### 2. Crear pacientes demo

**Objetivo:** 5–10 pacientes demo disponibles para cada fisio (o compartidos entre todos).

**Pasos:**

1. Crear pacientes demo con datos realistas pero anonimizados

2. Asignar `ownerUid` a cada fisio (o compartir entre todos)

3. Verificar que cada paciente tiene:

   - Datos básicos (nombre, DOB, etc.)
   - Consentimientos básicos si aplica
   - Al menos 1 episodio inicial para algunos pacientes

4. Documentar lista de pacientes demo

### 3. Configurar onboarding básico

**Objetivo:** Texto breve de bienvenida/onboarding dentro del flujo.

**Pasos:**

1. Identificar punto de entrada del onboarding (ej: primera vez que abre Command Centre)

2. Crear mensaje breve (2–3 frases) tipo:

   > "Bienvenido a AiDux. Esta es tu primera sesión. Sigue estos pasos: [link a guía]"

3. Implementar (hardcoded por ahora está bien)

### 4. Documentar "happy path" para el fisio

**Objetivo:** Checklist simple de qué hacer en primera sesión.

**Contenido sugerido:**

- [ ] Login con email/password
- [ ] Ver Command Centre
- [ ] Seleccionar paciente (o crear uno nuevo)
- [ ] Iniciar Initial Assessment
- [ ] Completar campos mínimos
- [ ] Generar SOAP
- [ ] Revisar SOAP generado
- [ ] Guardar sesión
- [ ] Verificar que se guardó correctamente

### 5. Crear guía "1ª sesión con Aidux"

**Objetivo:** PDF/Google Doc de 1 página para entregar a los fisios.

**Formato:** Documento práctico, tono directo, paso a paso.

**Contenido:**

- Título: "Tu primera sesión con AiDux"
- Subtítulo: "Guía rápida para fisioterapeutas del piloto"
- Pasos numerados (1–8)
- Screenshots o descripciones claras
- Contacto de soporte si hay problemas

### 6. Establecer registro de feedback

**Objetivo:** Tabla simple para capturar feedback de los fisios.

**Formato sugerido:**

| Fecha | Fisio | Tipo | Descripción | Prioridad | Estado |
|-------|-------|------|-------------|-----------|--------|
| ...   | ...   | ...  | ...         | ...       | ...    |

**Tipos:** Bug, Feature Request, UX Issue, Otro

**Prioridad:** P0 (bloqueante), P1 (importante), P2 (mejora)

## Definition of Done (DoD)

- [ ] 10 cuentas de profesional creadas y verificadas

- [ ] 5–10 pacientes demo disponibles (mínimo 50 pacientes total)

- [ ] Onboarding básico implementado (mensaje de bienvenida)

- [ ] "Happy path" documentado como checklist

- [ ] Guía "1ª sesión con Aidux" creada (PDF/Google Doc)

- [ ] Registro de feedback establecido (tabla/documento)

- [ ] Todos los entregables documentados en este WO

- [ ] Commit realizado: `feat(pilot): prepare UAT environment for 10 physios (WO-PILOT-UAT-01)`

---

**Última actualización:** 2025-12-07

