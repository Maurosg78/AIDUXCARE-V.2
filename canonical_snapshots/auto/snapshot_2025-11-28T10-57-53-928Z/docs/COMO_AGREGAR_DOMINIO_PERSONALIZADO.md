# 🌐 Cómo Agregar Dominio Personalizado en Firebase Hosting

## 📍 Ubicación en Firebase Console

### Paso 1: Acceder a Firebase Hosting

1. Ve a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev
2. En el **menú lateral izquierdo**, busca la sección **"Accesos directos a proyectos"** (Project shortcuts)
3. Haz clic en **"Hosting"**

### Paso 2: Encontrar la Sección de Dominios Personalizados

Una vez en la página de Hosting, verás:

1. **En la parte superior** de la página de Hosting, hay varias pestañas/secciones:
   - **"Sites"** (Sitios) - Lista de sitios de hosting
   - **"Custom domains"** (Dominios personalizados) ← **ESTA ES LA QUE BUSCAS**
   - **"Channels"** (Canales) - Para preview channels

2. Haz clic en la pestaña **"Custom domains"** o **"Dominios personalizados"**

### Paso 3: Agregar el Dominio

En la página de "Custom domains":

1. Verás un botón que dice:
   - **"+ Add custom domain"** (en inglés)
   - **"+ Agregar dominio personalizado"** (en español)

2. Haz clic en ese botón

3. Se abrirá un modal/diálogo donde deberás:
   - Ingresar: `dev.aiduxcare.com`
   - Firebase te mostrará instrucciones para configurar DNS

## 🎯 Ruta Completa (URL Directa)

Si prefieres ir directo, puedes usar esta URL:

```
https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting/custom-domains
```

## 📸 Qué Buscar Visualmente

En la página de Hosting, busca:

- **Tabs/Pestañas** en la parte superior que incluyen:
  - Sites / Sitios
  - **Custom domains / Dominios personalizados** ← **CLIC AQUÍ**
  - Channels / Canales

- O busca un botón grande que diga:
  - **"+ Add custom domain"**
  - **"+ Agregar dominio personalizado"**

## ⚠️ Si No Ves la Opción

Si no ves la opción "Custom domains", puede ser porque:

1. **No tienes permisos suficientes:**
   - Necesitas rol de "Editor" o "Owner" en el proyecto
   - Verifica en: Configuración del proyecto → Usuarios y permisos

2. **El proyecto no tiene Hosting habilitado:**
   - Asegúrate de haber desplegado al menos una vez: `firebase deploy --only hosting`

3. **Estás en la vista incorrecta:**
   - Asegúrate de estar en la página de **Hosting**, no en Overview

## 🔧 Pasos Alternativos desde la Línea de Comandos

Si prefieres usar la CLI de Firebase:

```bash
# Ver dominios personalizados actuales
firebase hosting:sites:list

# Agregar dominio (esto te dará instrucciones DNS)
# Nota: Actualmente Firebase CLI no tiene comando directo para agregar dominio
# Debes hacerlo desde la consola web
```

## 📋 Después de Agregar el Dominio

Una vez agregado el dominio:

1. **Firebase te dará instrucciones DNS** específicas
2. Necesitarás agregar un registro **CNAME** o **A** en tu proveedor DNS
3. El dominio puede tardar **hasta 24 horas** en propagarse completamente
4. Verás el estado del dominio en la misma página:
   - ⏳ **Pending** (Pendiente) - Esperando configuración DNS
   - ✅ **Connected** (Conectado) - Dominio funcionando
   - ❌ **Failed** (Fallido) - Problema con DNS

## 🚀 Verificación Rápida

Para verificar si el dominio ya está agregado:

```bash
# Desde terminal
curl -I https://dev.aiduxcare.com

# O visita directamente en el navegador
# https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/hosting/custom-domains
```

## 💡 Tip

Si ya tienes el dominio agregado pero sigue dando 502:

1. Verifica que el dominio esté **conectado al sitio correcto**
2. El sitio debe ser: `aiduxcare-v2-uat-dev` o `aiduxcare-app`
3. Si está conectado a otro sitio, desconéctalo y conéctalo al correcto

