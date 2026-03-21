-- Run this once in Supabase: SQL Editor → New query → paste → Run
-- Creates the two intermediate tables for the Claude-driven PDF pipeline.

-- ── Table 1: parsed_documents ────────────────────────────────────────────────
-- Stores the LlamaParse markdown output (Skill 1 output / Skill 2 input).
create table if not exists public.parsed_documents (
  slug         text        primary key,
  markdown     text        not null,
  storage_path text        not null,     -- e.g. "rs-h/benefits-guide.pdf"
  word_count   integer,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.parsed_documents enable row level security;

comment on table public.parsed_documents is
  'LlamaParse markdown output per employer slug (pipeline Skill 1 → Skill 2).';

-- ── Table 2: extracted_documents ─────────────────────────────────────────────
-- Stores the ExtractedBenefitsData JSON (Skill 2 output / Skill 3 input).
create table if not exists public.extracted_documents (
  slug           text        primary key,
  extracted_data jsonb       not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.extracted_documents enable row level security;

comment on table public.extracted_documents is
  'ExtractedBenefitsData JSON per employer slug (pipeline Skill 2 → Skill 3).';
