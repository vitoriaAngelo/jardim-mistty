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

-- A fonte de verdade do álbum é gardens.data.albumCards. Os ids numéricos
-- representam cartas comuns; prismatic_N representa cartas prismáticas.
create or replace function public.trade_album_key(p_card_id text)
returns text language plpgsql immutable
set search_path = public
as $$
declare
  common_names text[] := array['Brotinho de Esperança','Juju entre Margaridas','Alfredo do Orvalho','Ovelhinha Algodão','Cogumelo do Pomar','Abelhinha Bilhetinho','Tulipinha Nuvem','Moranguinho Estrelar','Borboleta Açucarada','Solária da Primavera'];
  legacy_names text[] := array['Pipo, o brotinho','Juju do galinheiro','Alfredo do lago','Mimi das nuvens','Bento, o cogumelo','Mel, a abelhinha','Luna do luar','Íris cristalina','Aurora das asas','Solária, guardiã do jardim'];
  card_index integer;
begin
  if p_card_id ~ '^prismatic_[0-9]$' then return p_card_id; end if;
  if p_card_id !~ '^[0-9]$' then raise exception 'Carta inválida'; end if;
  card_index := p_card_id::integer + 1;
  if card_index < 1 or card_index > array_length(common_names,1) then raise exception 'Carta inválida'; end if;
  return common_names[card_index];
end;
$$;

create or replace function public.trade_card_quantity(p_cards jsonb, p_card_id text)
returns integer language plpgsql immutable
set search_path = public
as $$
declare
  common_names text[] := array['Brotinho de Esperança','Juju entre Margaridas','Alfredo do Orvalho','Ovelhinha Algodão','Cogumelo do Pomar','Abelhinha Bilhetinho','Tulipinha Nuvem','Moranguinho Estrelar','Borboleta Açucarada','Solária da Primavera'];
  legacy_names text[] := array['Pipo, o brotinho','Juju do galinheiro','Alfredo do lago','Mimi das nuvens','Bento, o cogumelo','Mel, a abelhinha','Luna do luar','Íris cristalina','Aurora das asas','Solária, guardiã do jardim'];
  card_index integer;
  card_key text;
begin
  card_key := public.trade_album_key(p_card_id);
  if p_card_id like 'prismatic_%' then return greatest(0, coalesce((p_cards->>card_key)::integer,0)); end if;
  card_index := p_card_id::integer + 1;
  return greatest(0, coalesce((p_cards->>common_names[card_index])::integer,(p_cards->>legacy_names[card_index])::integer,0));
end;
$$;

-- Libera ofertas expiradas. Reservas são calculadas a partir das ofertas ativas.
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
  perform pg_advisory_xact_lock(89431277);
  for expired_offer in
    select * from public.trade_offers
    where status = 'active' and expires_at <= now()
    for update
  loop
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
  sender_ctid tid; recipient_ctid tid;
  sender_data jsonb; recipient_data jsonb;
  offered_key text; requested_key text;
  sender_reserved integer;
begin
  perform pg_advisory_xact_lock(89431277);
  perform public.expire_trade_offers();
  if lower(p_sender_username) = lower(p_recipient_username) then
    raise exception 'Não é permitido trocar com a própria conta';
  end if;
  if p_offered_card_id = p_requested_card_id then raise exception 'As cartas da troca precisam ser diferentes'; end if;
  offered_key := public.trade_album_key(p_offered_card_id);
  requested_key := public.trade_album_key(p_requested_card_id);
  perform 1 from public.gardens where lower(username) in (lower(p_sender_username),lower(p_recipient_username)) order by lower(username) for update;
  select ctid,data into sender_ctid,sender_data from public.gardens where lower(username)=lower(p_sender_username) order by updated_at desc limit 1;
  select ctid,data into recipient_ctid,recipient_data from public.gardens where lower(username)=lower(p_recipient_username) order by updated_at desc limit 1;
  if sender_ctid is null or recipient_ctid is null then raise exception 'Uma das fazendas não foi encontrada'; end if;
  sender_data := coalesce(sender_data,'{}'::jsonb);
  recipient_data := coalesce(recipient_data,'{}'::jsonb);
  sender_reserved := (select count(*) from public.trade_offers where sender_username=lower(p_sender_username) and offered_card_id=p_offered_card_id and status='active');
  if public.trade_card_quantity(coalesce(sender_data->'albumCards','{}'::jsonb),p_offered_card_id)-sender_reserved < 2 then
    raise exception 'Você precisa ter uma carta repetida não reservada para oferecer';
  end if;
  if public.trade_card_quantity(coalesce(recipient_data->'albumCards','{}'::jsonb),p_requested_card_id) < 2 then
    raise exception 'A pessoa selecionada não tem mais essa carta repetida';
  end if;
  if public.trade_card_quantity(coalesce(sender_data->'albumCards','{}'::jsonb),p_requested_card_id) > 0 then
    raise exception 'Essa carta já está no seu álbum';
  end if;
  insert into public.trade_offers (sender_username, recipient_username, offered_card_id, requested_card_id)
    values (lower(p_sender_username), lower(p_recipient_username), p_offered_card_id, p_requested_card_id)
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
  sender_ctid tid; recipient_ctid tid;
  sender_data jsonb; recipient_data jsonb;
  sender_cards jsonb; recipient_cards jsonb;
  offered_key text; requested_key text;
  sender_reserved integer; recipient_reserved integer;
  sender_quantity integer; recipient_quantity integer;
