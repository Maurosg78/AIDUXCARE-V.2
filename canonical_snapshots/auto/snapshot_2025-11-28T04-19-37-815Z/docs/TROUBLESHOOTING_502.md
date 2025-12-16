# 🔴 Solución para Error 502 Bad Gateway - dev.aiduxcare.com

## Problema
El dominio `dev.aiduxcare.com` está devolviendo un error **502 Bad Gateway**.

## Diagnóstico

### Estado Actual
- ✅ Firebase CLI instalado y autenticado
- ✅ Proyecto configurado: `aiduxcare-v2-uat-dev`
- ✅ Firebase Functions desplegadas correctamente
- ✅ Build local existe
- ❌ Dominio devuelve 502 Bad Gateway

### Sitios de Hosting Disponibles
1. `aiduxcare-app` → https://aiduxcare-app.web.app
2. `aiduxcare-v2-uat-dev` → https://aiduxcare-v2-uat-dev.web.app

## Causas Posibles

1. **Dominio personalizado no conectado correctamente**
   - El dominio `dev.aiduxcare.com` puede no estar vinculado al sitio correcto
   - La configuración DNS puede estar incorrecta

2. **Hosting no desplegado en el sitio correcto**
   - El contenido puede no estar desplegado en el sitio que usa el dominio

3. **Problemas con Firebase Hosting**
   - El sitio puede estar en un estado inconsistente

## Soluciones

### Opción 1: Verificar y Configurar Dominio Personalizado (Recomendado)

1. **Verificar configuración del dominio en Firebase Console:**
   ```
   https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting
   ```

2. **Si el dominio no está conectado:**
   - Ve a la sección "Dominios personalizados"
   - Haz clic en "Agregar dominio personalizado"
   - Ingresa `dev.aiduxcare.com`
   - Sigue las instrucciones para configurar DNS

3. **Verificar configuración DNS:**
   - El dominio debe tener registros CNAME o A apuntando a Firebase Hosting
   - Verifica con: `dig dev.aiduxcare.com` o `nslookup dev.aiduxcare.com`

### Opción 2: Redesplegar Hosting

Ejecuta el script de fix:

```bash
bash scripts/fix-502.sh
```

O manualmente:

```bash
# 1. Construir la aplicación
npm run build

# 2. Desplegar hosting (especificar el sitio correcto)
firebase deploy --only hosting --project aiduxcare-v2-uat-dev

# Si necesitas desplegar a un sitio específico:
firebase target:apply hosting dev-site aiduxcare-v2-uat-dev
firebase deploy --only hosting:dev-site
```

### Opción 3: Verificar qué Sitio Usa el Dominio

1. **En Firebase Console:**
   - Ve a Hosting → Dominios personalizados
   - Verifica qué sitio está asociado con `dev.aiduxcare.com`

2. **Si el dominio apunta al sitio incorrecto:**
   - Desconecta el dominio del sitio incorrecto
   - Conéctalo al sitio correcto (`aiduxcare-v2-uat-dev`)

### Opción 4: Verificar Logs y Estado

```bash
# Ver logs de hosting
firebase hosting:channel:list

# Ver estado del despliegue
firebase hosting:clone --help

# Verificar funciones (por si hay rewrites que fallan)
firebase functions:log
```

## Pasos de Verificación Post-Fix

1. **Espera 1-2 minutos** después del despliegue para propagación

2. **Verifica el dominio:**
   ```bash
   curl -I https://dev.aiduxcare.com
   ```
   Debe devolver `200 OK` o `301/302` redirect

3. **Verifica el sitio de Firebase:**
   ```bash
   curl -I https://aiduxcare-v2-uat-dev.web.app
   ```
   Debe funcionar correctamente

4. **Si ambos funcionan pero el dominio personalizado no:**
   - El problema es de configuración DNS o dominio personalizado
   - Revisa la configuración en Firebase Console

## Comandos Útiles

```bash
# Diagnosticar el problema
bash scripts/diagnose-502.sh

# Solucionar automáticamente
bash scripts/fix-502.sh

# Ver sitios de hosting
firebase hosting:sites:list

# Ver configuración actual
firebase use
cat .firebaserc
```

## Contacto y Soporte

Si el problema persiste después de intentar estas soluciones:

1. Verifica los logs en Firebase Console
2. Revisa el estado del servicio en: https://status.firebase.google.com/
3. Consulta la documentación: https://firebase.google.com/docs/hosting/custom-domain

## Notas

- Los cambios en dominios personalizados pueden tardar hasta 24 horas en propagarse completamente
- Asegúrate de que el dominio tenga los registros DNS correctos antes de conectarlo
- Si cambias de sitio de hosting, desconecta el dominio del anterior primero

