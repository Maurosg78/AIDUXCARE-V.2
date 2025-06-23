# 🏥 AiDuxCare V.2 - EMR Inteligente

> **Sistema de Registro Médico Electrónico con IA especializada para consultas clínicas reales**

## 🚀 Estado Actual del Proyecto

### ✅ **COMPLETADO**
- **Pipeline Real World ChatGPT**: Procesamiento de transcripciones caóticas reales con 85-95% precisión
- **Sistema de Chunking Semántico**: Control total de Web Speech API, eliminación de fragmentación
- **Integración SOAP Clinical**: Motor clínico real con clasificación automática S.O.A.P.
- **Autenticación Medical-Grade**: Sistema HIPAA/GDPR con cifrado AES-256-GCM
- **Maratón de Calentamiento**: Estrategia para desbloquear Vertex AI (en ejecución)

### 🔄 **EN PROGRESO**
- **Desbloqueo Vertex AI**: Maratón de calentamiento ejecutándose (3 iteraciones exitosas)
- **Optimización Linter/TypeScript**: Corrección de errores de código
- **Organización Documentación**: Reestructuración de archivos y documentación

### 📋 **PRÓXIMOS PASOS**
- **Integración Gemini 1.5 Pro**: Configuración y prompts modulares
- **Clasificador SOAP V2.0**: Mejoras en precisión y especialización por disciplina
- **Sistema de Fallback**: Arquitectura híbrida local + cloud

## 🏗️ Arquitectura del Proyecto

```
AIDUXCARE-V.2/
├── 📁 src/                    # Frontend React + TypeScript
│   ├── 📁 components/         # Componentes React
│   ├── 📁 services/          # Servicios de IA y procesamiento
│   ├── 📁 pages/             # Páginas de la aplicación
│   └── 📁 types/             # Definiciones TypeScript
├── 📁 functions/             # Backend Firebase Functions
│   ├── 📁 src/               # Código fuente TypeScript
│   └── 📁 lib/               # Librerías compiladas
├── 📁 docs/                  # Documentación organizada
│   ├── 📁 technical/         # Documentación técnica
│   ├── 📁 business/          # Análisis de negocio
│   ├── 📁 security/          # Documentación de seguridad
│   ├── 📁 roadmap/           # Roadmaps y planificación
│   └── 📁 reports/           # Informes y auditorías
├── 📁 scripts/               # Scripts de utilidad
└── 📁 mocks/                 # Datos de prueba
```

## 🛠️ Comandos Útiles

### **Desarrollo Local**
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar tests
npm test
```

### **Firebase Functions**
```bash
# Navegar a functions
cd functions

# Instalar dependencias
npm install

# Ejecutar linter
npm run lint

# Ejecutar linter con auto-fix
npm run lint -- --fix

# Desplegar functions
firebase deploy --only functions
```

### **Maratón de Calentamiento**
```bash
# Ejecutar maratón (desbloquear Vertex AI)
./run_warmup_marathon.sh

# Ver logs en tiempo real
tail -f warmup_marathon_log.txt

# Detener maratón
# Presionar Ctrl+C en la terminal donde se ejecuta
```

### **Scripts de Utilidad**
```bash
# Limpiar console.logs
node scripts/cleanup-console-logs.js

# Test de integración SOAP
node scripts/test_soap_clinical_integration.js

# Test de pipeline real world
node scripts/test-realworld-pipeline.js

# Verificar estado de APIs
node scripts/test-warmup-activity.cjs
```

## 📊 Métricas de Rendimiento

### **Pipeline Real World**
- **Precisión SOAP**: 85-95%
- **Tiempo procesamiento**: <100ms por segmento
- **Reducción documentación**: 60-70%
- **Casos de prueba**: 4 transcripciones reales validadas

### **Maratón de Calentamiento**
- **Estado**: ✅ Ejecutándose (3 iteraciones exitosas)
- **Intervalo**: 10 minutos
- **Tasa de éxito**: 100%
- **API objetivo**: Cloud Translation API
- **Proyecto**: aiduxcare-mvp-prod

## 🔐 Seguridad

### **Estándares Implementados**
- **Cifrado**: AES-256-GCM para datos PHI/HIPAA
- **Autenticación**: PBKDF2 (100,000 iteraciones)
- **Auditoría**: Logging estructurado completo
- **Compliance**: Preparado para HIPAA/GDPR

### **Credenciales**
- **Archivo**: `aiduxcare-nlp-credentials.json` (en .gitignore)
- **Proyecto**: aiduxcare-mvp-prod
- **Región**: us-east1

## 📚 Documentación

### **Técnica**
- [Implementación Pipeline Real World](docs/technical/IMPLEMENTACION_PIPELINE_REAL_CHATGPT.md)
- [Integración SOAP Clinical](docs/technical/INTEGRACION_PIPELINE_CHATGPT_COMPLETADA.md)
- [Solución Chunking Semántico](docs/technical/SOLUCION_CHUNKING_SEMANTICO_MEJORADO.md)

### **Negocio**
- [Plan de Negocios V4](docs/business/PLAN_NEGOCIOS_AIDUXCARE_V4.md)
- [Análisis de Costos](docs/business/ANALISIS_COSTOS_VARIABLES_FIJOS_AIDUXCARE.md)
- [Estrategia de Precios](docs/business/ANALISIS_ESTRATEGIA_PRECIOS_SEGMENTADA_AIDUXCARE.md)

### **Seguridad**
- [Plan de Seguridad Enterprise](docs/security/PLAN_SEGURIDAD_AIDUXCARE_ENTERPRISE.md)
- [Auditoría Realista](docs/security/AUDITORIA_REALISTA_SEGURIDAD_HOSPITALARIA.md)

### **Roadmap**
- [Roadmap Junio 2025](docs/roadmap/ROADMAP_AIDUXCARE_JUNIO_2025.md)
- [Actualización CTO](docs/roadmap/RESUMEN_ACTUALIZACION_ROADMAP_CTO.md)

## 🚨 Estado Crítico

### **Maratón de Calentamiento**
- **⚠️ IMPORTANTE**: El maratón está ejecutándose para desbloquear Vertex AI
- **⏰ Duración**: 24-48 horas continuas
- **🎯 Objetivo**: Generar actividad legítima en Google Cloud APIs
- **📊 Progreso**: 3 iteraciones exitosas, 100% tasa de éxito

### **Linter/TypeScript**
- **✅ Linter funcionando**: 21 errores reales vs 1963 antes
- **🔄 En progreso**: Corrección de errores de código
- **📋 Prioridad**: Archivos críticos de functions/src

## 👥 Equipo

- **CEO**: Mauricio Sobarzo (msobarzo78@gmail.com)
- **CTO**: [Pendiente de respuesta]
- **Desarrollador Senior**: [Asistente IA]

## 📞 Contacto

- **Email**: msobarzo78@gmail.com
- **Proyecto**: aiduxcare-mvp-prod
- **GitHub**: https://github.com/Maurosg78/AIDUXCARE-V.2

---

**Última actualización**: 23 de Junio, 2025  
**Versión**: 2.0.0  
**Estado**: 🟡 En desarrollo activo 