# ADR-Cloud_AI_Selection.md

## Comparativa: Google Cloud Healthcare NLP API vs. Llama 3 8B en Vertex AI

### 1. Facilidad de Implementación
- **Google Cloud Healthcare NLP API:**
  - API REST lista para usar, integración rápida con SDKs oficiales.
  - Documentación extensa y soporte empresarial.
  - No requiere gestión de infraestructura ni tuning de modelos.
- **Llama 3 8B en Vertex AI:**
  - Requiere despliegue y configuración de modelo personalizado.
  - Mayor control sobre el pipeline y el prompt engineering.
  - Necesita gestión de recursos (RAM, GPU) y escalado manual.

### 2. Estructura de Costos
- **Google Cloud Healthcare NLP API:**
  - Pago por uso (por documento o por carácter procesado).
  - Costos predecibles, pero pueden escalar rápidamente con alto volumen.
  - Incluye mantenimiento, actualizaciones y compliance.
- **Llama 3 8B en Vertex AI:**
  - Costos variables según recursos asignados (CPU/GPU, almacenamiento, tráfico).
  - Puede ser más económico a gran escala, pero requiere monitoreo y optimización.
  - Costos de setup y tuning inicial más altos.

### 3. Capacidades para AiDuxCare
- **Google Cloud Healthcare NLP API:**
  - Extracción de entidades clínicas, detección de relaciones, análisis de texto médico estructurado.
  - Limitado a los features soportados por Google; menos flexible para prompts personalizados.
- **Llama 3 8B en Vertex AI:**
  - Permite prompts clínicos personalizados, generación de S.O.A.P., banderas rojas y análisis avanzado.
  - Mayor flexibilidad para adaptar la IA a los flujos de AiDuxCare.

### Recomendación Preliminar
- **Para un MVP rápido y compliance inmediato:** Google Cloud Healthcare NLP API es la opción más sencilla y segura.
- **Para diferenciación, control y personalización clínica:** Llama 3 8B en Vertex AI es preferible a mediano plazo, aunque requiere mayor inversión inicial en infraestructura y tuning.

---

_Esta decisión debe ser revisada tras pruebas piloto y análisis de costos reales en producción._ 