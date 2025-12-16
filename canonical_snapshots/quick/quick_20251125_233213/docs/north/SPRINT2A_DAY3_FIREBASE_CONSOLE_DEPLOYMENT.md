# 🚀 SPRINT 2A DAY 3: DEPLOYMENT VIA FIREBASE CONSOLE

**Guía Paso a Paso Completa**  
**Tiempo estimado:** 10-15 minutos

---

## 📋 **PREREQUISITOS**

- ✅ Acceso a Firebase Console
- ✅ Proyecto: `aiduxcare-v2-uat-dev`
- ✅ Archivo `functions/monthlyTokenReset.js` listo

---

## 🎯 **PASO 1: ACCEDER A FIREBASE CONSOLE**

### **1.1 Abrir Firebase Console:**
```
https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/functions
```

### **1.2 Verificar Proyecto:**
- Debe mostrar: **aiduxcare-v2-uat-dev**
- Si no, selecciona el proyecto correcto desde el dropdown superior

---

## 🔧 **PASO 2: DEPLOY monthlyTokenReset (SCHEDULED FUNCTION)**

### **2.1 Crear Nueva Función:**
1. Click en **"Create function"** o **"Add function"**
2. Si es primera vez, click en **"Get started"**

### **2.2 Configurar Función:**

#### **A. Información Básica:**
- **Function name:** `monthlyTokenReset`
- **Region:** Selecciona `northamerica-northeast1` (Montreal, Canada)
  - ⚠️ **CRÍTICO:** Debe ser `northamerica-northeast1` para PHIPA compliance

#### **B. Trigger Type:**
- Selecciona: **"Cloud Scheduler"** o **"Schedule"**
- **Schedule:** `0 0 1 * *`
  - Esto significa: día 1 de cada mes a las 00:00
- **Timezone:** `America/Toronto`
- **Description:** `Monthly token reset for all active professional users`

#### **C. Runtime Configuration:**
- **Runtime:** `Node.js 20`
- **Memory:** `512 MB`
- **Timeout:** `540 seconds` (9 minutes)
- **Max instances:** Dejar default o `100`

#### **D. Source Code:**
- **Source:** Selecciona **"Inline editor"** o **"Upload ZIP"**
  
  **Opción 1: Inline Editor (Recomendado):**
  1. Click en "Edit code"
  2. Copia TODO el contenido de `functions/monthlyTokenReset.js`
  3. Pega en el editor
  4. Asegúrate de que el código incluye:
     ```javascript
     exports.monthlyTokenReset = functions
       .region('northamerica-northeast1')
       .runWith({ timeoutSeconds: 540, memory: '512MB' })
       .pubsub.schedule('0 0 1 * *')
       .timeZone('America/Toronto')
       .onRun(async (context) => {
         // ... código completo
       });
     ```
  
  **Opción 2: Upload ZIP:**
  1. Crea un ZIP con:
     - `monthlyTokenReset.js`
     - `package.json` (desde `functions/`)
  2. Upload el ZIP
  3. Entry point: `monthlyTokenReset`

#### **E. Dependencies (package.json):**
Si usas Inline Editor, asegúrate de que `package.json` incluya:
```json
{
  "dependencies": {
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^4.9.0"
  }
}
```

### **2.3 Deploy:**
1. Click en **"Deploy"** o **"Create function"**
2. Espera 2-5 minutos
3. Verás: **"Function deployed successfully"**

---

## 🔧 **PASO 3: DEPLOY manualTokenReset (CALLABLE FUNCTION)**

### **3.1 Crear Nueva Función:**
1. Click en **"Create function"** nuevamente
2. O desde el menú lateral: Functions → Create function

### **3.2 Configurar Función:**

#### **A. Información Básica:**
- **Function name:** `manualTokenReset`
- **Region:** `northamerica-northeast1` (Montreal, Canada)
  - ⚠️ **CRÍTICO:** Misma región que monthlyTokenReset

#### **B. Trigger Type:**
- Selecciona: **"HTTPS"** o **"Callable"**
- **Authentication:** 
  - ✅ **"Require authentication"** (marcado)
  - Esto asegura que solo usuarios autenticados puedan llamarla

#### **C. Runtime Configuration:**
- **Runtime:** `Node.js 20`
- **Memory:** `512 MB`
- **Timeout:** `540 seconds` (9 minutes)
- **Max instances:** Dejar default

#### **D. Source Code:**
- **Source:** **"Inline editor"**
- Copia TODO el contenido de `functions/monthlyTokenReset.js`
- Asegúrate de que incluye:
  ```javascript
  exports.manualTokenReset = functions
    .region('northamerica-northeast1')
    .runWith({ timeoutSeconds: 540, memory: '512MB' })
    .https.onCall(async (data, context) => {
      // ... código completo
    });
  ```

### **3.3 Deploy:**
1. Click en **"Deploy"**
2. Espera 2-5 minutos
3. Verás: **"Function deployed successfully"**

---

## ✅ **PASO 4: VERIFICACIÓN**

### **4.1 Verificar Funciones Deployadas:**

