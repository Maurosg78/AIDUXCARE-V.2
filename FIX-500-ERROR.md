# 🔧 Fix: Error 500 en chunk-5ZW6OB72.js

**Problema:** El servidor responde con 500 al intentar cargar un chunk de JavaScript.

## Causa Probable

El error 500 en un chunk generalmente indica:
- Chunk fue generado en un build anterior y ya no existe
- Servidor de desarrollo desincronizado con el estado actual
- Cache corrupto de Vite

## Solución Rápida

### Opción 1: Reiniciar Servidor (Desarrollo)

```bash
cd ~/Desktop/AIDUXCARE-V.2-clean

# 1. Detener servidor actual
pkill -f "vite.*5174" || lsof -ti:5174 | xargs kill -9

# 2. Limpiar cache de Vite
rm -rf node_modules/.vite
rm -rf .vite

# 3. Reiniciar servidor
pnpm run dev
```

### Opción 2: Rebuild Completo (Producción/Desarrollo)

```bash
cd ~/Desktop/AIDUXCARE-V.2-clean

# 1. Detener servidor
pkill -f "vite.*5174" || lsof -ti:5174 | xargs kill -9

# 2. Limpiar todo
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite

# 3. Rebuild
pnpm run build

# 4. Si es desarrollo, reiniciar
pnpm run dev
```

### Opción 3: Hard Refresh en Browser

Si el error persiste:
1. Abre DevTools (F12)
2. Click derecho en el botón de refresh
3. Selecciona "Empty Cache and Hard Reload"

O en la consola del browser:
```javascript
location.reload(true)
```

## Prevención

Para evitar esto en el futuro:
- Limpiar `dist/` y `.vite/` antes de cambios grandes
- Detener servidor antes de rebuilds importantes
- Usar `--force` en vite si hay problemas de cache: `pnpm run dev -- --force`

## Nota

Este error **NO está relacionado** con los cambios de estabilización (WO-PILOT-STAB-04/05). Es un problema común de sincronización entre servidor y chunks generados.

