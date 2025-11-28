# ✅ Verificación de Credenciales

## 🎯 Estado Actual

- ✅ **Credenciales funcionan:** El test directo con Node.js fue exitoso
- ✅ **Función desplegada:** `sendConsentSMS` está activa en Firebase
- ⚠️ **Problema:** La Cloud Function aún reporta "Bad Credentials"

## 🔍 Diagnóstico

El problema puede ser que:
1. La función necesita ser redesplegada para cargar las nuevas credenciales
2. Firebase Functions puede tener las credenciales en caché

## 🔧 Solución

### Opción 1: Redesplegar la función (Recomendado)

```bash
firebase deploy --only functions:sendConsentSMS --project aiduxcare-v2-uat-dev
```

Esto asegurará que la función use las credenciales más recientes.

### Opción 2: Verificar logs de la función

Después de intentar enviar un SMS, revisa los logs:

```bash
firebase functions:log --only sendConsentSMS --project aiduxcare-v2-uat-dev --limit 5
```

Busca el log `[SMS Function] Vonage config check:` para ver qué credenciales está usando.

### Opción 3: Verificar configuración

```bash
firebase functions:config:get vonage
```

Debería mostrar:
- `api_key`: `1d667b43`
- `api_secret`: `cT0AzU%zK19hIk3Cuuav` (o similar)
- `from_number`: `+14168496475`

## ✅ Prueba Directa Exitosa

El test con Node.js confirmó que las credenciales son válidas:
- ✅ SMS enviado exitosamente
- ✅ Message ID: `933823be-1327-427f-a419-b5940ed2716f`
- ✅ Balance restante: €11.27

## 📝 Próximos Pasos

1. Redesplegar la función para asegurar que use las nuevas credenciales
2. Probar el flujo completo desde la aplicación
3. Si persiste el error, revisar los logs de la función

