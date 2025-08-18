// Debug simple para entender qué está pasando
const query = '¿Cuál es la edad del paciente y qué ejercicios recomiendas?';
const queryLower = query.toLowerCase();

console.log('Query original:', query);
console.log('Query lowercase:', queryLower);

// Test de regex
const hasDataKeywords = /(edad|años|age|resonancia|mri|rmn|citas|agenda|notas|pendientes)/i.test(queryLower);
const hasClinicalKeywords = /(medicamento|dosis|tratamiento|diagnóstico|síntoma|dolor|terapia|ejercicios|ejercicio|recomiendas|recomiendo|recomendar|qué|que)/i.test(queryLower);

console.log('hasDataKeywords:', hasDataKeywords);
console.log('hasClinicalKeywords:', hasClinicalKeywords);
console.log('Es mixta?', hasDataKeywords && hasClinicalKeywords);

// Test específico de "ejercicios"
console.log('Contiene "ejercicios"?', /ejercicios/i.test(queryLower));
console.log('Contiene "qué"?', /qué/i.test(queryLower));
console.log('Contiene "que"?', /que/i.test(queryLower));
