# Arquitectura — Aidux North

## Estado actual (MVP verificado)
- **Frontend**: React 18 + TypeScript + Vite
- **Backend/Infra**: Firebase (Firestore, Auth, Functions `vertexAIProxy`, Hosting)
- **AI**: Vertex AI (Gemini 2.5 Flash) vía Cloud Function
- **STT**: Deepgram (real-time transcription)

## Problemas conocidos
- Punto único de falla: `vertexAIProxy`
- Truncación JSON en respuestas largas
- Sin RAG ni colas
- Sin disaster recovery ni backups formales
## Objetivos próximos
- Endurecer pipeline (retries, colas)
- Logging estructurado
- CI/CD con gates de compliance
- Preparación para RAG y EMR integrations
