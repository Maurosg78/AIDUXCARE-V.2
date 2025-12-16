import { runEvals } from './evals/unified-eval-system';

console.log('🚀 AiduxCare - Sistema de Evaluación\n');

runEvals()
  .then(results => {
    console.log('\n✅ Evaluación completada');
    process.exit(results.every(r => r.passed) ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error en evaluación:', error);
    process.exit(1);
  });
