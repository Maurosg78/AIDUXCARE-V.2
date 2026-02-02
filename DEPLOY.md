# Deploy y variables de entorno — AiDuxCare V2

**Objetivo:** Un solo lugar con el orden de deploy piloto/UAT y las variables de entorno obligatorias.

---

## 1. Orden de deploy piloto / UAT

1. **Verificar entorno local**
   - Node >= 20.19 (ver `package.json` engines).
   - Variables de entorno configuradas (ver sección 2). Crear `.env.local` a partir de `.env.local.example` y completar valores.

2. **Build**
   ```bash
   npm run build
   # o
   pnpm run build
   ```

3. **Deploy a Firebase (staging/UAT)**
   ```bash
   npm run deploy:staging
   ```
   Equivale a: `npm run build && firebase deploy --only hosting,functions --project aiduxcare-v2-uat-dev`.

4. **Comprobar**
   - Hosting: URL del proyecto (ej. `https://aiduxcare-mvp-uat.web.app`).
   - Functions: que las Cloud Functions desplegadas respondan (consent, SMS si aplica).

---

## 2. Variables de entorno obligatorias para UAT/piloto

Todas son **secretas** en producción; no commitear valores reales. Usar `.env.local` en desarrollo y gestor de secretos / variables del CI o Firebase en deploy.

### 2.1 Firebase (obligatorias)

| Variable | Descripción | Ejemplo (no usar en prod) |
|----------|-------------|---------------------------|
| `VITE_FIREBASE_API_KEY` | API Key del proyecto Firebase | (string) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de Auth | `aiduxcare-v2-uat-dev.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto | `aiduxcare-v2-uat-dev` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Storage | `aiduxcare-v2-uat-dev.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID de Messaging | (número) |
| `VITE_FIREBASE_APP_ID` | App ID de Firebase | (string) |

### 2.2 Consent / SMS (obligatorias si se usa SMS)

| Variable | Descripción | Secreto |
|----------|-------------|---------|
| `VITE_FIREBASE_FUNCTIONS_REGION` | Región de Cloud Functions | No |
| `VITE_FIREBASE_PROJECT_ID` | Mismo que Firebase | No |
| `VITE_TWILIO_ACCOUNT_SID` | Twilio Account SID | **Sí** |
| `VITE_TWILIO_AUTH_TOKEN` | Twilio Auth Token | **Sí** |
| `VITE_TWILIO_PHONE_NUMBER` | Número Twilio (ej. +1…) | **Sí** |

Alternativa Vonage: `VITE_VONAGE_API_KEY`, `VITE_VONAGE_API_SECRET`, `VITE_VONAGE_FROM_NUMBER` (todos **secretos**).

### 2.3 URLs y jurisdicción

| Variable | Descripción | Secreto |
|----------|-------------|---------|
| `VITE_DEV_PUBLIC_URL` | URL pública para enlaces (consent, móvil) en UAT | No |
| `VITE_CLINICAL_JURISDICTION` | Jurisdicción clínica (ej. `CA-ON`) | No |

### 2.4 Opcionales

| Variable | Descripción |
|----------|-------------|
| `VITE_FIREBASE_USE_EMULATOR` | `true` para usar emuladores |
| `VITE_FIREBASE_AUTH_EMULATOR_HOST` | Host del emulador de Auth |
| `VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST` | Host del emulador de Functions |
| `VITE_PROMPT_BRAIN_VERSION` | Versión de prompts (Vertex/IA) |
| `VITE_SMS_PROVIDER` | `twilio` o `vonage` |
| `VITE_SMS_FUNCTION_URL` | URL de la Cloud Function de SMS (si se sobreescribe) |

---

## 3. Checklist pre-deploy piloto

- [ ] `.env.local` (o secretos de CI) con todas las obligatorias.
- [ ] `npm run typecheck` y `npm run build` pasan en local.
- [ ] Proyecto Firebase correcto (`aiduxcare-v2-uat-dev` para UAT).
- [ ] Reglas de Firestore e índices desplegados si cambiaron (`firebase deploy --only firestore:rules` / índices según `firestore.indexes.json`).

---

## 4. Referencias

- Auditoría y prioridades piloto: `docs/reports/AUDITORIA_PILOTO_MEJORAS.md`, `docs/reports/INFORME_CTO_PRIORIDADES_PILOTO_NIAGARA.md`
- Cumplimiento PHIPA/PIPEDA: `INFORME_PHIPA_PIPEDA_COMPLIANCE.md`
