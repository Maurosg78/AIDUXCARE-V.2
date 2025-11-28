# 🔧 Pasos Finales para Conectar dev.aiduxcare.com

## ✅ Estado Actual:

- ✅ Dominio agregado en Firebase Console
- ✅ CNAME configurado en Cloudflare
- ✅ CNAME configurado en Porkbun
- ⏳ Dominio aún muestra "Site Not Found"

## 🔍 Problema Identificado:

El dominio está agregado pero puede que:
1. No esté conectado al sitio correcto
2. Firebase aún esté verificando/emitiendo el certificado SSL
3. El DNS aún no se haya propagado completamente

## 📋 Pasos para Resolver:

### Paso 1: Verificar Estado del Dominio en Firebase

En Firebase Console, en la página de dominios:

1. **Haz clic en el dominio `dev.aiduxcare.com`** (no solo verlo en la lista)
2. Deberías ver detalles del dominio, incluyendo:
   - Estado de verificación DNS
   - Estado del certificado SSL
   - A qué sitio está conectado

### Paso 2: Verificar Conexión al Sitio

Asegúrate de que el dominio esté conectado al sitio correcto:

- **Sitio correcto:** `aiduxcare-v2-uat-dev`
- Si no está conectado, deberías ver un botón o opción para conectarlo

### Paso 3: Verificar Mensajes de Estado

Busca mensajes como:
- ⏳ **"Verificando dominio"** - Espera 15-60 minutos
- ⏳ **"Emitiendo certificado SSL"** - Espera 30 minutos - 2 horas
- ✅ **"Conectado"** - Todo funcionando
- ❌ **"Error de verificación"** - Revisa DNS

### Paso 4: Si Hay Errores de Verificación

Si Firebase muestra errores de verificación DNS:

1. Verifica que el CNAME sea exactamente:
   ```
   dev.aiduxcare.com → aiduxcare-v2-uat-dev.web.app
   ```

2. Verifica que el proxy de Cloudflare esté en "DNS only" (gris)

3. Espera 15-30 minutos más para propagación DNS

### Paso 5: Verificar que el Sitio Tenga Contenido Desplegado

Asegúrate de que el sitio tenga contenido desplegado:

```bash
# Verificar que hay build
ls -la dist/

# Si no hay build, crear uno
npm run build

# Desplegar a Firebase
firebase deploy --only hosting
```

## ⏱️ Tiempos Estimados:

- **Propagación DNS:** 15-60 minutos
- **Verificación Firebase:** 15-60 minutos
- **Emisión SSL:** 30 minutos - 2 horas
- **Total:** 1-3 horas desde que configuraste el CNAME

## 🔍 Verificación Manual:

Ejecuta estos comandos para verificar:

```bash
# Verificar respuesta HTTP
curl -I https://dev.aiduxcare.com

# Verificar DNS
dig +short dev.aiduxcare.com CNAME

# Ejecutar test completo
bash scripts/verify-dns-and-hosting.sh
```

## ✅ Resultado Esperado:

Cuando todo esté funcionando:
- El dominio responderá **200 OK** (no 404)
- Mostrará tu aplicación (no "Site Not Found")
- El certificado SSL estará activo
- Firebase Console mostrará estado "Conectado"

## 🆘 Si Después de 2 Horas Sigue Sin Funcionar:

1. Verifica en Firebase Console el estado exacto del dominio
2. Revisa si hay mensajes de error específicos
3. Verifica que el sitio tenga contenido desplegado
4. Verifica que el CNAME esté correcto en Cloudflare

