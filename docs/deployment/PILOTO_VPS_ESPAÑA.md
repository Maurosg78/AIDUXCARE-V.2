# Piloto VPS: que se vea España (no Canadá)

## Por qué sigues viendo Canadá

En el VPS el código viene de `git pull origin stable` (o la rama que uses). **Si esa rama no incluye `src/core/pilotDetection.ts`**, la app no puede detectar el piloto España y todo se muestra como Canadá:

- Bandera 🍁 y texto "Designed for Canadian privacy workflows"
- Consola: "PromptFactory-Canada ready"
- Command Center: "Canada" en lugar de "España"

Comprobación en el VPS:

```bash
cat /var/www/pilot/src/core/pilotDetection.ts
# Si dice "No such file or directory" → esa rama no tiene el código de detección España.
```

## Requisito: rama con detección unificada España

La rama que despliegas en el VPS **debe contener**:

1. **`src/core/pilotDetection.ts`** — fuente única de verdad para piloto España (hostname `pilot.aiduxcare.com`, path `/pilot` o `/es`, o env `VITE_ENABLE_ES_PILOT=true`).
2. Uso de **`isSpainPilot()`** en lugar de `isEsPilotEnabled()` / `VITE_ENABLE_ES_PILOT` en:
   - router, UnifiedLandingPage, CommandCenterHeader, verbalConsentService, SOAPEditor, clinicProfile, ProfessionalOnboardingPage, clinicalReportService, etc.

Si falta `pilotDetection.ts`, el build puede seguir funcionando en una rama antigua que no importa ese módulo, pero la UI y la lógica seguirán en modo Canadá.

## Qué hacer

### 1. Subir el código correcto a la rama que usa el VPS

Desde este repo (donde sí está `pilotDetection.ts` y el refactor):

- Haz **merge** (o push) de la rama actual a la rama que el VPS clona. Ejemplo si el VPS usa `stable` en `Maurosg78/AIDUXCARE-V.2`:

  ```bash
  git checkout stable
  git pull origin stable
  git merge <rama-donde-está-pilotDetection>   # o traer los commits con pilotDetection
  git push origin stable
  ```

- Asegúrate de que en `stable` (o la rama que sea) exista:
  - `src/core/pilotDetection.ts`
  - Imports `from '@/core/pilotDetection'` y llamadas a `isSpainPilot()` en los archivos que antes usaban `isEsPilotEnabled()` o `VITE_ENABLE_ES_PILOT`.

### 2. En el VPS: pull + build + restart

```bash
cd /var/www/pilot
git fetch origin
git checkout stable
git reset --hard origin/stable
npm install
# Opción A: build con env España (recomendado para pilot.aiduxcare.com)
VITE_ENABLE_ES_PILOT=true npm run build
# Opción B: sin env; la detección será por hostname (pilot.aiduxcare.com) en runtime
# npm run build
pm2 restart pilot-web
```

### 3. Comprobar

- Abre **https://pilot.aiduxcare.com** (mejor en incógnito o tras borrar datos del sitio).
- No debe aparecer 🍁; el badge debe ser tipo "Cumplimiento RGPD..." si el idioma es español.
- En Command Center debe decir "España", no "Canada".
- En consola ya no debería ser el único mensaje "PromptFactory-Canada ready" como indicador de mercado; la UI (maple, texto) debe ser España.

## Resumen

| Problema | Causa | Solución |
|----------|--------|----------|
| Sigo viendo Canadá en pilot.aiduxcare.com | La rama desplegada en el VPS **no tiene** `pilotDetection.ts` ni el refactor `isSpainPilot()` | Incluir esos cambios en la rama que el VPS usa (ej. `stable`), push, luego en VPS `git pull` + build + `pm2 restart pilot-web`. |
| "PromptFactory-Canada ready" en consola | El código de prompts hoy solo tiene variante Canadá; la UI (bandera, texto, jurisdicción) sí debe cambiar con `isSpainPilot()`. | Asegurar que la rama desplegada use `isSpainPilot()` y `pilotDetection.ts` para toda la UI y rutas. |
