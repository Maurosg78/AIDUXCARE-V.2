-- Migration: Metrics tables for Aidux North beta
-- Market: CA, Language: en-CA

create table if not exists agent_suggestions (
  id uuid primary key default gen_random_uuid(),
  visit_id text not null,
  type text not null,
  risk_level text,
  created_at timestamptz not null default now()
);

create table if not exists suggestion_events (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null,
  visit_id text not null,
  event_type text not null check (event_type in ('generated','shown','accepted','rejected','integrated')),
  meta jsonb,
  at timestamptz not null default now()
);

create table if not exists productivity_metrics (
  id uuid primary key default gen_random_uuid(),
  visit_id text not null,
  minutes_saved_estimate int not null check (minutes_saved_estimate >= 0),
  at timestamptz not null default now()
);

create table if not exists compliance_results (
  id uuid primary key default gen_random_uuid(),
  visit_id text not null,
  rule_id text not null,
  pass boolean not null,
  details text,
  at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_suggestion_events_visit on suggestion_events(visit_id);
create index if not exists idx_productivity_metrics_visit on productivity_metrics(visit_id);
create index if not exists idx_compliance_results_visit on compliance_results(visit_id);
