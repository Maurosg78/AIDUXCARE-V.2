# AiDuxCare V.2.15.7

Sistema de asistencia clínica con AI para profesionales de la salud.

## Requisitos

- Node.js 16.x o superior
- npm 8.x o superior

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:

```bash
npm install
```

O usar el script de instalación:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. Configurar variables de entorno:

Copiar el archivo `.env.example` a `.env` y completar con los valores correspondientes:

```bash
cp .env.example .env
```

## Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

## Compilación

Para compilar el proyecto para producción:

```bash
npm run build
```

## Despliegue en Vercel

### Preparación

1. Asegurarse de tener configuradas todas las variables de entorno en Vercel
2. Verificar que el archivo `vercel.json` esté configurado correctamente

### Comandos para despliegue

```bash
# Instalar CLI de Vercel
npm i -g vercel

# Login
vercel login

# Despliegue de desarrollo
vercel

# Despliegue de producción
vercel --prod
```

## Estructura del proyecto

- `/src/core` - Lógica central y modelos de dominio
- `/src/features` - Características de la aplicación organizadas por dominio
- `/src/shared` - Componentes compartidos y utilidades
- `/src/services` - Servicios externos e integraciones

## Variables de entorno

Para una descripción detallada de las variables de entorno necesarias, consultar el archivo `.env.example` o la documentación en `.vercel/README.txt`.

# AIDUXCARE V.2

Asistente clínico inteligente rediseñado desde cero.

# trigger validate workflow


### 📘 Roadmap de versiones – AiDuxCare V.2

#### ✅ Versión `v2.7.0` – `runClinicalAgent`: orquestador clínico de alto nivel
**Fecha:** 2025-05-15  
**Estado:** ✅ Completado y testeado  
**Descripción:**  
Implementación del módulo `runClinicalAgent`, una función de orquestación que permite al sistema ejecutar el agente clínico a partir del contexto MCP (Memoria Clínica del Paciente), de forma desacoplada y segura.

**Características clave:**
- Transforma el `MCPContext` en un `AgentContext` válido.
- Ejecuta el agente LLM usando `executeAgent`.
- Devuelve sugerencias clínicas y un array preparado para futuras auditorías (`auditLogs`).
- Manejo robusto de errores y fallback a estado seguro.
- Totalmente compatible con múltiples proveedores: `'openai'`, `'anthropic'`, `'mistral'`, `'custom'`.
- Tests unitarios exhaustivos con Vitest.
- Preparado para integración futura con LLMs reales.

**Archivos clave:**
- `src/core/agent/runClinicalAgent.ts`
- `__tests__/core/agent/runClinicalAgent.test.ts`

**Verificaciones técnicas:**
- ✅ `npx tsc --noEmit`
- ✅ `npm run lint`
- ✅ `npm test`
- ✅ CI/Workflow GitHub Actions
- ✅ Etiqueta Git `v2.7.0` aplicada


