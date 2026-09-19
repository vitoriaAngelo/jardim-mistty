-- Sistema de trocas de figurinhas FarMistty
-- Execute este arquivo uma única vez no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.trade_offers (
  id uuid primary key default gen_random_uuid(),
  sender_username text not null,
  recipient_username text not null,
  offered_card_id text not null,
  requested_card_id text not null,
  status text not null default 'active' check (status in ('active','completed','declined','cancelled','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  recipient_confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  constraint trade_offer_different_users check (sender_username <> recipient_username),
  constraint trade_offer_different_cards check (offered_card_id <> requested_card_id)
);

create index if not exists trade_offers_sender_idx on public.trade_offers (sender_username, created_at desc);
create index if not exists trade_offers_recipient_idx on public.trade_offers (recipient_username, created_at desc);
create index if not exists trade_offers_active_idx on public.trade_offers (status, expires_at);

create table if not exists public.trade_events (
  id bigint generated always as identity primary key,
  trade_offer_id uuid not null references public.trade_offers(id) on delete cascade,
  event_type text not null check (event_type in ('created','accepted','declined','cancelled','expired','completed')),
  actor_username text,
  created_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create index if not exists trade_events_offer_idx on public.trade_events (trade_offer_id, created_at);

create table if not exists public.trade_notifications (
  id bigint generated always as identity primary key,
  username text not null,
  trade_offer_id uuid not null references public.trade_offers(id) on delete cascade,
  kind text not null check (kind in ('offer_received','offer_accepted','offer_declined','offer_cancelled','offer_expired','trade_completed')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trade_notifications_user_idx on public.trade_notifications (username, read_at, created_at desc);

-- Libera as reservas de ofertas expiradas. Esta função também é chamada antes
-- de criar, responder ou cancelar uma oferta, não dependendo de cron para estar correta.
create or replace function public.expire_trade_offers()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_offer record;
  total integer := 0;
begin
  for expired_offer in
    select * from public.trade_offers
    where status = 'active' and expires_at <= now()
    for update
  loop
    update public.player_cards
      set reserved_quantity = greatest(coalesce(reserved_quantity, 0) - 1, 0),
          updated_at = now()
      where username = expired_offer.sender_username
        and card_id = expired_offer.offered_card_id;

    update public.trade_offers
      set status = 'expired', cancelled_at = now()
      where id = expired_offer.id;

    insert into public.trade_events (trade_offer_id, event_type, details)
      values (expired_offer.id, 'expired', jsonb_build_object('reason','30_minute_timeout'));
    insert into public.trade_notifications (username, trade_offer_id, kind)
      values (expired_offer.sender_username, expired_offer.id, 'offer_expired'),
             (expired_offer.recipient_username, expired_offer.id, 'offer_expired');
    total := total + 1;
  end loop;
  return total;
end;
$$;

-- O criador confirma a própria parte ao enviar. Uma única cópia sempre fica no álbum.
create or replace function public.create_trade_offer(
  p_sender_username text,
  p_recipient_username text,
  p_offered_card_id text,
  p_requested_card_id text
)
returns public.trade_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  created_offer public.trade_offers;
begin
  perform public.expire_trade_offers();
  if p_sender_username = p_recipient_username then
    raise exception 'Não é permitido trocar com a própria conta';
  end if;
  if p_offered_card_id = p_requested_card_id then
    raise exception 'As cartas da troca precisam ser diferentes';
  end if;

  update public.player_cards
    set reserved_quantity = coalesce(reserved_quantity, 0) + 1,
        updated_at = now()
    where username = p_sender_username
      and card_id = p_offered_card_id
      and quantity - coalesce(reserved_quantity, 0) >= 2;
  if not found then
    raise exception 'Você precisa ter uma carta repetida disponível para oferecer';
  end if;

  insert into public.trade_offers (sender_username, recipient_username, offered_card_id, requested_card_id)
    values (p_sender_username, p_recipient_username, p_offered_card_id, p_requested_card_id)
    returning * into created_offer;
  insert into public.trade_events (trade_offer_id, event_type, actor_username)
    values (created_offer.id, 'created', p_sender_username);
  insert into public.trade_notifications (username, trade_offer_id, kind)
    values (p_recipient_username, created_offer.id, 'offer_received');
  return created_offer;
end;
$$;

-- Destinatário aceita: valida as duas cartas novamente e transfere ambas na mesma transação.
create or replace function public.accept_trade_offer(p_offer_id uuid, p_recipient_username text)
returns public.trade_offers
language plpgsql
security definer
set search_path = public
as $$
declare
  offer_row public.trade_offers;
begin
  perform public.expire_trade_offers();
  select * into offer_row from public.trade_offers where id = p_offer_id for update;
  if not found or offer_row.status <> 'active' then raise exception 'Esta oferta não está mais ativa'; end if;
  if offer_row.recipient_username <> p_recipient_username then raise exception 'Esta oferta não pertence a você'; end if;

  -- Mantém uma cópia para cada pessoa e confirma a reserva do criador.
  perform 1 from public.player_cards where username = offer_row.sender_username and card_id = offer_row.offered_card_id for update;
  perform 1 from public.player_cards where username = offer_row.recipient_username and card_id = offer_row.requested_card_id for update;
  if not exists (select 1 from public.player_cards where username = offer_row.sender_username and card_id = offer_row.offered_card_id and quantity - coalesce(reserved_quantity,0) >= 1)
     or not exists (select 1 from public.player_cards where username = offer_row.recipient_username and card_id = offer_row.requested_card_id and quantity - coalesce(reserved_quantity,0) >= 2) then
    raise exception 'Uma das cartas não está mais disponível para a troca';
  end if;

  update public.player_cards set quantity = quantity - 1, reserved_quantity = greatest(coalesce(reserved_quantity,0)-1,0), updated_at = now()
    where username = offer_row.sender_username and card_id = offer_row.offered_card_id;
  update public.player_cards set quantity = quantity - 1, updated_at = now()
    where username = offer_row.recipient_username and card_id = offer_row.requested_card_id;
  insert into public.player_cards (username, card_id, quantity, reserved_quantity, updated_at)
    values (offer_row.sender_username, offer_row.requested_card_id, 1, 0, now())
    on conflict (username, card_id) do update set quantity = public.player_cards.quantity + 1, updated_at = now();
  insert into public.player_cards (username, card_id, quantity, reserved_quantity, updated_at)
    values (offer_row.recipient_username, offer_row.offered_card_id, 1, 0, now())
    on conflict (username, card_id) do update set quantity = public.player_cards.quantity + 1, updated_at = now();

  update public.trade_offers set status='completed', recipient_confirmed_at=now(), completed_at=now() where id=p_offer_id returning * into offer_row;
  insert into public.trade_events (trade_offer_id,event_type,actor_username) values (p_offer_id,'accepted',p_recipient_username),(p_offer_id,'completed',p_recipient_username);
  insert into public.trade_notifications (username,trade_offer_id,kind) values (offer_row.sender_username,p_offer_id,'trade_completed'),(offer_row.recipient_username,p_offer_id,'trade_completed');
  return offer_row;
end;
$$;

-- Criador cancela; destinatário recusa. Ambas as ações liberam a carta reservada.
create or replace function public.cancel_trade_offer(p_offer_id uuid, p_actor_username text, p_decline boolean default false)
returns public.trade_offers
language plpgsql
security definer
set search_path = public
as $$
declare offer_row public.trade_offers; new_status text;
begin
  perform public.expire_trade_offers();
  select * into offer_row from public.trade_offers where id=p_offer_id for update;
  if not found or offer_row.status <> 'active' then raise exception 'Esta oferta não está mais ativa'; end if;
  if p_actor_username <> offer_row.sender_username and p_actor_username <> offer_row.recipient_username then raise exception 'Esta oferta não pertence a você'; end if;
  new_status := case when p_decline then 'declined' else 'cancelled' end;
  update public.player_cards set reserved_quantity=greatest(coalesce(reserved_quantity,0)-1,0),updated_at=now()
    where username=offer_row.sender_username and card_id=offer_row.offered_card_id;
  update public.trade_offers set status=new_status,cancelled_at=now() where id=p_offer_id returning * into offer_row;
  insert into public.trade_events (trade_offer_id,event_type,actor_username) values (p_offer_id,new_status,p_actor_username);
  insert into public.trade_notifications (username,trade_offer_id,kind) values
    (case when p_actor_username=offer_row.sender_username then offer_row.recipient_username else offer_row.sender_username end,p_offer_id,case when p_decline then 'offer_declined' else 'offer_cancelled' end);
  return offer_row;
end;
$$;

alter table public.trade_offers enable row level security;
alter table public.trade_events enable row level security;
alter table public.trade_notifications enable row level security;
revoke all on public.trade_offers, public.trade_events, public.trade_notifications from anon, authenticated;
revoke all on function public.create_trade_offer(text,text,text,text), public.accept_trade_offer(uuid,text), public.cancel_trade_offer(uuid,text,boolean), public.expire_trade_offers() from public;

