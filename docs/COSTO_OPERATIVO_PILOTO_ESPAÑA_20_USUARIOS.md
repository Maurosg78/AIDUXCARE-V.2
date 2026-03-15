# Costo operativo real – AiDuxCare piloto España (20 usuarios)

**Objetivo:** Estimar el costo mensual para un piloto de 20 usuarios activos en España y determinar si conviene implementar límites antes del lanzamiento.

**Fuentes:** Código y documentación del repo (revisión directa).

---

## 1. VERTEX AI

### 1.1 Llamadas por sesión clínica completa

Una sesión clínica típica (desde análisis inicial hasta SOAP final) hace **entre 2 y 5+ llamadas** a Vertex, según flujo:

| Flujo | Llamadas | Origen |
|-------|----------|--------|
| **Sesión inicial (Initial Assessment)** | **2** | 1× Análisis clínico (Niagara) + 1× Generación SOAP |
| **Sesión follow-up (flujo principal)** | **2** | 1× Generación SOAP follow-up + 1× Consideraciones clínicas (follow-up) |
| **Sesión follow-up con análisis previo** | **3** | 1× Niagara + 1× SOAP + 1× Consideraciones |
| **Regenerar SOAP** | **+1** por cada regeneración | `generateSOAPNote` / `generateFollowUpSOAPV2Raw` |
| **Asistente virtual (opcional)** | **+1** por pregunta | `VirtualAssistant` → mismo proxy |
| **OCR imagen adjunta** | **+1** por imagen | `FileProcessorService` → `action: 'image-ocr'` |

**Resumen conservador por sesión completa (sin regenerar, sin asistente, sin OCR):**  
- **Initial:** 2 llamadas (Niagara + SOAP).  
- **Follow-up:** 2 llamadas (SOAP follow-up + consideraciones).

Si se asume **~60% follow-up y ~40% initial** y algo de regeneración/uso de asistente, un **promedio de 2,5–3 llamadas por sesión** es razonable para el cálculo.

### 1.2 Modelo en uso

- **En producción (Cloud Function):** Todas las llamadas al proxy usan **un único modelo** definido en `functions/index.js`:
  - `MODEL = 'gemini-2.5-flash'`
  - El cliente puede enviar `model: 'gemini-2.0-flash-exp'` en el body; **el proxy lo ignora** y siempre usa `ENDPOINT` con `gemini-2.5-flash`.
- **Referencias en código:**  
  - `src/config/env.ts`: `AIDUX_ASSISTANT_MODEL` / `ENV_CONFIG.ai.vertexAI.model` = `gemini-2.5-flash`.  
  - `ModelSelector.ts` menciona `gemini-1.5-flash` y `gemini-1.5-pro` y costes por 1K tokens; **no se usa en el flujo actual** (el flujo va directo al proxy con un solo modelo).

### 1.3 Tamaño aproximado de prompts (tokens por llamada)

- **Proxy (`vertexAIProxy`):**  
  - `generationConfig`: `maxOutputTokens: 16384`, `response_mime_type: 'application/json'`.  
  - Entrada: el texto enviado en `prompt` / `transcript` / `text` (sin límite en el proxy; en cliente Niagara se recorta transcript a **6.000 caracteres**).
- **Estimación por tipo de llamada:**

| Llamada | Input (aprox.) | Output (aprox.) | Notas |
|---------|----------------|-----------------|--------|
| Niagara (análisis clínico) | 1.500–4.000 tokens | 500–2.000 tokens | Transcript recortado 6k chars + prompt sistema |
| SOAP inicial | 2.000–5.000 tokens | 800–2.500 tokens | Transcript + contexto + examen físico + plantilla |
| SOAP follow-up | 1.500–4.000 tokens | 600–2.000 tokens | Prompt v3 más acotado en algunos flujos |
| Consideraciones follow-up | 500–1.500 tokens | 200–800 tokens | Contexto resumido |
| Image OCR | Imagen + ~50 tokens | 100–1.000 tokens | `maxOutputTokens: 8192` en función |

Para **cálculo mensual** se puede usar por sesión (2–3 llamadas):  
- **Input medio:** ~3.000 tokens por llamada.  
- **Output medio:** ~1.200 tokens por llamada.

### 1.4 Documentos de costes previos en docs/

