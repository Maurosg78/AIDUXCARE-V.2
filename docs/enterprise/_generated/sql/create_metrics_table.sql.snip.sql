```sql
-- Configurar RLS (Row Level Security)
ALTER TABLE public.metrics_by_visit ENABLE ROW LEVEL SECURITY;
-- ---
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
-- ---
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
-- ---
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
-- ---
```