begin
  perform pg_advisory_xact_lock(89431277);
  perform public.expire_trade_offers();
  select * into offer_row from public.trade_offers where id = p_offer_id for update;
  if not found or offer_row.status <> 'active' then raise exception 'Esta oferta não está mais ativa'; end if;
  if offer_row.recipient_username <> p_recipient_username then raise exception 'Esta oferta não pertence a você'; end if;

  perform 1 from public.gardens where lower(username) in (offer_row.sender_username,offer_row.recipient_username) order by lower(username) for update;
  select ctid,data into sender_ctid,sender_data from public.gardens where lower(username)=offer_row.sender_username order by updated_at desc limit 1;
  select ctid,data into recipient_ctid,recipient_data from public.gardens where lower(username)=offer_row.recipient_username order by updated_at desc limit 1;
  if sender_ctid is null or recipient_ctid is null then raise exception 'Uma das fazendas não foi encontrada'; end if;
  sender_cards := coalesce(sender_data->'albumCards','{}'::jsonb);
  recipient_cards := coalesce(recipient_data->'albumCards','{}'::jsonb);
  offered_key := public.trade_album_key(offer_row.offered_card_id);
  requested_key := public.trade_album_key(offer_row.requested_card_id);
  sender_quantity := public.trade_card_quantity(sender_cards,offer_row.offered_card_id);
  recipient_quantity := public.trade_card_quantity(recipient_cards,offer_row.requested_card_id);
  sender_reserved := (select count(*) from public.trade_offers where sender_username=offer_row.sender_username and offered_card_id=offer_row.offered_card_id and status='active' and id<>p_offer_id);
  recipient_reserved := (select count(*) from public.trade_offers where sender_username=offer_row.recipient_username and offered_card_id=offer_row.requested_card_id and status='active');
  if sender_quantity-sender_reserved < 2 or recipient_quantity-recipient_reserved < 2 then raise exception 'Uma das cartas repetidas não está mais disponível'; end if;
  sender_cards := jsonb_set(sender_cards,array[offered_key],to_jsonb(sender_quantity-1),true);
  sender_cards := jsonb_set(sender_cards,array[requested_key],to_jsonb(public.trade_card_quantity(sender_cards,offer_row.requested_card_id)+1),true);
  recipient_cards := jsonb_set(recipient_cards,array[requested_key],to_jsonb(recipient_quantity-1),true);
  recipient_cards := jsonb_set(recipient_cards,array[offered_key],to_jsonb(public.trade_card_quantity(recipient_cards,offer_row.offered_card_id)+1),true);
  update public.gardens set data=jsonb_set(coalesce(data,'{}'::jsonb),'{albumCards}',sender_cards,true),updated_at=now() where ctid=sender_ctid;
  update public.gardens set data=jsonb_set(coalesce(data,'{}'::jsonb),'{albumCards}',recipient_cards,true),updated_at=now() where ctid=recipient_ctid;

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
  perform pg_advisory_xact_lock(89431277);
  perform public.expire_trade_offers();
  select * into offer_row from public.trade_offers where id=p_offer_id for update;
  if not found or offer_row.status <> 'active' then raise exception 'Esta oferta não está mais ativa'; end if;
  if p_actor_username <> offer_row.sender_username and p_actor_username <> offer_row.recipient_username then raise exception 'Esta oferta não pertence a você'; end if;
  if (p_decline and p_actor_username <> offer_row.recipient_username) or (not p_decline and p_actor_username <> offer_row.sender_username) then raise exception 'Ação não permitida para este usuário'; end if;
  new_status := case when p_decline then 'declined' else 'cancelled' end;
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
revoke all on function public.create_trade_offer(text,text,text,text), public.accept_trade_offer(uuid,text), public.cancel_trade_offer(uuid,text,boolean), public.expire_trade_offers(), public.trade_album_key(text), public.trade_card_quantity(jsonb,text) from public, anon, authenticated;
grant execute on function public.create_trade_offer(text,text,text,text), public.accept_trade_offer(uuid,text), public.cancel_trade_offer(uuid,text,boolean), public.expire_trade_offers() to service_role;

-- Atualiza o cache do PostgREST para que a função RPC fique disponível imediatamente.
notify pgrst, 'reload schema';

