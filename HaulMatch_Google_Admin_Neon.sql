begin;
create table if not exists public.admin_users (
 auth_subject text primary key,
 email text not null unique,
 display_name text,
 role text not null default 'ADMIN' check (role in ('ADMIN','FINANCE_ADMIN','OPERATIONS_ADMIN','SUPER_ADMIN')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
drop policy if exists admin_users_read_own on public.admin_users;
create policy admin_users_read_own on public.admin_users for select using (auth_subject = auth.user_id());
create or replace function public.is_haulmatch_admin() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.admin_users where auth_subject=auth.user_id() and active=true);
$$;
create or replace function public.admin_session_profile() returns table(email text,display_name text,role text) language sql stable security definer set search_path=public,pg_temp as $$
 select a.email,a.display_name,a.role from public.admin_users a where a.auth_subject=auth.user_id() and a.active=true limit 1;
$$;
create or replace function public.admin_dashboard_summary() returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r jsonb:='{}'::jsonb; n bigint:=0;
begin
 if not public.is_haulmatch_admin() then raise exception 'Admin access denied' using errcode='42501'; end if;
 if to_regclass('public.transporters') is not null then
  execute 'select count(*) from public.transporters' into n; r:=r||jsonb_build_object('transporters',n);
  execute 'select count(*) from public.transporters where upper(coalesce(status,'''') )=''APPROVED''' into n; r:=r||jsonb_build_object('approved_transporters',n);
 end if;
 if to_regclass('public.transport_requests') is not null then execute 'select count(*) from public.transport_requests' into n; r:=r||jsonb_build_object('requests',n);
 elsif to_regclass('public.leads') is not null then execute 'select count(*) from public.leads' into n; r:=r||jsonb_build_object('requests',n); end if;
 if to_regclass('public.wallets') is not null then execute 'select coalesce(sum(balance),0) from public.wallets' into n; r:=r||jsonb_build_object('wallet_credits',n); end if;
 if to_regclass('public.lead_unlocks') is not null then execute 'select count(*) from public.lead_unlocks' into n; r:=r||jsonb_build_object('unlocks',n); end if;
 if to_regclass('public.payment_orders') is not null then execute 'select count(*) from public.payment_orders' into n; r:=r||jsonb_build_object('payments',n); end if;
 return r||jsonb_build_object('checked_at',now());
end; $$;
grant execute on function public.is_haulmatch_admin() to authenticated;
grant execute on function public.admin_session_profile() to authenticated;
grant execute on function public.admin_dashboard_summary() to authenticated;
commit;
-- After Google sign-in, copy the User ID from Neon Console > Auth > Users, then run:
-- insert into public.admin_users(auth_subject,email,display_name,role)
-- values ('PASTE_NEON_AUTH_USER_ID','admin@example.com','Admin Name','SUPER_ADMIN')
-- on conflict(auth_subject) do update set email=excluded.email,display_name=excluded.display_name,role=excluded.role,active=true,updated_at=now();
