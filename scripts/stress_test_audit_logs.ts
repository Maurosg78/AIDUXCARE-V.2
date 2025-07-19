import 'dotenv/config';
import { FirestoreAuditLogger } from '../src/core/audit/FirestoreAuditLogger';

const USERS = [
  { id: 'user-1', role: 'PHYSICIAN' },
  { id: 'user-2', role: 'PHYSICIAN' },
  { id: 'user-3', role: 'ADMIN' },
  { id: 'user-4', role: 'OWNER' }
];
const PATIENTS = ['patient-1', 'patient-2', 'patient-3', 'patient-4'];
const VISITS = ['visit-1', 'visit-2', 'visit-3', 'visit-4'];
const EVENT_TYPES = [
  'login_success', 'login_failed', 'logout_success', 'logout_failed',
  'patient_view', 'patient_edit', 'visit_view', 'visit_edit',
  'data_export', 'data_export_failed', 'search_query'
];

const TOTAL_EVENTS = 2000;
const BATCH_SIZE = 100;

async function main() {
  console.log('🚀 Iniciando stress test de auditoría...');
  const start = Date.now();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < TOTAL_EVENTS; i += BATCH_SIZE) {
    const batch = [];
    for (let j = 0; j < BATCH_SIZE && i + j < TOTAL_EVENTS; j++) {
      const user = USERS[Math.floor(Math.random() * USERS.length)];
      const patientId = PATIENTS[Math.floor(Math.random() * PATIENTS.length)];
      const visitId = VISITS[Math.floor(Math.random() * VISITS.length)];
      const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
      const metadata = {
        random: Math.random().toString(36).substring(2, 10),
        timestamp: new Date().toISOString()
      };
      batch.push(
        FirestoreAuditLogger.logEvent({
          type,
          userId: user.id,
          userRole: user.role,
          patientId,
          visitId,
          metadata
        })
      );
    }
    try {
      await Promise.all(batch);
      success += batch.length;
    } catch (err) {
      failed += batch.length;
      console.error('❌ Error en batch:', err);
    }
    if ((i + BATCH_SIZE) % 500 === 0) {
      console.log(`Progreso: ${i + BATCH_SIZE} eventos...`);
    }
  }

  const duration = (Date.now() - start) / 1000;
  console.log('✅ Stress test completado');
  console.log(`Eventos exitosos: ${success}`);
  console.log(`Eventos fallidos: ${failed}`);
  console.log(`Duración total: ${duration.toFixed(2)} segundos`);
  console.log(`TPS (transacciones/segundo): ${(success / duration).toFixed(2)}`);
}

main().catch((err) => {
  console.error('❌ Error fatal en stress test:', err);
  process.exit(1);
}); 