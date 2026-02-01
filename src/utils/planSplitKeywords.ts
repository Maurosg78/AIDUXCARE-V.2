/**
 * WO-FU-PLAN-SPLIT-01: Palabras clave configurables para derivar In-Clinic vs HEP.
 * EN y ES. No hardcodear en la lógica; este archivo es la única fuente.
 */

export const PLAN_SPLIT_KEYWORDS = {
  /** Encabezados de sección que indican tratamiento en consulta (in-clinic). WO-PROMPT-PLAN-SPLIT-01: mismo formato que Vertex. */
  sectionInClinic: [
    'IN-CLINIC TREATMENT',
    'IN-CLINIC TREATMENT:',
    'Interventions:',
    'Interventions',
    'Treatment today:',
    'Treatment today',
    'In-clinic:',
    'In-clinic',
    'Session:',
    'Tratamiento en consulta:',
    'Tratamiento en sesión:',
    'Intervenciones:',
  ],
  /** Encabezados de sección que indican programa domiciliario (HEP). WO-PROMPT-PLAN-SPLIT-01: mismo formato que Vertex. */
  sectionHomeProgram: [
    'HOME EXERCISE PROGRAM (HEP)',
    'HOME EXERCISE PROGRAM (HEP):',
    'Home Exercises:',
    'Home Exercises',
    'HEP:',
    'HEP',
    'Home program:',
    'Home program',
    'Ejercicios domiciliarios:',
    'Ejercicios en casa:',
    'Programa domiciliario:',
    'Programa en casa:',
  ],
  /** Palabras clave por línea → HEP (EN). */
  lineHomeProgramEn: [
    'home',
    'hep',
    'x/day',
    'daily',
    'ice',
    'at home',
    'domiciliary',
    'between sessions',
  ],
  /** Palabras clave por línea → HEP (ES). */
  lineHomeProgramEs: [
    'casa',
    'domiciliario',
    'veces/día',
    'en domicilio',
    'en casa',
    'entre sesiones',
    'domicilio',
  ],
  /** Palabras clave por línea → in-clinic (EN). */
  lineInClinicEn: [
    'manual',
    'therapeutic',
    'gait training',
    'supervised',
    'soft tissue',
    'in-clinic',
    'in clinic',
    'in session',
    'today in session',
  ],
  /** Palabras clave por línea → in-clinic (ES). */
  lineInClinicEs: [
    'consulta',
    'sesión',
    'supervisado',
    'manual',
    'terapia manual',
    'en sesión',
  ],
} as const;
