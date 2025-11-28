# Configurar support@aiduxcare.com en Google Workspace - Paso a Paso

## 🎯 Objetivo
Crear `support@aiduxcare.com` para que los emails de respuesta de Firebase lleguen a tu buzón.

---

## ✅ Opción 1: Crear un Grupo (RECOMENDADO - Más Fácil)

### Paso 1: Ir a Grupos
1. En el menú izquierdo, busca **"Directorios"** o **"Directory"**
2. Haz clic en **"Grupos"** o **"Groups"**

### Paso 2: Crear Nuevo Grupo
1. Haz clic en el botón **"Crear grupo"** o **"Create group"** (arriba a la derecha)
2. Completa el formulario:
   - **Nombre del grupo**: `Support`
   - **Dirección de correo electrónico del grupo**: `support@aiduxcare.com`
   - **Tipo de grupo**: Selecciona **"Lista de correo"** o **"Email list"**
   - **Descripción**: `Soporte técnico de AiDuxCare`
3. Haz clic en **"Crear grupo"** o **"Create group"**

### Paso 3: Agregar Miembros
1. Una vez creado el grupo, haz clic en él para abrirlo
2. Ve a la pestaña **"Miembros"** o **"Members"**
3. Haz clic en **"Agregar miembros"** o **"Add members"**
4. Ingresa tu email personal (ej: `tu-email@gmail.com`)
5. Haz clic en **"Agregar"** o **"Add"**

### Paso 4: Configurar Permisos
1. Ve a **"Configuración"** o **"Settings"** del grupo
2. Busca **"Permisos de publicación"** o **"Posting permissions"**
3. Configura para permitir que usuarios externos puedan enviar emails
4. Guarda los cambios

**✅ Listo!** Todos los emails a `support@aiduxcare.com` llegarán a tu email personal.

---

## ✅ Opción 2: Crear un Usuario (Si Necesitas Acceso Directo)

### Paso 1: Ir a Usuarios
1. En la página principal, busca la tarjeta **"Usuarios"** o **"Users"**
2. Haz clic en **"Administrar"** o **"Manage"**
   - O haz clic directamente en **"Agregar un usuario"** o **"Add a user"**

### Paso 2: Crear Usuario
1. Completa el formulario:
   - **Nombre**: `Support`
   - **Apellido**: `AiDuxCare`
   - **Dirección de correo electrónico principal**: `support@aiduxcare.com`
   - **Contraseña**: Genera una contraseña segura (anótala)
2. Haz clic en **"Agregar nuevo usuario"** o **"Add new user"**

### Paso 3: Configurar Forwarding (Opcional)
1. Inicia sesión en Gmail con `support@aiduxcare.com`
2. Ve a **Configuración** (⚙️) → **Ver toda la configuración**
3. Ve a la pestaña **"Reenvío y POP/IMAP"**
4. Haz clic en **"Agregar una dirección de reenvío"**
5. Ingresa tu email personal
6. Verifica el email
7. Selecciona **"Reenviar una copia del correo entrante a"**
8. Guarda

**✅ Listo!** Puedes acceder directamente a `support@aiduxcare.com` o recibir los emails en tu email personal.

---

## ✅ Opción 3: Crear Alias de Email (Más Rápido)

### Paso 1: Ir a Usuarios
1. En la página principal, haz clic en **"Usuarios"** → **"Administrar"**

### Paso 2: Seleccionar Usuario Existente
1. Busca un usuario existente (ej: tu usuario principal)
2. Haz clic en el usuario para abrirlo

### Paso 3: Agregar Alias
1. Ve a la pestaña **"Información del usuario"** o **"User information"**
2. Busca **"Direcciones de correo electrónico"** o **"Email addresses"**
3. Haz clic en **"Agregar dirección de correo electrónico alternativa"** o **"Add alternative email address"**
4. Ingresa: `support@aiduxcare.com`
5. Guarda

**✅ Listo!** Los emails a `support@aiduxcare.com` llegarán al buzón del usuario seleccionado.

---

## 🔧 Configurar en Firebase (Después de Crear el Email)

Una vez que tengas `support@aiduxcare.com` configurado:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona proyecto: `aiduxcare-v2-uat-dev`
3. Ve a **Authentication** → **Templates**
4. Edita **"Email address verification"**
5. Configura:
   - **Reply To**: `support@aiduxcare.com`
   - **Sender Name**: `AiDuxCare Team`
   - **Subject**: `Welcome to AiDuxCare - Verify Your Email 🍁`
6. Guarda

---

## ✅ Verificación

### Probar que Funciona:
1. Desde cualquier email, envía un mensaje a: `support@aiduxcare.com`
2. Verifica que llegue a tu destino configurado
3. Si usaste un grupo, verifica que llegue a todos los miembros

### Probar con Firebase:
1. Registra un usuario de prueba en tu aplicación
2. Recibe el email de verificación
3. Haz clic en "Reply" o "Responder"
4. Verifica que el destinatario sea `support@aiduxcare.com`
5. Envía el reply
6. Verifica que llegue correctamente

---

## 💡 Recomendación

**Usa Opción 1 (Grupo)** porque:
- ✅ Más fácil de gestionar
- ✅ Puedes agregar/quitar miembros fácilmente
- ✅ No requiere crear un usuario completo
- ✅ Puedes agregar múltiples emails para recibir
- ✅ Ideal para soporte (varias personas pueden recibir)

---

## 📋 Checklist Final

- [ ] `support@aiduxcare.com` creado en Google Workspace
- [ ] Miembros agregados al grupo (si usaste grupo)
- [ ] Forwarding configurado (si usaste usuario)
- [ ] Prueba de recepción exitosa
- [ ] Reply To configurado en Firebase Console
- [ ] Prueba completa con Firebase

---

**¿Necesitas ayuda con algún paso específico?** Avísame y te guío más detalladamente.

