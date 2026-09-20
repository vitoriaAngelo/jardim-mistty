const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const RainbowAlbum=require('../public/album-rainbow-art');
function api(file,fetch){const context={exports:{},process:{env:{SUPABASE_SERVICE_ROLE_KEY:'test-only'}},fetch,console,require:()=>({authenticateTwitch:async()=>({username:'test'}),supabaseServiceHeaders:()=>({})})};vm.createContext(context);vm.runInContext(fs.readFileSync(file,'utf8'),context);return context.exports.handler;}
test('ranking conta descobertas arco-íris uma vez, não as repetidas',async()=>{
 const handler=api('netlify/functions/album-ranking.js',async()=>({ok:true,json:async()=>[{username:'test',data:{albumCards:{rainbow_0:50,rainbow_9:1,rainbow_8:0}}}]}));
 const response=await handler({httpMethod:'GET'}),row=JSON.parse(response.body).ranking[0];
 assert.equal(response.statusCode,200);assert.equal(row.rainbowCount,2);assert.equal(row.total,2);
});
test('trocas oferecem apenas repetidas arco-íris que não estão reservadas',async()=>{
 const handler=api('netlify/functions/trade-user-cards.js',async url=>({ok:true,json:async()=>url.includes('/gardens?')?[{data:{albumCards:{rainbow_0:3,rainbow_1:2,rainbow_2:1}}}]:[{offered_card_id:'rainbow_0'},{offered_card_id:'rainbow_1'}]}));
 const response=await handler({httpMethod:'GET',queryStringParameters:{username:'test'}}),cards=JSON.parse(response.body).cards;
 assert.equal(response.statusCode,200);assert.equal(cards.length,1);assert.equal(cards[0].card_id,'rainbow_0');assert.equal(cards[0].available_quantity,2);
});
test('arco-íris tem dez desenhos próprios e tiers 3/4/3',()=>{
 assert.deepEqual(['comum','rara','lendária'].map(t=>RainbowAlbum.cards.filter(c=>c.rarity===t).length),[3,4,3]);
 assert.equal(new Set(RainbowAlbum.cards.map(c=>c.kind)).size,10);
 assert.equal(new Set(RainbowAlbum.cards.map(c=>c.key)).size,10);
 for(const c of RainbowAlbum.cards)assert.match(RainbowAlbum.render(c),/rb-character/);
});
test('sorteio arco-íris mantém 99,87% normal e permite todos os dez resultados',()=>{
 const src=fs.readFileSync('public/card-packs.js','utf8');
 const prefix=src.slice(0,src.indexOf('  window.renderCardPackShop='))+'globalThis.testDraw=draw;})();';
 let random=0;const context={RainbowAlbum,AlbumArtwork:{names:Array.from({length:10},(_,i)=>'normal'+i)},Math:Object.assign(Object.create(Math),{random:()=>random})};
 vm.createContext(context);vm.runInContext(prefix,context);
 assert.equal(context.testDraw('rainbow').key,'normal0');
 let cumulative=99.87;
 RainbowAlbum.weights.forEach((weight,i)=>{random=(cumulative+weight/2)/100;assert.equal(context.testDraw('rainbow').key,'rainbow_'+i);cumulative+=weight;});
 assert.ok(Math.abs(cumulative-100)<1e-10);
});
test('migração aceita IDs arco-íris sem convertê-los em índices numéricos',()=>{
 for(const file of ['supabase/rainbow-album.sql','supabase/trade-system.sql']){
  const sql=fs.readFileSync(file,'utf8');
  assert.equal(sql.split("'^(prismatic|rainbow)_[0-9]$'").length-1,2);
  assert.equal((sql.match(/create or replace function public.trade_album_key\(/g)||[]).length,1);
 }
});
