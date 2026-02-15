# WO-METRICS-00 — Setup

## Configurar METRICS_PEPPER

La Cloud Function `metricsIngest` requiere `METRICS_PEPPER` (mínimo 16 caracteres) para HMAC.

### Opción 1: Firebase Functions config

```bash
firebase functions:config:set metrics.pepper="$(openssl rand -hex 32)"
```

### Opción 2: Variable de entorno (Cloud Run / v2)

```bash
# En .env o secrets
METRICS_PEPPER=<random-32-char-string>
```

### Verificar

```bash
firebase functions:config:get metrics
```

## Deploy

```bash
cd functions
npm run build   # si usas TypeScript
firebase deploy --only functions:metricsIngest
firebase deploy --only firestore:rules
```

## Verificación

1. Iniciar sesión en pilot o local
2. Navegar a Command Center
3. En Firestore Console → `metrics_events` debe aparecer 1 documento con:
   - `eventName`: `metrics_smoke_test`
   - `userIdHash` (hex, sin uid)
   - `appVersion`, `env`, `workflowSessionId`
   - `metrics.ok`: true
