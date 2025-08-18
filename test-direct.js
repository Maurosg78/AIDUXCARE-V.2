// Test directo de la función routeQuery
import { routeQuery } from './src/core/assistant/assistantAdapter.ts';

const query = '¿Cuál es la edad del paciente y qué ejercicios recomiendas?';
console.log('Testing query:', query);

try {
  const result = routeQuery(query);
  console.log('Result:', result);
  console.log('Type:', result.type);
  console.log('Expected: both, Got:', result.type);
} catch (error) {
  console.error('Error:', error);
}