- **`docs/firebase-email-costs-reply-to.md`** – Solo costes de **email (Firebase Auth)**; no Vertex.
- **`docs/METRICAS_PILOTO_ONTARIO.md`** y **`docs/METRICAS_BUSINESS_PLAN.md`** – Métricas de uso, productividad y negocio; **no** incluyen precios Vertex ni desglose de coste por token.
- **No hay** en el repo un documento previo que estime costes de Vertex ni de GCP para el piloto.

---

## 2. FIREBASE

### 2.1 Servicios Firebase utilizados

| Servicio | Uso en el código |
|----------|-------------------|
| **Auth** | Login, registro, verificación email, persistencia (IndexedDB/local). |
| **Firestore** | Sesiones, notas, encuentros (encounters), pacientes, perfiles profesionales, consentimientos, analytics, feedback, pilot waitlist, etc. |
| **Storage** | Adjuntos clínicos (subida de archivos en workflow). |
| **Functions** | `vertexAIProxy`, `processWithVertexAI`, `sendConsentSMS` (y otras); región `northamerica-northeast1`. |
| **Analytics** | Inicializado si `VITE_FIREBASE_MEASUREMENT_ID` está configurado (producción). |

No se usa Hosting desde este repo para el front (el front se sirve donde esté desplegado; Firebase Hosting es opcional).

### 2.2 Lecturas/escrituras Firestore por sesión clínica completa

Estimación por **una sesión de principio a fin** (crear sesión → análisis → SOAP → guardar nota/encounter):

**Escrituras (aproximadas):**

- 1× crear/actualizar sesión (`sessions`: `createSessionWithId` / `updateSession`).
- 1× guardar nota (`notes` vía `PersistenceService.saveSOAPNote` o equivalente).
- 1× crear/actualizar encounter (`encounters` vía `encountersRepo` al finalizar).
- Posibles: tratamiento (`treatment_plans`), consentimiento, métricas (`workflow_metrics`, `system_analytics`), feedback.

**Total escrituras por sesión:** del orden de **3–8** (según si se guarda plan, consent, analytics, etc.).

**Lecturas (aproximadas):**

- Sesión: 1+ (getSession por id, listado por usuario).
- Paciente y perfil profesional: varias (patient, professional profile, today list).
- Encuentros previos / baseline: 1–3 queries (p. ej. último encuentro, baseline SOAP).
- Listas (citas, pendientes, etc.): 1–5 según pantallas cargadas.

**Total lecturas por sesión:** del orden de **10–30** (conservador: **~15–20**).

### 2.3 Plan Firebase (Spark vs Blaze)

- El **plan (Spark o Blaze)** se configura en **Firebase Console**, no en el código.
- **Spark (gratuito):**  
  - Cuotas limitadas (p. ej. Firestore 50k lecturas/día, 20k escrituras/día; Functions con límites).  
  - Si el piloto supera esas cuotas, hace falta **Blaze (pago por uso)**.
- **Blaze** es necesario si:  
  - Quieres usar Vertex desde Cloud Functions sin restricciones de red saliente, o  
  - Superas los límites gratuitos de Firestore/Storage/Functions.

Para **20 usuarios activos** con ~20–40 sesiones/día en total, las lecturas/escrituras anteriores pueden acercarse o superar los límites gratuitos de Firestore; conviene revisar en Console y prever **Blaze** si el uso crece.

---

## 3. OTROS SERVICIOS

### 3.1 Proxy intermedio para Vertex – ¿Dónde corre?

- **Sí hay proxy:** Toda la llamada a Vertex desde el front pasa por **Firebase Cloud Functions** (no hay Cloud Run ni otro servicio intermedio en el repo).
- **Función:** `vertexAIProxy` en `functions/index.js`, región **`northamerica-northeast1`** (Montreal).
- **URL:** `https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy`.
- El front llama a esta URL con `action: 'analyze'` o `action: 'image-ocr'`; la función usa **Google Auth** y llama a Vertex AI en la misma región (`ENDPOINT` con `LOCATION = northamerica-northeast1`).

**Nota:** Para un piloto en **España** (datos en UE), si hubiera requisitos de residencia de datos, habría que valorar región/legal aparte; el diseño actual es Canadá (PHIPA).

### 3.2 Otros servicios externos con costo

- **Vonage (Nexmo):** SMS para consentimiento (`sendConsentSMS` en Functions). Coste por SMS enviado (según contrato Vonage).
- **Firebase Auth:** Emails de verificación; dentro de límites generosos son gratuitos (ver `docs/firebase-email-costs-reply-to.md`).
- No aparecen en el repo: **Cloudflare**, **Sentry** ni otros proveedores de pago configurados en el código base.

