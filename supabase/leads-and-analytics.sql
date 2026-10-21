-- Magic Carousels | Migração: Tabela de Leads do Popup e Rastreamento de Comportamento
-- Execute este script no SQL Editor do seu projeto Supabase.

begin;

-- 1. Tabela de Leads do Popup de Primeiro Acesso
create table if not exists public.popup_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text not null,
  source text not null default 'popup_primeiro_acesso',
  whatsapp_clicks integer not null default 0,
  last_clicked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists popup_leads_created_idx on public.popup_leads(created_at desc);
create index if not exists popup_leads_email_idx on public.popup_leads(email);

-- 2. Tabela de Rastreio de Comportamento na Página (Onde as pessoas param)
create table if not exists public.page_behavior_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null, -- 'scroll_depth', 'section_view', 'cta_click', 'niche_select', 'exit_section'
  section text,             -- 'hero', 'celular_preview', 'nichos_grid', 'recursos', 'tabela_precos', 'garantia', 'faq'
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists page_behavior_created_idx on public.page_behavior_events(created_at desc);
create index if not exists page_behavior_section_idx on public.page_behavior_events(section);
create index if not exists page_behavior_session_idx on public.page_behavior_events(session_id);

-- Configuração de RLS: apenas o papel do servidor (service_role) tem acesso direto
alter table public.popup_leads enable row level security;
revoke all on public.popup_leads from anon, authenticated;
grant select, insert, update, delete on public.popup_leads to service_role;

alter table public.page_behavior_events enable row level security;
revoke all on public.page_behavior_events from anon, authenticated;
grant select, insert, update, delete on public.page_behavior_events to service_role;

commit;
