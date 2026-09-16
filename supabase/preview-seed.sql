-- Dados fictícios para o banco de Deploy Preview.
-- Execute depois do preview-schema.sql.

insert into public.gardens (username, data, updated_at)
values
('preview_alice', jsonb_build_object(
  'farmName', 'Jardim da Alice', 'xp', 420, 'farmerXP', 420,
  'seasonIdx', 0, 'seasonDay', 3, 'pts', 1250, 'level', 4,
  'waterCapacity', 5, 'unlockedPlots', 3,
  'inventory', jsonb_build_object('lettuce', 4, 'carrot', 2, 'rose', 1),
  'fertilizerInventory', jsonb_build_object('quick_grow', 3, 'golden_soil', 1),
  'plots', jsonb_build_array(
    jsonb_build_object('type', 'lettuce', 'growCount', 4, 'waterCount', 2),
    jsonb_build_object('type', 'carrot', 'growCount', 1, 'waterCount', 1),
    null, null, null, null
  ),
  'skillPoints', 2, 'skillNodes', jsonb_build_object('mao_verde', 1),
  'bonusKitLevel', 0, 'profileFrame', 'pink', 'achievements', jsonb_build_array('first_plant')
), now()),
('preview_bia', jsonb_build_object(
  'farmName', 'Cantinho da Bia', 'xp', 1840, 'farmerXP', 1840,
  'seasonIdx', 1, 'seasonDay', 8, 'pts', 9870, 'level', 8,
  'waterCapacity', 7, 'unlockedPlots', 5,
  'inventory', jsonb_build_object('tomato', 8, 'potato', 5, 'moon_lily', 2),
  'fertilizerInventory', jsonb_build_object('quick_grow', 10, 'golden_soil', 6),
  'plots', jsonb_build_array(
    jsonb_build_object('type', 'tomato', 'growCount', 12, 'waterCount', 5),
    jsonb_build_object('type', 'potato', 'growCount', 9, 'waterCount', 4),
    jsonb_build_object('type', 'moon_lily', 'growCount', 20, 'waterCount', 7),
    null, null, null
  ),
  'skillPoints', 0, 'skillNodes', jsonb_build_object('mao_verde', 2, 'solo_vivo', 2, 'irrigacao', 1),
  'bonusKitLevel', 1, 'bonusRefillDiscount', true, 'bonusWateringCapacity', 2,
  'supporterFrameUnlocked', true, 'profileFrame', 'yellow',
  'paidKitOrders', jsonb_build_array('preview-order-iniciante'), 'achievements', jsonb_build_array('first_harvest', 'level5')
), now()),
('preview_cleo', jsonb_build_object(
  'farmName', 'Estufa da Cleo', 'xp', 5120, 'farmerXP', 5120,
  'seasonIdx', 2, 'seasonDay', 14, 'pts', 45200, 'level', 15,
  'waterCapacity', 10, 'unlockedPlots', 6,
  'inventory', jsonb_build_object('royal_dahlia', 8, 'ruby_kale', 6, 'star_radish', 4, 'moon_lily', 5),
  'fertilizerInventory', jsonb_build_object('quick_grow', 24, 'golden_soil', 18),
  'plots', jsonb_build_array(
    jsonb_build_object('type', 'royal_dahlia', 'growCount', 24, 'waterCount', 10),
    jsonb_build_object('type', 'ruby_kale', 'growCount', 18, 'waterCount', 8),
    jsonb_build_object('type', 'star_radish', 'growCount', 12, 'waterCount', 6),
    jsonb_build_object('type', 'moon_lily', 'growCount', 20, 'waterCount', 9),
    null, null
  ),
  'skillPoints', 4, 'skillNodes', jsonb_build_object('mao_verde', 2, 'solo_vivo', 2, 'irrigacao', 2, 'compostagem', 1),
  'bonusKitLevel', 3, 'bonusRefillDiscount', true, 'bonusWateringCapacity', 4,
  'bonusWaterRecoveryMinutes', 1, 'bonusVipUntil', (extract(epoch from now()) * 1000 + 864000000)::bigint,
  'specialPlots', jsonb_build_array(0, 1, 2, 3), 'specialPlot', 0,
  'specialPlotExpiresAt', (extract(epoch from now()) * 1000 + 864000000)::bigint,
  'supporterFrameUnlocked', true, 'profileFrame', 'vip',
  'paidKitOrders', jsonb_build_array('preview-order-especialista'), 'achievements', jsonb_build_array('level5', 'level10', 'sell500')
), now()),
('misttylol', jsonb_build_object(
  'farmName', 'Jardim da Mistty', 'xp', 9800, 'farmerXP', 9800,
  'seasonIdx', 0, 'seasonDay', 6, 'pts', 209932, 'level', 15,
  'waterCapacity', 10, 'waterCapacityLastRefill', (extract(epoch from now()) * 1000)::bigint,
  'unlockedPlots', 6,
  'inventory', jsonb_build_object('lettuce', 12, 'carrot', 10, 'potato', 8, 'tomato', 9, 'rose', 6, 'ruby_kale', 4, 'star_radish', 4, 'moon_lily', 4, 'royal_dahlia', 4),
  'fertilizerInventory', jsonb_build_object('quick_grow', 20, 'golden_soil', 20),
  'plots', jsonb_build_array(
    jsonb_build_object('type', 'lettuce', 'growCount', 10, 'waterCount', 8),
    jsonb_build_object('type', 'rose', 'growCount', 24, 'waterCount', 10),
    jsonb_build_object('type', 'royal_dahlia', 'growCount', 20, 'waterCount', 9),
    null, null, null
  ),
  'skillPoints', 56, 'skillPointsClaimed', 15,
  'skillNodes', jsonb_build_object('mao_verde', 2, 'solo_vivo', 2, 'irrigacao', 2, 'compostagem', 3),
  'bonusKitLevel', 3, 'bonusRefillDiscount', true, 'bonusWateringCapacity', 4,
  'bonusWaterRecoveryMinutes', 1, 'bonusVipUntil', (extract(epoch from now()) * 1000 + 864000000)::bigint,
  'specialPlots', jsonb_build_array(0, 1, 2, 3), 'specialPlot', 0,
  'specialPlotExpiresAt', (extract(epoch from now()) * 1000 + 864000000)::bigint,
  'supporterFrameUnlocked', true, 'profileFrame', 'vip', 'isSubscriber', true,
  'premiumWateringCan', true, 'premiumShovel', true, 'premiumPlantsUnlocked', true,
  'premiumFertilizersClaimed', true, 'premiumSpecialPlotClaimed', true,
  'paidKitOrders', jsonb_build_array('preview-order-misttylol-especialista'),
  'achievements', jsonb_build_array('first_plant', 'first_harvest', 'level5', 'level10', 'sell500', 'badge_dedicated')
), now())
on conflict (username) do update set data = excluded.data, updated_at = excluded.updated_at;

insert into public.payment_orders
  (order_id, username, kit, amount, status, mercado_pago_payment_id, paid_at, created_at)
values
('preview-order-iniciante', 'preview_bia', 'Kit Jardineiro Iniciante', 5.00, 'paid', 'preview-mp-5001', now(), now()),
('preview-order-especialista', 'preview_cleo', 'Kit Jardineiro Especialista', 15.00, 'paid', 'preview-mp-5002', now(), now())
 ,('preview-order-misttylol-especialista', 'misttylol', 'Kit Jardineiro Especialista', 15.00, 'paid', 'preview-mp-misttylol', now(), now())
on conflict (order_id) do update set status = excluded.status, paid_at = excluded.paid_at;
