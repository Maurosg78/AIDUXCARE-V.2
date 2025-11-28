# 🚀 DEPLOYMENT VIA GOOGLE CLOUD CONSOLE

**Método:** Google Cloud Console (más directo que Firebase Console)  
**Tiempo estimado:** 10 minutos

---

## 🎯 **PASO 1: ABRIR GOOGLE CLOUD CONSOLE**

### **URL Directa:**
```
https://console.cloud.google.com/functions/list?project=aiduxcare-v2-uat-dev
```

O navega manualmente:
1. Ve a: https://console.cloud.google.com
2. Selecciona proyecto: `aiduxcare-v2-uat-dev`
3. Busca "Cloud Functions" en el menú
4. Click en "Cloud Functions"

---

## 🔧 **PASO 2: CREAR monthlyTokenReset**

### **2.1 Click en "CREATE FUNCTION"**

### **2.2 Configuración Básica:**

#### **A. Environment:**
- Selecciona: **"2nd gen"** (segunda generación)
- ⚠️ **IMPORTANTE:** No selecciones "1st gen"

#### **B. Function Name:**
- **Name:** `monthlyTokenReset`

#### **C. Region:**
- **Region:** `northamerica-northeast1` (Montreal)
- ⚠️ **CRÍTICO:** Debe ser esta región para PHIPA

#### **D. Trigger Type:**
- Selecciona: **"Cloud Scheduler"**
- **Schedule:** `0 0 1 * *`
- **Timezone:** `America/Toronto`
- **Description:** `Monthly token reset for professional users`

#### **E. Runtime:**
- **Runtime:** `Node.js 20`
- **Entry point:** `monthlyTokenReset`

#### **F. Memory and Timeout:**
- **Memory:** `512 MB`
- **Timeout:** `540 seconds`

#### **G. Source Code:**
- Selecciona: **"Inline editor"**
- **Código:** Copia TODO desde `docs/north/SPRINT2A_DAY3_CODIGO_COMPLETO.md`
- **Dependencies (package.json):**
  ```json
  {
    "dependencies": {
      "firebase-admin": "^12.7.0",
      "firebase-functions": "^4.9.0"
    }
  }
  ```

### **2.3 Deploy:**
1. Click en **"DEPLOY"** o **"CREAR"**
2. Espera 3-5 minutos
3. Verás: **"Function deployed successfully"**

---

## 🔧 **PASO 3: CREAR manualTokenReset**

### **3.1 Click en "CREATE FUNCTION" nuevamente**

### **3.2 Configuración:**

#### **A. Environment:**
- **2nd gen**

#### **B. Function Name:**
- **Name:** `manualTokenReset`

#### **C. Region:**
- **Region:** `northamerica-northeast1`

#### **D. Trigger Type:**
- Selecciona: **"HTTPS"**
- **Authentication:** ✅ **"Require authentication"** (marcado)
- **Allow unauthenticated invocations:** ❌ NO marcado

#### **E. Runtime:**
- **Runtime:** `Node.js 20`
- **Entry point:** `manualTokenReset`

#### **F. Memory and Timeout:**
- **Memory:** `512 MB`
- **Timeout:** `540 seconds`

#### **G. Source Code:**
- **Inline editor**
- **Código:** Mismo código completo (ambas funciones están en el mismo archivo)

### **3.3 Deploy:**
1. Click en **"DEPLOY"**
2. Espera 3-5 minutos

---

## ✅ **PASO 4: VERIFICACIÓN**

### **4.1 En Google Cloud Console:**
Deberías ver ambas funciones en la lista:
```
monthlyTokenReset  | northamerica-northeast1 | Cloud Scheduler | ✅
manualTokenReset   | northamerica-northeast1 | HTTPS           | ✅
```

### **4.2 Con Firebase CLI:**
```bash
firebase functions:list --project aiduxcare-v2-uat-dev | grep -i token
```

**Resultado esperado:**
```
monthlyTokenReset  | schedule | northamerica-northeast1 | ✅
manualTokenReset   | callable | northamerica-northeast1 | ✅
```

---

## 🧪 **PASO 5: TESTING**

### **5.1 Test manualTokenReset:**

1. En Google Cloud Console, click en `manualTokenReset`
2. Ve a la pestaña **"TESTING"** o **"TEST"**
3. En el campo de entrada, escribe:
   ```json
   {}
   ```
4. Click en **"TEST THE FUNCTION"**
5. **Resultado esperado:**
   ```json
   {
     "success": true,
     "usersReset": 0,
     "message": "No active users found"
   }
   ```

### **5.2 Verificar Schedule:**

1. Click en `monthlyTokenReset`
2. Ve a la pestaña **"TRIGGER"** o **"CONFIGURATION"**
3. Verifica:
   - ✅ Schedule: `0 0 1 * *`
   - ✅ Timezone: `America/Toronto`
   - ✅ Region: `northamerica-northeast1`

---

## ⚠️ **TROUBLESHOOTING**

### **Problema: "Function failed to deploy"**
- Verifica que el código está completo
- Revisa los logs de deployment
- Asegúrate de que `package.json` tiene las dependencias correctas

### **Problema: "Entry point not found"**
- Verifica que el código exporta `exports.monthlyTokenReset` y `exports.manualTokenReset`
- Verifica que el nombre del entry-point coincide con el export

### **Problema: "Region not available"**
- Verifica que la región `northamerica-northeast1` está habilitada
- Lista regiones: https://console.cloud.google.com/functions/list?project=aiduxcare-v2-uat-dev

---

## 📝 **CHECKLIST**

- [ ] `monthlyTokenReset` creada y deployada
- [ ] `manualTokenReset` creada y deployada
- [ ] Ambas funciones en región `northamerica-northeast1`
- [ ] `monthlyTokenReset` tiene schedule `0 0 1 * *`
- [ ] `monthlyTokenReset` tiene timezone `America/Toronto`
- [ ] `manualTokenReset` requiere autenticación
- [ ] Test de `manualTokenReset` funciona
- [ ] `firebase functions:list` muestra ambas funciones

---

**Status:** ✅ **READY TO DEPLOY**  
**Next:** Abre Google Cloud Console y sigue los pasos

