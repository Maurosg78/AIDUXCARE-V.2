// Script para entender el problema
const mockRawResponse = `{
  "evaluaciones_fisicas_sugeridas": [
    "Evaluación neurológica completa",
    "Test de nervios craneales", 
    "Evaluación cervical completa"
  ]
}`;

try {
  const cleaned = mockRawResponse.replace(/```json\n?/g, '').replace(/```/g, '');
  const parsed = JSON.parse(cleaned);
  console.log("Tests encontrados:", parsed.evaluaciones_fisicas_sugeridas);
} catch(e) {
  console.log("Error:", e);
}
