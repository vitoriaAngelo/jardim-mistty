const SUPABASE_URL='https://luvjridqxqpxnljucnur.supabase.co';
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const {authenticateTwitch}=require('./_auth');
const {supabaseServiceHeaders}=require('./_supabase-auth');

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
    const validCard=id=>/^(?:[0-9]|prismatic_[0-9])$/.test(id);
    if(!recipient||!validCard(offered)||!validCard(requested))return{statusCode:400,headers,body:JSON.stringify({error:'Selecione o usuário e as duas cartas da oferta.'})};
    if(recipient===auth.username)return{statusCode:400,headers,body:JSON.stringify({error:'Não é permitido criar uma oferta para sua própria conta.'})};
    const response=await fetch(SUPABASE_URL+'/rest/v1/rpc/create_trade_offer',{method:'POST',headers:supabaseServiceHeaders(KEY,{'Content-Type':'application/json'}),body:JSON.stringify({p_sender_username:auth.username,p_recipient_username:recipient,p_offered_card_id:offered,p_requested_card_id:requested})});
    const payload=await response.json().catch(()=>null);
    if(!response.ok)return{statusCode:409,headers,body:JSON.stringify({error:payload?.message||payload?.hint||'Não foi possível criar a oferta. Confira as cartas e tente novamente.'})};
    return{statusCode:201,headers,body:JSON.stringify({ok:true,offer:payload})};
  }catch(error){return{statusCode:error.statusCode||500,headers,body:JSON.stringify({error:error.message||'Erro ao criar oferta'})};}
};
