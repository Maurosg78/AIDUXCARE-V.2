-- Tabla para almacenar la retroalimentación de los profesionales sobre las sugerencias del agente clínico
create table if not exists suggestion_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  visit_id uuid not null,
  suggestion_id text not null,
  feedback_type text not null check (feedback_type in ('useful', 'irrelevant', 'incorrect', 'dangerous')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Comentarios para documentación en Supabase
comment on table suggestion_feedback is 'Almacena la retroalimentación de los profesionales clínicos sobre sugerencias del agente';
comment on column suggestion_feedback.id is 'Identificador único de cada registro de retroalimentación';
comment on column suggestion_feedback.user_id is 'ID del usuario profesional que proporciona la retroalimentación';
comment on column suggestion_feedback.visit_id is 'ID de la visita asociada a la sugerencia';
comment on column suggestion_feedback.suggestion_id is 'ID de la sugerencia que se está evaluando';
comment on column suggestion_feedback.feedback_type is 'Tipo de retroalimentación: útil, irrelevante, incorrecta o peligrosa';
comment on column suggestion_feedback.created_at is 'Fecha y hora de creación del registro en UTC';

-- Índices para mejor rendimiento en consultas comunes
create index if not exists suggestion_feedback_user_id_idx on suggestion_feedback(user_id);
create index if not exists suggestion_feedback_visit_id_idx on suggestion_feedback(visit_id);
create index if not exists suggestion_feedback_feedback_type_idx on suggestion_feedback(feedback_type);

-- Políticas de seguridad RLS para la tabla suggestion_feedback
alter table suggestion_feedback enable row level security;

-- Política para permitir a los usuarios ver solo sus propias retroalimentaciones
create policy "Los usuarios pueden ver sus propias retroalimentaciones"
  on suggestion_feedback for select
  using (auth.uid() = user_id);

-- Política para permitir a los usuarios crear retroalimentaciones
create policy "Los usuarios pueden crear retroalimentaciones"
  on suggestion_feedback for insert
  with check (auth.uid() = user_id);

-- Política para prevenir que los usuarios modifiquen retroalimentaciones existentes
create policy "Los usuarios no pueden modificar retroalimentaciones existentes"
  on suggestion_feedback for update
  using (false);

-- Política para prevenir que los usuarios eliminen retroalimentaciones
create policy "Los usuarios no pueden eliminar retroalimentaciones"
  on suggestion_feedback for delete
  using (false);

-- Función para obtener estadísticas de retroalimentación por profesional y tipo
create or replace function get_feedback_stats_by_user(p_user_id uuid)
returns table (
  feedback_type text,
  count bigint
)
language sql
security definer
as $$
  select 
    feedback_type, 
    count(*) 
  from 
    suggestion_feedback 
  where 
    user_id = p_user_id
  group by 
    feedback_type
  order by 
    count(*) desc;
$$; 