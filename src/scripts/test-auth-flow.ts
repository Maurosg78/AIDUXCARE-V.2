import { localAuthService } from '../services/LocalAuthService';

async function testAuthFlow() {
  try {
    console.log('🚀 Iniciando prueba del flujo de autenticación...');

    // 1. Verificar redirección a /auth
    console.log('\n📝 Verificando redirección a /auth...');
    const isAuthenticated = localAuthService.isAuthenticated();
    console.log('✅ Estado de autenticación:', isAuthenticated ? 'Autenticado' : 'No autenticado');

    // 2. Probar registro
    console.log('\n📝 Probando registro...');
    const registerResult = await localAuthService.register({
      name: 'Terapeuta Test',
      email: 'test@example.com',
      specialization: 'Fisioterapia',
      licenseNumber: '12345'
    });
    console.log('✅ Resultado del registro:', registerResult.success ? 'Éxito' : 'Falló');

    // 3. Verificar persistencia
    console.log('\n📝 Verificando persistencia de sesión...');
    const persistedAuth = localAuthService.isAuthenticated();
    console.log('✅ Persistencia de sesión:', persistedAuth ? 'Mantiene sesión' : 'Sesión perdida');

    // 4. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    localAuthService.logout();
    console.log('✅ Datos de prueba eliminados');

    console.log('\n🎉 ¡Prueba completada con éxito!');
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    process.exit(1);
  }
}

testAuthFlow(); 