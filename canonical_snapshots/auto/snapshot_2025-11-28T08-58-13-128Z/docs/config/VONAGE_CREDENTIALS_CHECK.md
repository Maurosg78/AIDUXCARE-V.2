# 🔍 Verificación de Credenciales Vonage

## ❌ Error Actual
```
Error: Bad Credentials
```

Este error indica que las credenciales de Vonage configuradas en Firebase Functions no son válidas o han expirado.

## ✅ Pasos para Verificar y Corregir

### 1. Verificar Credenciales en Vonage Dashboard

1. Ve a: https://dashboard.nexmo.com/
2. Inicia sesión con tu cuenta
3. Navega a: **Settings** → **API Credentials**
4. Verifica que tengas:
   - **API Key** (debe coincidir con `1d667b43`)
   - **API Secret** (debe ser el secreto real, no la public key)

### 2. Verificar Número de Teléfono

1. En el dashboard de Vonage, ve a: **Numbers** → **Your Numbers**
2. Verifica que tengas un número activo
3. El número debe ser: `+14168496475`

### 3. Actualizar Credenciales en Firebase Functions

Si las credenciales son diferentes, actualiza con:

```bash
firebase functions:config:set vonage.api_key="TU_API_KEY_REAL" \
  vonage.api_secret="TU_API_SECRET_REAL" \
  vonage.from_number="+14168496475"
```

Luego despliega nuevamente:

```bash
firebase deploy --only functions:sendConsentSMS --project aiduxcare-v2-uat-dev
```

### 4. Verificar Estado de la Cuenta

- ✅ La cuenta debe estar activa (no suspendida)
- ✅ Debe tener créditos disponibles
- ✅ El número debe estar verificado y activo

## 🔍 Códigos de Error Comunes de Vonage

- **Error 2**: Bad Credentials - Credenciales inválidas
- **Error 3**: Invalid Request - Parámetros inválidos
- **Error 4**: Throttled - Demasiadas solicitudes
- **Error 5**: Internal Error - Error interno de Vonage

## 📝 Notas

- El API Secret debe ser el secreto real, NO la public key RSA
- Las credenciales deben estar activas y no expiradas
- El número debe estar verificado en tu cuenta de Vonage

