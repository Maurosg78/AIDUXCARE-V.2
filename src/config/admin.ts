/**
 * 🔐 CONFIGURACIÓN ADMINISTRATIVA SEGURA
 * Este archivo contiene configuraciones para el usuario administrador
 * En producción, estas credenciales deben ser manejadas por variables de entorno
 */

// ⚠️ IMPORTANTE: En producción, usar variables de entorno
const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || 'admin@aiduxcare.com',
  defaultPassword: process.env.ADMIN_PASSWORD || 'admin123',
  name: 'Administrador Sistema',
  role: 'OWNER' as const,
  specialization: 'Administración'
};

export const getAdminConfig = () => {
  // En desarrollo, permitir configuración por defecto
  if (process.env.NODE_ENV === 'development') {
    return {
      ...ADMIN_CONFIG,
      email: 'msobarzo78@gmail.com',
      defaultPassword: 'aidux2025',
      name: 'Mauricio Sobarzo'
    };
  }
  
  return ADMIN_CONFIG;
};

export const isValidAdminCredentials = (email: string, password: string): boolean => {
  const config = getAdminConfig();
  return email === config.email && password === config.defaultPassword;
};

// No exportar credenciales directamente
export default { getAdminConfig, isValidAdminCredentials }; 