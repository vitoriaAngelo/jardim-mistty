const SUPABASE_URL='https://luvjridqxqpxnljucnur.supabase.co';
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const {authenticateTwitch}=require('./_auth');

exports.handler=async event=>{
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Garden-Session','Access-Control-Allow-Methods':'GET, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers,body:''};
  if(event.httpMethod!=='GET')return{statusCode:405,headers,body:JSON.stringify({error:'Method Not Allowed'})};
  try{
    const user=await authenticateTwitch(event);
    if(!KEY)throw new Error('Banco de trocas indisponível');
    const rpc=await fetch(SUPABASE_URL+'/rest/v1/rpc/expire_trade_offers',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:'{}'});
    if(!rpc.ok)throw new Error('A migração SQL do sistema de trocas precisa ser atualizada no Supabase.');
    const query='?status=eq.active&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=id,sender_username,recipient_username,offered_card_id,requested_card_id,status,created_at,expires_at&order=created_at.desc&limit=100';
    const results=await Promise.all(['sender_username','recipient_username'].map(key=>fetch(SUPABASE_URL+'/rest/v1/trade_offers'+query+'&'+key+'=eq.'+encodeURIComponent(user.username),{headers:{apikey:KEY,Authorization:'Bearer '+KEY}})));
    if(results.some(response=>!response.ok))throw new Error('Não foi possível carregar as ofertas do banco.');
    const rows=(await Promise.all(results.map(response=>response.json()))).flat();
    const offers=[...new Map(rows.map(row=>[row.id,row])).values()].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
    const gardenResponse=await fetch(SUPABASE_URL+'/rest/v1/gardens?username=eq.'+encodeURIComponent(user.username)+'&select=data,updated_at&order=updated_at.desc&limit=1',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
    if(!gardenResponse.ok)throw new Error('Não foi possível sincronizar seu álbum após a troca.');
    const gardens=await gardenResponse.json();
    return{statusCode:200,headers,body:JSON.stringify({offers,albumCards:gardens[0]?.data?.albumCards||{}})};
  }catch(error){return{statusCode:error.statusCode||500,headers,body:JSON.stringify({error:error.message||'Erro ao listar ofertas'})};}
};
