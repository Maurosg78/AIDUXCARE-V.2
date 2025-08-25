import logger from '@/shared/utils/logger';
/**
 * @fileoverview Utilidad para limpiar datos de prueba del localStorage
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

/**
 * Limpia todos los datos de prueba del localStorage
 * Esta función debe ejecutarse al inicio de la aplicación en desarrollo
 */
export const clearTestData = (): void => {
  try {
    // Lista de claves que pueden contener datos de prueba
    const testDataKeys = [
      'aiduxcare-wizard-data',
      'aiduxcare-test-data',
      'aiduxcare-user-data',
      'aiduxcare-form-data',
      'aiduxcare-session-data'
    ];

    // Eliminar cada clave de datos de prueba
    testDataKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Datos de prueba eliminados: ${key}`);
      }
    });

    // Limpiar también cualquier clave que contenga "test" o "demo"
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.toLowerCase().includes('test') || 
          key.toLowerCase().includes('demo') || 
          key.toLowerCase().includes('sample')) {
        localStorage.removeItem(key);
        console.log(`🧹 Datos de prueba eliminados: ${key}`);
      }
    });

    console.log('✅ Limpieza de datos de prueba completada');
  } catch (error) {
    console.error('❌ Error al limpiar datos de prueba:', error);
  }
};

/**
 * Verifica si hay datos de prueba en el localStorage
 */
export const hasTestData = (): boolean => {
  try {
    const testDataKeys = [
      'aiduxcare-wizard-data',
      'aiduxcare-test-data',
      'aiduxcare-user-data',
      'aiduxcare-form-data',
      'aiduxcare-session-data'
    ];

    return testDataKeys.some(key => localStorage.getItem(key) !== null);
  } catch (error) {
    console.error('❌ Error al verificar datos de prueba:', error);
    return false;
  }
};

/**
 * Obtiene información sobre los datos almacenados en localStorage
 */
export const getLocalStorageInfo = (): { totalKeys: number; testDataKeys: string[] } => {
  try {
    const allKeys = Object.keys(localStorage);
    const testDataKeys = allKeys.filter(key => 
      key.toLowerCase().includes('aiduxcare') ||
      key.toLowerCase().includes('test') ||
      key.toLowerCase().includes('demo')
    );

    return {
      totalKeys: allKeys.length,
      testDataKeys
    };
  } catch (error) {
    console.error('❌ Error al obtener información del localStorage:', error);
    return { totalKeys: 0, testDataKeys: [] };
  }
};
