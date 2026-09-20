/* Original animated vector collection, shared by the album, packs and trades. */
(function(root){
  const definitions = [
    ['Pudim, o Caracol Postal','comum','Leva abraços devagar, numa casinha de sete cores.','snail'],
    ['Nina, a Xícara de Nuvem','comum','Um chá quentinho depois da chuva.','cup'],
    ['Pingo, o Axolote Jardineiro','comum','Cuida de um jardim debaixo das poças.','axolotl'],
    ['Lumi, a Raposa de Cachecol','rara','Costura o pôr do sol em pontinhos de carinho.','fox'],
    ['Tico, o Trem dos Sonhos','rara','Próxima parada: uma soneca nas nuvens.','train'],
    ['Mochi, a Baleia do Céu','rara','Navega num oceano de algodão e estrelas.','whale'],
    ['Dora, a Casinha Andarilha','rara','Onde pousa, nasce um cantinho aconchegante.','house'],
    ['Celeste, a Dragoinha do Chá','lendária','Seu sopro acende as cores da manhã.','dragon'],
    ['Amora, a Guardiã dos Abraços','lendária','Guarda pequenos mundos dentro de um coração.','bear'],
    ['Sonata, o Carrossel Celestial','lendária','Uma volta para cada cor, um desejo por estrela.','carousel'],
  ];
  const cards=definitions.map(([name,rarity,desc,kind],i)=>({id:'rainbow_'+i,key:'rainbow_'+i,name,rarity,desc,kind,i}));
  const colors=['#efadc0','#f0bd92','#f2d785','#b8d5aa','#9ecfd7','#b2bde2','#d3b2df'];
  let serial=0;
  function render(card){
    const c=typeof card==='number'?cards[card]:card, uid='rb'+(++serial), ink='#655768';
    const face=(x,y)=>`<g fill="${ink}"><circle cx="${x-10}" cy="${y}" r="2.4"/><circle cx="${x+10}" cy="${y}" r="2.4"/><path d="M${x-4} ${y+7}q4 4 8 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/></g><g fill="#edacb9" opacity=".65"><ellipse cx="${x-17}" cy="${y+6}" rx="5" ry="3"/><ellipse cx="${x+17}" cy="${y+6}" rx="5" ry="3"/></g>`;
    const rainbow=colors.map((color,i)=>`<path d="M${24+i*6} 96a${66-i*6} ${66-i*6} 0 0 1 ${132-i*12} 0" fill="none" stroke="${color}" stroke-width="6"/>`).join('');
    const fill=`url(#${uid})`;
    const shapes={
      snail:`<path d="M37 129q-5-22 10-24l5-21m-7 9-10-10m10 22q14-7 24 16h66q14 14-7 17H54q-20 0-17-9" fill="#e9edcf"/><circle cx="107" cy="102" r="33" fill="${fill}"/><path d="M105 125c-33-5-24-46 1-43 25 4 19 31 3 30-13-1-10-16-1-14" fill="none" stroke="#fff8e6" stroke-width="5"/>${face(49,113)}<path d="M99 120h20v14H99z" fill="#fff7e5"/><path d="m99 120 10 8 10-8" fill="none"/>`,
      cup:`<path d="M121 92q36-4 26 24-6 13-24 6" fill="none" stroke="#dbb3c9" stroke-width="9"/><path d="M48 86h80l-7 43q-30 24-64 0z" fill="${fill}"/><ellipse cx="88" cy="86" rx="40" ry="10" fill="#fff1db"/><ellipse cx="88" cy="86" rx="31" ry="5" fill="#c79b77"/>${face(87,111)}<g class="rb-steam" fill="none" stroke="#fffaf0" stroke-width="5"><path d="M76 70q-13-12 1-24"/><path d="M98 68q-12-13 2-24"/></g><ellipse cx="88" cy="145" rx="52" ry="7" fill="#d8d8c8"/>`,
      axolotl:`<g fill="${fill}"><path d="m58 96-25-24 4 23-16 5 24 13-14 11 28-3M123 95l25-24-4 25 15 5-23 12 13 12-28-4"/><ellipse cx="90" cy="108" rx="37" ry="31"/><path d="M73 132q-20 24-14 25l26-12 19 4q34 18 34-9-8 8-20-8"/></g>${face(90,108)}<path d="m86 138 2 18m0-12q-17-14-15-3 2 8 15 5m0-2q18-18 18-5-2 9-18 8" fill="#b6d6ae"/>`,
      fox:`<path d="M123 130q39-33 28-57-30 5-39 41" fill="${fill}"/><path d="m55 97-4-45 32 23 23-2 24-23-4 50q-4 34-36 33-33 0-35-31" fill="#ebc69f"/><path d="m56 98 34 12 34-12q-6 30-34 30-25 0-34-30" fill="#fff1db"/>${face(90,98)}<path d="M66 123q26 12 48-1l-2 16-29 2-4 19-15-5 9-19" fill="${fill}"/>`,
      train:`<g fill="${fill}"><rect x="26" y="99" width="47" height="38" rx="9"/><rect x="80" y="84" width="59" height="53" rx="9"/><path d="M74 88V72h43v16m13 26h21v23h-21"/></g><rect x="87" y="91" width="23" height="21" rx="5" fill="#fff5df"/>${face(49,115)}<g fill="#b1b3cc"><circle cx="39" cy="140" r="10"/><circle cx="65" cy="140" r="10"/><circle cx="99" cy="140" r="10"/><circle cx="133" cy="140" r="10"/></g><g class="rb-steam" fill="#fff6e8"><circle cx="101" cy="54" r="9"/><circle cx="115" cy="38" r="13"/></g>`,
      whale:`<path d="M126 95q15 4 24-17 12 11 8 29-6 10-22 9-10 39-60 30-44-9-40-39 4-25 40-27 30-2 50 15" fill="${fill}"/><path d="M47 120q35 33 75 6-18 33-54 15" fill="#fff3dd"/>${face(73,107)}<path d="M87 125q13 21 25 9" fill="#b4c7df"/><path class="rb-steam" d="M78 76q-18-22-25-8m25 8q1-30 18-20" fill="none" stroke="#a9cbdc" stroke-width="5"/>`,
      house:`<path d="M45 91h88v56H45z" fill="#fff0d3"/><path d="M31 95 89 42l61 53z" fill="${fill}"/><path d="M98 146v-29q-13-21-25 0v29" fill="#b8cfaf"/><rect x="52" y="104" width="16" height="17" rx="5" fill="#c1c9df"/><rect x="113" y="104" width="13" height="17" rx="4" fill="#d4b5d2"/>${face(88,82)}<path d="M54 147v10h-12m78-10v10h13" fill="none" stroke="#a18a75" stroke-width="6"/>`,
      dragon:`<path d="m64 103-34-32-8 37 40 16m57-21 34-32 7 38-39 15" fill="${fill}"/><path d="M65 97q-13-35 12-38l6-17 13 17q31-2 32 26l-12 18q24 40-10 49H73q-31-8-8-55" fill="#bdd8c8"/><path d="m78 126 18-20 16 22-14 18z" fill="${fill}"/>${face(96,84)}<path d="M46 125h23v17H46z" fill="#f0d6b0"/><path class="rb-steam" d="M54 119q-8-12 1-20" fill="none" stroke="#fff8ee" stroke-width="4"/>`,
      bear:`<circle cx="56" cy="69" r="17" fill="#e4c7b0"/><circle cx="122" cy="69" r="17" fill="#e4c7b0"/><ellipse cx="90" cy="102" rx="43" ry="45" fill="#f1ddc6"/>${face(90,88)}<path d="M90 144 62 117q-8-21 12-22 12 0 16 12 5-12 16-12 23 1 12 23z" fill="${fill}"/><path d="m52 115 22 11m53-11-22 11" stroke="#dbbaa2" stroke-width="13" stroke-linecap="round"/>`,
      carousel:`<path d="M88 43v102" stroke="#b69b6c" stroke-width="5"/><path d="m87 32 17 9-17 9" fill="#ebb1c7"/><path d="M27 79 89 46l63 33z" fill="${fill}"/><path d="M30 80q10 15 20 0 10 15 20 0 10 15 20 0 10 15 20 0 10 15 20 0 10 15 20 0" fill="#fff0d6"/><path d="M48 85v52m82-52v52" stroke="#c6ac7c" stroke-width="3"/><path d="M35 113q7-17 20-4l5 19H37zm81-6q13-17 27 5l-4 16h-25z" fill="${fill}"/>${face(48,116)}${face(129,116)}<ellipse cx="89" cy="145" rx="61" ry="12" fill="${fill}"/>`,
    };
    return `<svg class="rainbow-art" viewBox="0 0 180 180" role="img" aria-label="${c.name}"><defs><linearGradient id="${uid}" x2="1" y2="1">${colors.map((color,i)=>`<stop offset="${i/6}" stop-color="${color}"/>`).join('')}</linearGradient></defs><rect x="3" y="3" width="174" height="174" rx="36" fill="#f9f0e2"/><g opacity=".45">${rainbow}</g><ellipse cx="90" cy="157" rx="62" ry="9" fill="#d7cfce" opacity=".4"/><g class="rb-character" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round">${shapes[c.kind]}</g><g class="rb-twinkles" fill="#fffaf0" stroke="#c3a86f"><path d="m24 42 3 7 7 3-7 3-3 7-3-7-7-3 7-3zm124-15 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><circle cx="156" cy="145" r="3"/></g></svg>`;
  }
  const api={cards,render,odds:{common:.06,rare:.04,legendary:.03},weights:cards.map(c=>c.i<3?.06/3:c.i<7?.04/4:.03/3)};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.RainbowAlbum=api;
})(typeof window==='undefined'?globalThis:window);
