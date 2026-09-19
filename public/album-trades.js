(() => {
  const COMMON=['Brotinho de Esperança','Juju entre Margaridas','Alfredo do Orvalho','Ovelhinha Algodão','Cogumelo do Pomar','Abelhinha Bilhetinho','Tulipinha Nuvem','Moranguinho Estrelar','Borboleta Açucarada','Solária da Primavera'];
  const PRISMATIC=[['Prisma de Orvalho','💧'],['Prisma de Pétala','🌸'],['Prisma do Galinheiro','🐔'],['Prisma do Lago','🦆'],['Prisma de Cristal','💎'],['Prisma Borboleta','🦋'],['Prisma Lunar','🌙'],['Prisma Aurora','🌌'],['Prisma Estelar','⭐'],['Arco-Íris Primaveril','🌈']];
  let offers=[];
  const token=()=>sessionStorage.getItem('twitch_access_token')||'';
  const headers=()=>({Authorization:'Bearer '+token(),'Content-Type':'application/json','X-Garden-Session':sessionStorage.getItem('garden_session_id')||''});
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cards=()=>window.parent!==window?(window.parent.__farmAlbumCards||{}):{};
  const idOf=offer=>String(offer.offered_card_id||'');
  function cardInfo(id){
    if(/^prismatic_[0-9]$/.test(String(id))){const index=Number(String(id).split('_')[1]),entry=PRISMATIC[index];return entry?{id:String(id),name:entry[0],rarity:'Prismática',visual:'<div class="trade-prismatic-art">'+entry[1]+'</div>'}:null;}
    const card=collection[Number(id)];return card?{id:String(card.id),name:card.name,rarity:card.rarity,visual:art(card)}:null;
  }
  function ownedCards(){
    const inventory=cards(),items=[];
    collection.forEach(card=>{const qty=Math.max(0,Number(inventory[card.name]??card.qty)||0);if(qty>1)items.push({id:String(card.id),name:card.name,rarity:card.rarity,qty,visual:art(card)});});
    PRISMATIC.forEach(([name,icon],index)=>{const id='prismatic_'+index,qty=Math.max(0,Number(inventory[id]??inventory[name]??0)||0);if(qty>1)items.push({id,name,rarity:'Prismática',qty,visual:'<div class="trade-prismatic-art">'+icon+'</div>'});});
    return items;
  }
  function ownedCardIds(){
    const inventory=cards(),ids=new Set();
    collection.forEach(card=>{if((Number(inventory[card.name]??card.qty)||0)>0)ids.add(String(card.id));});
    PRISMATIC.forEach((entry,index)=>{const id='prismatic_'+index;if(Number(inventory[id]??inventory[entry[0]]??0)>0)ids.add(id);});
    return ids;
  }
  function syncAlbum(cardsMap){
    collection.forEach(card=>{card.qty=Math.max(0,Number(cardsMap[card.name]??0)||0);});
    render();
  }
  function header(tab){return '<div class="dialog-title"><span>⇄</span><h2>Central de Trocas</h2><p>Complete sua coleção com trocas reais entre fazendas.</p></div><div class="trade-tabs"><button id="db-received" class="'+(tab==='received'?'selected':'')+'">Ofertas recebidas</button><button id="db-sent" class="'+(tab==='sent'?'selected':'')+'">Minhas ofertas</button></div>';}
  async function loadOffers(){
    if(!token())throw new Error('Faça login para consultar suas trocas.');
    const response=await fetch('/.netlify/functions/trade-offers',{headers:headers(),cache:'no-store'}),data=await response.json();
    if(!response.ok)throw new Error(data.error||'Não foi possível carregar as trocas.');
    offers=Array.isArray(data.offers)?data.offers:[];
    if(data.albumCards&&window.parent!==window){window.parent.__farmAlbumCards={...data.albumCards};window.parent.postMessage({type:'album-state',cards:data.albumCards},'*');syncAlbum(data.albumCards);}
    return offers;
  }
  async function act(offer,action){
    const response=await fetch('/.netlify/functions/trade-offer-action',{method:'POST',headers:headers(),body:JSON.stringify({offer_id:offer.id,action})});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível atualizar a troca.');
    if(action==='accept'&&data.albumCards){
      if(window.parent!==window){window.parent.__farmAlbumCards={...data.albumCards};window.parent.postMessage({type:'album-state',cards:data.albumCards},'*');}
      syncAlbum(data.albumCards);
    }
    await trades(action==='cancel'?'sent':'received');
  }
  function offerMarkup(offer,tab,index){
    const sent=tab==='sent',out=cardInfo(offer.offered_card_id),incoming=cardInfo(offer.requested_card_id);
    if(!out||!incoming)return '';
    const other=sent?offer.recipient_username:offer.sender_username;
    const gives=sent?out:incoming,gets=sent?incoming:out;
    return '<article class="offer"><span class="avatar">'+(gets.rarity==='Prismática'?'🌈':'❀')+'</span><div><strong>'+(sent?'Proposta para @':'Oferta de @')+esc(other)+'</strong><p>Você recebe <b>'+esc(gets.name)+'</b> ⇄ oferece <b>'+esc(gives.name)+'</b></p><small>Expira '+new Date(offer.expires_at).toLocaleString('pt-BR')+'</small></div><button type="button" data-db-detail="'+index+'">Detalhes</button>'+(sent?'<button type="button" data-db-cancel="'+index+'">Cancelar</button>':'')+'</article>';
  }
  trades=async function(tab='received'){
    openBody(header(tab)+'<div class="offer-list"><div class="empty">Carregando ofertas do banco…</div></div><button class="wide" id="db-new-offer">+ Criar nova oferta</button>');
    document.querySelector('#db-received').onclick=()=>trades('received');document.querySelector('#db-sent').onclick=()=>trades('sent');document.querySelector('#db-new-offer').onclick=newOffer;
    try{
      await loadOffers();
      const username=(sessionStorage.getItem('se_username')||'').toLowerCase();
      const list=offers.filter(offer=>tab==='received'?offer.recipient_username===username:offer.sender_username===username);
      const container=document.querySelector('#modal-body .offer-list');if(!container)return;
      container.innerHTML=list.length?list.map((offer,index)=>offerMarkup(offer,tab,index)).join(''):'<div class="empty">'+(tab==='sent'?'Você não tem ofertas pendentes.':'Nenhuma oferta recebida no momento.')+' 🌱</div>';
      container.querySelectorAll('[data-db-detail]').forEach(button=>button.onclick=()=>openDetails(list[Number(button.dataset.dbDetail)],tab));
      container.querySelectorAll('[data-db-cancel]').forEach(button=>button.onclick=()=>confirmAction(list[Number(button.dataset.dbCancel)],'cancel'));
    }catch(error){const container=document.querySelector('#modal-body .offer-list');if(container)container.innerHTML='<div class="empty">'+esc(error.message)+'</div>';}
  };
  function openDetails(offer,tab){
    const sent=tab==='sent',offered=cardInfo(offer.offered_card_id),requested=cardInfo(offer.requested_card_id);if(!offered||!requested)return;
    const giving=sent?offered:requested,receiving=sent?requested:offered;
    openBody('<div class="dialog-title"><h2>Troca com @'+esc(sent?offer.recipient_username:offer.sender_username)+'</h2><p>As cartas só são transferidas após a confirmação do destinatário.</p></div><div class="offer-builder detail"><section class="offer-card"><small>VOCÊ RECEBE</small><div class="art">'+receiving.visual+'</div><strong>'+esc(receiving.name)+'</strong><p>'+esc(receiving.rarity)+'</p></section><span class="swap-arrow">⇄</span><section class="offer-card"><small>VOCÊ OFERECE</small><div class="art">'+giving.visual+'</div><strong>'+esc(giving.name)+'</strong><p>'+esc(giving.rarity)+'</p></section></div><p class="hint">Expira '+new Date(offer.expires_at).toLocaleString('pt-BR')+'</p><div class="offer-actions">'+(sent?'<button class="secondary" id="db-back">Voltar</button><button id="db-cancel">Cancelar oferta</button>':'<button class="secondary" id="db-decline">Recusar</button><button id="db-accept">Aceitar troca</button>')+'</div>');
    document.querySelector('#db-back')?.addEventListener('click',()=>trades(tab));
    document.querySelector('#db-cancel')?.addEventListener('click',()=>confirmAction(offer,'cancel'));
    document.querySelector('#db-decline')?.addEventListener('click',()=>confirmAction(offer,'decline'));
    document.querySelector('#db-accept')?.addEventListener('click',()=>confirmAction(offer,'accept'));
  }
  function confirmAction(offer,action){
    const words={accept:['Confirmar a troca?','As duas cartas serão transferidas de forma segura.','Confirmar'],decline:['Recusar esta oferta?','A carta reservada será liberada para a outra pessoa.','Recusar'],cancel:['Cancelar esta oferta?','A carta reservada voltará a ficar disponível no seu álbum.','Cancelar oferta']}[action];
    openBody('<div class="dialog-title"><h2>'+words[0]+'</h2><p>'+words[1]+'</p></div><div class="offer-actions"><button class="secondary" id="db-action-back">Voltar</button><button id="db-action-confirm">'+words[2]+'</button></div>');
    document.querySelector('#db-action-back').onclick=()=>trades(action==='cancel'?'sent':'received');
    document.querySelector('#db-action-confirm').onclick=async event=>{const button=event.currentTarget;button.disabled=true;button.textContent='Salvando…';try{await act(offer,action)}catch(error){openBody('<div class="dialog-title"><h2>Não foi possível concluir</h2><p>'+esc(error.message)+'</p></div><button class="wide" id="db-error-back">Voltar às trocas</button>');document.querySelector('#db-error-back').onclick=()=>trades(action==='cancel'?'sent':'received');}};
  }
  newOffer=async function(){
    const own=ownedCards();let targets=[];
    openBody(header('sent')+'<div class="dialog-title"><h3>🌿 Criar nova oferta</h3><p>Ofereça uma repetida e peça uma repetida que ainda falte no seu álbum.</p></div><div class="offer-builder"><section><label>Você oferece<select id="db-give">'+(own.length?own.map(card=>'<option value="'+esc(card.id)+'">'+esc(card.name)+' · repetida ×'+(card.qty-1)+'</option>').join(''):'<option value="">Nenhuma repetida disponível</option>')+'</select></label></section><span class="swap-arrow">⇄</span><section><label>Usuário da fazenda<select id="db-recipient"><option value="">Carregando usuários…</option></select></label><select id="db-want" aria-label="Carta repetida que falta no seu álbum" disabled><option>Selecione um usuário</option></select><p id="db-recipient-status" class="hint">Escolha um usuário para consultar as cartas dele.</p></section></div><div class="offer-actions"><button class="secondary" id="db-create-back">Cancelar</button><button id="db-create-send" disabled>Enviar oferta</button></div>');
    const recipient=document.querySelector('#db-recipient'),want=document.querySelector('#db-want'),status=document.querySelector('#db-recipient-status'),send=document.querySelector('#db-create-send');let eligible=[];
    document.querySelector('#db-received').onclick=()=>trades('received');document.querySelector('#db-sent').onclick=()=>trades('sent');document.querySelector('#db-create-back').onclick=()=>trades('sent');
    const refreshCards=async()=>{
      const username=recipient.value;eligible=[];want.disabled=true;send.disabled=true;
      if(!username){want.innerHTML='<option value="">Selecione um usuário</option>';status.textContent='Selecione uma pessoa para ver as repetidas que faltam na sua coleção.';return;}
      status.textContent='Buscando cartas repetidas…';want.innerHTML='<option>Carregando…</option>';
      try{
        const response=await fetch('/.netlify/functions/trade-user-cards?username='+encodeURIComponent(username),{headers:headers(),cache:'no-store'}),data=await response.json();if(!response.ok)throw new Error(data.error||'Falha ao buscar cartas.');
        const owned=ownedCardIds();
        eligible=(data.cards||[]).filter(card=>Number(card.available_quantity)>1&&!owned.has(String(card.card_id))).map(row=>({id:String(row.card_id),info:cardInfo(row.card_id),qty:Number(row.available_quantity)})).filter(row=>row.info);
        if(!eligible.length){want.innerHTML='<option value="">NENHUMA CARTA PARA TROCA</option>';status.textContent='Esse usuário não tem uma repetida que ainda falte no seu álbum.';return;}
        want.innerHTML=eligible.map(card=>'<option value="'+esc(card.id)+'">'+esc(card.info.name)+' · '+esc(card.info.rarity)+' · repetida ×'+(card.qty-1)+'</option>').join('');want.disabled=false;send.disabled=!own.length;status.textContent='Selecione a carta que falta na sua coleção.';
      }catch(error){want.innerHTML='<option value="">Erro ao carregar cartas</option>';status.textContent=error.message;}
    };
    try{
      if(!token())throw new Error('Faça login para criar uma oferta.');
      const response=await fetch('/.netlify/functions/trade-users',{headers:headers(),cache:'no-store'}),data=await response.json();if(!response.ok)throw new Error(data.error||'Falha ao carregar fazendas.');
      const self=(sessionStorage.getItem('se_username')||'').toLowerCase(),users=(data.users||[]).filter(username=>String(username).toLowerCase()!==self);
      recipient.innerHTML=users.length?'<option value="">Selecione uma pessoa</option>'+users.map(username=>'<option value="'+esc(username)+'">@'+esc(username)+'</option>').join(''):'<option value="">Nenhum outro usuário cadastrado</option>';
      recipient.onchange=refreshCards;await refreshCards();
    }catch(error){recipient.innerHTML='<option value="">Não foi possível carregar usuários</option>';status.textContent=error.message;}
    send.onclick=async()=>{
      const offered=document.querySelector('#db-give').value,requested=want.value,target=recipient.value;
      if(!target||!own.some(card=>card.id===offered)||!eligible.some(card=>card.id===requested))return;
      send.disabled=true;status.textContent='Reservando sua carta…';
      try{
        const response=await fetch('/.netlify/functions/trade-offer-create',{method:'POST',headers:headers(),body:JSON.stringify({recipient_username:target,offered_card_id:offered,requested_card_id:requested})}),data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível enviar oferta.');
        await trades('sent');
      }catch(error){status.textContent=error.message;send.disabled=false;}
    };
  };
  document.querySelector('#trade').onclick=()=>trades('received');
  window.addEventListener('message',event=>{if(event.source===window.parent&&event.data?.type==='album-state'&&event.data.cards)syncAlbum(event.data.cards);});
})();
