# Pre-lanzamiento piloto España — 5 tareas (sin tocar código clínico)

Checklist antes de enviar los 100 emails. Ninguna tarea requiere modificar código clínico.

---

## Esta tarde/noche (~30 min)

### 1. GCP: Presupuesto y alertas (50 USD, 50% y 90%)

**Opción A — Consola (recomendada si es la primera vez)**

1. Entra en [Google Cloud Console](https://console.cloud.google.com).
2. Selecciona el proyecto **aiduxcare-v2-uat-dev** (selector arriba).
3. Menú ☰ → **Billing** → **Budgets & alerts**.
4. **Create budget**:
   - **Name:** `Piloto España 50 USD`
   - **Scope:** Billing account (la que usa el proyecto).
   - **Amount:** **50** USD, mensual.
   - **Set alerts:** Añade alertas al **50%** y al **90%** (y opcional 100%).
   - Los emails por defecto van a los Billing Account Administrators / Users.
5. **Finish** / **Save**.

**Opción B — gcloud (repetible, desde tu máquina)**

1. Obtén el ID de la cuenta de facturación:
   ```bash
   gcloud billing accounts list
   ```
   Copia el **ACCOUNT_ID** (formato tipo `01234AB-5678CD-90EF12`).

2. Crea el presupuesto con alertas al 50% y 90% (sin moneda = usa la de la cuenta):
   ```bash
   gcloud billing budgets create \
     --billing-account=01FA22-93D263-74E81B \
     --display-name="Piloto España 50" \
     --budget-amount=50 \
     --threshold-rule=percent=0.50 \
     --threshold-rule=percent=0.90
   ```
   (ID de cuenta ya configurado. Si falla con 50USD, usar solo `--budget-amount=50`.)

3. (Opcional) Limitar el presupuesto solo al proyecto:
   ```bash
   gcloud billing budgets create \
     --billing-account=TU_BILLING_ACCOUNT_ID \
     --display-name="Piloto España 50 USD" \
     --budget-amount=50USD \
     --filter-projects=projects/aiduxcare-v2-uat-dev \
     --threshold-rule=percent=0.50 \
     --threshold-rule=percent=0.90
   ```

---

### 2. Firebase: Plan Blaze

1. Entra en [Firebase Console](https://console.firebase.google.com).
2. Proyecto **aiduxcare-v2-uat-dev**.
3. **⚙️ (engranaje)** → **Project settings** → pestaña **Usage and billing**.
4. Si el plan es **Spark (gratuito):**
   - **Modify plan** / **Upgrade** → elige **Blaze**.
   - Asocia la misma cuenta de facturación de GCP si te lo pide.
5. Con 20 usuarios y ~300 sesiones/mes el coste sigue siendo bajo (ver `docs/COSTO_OPERATIVO_PILOTO_ESPAÑA_20_USUARIOS.md`).

---

## Mañana domingo (1–2 h)

### 3. Prueba en móvil (una vez, solo bloqueantes)

**Opción A — Móvil real (recomendada)**  
En tu móvil, de principio a fin:

- Login.
- Consentimiento (gate + verbal si aplica).
- Abrir un workflow (Initial o Follow-up).
- Grabar/transcribir (aunque sea poco) y generar SOAP.
- Guardar / finalizar.

Objetivo: confirmar que no hay bloqueos de layout ni botones inaccesibles.

**Opción B — Simulación en escritorio (vista móvil)**  
Si no puedes usar el móvil hoy:

1. `npm run dev` y abre la URL en Chrome.
2. **F12** → **Toggle device toolbar** (Ctrl+Shift+M / Cmd+Shift+M) o menú ⋮ → More tools → Device toolbar.
3. Elige un dispositivo (p. ej. iPhone 14 o Pixel 7).
4. Repite el flujo: Login → consent → workflow → SOAP → guardar.
5. Marca en el checklist: botones accesibles, texto legible, sin cortes de layout, teclado no tapa campos críticos.

| Paso              | OK / Problema |
|-------------------|----------------|
| Login             |                |
| Gate consent      |                |
| Workflow / SOAP   |                |
| Guardar           |                |

---

### 4. Mensaje al usuario cuando falla Firestore

**Opción A — Simulación con flag (sin desconectar WiFi)**  
Para reproducir el fallo sin tocar la red:

1. Abre la app, inicia sesión y entra en un workflow (con paciente y algo de transcript/SOAP).
2. Abre la **consola del navegador** (F12 → Console).
3. Activa el simulador de fallo:
   ```js
   localStorage.setItem('aidux_simulate_firestore_fail', 'true');
   ```
4. Intenta **guardar** o **finalizar** la sesión (cualquier acción que escriba en Firestore).
5. **Verifica:** debe aparecer un mensaje claro al usuario (toast, banner o modal). Si solo ves error en consola, anótalo.
6. Desactiva el simulador:
   ```js
   localStorage.removeItem('aidux_simulate_firestore_fail');
   ```

**Opción B — Desconectar red**  
Inicia una sesión, **desconecta WiFi** (o en Chrome: F12 → Network → Throttling → Offline), intenta guardar y comprueba si se muestra un mensaje al usuario.

Si no se muestra nada claro, anótalo para post-piloto (está en el checklist como RIESGO BAJO).

---

## Lunes (antes de pacientes reales)

### 5. Una sesión clínica real tuya, de punta a punta

- Como si fueras un usuario nuevo: registro o login → consent → workflow → SOAP → guardar.
- Con datos reales (paciente de prueba o tú mismo como paciente).
- Objetivo: validar que el flujo completo es estable en uso real.

---
   
## Si todo pasa

Enviar los 100 emails esa misma semana.

---

## Reconocimiento del piloto España (idioma + ES-ES)

La app detecta “piloto España” con **una sola fuente de verdad**: `src/core/pilotDetection.ts` → `isSpainPilot()`.

| Señal | Ejemplo | Uso |
|-------|--------|-----|
| **1. Variable de entorno** | `VITE_ENABLE_ES_PILOT=true` en el build | Deploy explícito (más robusto). |
| **2. Hostname** | `pilot.aiduxcare.com`, `es.aiduxcare.com` | Subdominio dedicado. |
| **3. Path** | `/pilot` o `/es` (ej. `aiduxcare.com/pilot`, `localhost:5174/es`) | Mismo build, URL distinta. |

**En local (sin .env):** abre `http://localhost:5174/pilot` o `http://localhost:5174/es` y la UI y jurisdicción serán piloto España.

No se usa la IP del usuario (no disponible en el navegador sin una petición externa; geolocalización por IP es poco fiable y tiene implicaciones de privacidad).

---

*Referencia: `docs/CHECKLIST_ESTABILIDAD_PILOTO_ESPAÑA_20_USUARIOS.md`*
