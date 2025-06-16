# 🩺 AiDuxCare V.2

## 🎯 **Descripción**

AiDuxCare V.2 es una plataforma EMR (Electronic Medical Records) moderna y escalable, desarrollada con React, TypeScript y Vite. La plataforma utiliza inteligencia artificial avanzada para transcripción médica, análisis de texto clínico y asistencia en flujos de trabajo médicos.

---

## ✨ **Características Principales**

### **🤖 Inteligencia Artificial Médica**
- **Transcripción en tiempo real** con Google Cloud Speech-to-Text
- **Análisis NLP médico** especializado por disciplina
- **Clasificación automática** inicial/seguimiento
- **Detección de banderas rojas** por especialidad

### **👥 Gestión de Pacientes**
- **Lista de pacientes** con filtros avanzados
- **Perfiles completos** con historial médico
- **Consultas estructuradas** con formato SOAP
- **Métricas de seguimiento** automáticas

### **🔊 Procesamiento de Audio**
- **Captura de audio** profesional en tiempo real
- **Speaker Diarization** (identificación de hablantes)
- **Procesamiento inteligente** por contexto clínico
- **Transcripción automática** con alta precisión

### **⚡ Rendimiento y Escalabilidad**
- **Arquitectura moderna** React 18 + TypeScript
- **Build optimizado** con Vite (<10s)
- **Memory leaks eliminados** completamente
- **Hot Module Replacement** para desarrollo

---

## 🚀 **Inicio Rápido**

### **Requisitos Previos**
```bash
Node.js >= 18.0.0
npm >= 8.0.0
```

### **Instalación**
```bash
# Clonar repositorio
git clone <repository-url>
cd AIDUXCARE-V.2

# Instalar dependencias
npm install --force

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar desarrollo
npm run dev
```

### **Scripts Disponibles**
```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run lint             # Linting de código
npm run type-check       # Verificación de tipos
npm run test             # Suite de tests
npm run cleanup:weekly   # Limpieza automática
npm run audit:files      # Auditoría de archivos
npm run validate:structure # Validación de estructura
```

---

## 🏗️ **Arquitectura**

### **Stack Tecnológico**
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite 5.x
- **AI Services**: Google Cloud AI Platform
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Testing**: Vitest, Testing Library

### **Estructura del Proyecto**
```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas principales
├── services/           # Servicios y APIs
├── hooks/              # React hooks personalizados
├── contexts/           # Contextos de React
├── types/              # Definiciones de tipos
├── utils/              # Utilidades y helpers
└── shared/             # Componentes compartidos

scripts/                # Scripts de automatización
config/                 # Configuraciones
docs/                   # Documentación técnica
```

---

## 🔧 **Configuración**

### **Variables de Entorno Requeridas**
```env
# Google Cloud AI
VITE_GOOGLE_CLOUD_PROJECT_ID=your-project-id
VITE_GOOGLE_CLOUD_LOCATION=us-central1

# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key

# Firebase (opcional)
VITE_FIREBASE_CONFIG=your-firebase-config
```

### **Servicios Externos**
- **Google Cloud AI Platform**: Transcripción y NLP
- **Supabase**: Base de datos y autenticación
- **Firebase**: Servicios adicionales (opcional)

---

## 🧪 **Testing**

### **Ejecutar Tests**
```bash
npm run test              # Tests unitarios
npm run test:watch        # Modo watch
npm run test:coverage     # Con cobertura
npm run test:core         # Tests del core
```

### **Calidad de Código**
```bash
npm run lint              # ESLint
npm run type-check        # TypeScript
npm run format            # Prettier
npm run maintenance:full  # Mantenimiento completo
```

---

## 📈 **Estado del Proyecto**

### **Métricas de Calidad**
- ✅ **Build Time**: <10s (optimizado)
- ✅ **Memory Leaks**: 0 (eliminados completamente)
- ✅ **TypeScript**: Strict mode habilitado
- ✅ **Code Quality**: Score >90/100
- ✅ **Structure Compliance**: 100%

### **Últimas Mejoras**
- **Refactorización completa** de intervalos (Fase 3)
- **Depuración masiva** de archivos obsoletos
- **Políticas de mantenimiento** automatizadas
- **CI/CD pipeline** implementado

---

## 🤝 **Contribución**

### **Flujo de Desarrollo**
1. Crear feature branch desde `main`
2. Desarrollar siguiendo las políticas establecidas
3. Ejecutar `npm run maintenance:full` antes del commit
4. Crear Pull Request con descripción detallada
5. Pasar revisión de código y CI/CD

### **Políticas de Código**
Ver [`.github/DEVELOPMENT_POLICIES.md`](.github/DEVELOPMENT_POLICIES.md) para políticas detalladas de mantenimiento y calidad.

---

## 📚 **Documentación**

- **[Arquitectura](docs/ARCHITECTURE.md)**: Diseño técnico del sistema
- **[API Reference](docs/API_REFERENCE.md)**: Documentación de APIs
- **[Deployment](docs/DEPLOYMENT.md)**: Guía de despliegue
- **[Políticas de Desarrollo](.github/DEVELOPMENT_POLICIES.md)**: Estándares de código

---

## 📞 **Soporte**

Para preguntas técnicas o soporte:
- **Issues**: Crear issue en GitHub
- **Documentación**: Revisar carpeta `docs/`
- **Políticas**: Consultar development policies

---

## 📄 **Licencia**

Este proyecto está licenciado bajo los términos especificados en el contrato de desarrollo.

---

*Última actualización: 16 de Junio 2024*  
*Versión: 2.0*  
*Estado: Producción Ready* 