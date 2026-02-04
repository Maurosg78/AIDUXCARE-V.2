# CTO — Estabilidad del piloto (sin desconexiones evitables)

**Responsable:** CTO de esta parte del proyecto.  
**Objetivo:** Que el piloto en **https://pilot.aiduxcare.com** corra sin interrupciones evitables. No hay SLA formal; el compromiso es aplicar las medidas siguientes y reaccionar rápido si algo falla.

---

## 1. Decisiones de diseño (por qué no deberíamos desconectar)

| Decisión | Motivo |
|----------|--------|
| **Piloto en VPS, no en laptop** | Elimina el punto único de fallo (dormir, cambio de red, apagado). |
| **Túnel con `--protocol http2`** | Evita QUIC/UDP y problemas de red en VPS baratos; conexión más estable que en laptop. |
| **App + túnel bajo PM2** | Reinicio automático si un proceso se cae; no depende de una sesión SSH abierta. |
| **Un solo túnel, un solo hostname** | Menos superficie de fallo; Cloudflare Access sigue igual. |

---

## 2. Garantías operativas en el VPS

### 2.1 PM2: reinicio automático

- **App (`pilot-web`):** Si el proceso que sirve `dist` en el puerto 5174 muere, PM2 lo reinicia.
- **Túnel (`pilot-tunnel`):** Si `cloudflared` se cae o pierde conexión, PM2 lo reinicia.

Configuración recomendada (ya aplicada si seguiste el paso a paso):

```bash
# Tras iniciar los procesos:
pm2 save
pm2 startup
```

PM2 por defecto reintenta indefinidamente. No tocar `max_restarts` a menos que quieras limitar reintentos (para el piloto, dejar por defecto está bien).

### 2.2 Comprobar que PM2 persiste tras reinicio del servidor

- Tras `pm2 startup`, el comando que PM2 muestra (ej. `sudo env PATH=... pm2 startup systemd`) hace que los procesos se levanten al arrancar el VPS.
- **Chequeo:** Reiniciar el VPS una vez y verificar que `pm2 list` muestra `pilot-web` y `pilot-tunnel` en "online" tras el reinicio.

---

## 3. Monitoreo mínimo (detectar desconexión pronto)

### 3.1 Comprobación manual (recomendada al menos 1–2 veces por semana en piloto)

- Abrir **https://pilot.aiduxcare.com** (o hacer `curl -s -o /dev/null -w "%{http_code}" https://pilot.aiduxcare.com`).
- Si responde 200 (o 302 hacia Access y luego 200), está bien.
- Si timeout, 502, 503 o "connection refused": ir al runbook (sección 5).

### 3.2 Comprobación automática (opcional)

Si quieres aviso cuando el piloto deje de responder, puedes usar un **health check externo** que haga GET a https://pilot.aiduxcare.com cada X minutos y te avise si falla (ej. UptimeRobot, Better Uptime, o un cron en otro servidor que envíe un mensaje a Slack/email). Para un piloto de pocas semanas, no es obligatorio; para más tranquilidad, sí.

---

## 4. Runbook: “pilot.aiduxcare.com no carga”

Cuando alguien reporte que el link no carga o que hay desconexión:

1. **Comprobar desde fuera:** Abrir https://pilot.aiduxcare.com en el navegador (o desde el móvil en datos). Si carga, puede ser un problema local del usuario; si no carga, seguir.
2. **Conectar al VPS:** `ssh <usuario>@<IP_VPS>`.
3. **Estado de los procesos:**
   ```bash
   pm2 list
   ```
   - Si `pilot-web` o `pilot-tunnel` están en "errored" o "stopped", reiniciar:
   ```bash
   pm2 restart pilot-web
   pm2 restart pilot-tunnel
   pm2 save
   ```
4. **Ver logs recientes:**
   ```bash
   pm2 logs pilot-tunnel --lines 50
   pm2 logs pilot-web --lines 30
   ```
   - Buscar "network is unreachable", "connection refused", "ECONNRESET". Si el túnel se cae por red, PM2 ya lo habrá reiniciado; si sigue fallando, revisar red/firewall del VPS o estado de Cloudflare.
5. **Comprobar que la app responde en el VPS:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:5174
   ```
   - Debe ser 200. Si no, el problema es la app (reiniciar `pilot-web`, revisar `dist/` y variables de entorno).
6. **Si tras reinicios sigue sin funcionar:** Revisar panel del proveedor del VPS (VM apagada, red caída, mantenimiento) y estado de Cloudflare (status.cloudflare.com). Documentar el incidente (fecha, síntomas, pasos hechos, cierre).

---

## 5. Límites (qué no garantizamos, pero sí mitigamos)

- **Caída del proveedor del VPS** (red, datacenter, mantenimiento): No está bajo nuestro control; mitigación = elegir proveedor estable y tener el runbook claro para cuando vuelva.
- **Caída de Cloudflare:** Poco frecuente; mitigación = comprobar status.cloudflare.com y esperar o escalar según runbook.
- **Despliegue o cambio de código** que rompa la app: Mitigación = probar en local o staging antes de `git pull` + build + `pm2 restart pilot-web` en el VPS.

No prometemos “cero segundos de caída”; sí nos aseguramos de que **no haya desconexiones evitables** (laptop apagada, proceso muerto sin reinicio, túnel en QUIC inestable) y de **reaccionar con un runbook claro** si algo falla.

---

## 6. Resumen de compromiso CTO

- Piloto corre en **VPS** con **app + túnel en PM2** y túnel en **HTTP/2**.
- **Reinicio automático** ante caída de proceso; **persistencia** tras reinicio del servidor (pm2 startup).
- **Monitoreo mínimo:** comprobación manual 1–2 veces por semana (o health check externo opcional).
- **Runbook único** para “pilot no carga”: SSH → pm2 list / restart / logs → curl localhost:5174 → escalar si persiste.
- **Documentar** cada incidente (fecha, causa, resolución) para mejorar en el siguiente ciclo.

Referencias: `PILOTO_VPS_PASO_A_PASO.md`, `ALCANCE_PILOTO_RUNBOOK.md`.
