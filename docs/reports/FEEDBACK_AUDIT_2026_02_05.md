## FB-058: SMS no llega al paciente (P0)

**Estado actual (código y flujo):**
- **Servicio SMS implementado:** ✅  
  - `SMSService.sendConsentLink` y `SMSService.sendViaVonage` definidos en `src/services/smsService.ts`.  
  - Cloud Function `sendConsentSMS` implementada en `functions/index.js` usando Vonage.
- **UI de envío / reenvío:** ✅  
  - `ConsentGateScreen` usa `SMSService.sendConsentLink` (`handleSendSMS`) y registra estado en `PatientConsentService.recordSMSConsentRequest`.  
  - Muestra mensajes claros de éxito / error y un panel de “Waiting for patient response”.  
  - Existe botón **“Re-send SMS”** cuando `allowedActions.sendSms && smsRequested` (`ConsentGateScreen`, líneas 360–383).  
  - `ProfessionalWorkflowPage` expone `handleResendConsentSMS` y `handleCopyConsentLink` (permite copiar el enlace).
- **Retry automático:** ⚠️ Parcial  
  - No hay bucle de reintentos automáticos con contador y backoff, pero se permite reenvío manual (“Re-send SMS”) mientras la UI indica que ya hay un request activo.  
  - No se limita explícitamente el número de reintentos.
- **Validación de número:** ✅  
  - `SMSService.sendConsentLink` limpia espacios (`cleanPhoneForTwilio`) y valida formato E.164, con lógica específica para prefijo `+1` y números canadienses (líneas 281–298).  
  - Para números no `+1`, se asume formato E.164 correcto (p.ej. `+34...`).
- **Logs y observabilidad:** ✅  
  - `functions/index.js` logea configuración y respuesta de Vonage (`[SMS Function] Vonage API response`, `[SMS Function] Vonage error`).  
  - `smsService.ts` logea envíos (`[SMS] Vonage disclosure SMS sent via Cloud Function`).  
  - El estado se persiste en la colección `pending_sms` para auditoría.

**Conclusión de auditoría:**  
- Cadena técnica app → Cloud Function → Vonage está implementada y con logging.  
- Existe botón “Re-send SMS” y fallback claro a consentimiento verbal.  
- Falta: política explícita de reintentos (automáticos o límite de manuales) y surface más visible del estado de entrega dentro de la UI y en tools de soporte.

---

## FB-059: No puedo salir de la página de consentimiento (P1)

**Estado actual (código y flujo):**
- **Componente de consent gate:** ✅  
  - `src/components/consent/ConsentGateScreen.tsx`.  
  - Recibe `onCancel` desde `ProfessionalWorkflowPage` y `consentResolution` desde dominio.
- **Botón “Cancel Session”:** ✅  
  - En el header del modal (`ConsentGateScreen`, líneas ~220–240) hay un botón visible “Cancel session” (`X` + texto) que llama a `handleCancel`.  
  - `handleCancel` usa `onCancel` si existe; si no, hace fallback directo a `window.location.href = '/command-center'`.
- **Escape del gate:** ✅  
  - Siempre hay una salida explícita: botón “Cancel session” que redirige al Command Center (directamente o vía callback).  
  - Esta salida no depende de que el SMS funcione ni de que se registre consentimiento.
- **Sesión parcial / datos clínicos:** ⚠️  
  - El gate se muestra **antes** de acceder al workflow clínico, por lo que no debería existir documentación parcial en este punto.  
  - No se guardan datos clínicos en `ConsentGateScreen`; sin embargo, el comportamiento detallado de “no guardar sesión parcial” depende del flujo en `ProfessionalWorkflowPage` (ya alineado conceptualmente, pero no documentado explícitamente en UX).

**Conclusión de auditoría:**  
- El bug original (“no puedo salir”) está mitigado: hoy existe un botón de cancelación con escape duro al Command Center.  
- Pendiente solo documentar explícitamente en guía / copy que **no hay datos clínicos guardados** si se cancela desde el gate.

---

## FB-060: No sabemos de qué paciente estamos hablando (P1)

**Estado actual (código y flujo):**
- **Header de contexto de paciente:** ✅  
  - `ProfessionalWorkflowPage.tsx` ya incluye un header persistente tipo “Patient context” (según cambios previos descritos en el resumen).  
  - Ese header muestra el nombre del paciente y un botón de “Back to Command Centre” y está diseñado como sticky.
