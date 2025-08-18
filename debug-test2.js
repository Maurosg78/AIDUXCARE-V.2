// Debug de las consultas que están fallando
const queries = [
  '¿Qué dice la última resonancia?',
  '¿Qué citas tengo hoy?',
  '¿Cuál es la edad del paciente y qué ejercicios recomiendas?'
];

queries.forEach(query => {
  const queryLower = query.toLowerCase();
  console.log('\n--- Query:', query);
  console.log('Lowercase:', queryLower);
  
  const hasDataKeywords = /(edad|años|age|resonancia|mri|rmn|citas|agenda|notas|pendientes)/i.test(queryLower);
  const hasClinicalKeywords = /(medicamento|dosis|tratamiento|diagnóstico|síntoma|dolor|terapia|ejercicios|ejercicio|recomiendas|recomiendo|recomendar|qué|que)/i.test(queryLower);
  
  console.log('hasDataKeywords:', hasDataKeywords);
  console.log('hasClinicalKeywords:', hasClinicalKeywords);
  console.log('Es mixta?', hasDataKeywords && hasClinicalKeywords);
  
  // Test específico de palabras problemáticas
  console.log('Contiene "qué"?', /qué/i.test(queryLower));
  console.log('Contiene "que"?', /que/i.test(queryLower));
});
