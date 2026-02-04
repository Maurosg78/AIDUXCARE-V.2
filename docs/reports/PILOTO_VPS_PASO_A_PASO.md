# Piloto en VPS — Paso a paso con chequeos

**Objetivo:** Mover app + túnel Cloudflare a un servidor siempre encendido (VPS o máquina en oficina) para mayor estabilidad del piloto. Mismo túnel y Cloudflare Access; solo cambia dónde corre la app y cloudflared.

**Tiempo estimado:** 1–3 h la primera vez.  
**Coste orientativo:** 0–6 €/mes (Oracle Free Tier, Hetzner ~5 €, DigitalOcean ~6 USD).

### Orden recomendado (no cambiar)

1. Montar VPS  
2. App estable en 5174  
3. cloudflared + PM2 en VPS (con `--protocol http2`)  
4. Probar desde tu móvil, otra red y ventana incógnito  
5. Verificar que el landing carga rápido y transmite producto, no “internal tool”  
6. **Después** enviar el email (producto y visión, no infra).

---

## Prerrequisitos (antes de empezar)

- [ ] Cuenta en el proveedor elegido (Hetzner, DigitalOcean, Vultr, Oracle Cloud, etc.).
- [ ] Túnel `aiduxcare-pilot-2026` ya existe en Cloudflare; tienes el **tunnel ID** y el **archivo de credenciales** (`.json`) en tu laptop.
- [ ] Repo accesible desde el VPS (GitHub/GitLab con clone por HTTPS o SSH, o acceso a copiar archivos).
- [ ] Variables de entorno del piloto (`.env` o `.env.production`) listas para el servidor (Firebase, etc.); ver `DEPLOY.md`.

---

## Paso 1: Crear el VPS

1. En el panel del proveedor: crear una VM/Droplet.
2. **Recomendado:** Ubuntu 24.04 LTS; mínimo 1 vCPU, 2 GB RAM, 20 GB disco.
3. Añadir tu clave SSH (o guardar la contraseña que te den).
4. Anotar la **IP pública** del servidor.

**Chequeo 1**

- [ ] Puedes hacer `ping <IP>` desde tu laptop (o al menos que el proveedor marque la VM como "running").

---

## Paso 2: Conectar por SSH

```bash
ssh root@<IP>
# o, si creaste usuario: ssh usuario@<IP>
```

Aceptar la huella del host la primera vez.

**Chequeo 2**

- [ ] Entras sin error y ves el prompt del servidor (ej. `root@nombre:~#`).

---

## Paso 3: Instalar Node.js 20

El proyecto usa Node >=20.19 (ver `package.json` → engines).

```bash
# Opción A: NodeSource (recomendado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Opción B: nvm (si prefieres)
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# source ~/.bashrc && nvm install 20 && nvm use 20
```

**Chequeo 3**

- [ ] `node -v` → v20.x.x
- [ ] `npm -v` → 10.x o superior

---

## Paso 4: Clonar repo, instalar deps y build

```bash
# Crear directorio y clonar (sustituir por tu URL de repo)
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/<tu-org>/AIDUXCARE-V.2-clean.git pilot
cd pilot
```

Copiar el `.env` del piloto (crear a mano o subir desde tu laptop):

```bash
nano .env
# Pegar las variables necesarias para el piloto (Firebase, etc.); guardar.
```

Instalar y construir:

```bash
npm ci
npm run build
```

**Chequeo 4**

- [ ] `npm run build` termina sin error.
- [ ] Existe el directorio `dist/` con `index.html` y assets.

---

## Paso 5: Servir la app en el puerto 5174

El túnel actual apunta a `http://localhost:5174`; hay que servir la app en ese puerto.

**Opción A — Una sola sesión (prueba rápida):**

```bash
npx serve dist -p 5174 --single
```

Dejar esa terminal abierta. Para producción, usar Opción B.

**Opción B — Con PM2 (recomendado para “siempre encendido”):**

```bash
sudo npm install -g pm2
cd /var/www/pilot
pm2 start "npx serve dist -p 5174 --single" --name pilot-web
pm2 save
pm2 startup
# Ejecutar el comando que PM2 te muestre (ej. sudo env PATH=... pm2 startup systemd)
```

**Chequeo 5**

- [ ] En el VPS: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5174` → `200` (o similar).
- [ ] Si usas PM2: `pm2 status` muestra `pilot-web` en estado "online".

---

## Paso 6: Instalar cloudflared y copiar credenciales del túnel

En el VPS:

```bash
# Instalar cloudflared (Ubuntu/Debian)
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

Crear la estructura de configuración (misma que en tu laptop):

```bash
mkdir -p ~/.cloudflared
```

Desde **tu laptop**, copiar al VPS el archivo de credenciales y el `config.yml`:

