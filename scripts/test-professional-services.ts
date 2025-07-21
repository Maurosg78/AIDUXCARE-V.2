/**
 * 🧪 Test Script: Servicios Profesionales - MVP España
 * Prueba el sistema de restricciones de servicios para fisioterapeutas españoles
 * 
 * MVP: Enfocado en fisioterapeutas españoles
 * Futuro: Expansión internacional documentada en ROADMAP_EXPANSION_INTERNACIONAL.md
 */

import { ProfessionalServicesService, ServiceAvailability } from '../src/services/ProfessionalServicesService';

console.log('🧪 Iniciando pruebas de Servicios Profesionales - MVP España\n');

const service = ProfessionalServicesService.getInstance();

// Test 1: Verificar servicios disponibles para fisioterapeutas españoles
console.log('📋 Test 1: Servicios para fisioterapeutas españoles');
const spanishServices = service.getSpanishPhysiotherapistServices();
console.log(`✅ Encontrados ${spanishServices.length} servicios para fisioterapeutas españoles:`);

spanishServices.forEach(availability => {
  const status = availability.isAvailable ? '✅' : '❌';
  const certInfo = availability.certificationRequired 
    ? ` (Requiere: ${availability.certificationType})` 
    : '';
  console.log(`  ${status} ${availability.service.name}${certInfo}`);
});

// Test 2: Verificar servicios sin certificaciones específicas
console.log('\n📋 Test 2: Servicios sin certificaciones específicas');
const servicesWithoutCert = service.getSpanishPhysiotherapistServices();
const availableWithoutCert = servicesWithoutCert.filter(s => s.isAvailable && !s.certificationRequired);

console.log(`✅ ${availableWithoutCert.length} servicios disponibles sin certificaciones específicas:`);
availableWithoutCert.forEach(availability => {
  console.log(`  ✅ ${availability.service.name}`);
  console.log(`     Requisitos: ${availability.requirements.join(', ')}`);
});

// Test 3: Verificar servicios que requieren certificación
console.log('\n📋 Test 3: Servicios que requieren certificación específica');
const servicesWithCert = service.getServicesRequiringCertification('ES');
console.log(`✅ ${servicesWithCert.length} servicios requieren certificación específica:`);

servicesWithCert.forEach(serviceItem => {
  console.log(`  🔒 ${serviceItem.name} (${serviceItem.certificationType})`);
});

// Test 4: Verificar disponibilidad con certificaciones
console.log('\n📋 Test 4: Verificar disponibilidad con certificaciones');
const testCertifications = ['dry-needling-certification'];

const dryNeedlingAvailability = service.isServiceAvailableForSpanishPhysiotherapist(
  'dry-needling', 
  testCertifications
);

console.log(`✅ Punción Seca con certificación: ${dryNeedlingAvailability ? 'Disponible' : 'No disponible'}`);

const dryNeedlingWithoutCert = service.isServiceAvailableForSpanishPhysiotherapist(
  'dry-needling', 
  []
);

console.log(`✅ Punción Seca sin certificación: ${dryNeedlingWithoutCert ? 'Disponible' : 'No disponible'}`);

// Test 5: Verificar servicios básicos siempre disponibles
console.log('\n📋 Test 5: Servicios básicos siempre disponibles');
const basicServices = ['manual-therapy', 'exercise-prescription', 'electrotherapy'];

basicServices.forEach(serviceId => {
  const isAvailable = service.isServiceAvailableForSpanishPhysiotherapist(serviceId);
  console.log(`✅ ${serviceId}: ${isAvailable ? 'Disponible' : 'No disponible'}`);
});

// Test 6: Verificar restricciones MVP (solo España)
console.log('\n📋 Test 6: Verificar restricciones MVP (solo España)');
const nonSpanishServices = service.getAvailableServices('US');
const availableOutsideSpain = nonSpanishServices.filter(s => s.isAvailable);

console.log(`✅ Servicios disponibles fuera de España: ${availableOutsideSpain.length} (debe ser 0 para MVP)`);

if (availableOutsideSpain.length === 0) {
  console.log('✅ MVP correctamente restringido a España');
} else {
  console.log('❌ Error: Servicios disponibles fuera de España en MVP');
}

// Test 7: Verificar información de certificaciones requeridas
console.log('\n📋 Test 7: Información de certificaciones requeridas');
const certRequirements = service.getCertificationRequirements('ES');

console.log(`✅ ${certRequirements.length} servicios con certificaciones requeridas:`);
certRequirements.forEach(({ service: serviceItem, requirements, officialUrl }) => {
  console.log(`  🔒 ${serviceItem.name}:`);
  console.log(`     Requisitos: ${requirements.join(', ')}`);
  console.log(`     URL oficial: ${officialUrl}`);
});

// Test 8: Verificar métodos específicos para fisioterapeutas españoles
console.log('\n📋 Test 8: Métodos específicos para fisioterapeutas españoles');
const spanishPhysioServices = service.getSpanishPhysiotherapistServices();
const availableServices = spanishPhysioServices.filter(s => s.isAvailable);

console.log(`✅ Servicios disponibles para fisioterapeutas españoles: ${availableServices.length}/${spanishPhysioServices.length}`);

// Resumen final
console.log('\n📊 RESUMEN MVP ESPAÑA:');
console.log(`✅ Total servicios configurados: ${spanishServices.length}`);
console.log(`✅ Servicios disponibles: ${availableServices.length}`);
console.log(`✅ Servicios con certificación requerida: ${servicesWithCert.length}`);
console.log(`✅ MVP restringido a España: ${availableOutsideSpain.length === 0 ? 'SÍ' : 'NO'}`);

console.log('\n🎯 MVP España - Fisioterapeutas: Configuración completada');
console.log('📚 Documentación de expansión internacional: ROADMAP_EXPANSION_INTERNACIONAL.md'); 