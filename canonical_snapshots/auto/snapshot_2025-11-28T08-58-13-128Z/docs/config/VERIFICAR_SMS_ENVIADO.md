# 🔍 Verificar Por Qué No Llegó el SMS

## 📋 Problema Identificado

El paciente creado tiene el número `+18777804236` (número de prueba de Twilio), **no tu número español**.

## ✅ Solución: Crear Paciente con Tu Número Real

### Paso 1: Crear Nuevo Paciente

1. Ve al **Command Center**
2. Haz clic en **"Create Patient"**
3. Completa el formulario con:
   - **First Name:** `John`
   - **Last Name:** `TestPatient`
   - **Phone:** `+34687228413` (tu número español real)
   - **Date of Birth:** `1985-06-15`
   - **Chief Complaint:** `Testing SMS consent workflow`

### Paso 2: Abrir Workflow

1. Haz clic en el paciente recién creado
2. O navega a: `/workflow?patientId={ID_DEL_PACIENTE}`
3. Se enviará el SMS a tu número real

## 🔍 Verificar en Firestore

### 1. Verificar SMS Enviado

1. Ve a Firebase Console → Firestore
2. Busca la colección `pending_sms`
3. Deberías ver el SMS que se intentó enviar

### 2. Verificar Delivery Receipt

1. Busca la colección `sms_delivery_receipts`
2. Deberías ver el receipt del SMS enviado
3. Verifica el campo `status`:
   - `delivered` = SMS entregado ✅
   - `failed` = SMS falló ❌
   - `pending` = SMS en proceso ⏳

### 3. Verificar Logs de Functions

1. Ve a Firebase Console → Functions → Logs
2. Busca `sendConsentSMS` o `[SMS Function]`
3. Deberías ver logs como:
   ```
   [SMS Function] Vonage API response: {
     status: 200,
     result: {...}
   }
   ```

## 🧪 Prueba Completa

1. **Crea paciente con tu número:** `+34687228413`
2. **Abre workflow** → Se enviará SMS automáticamente
3. **Espera 10-30 segundos** → El SMS puede tardar en llegar
4. **Verifica tu teléfono** → Deberías recibir el SMS con el link
5. **Haz clic en el link** → Debería abrir el portal de consentimiento

## ⚠️ Si Aún No Llega el SMS

### Verificar en Vonage Dashboard:

1. Ve a: https://dashboard.nexmo.com/
2. **Logs** → **SMS**
3. Busca el SMS enviado al `+34687228413`
4. Verifica el estado:
   - ✅ `delivered` = SMS entregado
   - ❌ `failed` = Revisa el error

### Posibles Razones:

1. **Número no válido** - Verifica que el formato sea correcto (`+34687228413`)
2. **Restricciones de Vonage** - Algunos países pueden tener restricciones
3. **SMS bloqueado** - Tu operador puede estar bloqueando SMS internacionales
4. **Delay en entrega** - Puede tardar hasta 1-2 minutos

## 📝 Nota Importante

- El número `+18777804236` es solo para pruebas internas
- Para recibir SMS reales, usa tu número español: `+34687228413`
- Los SMS internacionales pueden tener costo según tu operador

