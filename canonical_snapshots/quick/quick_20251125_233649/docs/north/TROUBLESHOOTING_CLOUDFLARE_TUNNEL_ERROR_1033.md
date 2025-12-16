# 🔧 Troubleshooting: Cloudflare Tunnel Error 1033

**Date:** November 21, 2025  
**Status:** ✅ **DOCUMENTED**  
**Priority:** 🔴 **CRITICAL** - Blocks access to dev.aiduxcare.com

---

## 🐛 ERROR REPORTADO

**Error 1033: Cloudflare Tunnel error**

```
You've requested a page on a website (dev.aiduxcare.com) that is on the Cloudflare network. 
The host (dev.aiduxcare.com) is configured as an Cloudflare Tunnel, and Cloudflare is 
currently unable to resolve it.
```

---

## 🔍 CAUSAS COMUNES

### **1. cloudflared no está corriendo**
- El proceso `cloudflared tunnel run` no está activo
- El tunnel se detuvo inesperadamente
- No se inició después de reiniciar el servidor

### **2. Servidor local no responde**
- Vite no está corriendo en `localhost:5174`
- El servidor se detuvo pero el tunnel sigue intentando conectarse
- Puerto 5174 está ocupado por otro proceso

### **3. Configuración del tunnel incorrecta**
- El tunnel no está configurado correctamente
- El archivo `config.yml` tiene errores
- DNS no está apuntando correctamente

---

## ✅ SOLUCIONES

### **Solución 1: Reiniciar todo (Recomendado)**

```bash
# 1. Detener procesos actuales
# Busca terminales con vite o cloudflared y presiona Ctrl+C

# 2. Reiniciar todo
npm run dev:tunnel

# 3. Esperar 5-10 segundos

# 4. Verificar acceso
curl -I https://dev.aiduxcare.com
```

**Esto iniciará:**
- Servidor Vite en `localhost:5174`
- Cloudflare Tunnel conectado
- SSL válido automáticamente

---

### **Solución 2: Verificar procesos**

```bash
# Verificar si cloudflared está corriendo
ps aux | grep cloudflared | grep -v grep

# Verificar si Vite está corriendo
ps aux | grep vite | grep -v grep

# Verificar si el servidor local responde
curl -I http://localhost:5174
```

**Si falta alguno:**
- Reinicia con `npm run dev:tunnel`

---

### **Solución 3: Verificar configuración del tunnel**

```bash
# Listar tunnels configurados
cloudflared tunnel list

# Debería mostrar: aiduxcare-dev

# Verificar configuración
cat ~/.cloudflared/config.yml
```

**Si el tunnel no existe:**
```bash
npm run setup:tunnel
```

---

### **Solución 4: Verificar DNS**

```bash
# Verificar resolución DNS
dig dev.aiduxcare.com

# Debería mostrar CNAME apuntando al tunnel
```

**Si DNS no está configurado:**
- Verifica en Cloudflare Dashboard
- Verifica en Porkbun (si usas nameservers de Porkbun)

---

## 🧪 VERIFICACIÓN POST-FIX

### **Checklist de verificación:**

1. ✅ **cloudflared corriendo:**
   ```bash
   ps aux | grep cloudflared | grep -v grep
   ```
   Debería mostrar: `cloudflared tunnel run aiduxcare-dev`

2. ✅ **Vite corriendo:**
   ```bash
   ps aux | grep vite | grep -v grep
   ```
   Debería mostrar: `node node_modules/vite/bin/vite.js`

3. ✅ **Servidor local responde:**
   ```bash
   curl -I http://localhost:5174
   ```
   Debería devolver: `HTTP/1.1 200 OK`

4. ✅ **Tunnel accesible:**
   ```bash
   curl -I https://dev.aiduxcare.com
   ```
   Debería devolver: `HTTP/2 200`

---

## 📋 PASOS DE DIAGNÓSTICO

### **Paso 1: Verificar procesos**
```bash
ps aux | grep -E "(vite|cloudflared)" | grep -v grep
```

### **Paso 2: Verificar servidor local**
```bash
curl -I http://localhost:5174
```

### **Paso 3: Verificar tunnel**
```bash
cloudflared tunnel list
```

### **Paso 4: Verificar logs**
```bash
# Logs de Vite (si usas dev:tunnel)
tail -f /tmp/vite.log

# Logs de Tunnel (si usas dev:tunnel)
tail -f /tmp/tunnel.log
```

---

## 🎯 PREVENCIÓN

### **Mejores prácticas:**

1. **Usar `npm run dev:tunnel` siempre**
   - Inicia ambos servicios correctamente
   - Maneja logs apropiadamente
   - Facilita debugging

2. **Verificar antes de cerrar terminales**
   - Asegúrate de que ambos procesos están corriendo
   - Usa `ps aux | grep` para verificar

3. **Reiniciar después de cambios importantes**
   - Después de cambios en configuración
   - Después de actualizar dependencias
   - Si notas comportamiento extraño

---

## 🔍 LOGS ÚTILES

### **Ver logs en tiempo real:**

```bash
# Si usas npm run dev:tunnel, los logs están en:
tail -f /tmp/vite.log
tail -f /tmp/tunnel.log

# Si corres procesos manualmente, los logs están en la terminal
```

### **Errores comunes en logs:**

1. **"tunnel not found"**
   - Solución: `npm run setup:tunnel`

2. **"connection refused"**
   - Solución: Verificar que Vite está corriendo en puerto 5174

3. **"DNS resolution failed"**
   - Solución: Verificar configuración DNS en Cloudflare

---

## 📝 NOTAS TÉCNICAS

### **Cómo funciona el tunnel:**

1. Cloudflare recibe request en `dev.aiduxcare.com`
2. Cloudflare busca el tunnel `aiduxcare-dev`
3. Cloudflare se conecta a `cloudflared` corriendo localmente
4. `cloudflared` reenvía el request a `localhost:5174`
5. Vite procesa el request y devuelve respuesta
6. Respuesta viaja de vuelta a través del tunnel

### **Por qué falla:**

- Si `cloudflared` no está corriendo → Error 1033
- Si Vite no está corriendo → Error 502
- Si DNS no está configurado → Error DNS

---

**Status:** ✅ **DOCUMENTED**

