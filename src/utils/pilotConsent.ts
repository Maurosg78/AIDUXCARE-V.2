/**
 * Pilot Consent Content by Country
 * 
 * WO-12: Dynamic pilot consent based on practice country and language
 */

export type PracticeCountry = 'CA' | 'US' | 'ES' | 'CL';
export type Language = 'en' | 'es';

export interface PilotConsentContent {
  title: string;
  body: string; // Long text, scrollable
  checkboxLabel: string;
}

/**
 * Get language from practice country
 */
export function getLanguageFromCountry(country: string | null | undefined): Language {
  const countryUpper = (country || '').toUpperCase();
  if (['ES', 'CL'].includes(countryUpper)) {
    return 'es';
  }
  return 'en'; // CA, US, and default
}

/**
 * Get pilot consent content by country and language
 * 
 * NOTE: This uses placeholder text. Legal team should provide final content.
 */
export function getPilotConsentContent(
  practiceCountry: string | null | undefined,
  language?: Language
): PilotConsentContent {
  const country = (practiceCountry || '').toUpperCase() as PracticeCountry;
  const lang = language || getLanguageFromCountry(country);
  
  if (lang === 'es') {
    return {
      title: 'Consentimiento para Participación en Piloto de AiDuxCare',
      body: `**VERSIÓN PILOTO - PLACEHOLDER**

Este es un consentimiento informado para participar en la evaluación piloto de AiDuxCare, una plataforma de asistencia clínica con inteligencia artificial.

**1. Naturaleza del Piloto**
- El sujeto del piloto es el profesional de la salud (usted)
- El objetivo es evaluar usabilidad y experiencia de usuario
- NO es investigación clínica
- NO se utilizan datos de pacientes para entrenamiento de modelos

**2. Datos del Profesional**
- Se recopilan datos de uso de la plataforma
- Se registran interacciones con la interfaz
- Se analiza la experiencia de usuario
- Estos datos se utilizan únicamente para mejorar el producto

**3. Datos del Paciente**
- Los datos de pacientes NO se utilizan para investigación
- Los datos de pacientes NO se utilizan para entrenamiento de IA
- Los datos de pacientes permanecen bajo su control clínico
- Se aplican las mismas protecciones de privacidad que en práctica clínica normal

**4. Limitaciones**
- AiDuxCare NO reemplaza su criterio profesional
- Las sugerencias de IA son asistencia, no diagnóstico
- Usted mantiene responsabilidad clínica completa

**5. Retiro del Consentimiento**
- Puede retirar su consentimiento en cualquier momento
- El retiro no afecta datos ya recopilados

**Versión:** pilot-v1
**País de ejercicio:** ${country}`,
      checkboxLabel: 'Entiendo y acepto participar en el piloto de AiDuxCare bajo las condiciones descritas arriba',
    };
  }
  
  // English (default)
  return {
    title: 'Pilot Evaluation Consent for AiDuxCare',
    body: `**PILOT VERSION - PLACEHOLDER**

This is an informed consent for participation in the AiDuxCare pilot evaluation, a clinical assistance platform with artificial intelligence.

**1. Nature of the Pilot**
- The pilot subject is the healthcare professional (you)
- The objective is to evaluate usability and user experience
- This is NOT clinical research
- Patient data is NOT used for model training

**2. Professional Data**
- Platform usage data is collected
- Interface interactions are recorded
- User experience is analyzed
- This data is used solely for product improvement

**3. Patient Data**
- Patient data is NOT used for research
- Patient data is NOT used for AI training
- Patient data remains under your clinical control
- Same privacy protections apply as in normal clinical practice

**4. Limitations**
- AiDuxCare does NOT replace your professional judgment
- AI suggestions are assistance, not diagnosis
- You maintain full clinical responsibility

**5. Withdrawal of Consent**
- You may withdraw consent at any time
- Withdrawal does not affect already collected data

**Version:** pilot-v1
**Practice Country:** ${country}`,
    checkboxLabel: 'I understand and agree to participate in the AiDuxCare pilot under the conditions described above',
  };
}



