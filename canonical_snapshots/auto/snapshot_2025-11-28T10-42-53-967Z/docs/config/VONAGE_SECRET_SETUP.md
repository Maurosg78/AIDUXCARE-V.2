# 🔐 Configuración de API Secret de Vonage

## 📋 Situación Actual

- ✅ **API Key:** `1d667b43` (Master) - ✅ Correcto
- ❌ **API Secret:** Enmascarado, no se puede ver/copiar
- ⚠️ **Problema:** El secreto actual en Firebase Functions no es válido

## 🔧 Solución: Crear Nuevo API Secret

### Paso 1: Crear Nuevo Secret en Vonage Dashboard

1. En el dashboard de Vonage, en la sección **"Account credentials"**
2. Busca el botón **"+ Create new secret"**
3. Haz clic en el botón
4. **Copia inmediatamente el nuevo secret** (solo se muestra una vez)
5. Guárdalo en un lugar seguro

### Paso 2: Actualizar Firebase Functions Config

Una vez que tengas el nuevo secret, ejecuta:

```bash
firebase functions:config:set vonage.api_key="1d667b43" \
  vonage.api_secret="TU_NUEVO_SECRET_AQUI" \
  vonage.from_number="+14168496475"
```

### Paso 3: Redesplegar la Función

```bash
firebase deploy --only functions:sendConsentSMS --project aiduxcare-v2-uat-dev
```

## ⚠️ Importante

- El API Secret solo se muestra **una vez** cuando lo creas
- Si lo pierdes, tendrás que crear uno nuevo
- El secreto anterior seguirá funcionando hasta que lo revoques
- Guarda el nuevo secret de forma segura

## ✅ Verificación

Después de actualizar, prueba el flujo nuevamente:
1. Crea un paciente de prueba
2. Abre el workflow
3. Verifica que el SMS se envíe correctamente

