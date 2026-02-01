# UAT: por qué el código nuevo no está activo — diagnóstico y verificación

**Fecha:** 2026-01-27  
**Contexto:** En UAT (`aiduxcare-v2-uat-dev.web.app`) se ve lógica vieja en Patient History (✓ Initial Eval, Start Follow-up, View SOAP → `/notes/`) aunque en el repo el código nuevo (Resume Initial Assessment, View SOAP → workflow con `resume=true`) ya está implementado.

---

## 1. Qué está pasando (en una frase)

**El código nuevo está en el repo, pero UAT está sirviendo un bundle antiguo.**  
No es un bug de lógica ni de estado: es **qué build se desplegó y qué está cacheado**.

---

## 2. Qué confirma que el código nuevo NO está activo en UAT

| Lo que ves en UAT | Con código nuevo sería |
|-------------------|------------------------|
| ✓ Initial Eval (verde) | ⟳ (amarillo) o ? según SOAP/baseline |
| Quick Action: "Start Follow-up Visit" | "Resume Initial Assessment" (amarillo) cuando SOAP no finalizado |
| "View SOAP →" lleva a `/notes/note_...` | Para sesión resumible: `/workflow?type=initial&patientId=...&sessionId=...&resume=true` |

Si el código nuevo estuviera activo, con el caso Javier (SOAP draft, sin baseline) no podrías ver ✓ Initial Eval ni solo "Start Follow-up"; verías "Resume Initial Assessment" y View SOAP llevando al workflow.  
Conclusión: **el bundle que UAT sirve no incluye esos cambios.**

---

## 3. Entrada única: no hay “otra” página de Patient History

En el repo hay **una sola** ruta para Patient History:

- **Ruta:** `/patients/:id/history`
- **Componente:** `PatientDashboardPage` (importado en `router.tsx` línea 11, ruta línea 80)
- **Quién lleva ahí:** Command Center (`CommandCenterPageSprint3`) hace `navigate(\`/patients/${patient.id}/history\`)` (línea 177)

No existe otra ruta ni otro componente para “Patient History” en este proyecto.  
Por tanto, **el problema no es que UAT use otro entry** (p. ej. otra página de history). El problema es que el **build desplegado** es viejo o está cacheado.

---

## 4. Los 3 escenarios posibles (y cómo descartar/confirmar)

### Escenario A — Deploy parcial / branch incorrecto

- **Qué es:** Se desplegó desde otro branch, o desde un commit anterior a los cambios de Dashboard/Resume/View SOAP.
- **Resultado:** UAT tiene un bundle que no incluye esos cambios (pero sí puede incluir otros, p. ej. HEP split si ese sí estaba en el commit desplegado).
- **Cómo confirmar:**
  1. En UAT, DevTools → **Sources** → buscar en los archivos JS del sitio:
     - `resume=true`
     - `isResumableInitial`
     - `Resume Initial Assessment`
  2. Si **no aparecen** → el build desplegado no contiene el código nuevo.
  3. Revisar desde qué branch y qué commit se hizo el último deploy a UAT; comparar con el commit donde están los cambios de PatientDashboardPage y resume.

### Escenario B — Cache (Vite + Firebase + navegador)

- **Qué es:** Vite generó el build usando cache viejo, o Firebase subió un build anterior, o el navegador está sirviendo chunks viejos.
- **Resultado:** Puedes ver “mezcla” (p. ej. algo del HEP split sí nuevo, pero Patient History sigue viejo).
- **Cómo confirmar:**
  1. En UAT: **Empty cache and hard reload** (DevTools abierto → clic derecho en refresh → “Empty cache and hard reload”).
  2. Si **sigue igual** → no es solo cache del navegador; el problema está en el build o en el deploy (A o B en servidor).
  3. En tu máquina: `rm -rf dist .vite` (o el directorio de build que uses), volver a `pnpm build` (o `npm run build`) y volver a desplegar; luego probar de nuevo en UAT con hard reload.

### Escenario C — Archivos no incluidos en el bundle de UAT

- **Qué es:** Los cambios están en archivos que “no se importan” en el entry que UAT usa.
- **En este repo:** La única ruta de Patient History es `/patients/:id/history` → `PatientDashboardPage`. Ese componente **sí** está en el router y **sí** contiene `resume=true`, `isResumableInitial`, “Resume Initial Assessment” y el nuevo handler de View SOAP.
- **Conclusión:** Para la página que estás viendo (Patient History), **este escenario no aplica**: el código nuevo está en el archivo que corresponde a esa ruta. Si no se ve en UAT, es porque **el bundle desplegado es antiguo** (A o B).

---

## 5. Verificación rápida en UAT (5 minutos)

Hacer esto **en el navegador, en UAT**, sin tocar código:

1. **Hard reload sin cache**
   - DevTools abierto (F12).
   - Clic derecho en el botón de recargar.
   - **“Empty cache and hard reload”**.
   - Ir a Patient History del paciente (Javier o el que tenga SOAP draft).
   - Si sigue mostrando ✓ Initial Eval y “Start Follow-up” → el bundle servido no tiene el código nuevo.

2. **Comprobar si el código nuevo está en el bundle**
   - DevTools → pestaña **Sources**.
   - En la izquierda, buscar en los archivos JS (p. ej. bajo `top` o el dominio).
   - Buscar (Ctrl/Cmd+F):
     - `resume=true`
     - `isResumableInitial`
     - `Resume Initial Assessment`
   - Si **no aparecen** → el build desplegado **no contiene** esos cambios.

