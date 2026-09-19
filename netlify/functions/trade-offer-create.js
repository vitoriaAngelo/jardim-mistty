const SUPABASE_URL='https://luvjridqxqpxnljucnur.supabase.co';
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const {authenticateTwitch}=require('./_auth');

exports.handler=async event=>{
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Garden-Session','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers,body:''};
  if(event.httpMethod!=='POST')return{statusCode:405,headers,body:JSON.stringify({error:'Method Not Allowed'})};
  if(!KEY)return{statusCode:503,headers,body:JSON.stringify({error:'Banco de trocas indisponível'})};
  try{
    const auth=await authenticateTwitch(event);
    const body=JSON.parse(event.body||'{}');
    const recipient=String(body.recipient_username||'').replace(/^@+/,'').toLowerCase();
    const offered=String(body.offered_card_id??'');
    const requested=String(body.requested_card_id??'');
    if(!recipient||!/^\d+$/.test(offered)||!/^\d+$/.test(requested))return{statusCode:400,headers,body:JSON.stringify({error:'Selecione o usuário e as duas cartas da oferta.'})};
    if(recipient===auth.username)return{statusCode:400,headers,body:JSON.stringify({error:'Não é permitido criar uma oferta para sua própria conta.'})};

    const userResponse=await fetch(`${SUPABASE_URL}/rest/v1/gardens?username=eq.${encodeURIComponent(recipient)}&select=username&limit=1`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
    if(!userResponse.ok)throw new Error('Não foi possível validar o usuário selecionado.');
    if(!(await userResponse.json()).length)return{statusCode:404,headers,body:JSON.stringify({error:'Esse usuário não está cadastrado na fazenda.'})};

    const requestedResponse=await fetch(`${SUPABASE_URL}/rest/v1/player_cards?username=eq.${encodeURIComponent(recipient)}&card_id=eq.${encodeURIComponent(requested)}&select=quantity&limit=1`,{headers:{apikey:KEY,Authorization:`Bearer ${KEY}`}});
    if(!requestedResponse.ok)throw new Error('Não foi possível validar a carta desejada.');
    const requestedRows=await requestedResponse.json();
    if(!requestedRows.length||Number(requestedRows[0].quantity)<2)return{statusCode:409,headers,body:JSON.stringify({error:'A carta escolhida não está mais repetida para esse usuário.'})};

    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_trade_offer`,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify({p_sender_username:auth.username,p_recipient_username:recipient,p_offered_card_id:offered,p_requested_card_id:requested})});
    const payload=await response.json().catch(()=>null);
    if(!response.ok)return{statusCode:409,headers,body:JSON.stringify({error:payload?.message||payload?.hint||'Não foi possível reservar a carta oferecida. Verifique se ainda há uma repetida disponível.'})};
    return{statusCode:201,headers,body:JSON.stringify({ok:true,offer:payload})};
  }catch(error){
    const status=error.statusCode||500;
    return{statusCode:status,headers,body:JSON.stringify({error:error.message||'Erro ao criar oferta'})};
  }
};
