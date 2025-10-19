-- Crear tabla metrics_by_visit para almacenar métricas longitudinales
CREATE TABLE IF NOT EXISTS public.metrics_by_visit (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  visit_id UUID NOT NULL,
  previous_visit_id UUID,
  patient_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fields_changed INT NOT NULL DEFAULT 0,
  suggestions_generated INT NOT NULL DEFAULT 0,
  suggestions_accepted INT NOT NULL DEFAULT 0,
  suggestions_integrated INT NOT NULL DEFAULT 0,
  audio_items_validated INT NOT NULL DEFAULT 0,
  time_saved_minutes INT NOT NULL DEFAULT 0,
  risk_level_summary TEXT NOT NULL,
  clinical_evolution TEXT NOT NULL,
  notes TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Restricciones
  CONSTRAINT fk_visit FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE,
  CONSTRAINT fk_previous_visit FOREIGN KEY (previous_visit_id) REFERENCES public.visits(id) ON DELETE SET NULL,
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  CONSTRAINT valid_risk_level CHECK (risk_level_summary IN ('low', 'medium', 'high')),
  CONSTRAINT valid_clinical_evolution CHECK (clinical_evolution IN ('improved', 'stable', 'worsened'))
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_metrics_visit_id ON public.metrics_by_visit(visit_id);
CREATE INDEX IF NOT EXISTS idx_metrics_patient_id ON public.metrics_by_visit(patient_id);
CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON public.metrics_by_visit(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON public.metrics_by_visit(date);
CREATE INDEX IF NOT EXISTS idx_metrics_clinical_evolution ON public.metrics_by_visit(clinical_evolution);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.metrics_by_visit ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Professional can view metrics for their patients" ON public.metrics_by_visit;
DROP POLICY IF EXISTS "Professional can create metrics for their patients" ON public.metrics_by_visit;
DROP POLICY IF EXISTS "Admin can view all metrics" ON public.metrics_by_visit;

-- Política para que los profesionales puedan ver métricas de sus pacientes
CREATE POLICY "Professional can view metrics for their patients" 
  ON public.metrics_by_visit 
  FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = metrics_by_visit.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

-- Política para que los profesionales puedan crear métricas para sus pacientes
CREATE POLICY "Professional can create metrics for their patients" 
  ON public.metrics_by_visit 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = metrics_by_visit.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

-- Política para que los administradores puedan ver todas las métricas
CREATE POLICY "Admin can view all metrics" 
  ON public.metrics_by_visit 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Función para actualizar la marca de tiempo de actualización automáticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp al modificar un registro
DROP TRIGGER IF EXISTS set_metrics_timestamp ON public.metrics_by_visit;
CREATE TRIGGER set_metrics_timestamp
BEFORE UPDATE ON public.metrics_by_visit
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Función para insertar datos omitiendo restricciones (para desarrollo/testing)
CREATE OR REPLACE FUNCTION insert_metric_record(p_metric_record JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Deshabilitar temporalmente las restricciones de clave externa
  SET session_replication_role = 'replica';
  
  -- Insertar el registro
  INSERT INTO metrics_by_visit (
    id, visit_id, previous_visit_id, patient_id, user_id, date,
    fields_changed, suggestions_generated, suggestions_accepted,
    suggestions_integrated, audio_items_validated, time_saved_minutes,
    risk_level_summary, clinical_evolution, notes, details
  ) VALUES (
    COALESCE((p_metric_record->>'id')::UUID, gen_random_uuid()),
    (p_metric_record->>'visit_id')::UUID,
    (p_metric_record->>'previous_visit_id')::UUID,
    (p_metric_record->>'patient_id')::UUID,
    (p_metric_record->>'user_id')::UUID,
    COALESCE((p_metric_record->>'date')::TIMESTAMPTZ, NOW()),
    COALESCE((p_metric_record->>'fields_changed')::INT, 0),
    COALESCE((p_metric_record->>'suggestions_generated')::INT, 0),
    COALESCE((p_metric_record->>'suggestions_accepted')::INT, 0),
    COALESCE((p_metric_record->>'suggestions_integrated')::INT, 0),
    COALESCE((p_metric_record->>'audio_items_validated')::INT, 0),
    COALESCE((p_metric_record->>'time_saved_minutes')::INT, 0),
    COALESCE(p_metric_record->>'risk_level_summary', 'low'),
    COALESCE(p_metric_record->>'clinical_evolution', 'stable'),
    p_metric_record->>'notes',
    p_metric_record->>'details'
  )
  RETURNING id INTO v_id;
  
  -- Reactivar las restricciones
  SET session_replication_role = 'origin';
  
  -- Devolver el ID del registro insertado
  RETURN jsonb_build_object('id', v_id);
END;
$$;

-- Función para ejecutar SQL directo (solo uso administrativo)
CREATE OR REPLACE FUNCTION run_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Ejecutar el SQL directamente (evitar en producción!)
  EXECUTE query INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

COMMENT ON TABLE public.metrics_by_visit IS 'Almacena métricas longitudinales entre visitas clínicas para evaluar la evolución del paciente'; 