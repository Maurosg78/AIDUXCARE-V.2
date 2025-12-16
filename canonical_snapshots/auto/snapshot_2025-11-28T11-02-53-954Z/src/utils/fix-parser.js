// Agregar en cleanVertexResponse.ts después de línea 74
// Para manejar respuestas truncadas de Vertex
if (typeof raw === 'object' && raw.candidates) {
  const text = raw.candidates[0]?.content?.parts?[0]?.text;
  if (text && text.includes('"test": "Palp')) {
    console.warn('Respuesta truncada detectada, usando datos parciales');
  }
}
