// En cleanVertexResponse.ts, buscar la sección de evaluaciones_fisicas_sugeridas
// y reemplazar por:

if (result.evaluaciones_fisicas_sugeridas) {
  // Manejar tanto strings como objetos
  result.evaluaciones_fisicas_sugeridas = result.evaluaciones_fisicas_sugeridas.map(item => {
    if (typeof item === 'string') {
      return item;
    } else if (typeof item === 'object' && item.test) {
      // Si es objeto, extraer solo el nombre del test
      return item.test;
    }
    return String(item); // Fallback
  }).filter(test => test && test !== '[object Object]');
}
