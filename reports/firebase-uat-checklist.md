# Firebase UAT Checklist — Authentication & API Keys

## Authentication
- [ ] Sign-in method → Email/Password: **Enabled**
- [ ] Authorized domains: **localhost**, **127.0.0.1**, **aiduxcare-mvp-uat.firebaseapp.com**, **aiduxcare-mvp-uat.web.app**
- [ ] ActionCodeSettings.url: **https://aiduxcare-mvp-uat.web.app**

## Google Cloud Console
- [ ] APIs & Services → Enabled APIs: **Identity Toolkit API** habilitada
- [ ] Credentials → API key UAT:
  - [ ] Nombre: `AIDUXCARE_UAT_IDENTITY_TOOLKIT_KEY`
  - [ ] API restrictions: **Identity Toolkit API only**
  - [ ] Application restrictions: **HTTP referrers** solo UAT + localhost
- [ ] Credentials → API key PROD:
  - [ ] Nombre: `AIDUXCARE_PROD_IDENTITY_TOOLKIT_KEY`
  - [ ] API restrictions: **Identity Toolkit API only**
  - [ ] Application restrictions: **HTTP referrers** solo PROD (sin localhost)

## Validación técnica (preflight)
- [ ] `node scripts/identitytoolkit-smoke.cjs UAT` → `projectId` de UAT, **status 200** + `localId`
- [ ] `node scripts/identitytoolkit-smoke.cjs PROD` (con key PROD) → `projectId` de PROD, **status 400** + `OPERATION_NOT_ALLOWED`

## 🚑 ACCIONES CRÍTICAS PARA DESCRUZAR API KEYS

### 1. GCP Console → APIs & Services → Credentials
- [ ] **REVOCAR** API Key actual de UAT (AIzaSyC1coa0W0LEsj_g-dzferIdmAEVvEep40I)
- [ ] **REVOCAR** API Key actual de PROD (AIzaSyDMDl3Vj_0WSMhOtz6IbGiTXaWOtABeGyk)
- [ ] **REGENERAR** nueva key para UAT: `AIDUXCARE_UAT_IDENTITY_TOOLKIT_KEY`
- [ ] **REGENERAR** nueva key para PROD: `AIDUXCARE_PROD_IDENTITY_TOOLKIT_KEY`

### 2. Restricciones por Key
- [ ] **UAT Key**: API restrictions → solo **Identity Toolkit API**
- [ ] **UAT Key**: Application restrictions → `http://localhost:*`, `http://127.0.0.1:*`, `https://*.aiduxcare-mvp-uat.web.app`, `https://*.aiduxcare-mvp-uat.firebaseapp.com`
- [ ] **PROD Key**: API restrictions → solo **Identity Toolkit API**
- [ ] **PROD Key**: Application restrictions → `https://*.aiduxcare-mvp-prod.web.app`, `https://*.aiduxcare-mvp-prod.firebaseapp.com` (**NO localhost**)

### 3. Estados de Authentication
- [ ] **UAT**: Email/Password **habilitado**
- [ ] **PROD**: Email/Password **inhabilitado** (mantener bloqueado)

### 4. Verificación Post-Corrección
- [ ] **UAT**: `npm run check:uat` → exit 0, status 200, localId presente
- [ ] **PROD**: `npm run check:prod` → exit 0, status 400, OPERATION_NOT_ALLOWED
- [ ] **Preflight**: projectId contiene "uat" para UAT, "prod" para PROD
