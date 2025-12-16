# 🚀 Step-by-Step: Cloudflare Tunnel Setup

**Tiempo estimado:** 30 minutos  
**Dificultad:** Fácil  
**Requisitos:** Terminal Mac, cuenta Cloudflare (gratis)

---

## 📋 Paso 1: Instalar Cloudflare Tunnel (2 minutos)

Abre Terminal y ejecuta:

```bash
# Instalar cloudflared
brew install cloudflared

# Verificar instalación
cloudflared --version
```

**✅ Esperado:** Deberías ver algo como `cloudflared version 2024.x.x`

---

## 📋 Paso 2: Crear cuenta Cloudflare (si no tienes) (3 minutos)

1. Ve a: https://dash.cloudflare.com/sign-up
2. Crea cuenta gratuita (solo email)
3. **NO necesitas transferir el dominio** - solo la cuenta

**✅ Listo cuando:** Puedes acceder al dashboard de Cloudflare

---

## 📋 Paso 3: Login en Cloudflare (2 minutos)

En Terminal, ejecuta:

```bash
cloudflared tunnel login
```

**Lo que pasará:**
1. Se abrirá tu navegador automáticamente
2. Te pedirá seleccionar un dominio
3. Si no tienes dominio en Cloudflare, selecciona cualquier opción (puedes usar el dominio de Porkbun)
4. Autoriza el acceso
5. Vuelve a Terminal

**✅ Esperado:** Deberías ver `Successfully logged in.`

**⚠️ Nota:** Si tu dominio está en Porkbun (no Cloudflare), igual puedes hacer login. Cloudflare Tunnel funciona independientemente.

---

## 📋 Paso 4: Crear el Tunnel (2 minutos)

```bash
cloudflared tunnel create aiduxcare-dev
```

**✅ Esperado:**
```
Created tunnel aiduxcare-dev with id [TUNNEL-ID-LARGO]
```

**⚠️ IMPORTANTE:** Copia el `[TUNNEL-ID-LARGO]` - lo necesitarás después.

**Ejemplo de output:**
```
Created tunnel aiduxcare-dev with id abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

---

## 📋 Paso 5: Configurar DNS en Porkbun (5 minutos)

### Opción A: Configuración Manual en Porkbun

1. **Login a Porkbun:** https://porkbun.com/account/login
2. **Selecciona dominio:** `aiduxcare.com`
3. **Ve a DNS Records**
4. **Agrega nuevo registro:**
   - **Type:** `CNAME`
   - **Host:** `dev` (solo "dev", sin punto)
   - **Answer:** `[TUNNEL-ID-LARGO].cfargotunnel.com`
     - Reemplaza `[TUNNEL-ID-LARGO]` con el ID que copiaste en Paso 4
   - **TTL:** `300` (o Auto)
5. **Save**

**Ejemplo:**
```
Type: CNAME
Host: dev
Answer: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz.cfargotunnel.com
TTL: 300
```

### Opción B: Configuración Automática (si funciona)

```bash
# Reemplaza [TUNNEL-ID] con tu tunnel ID del Paso 4
cloudflared tunnel route dns aiduxcare-dev dev.aiduxcare.com
```

**⚠️ Nota:** Esta opción solo funciona si Cloudflare puede gestionar tu DNS. Si tu dominio está en Porkbun, usa Opción A.

**✅ Esperado:** DNS propagado en 1-5 minutos (puedes verificar con `dig dev.aiduxcare.com`)

---

## 📋 Paso 6: Configurar el Tunnel (5 minutos)

### 6.1: Obtener el Tunnel ID

```bash
# Listar todos los tunnels
cloudflared tunnel list
```

**Busca:** `aiduxcare-dev` y copia su ID (primera columna)

### 6.2: Crear archivo de configuración

```bash
# Crear directorio si no existe
mkdir -p ~/.cloudflared

# Obtener Tunnel ID automáticamente
TUNNEL_ID=$(cloudflared tunnel list | grep aiduxcare-dev | awk '{print $1}')

# Crear archivo de configuración
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: dev.aiduxcare.com
    service: https://localhost:5174
    originRequest:
      noTLSVerify: true
  - service: http_status:404
EOF
```

**✅ Verificar configuración:**

```bash
# Validar configuración
cloudflared tunnel ingress validate
```

**✅ Esperado:** `Configuration is valid.`

---

## 📋 Paso 7: Probar el Tunnel (5 minutos)

### 7.1: Iniciar servidor de desarrollo (Terminal 1)

```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
npm run dev:https
```

**Espera a ver:** `Local: https://localhost:5174/`

### 7.2: Iniciar Tunnel (Terminal 2)

Abre una **nueva terminal** y ejecuta:

```bash
cloudflared tunnel run aiduxcare-dev
```

**✅ Esperado:**
```
2025-11-20T... INF Starting metrics server
2025-11-20T... INF +--------------------------------------------------------------------------------------------+
2025-11-20T... INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2025-11-20T... INF |  https://dev.aiduxcare.com                                                                    |
2025-11-20T... INF +--------------------------------------------------------------------------------------------+
```

