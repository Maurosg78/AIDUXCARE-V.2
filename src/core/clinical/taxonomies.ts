// @ts-nocheck
// Taxonomías clínicas para Quick Create Paciente
// Fuentes locales para autocompletado y chips

export const DX_TOP = [
  'Lumbalgia', 
  'Cervicalgia', 
  'Rotura manguito rotador', 
  'Esguince tobillo', 
  'LCA posquirúrgico',
  'Hernia discal',
  'Síndrome del túnel carpiano',
  'Tendinitis rotuliana',
  'Fractura de radio',
  'Artrosis de rodilla'
];

export const COMORBIDITIES = [
  'Hipertensión', 
  'Diabetes tipo 2', 
  'Osteoporosis', 
  'Asma/EPOC', 
  'Artritis', 
  'Ansiedad/Depresión',
  'Hiperlipidemia',
  'Fibrilación auricular',
  'Embarazo',
  'Cáncer en tratamiento'
];

export const ALLERGIES = [
  'AINES', 
  'Paracetamol', 
  'Opioides', 
  'Latex', 
  'Adhesivos',
  'Penicilina',
  'Sulfamidas',
  'Iodo',
  'Ninguna conocida'
];

export const PRECAUTIONS = [
  'Marcapasos', 
  'Anticoagulados', 
  'Osteoporosis severa', 
  'Prótesis metálica', 
  'Restricción de carga', 
  'Post-quirúrgico reciente', 
  'Hipermovilidad', 
  'Dolor radicular',
  'Embarazo',
  'Inmunosupresión'
];

export const RISK_FLAGS = [
  'Riesgo de caída', 
  'Baja adherencia previa', 
  'Dolor severo >7', 
  'Baja tolerancia al ejercicio',
  'Alteración del equilibrio',
  'Déficit visual',
  'Alteración cognitiva',
  'Dependencia funcional'
];

export const LANGUAGES = [
  { code: 'es', display: 'Español' },
  { code: 'en', display: 'English' },
  { code: 'pt', display: 'Português' },
  { code: 'fr', display: 'Français' },
  { code: 'other', display: 'Otro' }
];

export const DOCUMENT_TYPES = [
  { code: 'dni', display: 'DNI/Identidad' },
  { code: 'passport', display: 'Pasaporte' },
  { code: 'other', display: 'Otro' }
];

export const COUNTRIES = [
  { code: 'ES', display: 'España' },
  { code: 'AR', display: 'Argentina' },
  { code: 'MX', display: 'México' },
  { code: 'CO', display: 'Colombia' },
  { code: 'PE', display: 'Perú' },
  { code: 'CL', display: 'Chile' },
  { code: 'US', display: 'Estados Unidos' },
  { code: 'other', display: 'Otro' }
];

export const toOptions = (arr: string[]) => arr.map(x => ({ value: x, label: x }));