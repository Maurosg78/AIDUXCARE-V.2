# Plan de Implementación - Feedbacks Pendientes

**Fecha:** 05 de febrero de 2026  
**Auditoría completada:** ✅ (`docs/reports/FEEDBACK_AUDIT_2026_02_05.md`)

---

## Resumen de estado tras auditoría

- **FB-058 – SMS no llega (P0):**  
  - Cadena técnica app → Cloud Function → Vonage implementada y con logging.  
  - Existe botón **Re-send SMS** y fallback a consentimiento verbal.  
  - Falta política clara de reintentos y surface más visible del estado de entrega.

- **FB-059 – Consent gate sin escape (P1):**  
  - `ConsentGateScreen` ya incluye botón **“Cancel session”** con escape duro al Command Center.  
  - Bug original mitigado; pendiente solo documentar comportamiento y asegurar que no se guardan datos clínicos previos al gate.

- **FB-060 – Paciente invisible (P1):**  
  - Header persistente de contexto de paciente ya existe en `ProfessionalWorkflowPage`.  
  - Riesgo clínico principal mitigado; se puede enriquecer con edad/género/tipo de sesión.

- **FB-061 – Falta feedback al aprobar consentimiento (P1):**  
  - Mucho mejor feedback visual actual (mensajes de “SMS sent”, panel de “Waiting for patient response”).  
  - El “delay de ~3 segundos” viene del polling + latencia externa; se puede reducir con un “check inmediato” y ajustes de polling.

- **FB-062 – Formato de nota SOAP no alineado con ficha (P2):**  
  - Generación/edición de SOAP sólida, pero sin selector de formato de export ni preferencias por usuario.

- **FB-063 – Lugar para leer historial de pacientes (P2):**  
  - `usePatientHistory` ya existe y sabe si hay sesiones/notas previas.  
  - Falta una vista de “Patient History” y accesos desde Command Center.

- **FB-NEW-001 – Campo nombre solo una letra (Windows, Ongoing intake, P1):**  
  - Código sigue buenas prácticas (inputs controlados, refs, sin efectos colaterales obvios).  
  - Bug persiste solo en Windows; requiere debugging con DevTools y/o VM Windows.

- **FB-064 – Micrófono, idioma y cortes (P2):**  
  - Audio pipeline con `FirebaseWhisperService` y `useTranscript` ya operativo.  
  - Falta selector de idioma y tuning fino de corte por silencio / feedback visual de VAD.

---

## Semana 1: Crítico + UX de consentimiento y contexto paciente

Objetivo: Dejar **consentimiento** y **contexto de paciente** en estado “pilot-stable” y avanzar investigación en bug Windows.

### 1. FB-058 – SMS no llega (P0) → WO-CONSENT-UX-SMS

- **Tareas:**
  - [ ] Enriquecer UI en `ConsentGateScreen` y `ProfessionalWorkflowPage`:
    - [ ] Mostrar estado de SMS con más detalle (teléfono destino, mensaje de ayuda si no llega).  
    - [ ] Exponer de forma prominente el botón **“Copy consent link”** ya existente (`handleCopyConsentLink`) como fallback.  
    - [ ] Mapear errores comunes de Vonage/Twilio a mensajes entendibles (“operador rechazó el número”, “configuración SMS no disponible”, etc.).
  - [ ] Definir política de reintentos:
    - [ ] Límite de reenvíos (p.ej. 2–3) con contador visible “Attempt 2/3”.  
    - [ ] Si se alcanza el límite o hay errores repetidos → recomendar explícitamente cambiar a consentimiento verbal.
  - [ ] Registrar estado ampliado en `pending_sms`:
    - [ ] Campos como `lastProviderStatus`, `lastErrorCode`, `lastAttemptAt`, para debugging futuro y reportes.

- **Estimación:** 0.5–1 día  
- **Dependencias:** Ninguna fuerte; usa infra existente.  
- **Salida esperada:**  
  - Menos incertidumbre “no me llega el SMS”.  
  - Fisio siempre sabe qué hacer: reintentar o pasar a verbal con soporte de UI.

---

### 2. FB-059 – Consent gate sin escape (P1) → WO-CONSENT-UX-GATE

- **Tareas:**
  - [ ] Confirmar que `onCancel` en `ProfessionalWorkflowPage` siempre redirige al Command Center sin guardar datos clínicos.  
  - [ ] Ajustar textos del gate para dejar claro que:
    - [ ] “Cancelling” antes del consentimiento **no guarda documentación clínica** de la sesión actual.  
    - [ ] Esto se alinea con el modelo de privacidad y con la Clinical User Guide.
  - [ ] Actualizar `AIDUXCARE_OFFICIAL_USER_GUIDE.md`:
    - [ ] Añadir sección breve sobre “Consent gate: cómo salir sin guardar nada”.

