# Informe de ejecución — Piloto en VPS

**Plan de referencia:** `docs/reports/PILOTO_VPS_PASO_A_PASO.md`  
**Objetivo:** Mover app + túnel Cloudflare a un VPS para que el piloto (https://pilot.aiduxcare.com) corra sin interrupciones evitables.  
**Alcance del informe:** Preflight ejecutado en repo local; pasos en VPS a completar por el responsable con evidencia en este documento.

---

## Resumen ejecutivo

| Fase | Estado | Evidencia |
|------|--------|-----------|
| Preflight (build local) | ✅ Completado | Build exitoso; `dist/` generado (ver sección 1). |
| Paso 1 — Crear VPS | ✅ Completado | GCP e2-micro → e2-small; IP 35.226.101.41 (sección 2). |
| Paso 2 — SSH | ✅ Completado | gcloud compute ssh; prompt mauriciosobarzo@pilot-vps (sección 3). |
| Paso 3 — Node 20 | ✅ Completado | node v20.20.0, npm 10.8.2 (sección 4). |
| Paso 4 — Repo + build en VPS | ✅ Completado | npm install, .env.local, NODE_OPTIONS=1536 npm run build; dist/ OK. |
| Paso 5 — Servir app (PM2) | ✅ Completado | pilot-web online, curl 200, pm2 startup systemd (sección 6). |
| Paso 6 — cloudflared + creds | ✅ Completado | cloudflared 2026.1.2; creds en ~/.cloudflared; config /home/... (sección 7). |
| Paso 7 — Túnel (PM2) | ✅ Completado | pilot-tunnel online; quic; Registered tunnel connection (sección 8). |
| Paso 8 — Prueba desde fuera | ✅ Completado | https://pilot.aiduxcare.com → Access → landing validado (sección 9). |

Cuando completes los pasos en el VPS, rellena las secciones de evidencia correspondientes y marca el estado como ✅.

---

## 1. Preflight — Build local (ejecutado)

**Objetivo:** Verificar que el proyecto construye correctamente antes de ejecutar el mismo flujo en el VPS.

**Comando ejecutado:**

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean && npm run build
```

**Resultado:** Exit code 0. Build completado en ~10.6 s.

**Evidencia — Salida del build:**

```
> aiduxcare-v2@0.1.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2119 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                         1.14 kB │ gzip:   0.62 kB
dist/assets/index-DXCyMzkE.css                         92.89 kB │ gzip:  13.91 kB
dist/assets/index-TZcFlNOk.js                         868.17 kB │ gzip: 220.75 kB
...
✓ built in 10.62s
```

**Evidencia — Contenido de `dist/` tras el build:**

- `index.html`, `favicon.ico`, `sw.js`, `test.html`
- `assets/` con chunks JS/CSS (index-*, firebase-*, react-router-*, etc.)

**Conclusión preflight:** El build local es correcto. En el VPS, `npm ci` + `npm run build` producirá el mismo `dist/` para servir en el puerto 5174.

---

## 2. Paso 1 — Crear VPS

**Estado:** ✅ Completado

**Acción:** VM creada con `gcloud compute instances create` en proyecto **aiduxcare-v2-uat-dev**.

**Evidencia:**

- [x] Proveedor usado: **Google Cloud (GCP)**
- [x] IP del VPS: **35.239.23.162**
- [x] Zona: us-central1-a | Nombre: pilot-vps | Tipo: e2-micro | STATUS: RUNNING

```
NAME       ZONE           MACHINE_TYPE  PREEMPTIBLE  INTERNAL_IP  EXTERNAL_IP    STATUS
pilot-vps  us-central1-a  e2-micro                   10.128.0.2   35.239.23.162  RUNNING
```

---

## 3. Paso 2 — Conectar por SSH

**Estado:** ✅ Completado

**Acción:** Conectado con `gcloud compute ssh pilot-vps --zone=us-central1-a`.

**Evidencia:**

- [x] Comando usado: `gcloud compute ssh pilot-vps --zone=us-central1-a`
- [x] Prompt del servidor: `mauriciosobarzo@pilot-vps:~$` (Ubuntu 22.04.5 LTS, IPv4 10.128.0.2)

---

## 4. Paso 3 — Instalar Node.js 20

**Estado:** ✅ Completado

**Acción:** NodeSource setup_20.x + `sudo apt-get install -y nodejs`.

**Evidencia:**

```
node -v  →  v20.20.0
npm -v   →  10.8.2
```

- [x] `node -v` ≥ 20.x.x
- [x] `npm -v` ≥ 10.x

---

## 5. Paso 4 — Clonar repo, .env, npm install, npm run build

**Estado:** ✅ Completado

**Acción:** Repo en `/var/www/pilot`, `.env` vía scp desde laptop; `cp .env .env.local`; `npm install`; `NODE_OPTIONS="--max-old-space-size=1536" npm run build`. VM e2-small (2 GB RAM) para build.

**Evidencia:**

- [x] Repo en `/var/www/pilot` (AIDUXCARE-V.2, main)
- [x] `.env` y `.env.local` presentes
- [x] Build exitoso: `✓ built in 31.69s`, `dist/index.html` y assets generados

---

## 6. Paso 5 — Servir app en puerto 5174 (PM2)

**Estado:** ✅ Completado

**Acción:** `pm2 start "npx serve dist -p 5174 --single" --name pilot-web`, `pm2 save`, `pm2 startup` (comando sudo env PATH=... ejecutado).

**Evidencia:**

- [x] `curl -s -o /dev/null -w "%{http_code}" http://localhost:5174` → **200**
- [x] `pm2 status`: pilot-web **online** (96.4mb)
- [x] PM2 startup systemd: `pm2-mauriciosobarzo.service` creado y habilitado

---

## 7. Paso 6 — Instalar cloudflared y copiar credenciales

**Estado:** ✅ Completado

**Acción:** cloudflared instalado (2026.1.2). Credenciales y config copiados desde laptop (gcloud compute scp). Ruta en config corregida: `/Users/...` → `/home/mauriciosobarzo/...` (Linux).

**Evidencia:**

- [x] Archivos en `~/.cloudflared/`: `.json` y `config.yml`
- [x] `credentials-file: /home/mauriciosobarzo/.cloudflared/cd2f67df-73cc-4f60-9154-b7a03a371e70.json`

---

## 8. Paso 7 — Ejecutar túnel (PM2)

**Estado:** ✅ Completado

**Acción:** Comando que funciona en el VPS (sin `--protocol http2` delante del nombre del túnel, para evitar "accepts only one argument"):  
`pm2 start "cloudflared tunnel run aiduxcare-pilot-2026" --name pilot-tunnel`, luego `pm2 save`.

**Evidencia:**

- [x] `pm2 list` muestra `pilot-web` y `pilot-tunnel` en "online"
- [x] Logs: `INF Registered tunnel connection connIndex=0 ... location=ord07 protocol=quic`
- [x] Túnel registrado con protocolo **quic** (por defecto; http2 con ese orden de args fallaba en cloudflared)

**Nota:** Warning en logs `failed to sufficiently increase receive buffer size` (quic-go UDP buffer) es informativo; no impide que el túnel funcione.

---

## 9. Paso 8 — Probar desde fuera (landing sin fricción)

**Estado:** ✅ Completado

**Acción:** Abrir https://pilot.aiduxcare.com; Cloudflare Access (email + código); tras validar, landing de AiDuxCare.

**Evidencia:**

- [x] Cloudflare Access aparece y carga
- [x] Tras validar, se ve el landing de AiDuxCare (validado por responsable)
- [x] Sin errores 502/503; landing transmite producto

---

## 10. Checklist final

Cuando todos los pasos estén completos, este cuadro debe quedar así:

| Paso | Completado | Evidencia en este informe |
|------|------------|---------------------------|
| Preflight (build local) | ✅ | Sección 1 |
| 1 — VPS creado | ✅ | Sección 2 |
| 2 — SSH OK | ✅ | Sección 3 |
| 3 — Node 20 | ✅ | Sección 4 |
| 4 — Repo + build | ✅ | Sección 5 |
| 5 — App en 5174 (PM2) | ✅ | Sección 6 |
| 6 — cloudflared + creds | ✅ | Sección 7 |
| 7 — Túnel (PM2) | ✅ | Sección 8 |
| 8 — Prueba desde fuera | ✅ | Sección 9 |

---

## 11. Próximos pasos tras completar el plan

1. Dejar de usar la laptop como origen del túnel para pilot.aiduxcare.com (opcional: detener `cloudflared tunnel run` en la laptop para evitar conflicto).
2. Seguir el runbook de estabilidad si algo falla: `docs/reports/PILOTO_CTO_ESTABILIDAD.md`.
3. Revisar "Antes de enviar el email" en `PILOTO_VPS_PASO_A_PASO.md` y enviar el email cuando los chequeos 1–8 estén pasados.

---

## Referencias

- Plan paso a paso: `docs/reports/PILOTO_VPS_PASO_A_PASO.md`
- Estabilidad (CTO): `docs/reports/PILOTO_CTO_ESTABILIDAD.md`
- Alcance y runbook general: `docs/reports/ALCANCE_PILOTO_RUNBOOK.md`
