# 🔧 Fix de Watchers - 2025-11-15

## Problema
Los watchers de Vite estaban causando loops infinitos de recarga (HMR updates múltiples del mismo archivo).

## Solución Implementada

### 1. Configuración de Vite (`vite.config.ts`)
- Agregado `server.watch.ignored` con lista exhaustiva de directorios y archivos a ignorar
- Deshabilitado polling por defecto (`usePolling: false`)
- Configurado HMR overlay para mejor debugging

### 2. Configuración de VSCode (`.vscode/settings.json`)
- Expandido `files.watcherExclude` para incluir más directorios
- Agregado `files.exclude` para ocultar directorios `.vite` del explorador

### 3. Gitignore
- Agregado `.vite/` y `node_modules/.vite/` para evitar tracking de cache

## Directorios/Archivos Ignorados

### Por Vite
- `node_modules/`, `.git/`, `dist/`, `.vite/`
- `backups/`, `canonical_snapshots/`
- `docs/`, `test/`, `tests/`
- `scripts/`, `.github/`, `functions/`
- `emulator-data/`, `coverage/`
- `_deprecated/`, `_trash/`, `z_trash/`
- Archivos de test: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
- Archivos de configuración: `tsconfig*.json`, `vite.config*.ts`, `eslint*.js`
- Lock files: `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`

### Por VSCode
- Todos los anteriores más exclusión de archivos `.vite` del explorador

## Resultado Esperado
- ✅ Solo cambios en `src/` deberían disparar HMR
- ✅ Sin recargas múltiples del mismo archivo
- ✅ CPU más baja
- ✅ Desarrollo más fluido

## Verificación
Después de aplicar estos cambios:
1. Reiniciar el servidor de desarrollo (`npm run dev`)
2. Limpiar cache si es necesario: `rm -rf node_modules/.vite .vite`
3. Verificar que solo cambios en `src/` causen recargas

## Notas
- Si el problema persiste, considerar usar `vite.config.uat.ts` con configuración aún más restrictiva
- Los watchers de TypeScript ya estaban deshabilitados en `.vscode/settings.json`

