# 🌍 TWILIO GEO-PERMISSIONS SETUP

**Error:** 21408 - Permission to send SMS has not been enabled for the region

## ⚠️ PROBLEMA

Twilio requiere que habilites permisos geográficos para enviar SMS a diferentes países/regiones. Por defecto, solo algunos países están habilitados.

## ✅ SOLUCIÓN

### **1. Habilitar Permisos para Canadá:**

1. Ve a la consola de Twilio: https://console.twilio.com/us1/develop/sms/settings/geo-permissions
2. Busca **"Canada"** en la lista de países
3. Habilita el **toggle** para Canadá
4. Haz clic en **"Save"** o **"Update"**

### **2. Verificar Números de Teléfono:**

Asegúrate de que:
- El número Twilio (`+12292673348` o el número canadiense que compraste) esté activo
- El número tenga capacidad de **SMS** habilitada

### **3. Probar de Nuevo:**

Después de habilitar los permisos, ejecuta:

```bash
npm run test:sms
```

## 📋 PAÍSES HABILITADOS POR DEFECTO

Twilio normalmente habilita estos países por defecto:
- United States
- United Kingdom
- Algunos países europeos

**Canadá requiere habilitación manual** para cuentas de prueba.

## 🔍 VERIFICAR PERMISOS

Para verificar qué países están habilitados:

1. Ve a: https://console.twilio.com/us1/develop/sms/settings/geo-permissions
2. Revisa la lista de países
3. Los países con toggle **ON** están habilitados

## ⚠️ NOTA IMPORTANTE

- Los permisos geográficos ayudan a evitar cargos inesperados
- Solo habilita los países donde realmente operarás
- Para producción, considera habilitar solo los países necesarios

---

**Última actualización:** Noviembre 16, 2025

