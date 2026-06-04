# OpenAI Compliance CLI Audit — 2026-06-04

**Fecha de auditoría:** 2026-06-04
**Proyecto técnico:** `aiduxcare-v2-uat-dev`
**Alcance:** OpenAI API usada para transcripción de audio
**Método:** inspección read-only de código, metadatos GCP/Firebase, endpoints OpenAI y documentación oficial
**Datos clínicos usados:** ninguno. La prueba de transcripción utilizó un WAV sintético silencioso.

---

## 1. Resumen ejecutivo

La integración productiva de transcripción está operativa y usa:

```text
Browser
  -> FirebaseWhisperService
  -> Firebase Function whisperProxy
  -> https://api.openai.com/v1/audio/transcriptions
  -> gpt-4o-mini-transcribe
```

La clave productiva almacenada en Google Secret Manager fue validada sin imprimir
su valor. Permite listar modelos y transcribir audio sintético tanto mediante el
endpoint global como mediante `eu.api.openai.com`.

Esto demuestra capacidad técnica, pero no permite confirmar mediante CLI:

- la entidad legal que aceptó el OpenAI Services Agreement;
- la fecha o persona que aceptó el acuerdo;
- el estado contractual del DPA para la organización API;
- si Zero Data Retention (ZDR) o Modified Abuse Monitoring (MAM) están habilitados.

El runtime actual sigue usando el endpoint global. El acceso exitoso al endpoint
europeo no equivale por sí solo a confirmar ZDR/MAM ni residencia contractual.

---

## 2. Evidencia técnica confirmada

### 2.1 Firebase Function y secreto

| Control | Evidencia |
|---|---|
| Función | `whisperProxy` |
| Estado | `ACTIVE` |
| Región de función | `northamerica-northeast1` |
| Runtime | Node.js 20 |
| Última actualización observada | `2026-06-02T10:44:46.485692845Z` |
| Secreto referenciado | `OPENAI_API_KEY`, versión explícita `7` |
| Estado versión 7 | `enabled` |
| Valor del secreto impreso o archivado | No |

La versión local de `OPENAI_API_KEY` disponible en la terminal era un placeholder
inválido y no corresponde a la clave productiva usada por `whisperProxy`.

### 2.2 Pruebas OpenAI sin PHI

| Prueba | Resultado | Interpretación |
|---|---|---|
| `GET https://api.openai.com/v1/models` | HTTP 200 | Clave productiva válida |
| `POST https://api.openai.com/v1/audio/transcriptions` con WAV sintético | HTTP 200 | Endpoint global operativo |
| `GET https://eu.api.openai.com/v1/models` | HTTP 200 | Acceso técnico al dominio europeo |
| `POST https://eu.api.openai.com/v1/audio/transcriptions` con WAV sintético | HTTP 200 | Transcripción disponible técnicamente en dominio europeo |
| Administration API: projects | HTTP 403 | La clave no permite consultar proyectos administrativos |
| Administration API: audit logs | HTTP 401 | La clave no permite consultar audit logs administrativos |

Los headers de OpenAI confirmaron que la clave está asociada a una organización y
un proyecto. Los identificadores completos no se archivaron. El prefijo observado
de la organización fue `user-...`, por lo que debe confirmarse que la organización
API y la entidad contractual pertenecen correctamente a AiduxCare.

### 2.3 Ruta y modelo observados en código

| Elemento | Evidencia en repositorio |
|---|---|
| Endpoint activo del proxy | `functions/src/whisperProxy.js` -> `https://api.openai.com/v1/audio/transcriptions` |
| Modelo por defecto del proxy | `gpt-4o-mini-transcribe` |
| Servicio frontend canónico | `src/hooks/useTranscript.ts` -> `src/services/FirebaseWhisperService.ts` |
| Región del proxy frontend | `northamerica-northeast1` |
| Ruta directa adicional | `src/services/OpenAIWhisperService.ts` conserva una implementación directa configurable, pero no se observaron llamadas runtime activas fuera de experimental/quarantine/tests |

La ruta directa adicional es deuda latente. Debe retirarse o aislarse explícitamente
para evitar que una futura modificación reactive una vía que eluda el proxy y sus
controles.

---

## 3. Evidencia contractual y documental

### 3.1 Documentos oficiales archivados por hash

Los documentos no se copiaron al repositorio. Se descargaron temporalmente desde
fuentes oficiales de OpenAI y se registraron sus hashes SHA-256.

