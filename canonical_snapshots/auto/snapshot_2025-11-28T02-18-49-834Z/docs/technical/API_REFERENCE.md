# API Reference — Aidux North

## Cloud Functions disponibles
### `POST /vertexAIProxy`
- **Descripción**: Proxy a Vertex AI (Gemini 2.5 Flash)
- **Input**: prompt estructurado
- **Output**: JSON o texto clínico

---

## Flujo Dual-Call (implementado en MVP)
1. **Clinical Analysis**
   - Input: narrativa del paciente
   - Output: JSON con 7 categorías de hallazgos clínicos

2. **SOAP Generation**
   - Input: datos clínicos validados + contexto de paciente
   - Output: Nota SOAP profesional con códigos ICD-10
