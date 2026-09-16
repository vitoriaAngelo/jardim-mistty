-- Execute este script sozinho no SQL Editor do Supabase Preview.
-- Ele cria ou atualiza somente a fazenda de teste misttylol.

insert into public.gardens (username, data, updated_at)
values ('misttylol', '{
  "farmName": "Jardim da Mistty",
  "xp": 9800,
  "farmerXP": 9800,
  "level": 15,
  "pts": 209932,
  "seasonIdx": 0,
  "seasonDay": 6,
  "waterCapacity": 10,
  "waterCapacityLastRefill": 0,
  "unlockedPlots": 6,
  "inventory": {"lettuce":12,"carrot":10,"potato":8,"tomato":9,"rose":6,"ruby_kale":4,"star_radish":4,"moon_lily":4,"royal_dahlia":4},
  "fertilizerInventory": {"quick_grow":20,"golden_soil":20},
  "plots": [
    {"type":"lettuce","growCount":10,"waterCount":8},
    {"type":"rose","growCount":24,"waterCount":10},
    {"type":"royal_dahlia","growCount":20,"waterCount":9},
    null,null,null
  ],
  "skillPoints": 56,
  "skillPointsClaimed": 15,
  "skillNodes": {"mao_verde":2,"solo_vivo":2,"irrigacao":2,"compostagem":3},
  "bonusKitLevel": 3,
  "bonusRefillDiscount": true,
  "bonusWateringCapacity": 4,
  "bonusWaterRecoveryMinutes": 1,
  "supporterFrameUnlocked": true,
  "profileFrame": "vip",
  "isSubscriber": true,
  "premiumWateringCan": true,
  "premiumShovel": true,
  "premiumPlantsUnlocked": true,
  "premiumFertilizersClaimed": true,
  "premiumSpecialPlotClaimed": true,
  "specialPlots": [0,1,2,3],
  "specialPlot": 0,
  "paidKitOrders": ["preview-order-misttylol-especialista"],
  "achievements": ["first_plant","first_harvest","level5","level10","sell500","badge_dedicated"]
}'::jsonb, now())
on conflict (username) do update set data = excluded.data, updated_at = excluded.updated_at;
