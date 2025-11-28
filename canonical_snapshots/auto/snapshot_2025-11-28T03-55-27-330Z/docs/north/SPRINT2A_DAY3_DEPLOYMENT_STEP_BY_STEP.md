# 🎯 DEPLOYMENT PASO A PASO - Firebase Console

**Estado Actual:** Funciones de token reset NO están deployadas  
**Acción Requerida:** Crear 2 nuevas funciones

---

## 📍 **PASO 1: CREAR monthlyTokenReset**

### **1.1 Click en "Crear función" o "Create function"**
- En la parte superior de la lista de funciones
- O busca el botón "+" o "Add function"

### **1.2 Configuración Básica:**

#### **A. Nombre y Región:**
- **Nombre de la función:** `monthlyTokenReset`
- **Región:** Selecciona `northamerica-northeast1` (Montreal)
  - ⚠️ **IMPORTANTE:** Debe ser esta región (no us-central1)

#### **B. Tipo de Activador:**
- Selecciona: **"Cloud Scheduler"** o **"Programador"**
- **Expresión de programación:** `0 0 1 * *`
- **Zona horaria:** `America/Toronto`
- **Descripción:** `Monthly token reset for professional users`

#### **C. Configuración de Runtime:**
- **Runtime:** `Node.js 20`
- **Memoria:** `512 MB`
- **Tiempo de espera:** `540 segundos` (9 minutos)
- **Cantidad mínima de instancias:** `0`
- **Cantidad máxima de instancias:** `100` (o dejar default)

### **1.3 Código Fuente:**

**Opción A: Editor Inline (Recomendado)**

1. Selecciona **"Editor inline"** o **"Inline editor"**
2. Abre el archivo: `functions/monthlyTokenReset.js`
3. **Copia TODO el contenido** del archivo
4. Pégalo en el editor de Firebase Console
5. Asegúrate de que el código incluye:
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

**Opción B: Subir ZIP**

1. Crea un ZIP con:
   - `monthlyTokenReset.js`
   - `package.json` (desde `functions/`)
2. Selecciona **"Subir ZIP"** o **"Upload ZIP"**
3. Sube el archivo ZIP
4. **Punto de entrada:** `monthlyTokenReset`

### **1.4 Dependencias (package.json):**

Si usas editor inline, en la sección de dependencias agrega:
```json
{
  "dependencies": {
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^4.9.0"
  }
}
```

### **1.5 Desplegar:**
1. Click en **"Desplegar"** o **"Deploy"**
2. Espera 2-5 minutos
3. Verás: **"Función desplegada correctamente"**

---

## 📍 **PASO 2: CREAR manualTokenReset**

### **2.1 Click en "Crear función" nuevamente**

### **2.2 Configuración Básica:**

#### **A. Nombre y Región:**
- **Nombre de la función:** `manualTokenReset`
- **Región:** `northamerica-northeast1` (Montreal)
  - ⚠️ **Misma región** que monthlyTokenReset

#### **B. Tipo de Activador:**
- Selecciona: **"HTTPS"** o **"Callable"**
- **Autenticación:** ✅ **"Requerir autenticación"** (marcado)
- Esto asegura que solo usuarios autenticados puedan llamarla

#### **C. Configuración de Runtime:**
- **Runtime:** `Node.js 20`
- **Memoria:** `512 MB`
- **Tiempo de espera:** `540 segundos` (9 minutos)
- **Cantidad mínima de instancias:** `0`
- **Cantidad máxima de instancias:** Default

### **2.3 Código Fuente:**

1. Selecciona **"Editor inline"**
2. **Copia TODO el contenido** de `functions/monthlyTokenReset.js`
3. Pégalo en el editor
4. Asegúrate de que incluye:
   ```javascript
   exports.manualTokenReset = functions
     .region('northamerica-northeast1')
     .runWith({ timeoutSeconds: 540, memory: '512MB' })
     .https.onCall(async (data, context) => {
       // ... código completo
     });
   ```

### **2.4 Desplegar:**
1. Click en **"Desplegar"**
2. Espera 2-5 minutos
3. Verás: **"Función desplegada correctamente"**

---

## ✅ **PASO 3: VERIFICACIÓN**

### **3.1 Verificar en la Lista:**

Después de deployar ambas funciones, deberías ver:

```
monthlyTokenReset  | northamerica-northeast1 | Programador | v1 | ✅
manualTokenReset   | northamerica-northeast1 | Solicitud   | v1 | ✅
```

### **3.2 Verificar Configuración:**

**Para monthlyTokenReset:**
1. Click en `monthlyTokenReset`
2. Verifica:
   - ✅ Región: `northamerica-northeast1`
   - ✅ Activador: Cloud Scheduler
   - ✅ Programación: `0 0 1 * *`
   - ✅ Zona horaria: `America/Toronto`
   - ✅ Memoria: `512 MB`
   - ✅ Tiempo de espera: `540 segundos`

**Para manualTokenReset:**
1. Click en `manualTokenReset`
2. Verifica:
   - ✅ Región: `northamerica-northeast1`
   - ✅ Activador: HTTPS/Callable
   - ✅ Autenticación: Requerida
   - ✅ Memoria: `512 MB`
   - ✅ Tiempo de espera: `540 segundos`

### **3.3 Test manualTokenReset:**

1. Click en `manualTokenReset`
2. Ve a la pestaña **"Pruebas"** o **"Testing"**
3. En el campo de entrada, escribe:
   ```json
   {}
   ```
4. Click en **"Probar función"** o **"Test function"**
5. **Resultado esperado:**
   ```json
   {
     "success": true,
     "usersReset": 0,
     "message": "No active users found"
   }
   ```

---

## 🔍 **VERIFICACIÓN CON CLI**

Después del deployment, ejecuta:

```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
firebase functions:list --project aiduxcare-v2-uat-dev | grep -i token
```

**Resultado esperado:**
```
monthlyTokenReset  | v1 | schedule | northamerica-northeast1 | 512MB | nodejs20
manualTokenReset   | v1 | callable | northamerica-northeast1 | 512MB | nodejs20
```

---

## ⚠️ **NOTA IMPORTANTE: Funciones Duplicadas**

Veo que tienes funciones duplicadas en `us-central1`:
- `processWithVertexAI` (us-central1)
- `sendConsentSMS` (us-central1)
- `vertexAIProxy` (us-central1)
- `receiveSMS` (us-central1)
- `smsDeliveryReceipt` (us-central1)

**Recomendación:** Eliminar estas funciones de `us-central1` para cumplimiento PHIPA. Todo debe estar en `northamerica-northeast1`.

**Para eliminar:**
1. Click en cada función en `us-central1`
2. Click en "Eliminar" o "Delete"
3. Confirma la eliminación

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

**¿Listo para comenzar?** Empieza con el Paso 1.1 y sigue secuencialmente.

