# Secuencia de comandos — build limpio y deploy a UAT (terminal VS Code)

**Objetivo:** Build sin cache y deploy a `aiduxcare-v2-uat-dev` para que Patient Dashboard y WO-IA-RESUME-01 estén activos en UAT.

Ejecutar **en la raíz del proyecto** (donde están `package.json` y `firebase.json`). Puedes pegar cada bloque en la terminal de VS Code (Ctrl+` o View → Terminal).

---

## 1. Ir a la raíz del proyecto (si no estás ahí)

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
```

---

## 2. Limpiar cache y build anterior

```bash
rm -rf dist .vite
```

- `dist`: salida del build (Vite escribe aquí).
- `.vite`: cache de Vite (evita que use chunks viejos).

---

## 3. Build de producción

```bash
pnpm build
```

Si usas npm:

```bash
npm run build
```

---

## 4. Deploy a UAT (solo hosting)

```bash
firebase deploy --only hosting --project aiduxcare-v2-uat-dev
```

El `.firebaserc` ya tiene `default: aiduxcare-v2-uat-dev`, así que también puedes usar:

```bash
firebase deploy --only hosting
```

---

## 5. (Opcional) Deploy hosting + functions

Si además debes actualizar Cloud Functions en UAT:

```bash
firebase deploy --only hosting,functions --project aiduxcare-v2-uat-dev
```

---

## Secuencia completa (copiar y pegar)

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
rm -rf dist .vite
pnpm build
firebase deploy --only hosting --project aiduxcare-v2-uat-dev
```

---

## Después del deploy

1. En UAT: **Empty cache and hard reload** (DevTools → clic derecho en refresh).
2. Si ves **404** para chunks como `AnalysisTab-*.js` o `SuccessMessage-*.js` (error "Failed to fetch dynamically imported module"): el navegador tiene una versión vieja del `index` que apunta a chunks con hash antiguo. **Solución:** redeploy completo (`rm -rf dist .vite` + `pnpm build` + `firebase deploy --only hosting`) y que el usuario haga **hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) o borre caché. La app ahora muestra "New version available — Refresh page" cuando detecta este error.
3. Ir a Patient History de Javier (o el paciente con SOAP draft).
4. Comprobar: Initial Eval ⟳, "Resume Initial Assessment", "View SOAP" → workflow con `resume=true`.
5. Para confirmar resume en consola: abrir  
   `https://aiduxcare-v2-uat-dev.web.app/workflow?type=initial&patientId=PiD6QUTga712MQVszsgz&sessionId=6ETQ8TOtE4XxejPzUbzokGHK0It2-1769878830221&resume=true`  
   y buscar en consola: **`[WO-IA-RESUME-01] resume detected from URL — loading session`**.
