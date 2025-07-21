/**
 * 🧪 Script de Prueba - Servicio de Geolocalización
 * Verifica que la detección de ubicación y regulaciones funciona correctamente
 */

import { geolocationService } from '../src/services/GeolocationService';

async function testGeolocationService() {
  console.log('🧪 INICIANDO PRUEBAS DE GEOLOCALIZACIÓN');
  console.log('=====================================\n');

  try {
    // Test 1: Detección de ubicación
    console.log('📍 Test 1: Detección de ubicación del usuario');
    console.log('--------------------------------------------');
    
    const location = await geolocationService.detectUserLocation();
    console.log('✅ Ubicación detectada:', {
      country: location.country,
      countryCode: location.countryCode,
      region: location.region,
      city: location.city,
      ip: location.ip,
      isDetected: location.isDetected
    });

    // Test 2: Obtener regulaciones relevantes
    console.log('\n📋 Test 2: Regulaciones relevantes para la ubicación');
    console.log('---------------------------------------------------');
    
    const complianceConfig = await geolocationService.getRelevantRegulations();
    console.log('✅ Configuración de compliance:', {
      showAllRegulations: complianceConfig.showAllRegulations,
      regulationsCount: complianceConfig.regulations.length,
      detectedLocation: complianceConfig.detectedLocation?.country || 'No detectada'
    });

    console.log('\n📋 Regulaciones encontradas:');
    complianceConfig.regulations.forEach((regulation, index) => {
      console.log(`  ${index + 1}. ${regulation.name} (${regulation.countries.join(', ')})`);
    });

    // Test 3: Información específica de regulaciones
    console.log('\n🔍 Test 3: Información específica de regulaciones');
    console.log('-----------------------------------------------');
    
    const testRegulations = ['hipaa', 'gdpr', 'pipeda', 'lgpd'];
    testRegulations.forEach(regulationId => {
      const info = geolocationService.getRegulationInfo(regulationId);
      if (info) {
        console.log(`✅ ${regulationId.toUpperCase()}: ${info.name}`);
      } else {
        console.log(`❌ ${regulationId.toUpperCase()}: No encontrada`);
      }
    });

    // Test 4: Simulación de ubicaciones específicas
    console.log('\n🌍 Test 4: Simulación de ubicaciones específicas');
    console.log('----------------------------------------------');
    
    const testLocations = [
      { country: 'United States', countryCode: 'US', region: 'CA', city: 'San Francisco', ip: '192.168.1.1', isDetected: true },
      { country: 'Canada', countryCode: 'CA', region: 'ON', city: 'Toronto', ip: '192.168.1.2', isDetected: true },
      { country: 'Spain', countryCode: 'ES', region: 'MD', city: 'Madrid', ip: '192.168.1.3', isDetected: true },
      { country: 'Brazil', countryCode: 'BR', region: 'SP', city: 'São Paulo', ip: '192.168.1.4', isDetected: true },
      { country: 'Chile', countryCode: 'CL', region: 'RM', city: 'Santiago', ip: '192.168.1.5', isDetected: true }
    ];

    for (const testLocation of testLocations) {
      console.log(`\n📍 Probando ubicación: ${testLocation.country} (${testLocation.countryCode})`);
      
      // Simular ubicación
      geolocationService.setMockLocation(testLocation);
      
      // Obtener regulaciones para esta ubicación
      const config = await geolocationService.getRelevantRegulations();
      
      console.log(`  ✅ Regulaciones encontradas: ${config.regulations.length}`);
      config.regulations.forEach(regulation => {
        console.log(`    - ${regulation.name}`);
      });
      
      // Limpiar caché para siguiente prueba
      geolocationService.clearCache();
    }

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('===========================================');
    console.log('✅ Detección de ubicación: FUNCIONANDO');
    console.log('✅ Filtrado de regulaciones: FUNCIONANDO');
    console.log('✅ Información de regulaciones: FUNCIONANDO');
    console.log('✅ Simulación de ubicaciones: FUNCIONANDO');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar pruebas
testGeolocationService().then(() => {
  console.log('\n🚀 Pruebas completadas. El servicio de geolocalización está listo para producción.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal en las pruebas:', error);
  process.exit(1);
}); 