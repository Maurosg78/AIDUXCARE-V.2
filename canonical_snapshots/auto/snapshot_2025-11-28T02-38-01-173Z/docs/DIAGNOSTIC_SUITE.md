# 🔍 Suite de Diagnóstico por Capas

## Propósito

Esta suite de tests diagnostica problemas del sistema de desarrollo de forma sistemática, yendo de superficial a profundo para identificar exactamente dónde está el fallo.

## Estructura de Capas

### Capa 1: Sistema Operativo y Entorno Básico
- OS, Shell, Usuario, Directorio actual
- **Si falla aquí**: Problema del sistema operativo

### Capa 2: Node.js y npm
- Versiones, paths, ejecución básica
- **Si falla aquí**: Problema con Node.js o Volta

### Capa 3: Archivos y Permisos
- Existencia de archivos críticos
- Permisos de ejecución
- **Si falla aquí**: Problema de permisos o archivos faltantes

### Capa 4: Scripts Básicos
- Ejecución de check-env.cjs
- **Si falla aquí**: Problema con scripts o dotenv

### Capa 5: Vite Básico
- Existencia de binario
- Comando --version
- **Si falla aquí**: Problema con instalación de Vite

### Capa 6: Dependencias Críticas
- React, React-DOM, plugins
- **Si falla aquí**: Problema con node_modules

### Capa 7: Configuración Vite
- Sintaxis de vite.config.ts
- **Si falla aquí**: Problema de configuración

### Capa 8: Procesos y Recursos
- Procesos corriendo
- Puertos en uso
- Memoria disponible
- **Si falla aquí**: Problema de recursos del sistema

### Capa 9: Build Test
- Build básico sin watch
- **Si falla aquí**: Problema con el proceso de build

### Capa 10: Resumen
- Consolidación de resultados

## Cómo Usar

### Ejecutar Todos los Diagnósticos

```bash
bash RUN_ALL_DIAGNOSTICS.sh
```

### Ejecutar Diagnósticos Individuales

```bash
# Diagnóstico del sistema completo
bash scripts/diagnose-system.sh

# Diagnóstico específico de Node.js y Volta
bash scripts/diagnose-node.sh

# Diagnóstico específico de Vite
bash scripts/diagnose-vite.sh
```

## Interpretación de Resultados

### ✅ Test Pasado
- El componente funciona correctamente
- Puedes continuar a la siguiente capa

### ❌ Test Fallido
- El componente tiene un problema
- **Esta es la capa problemática**
- Revisa los detalles del error

### TIMEOUT
- El comando se colgó
- **Problema grave**: El componente no responde
- Puede indicar:
  - Proceso bloqueado
  - Sistema de archivos lento
  - Memoria insuficiente
  - Proceso zombie

## Ejemplos de Problemas Comunes

### Problema: Node.js se cuelga
**Capa afectada**: Capa 2 (Node.js y npm)
**Solución**: 
- Verificar Volta
- Reinstalar Node.js
- Desactivar Volta temporalmente

### Problema: Vite --version se cuelga
**Capa afectada**: Capa 5 (Vite Básico)
**Solución**:
- Reinstalar Vite: `npm install vite@latest --force`
- Verificar node_modules
- Limpiar cache: `rm -rf node_modules/.vite`

### Problema: Build se cuelga
**Capa afectada**: Capa 9 (Build Test)
**Solución**:
- Verificar configuración de Vite
- Revisar procesos bloqueantes
- Verificar memoria disponible

## Próximos Pasos Después del Diagnóstico

1. **Identificar la primera capa con problemas**
2. **Revisar los detalles del error en esa capa**
3. **Aplicar solución específica para esa capa**
4. **Re-ejecutar diagnóstico para verificar**

## Archivos de la Suite

- `scripts/diagnose-system.sh` - Diagnóstico completo del sistema
- `scripts/diagnose-node.sh` - Diagnóstico de Node.js y Volta
- `scripts/diagnose-vite.sh` - Diagnóstico específico de Vite
- `RUN_ALL_DIAGNOSTICS.sh` - Ejecuta todos los diagnósticos
- `docs/DIAGNOSTIC_SUITE.md` - Esta documentación

