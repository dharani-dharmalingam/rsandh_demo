-- Run once in Supabase SQL editor to add the parse jobs tracking table.
create table if not exists public.pipeline_jobs (
  slug          text        primary key,
  llama_job_id  text        not null,
  created_at    timestamptz not null default now()
);
