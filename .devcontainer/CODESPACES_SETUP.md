# 🚀 Guía de Configuración de GitHub Codespaces

## ✅ Paso 1: Configuración Completada

El archivo `.devcontainer/devcontainer.json` ya está creado y configurado.

## 📋 Paso 2: Configurar Secretos en GitHub

1. Ve a tu repositorio en GitHub.com
2. **Settings** → **Secrets and variables** → **Codespaces**
3. Click **"New repository secret"**
4. Agrega cada una de estas variables:

### Variables Obligatorias:
- `VITE_FIREBASE_PROJECT_ID` = tu-project-id
- `VITE_FIREBASE_API_KEY` = tu-api-key

### Variables Recomendadas:
- `VITE_FIREBASE_AUTH_DOMAIN` = tu-auth-domain
- `VITE_FIREBASE_STORAGE_BUCKET` = tu-storage-bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = tu-sender-id
- `VITE_FIREBASE_APP_ID` = tu-app-id

### Variables Opcionales:
- `VITE_FIREBASE_DYNAMIC_LINK_DOMAIN` = tu-dynamic-link-domain (si usas)
- `VITE_FEATURE_PROGRESS_NOTES` = false (o true)

**Nota:** Los secretos se inyectan automáticamente como variables de entorno en el Codespace.

## 🎯 Paso 3: Crear Codespace

### Opción A: Desde GitHub.com (Más fácil)
1. Ve a tu repo en GitHub.com
2. Click botón verde **"Code"**
3. Tab **"Codespaces"**
4. Click **"Create codespace on clean"** (o tu branch)
5. Espera 2-3 minutos (primera vez)
6. ¡Se abre VS Code en el navegador!

### Opción B: Desde Cursor (Recomendado)
1. Instala la extensión GitHub Codespaces en Cursor:
   - Abre Cursor
   - Command Palette (`Ctrl+Shift+P`)
   - `Extensions: Install Extensions`
   - Busca "GitHub Codespaces"
   - Instala

2. Conecta Cursor al Codespace:
   - Command Palette (`Ctrl+Shift+P`)
   - `Codespaces: Create New Codespace`
   - Selecciona tu repo y branch
   - ¡Cursor se conecta al Codespace!

## 🔧 Paso 4: Verificar Instalación

Una vez que el Codespace esté listo:

```bash
# Verificar Node.js
node --version  # Debe ser 20.19.3

# Verificar pnpm
pnpm --version

# Verificar variables de entorno
echo $VITE_FIREBASE_PROJECT_ID  # Debe mostrar tu project ID

# Instalar dependencias (se ejecuta automáticamente, pero puedes verificar)
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

## 🌐 Paso 5: Acceder a la Aplicación

El Codespace automáticamente:
- Expone el puerto 5173 (Vite Dev Server)
- Te muestra una notificación con la URL pública
- La URL será algo como: `https://xxxxx-5173.app.github.dev`

## 💡 Ventajas de Codespaces

✅ **Cero instalación** - No necesitas Docker localmente
✅ **Siempre actualizado** - Código en GitHub, entorno en GitHub
✅ **Multi-dispositivo** - Mismo entorno desde Windows, Mac, Tablet
✅ **Cursor compatible** - Funciona perfectamente con Cursor
✅ **Gratis** - 120 horas/mes gratis (suficiente para 1-2 devs)

## 🔄 Sincronización

- **Cambios en código**: Se guardan automáticamente en GitHub
- **Cambios en otros dispositivos**: Se sincronizan automáticamente
- **No necesitas git pull**: Todo está en la nube

## 🆘 Troubleshooting

### El Codespace no inicia
- Verifica que tengas permisos en el repo
- Verifica que la rama `clean` exista en GitHub

### Variables de entorno no funcionan
- Verifica que los secretos estén en **Codespaces** (no Actions)
- Reinicia el Codespace después de agregar secretos

### Puerto no se expone
- Verifica que el servidor esté corriendo (`pnpm dev`)
- Revisa la pestaña "Ports" en VS Code

## 📚 Recursos

- [Documentación oficial de Codespaces](https://docs.github.com/en/codespaces)
- [Configuración de devcontainers](https://containers.dev/)
