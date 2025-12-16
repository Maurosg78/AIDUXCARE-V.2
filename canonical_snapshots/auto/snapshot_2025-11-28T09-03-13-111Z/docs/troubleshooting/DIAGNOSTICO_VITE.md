# 🔍 Diagnóstico: Vite se Cuelga

## Problema
Vite se cuelga al iniciar, incluso con configuración mínima.

## Posibles Causas

### 1. Vite está escaneando demasiados archivos
Vite escanea todos los archivos del proyecto al iniciar. Con muchos archivos puede colgarse.

### 2. Problema con el sistema de archivos
El sistema de archivos puede estar sobrecargado o tener problemas de permisos.

### 3. Proceso bloqueando I/O
Algún proceso puede estar bloqueando operaciones de lectura de archivos.

## Soluciones

### Solución 1: Usar Build + Serve (RECOMENDADO)
En lugar de dev server, usa build estático:

```bash
# Terminal 1: Build
cd /Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2
node node_modules/vite/bin/vite.js build

# Terminal 2: Servir
npx serve dist -p 5174
```

### Solución 2: Limitar archivos que Vite escanea
Crear `.viterc` o modificar `vite.config.ts` para excluir más archivos.

### Solución 3: Usar servidor HTTP simple
```bash
# Instalar http-server
npm install -g http-server

# Build
node node_modules/vite/bin/vite.js build

# Servir
http-server dist -p 5174 -c-1
```

### Solución 4: Verificar qué está bloqueando
```bash
# Ver procesos de Node
ps aux | grep node

# Ver qué está usando el puerto
lsof -i :5174

# Ver procesos de I/O
iostat -w 1
```

## Comando de Emergencia

Si necesitas trabajar AHORA sin dev server:

```bash
# Build una vez
node node_modules/vite/bin/vite.js build

# Servir con Python (si está instalado)
cd dist
python3 -m http.server 5174
```

