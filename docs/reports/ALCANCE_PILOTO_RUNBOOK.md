# Alcance del piloto y runbook básico — AiDuxCare V2

**Objetivo:** Alcance de piloto por escrito (qué sí, qué no, duración, criterios de éxito) y runbook básico (rollback, contacto si algo falla).

---

## 1. Alcance del piloto

### 1.1 Qué está incluido en el piloto

- **Flujo clínico:** Consentimiento (verbal/digital) → Workflow profesional (Initial Assessment o Follow-up) → Captura de notas clínicas (SOAP) → Guardado en Clinical Vault (consultations + encounters).
- **Modelo de sesiones:** Session 1 (Initial), Session 2, 3… (Follow-ups); comparación con sesión anterior (Session Comparison).
- **Historial del paciente:** Consultations y encounters por paciente; visitType (initial/follow-up) correcto en Patient History.
- **Billing (base técnica):** Clasificación de encounters (WSIB/MVA/PRIVATE/UNKNOWN) y export para auditoría; sin facturación real ni integraciones externas de billing.
- **Seguridad y cumplimiento:** Cifrado en reposo, control de acceso por autor, consent gate, alineación PHIPA/PIPEDA (ver `docs/reports/RESUMEN_CONSENT_DATOS_PHIPA.md`).

### 1.2 Qué no está incluido en el piloto

- Facturación real (emisión de facturas, integración con sistemas de pago o aseguradoras).
- Migraciones de datos desde otros sistemas.
- Cambios de reglas Firestore o de schema sin WO aprobado.
- Funcionalidades experimentales no documentadas en este alcance.

### 1.3 Duración sugerida

- A definir con el socio piloto (ej. Niagara). Típicamente 4–8 semanas de uso activo con criterios de éxito revisables a mitad de periodo.

### 1.4 Criterios de éxito (ejemplo)

- Consentimiento obtenido y registrado antes del flujo clínico en el 100% de las sesiones piloto.
- SOAP finalizado y guardado correctamente (consultations + encounter creado) sin errores bloqueantes.
- Patient History muestra correctamente Initial vs Follow-up y número de sesión.
- Sin incidentes de acceso no autorizado a datos; sin exposición de datos de salud en logs o UI de error.

---

## 2. Runbook básico (si algo falla)

### 2.1 Rollback de deploy

- **Hosting (Firebase):** En Firebase Console → Hosting → Historial de versiones, seleccionar la versión anterior y “Rollback” si está disponible. Alternativa: volver a desplegar el commit anterior (`git checkout <commit-anterior>`, luego `npm run build && npm run deploy:staging`).
- **Functions:** En Firebase Console → Functions, revisar versión desplegada; si es necesario, desplegar desde el commit anterior (mismo flujo que arriba con `firebase deploy --only functions`).
- **No se hace rollback de datos de Firestore** desde este runbook; solo de código/despliegue.

### 2.2 Incidente: la app no carga o errores en cadena

1. Comprobar estado de Firebase (Status page o consola).
2. Comprobar que las variables de entorno del entorno piloto (UAT) son las correctas (ver `DEPLOY.md`).
3. Revisar logs del navegador (consola) y, si aplica, logs de Cloud Functions.
4. Si el fallo se debe a un deploy reciente, ejecutar rollback (sección 2.1).

### 2.3 Incidente: consentimiento o guardado de SOAP falla

1. Verificar que el usuario está autenticado y que Firestore rules e índices están desplegados (ver `INFORME_PHIPA_PIPEDA_COMPLIANCE.md`).
2. Revisar errores en consola y en Network (llamadas a Firestore/Functions).
3. Si el problema es persistente, escalar a responsable técnico (ver contacto más abajo) y documentar pasos para reproducir.

### 2.4 Incidente: pilot.aiduxcare.com no carga (VPS + túnel)

Si el piloto se sirve desde un VPS con Cloudflare Tunnel (ver paso a paso en referencias):

1. Seguir el **runbook de estabilidad**: `docs/reports/PILOTO_CTO_ESTABILIDAD.md` — sección "Runbook: pilot.aiduxcare.com no carga".
2. Resumen: SSH al VPS → `pm2 list` → `pm2 restart pilot-web` / `pm2 restart pilot-tunnel` → revisar logs → comprobar `curl localhost:5174`.
3. Documentar el incidente (fecha, síntomas, pasos, cierre).

### 2.5 Contacto si algo falla

- **Responsable técnico / escalación:** A definir internamente (nombre, rol, email o canal). Incluir aquí cuando esté definido:
  - Ejemplo: `[Nombre] — [Rol] — [email o Slack]`
- **Documentar:** Para cada incidente, anotar fecha, descripción breve, pasos de mitigación y cierre.

---

## 3. Referencias

- **CTO — Estabilidad del piloto (sin desconexiones evitables):** `docs/reports/PILOTO_CTO_ESTABILIDAD.md` — compromisos, PM2, monitoreo y runbook cuando pilot.aiduxcare.com no carga.
- **Piloto en VPS (paso a paso con chequeos):** `docs/reports/PILOTO_VPS_PASO_A_PASO.md` — mover app + túnel a un servidor siempre encendido para mayor estabilidad.
- Deploy y envs: `DEPLOY.md`
- Consent y datos (PHIPA): `docs/reports/RESUMEN_CONSENT_DATOS_PHIPA.md`
- Auditoría y prioridades: `docs/reports/AUDITORIA_PILOTO_MEJORAS.md`, `docs/reports/INFORME_CTO_PRIORIDADES_PILOTO_NIAGARA.md`
