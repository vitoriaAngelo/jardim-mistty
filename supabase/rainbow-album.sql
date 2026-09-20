-- Extend existing trade keys without changing inventories or existing offers.
BEGIN;
create or replace function public.trade_album_key(p_card_id text)
returns text language plpgsql immutable
set search_path = public
as $$
declare
  common_names text[] := array['Brotinho de Esperança','Juju entre Margaridas','Alfredo do Orvalho','Ovelhinha Algodão','Cogumelo do Pomar','Abelhinha Bilhetinho','Tulipinha Nuvem','Moranguinho Estrelar','Borboleta Açucarada','Solária da Primavera'];
  legacy_names text[] := array['Pipo, o brotinho','Juju do galinheiro','Alfredo do lago','Mimi das nuvens','Bento, o cogumelo','Mel, a abelhinha','Luna do luar','Íris cristalina','Aurora das asas','Solária, guardiã do jardim'];
  card_index integer;
begin
  if p_card_id ~ '^(prismatic|rainbow)_[0-9]$' then return p_card_id; end if;
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
  if p_card_id ~ '^(prismatic|rainbow)_[0-9]$' then return greatest(0, coalesce((p_cards->>card_key)::integer,0)); end if;
  card_index := p_card_id::integer + 1;
  return greatest(0, coalesce((p_cards->>common_names[card_index])::integer,(p_cards->>legacy_names[card_index])::integer,0));
end;
$$;

COMMIT;
NOTIFY pgrst, 'reload schema';
