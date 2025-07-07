/**
 * 🧪 Test del Sistema de Análisis Clínico Local
 * Valida que el ClinicalAnalyzer y LocalClinicalAnalysisService funcionen correctamente
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clinicalAnalyzer } from '../services/ClinicalAnalyzer';
import { localClinicalAnalysisService } from '../services/LocalClinicalAnalysisService';

describe('🧠 Sistema de Análisis Clínico Local', () => {
  describe('ClinicalAnalyzer - Motor de Análisis', () => {
    it('🚨 Debe detectar emergencia cardíaca correctamente', async () => {
      const transcripcion = 'Tengo un dolor muy fuerte en el pecho que se irradia hacia el brazo izquierdo, me siento mareado y con náuseas';
      
      const resultado = await clinicalAnalyzer.analyzeTranscription(transcripcion, 'cardiology', 'initial');
      
      expect(resultado.success).toBe(true);
      expect(resultado.warnings.length).toBeGreaterThan(0);
      expect(resultado.riskLevel).toBe('CRITICAL');
      expect(resultado.warnings[0].severity).toBe('CRITICAL');
      expect(resultado.warnings[0].title).toContain('Síndrome Coronario Agudo');
      expect(resultado.processingTimeMs).toBeLessThan(1000); // Debe ser rápido
    });

    it('🦴 Debe detectar problemas neurológicos en fisioterapia', async () => {
      const transcripcion = 'Doctor, he perdido fuerza súbitamente en el brazo izquierdo y tengo entumecimiento en toda la pierna';
      
      const resultado = await clinicalAnalyzer.analyzeTranscription(transcripcion, 'physiotherapy', 'initial');
      
      expect(resultado.success).toBe(true);
      expect(resultado.warnings.length).toBeGreaterThan(0);
      expect(resultado.riskLevel).toBe('HIGH');
      expect(resultado.warnings[0].title).toContain('Neurológicos');
    });

    it('📋 Debe generar SOAP completo y coherente', async () => {
      const transcripcion = `
        Paciente refiere dolor en la espalda baja desde hace 3 semanas, especialmente al levantarse por las mañanas.
        Al examen físico se observa limitación en la flexión lumbar y tensión muscular en paravertebrales.
        Impresión diagnóstica de lumbalgia mecánica.
        Plan: ejercicios de fortalecimiento y seguimiento en 2 semanas.
      `;
      
      const resultado = await clinicalAnalyzer.analyzeTranscription(transcripcion, 'physiotherapy', 'initial');
      
      expect(resultado.success).toBe(true);
      expect(resultado.soapAnalysis.subjective).toContain('dolor');
      expect(resultado.soapAnalysis.objective).toContain('examen');
      expect(resultado.soapAnalysis.assessment).toContain('lumbalgia');
      expect(resultado.soapAnalysis.plan).toContain('ejercicios');
      expect(resultado.soapAnalysis.confidence).toBeGreaterThan(60);
    });

    it('🎯 Debe generar sugerencias relevantes', async () => {
      const transcripcion = 'Tengo dolor crónico en la espalda desde hace varios meses, me produce mucha ansiedad';
      
      const resultado = await clinicalAnalyzer.analyzeTranscription(transcripcion, 'general', 'initial');
      
      expect(resultado.success).toBe(true);
      expect(resultado.suggestions.length).toBeGreaterThan(0);
      
      // Debe sugerir evaluación multidisciplinaria para dolor crónico
      const sugerenciaDolor = resultado.suggestions.find(s => s.title.includes('Multidisciplinaria'));
      expect(sugerenciaDolor).toBeDefined();
      
      // Debe sugerir evaluación psicosocial por ansiedad
      const sugerenciaPsico = resultado.suggestions.find(s => s.title.includes('Psicosocial'));
      expect(sugerenciaPsico).toBeDefined();
    });
  });

  describe('LocalClinicalAnalysisService - Servicio Integrado', () => {
    it('🔧 Debe funcionar como reemplazo directo del Cloud Function', async () => {
      const transcripcion = 'Paciente con dolor en hombro derecho que limita el movimiento';
      
      const resultado = await localClinicalAnalysisService.processTranscriptionCompatible(
        transcripcion,
        'physiotherapy',
        'initial'
      );
      
      expect(resultado.success).toBe(true);
      expect(resultado.warnings).toBeDefined();
      expect(resultado.suggestions).toBeDefined();
      expect(resultado.soapAnalysis).toBeDefined();
      expect(resultado.processingTime).toBeLessThan(500);
      expect(resultado.modelUsed).toContain('clinical-analyzer-local');
    });

    it('⚡ Debe ser muy rápido (< 200ms para casos simples)', async () => {
      const transcripcion = 'Dolor de cabeza leve';
      const inicio = Date.now();
      
      const resultado = await localClinicalAnalysisService.analyzeTranscription(transcripcion);
      const tiempoTotal = Date.now() - inicio;
      
      expect(resultado.success).toBe(true);
      expect(tiempoTotal).toBeLessThan(200);
    });

    it('🛡️ Debe manejar transcripciones vacías o inválidas', async () => {
      // Transcripción vacía
      const resultadoVacio = await localClinicalAnalysisService.analyzeTranscription('');
      expect(resultadoVacio.success).toBe(false);
      expect(resultadoVacio.error).toContain('muy corta');
      
      // Transcripción muy corta
      const resultadoCorto = await localClinicalAnalysisService.analyzeTranscription('dolor');
      expect(resultadoCorto.success).toBe(false);
      expect(resultadoCorto.error).toContain('muy corta');
    });

    it('🧪 Debe pasar el test de diagnóstico automático', async () => {
      const testPasado = await localClinicalAnalysisService.runDiagnosticTest();
      expect(testPasado).toBe(true);
    });
  });

  describe('Integración con GoogleCloudAudioService', () => {
    it('📡 Formato de respuesta debe ser compatible', async () => {
      const transcripcion = 'Dolor torácico que se irradia al brazo izquierdo';
      
      const resultado = await localClinicalAnalysisService.processTranscriptionCompatible(
        transcripcion,
        'cardiology',
        'initial'
      );
      
      // Verificar estructura compatible con GoogleCloudAudioService
      expect(resultado).toHaveProperty('success');
      expect(resultado).toHaveProperty('warnings');
      expect(resultado).toHaveProperty('suggestions');
      expect(resultado).toHaveProperty('soapAnalysis');
      expect(resultado).toHaveProperty('riskLevel');
      expect(resultado).toHaveProperty('processingTime');
      expect(resultado).toHaveProperty('modelUsed');
      expect(resultado).toHaveProperty('metadata');
      
      // Verificar tipos de datos
      expect(Array.isArray(resultado.warnings)).toBe(true);
      expect(Array.isArray(resultado.suggestions)).toBe(true);
      expect(typeof resultado.soapAnalysis).toBe('object');
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(resultado.riskLevel);
    });
  });

  describe('Casos Clínicos Específicos', () => {
    it('🫀 Emergencia Cardiovascular', async () => {
      const caso = `
        Paciente de 55 años refiere dolor opresivo en el pecho de inicio súbito hace 30 minutos,
        irradiado a brazo izquierdo y mandíbula, acompañado de sudoración profusa y náuseas.
        Antecedentes de hipertensión y tabaquismo.
      `;
      
      const resultado = await clinicalAnalyzer.analyzeTranscription(caso, 'cardiology', 'initial');
      
      expect(resultado.riskLevel).toBe('CRITICAL');
      expect(resultado.warnings.some(w => w.category === 'emergency')).toBe(true);
      expect(resultado.suggestions.some(s => s.title.includes('Monitoreo'))).toBe(true);
    });

    it('🦴 Problema Musculoesquelético', async () => {
      const caso = `
        Paciente deportista refiere dolor en rodilla derecha posterior a caída durante entrenamiento.
        Presenta inflamación moderada y limitación para la flexión completa.
        Niega inestabilidad articular.
      `;
      
      const resultado = await clinicalAnalyzer.analyzeTranscription(caso, 'physiotherapy', 'initial');
      
      expect(resultado.riskLevel).toBe('LOW');
      expect(resultado.suggestions.some(s => s.title.includes('Funcional'))).toBe(true);
      expect(resultado.soapAnalysis.confidence).toBeGreaterThan(50);
    });

    it('🧠 Problema Neurológico', async () => {
      const caso = `
        Paciente refiere cefalea súbita e intensa que describe como el peor dolor de cabeza de su vida,
        acompañada de rigidez de nuca y fotofobia.
      `;
      
      const resultado = await clinicalAnalyzer.analyzeTranscription(caso, 'general', 'initial');
      
      expect(resultado.riskLevel).toBe('CRITICAL');
      expect(resultado.warnings.some(w => w.title.includes('Cefalea'))).toBe(true);
    });
  });
}); 