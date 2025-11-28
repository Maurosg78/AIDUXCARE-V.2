# 🔍 VERIFICACIÓN DE CREDENCIALES TWILIO

**Error:** 20003 - Authentication Error - invalid username

## ⚠️ PROBLEMA DETECTADO

El Account SID actual tiene **33 caracteres** cuando normalmente debería tener **34 caracteres**.

**Account SID actual:** `AC80346140c5f9f3ec4f186654cbde47B`

## ✅ PASOS PARA VERIFICAR

### **1. Verificar en Twilio Console:**

1. Ve a: https://console.twilio.com/
2. Login con tu cuenta
3. Ve a: **Account** → **Settings** → **General**
4. Verifica:
   - **Account SID** (debe tener 34 caracteres, empezar con "AC", terminar en minúscula)
   - **Auth Token** (debe tener 32 caracteres)

### **2. Posibles Problemas:**

- ❌ Account SID copiado incompleto (falta 1 carácter)
- ❌ Account SID tiene espacio extra
- ❌ Usando credenciales de Test Account con Live Account
- ❌ Auth Token incorrecto o expirado

### **3. Formato Correcto:**

**Account SID:**
- Longitud: **34 caracteres**
- Formato: `AC` + 32 caracteres alfanuméricos
- Ejemplo: `AC[REDACTED]` (34 chars, formato: AC + 32 caracteres)

**Auth Token:**
- Longitud: **32 caracteres**
- Formato: 32 caracteres hexadecimales
- Ejemplo: `a12ffe32a3c8df36604cd19c0a19fb2a` (32 chars)

### **4. Actualizar .env.local:**

Una vez verifiques las credenciales correctas en Twilio Console:

```bash
# Editar .env.local y actualizar:
VITE_TWILIO_ACCOUNT_SID=AC... (34 caracteres completos)
VITE_TWILIO_AUTH_TOKEN=... (32 caracteres completos)
VITE_TWILIO_PHONE_NUMBER=+1647YYYYYY (número comprado)
```

### **5. Verificar Número Twilio:**

1. Ve a: **Phone Numbers** → **Manage** → **Active numbers**
2. Verifica que el número `+1647YYYYYY` esté activo
3. Verifica que tenga capacidad de **SMS**

## 🧪 DESPUÉS DE ACTUALIZAR

Ejecuta de nuevo:
```bash
npm run test:sms
```

---

**Última actualización:** Noviembre 16, 2025