| Documento | Fuente oficial | SHA-256 observado |
|---|---|---|
| OpenAI Data Processing Addendum | `https://cdn.openai.com/pdf/openai-data-processing-addendum.pdf` | `42309abe1e586665980ff45a83c813f5d6117c6f4ee0cf28f6cecb56c8426393` |
| OpenAI Services Agreement | `https://cdn.openai.com/osa/openai-services-agreement.pdf` | `b93f17c5be5a4deadca42026195d361353619f49756ab74a7b356877cf7ab341` |
| OpenAI API data controls guide | `https://developers.openai.com/api/docs/guides/your-data` | `375cf3a30b0ae2d8eb905a03769a39723d83b9e94a40e8a59e26467893021009` |

El DPA observado declara que complementa y se incorpora al OpenAI Services
Agreement. Para clientes establecidos en el EEE o Suiza identifica a OpenAI
Ireland Ltd. como contraparte aplicable.

La guía oficial de controles de datos observada el 2026-06-04 declara:

- `/v1/audio/transcriptions`: no usado para entrenamiento, sin retención de abuse
  monitoring y sin application state por defecto;
- ZDR y MAM: sujetos a aprobación previa de OpenAI y requisitos adicionales;
- procesamiento regional europeo: requiere MAM o ZDR y usa `eu.api.openai.com`.

### 3.2 Límites de la evidencia

El DPA publicado y su incorporación contractual no demuestran por sí solos qué
entidad de AiduxCare aceptó el Services Agreement ni qué organización API queda
incluida. Esa evidencia debe obtenerse desde OpenAI, un Order Form, facturación,
correo de aceptación o confirmación escrita de soporte/sales.

---

## 4. Hallazgos y riesgos abiertos

| ID | Hallazgo | Riesgo | Acción requerida |
|---|---|---|---|
| OAI-001 | Entidad contractual y aceptación del Services Agreement no archivadas | No se puede demostrar alcance del DPA para AiduxCare | Obtener confirmación escrita de OpenAI y archivar evidencia |
| OAI-002 | Estado ZDR/MAM no consultable con la clave disponible | No se puede afirmar que el control esté habilitado | Solicitar confirmación a OpenAI support/sales |
| OAI-003 | Runtime usa `api.openai.com`, no `eu.api.openai.com` | No se puede afirmar routing/procesamiento regional europeo | Evaluar migración controlada después de confirmación contractual |
| OAI-004 | Organización observada con prefijo `user-...` | Posible organización personal en vez de entidad empresarial | Confirmar owner, entidad, billing y organización API |
| OAI-005 | Versiones 3–6 del secreto siguen habilitadas | Superficie de credenciales superior a la necesaria | Rotar y deshabilitar versiones antiguas tras validar rollback |
| OAI-006 | Existe servicio cliente directo sin llamadas runtime activas observadas | Posible bypass futuro del proxy canónico | Retirar o aislar explícitamente la ruta directa |
| OAI-007 | La clave productiva no tiene privilegios Admin | No permite auditar proyectos ni logs desde CLI | Crear proceso administrativo separado con mínimo privilegio |

---

## 5. Acciones externas pendientes

Enviar a OpenAI support/sales:

```text
We are building a healthcare workflow product in the EU/Spain and need
written confirmation of:

1. The contracting entity and applicability of the OpenAI Data Processing
   Addendum to our API organization/project.
2. The organization owner, customer legal entity, and scope covered by the
   applicable OpenAI Services Agreement.
3. Whether Zero Data Retention or Modified Abuse Monitoring is enabled for
   our API organization/project.
4. Whether use of eu.api.openai.com for /v1/audio/transcriptions guarantees
   European regional processing for our current organization/project.
5. Any additional agreement, approval, or sales-led plan required for
   identifiable clinical audio.
```

Archivar después:

- respuesta escrita de OpenAI;
- entidad legal y owner de la organización API;
- fecha y evidencia de aceptación contractual;
- estado ZDR/MAM;
- decisión aprobada sobre endpoint global frente a endpoint europeo;
- revisión legal/DPO de uso con audio clínico identificable.

---

## 6. Estado resultante

```text
OpenAI API key productiva: verificada y operativa.
Audio transcription global: verificada con audio sintético sin PHI.
Audio transcription EU: acceso técnico verificado con audio sintético sin PHI.
OpenAI DPA: incorporación contractual documentada; evidencia de entidad/aceptación pendiente.
ZDR/MAM: no confirmado.
Routing EU en AiDux: no configurado; runtime usa endpoint global.
Uso con PHI identificable: condicionado al cierre contractual, DPIA y decisión de routing.
```

---

*Documento interno de auditoría. No contiene datos de pacientes, secretos ni
identificadores completos de organización/proyecto.*