---

## 4. LÍMITES ACTUALES

### 4.1 Rate limiting / quota por usuario

- **Vertex (cliente):**  
  - **`docs/architecture/VERTEX_RATE_LIMITING.md`:**  
    - Backoff exponencial (0s → 2s → 5s) en `useNiagaraProcessor` ante 429.  
    - Cooldown de **8 segundos** por sesión para no repetir clic y saturar Vertex.  
    - Transcript recortado a **6.000 caracteres** antes de enviar (en `vertex-ai-service-firebase.ts`).  
  - **No hay** límite por usuario/día ni tope de sesiones por cuenta; el límite efectivo es la cuota de Vertex (y 429 si se supera).
- **Firestore:** Reglas de seguridad por `authorUid`/ownership; **no** hay en el código rate limiting por usuario (p. ej. máx. N sesiones/día).
- **SpendCapService / tokenTrackingService:** Existen para **lógica de suscripción y paquetes de tokens** (precios CAD, tokens incluidos, rollover); **no** están conectados a un enforcement en el flujo de generación SOAP/Niagara (no bloquean por cuota en el código actual).
- **Hospital portal:** Sí hay rate limit (p. ej. 5 intentos) documentado en `docs/hospital-portal-*.md`; es para acceso por código de visita, no para el workflow clínico general.

### 4.2 Control de costes o alertas en GCP

- En el **repo** no hay configuración de **presupuestos (budgets)** ni **alertas de facturación** en GCP.
- Documentación (p. ej. `docs/north/CTO_TECHNICAL_ASSESSMENT_SPRINT2.md`, `pilot-operations-pack.md`) menciona la necesidad de alertas (p. ej. email si >5% fallos, o por fallos de almacenamiento), pero **no** hay implementación ni scripts de Cloud Billing / Budget alerts en el código.

---

## 5. CÁLCULO ESTIMADO – 20 USUARIOS, PILOTO ESPAÑA

### 5.1 Supuestos

- **20 usuarios activos.**  
- **~15 sesiones clínicas completas por usuario y mes** → **300 sesiones/mes.**  
- **~2,75 llamadas Vertex por sesión** (2–3, con algo de regeneración/consideraciones).  
- **Total llamadas Vertex/mes:** 300 × 2,75 ≈ **825 llamadas.**  
- **Tokens por llamada (medio):** input 3.000, output 1.200 (≈ 4.200 tokens totales por llamada).

**Tokens mensuales (totales):**  
- Input: 825 × 3.000 = **2.475.000**.  
- Output: 825 × 1.200 = **990.000**.

### 5.2 Precios Vertex (Gemini 2.5 Flash) – referencia

*(Precios públicos típicos por 1M tokens; conviene confirmar en Google Cloud para tu cuenta y región.)*

- **Input:** ~0,075–0,15 USD / 1M tokens (modelos flash 2.x).  
- **Output:** ~0,30–0,60 USD / 1M tokens.

Usando **input 0,10 USD/1M** y **output 0,45 USD/1M**:

- Coste input: 2,475 × 0,10 ≈ **0,25 USD**.  
- Coste output: 0,99 × 0,45 ≈ **0,45 USD**.  
- **Vertex total estimado:** **~0,70–1,20 USD/mes** (según precios reales del modelo y región).

*(Si se usara Gemini 1.5 Pro en todo, el coste sería notablemente mayor; con el diseño actual solo se usa 2.5 Flash en el proxy.)*

### 5.3 Firebase (Blaze, estimado)

- **Firestore:**  
  - 300 sesiones × ~20 lecturas ≈ 6.000 lecturas; × ~5 escrituras ≈ 1.500 escrituras (más otras colecciones).  
  - Con más uso (listados, dashboards, varios pacientes): **50k–150k lecturas/mes**, **10k–30k escrituras/mes** son plausibles.  
  - En Blaze, dentro del free tier de Firestore suele haber 50k lecturas/día; por debajo de eso, coste bajo (del orden de pocos USD o menos).
- **Functions:** Invocaciones y tiempo de CPU por las 825+ llamadas al proxy más SMS, etc.; típicamente **dentro del free tier o 1–5 USD/mes** para este volumen.
- **Storage:** Poco volumen si hay pocos adjuntos; normalmente **< 1 USD/mes**.

