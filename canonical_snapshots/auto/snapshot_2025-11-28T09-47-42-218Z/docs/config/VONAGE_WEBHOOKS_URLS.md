# 🔗 URLs Exactas para Configurar en Vonage Dashboard

## ✅ URLs Completas y Verificadas

### 1. Inbound SMS Webhooks

**URL completa:**
```
https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/receiveSMS
```

**Configuración:**
- Campo: **Inbound SMS webhooks**
- Formato: **GET**
- Estado: ✅ Función desplegada y accesible públicamente

### 2. Delivery Receipts (DLR) Webhooks

**URL completa:**
```
https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/smsDeliveryReceipt
```

**Configuración:**
- Campo: **Delivery receipts (DLR) webhooks**
- Formato: **GET**
- Estado: ✅ Función desplegada y accesible públicamente

## 📋 Instrucciones para Copiar y Pegar

### Paso 1: Inbound SMS Webhooks

1. Ve al campo **"Inbound SMS webhooks"**
2. **Borra** cualquier texto que haya en el campo
3. **Copia** esta URL completa:
   ```
   https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/receiveSMS
   ```
4. **Pega** la URL en el campo
5. Verifica que no haya espacios antes o después
6. El formato debe ser **GET** (ya debería estar seleccionado)

### Paso 2: Delivery Receipts Webhooks

1. Ve al campo **"Delivery receipts (DLR) webhooks"**
2. **Borra** cualquier texto que haya en el campo
3. **Copia** esta URL completa:
   ```
   https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/smsDeliveryReceipt
   ```
4. **Pega** la URL en el campo
5. Verifica que no haya espacios antes o después

### Paso 3: Guardar

1. Haz clic en el botón **"Save"** o **"Guardar"**
2. Espera a que se guarde la configuración
3. Verifica que los campos ya no muestren errores (bordes rojos)

## ✅ Verificación

Después de guardar, deberías ver:
- ✅ Sin errores de validación (sin bordes rojos)
- ✅ Las URLs completas en ambos campos
- ✅ Formato GET seleccionado

## 🧪 Probar

Una vez configurado:

1. **Envía un SMS de prueba** desde otro teléfono al `+14168496475`
2. **Verifica en Firebase Console:**
   - Firestore → `inbound_sms` → Debería aparecer el SMS recibido
   - Functions → Logs → Deberías ver `[SMS Receive] Inbound SMS received`

3. **Envía un SMS desde la app:**
   - Crea un paciente y abre el workflow
   - Verifica en Firestore → `sms_delivery_receipts` → Debería aparecer el receipt

## ⚠️ Troubleshooting

### Si sigue mostrando error de validación:

1. Verifica que la URL esté completa (sin cortarse)
2. Verifica que no haya espacios al inicio o final
3. Verifica que empiece con `https://` (no `http://`)
4. Intenta guardar de nuevo

### Si las URLs no funcionan:

1. Verifica que las funciones estén desplegadas:
   ```bash
   firebase functions:list --project aiduxcare-v2-uat-dev
   ```

2. Verifica que las funciones sean públicas:
   ```bash
   gcloud functions get-iam-policy receiveSMS --region=us-central1 --project=aiduxcare-v2-uat-dev
   ```

3. Prueba las URLs directamente en el navegador (deberían retornar "OK")

