const SUPABASE_URL='https://luvjridqxqpxnljucnur.supabase.co';
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const {authenticateTwitch}=require('./_auth');
const {supabaseServiceHeaders}=require('./_supabase-auth');
const COMMON=['Brotinho de Esperança','Juju entre Margaridas','Alfredo do Orvalho','Ovelhinha Algodão','Cogumelo do Pomar','Abelhinha Bilhetinho','Tulipinha Nuvem','Moranguinho Estrelar','Borboleta Açucarada','Solária da Primavera'];
const LEGACY=['Pipo, o brotinho','Juju do galinheiro','Alfredo do lago','Mimi das nuvens','Bento, o cogumelo','Mel, a abelhinha','Luna do luar','Íris cristalina','Aurora das asas','Solária, guardiã do jardim'];

exports.handler=async event=>{
  const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization, X-Garden-Session','Access-Control-Allow-Methods':'GET, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers,body:''};
  if(event.httpMethod!=='GET')return{statusCode:405,headers,body:JSON.stringify({error:'Method Not Allowed'})};
  try{
    await authenticateTwitch(event);
    if(!KEY)throw Object.assign(new Error('Banco de trocas indisponível'),{statusCode:503});
    const username=String(event.queryStringParameters?.username||'').replace(/^@+/,'').toLowerCase();
    if(!username)return{statusCode:400,headers,body:JSON.stringify({error:'Usuário obrigatório'})};
    const dbHeaders=supabaseServiceHeaders(KEY);
    const gardenResponse=await fetch(SUPABASE_URL+'/rest/v1/gardens?username=eq.'+encodeURIComponent(username)+'&select=data,updated_at&order=updated_at.desc&limit=1',{headers:dbHeaders});
    if(!gardenResponse.ok)throw new Error('Não foi possível consultar o álbum deste usuário.');
    const gardens=await gardenResponse.json();
    if(!gardens.length)return{statusCode:404,headers,body:JSON.stringify({error:'Fazenda não encontrada',cards:[]})};
    const offersResponse=await fetch(SUPABASE_URL+'/rest/v1/trade_offers?sender_username=eq.'+encodeURIComponent(username)+'&status=eq.active&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=offered_card_id',{headers:dbHeaders});
    const reserved={};
    if(offersResponse.ok){
      (await offersResponse.json()).forEach(row=>reserved[row.offered_card_id]=(reserved[row.offered_card_id]||0)+1);
    }else{
      console.error('Falha não bloqueante ao consultar reservas:',offersResponse.status,await offersResponse.text());
    }
    const album=gardens[0].data?.albumCards||{};
    const cards=[];
    for(let i=0;i<COMMON.length;i++){
      const quantity=Math.max(0,Number(album[COMMON[i]]??album[LEGACY[i]]??0)||0),card_id=String(i),available_quantity=quantity-(reserved[card_id]||0);
      if(available_quantity>1)cards.push({card_id,quantity,available_quantity});
    }
    for(let i=0;i<10;i++){
      const card_id='prismatic_'+i,quantity=Math.max(0,Number(album[card_id]??0)||0),available_quantity=quantity-(reserved[card_id]||0);
      if(available_quantity>1)cards.push({card_id,quantity,available_quantity});
    }
    return{statusCode:200,headers,body:JSON.stringify({cards})};
  }catch(error){return{statusCode:error.statusCode||500,headers,body:JSON.stringify({error:error.message||'Erro ao buscar cartas'})};}
};
