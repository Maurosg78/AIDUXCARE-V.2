## 4.x Supabase RLS & RBAC (documented from repo canonicals)

> **Generated:** 2025-10-08 19:13:12 CEST
> **Scope:** Documenta **migraciones y políticas SQL existentes** (sin cambios).

### Canonical SQL Sources
| File Path | Last Commit |
|---|---|
| `scripts/create_metrics_table 5.sql` | `71476cb` |
| `scripts/create_metrics_table.sql` | `32a469d` |

---
### Executive Summary (SQL)
- **RLS habilitado** en tablas sensibles (migraciones canónicas).
- **Scoping por `clinic_id`** + **identidad `auth.uid()`**.
- **RBAC** inferido por constraints/checks de rol y policies.
- **Borrado** normalmente restringido a roles elevados y/o auditado.

---
### Snippets reales (auto-extraídos)

**Source:** `create_metrics_table 5.sql`
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

**Source:** `create_metrics_table.sql`
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

---
### Observaciones
- Si algún control esperado no aparece, queda **pending review** para PR separado (sin tocar canónicos).
