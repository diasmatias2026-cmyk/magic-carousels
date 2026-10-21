create or replace function public.app_apply_payment(p_order uuid,p_payment text,p_status text,p_amount integer)
returns void language plpgsql security invoker set search_path='' as $$
declare p public.payments; owner_id uuid;
begin
 if p_status not in ('pending','paid','failed','canceled','refunded','charged_back') then raise exception 'INVALID_STATUS'; end if;
 select user_id into owner_id from public.payments where id=p_order;
 if not found then raise exception 'PAYMENT_MISMATCH'; end if;
 perform 1 from public.app_users where id=owner_id for update;
 select * into p from public.payments where id=p_order for update;
 if p.amount<>p_amount then raise exception 'PAYMENT_MISMATCH'; end if;
 if p.payment_id is not null and p.payment_id<>p_payment then raise exception 'PAYMENT_MISMATCH'; end if;
 if p.status in ('refunded','charged_back') then return; end if;
 if p.status='paid' and p_status not in ('refunded','charged_back') then return; end if;
 update public.payments set payment_id=case when p_status in ('paid','refunded','charged_back') then p_payment else payment_id end,status=p_status,updated_at=now(),
 paid_at=case when p_status='paid' then coalesce(p.paid_at,now()) else p.paid_at end where id=p_order;
 update public.app_users set plan=case when exists(select 1 from public.payments where user_id=owner_id and status='paid') then 'LIFETIME' else 'FREE' end where id=owner_id;
 insert into public.audit_events(actor_id,action) values(owner_id,'payment:'||p_order::text||':'||p_status);
end $$;
create or replace function public.app_admin_stats()
returns jsonb language sql security invoker set search_path='' as $$
 select jsonb_build_object('totalUsers',(select count(*) from public.app_users),'paidRevenue',(select coalesce(sum(amount),0) from public.payments where status='paid'),'paidOrders',(select count(*) from public.payments where status='paid'));
$$;
revoke all on function public.app_admin_stats() from public,anon,authenticated;
grant execute on function public.app_admin_stats() to service_role;
create index if not exists audit_actor_idx on public.audit_events(actor_id);
create index if not exists payments_status_idx on public.payments(status);
