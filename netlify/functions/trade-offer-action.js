const SUPABASE_URL='https://luvjridqxqpxnljucnur.supabase.co';
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const {authenticateTwitch}=require('./_auth');
const {supabaseServiceHeaders}=require('./_supabase-auth');

exports.handler=async event=>{
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Garden-Session','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers,body:''};
  if(event.httpMethod!=='POST')return{statusCode:405,headers,body:JSON.stringify({error:'Method Not Allowed'})};
  try{
    const user=await authenticateTwitch(event);
    if(!KEY)throw new Error('Banco de trocas indisponível');
    const body=JSON.parse(event.body||'{}'),offerId=String(body.offer_id||''),action=String(body.action||'');
    if(!/^[0-9a-f-]{36}$/i.test(offerId)||!['accept','decline','cancel'].includes(action))return{statusCode:400,headers,body:JSON.stringify({error:'Ação ou oferta inválida'})};
    const rpcName=action==='accept'?'accept_trade_offer':'cancel_trade_offer';
    const args=action==='accept'?{p_offer_id:offerId,p_recipient_username:user.username}:{p_offer_id:offerId,p_actor_username:user.username,p_decline:action==='decline'};
    const dbHeaders=supabaseServiceHeaders(KEY,{'Content-Type':'application/json'});
    const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/'+rpcName,{method:'POST',headers:dbHeaders,body:JSON.stringify(args)});
    const payload=await response.json().catch(()=>null);
    if(!response.ok)return{statusCode:409,headers,body:JSON.stringify({error:payload?.message||payload?.hint||'A oferta não pode mais ser alterada.'})};
    let albumCards=null;
    if(action==='accept'){
      const garden=await fetch(SUPABASE_URL+'/rest/v1/gardens?username=eq.'+encodeURIComponent(user.username)+'&select=data,updated_at&order=updated_at.desc&limit=1',{headers:dbHeaders});
      if(!garden.ok)throw new Error('Troca concluída, mas não foi possível atualizar o álbum na tela. Reabra o álbum para sincronizar.');
      const rows=await garden.json();albumCards=rows[0]?.data?.albumCards||{};
    }
    return{statusCode:200,headers,body:JSON.stringify({ok:true,offer:payload,albumCards})};
  }catch(error){return{statusCode:error.statusCode||500,headers,body:JSON.stringify({error:error.message||'Erro ao responder à oferta'})};}
};
