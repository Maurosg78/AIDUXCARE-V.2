# 🔧 Fix: "Unexpected token '<'" Error

## 🔴 Problema
Error en consola: `SyntaxError: Unexpected token '<'`

## 🧠 Causa
El navegador está intentando parsear HTML como JavaScript. Esto ocurre cuando:
- El servidor devuelve HTML (404, 500, etc.) en lugar del archivo JS esperado
- Hay un problema con el cache del navegador
- El servidor de desarrollo está sirviendo archivos incorrectos

## ✅ Soluciones (en orden)

### 1. Limpiar Cache del Navegador
```bash
# En Chrome/Edge:
# 1. Abre DevTools (F12)
# 2. Click derecho en el botón de recargar
# 3. Selecciona "Empty Cache and Hard Reload"

# O manualmente:
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (Mac)
# → Selecciona "Cached images and files"
# → "Clear data"
```

### 2. Verificar que el Servidor Esté Corriendo Correctamente

**Si estás usando `npm run dev`:**
```bash
# Detén el servidor (Ctrl+C)
# Limpia el cache de Vite
rm -rf node_modules/.vite
# Reinicia el servidor
npm run dev
```

**Si estás usando el build de producción:**
```bash
# Verifica que los archivos estén en dist/
ls -la dist/assets/

# Si usas Firebase Hosting:
firebase serve --only hosting
```

### 3. Verificar Rutas en el Navegador

Abre DevTools → Network tab:
- Busca el archivo `index-CJhpiU8t.js` (o el nombre actual)
- Verifica que:
  - Status sea `200 OK`
  - Content-Type sea `application/javascript` o `text/javascript`
  - NO sea `text/html`

Si ves `text/html` o status `404`, el servidor está sirviendo HTML en lugar de JS.

### 4. Rebuild Completo

```bash
# Limpia todo
rm -rf dist
rm -rf node_modules/.vite

# Rebuild
npm run build

# Verifica que los archivos se generaron
ls -la dist/assets/index-*.js
```

### 5. Verificar Configuración del Servidor

Si estás usando Firebase Hosting, verifica `firebase.json`:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**IMPORTANTE:** El rewrite a `/index.html` debe ser SOLO para rutas que no sean archivos estáticos (JS, CSS, etc.).

### 6. Verificar que No Haya Errores de Sintaxis

```bash
# Verifica que el código compile sin errores
npm run build

# Si hay errores, corrígelos primero
```

## 🎯 Solución Rápida (Más Común)

1. **Cierra todas las pestañas del navegador con la app**
2. **Limpia el cache completamente** (Ctrl+Shift+Delete)
3. **Reinicia el servidor de desarrollo** (si usas `npm run dev`)
4. **Abre una nueva pestaña en modo incógnito**
5. **Navega a la app**

Si el problema persiste, el error está en el servidor que está sirviendo los archivos, no en el código.

## 📝 Debug Adicional

Si nada funciona, revisa en DevTools → Network:
1. ¿Qué archivo está fallando? (busca el que tiene status 404 o Content-Type: text/html)
2. ¿Cuál es la URL completa que está intentando cargar?
3. ¿El servidor está respondiendo correctamente?
