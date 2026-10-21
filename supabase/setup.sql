-- Magic Carousels | Execute uma vez no SQL Editor do projeto correto.
-- Não apaga tabelas ou dados. Este schema usa sessão própria no backend.
-- A API pública não recebe acesso às tabelas: apenas o servidor (service_role).
begin;
create table if not exists public.app_users (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100),
 email text not null unique check(email=lower(email)), password_hash text not null,
 plan text not null default 'FREE' check(plan in ('FREE','LIFETIME')),
 free_trials_used integer not null default 0 check(free_trials_used between 0 and 1),
 terms_version text not null, terms_accepted_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create table if not exists public.admin_account (
 singleton boolean primary key default true check(singleton), user_id uuid not null unique references public.app_users(id) on delete cascade
);
create table if not exists public.app_sessions (
 token_hash text primary key, user_id uuid not null references public.app_users(id) on delete cascade,
 expires_at timestamptz not null, last_seen_at timestamptz not null default now(), current_page text not null default '/app'
);
create index if not exists sessions_user_idx on public.app_sessions(user_id);
create index if not exists sessions_expiry_idx on public.app_sessions(expires_at);
create table if not exists public.brand_kits (
 user_id uuid primary key references public.app_users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
create table if not exists public.carousels (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade,
 title text not null, niche text not null, template_id text not null, slides jsonb not null,
 caption text not null default '', format text not null default '4:5' check(format in ('4:5','1:1','9:16')),
 appearance jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists carousels_user_idx on public.carousels(user_id,updated_at desc);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id),
 provider text not null default 'mercadopago' check(provider='mercadopago'),
 preference_id text unique, payment_id text unique, checkout_url text,
 amount integer not null check(amount>0), status text not null default 'pending'
 check(status in ('pending','paid','failed','canceled','refunded','charged_back')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), paid_at timestamptz
);
create index if not exists payments_user_idx on public.payments(user_id,created_at desc);
create table if not exists public.usage_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade,
 kind text not null check(kind in ('generation','export')), created_at timestamptz not null default now()
);
create index if not exists usage_user_idx on public.usage_events(user_id,kind,created_at);
create table if not exists public.custom_templates (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade,
 data jsonb not null, created_at timestamptz not null default now()
);
create index if not exists templates_user_idx on public.custom_templates(user_id);
create table if not exists public.rate_limits (
 key text primary key, hits integer not null default 1, resets_at timestamptz not null
);
create table if not exists public.audit_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.app_users(id),
 action text not null, created_at timestamptz not null default now()
);

-- SECURITY INVOKER: execução reservada ao papel de servidor abaixo.
create or replace function public.app_rate_limit(p_key text,p_max integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 insert into public.rate_limits(key,hits,resets_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set
 hits=case when public.rate_limits.resets_at<=now() then 1 else public.rate_limits.hits+1 end,
 resets_at=case when public.rate_limits.resets_at<=now() then now()+make_interval(secs=>p_seconds) else public.rate_limits.resets_at end
 returning hits into n;
 return n<=p_max;
end $$;

create or replace function public.app_create_carousel(p_user uuid,p_data jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare u public.app_users; result uuid; daily integer;
begin
 select * into u from public.app_users where id=p_user for update;
 if not found then raise exception 'AUTH_REQUIRED'; end if;
 if u.plan='FREE' and u.free_trials_used>=1 then raise exception 'TRIAL_EXHAUSTED'; end if;
 select count(*) into daily from public.usage_events where user_id=p_user and kind='generation' and created_at>now()-interval '24 hours';
 if daily>=50 then raise exception 'DAILY_LIMIT'; end if;
 insert into public.carousels(user_id,title,niche,template_id,slides,caption,format,appearance)
 values(p_user,p_data->>'title',p_data->>'niche',p_data->>'template_id',p_data->'slides',coalesce(p_data->>'caption',''),p_data->>'format',coalesce(p_data->'appearance','{}'::jsonb)) returning id into result;
 insert into public.usage_events(user_id,kind) values(p_user,'generation');
 if u.plan='FREE' then update public.app_users set free_trials_used=1 where id=p_user; end if;
 return result;
end $$;

create or replace function public.app_apply_payment(p_order uuid,p_payment text,p_status text,p_amount integer)
returns void language plpgsql security invoker set search_path='' as $$
declare p public.payments;
begin
 select * into p from public.payments where id=p_order for update;
 if not found or p.amount<>p_amount then raise exception 'PAYMENT_MISMATCH'; end if;
 if p.payment_id is not null and p.payment_id<>p_payment then raise exception 'PAYMENT_MISMATCH'; end if;
 -- Um evento pendente atrasado não rebaixa pagamento aprovado ou estornado.
 if p.status in ('refunded','charged_back') then return; end if;
 if p.status='paid' and p_status not in ('refunded','charged_back') then return; end if;
 update public.payments set payment_id=p_payment,status=p_status,updated_at=now(),
 paid_at=case when p_status='paid' then coalesce(p.paid_at,now()) else p.paid_at end where id=p_order;
 update public.app_users set plan=case when exists(select 1 from public.payments where user_id=p.user_id and status='paid') then 'LIFETIME' else 'FREE' end where id=p.user_id;
end $$;

do $$ declare t text; begin
 foreach t in array array['app_users','admin_account','app_sessions','brand_kits','carousels','payments','usage_events','custom_templates','rate_limits','audit_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select,insert,update,delete on public.%I to service_role',t);
 end loop;
end $$;
revoke all on function public.app_rate_limit(text,integer,integer) from public,anon,authenticated;
revoke all on function public.app_create_carousel(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.app_apply_payment(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.app_rate_limit(text,integer,integer) to service_role;
grant execute on function public.app_create_carousel(uuid,jsonb) to service_role;
grant execute on function public.app_apply_payment(uuid,text,text,integer) to service_role;
commit;

-- Depois de cadastrar e verificar a conta administradora, execute separadamente:
-- insert into public.admin_account(singleton,user_id)
-- select true,id from public.app_users where email='EMAIL_DO_ADMIN_VERIFICADO';
-- Nunca conceda admin automaticamente pelo primeiro cadastro ou pelo navegador.
