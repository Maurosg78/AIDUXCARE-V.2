# GAP ANALYSIS: AiDuxCare V.2

Este documento presenta un análisis honesto y objetivo del estado actual del sistema versus los requisitos para alcanzar un MVP de calidad mundial, listo para inversión y escalabilidad en nube híbrida.

| Componente                | Estado Actual (Lo que tenemos hoy)                                                                 | Brecha (Lo que falta para el MVP de Inversión)                                                                                      | Estimación de cierre |
|--------------------------|---------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|----------------------|
| **Frontend**              | React + TypeScript con una página principal (PatientCompletePage) que gestiona estados localmente.  | Refactorizar para consumir datos de un backend en la nube. Implementar lógica de sincronización de estado y modo offline.           | 2-3 semanas          |
| **Backend**               | Inexistente.                                                                                       | Construir desde cero un backend en Google Cloud (ej. Cloud Functions) para manejar la lógica de negocio.                            | 3-4 semanas          |
| **Base de Datos**         | LocalStorageService para persistencia local, no centralizada.                                       | Diseñar e implementar un esquema seguro en Google Firestore. Migrar toda la lógica de persistencia para que sea "cloud-first".     | 2-3 semanas          |
| **Autenticación**         | LocalAuthService funcional para perfiles en una misma máquina.                                     | Reemplazarlo por completo con un servicio robusto como Firebase Authentication para gestionar usuarios reales.                      | 1-2 semanas          |
| **IA: Transcripción (STT)** | Implementación de Web Speech API, inestable y dependiente del navegador. Modo Manual como fallback. | Integrar la API de Google Cloud Speech-to-Text para una transcripción de alta fidelidad. Eliminar la Web Speech API.                | 2 semanas            |
| **IA: Procesamiento (NLP)** | Llamadas a un modelo Llama 3B local (Ollama) con capacidad limitada a estructuración SOAP básica. | Integrar la API de Google Cloud Healthcare NLP para análisis avanzado, highlights y detección de "banderas rojas".                 | 2-3 semanas          |

## Resumen

- **Total estimado para cerrar todas las brechas:** 10-15 semanas de desarrollo (con equipo dedicado y sin bloqueos externos).
- **Notas:**
  - Las estimaciones consideran integración, pruebas y migración de datos.
  - El desarrollo en paralelo puede reducir el tiempo total.
  - La adopción de servicios cloud implica cambios en arquitectura, seguridad y compliance.

---

Este análisis es la base para la planificación estratégica y la presentación ante inversores. Demuestra conocimiento realista del punto de partida y del esfuerzo necesario para alcanzar un MVP competitivo y escalable. 