- **Estimación:** 0.25 día  
- **Dependencias:** Ninguna.  
- **Salida esperada:**  
  - Bug original considerado **resuelto** y documentado, sin ambigüedad para usuarios ni CTO.

---

### 3. FB-060 – Paciente invisible (P1) → WO-UX-01-CONTEXTO

- **Tareas:**
  - [ ] Revisar `ProfessionalWorkflowPage` para asegurar que el header de paciente:
    - [ ] Es `sticky` y visible en todas las pestañas.  
    - [ ] Muestra al menos: nombre completo, tipo de sesión (Initial / Follow-up / Ongoing), y estado (ej. “Today’s session”).  
  - [ ] (Opcional) Añadir edad / género cuando se disponga de datos fiables sin exponer PHI innecesaria.
  - [ ] Actualizar copia de la UI para dejar claro qué paciente está activo y desde qué contexto se inició la sesión (Command Center vs otra ruta).

- **Estimación:** 0.5 día  
- **Dependencias:** WO-UX-01 existente (diseño de Command Center).  
- **Salida esperada:**  
  - Contexto de paciente siempre claro para el fisioterapeuta.  
  - Feedback FB-060 puede marcarse como resuelto una vez verificado en pilot.

---

### 4. FB-061 – Feedback al aprobar consentimiento + delay (P1) → WO-CONSENT-UX-FEEDBACK

- **Tareas:**
  - [ ] Reducir sensación de “3 segundos de vacío”:
    - [ ] Tras registrar consentimiento (digital o verbal), disparar un `checkConsentViaServer` inmediato en vez de esperar solo al próximo ciclo de polling.  
    - [ ] Mostrar un mini estado de transición: “Consent recorded, preparing workflow…” mientras se desmonta el gate y se monta el workflow.
  - [ ] Revisar intervalo de polling:
    - [ ] Ajustar a un valor que balancee latencia percibida y carga (p.ej. 1–2s).  
    - [ ] Logear claramente cuánto tarda el cambio de `workflowConsentStatus` en el frontend.

- **Estimación:** 0.25 día  
- **Dependencias:** WO-CONSENT-SINGLE-SOURCE ya implementado.  
- **Salida esperada:**  
  - Transición suave y rápida desde aprobación de consentimiento al inicio del workflow.

---

### 5. FB-NEW-001 – Bug Windows Ongoing intake (P1) → WO-ONGOING-WINDOWS-DEBUG

- **Tareas (investigación + fix):**
  - [ ] Setup de entorno de prueba:
    - [ ] VM Windows 10/11 con Edge y Chrome.  
    - [ ] Acceso a `pilot.aiduxcare.com` con cuenta de prueba.
  - [ ] Sesión de debugging:
    - [ ] Grabar pantalla reproduciendo el bug en el modal `OngoingPatientIntakeModal`.  
    - [ ] En DevTools:
      - [ ] Inspeccionar `document.activeElement` tras cada pulsación.  
      - [ ] Revisar si el foco salta a `<body>`, al overlay, o a algún otro elemento.  
      - [ ] Ver si algún evento global (tecla, click, scroll) dispara re-render o pérdida de foco.
  - [ ] Identificar causa raíz:
    - [ ] Si es interacción con `Collapsible`/scroll: considerar fijar la sección “Patient record” o aislarla en un contenedor sin re-montaje.  
    - [ ] Si es tema de IME/teclado: manejar `compositionstart` / `compositionend` para no interferir con composición.  
    - [ ] Si es evento externo (accesibilidad, extensiones): documentar scope y diseñar mitigación razonable.
  - [ ] Implementar fix minimal:
    - [ ] Evitar refocusing manual en cada tecla si se descubre que agrava el problema en Windows.  
    - [ ] Posible solución: usar `onInput` + debounce, o solo refocus en eventos concretos (blur inesperado).

- **Estimación:** 1–2 días (incluye setup, debugging y fix).  
- **Dependencias:** Entorno Windows disponible.  
- **Salida esperada:**  
  - Bug reproducido, diagnosticado y corregido con evidencia (video + logs).  
  - Feedback FB-NEW-001 cerrado con explicación clara para CTO.

---

## Semana 2: Historial, formato de nota y audio

Objetivo: mejorar herramientas de lectura de historial, flexibilidad de export de notas y usabilidad de audio/dictado.

### 6. FB-063 – Historial de pacientes desde Command Center (P2) → WO-UX-01-HISTORY

