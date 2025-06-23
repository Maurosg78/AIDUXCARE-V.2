/**
 * professional.ts
 * 
 * Define la estructura de datos para el perfil de un profesional de la salud,
 * incluyendo su rol, ubicación y capacidades específicas. Este es un tipo
 * de datos central para la lógica de negocio contextual.
 */

export interface ProfessionalProfile {
    role: 'PHYSIOTHERAPIST' | 'DOCTOR' | 'NURSE' | 'PSYCHOLOGIST' | 'CHIROPRACTOR';
    location: {
        country: string;
        state?: string;
    };
    capabilities: string[];
} 