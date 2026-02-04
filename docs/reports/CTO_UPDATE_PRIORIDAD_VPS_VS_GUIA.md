# Actualización CTO — Estado real del VPS (verificado)

**Fecha:** Febrero 2026  
**Para:** CTO  
**Fuente:** Evidencia de terminal en VPS (pm2 status, pm2 logs pilot-tunnel).  

---

## Estado verificado (no suposiciones)

Se contrastó el estado del VPS con la salida real del servidor. Resumen:

| Componente | Estado verificado | Evidencia |
|------------|-------------------|-----------|
| **PM2** | ✅ Instalado y en uso | `pm2 status` muestra procesos guardados en `.pm2/dump.pm2`. |
| **pilot-web** | ✅ Online | Sirve `dist` en puerto 5174; ~96 MB. |
| **pilot-tunnel** | ✅ Online | cloudflared en ejecución bajo PM2. |
| **Túnel Cloudflare** | ✅ Registrado | Logs: `INF Registered tunnel connection connIndex=0 ... location=ord07 protocol=quic`. |
| **Config** | ✅ Correcta | `~/.cloudflared/config.yml`: tunnel ID, credentials path Linux, ingress pilot.aiduxcare.com → localhost:5174. |

**Conclusión:** El VPS está listo. PM2 tiene pilot-web y pilot-tunnel; el túnel está registrado (protocolo **quic**). El piloto **no** está bloqueado por el túnel; se puede enviar a Niagara desde el punto de vista de infra.

---

## Dos procesos en paralelo (priorización)

| Proceso | Estado real | Bloquea piloto |
|---------|-------------|----------------|
| **VPS (piloto)** | ✅ Pasos 5–8 completados (PM2 + túnel registrado). | **No** — túnel estable. |
| **Clinical User Guide** | Guardado; gaps estimados. | No. |

La decisión “túnel primero, guía después” ya está cubierta: el túnel está funcionando. Lo que queda es **validar desde fuera** (https://pilot.aiduxcare.com + Cloudflare Access) y, en paralelo, lo que toque de la guía cuando prioricen.

---

## Nota técnica (para runbook / informe de ejecución)

- **Comando del túnel que funciona en el VPS:**  
  `cloudflared tunnel run aiduxcare-pilot-2026`  
  Sin `--protocol http2` delante del nombre del túnel: con ese orden cloudflared devolvía “accepts only one argument” y el proceso se reiniciaba. Sin el flag, cloudflared usa **quic** y registra la conexión correctamente.

- **Warning en logs (informativo):**  
  `failed to sufficiently increase receive buffer size (was: 208 kiB, wanted: 7168 kiB, got: 416 kiB)`  
  Es un aviso conocido de quic-go (UDP buffer). No impide que el túnel funcione; si en el futuro se busca más rendimiento, se puede revisar la doc en el enlace que aparece en el log.

- **Siguiente comprobación recomendada:**  
  Abrir https://pilot.aiduxcare.com desde fuera (otra red o incógnito), pasar Cloudflare Access y confirmar que carga el landing. Si eso está OK, el piloto está listo para enviar.

---

## Referencias

- **Evidencia de terminal:** salida de `pm2 status`, `pm2 logs pilot-tunnel` (Registered tunnel connection, protocol quic).
- **Runbook:** `docs/reports/PILOTO_VPS_PASO_A_PASO.md`
- **Informe de ejecución:** `docs/reports/INFORME_EJECUCION_PILOTO_VPS.md` — conviene actualizar la sección Paso 7 con: comando usado `cloudflared tunnel run aiduxcare-pilot-2026`, evidencia “Registered tunnel connection”, protocol quic.

---

*Estado verificado según evidencia del servidor; no según suposiciones.*