```bash
# En tu laptop (sustituir <IP> y <USUARIO_VPS>)
scp ~/.cloudflared/cd2f67df-73cc-4f60-9154-b7a03a371e70.json <USUARIO_VPS>@<IP>:~/.cloudflared/
scp ~/.cloudflared/config.yml <USUARIO_VPS>@<IP>:~/.cloudflared/
```

Contenido esperado de `~/.cloudflared/config.yml` en el VPS (igual que en laptop):

```yaml
tunnel: cd2f67df-73cc-4f60-9154-b7a03a371e70
credentials-file: /home/<USUARIO_VPS>/.cloudflared/cd2f67df-73cc-4f60-9154-b7a03a371e70.json

ingress:
  - hostname: pilot.aiduxcare.com
    service: http://localhost:5174
  - service: http_status:404
```

Ajustar la ruta `credentials-file` si el usuario del VPS no es el mismo (ej. `/root/` si entraste como root).

**Chequeo 6**

- [ ] En el VPS: `ls -la ~/.cloudflared/` muestra el `.json` y el `config.yml`.
- [ ] `credentials-file` en `config.yml` apunta a la ruta correcta del `.json`.

---

## Paso 7: Ejecutar el túnel

Usar **HTTP/2** en lugar de QUIC evita problemas de UDP en VPS baratos y da conexión más estable.

**Prueba rápida (una sesión):**

```bash
cloudflared tunnel run aiduxcare-pilot-2026 --protocol http2
```

Deberías ver líneas como `Registered tunnel connection` sin errores. Dejar la sesión abierta.

**Para que quede siempre encendido (recomendado):**

```bash
pm2 start "cloudflared tunnel run aiduxcare-pilot-2026 --protocol http2" --name pilot-tunnel
pm2 save
```

**Chequeo 7**

- [ ] Logs de cloudflared muestran al menos una conexión registrada (`Registered tunnel connection`).
- [ ] No hay errores continuos de "network is unreachable" (si los hay, suele ser firewall del VPS o red).

---

## Paso 8: Probar desde fuera (landing sin fricción)

Antes de enviar el email: comprobar que la experiencia transmite **producto y visión**, no “internal tool”.

1. Abrir **https://pilot.aiduxcare.com** desde:
   - tu laptop
   - tu móvil
   - otra red (ej. datos del móvil)
   - ventana incógnito
2. Debe aparecer primero **Cloudflare Access** (email + código); que cargue rápido y sin errores.
3. Tras el código, debe cargar el **landing de AiDuxCare** con algo útil visible (hero, tagline, “pilot environment”); nada que parezca herramienta interna.

**Chequeo 8**

- [ ] Cloudflare Access aparece y, tras el código, se ve el landing/app.
- [ ] No hay errores 502/503 ni cargas lentas.
- [ ] Landing transmite producto; no “internal tool”.

---

## Resumen de chequeos

| Paso | Qué hiciste | Chequeo |
|------|-------------|---------|
| 1 | Crear VPS | VM creada, IP anotada |
| 2 | SSH | Conexión `ssh usuario@<IP>` OK |
| 3 | Node 20 | `node -v` ≥ 20, `npm -v` OK |
| 4 | Repo + build | `dist/` existe, build sin error |
| 5 | Servir app | `curl localhost:5174` → 200, PM2 "online" si aplica |
| 6 | cloudflared + creds | Archivos en `~/.cloudflared/`, config correcto |
| 7 | Túnel | Logs "Registered tunnel connection", PM2 "online" si aplica |
| 8 | Navegador | https://pilot.aiduxcare.com → Access → landing OK |

---

## Mantenimiento rápido

- **Actualizar la app:** en el VPS, `cd /var/www/pilot`, `git pull`, `npm ci`, `npm run build`, luego `pm2 restart pilot-web`.
- **Reiniciar túnel:** `pm2 restart pilot-tunnel`.
- **Ver logs:** `pm2 logs pilot-web` o `pm2 logs pilot-tunnel`.

---

## Antes de enviar el email

- El email es **producto y visión**, no infraestructura.
- No avisar que “el link puede fallar”; no explicar Cloudflare; no justificarse técnicamente.
- Cuando el VPS esté listo y los chequeos 1–8 pasados, enviar con cero dudas.

---

## Referencias

- **Informe de ejecución (evidencia):** `docs/reports/INFORME_EJECUCION_PILOTO_VPS.md` — preflight + pasos en VPS con casillas de evidencia.
- **CTO — Estabilidad del piloto:** `docs/reports/PILOTO_CTO_ESTABILIDAD.md` — cómo evitar desconexiones (PM2, HTTP/2, runbook si pilot no carga).
- Alcance y runbook general: `docs/reports/ALCANCE_PILOTO_RUNBOOK.md`
- Deploy y variables de entorno: `DEPLOY.md`
- Túnel en laptop (config actual): `~/.cloudflared/config.yml`
