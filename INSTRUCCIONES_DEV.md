# 📋 Instrucciones para Desarrollo

## Problema Actual

`npm run dev:build` se detiene después de `check-env` y no ejecuta el build. Esto sugiere que hay un problema con cómo npm está ejecutando los comandos encadenados.

## Solución: Usar Scripts Bash Directos

### Opción 1: Build + Serve en Una Terminal (Simple)

```bash
bash BUILD_AND_SERVE.sh
```

Este script:
1. ✅ Verifica entorno
2. ✅ Hace build inicial
3. ✅ Inicia servidor en puerto 5174

**Para rebuild**: Abre otra terminal y ejecuta:
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
node node_modules/vite/bin/vite.js build --mode development
```

### Opción 2: Build con Watch + Serve Separado (Recomendado)

**Terminal 1** (Build con watch - se queda corriendo):
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
node scripts/check-env.cjs
node node_modules/vite/bin/vite.js build --watch --mode development
```

**Terminal 2** (Servir - se queda corriendo):
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
npx serve dist -p 5174
```

**Ventajas**:
- ✅ Rebuild automático cuando cambias archivos
- ✅ Servidor estable
- ✅ No se cuelga

### Opción 3: Build Manual Cuando Necesites

**Terminal 1** (Build cuando cambies código):
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
node scripts/check-env.cjs && node node_modules/vite/bin/vite.js build --mode development
```

**Terminal 2** (Servir - se queda corriendo):
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
npx serve dist -p 5174
```

## Comandos Útiles

### Verificar que Build Funciona
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
node node_modules/vite/bin/vite.js build --mode development
```

### Verificar que dist/ existe
```bash
ls -la dist/
ls -la dist/index.html
ls -la dist/assets/
```

### Limpiar y Rebuild
```bash
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
rm -rf dist
node node_modules/vite/bin/vite.js build --mode development
```

## Flujo de Trabajo Recomendado

1. **Iniciar servidor** (una vez):
   ```bash
   npx serve dist -p 5174
   ```

2. **Hacer cambios** en tu código

3. **Rebuild** (cuando necesites ver cambios):
   ```bash
   node node_modules/vite/bin/vite.js build --mode development
   ```

4. **Refrescar navegador** en `http://localhost:5174`

## Scripts Disponibles

- ✅ `BUILD_AND_SERVE.sh` - Build inicial + serve
- ✅ `START_VITE.sh` - Intentar dev server (puede colgarse)
- ✅ `FIX_DEV_HANG.sh` - Dev server alternativo (puede colgarse)
- ✅ `DEV_WITH_BUILD.sh` - Build con watch

## Recomendación Final

**Usa Opción 2** (Build con Watch + Serve Separado):
- Más estable
- Rebuild automático
- No se cuelga
- Funciona siempre

