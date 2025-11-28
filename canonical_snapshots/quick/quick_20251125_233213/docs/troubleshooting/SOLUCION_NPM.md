# 🔧 Solución para npm install que se Cuelga

## Problema Identificado

**Múltiples procesos npm install colgados** bloqueando nuevas instalaciones.

## Solución Inmediata

### Paso 1: Matar Todos los Procesos npm

```bash
pkill -9 -f "npm install"
pkill -9 -f "npm exec"
pkill -9 -f "npm"
```

### Paso 2: Probar Alternativas

#### Opción A: Usar yarn (RECOMENDADO)

```bash
# Instalar yarn si no está
npm install -g yarn

# Usar yarn para instalar dependencias
yarn install
```

**Ventajas de yarn**:
- ✅ Más rápido que npm
- ✅ Más estable
- ✅ Mejor manejo de cache
- ✅ No se cuelga tan fácilmente

#### Opción B: Instalación Incremental

```bash
# Instalar solo dependencias críticas primero
npm install react react-dom --save --no-save
npm install vite @vitejs/plugin-react --save-dev --no-save

# Luego el resto en grupos pequeños
npm install
```

#### Opción C: npm con flags específicos

```bash
# Sin scripts (más rápido)
npm install --ignore-scripts

# Con registry explícito
npm install --registry https://registry.npmjs.org/

# Sin audit (más rápido)
npm install --no-audit
```

## Diagnóstico

Si **todas** las opciones se cuelgan, el problema puede ser:

1. **Sistema de archivos lento**: Reiniciar Mac puede ayudar
2. **Memoria insuficiente**: Cerrar otras aplicaciones
3. **Problema con Volta**: Desactivar temporalmente
4. **Problema de red**: Verificar conexión a internet

## Recomendación Final

**Usar yarn** es la mejor opción cuando npm tiene problemas:

```bash
# 1. Matar procesos npm
pkill -9 -f npm

# 2. Instalar yarn
npm install -g yarn

# 3. Instalar dependencias con yarn
yarn install

# 4. Usar yarn para scripts
yarn dev
yarn build
```

