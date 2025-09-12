/**
 * Sistema de Normalización Médica Transversal
 * Usa APIs gratuitas del NIH/NLM sin autenticación
 */

// ========== UTILIDADES BASE ==========
const normalizeString = (s: string): string => 
  s.normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^\w\s]/g, ' ') // quitar puntuación
    .replace(/\s+/g, ' ')
    .trim();

// Cache en memoria con TTL
class MedicalCache {
  private cache = new Map<string, { value: any; expires: number }>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 horas

  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + this.TTL
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}

const medicationCache = new MedicalCache();
const diagnosisCache = new MedicalCache();
const anatomyCache = new MedicalCache();

// ========== 1. MEDICAMENTOS - RxNorm API ==========
export async function normalizeMedication(raw: string): Promise<{
  generic: string;
  brand?: string;
  rxcui?: string;
  drugClass?: string;
}> {
  const normalized = normalizeString(raw);
  
  // Verificar cache
  const cached = medicationCache.get(normalized);
  if (cached) return cached;

  try {
    // 1. Buscar término aproximado
    const searchUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(normalized)}&maxEntries=3`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    const candidates = searchData?.approximateGroup?.candidate || [];
    if (candidates.length === 0) {
      return { generic: raw }; // No encontrado, devolver original
    }

    // 2. Obtener detalles del mejor match
    const rxcui = candidates[0].rxcui;
    const propsUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/allProperties.json?prop=NAMES`;
    const propsRes = await fetch(propsUrl);
    const propsData = await propsRes.json();
    
    const props = propsData?.propConceptGroup?.propConcept || [];
    
    // Extraer nombres genérico y comercial
    const generic = props.find(p => p.propName === 'RxNorm Name')?.propValue || 
                   candidates[0].name;
    const brand = props.find(p => p.propName === 'Brand Name')?.propValue;
    
    // 3. Obtener clase terapéutica
    const classUrl = `https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${rxcui}`;
    const classRes = await fetch(classUrl);
    const classData = await classRes.json();
    
    const drugClass = classData?.rxclassDrugInfoList?.rxclassDrugInfo?.[0]?.rxclassMinConceptItem?.className;
    
    const result = {
      generic: generic.toLowerCase(),
      brand: brand?.toLowerCase(),
      rxcui,
      drugClass
    };
    
    medicationCache.set(normalized, result);
    return result;
    
  } catch (error) {
    console.warn('RxNorm API error:', error);
    return { generic: raw };
  }
}

// ========== 2. DIAGNÓSTICOS - ICD-10 via UMLS ==========
export async function normalizeDiagnosis(raw: string): Promise<{
  name: string;
  icd10?: string;
  category?: string;
}> {
  const normalized = normalizeString(raw);
  
  const cached = diagnosisCache.get(normalized);
  if (cached) return cached;

  try {
    // Usar la API de ICD-10 del CDC (gratuita)
    const searchUrl = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(normalized)}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (data[3] && data[3].length > 0) {
      const [code, name] = data[3][0];
      const result = {
        name: name.toLowerCase(),
        icd10: code,
        category: code.substring(0, 3) // Categoría principal
      };
      
      diagnosisCache.set(normalized, result);
      return result;
    }
    
    return { name: raw };
    
  } catch (error) {
    console.warn('ICD-10 API error:', error);
    return { name: raw };
  }
}