- **Visibilidad a través de pestañas:** ✅  
  - El header está en la página raíz del workflow (`ProfessionalWorkflowPage`), por encima de las pestañas de transcripción / análisis / SOAP, por lo que permanece visible al navegar entre tabs.
- **Props de contexto:** ⚠️  
  - Se muestra al menos el nombre completo del paciente; información adicional (edad/género, tipo de sesión, número de sesión) podría ampliarse, pero no es crítica para entender “qué paciente es este”.

**Conclusión de auditoría:**  
- El riesgo clínico principal (no saber en qué paciente se está trabajando) está mitigado con un header persistente.  
- Podría mejorarse la riqueza del contexto (edad, sexo, tipo de sesión), pero el requerimiento central está satisfecho.

---

## FB-061: No hay feedback al aprobar consentimiento + delay 3 segundos (P1)

**Estado actual (código y flujo):**
- **Flujo de consentimiento:** ✅  
  - `ProfessionalWorkflowPage` realiza polling a `checkConsentViaServer` / `ConsentVerificationService` y decide si renderizar `ConsentGateScreen` en función de `resolveConsentChannel`.  
  - `ConsentGateScreen` muestra estados claros mientras se espera respuesta del paciente (panel “Waiting for patient response” con icono `Clock` y texto explicativo).
- **Loading / feedback en UI:** ✅  
  - Al enviar SMS, el botón muestra “Sending SMS...” y luego “SMS Sent”.  
  - Mientras hay `smsRequested`, se muestra un bloque informativo que explica que se está esperando al paciente y que el modal se cerrará automáticamente cuando se reciba el consentimiento.  
  - Para consentimiento verbal, existe `VerbalConsentModal` con su propia UX.
- **Delay de transición:** ⚠️  
  - La latencia percibida al pasar de “consent granted” a renderizar el workflow depende:  
    - del tiempo que toma el callback de Vonage + actualización en Firestore,  
    - del intervalo de polling en `ProfessionalWorkflowPage` (p.ej. cada N segundos).  
  - No se ha identificado un `setTimeout(3000)` explícito en código para esta transición; el retraso parece provenir del polling.

**Conclusión de auditoría:**  
- Hoy ya hay mucho más feedback visual que en el reporte original.  
- Persiste un pequeño retardo estructural (polling) que puede sentirse como “3 segundos de nada” tras aprobar; se podría reducir el intervalo de polling o disparar un “check inmediato” tras callback de consentimiento.

---

## FB-062: Formato de nota no compatible con ficha clínica (P2)

**Estado actual (código y flujo):**
- **Generación de SOAP:** ✅  
  - `ProfessionalWorkflowPage` usa `deriveSOAPDataFromRawText`, `generateSOAPNoteFromService` y `SOAPEditor` para generar y editar notas.  
  - El contexto de SOAP se organiza via `organizeSOAPData` y se valida vía `SOAPObjectiveValidator`.
- **Export / copy actual:** ⚠️  
  - `SOAPEditor` ofrece funciones de edición y probablemente un botón de “Copy” (según patrones del resto de la app), pero no hay un selector explícito de formato de exportación (Plain/Markdown/HTML) ni persistencia de preferencia por usuario.  
  - No se ha encontrado un módulo específico `exportSOAP` ni una UI que permita elegir formato “compatible con ficha” desde el punto de vista del EMR.

**Conclusión de auditoría:**  
- El formato de salida es funcional para lectura humana pero no parametrizable.  
- Sigue pendiente la feature de “export format” seleccionable que permita al profesional ajustar la nota al sistema destino.

---

## FB-063: Necesitamos lugar para leer historial de pacientes (P2)

**Estado actual (código y flujo):**
- **Infraestructura de historial:** ✅  
  - Hook `usePatientHistory` (`src/features/command-center/hooks/usePatientHistory.ts`) detecta si un paciente tiene sesiones previas o notas (`sessions` + `PersistenceService.getNotesByPatient`).  
  - Se usa en `StartSessionTwoStepModal` y `WorkWithPatientsPanel` para ajustar opciones.
