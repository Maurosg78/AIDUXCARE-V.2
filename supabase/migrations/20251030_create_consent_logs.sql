create table if not exists consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  consent_version text not null,
  consent_date timestamptz default now(),
  consent_ip text,
  consent_agent text,
  withdrawn boolean default false,
  retention_until timestamptz generated always as (consent_date + interval '10 years') stored
);
