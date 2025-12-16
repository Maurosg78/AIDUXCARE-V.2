# 🔒 SSL: localhost vs dev.aiduxcare.com

**Date:** November 21, 2025  
**Status:** ✅ **DOCUMENTED**  
**Priority:** 🟡 **INFORMATIONAL**

---

## 🐛 PROBLEMA COMÚN

Al acceder a `https://localhost:5174`, Chrome muestra:
- **Error:** `NET::ERR_CERT_AUTHORITY_INVALID`
- **Mensaje:** "La conexión no es privada"
- **Causa:** Certificado autofirmado no es confiable para Chrome

---

## ✅ SOLUCIÓN: Usar dev.aiduxcare.com

### **Por qué usar dev.aiduxcare.com:**

1. **SSL válido de Cloudflare**
   - Certificado emitido por Cloudflare
   - Confiable para todos los navegadores
   - Sin advertencias de seguridad

2. **Funciona en todos los dispositivos**
   - iPhone Safari ✅
   - Android Chrome ✅
   - Desktop browsers ✅
   - Sin instalación de certificados

3. **Mejor para testing**
   - Simula entorno de producción
   - Sin problemas de certificados
   - Accesible desde cualquier red

---

## 🔧 OPCIONES DE ACCESO

### **Opción 1: dev.aiduxcare.com (Recomendado)**

```
URL: https://dev.aiduxcare.com
SSL: ✅ Válido (Cloudflare)
Dispositivos: ✅ Todos
```

**Ventajas:**
- SSL válido automáticamente
- Sin errores de certificado
- Funciona en iPhone, Android, Desktop
- Mejor para testing con fisioterapeutas

**Cuándo usar:**
- Testing en dispositivos móviles
- Testing con usuarios externos
- Desarrollo normal
- Cualquier situación donde necesites SSL válido

---

### **Opción 2: localhost:5174 (Solo desarrollo local)**

```
URL: https://localhost:5174
SSL: ⚠️ Autofirmado (requiere aceptación)
Dispositivos: ⚠️ Solo máquina local
```

**Ventajas:**
- Acceso directo sin tunnel
- Útil para desarrollo rápido

**Desventajas:**
- Chrome muestra advertencia de seguridad
- Requiere aceptar certificado manualmente
- No funciona en dispositivos móviles
- No recomendado para testing

**Cómo aceptar certificado (solo desarrollo):**
1. En Chrome: Click "Opciones avanzadas"
2. Click "Continuar a localhost (no seguro)"
3. Chrome recordará tu elección para esta sesión

**Cuándo usar:**
- Desarrollo rápido local
- Debugging sin tunnel
- Cuando Cloudflare Tunnel no está disponible

---

## 🎯 RECOMENDACIÓN

### **Para desarrollo normal:**
```
✅ Usa: https://dev.aiduxcare.com
```

### **Para testing con fisioterapeutas:**
```
✅ Usa: https://dev.aiduxcare.com
```

### **Para desarrollo rápido local:**
```
⚠️ Puedes usar: https://localhost:5174
   (acepta el certificado manualmente)
```

---

## 📋 VERIFICACIÓN

### **Verificar que dev.aiduxcare.com funciona:**

```bash
curl -I https://dev.aiduxcare.com
```

**Resultado esperado:**
```
HTTP/2 200
server: cloudflare
...
```

### **Verificar que tunnel está corriendo:**

```bash
ps aux | grep cloudflared
```

**Resultado esperado:**
```
cloudflared tunnel run aiduxcare-dev
```

---

## 🔍 TROUBLESHOOTING

### **Problema: dev.aiduxcare.com no carga**

1. Verificar que tunnel está corriendo:
   ```bash
   ps aux | grep cloudflared
   ```

2. Verificar que servidor Vite está corriendo:
   ```bash
   ps aux | grep vite
   ```

3. Reiniciar servicios:
   ```bash
   npm run dev:tunnel
   ```

### **Problema: localhost:5174 muestra error SSL**

**Solución 1 (Recomendado):** Usa `dev.aiduxcare.com` en su lugar

**Solución 2 (Solo desarrollo):** Acepta el certificado manualmente en Chrome

---

## 📝 NOTAS TÉCNICAS

### **Por qué localhost tiene certificado autofirmado:**

- Vite genera certificado autofirmado para HTTPS local
- Navegadores no confían en certificados autofirmados por defecto
- Esto es comportamiento de seguridad normal

### **Por qué dev.aiduxcare.com tiene SSL válido:**

- Cloudflare Tunnel maneja SSL automáticamente
- Cloudflare tiene certificados válidos emitidos por autoridades reconocidas
- Navegadores confían en certificados de Cloudflare automáticamente

---

**Status:** ✅ **DOCUMENTED**

