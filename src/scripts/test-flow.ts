import { PatientApiService } from '../core/api/patientApi';

async function testPatientFlow() {
  try {
    console.log('🚀 Iniciando prueba del flujo de pacientes...');

    // 1. Crear un nuevo paciente
    console.log('\n📝 Creando nuevo paciente...');
    const newPatient = await PatientApiService.createPatient({
      name: 'Juan Pérez (Test Flow)',
      email: 'juan.test@example.com',
      phone: '+56 9 1234 5678',
      birthDate: '1990-01-01',
      reasonForConsultation: 'Prueba del flujo completo de la aplicación'
    });
    console.log('✅ Paciente creado:', newPatient.id);

    // 2. Obtener la lista de pacientes
    console.log('\n📋 Obteniendo lista de pacientes...');
    const patients = await PatientApiService.getAllPatients();
    console.log('✅ Lista de pacientes obtenida:', patients.length, 'pacientes');

    // 3. Obtener los detalles del paciente creado
    console.log('\n🔍 Obteniendo detalles del paciente...');
    const patientDetails = await PatientApiService.getPatient(newPatient.id);
    console.log('✅ Detalles del paciente obtenidos:', patientDetails.name);

    // 4. Actualizar el paciente
    console.log('\n✏️ Actualizando paciente...');
    const updatedPatient = await PatientApiService.updatePatient(newPatient.id, {
      reasonForConsultation: 'Prueba del flujo completo - Actualizado'
    });
    console.log('✅ Paciente actualizado:', updatedPatient.id);

    // 5. Eliminar el paciente de prueba
    console.log('\n🗑️ Eliminando paciente de prueba...');
    await PatientApiService.deletePatient(newPatient.id);
    console.log('✅ Paciente eliminado');

    console.log('\n🎉 ¡Prueba completada con éxito!');
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

testPatientFlow(); 