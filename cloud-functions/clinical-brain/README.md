# AiDuxCare Clinical Brain - Vertex AI Orchestrator

## Descripción

El **Clinical Brain** es el orquestador de inteligencia artificial de AiDuxCare que transforma transcripciones médicas en análisis clínicos estructurados. Utiliza Vertex AI (Gemini 1.5 Pro) para generar advertencias de seguridad, sugerencias clínicas y evaluaciones de calidad de sesiones médicas.

## Arquitectura

```
Transcripción → PromptFactory → VertexAI → ResponseParser → Análisis Estructurado
                     ↓
                KnowledgeBase (Cloud Storage)
```

### Componentes Principales

1. **PromptFactory**: Genera super-prompts especializados por disciplina médica
2. **VertexAIClient**: Maneja la comunicación con Gemini 1.5 Pro
3. **ResponseParser**: Estructura y valida las respuestas de IA
4. **KnowledgeBase**: Carga configuración dinámica desde Cloud Storage

## Instalación

### Prerrequisitos

- Node.js 18+
- Google Cloud SDK
- Permisos de Vertex AI y Cloud Storage

### Configuración

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
export GOOGLE_CLOUD_PROJECT_ID="aiduxcare-mvp"
export VERTEX_AI_LOCATION="us-central1"
export VERTEX_AI_MODEL="gemini-1.5-pro"
export KNOWLEDGE_BASE_BUCKET="aiduxcare-clinical-knowledge"
```

3. **Autenticación de Google Cloud**:
```bash
gcloud auth application-default login
```

## Uso

### Desarrollo Local

```bash
npm run dev
```

La función estará disponible en `http://localhost:8080`

### Despliegue a Producción

```bash
npm run deploy
```

## API Endpoints

### POST /analyze

Analiza una transcripción médica y devuelve análisis clínico estructurado.

