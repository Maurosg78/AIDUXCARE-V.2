interface FeatureFlags {
  aiDuxLight: boolean;
  auditWidget: boolean;
  advancedAnalytics: boolean;
}

// Helper para obtener variables de entorno de Vite
const getViteEnv = (key: string): string | undefined => {
  try {
    return import.meta.env[key];
  } catch {
    return undefined;
  }
};

// Configuración por entorno
const getFeatureFlags = (): FeatureFlags => {
  const env = getViteEnv('VITE_ENV_TARGET') || 'DEV';
  
  switch (env.toUpperCase()) {
    case 'PROD':
      return {
        aiDuxLight: false, // OFF en producción
        auditWidget: true,  // ON en producción
        advancedAnalytics: true
      };
    
    case 'UAT':
      return {
        aiDuxLight: true,  // ON en UAT
        auditWidget: true,  // ON en UAT
        advancedAnalytics: true
      };
    
    case 'DEV':
    default:
      return {
        aiDuxLight: true,  // ON en desarrollo
        auditWidget: true,  // ON en desarrollo
        advancedAnalytics: true
      };
  }
};

// Hook para usar feature flags
export const useFeatureFlags = () => {
  const flags = getFeatureFlags();
  
  return {
    flags,
    isEnabled: (flag: keyof FeatureFlags) => flags[flag],
    getAllFlags: () => flags
  };
};

// Función para verificar si una feature está habilitada
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return getFeatureFlags()[flag];
};

// Función para obtener flags desde Firestore (para configuración dinámica)
export const getDynamicFeatureFlags = async (): Promise<Partial<FeatureFlags>> => {
  try {
    // Aquí se implementaría la lectura desde Firestore
    // Por ahora retornamos los flags estáticos
    return getFeatureFlags();
  } catch (error) {
    console.warn('Error obteniendo feature flags dinámicos, usando estáticos:', error);
    return getFeatureFlags();
  }
};

export default getFeatureFlags;
