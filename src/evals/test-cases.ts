// @ts-nocheck
export const testCases = [
  {
    id: 'case-1-simple',
    name: 'Dolor Lumbar Mecánico Simple',
    transcript: `Paciente de 35 años, oficinista, refiere dolor lumbar de 2 semanas de evolución. 
    Comenzó después de cargar cajas en mudanza. Dolor tipo 6/10, mejora con reposo, 
    empeora al estar sentado mucho tiempo. Sin irradiación. Sin banderas rojas. 
    Toma ibuprofeno 400mg cuando duele mucho.`,
    expected: {
      redFlags: [],
      yellowFlags: [],
      symptoms: ['Dolor lumbar', 'Dolor al estar sentado'],
      conditions: ['Dolor lumbar mecánico'],
      medications: ['Ibuprofeno 400mg PRN'],
      tests: ['Flexión lumbar', 'Extensión lumbar', 'Test de Lasègue', 'NPRS']
    }
  },
  {
    id: 'case-3-redflag',
    name: 'Red Flag - Cauda Equina',
    transcript: `Hombre 45 años, dolor lumbar severo de inicio súbito hace 48 horas. 
    Pérdida de control de esfínteres desde ayer. Anestesia en zona perineal. 
    Debilidad bilateral en piernas. No puede caminar. Historia de hernia discal L4-L5.`,
    expected: {
      redFlags: ['Síndrome de cauda equina'],
      yellowFlags: [],
      symptoms: ['Dolor lumbar severo', 'Incontinencia', 'Anestesia silla montar', 'Debilidad MMII bilateral'],
      conditions: ['Hernia discal L4-L5'],
      medications: [],
      tests: ['URGENTE - Derivación inmediata a emergencia']
    }
  }
];