**Firebase total estimado:** **0–5 USD/mes** (si se supera Spark y se usa Blaze con este uso).

### 5.4 Otros

- **SMS (Vonage):** Depende de cuántos consentimientos por SMS se envíen; 1 SMS por paciente/consentimiento. Si 300 sesiones generan 100 SMS/mes, el coste es bajo (del orden de unos euros/dólares según tarifa).
- **Total otros:** **0–5 USD/mes** (muy dependiente de SMS y de si añadís Sentry/Cloudflare luego).

### 5.5 Total mensual estimado (20 usuarios, piloto España)

| Partida | Rango estimado (USD/mes) |
|---------|---------------------------|
| Vertex AI (Gemini 2.5 Flash) | 0,70 – 1,50 |
| Firebase (Blaze, Firestore + Functions + Storage) | 0 – 5 |
| SMS (Vonage) | 0 – 5 |
| **Total** | **~1–12 USD/mes** |

En **EUR** (aprox. ×1,05): **~1–13 EUR/mes.**

El grueso del coste viene de Vertex; con 20 usuarios y ~300 sesiones/mes el coste sigue siendo bajo. Si se dobla el número de sesiones o se usa mucho “regenerar SOAP” o asistente virtual, Vertex puede subir a unos pocos dólares más.

---

## 6. ¿NECESITAMOS IMPLEMENTAR LÍMITES ANTES DEL PILOTO?

### 6.1 Riesgo de coste

- Para **20 usuarios** y el uso anterior, el coste mensual es **bajo** (del orden de 1–12 USD).
- El riesgo no es tanto el coste absoluto como:  
  - **Picos de uso** (muchos “regenerar” o uso intenso del asistente) que disparen Vertex.  
  - **Cuota Vertex 429** en plan gratuito o cuentas con límites bajos, que ya se mitiga con backoff y cooldown en cliente.

### 6.2 Recomendaciones

1. **Corto plazo (piloto 20 usuarios):**  
   - No es estrictamente necesario implementar **límites por usuario** para controlar coste; el coste esperado es bajo.  
   - Sí es recomendable:  
     - Activar **presupuesto y alertas en GCP** (p. ej. alerta si facturación > 20–50 USD/mes).  
     - Revisar en Firebase Console si el uso de Firestore/Functions requiere **Blaze** y activarlo si aplica.

2. **Opcional antes de escalar:**  
   - **Límite por usuario:** p. ej. N sesiones con generación SOAP por día (o por mes) para evitar abusos.  
   - **Límite de regeneraciones** por sesión (p. ej. máx. 2–3).  
   - Conectar **SpendCapService / tokenTrackingService** al flujo real (bloquear o advertir cuando se supere un umbral por usuario o por organización).

3. **Documentación:**  
   - Mantener este documento actualizado con precios reales de Vertex (y región, si cambia) y con los límites que se implementen (si los hay).

---

## 7. REFERENCIAS EN CÓDIGO

| Tema | Ubicación |
|------|-----------|
| Modelo Vertex y proxy | `functions/index.js` (MODEL, ENDPOINT, vertexAIProxy) |
| URL proxy y modelo en cliente | `src/config/env.ts`, `src/services/vertex-ai-soap-service.ts`, `src/services/vertex-ai-service-firebase.ts` |
| Llamadas SOAP / follow-up | `src/services/vertex-ai-soap-service.ts` (`generateSOAPNote`, `generateFollowUpAnalysis`, `generateFollowUpSOAPV2Raw`) |
| Niagara (análisis clínico) | `src/hooks/useNiagaraProcessor.ts`, `src/services/vertex-ai-service-firebase.ts` |
| Recorte 6k y backoff/cooldown | `docs/architecture/VERTEX_RATE_LIMITING.md`, `vertex-ai-service-firebase.ts` (MAX_TRANSCRIPT_CHARS), `useNiagaraProcessor.ts` |
| Firestore (sesiones, notas, encounters) | `src/services/sessionService.ts`, `src/services/PersistenceService.ts`, `src/repositories/encountersRepo.ts` |
| Firebase (Auth, Firestore, Storage, Functions) | `src/lib/firebase.ts` |
| Spend cap / tokens | `src/services/spendCapService.ts`, `src/services/tokenTrackingService.ts` |

---

*Documento generado a partir de revisión del repo. Precios Vertex y cuotas Firebase deben confirmarse en Google Cloud y Firebase Console.*
