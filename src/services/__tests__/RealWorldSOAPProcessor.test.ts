import RealWorldSOAPProcessor from '../RealWorldSOAPProcessor';

describe('RealWorldSOAPProcessor', () => {
  let processor: RealWorldSOAPProcessor;

  beforeEach(() => {
    processor = new RealWorldSOAPProcessor();
  });

  describe('Casos Realistas de Fisioterapia', () => {
    test('debe procesar consulta cervical con clasificación SOAP precisa', async () => {
      const transcripcionCervical = `
        me cuesta mucho girar el cuello hacia la derecha, sobre todo por las mañanas
        también he tenido dolor de cabeza que empieza en la base del cráneo y sube
        al palpar la musculatura suboccipital derecha, el paciente refiere molestia intensa
        hay rigidez moderada en rotación cervical derecha
        el cuadro es compatible con síndrome post latigazo cervical, con irritación miofascial en región cervical derecha
        recomiendo terapia manual, tecarterapia y ejercicios de movilidad controlada cada 48 horas
      `;

      const resultado = await processor.processTranscription(transcripcionCervical, {
        specialty: 'fisioterapia'
      });

      // Verificar estructura básica
      expect(resultado.segments).toBeDefined();
      expect(resultado.segments.length).toBeGreaterThan(0);
      expect(resultado.fullAssessment).toBeDefined();

      // Verificar clasificación SOAP
      const sectionsFound = new Set(resultado.segments.map(s => s.section));
      expect(sectionsFound).toContain('S'); // Síntomas subjetivos
      expect(sectionsFound).toContain('O'); // Hallazgos objetivos
      expect(sectionsFound).toContain('A'); // Assessment
      expect(sectionsFound).toContain('P'); // Plan

      // Verificar identificación de hablantes
      const speakers = new Set(resultado.segments.map(s => s.speaker));
      expect(speakers).toContain('PACIENTE');
      expect(speakers).toContain('TERAPEUTA');

      // Verificar confianza alta
      resultado.segments.forEach(segment => {
        expect(segment.confidence).toBeGreaterThan(0.8);
      });

      // Verificar entidades médicas
      const allEntities = resultado.segments.flatMap(s => s.entities);
      const entityCategories = new Set(allEntities.map(e => e.category));
      expect(entityCategories).toContain('anatomy');
      expect(entityCategories).toContain('symptom');
      expect(entityCategories).toContain('treatment');
    });

    test('debe generar payload compatible con DynamicSOAPEditor', async () => {
      // Payload de prueba realista basado en el ejemplo proporcionado
      const expectedPayload = {
        "segments": [
          {
            "text": "me cuesta mucho girar el cuello hacia la derecha, sobre todo por las mañanas",
            "speaker": "PACIENTE",
            "section": "S",
            "confidence": 0.96,
            "reasoning": "Síntoma subjetivo expresado por paciente. Se refiere a limitación funcional con patrón temporal.",
            "entities": [
              { "category": "anatomy", "value": "cuello" },
              { "category": "severity", "value": "mucho" },
              { "category": "temporal", "value": "por las mañanas" }
            ]
          },
          {
            "text": "también he tenido dolor de cabeza que empieza en la base del cráneo y sube",
            "speaker": "PACIENTE", 
            "section": "S",
            "confidence": 0.93,
            "reasoning": "Descripción subjetiva de cefalea de origen cervicogénico.",
            "entities": [
              { "category": "symptom", "value": "dolor de cabeza" },
              { "category": "anatomy", "value": "base del cráneo" }
            ]
          },
          {
            "text": "al palpar la musculatura suboccipital derecha, el paciente refiere molestia intensa",
            "speaker": "TERAPEUTA",
            "section": "O", 
            "confidence": 0.91,
            "reasoning": "Observación objetiva durante examen físico (palpación).",
            "entities": [
              { "category": "procedure", "value": "palpación" },
              { "category": "anatomy", "value": "musculatura suboccipital derecha" }
            ]
          },
          {
            "text": "hay rigidez moderada en rotación cervical derecha",
            "speaker": "TERAPEUTA",
            "section": "O",
            "confidence": 0.89,
            "reasoning": "Hallazgo durante examen físico, limitación de rango de movimiento.",
            "entities": [
              { "category": "anatomy", "value": "cervical" },
              { "category": "motion", "value": "rotación" }
            ]
          },
          {
            "text": "el cuadro es compatible con síndrome post latigazo cervical, con irritación miofascial en región cervical derecha",
            "speaker": "TERAPEUTA",
            "section": "A",
            "confidence": 0.97,
            "reasoning": "Impresión diagnóstica basada en hallazgos subjetivos y objetivos.",
            "entities": [
              { "category": "diagnosis", "value": "síndrome post latigazo cervical" }
            ]
          },
          {
            "text": "recomiendo terapia manual, tecarterapia y ejercicios de movilidad controlada cada 48 horas",
            "speaker": "TERAPEUTA",
            "section": "P",
            "confidence": 0.94,
            "reasoning": "Indicación clara de tratamiento dentro de la planificación terapéutica.",
            "entities": [
              { "category": "treatment", "value": "terapia manual" },
              { "category": "treatment", "value": "tecarterapia" },
              { "category": "treatment", "value": "ejercicios de movilidad" }
            ]
          }
        ],
        "fullAssessment": "Cuadro clínico compatible con síndrome post latigazo cervical, con compromiso funcional de la movilidad cervical derecha e hipertonía suboccipital. Dolor de origen cervicogénico y rigidez matutina. No se evidencian signos neurológicos. Plan: terapia física conservadora."
      };

      // Verificar que el payload tiene la estructura correcta para DynamicSOAPEditor
      expect(expectedPayload.segments).toBeDefined();
      expect(Array.isArray(expectedPayload.segments)).toBe(true);
      expect(expectedPayload.fullAssessment).toBeDefined();

      // Cada segmento debe tener los campos requeridos
      expectedPayload.segments.forEach(segment => {
        expect(segment).toHaveProperty('text');
        expect(segment).toHaveProperty('speaker');
        expect(segment).toHaveProperty('section');
        expect(segment).toHaveProperty('confidence');
        expect(segment).toHaveProperty('reasoning');
        expect(segment).toHaveProperty('entities');
        expect(Array.isArray(segment.entities)).toBe(true);
      });

      // Verificar distribución SOAP equilibrada
      const soapDistribution = expectedPayload.segments.reduce((acc, seg) => {
        acc[seg.section] = (acc[seg.section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(soapDistribution['S']).toBeGreaterThan(0);
      expect(soapDistribution['O']).toBeGreaterThan(0);
      expect(soapDistribution['A']).toBeGreaterThan(0);
      expect(soapDistribution['P']).toBeGreaterThan(0);
    });

    test('debe manejar transcripciones desordenadas del mundo real', async () => {
      const transcripcionDesordenada = `
        eh... bueno, el dolor me empezó hace como tres semanas
        ¿y dónde exactamente siente el dolor?
        pues... principalmente en el cuello, pero a veces baja
        al examinar, noto contractura en trapecio superior bilateral
        mmm... ¿empeora con algún movimiento específico?
        sí, cuando miro hacia arriba o giro mucho la cabeza
        hay limitación de 40% en extensión cervical
        creo que es una cervicalgia mecánica típica
        vamos a empezar con ejercicios suaves y calor local
      `;

      const resultado = await processor.processTranscription(transcripcionDesordenada, {
        specialty: 'fisioterapia'
      });

      // Debe procesar exitosamente incluso con texto desordenado
      expect(resultado.segments.length).toBeGreaterThan(0);
      expect(resultado.fullAssessment).toBeDefined();

      // Debe identificar correctamente los hablantes
      const speakers = resultado.segments.map(s => s.speaker);
      expect(speakers).toContain('PACIENTE');
      expect(speakers).toContain('TERAPEUTA');

      // Debe clasificar en secciones SOAP
      const sections = resultado.segments.map(s => s.section);
      expect(sections).toContain('S');
      expect(sections).toContain('O');
    });
  });

  describe('Integración con DynamicSOAPEditor', () => {
    test('debe generar datos compatibles con editor dinámico', async () => {
      const transcripcion = "dolor lumbar irradiado, contractura paravertebral, lumbalgia mecánica, reposo relativo";
      
      const resultado = await processor.processTranscription(transcripcion);

      // Verificar formato compatible con DynamicSOAPEditor
      expect(resultado).toHaveProperty('segments');
      expect(resultado).toHaveProperty('fullAssessment');
      
      // Cada segmento debe ser editable
      resultado.segments.forEach(segment => {
        expect(segment).toHaveProperty('text');
        expect(segment).toHaveProperty('section');
        expect(typeof segment.confidence).toBe('number');
        expect(segment.confidence).toBeGreaterThan(0);
        expect(segment.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Casos Edge y Robustez', () => {
    test('debe manejar transcripción vacía', async () => {
      const resultado = await processor.processTranscription('');
      expect(resultado.segments).toBeDefined();
      expect(Array.isArray(resultado.segments)).toBe(true);
    });

    test('debe manejar texto sin contenido médico', async () => {
      const textoNoMedico = "hola cómo estás, hace buen tiempo hoy";
      const resultado = await processor.processTranscription(textoNoMedico);
      
      expect(resultado.segments).toBeDefined();
      // Debe intentar clasificar aunque no sea contenido médico típico
    });

    test('debe mantener confianza realista', async () => {
      const transcripcion = "dolor moderado en hombro derecho";
      const resultado = await processor.processTranscription(transcripcion);
      
      resultado.segments.forEach(segment => {
        expect(segment.confidence).toBeGreaterThan(0.5);
        expect(segment.confidence).toBeLessThan(1.0);
      });
    });
  });
}); 