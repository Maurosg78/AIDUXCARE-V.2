# WO-09: Cloudflare Tunnel Setup Guide

**Fecha**: 2026-01-14  
**Estado**: 🟡 EN PROGRESO (Requiere pasos manuales)

---

## 📋 PASOS A EJECUTAR

### STEP 1: Instalar Cloudflared

```bash
brew install cloudflared
```

Verificar:
```bash
cloudflared --version
```

---

### STEP 2: Autenticación (MANUAL - Requiere navegador)

```bash
cloudflared tunnel login
```

**Acción requerida:**
- Se abrirá el navegador
- Autenticar con cuenta Cloudflare que gestiona `aiduxcare.com`
- Autorizar el dominio

---

### STEP 3: Crear Tunnel

```bash
cloudflared tunnel create aiduxcare-pilot-2026
```

**Salida esperada:**
- Tunnel ID (UUID)
- Archivo JSON creado en `~/.cloudflared/`

Ver túneles:
```bash
cloudflared tunnel list
```

**⚠️ IMPORTANTE:** Copiar el Tunnel ID para el siguiente paso.

---

### STEP 4: Configurar Tunnel

**Reemplazar `TUNNEL_ID_AQUÍ` con el UUID real del paso anterior:**

```bash
cat > ~/.cloudflared/config.yml << EOF
tunnel: TUNNEL_ID_AQUÍ
credentials-file: /Users/mauriciosobarzo/.cloudflared/TUNNEL_ID_AQUÍ.json

ingress:
  - hostname: pilot.aiduxcare.com
    service: http://localhost:5174
  - service: http_status:404
EOF
```

---

### STEP 5: Configurar DNS (MANUAL - Cloudflare Dashboard)

En **Cloudflare Dashboard → DNS**:

1. Agregar nuevo registro:
   - **Type:** CNAME
   - **Name:** `pilot`
   - **Target:** `TUNNEL_ID_AQUÍ.cfargotunnel.com` (usar el UUID real)
   - **Proxy:** 🟠 Proxied (ON)
   - **TTL:** Auto

2. Guardar

**⚠️ NO usar A record, solo CNAME.**

---

### STEP 6: Ejecutar Tunnel (Testing)

**Con `pnpm dev` corriendo en otra terminal:**

```bash
cloudflared tunnel run aiduxcare-pilot-2026
```

**Esperado:**
- Tunnel conectado
- Logs mostrando conexión
- Sin errores

**Luego abrir en navegador:**
```
https://pilot.aiduxcare.com
```

Debe cargar la app (login / home).

---

### STEP 7: Instalar como Servicio (Opcional pero Recomendado)

```bash
cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```

Verificar:
```bash
launchctl list | grep cloudflared
```

---

## 🧪 VALIDACIÓN

### Test 1: HTTP Status

```bash
curl -I https://pilot.aiduxcare.com
```

**Esperado:**
```
HTTP/2 200
```

### Test 2: Navegador

Abrir: `https://pilot.aiduxcare.com`

**Verificar:**
- ✅ Login funciona
- ✅ Dashboards cargan (`/dashboard/tech`, `/dashboard/growth`)
- ✅ Sin mixed content warnings
- ✅ HTTPS válido (certificado Cloudflare)

---

## 📝 NOTAS IMPORTANTES

1. **Tunnel ID**: Se obtiene después de `cloudflared tunnel create`
2. **DNS Propagation**: Puede tardar 1-5 minutos después de configurar CNAME
3. **Dev Server**: Debe estar corriendo en `localhost:5174` para que el tunnel funcione
4. **Service**: Si instalas como servicio, el tunnel corre en background automáticamente

---

## ✅ DEFINITION OF DONE

- [ ] Tunnel creado (`aiduxcare-pilot-2026`)
- [ ] DNS configurado (CNAME `pilot` → `TUNNEL_ID.cfargotunnel.com`)
- [ ] `pilot.aiduxcare.com` accesible por HTTPS
- [ ] Dev server accesible sin IP pública
- [ ] Tunnel estable (foreground o servicio)
- [ ] Login funciona desde URL pública
- [ ] Dashboards accesibles desde URL pública

---

## 🚨 TROUBLESHOOTING

### Error: "Tunnel not found"
**Solución:** Verificar que el tunnel existe:
```bash
cloudflared tunnel list
```

### Error: "DNS not configured"
**Solución:** Verificar en Cloudflare Dashboard que el CNAME existe y está Proxied

### Error: "Connection refused"
**Solución:** Asegurar que `pnpm dev` está corriendo en `localhost:5174`

### Error: "Certificate error"
**Solución:** Esperar 1-2 minutos para propagación DNS y certificado SSL

---

**WO-09: Configuración lista, pendiente ejecución manual de pasos 2, 3, 5**



