# 🔧 TROUBLESHOOTING: OpenAI API Key Inválida

**Fecha:** 2026-01-09  
**Problema:** Error 401 - "Incorrect API key provided"

---

## 🔍 DIAGNÓSTICO

### Error en Logs:
```
[whisperProxy] Whisper API error: 401 {
  "error": {
    "message": "Incorrect API key provided: sk-proj-...YfcA",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

### Causa:
La API key configurada en Firebase Functions es **inválida** o ha sido **revocada** por OpenAI.

---

## ✅ SOLUCIÓN

### Paso 1: Verificar/Crear API Key en OpenAI

1. **Ir a OpenAI Dashboard:**
   ```
   https://platform.openai.com/api-keys
   ```

2. **Verificar keys existentes:**
   - Busca la key que termina en `...YfcA`
   - Si está marcada como "Revoked" o no existe, necesitas crear una nueva

3. **Crear nueva key (si es necesario):**
   - Click "Create new secret key"
   - **IMPORTANTE:** Copia la key inmediatamente (solo se muestra una vez)
   - La key debe empezar con `sk-proj-`

---

### Paso 2: Re-configurar en Firebase

**Ejecuta en tu terminal:**

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
firebase functions:config:set openai.key="sk-proj-TU-NUEVA-KEY-COMPLETA-AQUI"
```

**Verificar configuración:**
```bash
firebase functions:config:get openai
```

**Debe mostrar:**
```json
{
  "openai": {
    "key": "sk-proj-..."
  }
}
```

---

### Paso 3: Probar de Nuevo

**NO necesitas re-deploy** - La configuración se actualiza automáticamente.

1. Refresca el navegador
2. Intenta grabar audio de nuevo
3. Debe funcionar ahora

---

## 🔍 VERIFICACIÓN ADICIONAL

### Si el problema persiste:

1. **Verificar que la key tenga permisos:**
   - La key debe tener acceso a Whisper API
   - Verifica en OpenAI Dashboard → API Keys → Permissions

2. **Verificar límites de uso:**
   - Ve a: https://platform.openai.com/usage
   - Verifica que no hay límites bloqueados

3. **Verificar facturación:**
   - Ve a: https://platform.openai.com/account/billing
   - Asegúrate de que hay método de pago configurado

---

## 📝 NOTAS

- La configuración de `functions.config()` se actualiza **sin necesidad de re-deploy**
- Los cambios toman efecto inmediatamente
- Si creas una nueva key, la anterior queda revocada automáticamente

---

**Documento creado:** 2026-01-09  
**Autor:** AiduxCare Team