**Request Body**:
```json
{
  "transcription": "Transcripción completa de la sesión médica...",
  "specialty": "physiotherapy|psychology|general",
  "sessionType": "initial|followup"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "warnings": [
      {
        "id": "warning_001",
        "severity": "HIGH|MEDIUM|LOW",
        "category": "contraindication|red_flag|safety_concern|clinical_alert",
        "title": "Título de la advertencia",
        "description": "Descripción detallada",
        "recommendation": "Acción recomendada",
        "evidence": "Evidencia clínica",
        "specialty": "physiotherapy",
        "timestamp": "2024-01-15T10:30:00Z",
        "confidence": 0.95
      }
    ],
    "suggestions": [
      {
        "id": "suggestion_001",
        "type": "assessment_question|treatment_modification|additional_evaluation|patient_education",
        "title": "Título de la sugerencia",
        "description": "Descripción detallada",
        "rationale": "Razón clínica",
        "priority": "HIGH|MEDIUM|LOW",
        "specialty": "physiotherapy",
        "timestamp": "2024-01-15T10:30:00Z",
        "relevance_score": 0.85
      }
    ],
    "soap_analysis": {
      "subjective_completeness": 85,
      "objective_completeness": 70,
      "assessment_quality": 90,
      "plan_appropriateness": 80,
      "overall_quality": 81,
      "missing_elements": ["Elemento faltante"]
    },
    "session_quality": {
      "communication_score": 85,
      "clinical_thoroughness": 78,
      "patient_engagement": 92,
      "professional_standards": 88,
      "areas_for_improvement": ["Área de mejora"]
    },
    "specialty_metrics": {
      "specialty": "physiotherapy",
      "clinical_accuracy_score": 87,
      "safety_compliance_score": 95,
      "completeness_score": 81
    }
  },
  "metadata": {
    "specialty": "physiotherapy",
    "sessionType": "initial",
    "processingTimeMs": 1250,
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### GET /health

Verifica el estado de salud del servicio.

**Response**:
```json
{
  "status": "healthy",
  "service": "clinical-brain",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

## KnowledgeBase

### Estructura de Archivos

```
knowledge-base/
├── base/
│   └── clinical-base.json          # Configuración base universal
└── specialties/
    ├── physiotherapy.json          # Configuración específica fisioterapia
    ├── psychology.json             # Configuración específica psicología
    └── general.json                # Configuración medicina general
```

### Formato de Configuración

```json
{
  "rules": {
    "specialty": [
      "Regla clínica específica",
      "Otra regla importante"
    ]
  },
  "terminology": {
    "specialty": [
      {
        "term": "Término médico",
        "definition": "Definición del término"
      }
    ]
  },
  "protocols": {
    "assessment": ["Protocolo de evaluación"],
    "treatment": ["Protocolo de tratamiento"]
  },
  "contraindications": {
    "absolute": ["Contraindicación absoluta"],
    "relative": ["Contraindicación relativa"]
  },
  "redFlags": {
    "specialty": [
      "Bandera roja específica",
      "Signo de alarma crítico"
    ]
  }
}
```

## Testing

### Ejecutar Tests

```bash
npm test
```

### Tipos de Tests

1. **Tests de Integración**: Verifican el flujo completo
2. **Tests Unitarios**: Validan componentes individuales
3. **Tests de Performance**: Aseguran tiempos de respuesta
4. **Tests de CORS**: Verifican configuración de headers

### Cobertura de Tests

- ✅ Validación de entrada
- ✅ Manejo de errores
- ✅ Parsing de respuestas
- ✅ Generación de prompts
- ✅ Configuración CORS
- ✅ Fallback responses

## Monitoreo

### Métricas Clave

1. **Tiempo de Procesamiento**: < 3 segundos target
2. **Tasa de Éxito**: > 95%
3. **Precisión Clínica**: > 85%
4. **Disponibilidad**: > 99.9%

### Logs Estructurados

Todos los logs incluyen:
- Timestamp ISO 8601
- Nivel de log (info, warn, error)
- Contexto clínico (specialty, sessionType)
- Métricas de performance
- Identificadores únicos

## Seguridad

### Configuración de Seguridad

1. **Filtros de Contenido**: Configuración restrictiva de Vertex AI
2. **Validación de Entrada**: Joi schemas para requests
3. **CORS**: Configuración restrictiva de orígenes
4. **Logging**: Sin exposición de datos sensibles

### Compliance

- ✅ HIPAA: Datos médicos protegidos
- ✅ GDPR: Procesamiento de datos personales
- ✅ SOC 2: Controles de seguridad
- ✅ ISO 27001: Gestión de seguridad

## Costos

### Estimación por Análisis

- **Vertex AI (Gemini 1.5 Pro)**: ~$0.021
- **Cloud Storage**: ~$0.0001
- **Cloud Functions**: ~$0.0001
- **Total**: ~$0.021 por análisis

### Optimizaciones

1. **Cache de KnowledgeBase**: 30 minutos
2. **Prompts Optimizados**: Tokens mínimos necesarios
3. **Batch Processing**: Futuro para múltiples análisis

## Desarrollo

### Estructura del Proyecto

```
cloud-functions/clinical-brain/
├── src/
│   └── services/
│       ├── PromptFactory.js
│       ├── VertexAIClient.js
│       ├── ResponseParser.js
│       └── KnowledgeBase.js
├── knowledge-base/
│   ├── base/
│   └── specialties/
├── test/
│   └── integration.test.js
├── package.json
├── index.js
└── README.md
```

### Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Roadmap

#### Semana 1 ✅
- [x] Estructura base de Cloud Function
- [x] PromptFactory con super-prompts
- [x] VertexAIClient básico
- [x] ResponseParser con validación
- [x] KnowledgeBase dinámica
- [x] Tests de integración

#### Semana 2 (En Progreso)
- [ ] Despliegue a producción
- [ ] Integración con frontend
- [ ] Testing con CTO
- [ ] Refinamiento de prompts

#### Semana 3-4 (Planificado)
- [ ] Optimización de performance
- [ ] Métricas avanzadas
- [ ] Configuración de especialidades adicionales
- [ ] Documentación de API completa

## Soporte

Para soporte técnico, contactar:
- **Email**: soporte@aiduxcare.com
- **Slack**: #clinical-brain-support
- **Documentación**: docs.aiduxcare.com

---

**Versión**: 1.0.0  
**Última Actualización**: 2024-01-15  
**Mantenedor**: Equipo AiDuxCare 