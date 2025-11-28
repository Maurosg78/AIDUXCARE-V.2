# 🌐 Configuración de Dominio para Testing por Fisioterapeutas

## Objetivo

Configurar `dev.aiduxcare.com` (o `test.aiduxcare.com`) para que los fisioterapeutas puedan:
- ✅ Acceder desde cualquier red (no solo WiFi local)
- ✅ Usar certificado SSL válido (sin instalación manual en iPhone)
- ✅ Recordar URL fácilmente
- ✅ Testing estable y confiable

---

## 🎯 Opción Recomendada: Cloudflare Tunnel

### Ventajas para Testing:
- ✅ **Acceso desde cualquier lugar** (casa, clínica, móvil)
- ✅ **SSL automático** (certificado válido, sin instalación manual)
- ✅ **Dominio real** (`dev.aiduxcare.com`)
- ✅ **Gratis** (Cloudflare Tunnel es gratuito)
- ✅ **Estable** (no depende de IP local)

### Requisitos:
1. Dominio `aiduxcare.com` en Porkbun
2. Cuenta Cloudflare (gratis)
3. Instalar `cloudflared` en tu Mac

---

## 📋 Pasos de Configuración

### 1. Configurar DNS en Porkbun

1. Ve a tu cuenta de Porkbun
2. Selecciona `aiduxcare.com`
3. Agrega registro CNAME:
   - **Name:** `dev` (o `test`)
   - **Value:** `[tu-tunnel-id].cfargotunnel.com`
   - **TTL:** Auto

### 2. Instalar Cloudflare Tunnel

```bash
# Instalar cloudflared
brew install cloudflared

# Autenticarse
cloudflared tunnel login

# Crear túnel
cloudflared tunnel create aiduxcare-dev

# Configurar túnel
cloudflared tunnel route dns aiduxcare-dev dev.aiduxcare.com
```

### 3. Configurar Túnel Local

Crear archivo de configuración: `~/.cloudflared/config.yml`

```yaml
tunnel: [tunnel-id]
credentials-file: /Users/[tu-usuario]/.cloudflared/[tunnel-id].json

ingress:
  - hostname: dev.aiduxcare.com
    service: https://localhost:5174
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

### 4. Iniciar Túnel

```bash
cloudflared tunnel run aiduxcare-dev
```

### 5. Actualizar Scripts del Proyecto

El proyecto incluirá scripts para iniciar todo automáticamente.

---

## 🔄 Alternativa: mkcert con Dominio Real (Solo Red Local)

Si prefieres solo red local pero con dominio real:

### Ventajas:
- ✅ Dominio real (`dev.aiduxcare.com`)
- ✅ Certificado válido (con mkcert instalado)
- ✅ Más rápido (sin túnel)

### Desventajas:
- ❌ Solo funciona en red local
- ❌ Requiere configuración DNS local en cada dispositivo

### Configuración:

1. **Configurar DNS local** (`/etc/hosts` en Mac):
   ```
   127.0.0.1  dev.aiduxcare.com
   ```

2. **Generar certificado con mkcert**:
   ```bash
   mkcert -install
   mkcert dev.aiduxcare.com "*.dev.aiduxcare.com" localhost 127.0.0.1 ::1
   ```

3. **Mover certificados**:
   ```bash
   mv dev.aiduxcare.com+2.pem certs/cert.pem
   mv dev.aiduxcare.com+2-key.pem certs/key.pem
   ```

---

## 🎯 Recomendación Final

**Para testing por fisioterapeutas: Cloudflare Tunnel**

**Razones:**
1. Acceso desde cualquier lugar (no limitado a WiFi local)
2. Certificado SSL válido automático
3. Más profesional y confiable
4. Fácil de compartir URL con fisioterapeutas

---

## 📱 Uso por Fisioterapeutas

Una vez configurado, los fisioterapeutas simplemente:

1. Abren Safari en iPhone
2. Van a: `https://dev.aiduxcare.com`
3. ¡Funciona! (sin instalación de certificados)

---

## 🔧 Scripts del Proyecto

El proyecto incluirá:
- `scripts/setup-cloudflare-tunnel.sh` - Configuración inicial
- `scripts/start-dev-with-tunnel.sh` - Inicia servidor + túnel
- `npm run dev:tunnel` - Comando simple para todo

