-- Resgates limitados da Loja Exclusiva (cartões-presente iFood).
-- Execute no SQL Editor do projeto Supabase antes de habilitar a loja no Preview.

create extension if not exists pgcrypto;

create table if not exists public.exclusive_store_redemptions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  reward_key text not null check (reward_key in ('ifood_20','ifood_50')),
  username text not null,
  redeemer_name text not null,
  points_cost bigint not null check (points_cost > 0),
  status text not null default 'pending' check (status in ('pending','redeemed','failed','review')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  constraint exclusive_store_username_normalized check (username = lower(username))
);

create index if not exists exclusive_store_reward_status_idx
  on public.exclusive_store_redemptions (reward_key, status, created_at);
create index if not exists exclusive_store_username_idx
  on public.exclusive_store_redemptions (username, created_at desc);
create unique index if not exists exclusive_store_one_claim_per_user_idx
  on public.exclusive_store_redemptions (reward_key, username)
  where status in ('pending','redeemed','review');

alter table public.exclusive_store_redemptions enable row level security;
revoke all on public.exclusive_store_redemptions from public, anon, authenticated;
grant usage on schema public to service_role;
grant select on public.exclusive_store_redemptions to service_role;

create or replace function public.reserve_exclusive_store_redemption(
  p_request_id uuid,
  p_reward_key text,
  p_username text,
  p_redeemer_name text,
  p_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reward_cost bigint;
  reward_limit integer;
  reserved_count integer;
  existing_row public.exclusive_store_redemptions;
  created_row public.exclusive_store_redemptions;
begin
  perform pg_advisory_xact_lock(17031984);

  perform 1 from public.gardens
    where username = lower(p_username)
      and data->>'_activeSessionId' = p_session_id
      and coalesce((data->>'_sessionLeaseUntil')::numeric, 0) > extract(epoch from clock_timestamp()) * 1000
    order by updated_at desc
    limit 1
    for update;
  if not found then raise exception 'Esta fazenda está ativa em outra sessão.'; end if;

  update public.exclusive_store_redemptions
    set status = 'failed'
    where status = 'pending' and created_at < now() - interval '15 minutes';

  select * into existing_row
    from public.exclusive_store_redemptions
    where request_id = p_request_id and username = lower(p_username)
    for update;
  if found then
    return jsonb_build_object('id', existing_row.id, 'status', existing_row.status, 'reward_key', existing_row.reward_key, 'newly_reserved', false);
  end if;

  if p_reward_key = 'ifood_20' then
    reward_cost := 5000000;
    reward_limit := 3;
  elsif p_reward_key = 'ifood_50' then
    reward_cost := 10000000;
    reward_limit := 1;
  else
    raise exception 'Prêmio inválido';
  end if;

  if coalesce(trim(p_username), '') = '' then raise exception 'Usuário inválido'; end if;
  if coalesce(trim(p_redeemer_name), '') = '' then raise exception 'Nome de exibição inválido'; end if;

  if exists (
    select 1 from public.exclusive_store_redemptions
    where reward_key = p_reward_key and username = lower(p_username)
      and status in ('pending','redeemed','review')
  ) then
    raise exception 'Você já resgatou este prêmio ou possui um resgate em andamento.';
  end if;

  select count(*) into reserved_count
    from public.exclusive_store_redemptions
    where reward_key = p_reward_key and status in ('pending','redeemed','review');
  if reserved_count >= reward_limit then raise exception 'Este prêmio já foi totalmente resgatado.'; end if;

  insert into public.exclusive_store_redemptions
    (request_id, reward_key, username, redeemer_name, points_cost, status)
    values (p_request_id, p_reward_key, lower(p_username), trim(p_redeemer_name), reward_cost, 'pending')
    returning * into created_row;

  return jsonb_build_object('id', created_row.id, 'status', created_row.status, 'reward_key', created_row.reward_key, 'points_cost', created_row.points_cost, 'newly_reserved', true);
end;
$$;

create or replace function public.finish_exclusive_store_redemption(p_redemption_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result_row public.exclusive_store_redemptions;
begin
  perform pg_advisory_xact_lock(17031984);
  update public.exclusive_store_redemptions
    set status = 'redeemed', redeemed_at = now()
    where id = p_redemption_id and status = 'pending'
    returning * into result_row;
  if not found then
    select * into result_row from public.exclusive_store_redemptions where id = p_redemption_id;
    if not found or result_row.status <> 'redeemed' then raise exception 'Resgate não está pendente'; end if;
  end if;
  return jsonb_build_object('id', result_row.id, 'status', result_row.status, 'reward_key', result_row.reward_key, 'username', result_row.username, 'redeemer_name', result_row.redeemer_name, 'points_cost', result_row.points_cost, 'redeemed_at', result_row.redeemed_at);
end;
$$;

create or replace function public.release_exclusive_store_redemption(p_redemption_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(17031984);
  update public.exclusive_store_redemptions set status = 'failed'
    where id = p_redemption_id and status = 'pending';
  return found;
end;
$$;

create or replace function public.flag_exclusive_store_redemption_for_review(p_redemption_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(17031984);
  update public.exclusive_store_redemptions set status = 'review'
    where id = p_redemption_id and status = 'pending';
  return found;
end;
$$;

revoke all on function public.reserve_exclusive_store_redemption(uuid,text,text,text,text) from public, anon, authenticated;
revoke all on function public.finish_exclusive_store_redemption(uuid) from public, anon, authenticated;
revoke all on function public.release_exclusive_store_redemption(uuid) from public, anon, authenticated;
revoke all on function public.flag_exclusive_store_redemption_for_review(uuid) from public, anon, authenticated;
grant execute on function public.reserve_exclusive_store_redemption(uuid,text,text,text,text) to service_role;
grant execute on function public.finish_exclusive_store_redemption(uuid) to service_role;
grant execute on function public.release_exclusive_store_redemption(uuid) to service_role;
grant execute on function public.flag_exclusive_store_redemption_for_review(uuid) to service_role;

-- Atualiza a lista de tabelas/funções exposta pelo PostgREST após a migração.
notify pgrst, 'reload schema';