- **Tareas:**
  - [ ] Diseñar y crear pantalla `PatientHistoryPage` (ej. `/patients/:patientId`):
    - [ ] Lista de sesiones y notas previas (usando servicios/colecciones existentes).  
    - [ ] Acciones: “View SOAP”, “Open in workflow” (solo lectura).  
    - [ ] Filtros por fecha y tipo de sesión (Initial / Follow-up / Ongoing).
  - [ ] En Command Center:
    - [ ] Añadir sección “Recent Patients” (últimos 5–10 pacientes vistos).  
    - [ ] Cada item debe navegar a `PatientHistoryPage`.
  - [ ] Integrar `usePatientHistory`:
    - [ ] Usar el hook para deshabilitar “Ongoing (first time in AiDuxCare)” cuando `hasHistory === true`.  
    - [ ] Mostrar tooltip con explicación (“This patient already has history; use Follow-up instead”).

- **Estimación:** 0.5–1 día  
- **Dependencias:** Servicios de sesiones/notas actuales.  
- **Salida esperada:**  
  - Acceso directo y fluido al historial de un paciente desde Command Center.

---

### 7. FB-062 – Formatos de export de nota SOAP (P2) → WO-SOAP-EXPORT

- **Tareas:**
  - [ ] Extender `SOAPEditor` con un subpanel “Export format”:
    - [ ] Opciones:  
      - Plain text (sin separadores visuales; solo texto estructurado S/O/A/P).  
      - Markdown (# SOAP, ## Subjective, etc.).  
      - (Opcional) HTML simple para pegar en EMR web.
  - [ ] Añadir botón “Copy to Clipboard” que utilice el formato seleccionado.  
  - [ ] Persistir preferencia por usuario:
    - [ ] Guardar `soapExportFormat` en el perfil del profesional.  
    - [ ] Cargarlo al inicializar `SOAPEditor`.
  - [ ] Alinear con la Clinical Guide:
    - [ ] Actualizar `AIDUXCARE_OFFICIAL_USER_GUIDE.md` con una tabla rápida de formatos y casos de uso.

- **Estimación:** 0.5 día  
- **Dependencias:** Servicios de perfil profesional (perfil normalizado).  
- **Salida esperada:**  
  - Profesionales pueden adaptar la nota al formato exacto de su ficha clínica.

---

### 8. FB-064 – Audio, idioma y cortes (P2) → WO-AUDIO-PIPELINE

- **Tareas:**
  - [ ] Selector de idioma en la UI de grabación:
    - [ ] Opción simple: “Recording language: [Auto, English, Español]”.  
    - [ ] Ligar valor por defecto al perfil del profesional (ej. `locale: en-CA` vs `es-CL`).
  - [ ] Ajuste de parámetros en `useTranscript` / pipeline:
    - [ ] Revisar lógica de corte de audio y silencios (delay entre chunks, tamaño mínimo del blob).  
    - [ ] Aumentar buffer de silencio antes de cortar (p.ej. de ~1s a 2–3s).  
    - [ ] Registrar métricas de duración de chunks y número de cortes por sesión.
  - [ ] Feedback visual de VAD:
    - [ ] Icono de micrófono que parpadea / cambia de color cuando detecta voz.  
    - [ ] Indicar cuándo está transcribiendo vs cuándo está “esperando voz”.

- **Estimación:** 1 día  
- **Dependencias:** `FirebaseWhisperService`, `useTranscript`, perfil profesional normalizado.  
- **Salida esperada:**  
  - Dictado más natural en español e inglés, con menos “frases cortadas” y más sensación de control para el usuario.

---

## Quick Wins (idealmente en paralelo durante Semana 1)

- [ ] Documentar explícitamente en `AIDUXCARE_OFFICIAL_USER_GUIDE.md`:
  - [ ] Comportamiento del Consent Gate (escape y no-guardado de datos).  
  - [ ] Fallback recomendado cuando SMS no llega (reintento + consentimiento verbal).  
  - [ ] Recordatorio de revisar contexto de paciente en el header antes de grabar.

- [ ] Ajustar pequeños textos en `ConsentGateScreen` y `ProfessionalWorkflowPage`:
  - [ ] Mensajes más claros para estados de SMS y transición post-consent.  

Estimación total quick wins: **< 0.5 día**.

---

## Vinculación con WOs existentes

- **WO-CONSENT-UX:**  
  - FB-058 (SMS no llega) – mejoras de observabilidad y fallback.  
  - FB-059 (escape del gate) – ya mitigado, requiere solo documentación/matiz.  
  - FB-061 (feedback de transición post-consent).

- **WO-UX-01:**  
  - FB-060 (contexto de paciente persistente).  
  - FB-063 (historial y navegación desde Command Center).

- **Perfil normalizado y audio:**  
  - FB-062 (formato de nota) – integración con preferencias de perfil.  
  - FB-064 (idioma y dictado) – usar idioma / país desde perfil profesional.

Con este plan, Semana 1 aborda todos los riesgos de consentimiento y contexto clínico; Semana 2 se centra en ergonomía diaria (historial, notas y audio) apoyándose en la infraestructura de perfil profesional ya diseñada.