1. En Firebase Console → Functions
2. Deberías ver ambas funciones:
   ```
   monthlyTokenReset  | Schedule | northamerica-northeast1 | ✅
   manualTokenReset   | HTTPS    | northamerica-northeast1 | ✅
   ```

### **4.2 Verificar Configuración de monthlyTokenReset:**

1. Click en `monthlyTokenReset`
2. Ve a la pestaña **"Trigger"** o **"Configuration"**
3. Verifica:
   - ✅ Schedule: `0 0 1 * *`
   - ✅ Timezone: `America/Toronto`
   - ✅ Region: `northamerica-northeast1`
   - ✅ Memory: `512 MB`
   - ✅ Timeout: `540 seconds`

### **4.3 Verificar Configuración de manualTokenReset:**

1. Click en `manualTokenReset`
2. Ve a la pestaña **"Trigger"** o **"Configuration"**
3. Verifica:
   - ✅ Trigger: `HTTPS` o `Callable`
   - ✅ Authentication: `Required`
   - ✅ Region: `northamerica-northeast1`
   - ✅ Memory: `512 MB`
   - ✅ Timeout: `540 seconds`

---

## 🧪 **PASO 5: TESTING**

### **5.1 Test manualTokenReset:**

1. Ve a Firebase Console → Functions → `manualTokenReset`
2. Click en la pestaña **"Test"** o **"Testing"**
3. En el campo de entrada, escribe:
   ```json
   {}
   ```
4. Click en **"Test function"** o **"Run"**
5. **Resultado esperado:**
   ```json
   {
     "success": true,
     "usersReset": 0,
     "message": "No active users found"
   }
   ```
   (O el número de usuarios reseteados si hay usuarios activos)

### **5.2 Verificar Logs:**

1. Ve a Firebase Console → Functions → Logs
2. Busca entradas de `monthlyTokenReset` y `manualTokenReset`
3. Verifica que no hay errores

---

## 🔍 **PASO 6: VERIFICACIÓN FINAL CON CLI**

### **6.1 Listar Funciones:**
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
firebase functions:list --project aiduxcare-v2-uat-dev | grep -i token
```

**Resultado esperado:**
```
monthlyTokenReset  | v1 | schedule | northamerica-northeast1 | 512MB | nodejs20
manualTokenReset   | v1 | callable | northamerica-northeast1 | 512MB | nodejs20
```

### **6.2 Ver Logs:**
```bash
firebase functions:log --project aiduxcare-v2-uat-dev --only monthlyTokenReset --limit 10
firebase functions:log --project aiduxcare-v2-uat-dev --only manualTokenReset --limit 10
```

---

## ⚠️ **TROUBLESHOOTING**

### **Problema 1: Función no aparece después de deploy**
- **Solución:** Refresca la página o espera 1-2 minutos
- Verifica que el deployment completó exitosamente

### **Problema 2: Error "Function failed to deploy"**
- **Solución:** 
  - Verifica que el código está completo
  - Revisa los logs de deployment
  - Asegúrate de que `package.json` tiene las dependencias correctas

### **Problema 3: Función deployada en región incorrecta**
- **Solución:**
  - Delete la función
  - Re-deploy con región `northamerica-northeast1`
  - ⚠️ **CRÍTICO:** Debe ser región canadiense para PHIPA

### **Problema 4: Schedule no funciona**
- **Solución:**
  - Verifica formato: `0 0 1 * *`
  - Verifica timezone: `America/Toronto`
  - Verifica que Cloud Scheduler API está habilitada

### **Problema 5: manualTokenReset requiere autenticación pero falla**
- **Solución:**
  - Verifica que estás autenticado en Firebase
  - En testing, usa un usuario autenticado
  - Verifica que el código tiene la lógica de autenticación correcta

---

## 📝 **CHECKLIST FINAL**

Antes de considerar el deployment completo, verifica:

- [ ] `monthlyTokenReset` aparece en la lista de funciones
- [ ] `manualTokenReset` aparece en la lista de funciones
- [ ] Ambas funciones están en región `northamerica-northeast1`
- [ ] `monthlyTokenReset` tiene schedule `0 0 1 * *`
- [ ] `monthlyTokenReset` tiene timezone `America/Toronto`
- [ ] `manualTokenReset` requiere autenticación
- [ ] Ambas funciones tienen 512MB memory y 540s timeout
- [ ] Test de `manualTokenReset` funciona correctamente
- [ ] Logs no muestran errores críticos
- [ ] `firebase functions:list` muestra ambas funciones

---

## 🎉 **COMPLETADO**

Una vez completados todos los pasos:

1. ✅ Funciones deployadas y funcionando
2. ✅ Sprint 2A Day 3: **100% COMPLETE**
3. ✅ Infraestructura lista para piloto de diciembre
4. ✅ PHIPA compliance verificada (región canadiense)

---

## 📞 **SIGUIENTE PASO**

Después del deployment exitoso:
1. Documenta el resultado en este archivo
2. Actualiza el estado en `SPRINT2A_DAY3_DEPLOYMENT_FINAL_STATUS.md`
3. Marca el TODO como completado

---

**¿Listo para comenzar?** Empieza con el Paso 1 y sigue secuencialmente.  
**Tiempo estimado total:** 10-15 minutos