3. **Commit desplegado**
   - Revisar en CI/CD o en el proceso de deploy: ¿qué branch y qué commit se usaron para el último deploy a UAT?
   - Comparar con el commit donde se añadieron los cambios de WO-DASHBOARD-01, View SOAP resumible y WO-IA-RESUME-01.

---

## 6. Cierre correcto (cuando confirmes el escenario)

Cuando sepas si es A (branch/commit) o B (cache de build/deploy):

1. **Build limpio**
   - `rm -rf dist .vite` (o equivalente).
   - `pnpm build` (o `npm run build`).

2. **Deploy explícito**
   - Desde el **branch correcto** (donde están los cambios).
   - Deploy a UAT con ese build nuevo.

3. **Verificación solo en**
   - Patient History (Initial Eval ⟳/?, Completed, Quick Actions).
   - “View SOAP” para una visita con SOAP draft (session/encounter) → debe ir a workflow con `resume=true` y `sessionId`.
   - “Resume Initial Assessment” visible cuando corresponda.

Nada más. Con eso alineas “lo que corre en UAT” con “lo que está en el repo”.

---

## 7. Conclusión a partir de los logs que compartiste

Los logs de UAT que enviaste confirman **deploy parcial**:

| Evidencia en los logs | Qué implica |
|----------------------|-------------|
| `[WORKFLOW] ✅ Clearing saved state for initial evaluation (ONCE)` y `All state reset to empty for initial evaluation` | En flujo **initial** (sin `resume=true`) el código **siempre** limpia estado y empieza de cero. Correcto cuando no se resume. |
| `sessionId: '...1769933394687'` (initial) y luego `...1769933432655` (follow-up) | Se crean **nuevos** sessionId en cada entrada al workflow. No hay uso de `sessionId` de la URL para cargar una sesión existente. |
| **No aparece** `[WO-IA-RESUME-01]` en ningún mensaje | El flujo de resume (leer `resume=true` y `sessionId` de la URL y cargar sesión desde Firestore) **no se ejecutó**. O bien no está en el bundle, o bien no abriste la URL con `resume=true&sessionId=YYY`. |
| **Sí aparece** `[WO-05-FIX][PROOF] Using previousTreatmentPlan.planText as source` y `todayFocus initialized from treatmentPlan` | Código de **AnalysisTab** (WO-05-FIX) **sí** está en el bundle de UAT. |

Conclusión: **parte del código nuevo está en UAT (WO-05-FIX, treatment plan, etc.), pero el camino de resume (WO-IA-RESUME-01) y muy probablemente el de Patient Dashboard (WO-DASHBOARD-01, View SOAP, Resume Initial) no están en el bundle desplegado.**

Próximo paso: **build limpio** (`rm -rf dist .vite` + `pnpm build`) y **deploy explícito** desde el branch donde están los cambios de WO-IA-RESUME-01 y WO-DASHBOARD-01. Después de ese deploy, para comprobar que el resume está activo: abrir en UAT una URL como  
`/workflow?type=initial&patientId=PiD6QUTga712MQVszsgz&sessionId=6ETQ8TOtE4XxejPzUbzokGHK0It2-1769878830221&resume=true`  
y buscar en consola el mensaje **`[WO-IA-RESUME-01] resume detected from URL — loading session`**. Si aparece, el código de resume está en el bundle.

---

## 8. "A nivel de UI no hay cambios" después del deploy

Si ya hiciste build limpio y deploy pero en **Patient History** sigues viendo ✓ Initial Eval y "Start Follow-up" (sin "Resume Initial Assessment"):

### 8.1. Comprobar que estás en Patient History

La URL debe ser exactamente:

`https://aiduxcare-v2-uat-dev.web.app/patients/PiD6QUTga712MQVszsgz/history`

(no Command Center ni Workflow). Los cambios de UI están **solo en esa página**.

### 8.2. Cache del navegador

1. Abre **solo** esa URL de Patient History.
2. DevTools abierto → pestaña **Network** → marca **"Disable cache"**.
3. Clic derecho en refresh → **"Empty cache and hard reload"**.
4. Comprueba en Network que el JS que carga sea el nuevo (p. ej. `index-y9_VmR2l.js`) y que sea **200**, no 304.

### 8.3. Índice de Firestore para `sessions`

El Dashboard usa visitas que vienen de la colección **sessions** (WO-DASHBOARD-01). Esa query usa un **índice compuesto**. Si el índice no está desplegado, la query falla en silencio (solo se loguea en consola) y no aparecen visitas desde sesiones → no sale "Resume Initial Assessment".

Despliega los índices:

```bash
firebase deploy --only firestore:indexes --project aiduxcare-v2-uat-dev
```

Luego espera unos minutos (Firestore puede tardar en crear el índice) y vuelve a abrir Patient History con hard reload.

### 8.4. Logs en Patient History

Tras el último cambio en el repo, al abrir **Patient History** en la consola deberías ver **uno** de estos mensajes:

- **`[usePatientVisits][WO-DASHBOARD-01] sessions loaded`** `{ count: N, patientId }` → la query de sessions funciona; si N > 0 y hay una sesión initial con SOAP draft, debería mostrarse "Resume Initial Assessment".
- **`[usePatientVisits][WO-DASHBOARD-01] Error fetching sessions (index may be missing)`** → la query falla; despliega índices (ver 8.3).

Si no ves ninguno de los dos, es posible que el código del Dashboard no sea el del último build (cache o deploy de otro branch). Haz de nuevo build limpio + deploy y repite 8.2.
