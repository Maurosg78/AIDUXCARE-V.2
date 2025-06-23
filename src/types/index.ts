/**
 *  index.ts
 * 
 *  Este archivo sirve como el punto de entrada principal para todos los tipos
 *  de datos del dominio de la aplicación. Centralizar las exportaciones
 *  simplifica las importaciones en toda la codebase.
 */

export * from './agent';
export * from './audio';
export * from './errors';
export * from './forms';
export * from './nlp';
export * from './patient';
export * from './professional';
export * from './session';
export * from './speech';
export * from './suggestions';

// Definición explícita de ProfessionalProfile para resolver dependencias
export interface ProfessionalProfile {
    role: 'PHYSIOTHERAPIST' | 'DOCTOR' | 'NURSE' | 'PSYCHOLOGIST' | 'CHIROPRACTOR';
    location: {
        country: string;
        state?: string;
    };
    capabilities: string[];
} 