// ========== 3. ANATOMÍA - SNOMED CT via NIH ==========
export async function normalizeAnatomicalTerm(raw: string): Promise<{
  preferred: string;
  snomedId?: string;
  bodySystem?: string;
}> {
  const normalized = normalizeString(raw);
  
  const cached = anatomyCache.get(normalized);
  if (cached) return cached;

  try {
    // Usar Clinical Tables API del NIH
    const searchUrl = `https://clinicaltables.nlm.nih.gov/api/snomed_ct/v3/search?sf=term&terms=${encodeURIComponent(normalized)}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (data[1] && data[1].length > 0) {
      const result = {
        preferred: data[1][0].toLowerCase(),
        snomedId: data[0]?.[0]
      };
      
      anatomyCache.set(normalized, result);
      return result;
    }
    
    return { preferred: raw };
    
  } catch (error) {
    console.warn('SNOMED API error:', error);
    return { preferred: raw };
  }
}

// ========== 4. INTERACCIONES MEDICAMENTOSAS ==========
export async function checkDrugInteractions(medications: string[]): Promise<{
  interactions: Array<{
    drug1: string;
    drug2: string;
    severity: 'major' | 'moderate' | 'minor';
    description: string;
  }>;
}> {
  if (medications.length < 2) return { interactions: [] };

  try {
    // Primero normalizar todos los medicamentos para obtener RxCUIs
    const normalized = await Promise.all(
      medications.map(med => normalizeMedication(med))
    );
    
    const rxcuis = normalized
      .filter(n => n.rxcui)
      .map(n => n.rxcui);
    
    if (rxcuis.length < 2) return { interactions: [] };
    
    // Verificar interacciones
    const interactionsUrl = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join('+')}`;
    const res = await fetch(interactionsUrl);
    const data = await res.json();
    
    const interactions = [];
    const fullInteractions = data?.fullInteractionTypeGroup?.[0]?.fullInteractionType || [];
    
    for (const interaction of fullInteractions) {
      const pairs = interaction.interactionPair || [];
      for (const pair of pairs) {
        interactions.push({
          drug1: pair.interactionConcept[0].minConceptItem.name,
          drug2: pair.interactionConcept[1].minConceptItem.name,
          severity: pair.severity || 'moderate',
          description: pair.description
        });
      }
    }
    
    return { interactions };
    
  } catch (error) {
    console.warn('Drug interaction check error:', error);
    return { interactions: [] };
  }
}

// ========== 5. FUNCIÓN INTEGRADA PARA ANÁLISIS CLÍNICO ==========
export async function normalizeClinicaAnalysis(data: {
  medications?: string[];
  diagnoses?: string[];
  anatomy?: string[];
}): Promise<{
  medications: any[];
  diagnoses: any[];
  anatomy: any[];
  drugInteractions: any[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  
  // Normalizar medicamentos en paralelo
  const medications = await Promise.all(
    (data.medications || []).map(async (med) => {
      const normalized = await normalizeMedication(med);
      if (!normalized.rxcui) {
        warnings.push(`Medicamento no reconocido: ${med}`);
      }
      return normalized;
    })
  );
  
  // Normalizar diagnósticos
  const diagnoses = await Promise.all(
    (data.diagnoses || []).map(async (dx) => {
      const normalized = await normalizeDiagnosis(dx);
      if (!normalized.icd10) {
        warnings.push(`Diagnóstico sin código ICD-10: ${dx}`);
      }
      return normalized;
    })
  );
  
  // Normalizar términos anatómicos
  const anatomy = await Promise.all(
    (data.anatomy || []).map(term => normalizeAnatomicalTerm(term))
  );
  
  // Verificar interacciones
  const { interactions } = await checkDrugInteractions(data.medications || []);
  
  // Alertas de interacciones graves
  interactions
    .filter(i => i.severity === 'major')
    .forEach(i => warnings.push(`⚠️ INTERACCIÓN GRAVE: ${i.drug1} + ${i.drug2}`));
  
  return {
    medications,
    diagnoses,
    anatomy,
    drugInteractions: interactions,
    warnings
  };
}

// ========== 6. INICIALIZACIÓN Y PRECARGA ==========
export async function initializeMedicalNormalization() {
  console.log('Inicializando sistema de normalización médica...');
  
  // Precargar medicamentos comunes en tu práctica
  const commonMeds = [
    'pregabalin', 'gabapentin', 'tramadol', 'acetaminophen',
    'ibuprofen', 'diclofenac', 'metamizole', 'naproxen'
  ];
  
  // Precargar diagnósticos comunes
  const commonDx = [
    'lumbar stenosis', 'radiculopathy', 'fibromyalgia',
    'osteoarthritis', 'chronic pain', 'neuropathy'
  ];
  
  // Cargar en paralelo para acelerar
  await Promise.all([
    ...commonMeds.map(med => normalizeMedication(med)),
    ...commonDx.map(dx => normalizeDiagnosis(dx))
  ]);
  
  console.log('Sistema de normalización médica listo');
}
