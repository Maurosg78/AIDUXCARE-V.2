/**
 * Script para crear una segunda visita de seguimiento para Andrea Bultó
 * 
 * Este script debe ejecutarse después de createClinicalCase.ts para tener una
 * visita previa con la que realizar el seguimiento longitudinal.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuración Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Datos para la segunda visita
interface Patient {
  id: string;
  full_name: string;
  user_id: string;
}

interface Visit {
  id: string;
  patient_id: string;
  professional_id: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface MCPContext {
  contextual: {
    source: string;
    data: Array<{
      id: string;
      type: string;
      content: string;
      metadata?: Record<string, unknown>;
      timestamp?: string;
      created_at?: string;
    }>;
  };
  persistent: {
    source: string;
    data: Array<{
      id: string;
      type: string;
      content: string;
      metadata?: Record<string, unknown>;
      timestamp?: string;
      created_at?: string;
    }>;
  };
  semantic: {
    source: string;
    data: Array<{
      id: string;
      type: string;
      content: string;
      metadata?: Record<string, unknown>;
      timestamp?: string;
      created_at?: string;
    }>;
  };
}

// Función para crear una nueva visita y registrar evolución del caso
async function createSecondVisit() {
  try {
    console.log('🔄 Iniciando creación de segunda visita para Andrea Bultó...');

    // 1. Buscar el paciente Andrea Bultó
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .ilike('full_name', '%Andrea Bultó%')
      .limit(1);

    if (patientError || !patients || patients.length === 0) {
      console.error('Error: No se encontró a la paciente Andrea Bultó', patientError);
      return;
    }

    const patient = patients[0] as Patient;
    console.log(`✅ Paciente encontrada: ${patient.full_name} (${patient.id})`);

    // 2. Buscar la primera visita
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .eq('patient_id', patient.id)
      .order('date', { ascending: false })
      .limit(1);

    if (visitsError || !visits || visits.length === 0) {
      console.error('Error: No se encontraron visitas previas para la paciente', visitsError);
      return;
    }

    const firstVisit = visits[0] as Visit;
    console.log(`✅ Visita previa encontrada: ${firstVisit.id} (${new Date(firstVisit.date).toLocaleDateString()})`);

    // 3. Crear nueva visita (2 semanas después de la primera)
    const firstVisitDate = new Date(firstVisit.date);
    const secondVisitDate = new Date(firstVisitDate);
    secondVisitDate.setDate(firstVisitDate.getDate() + 14); // 2 semanas después

    const secondVisitId = uuidv4();
    const { data: newVisit, error: visitError } = await supabase
      .from('visits')
      .insert({
        id: secondVisitId,
        patient_id: patient.id,
        professional_id: patient.user_id, // Mismo profesional
        date: secondVisitDate.toISOString(),
        status: 'completed',
        notes: 'Seguimiento de dolor lumbo-cervical - Evaluación de evolución y respuesta al tratamiento'
      })
      .select()
      .single();

    if (visitError || !newVisit) {
      console.error('Error: No se pudo crear la segunda visita', visitError);
      return;
    }

    console.log(`✅ Segunda visita creada: ${newVisit.id} (${new Date(newVisit.date).toLocaleDateString()})`);

    // 4. Obtener contexto de la primera visita
    const { data: prevContextData, error: prevContextError } = await supabase
      .from('mcp_contexts')
      .select('context')
      .eq('visit_id', firstVisit.id)
      .single();

    if (prevContextError || !prevContextData) {
      console.error('Error: No se pudo obtener el contexto previo', prevContextError);
      return;
    }

    const prevContext = prevContextData.context as MCPContext;

    // 5. Crear contexto para la segunda visita (modificando aspectos del primero)
    const secondContext: MCPContext = {
      // Copiar estructura básica
      ...prevContext,
      
      // Actualizar contexto con información de evolución
      contextual: {
        source: "manual",
        data: [
          // Información actual
          {
            id: uuidv4(),
            type: "contextual",
            content: `Paciente Andrea Bultó acude a consulta de seguimiento por dolor lumbo-cervical. Refiere mejoría parcial tras 2 semanas de tratamiento. El dolor cervical ha disminuido de 8/10 a 4/10 en escala EVA. Persiste molestia lumbar especialmente después de estar sentada por períodos prolongados.`,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            type: "contextual",
            content: `Examen físico: Reducción de contractura en trapecio bilateral. Mejoría en rango de movilidad cervical. Test de Lasègue negativo bilateral. Persistencia de puntos gatillo en región lumbar.`,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            type: "contextual",
            content: `Ha cumplido con ejercicios indicados y medicación. Refiere dificultad para mantener postura correcta durante jornada laboral.`,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ]
      },
      
      // Mantener datos persistentes, actualizando solo lo que ha cambiado
      persistent: {
        source: prevContext.persistent.source,
        data: [
          ...prevContext.persistent.data.filter(block => 
            !block.content.includes("dolor lumbar") && 
            !block.content.includes("medicación actual")
          ),
          // Actualizar datos persistentes con nueva información
          {
            id: uuidv4(),
            type: "persistent",
            content: `Evolución del dolor lumbar: Mejoría parcial tras 2 semanas de tratamiento. Reducción de intensidad de 8/10 a 4-5/10 en escala EVA.`,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          {
            id: uuidv4(),
            type: "persistent",
            content: `Medicación actual: Completó ciclo de AINE. Actualmente solo paracetamol 1g según necesidad (refiere tomar 1-2 comprimidos por semana).`,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ]
      },
      
      // Mantener y expandir aspectos semánticos
      semantic: prevContext.semantic
    };

    // 6. Guardar el nuevo contexto
    const { error: contextError } = await supabase
      .from('mcp_contexts')
      .insert({
        visit_id: secondVisitId,
        context: secondContext,
        created_by: patient.user_id,
        updated_by: patient.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (contextError) {
      console.error('Error: No se pudo guardar el contexto de la segunda visita', contextError);
      return;
    }

    console.log(`✅ Contexto clínico de segunda visita guardado`);

    // 7. Registrar logs de auditoría para la nueva visita
    const auditLogs = [
      {
        timestamp: new Date().toISOString(),
        user_id: patient.user_id,
        event_type: 'visit.create',
        details: {
          description: `Creación de visita de seguimiento para ${patient.full_name}`
        },
        visit_id: secondVisitId
      },
      {
        timestamp: new Date(new Date().getTime() + 2 * 60000).toISOString(), // 2 minutos después
        user_id: patient.user_id,
        event_type: 'emr.form.update',
        details: {
          description: 'Actualización de formulario SOAP - Sección subjetiva'
        },
        visit_id: secondVisitId
      },
      {
        timestamp: new Date(new Date().getTime() + 5 * 60000).toISOString(), // 5 minutos después
        user_id: patient.user_id,
        event_type: 'emr.form.update',
        details: {
          description: 'Actualización de formulario SOAP - Sección objetiva'
        },
        visit_id: secondVisitId
      },
      {
        timestamp: new Date(new Date().getTime() + 8 * 60000).toISOString(), // 8 minutos después
        user_id: patient.user_id,
        event_type: 'ai.suggestion',
        details: {
          description: 'Sugerencia generada: Actualización de plan terapéutico'
        },
        visit_id: secondVisitId,
        source: 'ia'
      },
      {
        timestamp: new Date(new Date().getTime() + 10 * 60000).toISOString(), // 10 minutos después
        user_id: patient.user_id,
        event_type: 'suggestion.integrated',
        details: {
          description: 'Sugerencia integrada: Actualización de plan terapéutico'
        },
        visit_id: secondVisitId,
        source: 'ia'
      },
      {
        timestamp: new Date(new Date().getTime() + 15 * 60000).toISOString(), // 15 minutos después
        user_id: patient.user_id,
        event_type: 'visit.completed',
        details: {
          description: `Visita de seguimiento completada para ${patient.full_name}`
        },
        visit_id: secondVisitId
      }
    ];

    // Insertar logs de auditoría
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert(auditLogs);

    if (auditError) {
      console.error('Error: No se pudieron registrar los logs de auditoría', auditError);
      return;
    }

    console.log(`✅ Logs de auditoría registrados para la segunda visita`);
    console.log(`\n🎉 Segunda visita creada exitosamente para Andrea Bultó!`);
    console.log(`🔍 ID de la visita: ${secondVisitId}`);
    console.log(`📅 Fecha: ${new Date(secondVisitDate).toLocaleDateString()}`);
    console.log(`\n✅ Ya puedes ver la traza longitudinal en la UI accediendo a la ficha del paciente.`);

  } catch (error) {
    console.error('Error general en el proceso:', error);
  }
}

// Ejecutar la función principal
createSecondVisit(); 