### 7.3: Probar acceso

1. **Espera 30 segundos** (para que el tunnel se conecte)
2. **Abre navegador:** `https://dev.aiduxcare.com`
3. **Deberías ver:** La aplicación AiduxCare cargando

**✅ Si funciona:** ¡Configuración completa!

**❌ Si no funciona:** Ve a Troubleshooting abajo

---

## 📋 Paso 8: Configurar para uso diario (3 minutos)

### 8.1: Actualizar .env.local

```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2

# Actualizar VITE_DEV_PUBLIC_URL
sed -i '' "s|^VITE_DEV_PUBLIC_URL=.*|VITE_DEV_PUBLIC_URL=https://dev.aiduxcare.com|" .env.local

# Verificar
grep VITE_DEV_PUBLIC_URL .env.local
```

**✅ Esperado:** `VITE_DEV_PUBLIC_URL=https://dev.aiduxcare.com`

### 8.2: Probar script automatizado

El proyecto ya tiene un script que hace todo automáticamente:

```bash
# Detener procesos anteriores (Ctrl+C en ambas terminales)

# Iniciar todo con un comando
npm run dev:tunnel
```

**✅ Esto debería:**
1. Actualizar URL automáticamente
2. Iniciar servidor Vite
3. Iniciar Cloudflare Tunnel
4. Mostrar ambas URLs (local + pública)

---

## ✅ Validación Final (5 minutos)

### Checklist:

- [ ] `https://dev.aiduxcare.com` carga en navegador
- [ ] SSL es válido (candado verde, sin warnings)
- [ ] La aplicación funciona correctamente
- [ ] Puedes acceder desde iPhone (red diferente)
- [ ] Múltiples dispositivos pueden acceder simultáneamente

### Prueba desde iPhone:

1. **Conecta iPhone a datos móviles** (NO WiFi local)
2. **Abre Safari**
3. **Ve a:** `https://dev.aiduxcare.com`
4. **Debería cargar** sin necesidad de instalar certificados

**✅ Si todo funciona:** ¡Configuración completa y lista para testing!

---

## 🔧 Troubleshooting

### Problema: "Tunnel not found"

```bash
# Verificar que el tunnel existe
cloudflared tunnel list

# Si no existe, recrear:
cloudflared tunnel create aiduxcare-dev
```

### Problema: "DNS not resolving"

```bash
# Verificar DNS
dig dev.aiduxcare.com

# Si no resuelve, espera 5 minutos (propagación DNS)
# O verifica configuración en Porkbun
```

### Problema: "Connection refused"

```bash
# Verificar que servidor está corriendo
lsof -i :5174

# Si no está corriendo:
npm run dev:https
```

### Problema: "SSL certificate error"

- Cloudflare Tunnel proporciona SSL automáticamente
- Si ves error, verifica que el tunnel está corriendo:
  ```bash
  cloudflared tunnel run aiduxcare-dev
  ```

### Problema: "Tunnel ID not found"

```bash
# Obtener Tunnel ID manualmente
cloudflared tunnel list

# Copiar el ID de la columna "ID"
# Editar manualmente ~/.cloudflared/config.yml
nano ~/.cloudflared/config.yml
```

---

## 🎯 Uso Diario

### Iniciar desarrollo con tunnel:

```bash
npm run dev:tunnel
```

**Esto hace todo automáticamente:**
- ✅ Actualiza `VITE_DEV_PUBLIC_URL`
- ✅ Inicia servidor Vite en `https://localhost:5174`
- ✅ Inicia Cloudflare Tunnel
- ✅ Expone `https://dev.aiduxcare.com`

### Compartir con testers:

Simplemente comparte: **`https://dev.aiduxcare.com`**

No necesitan:
- ❌ Instalar certificados
- ❌ Estar en misma red WiFi
- ❌ Configurar nada

---

## 📞 Soporte

**Documentación adicional:**
- `docs/north/DOMAIN_SETUP_FOR_TESTING.md` - Guía técnica
- `docs/north/IMPLEMENTATION_PLAN_SSL_TUNNEL.md` - Plan detallado
- `docs/north/TESTING_SETUP_FOR_PHYSIOTHERAPISTS.md` - Para testers

**Comandos útiles:**
```bash
# Ver todos los tunnels
cloudflared tunnel list

# Ver configuración actual
cat ~/.cloudflared/config.yml

# Validar configuración
cloudflared tunnel ingress validate

# Ver logs del tunnel
cloudflared tunnel run aiduxcare-dev --loglevel debug
```

---

**✅ Setup completo cuando:**
- `https://dev.aiduxcare.com` funciona desde cualquier dispositivo
- SSL es válido (sin warnings)
- Puedes acceder desde iPhone en red diferente

**🎉 ¡Listo para testing escalable!**