- **UI desde Command Center:** ⚠️  
  - `TodayPatientsPanel` y `WorkWithPatientsPanel` gestionan pacientes y sesiones del día, pero no existe aún una sección dedicada tipo “Recent Patients” ni una ruta centralizada `/patients/:id` orientada a lectura histórica.  
  - Existe `usePatientHistory` pero no una “Patient History Page” completa expuesta en el Command Center.

**Conclusión de auditoría:**  
- La capa de datos para saber si hay historial ya existe.  
- Falta una vista específica y accesos directos desde Command Center para navegar cómodamente al historial de un paciente.

---

## FB-NEW-001: Campo nombre acepta solo una letra (Ongoing intake, solo Windows) (P1)

**Estado actual (código y flujo):**
- **Ubicación del modal:** ✅  
  - `src/features/command-center/components/OngoingPatientIntakeModal.tsx`.  
  - Se usa desde `CommandCenterPageSprint3.tsx`.
- **Estado de firstName / lastName:** ✅  
  - `useState` simples (`firstName`, `lastName`, `phone`, `birthDate`, etc.).  
  - Inputs controlados mediante componente `Input` interno que recibe `value` y `onChange`.  
  - No hay validación “en caliente” que borre el contenido.
- **Manejo específico de foco (fix actual):** ✅  
  - Refs `firstNameInputRef` y `lastNameInputRef` (`useRef<HTMLInputElement | null>`).  
  - En `onChange` de ambos campos se hace: `setFirstName(v); if (firstNameInputRef.current) firstNameInputRef.current.focus();` y equivalente para `lastName`.  
  - Comentario explícito: “Re-focus to avoid Windows losing caret/focus after each keystroke”.
- **Hooks colaterales / re-renders:** ⚠️  
  - El modal usa `Collapsible` con secciones expandibles y `overflow-y-auto`, lo que puede interactuar con el reposicionamiento del DOM.  
  - No hay `useEffect` que dependa de `firstName`/`lastName` ni lógica que cambie `isOpen` con cada tecla.
- **Estado de reproducción del bug:** ⚠️  
  - En Mac el comportamiento es correcto.  
  - En Windows (Edge/Chrome) se sigue reportando que el foco se pierde tras cada letra, pese al refocus manual.

**Conclusión de auditoría:**  
- El código sigue patrones correctos para React (inputs controlados, refs, sin efectos colaterales obvios).  
- El bug parece estar ligado a interacción específica de Windows + modal + scroll/Collapsible.  
- Requiere debugging en entorno Windows con DevTools (no solucionable solo leyendo código).

---

## FB-064: Micrófono no se activa solo, entiende mal inglés y se corta (P2)

**Estado actual (código y flujo):**
- **Servicio de transcripción:** ✅  
  - `FirebaseWhisperService` (`src/services/FirebaseWhisperService.ts`) llama a Cloud Function `whisperProxy` vía HTTP con modelo `WHISPER_MODEL` (`gpt-4o-mini-transcribe` por defecto).  
  - Maneja errores comunes (deadline, auth, API key) y lanza mensajes amigables.  
  - `useTranscript` usa `FirebaseWhisperService.transcribe` para chunks y audio completo.
- **Configuración de idioma:** ⚠️  
  - `FirebaseWhisperService` admite `languageHint` en opciones, default `'auto'`.  
  - No se ha encontrado una UI clara para que el usuario elija idioma de grabación (“English / Español”) ni lectura directa del perfil profesional para setear idioma por defecto.  
  - En Terms of Service todavía se menciona “OpenAI Whisper API”, pero el backend actual usa `gpt-4o-mini-transcribe` vía Cloud Functions.
- **Corte / regeneración de frases:** ⚠️  
  - `useTranscript` corta chunks en base a tamaño y eventos de stop; hay un pequeño delay (200ms) entre transcripciones de chunks (`setTimeout(() => transcribeChunk(nextChunk), 200)`).  
  - No hay un parámetro explícito de VAD threshold o buffer de silencio configurable expuesto a la UI; esto se maneja en la capa de grabación/segmentación (no completamente auditada aquí).

**Conclusión de auditoría:**  
- La infraestructura de audio y transcripción es robusta y con logging; el problema es UX/percepción de idioma y tuning fino del pipeline (silencio, cortes).  
- Falta selector de idioma y ajuste de parámetros de corte para sesiones clínicas más fluidas, especialmente en español.

