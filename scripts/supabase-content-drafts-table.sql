-- Run this once in Supabase: SQL Editor → New query → paste → Run
-- Table for storing extracted content + admin drafts (serverless pipeline). Cheap and fast.

create table if not exists public.content_drafts (
  slug text primary key,
  content jsonb not null default '{}',
  is_draft boolean not null default true,
  updated_at timestamptz not null default now()
);

-- If table already exists without is_draft, run: alter table public.content_drafts add column if not exists is_draft boolean not null default true;
alter table public.content_drafts add column if not exists is_draft boolean not null default true;

-- RLS: only service_role (API) can access; no policy = no anon access
alter table public.content_drafts enable row level security;

comment on table public.content_drafts is 'Drafts and generated content per client slug (serverless Save/Publish + Git pipeline).';
