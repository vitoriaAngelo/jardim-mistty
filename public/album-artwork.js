/* Shared drawings: both albums use identical SVG geometry. */
(function(){
const collection=[
['Pipo, o brotinho','comum','Todo começo cabe numa sementinha.','#b6c880','sprout',4],
['Juju do galinheiro','comum','Um ovo e um bom-dia quentinho.','#f4e5b6','bird',3],
['Alfredo do lago','comum','Colecionador de pequenas poças.','#b9ccb1','bird',2],
['Mimi das nuvens','comum','Um novelo de carinho e cochilos.','#ece5d5','sheep',1],
['Bento, o cogumelo','comum','Guarda segredos debaixo do chapéu.','#d8a294','mushroom',4],
['Mel, a abelhinha','comum','Entrega doçura de flor em flor.','#e4c777','bee',1],
['Luna do luar','épica','Floresce quando o jardim adormece.','#c4afd7','flower',2],
['Íris cristalina','épica','Um pedacinho de arco-íris no orvalho.','#a4c8d4','crystal',1],
['Aurora das asas','épica','Pinta o amanhecer em silêncio.','#d3b4d4','butterfly',1],
['Solária, guardiã do jardim','lendária','Onde ela dança, a vida floresce.','#efd487','guardian',1]
].map((a,i)=>({id:i,name:a[0],rarity:a[1],desc:a[2],color:a[3],kind:a[4],qty:a[5]}));
function art(c){let shape='';const eyes='<circle cx="71" cy="88" r="2.5" fill="#515346"/><circle cx="91" cy="88" r="2.5" fill="#515346"/><path d="M77 97q4 4 8 0" fill="none" stroke="#77735c" stroke-width="2" stroke-linecap="round"/>';
if(c.kind==='mushroom')shape='<path d="M64 83h34v43H64z" fill="#f6e8c8"/><path d="M33 81Q80-8 127 81Z" fill="'+c.color+'"/><g fill="#f8ecd3"><circle cx="65" cy="57" r="7"/><circle cx="95" cy="63" r="9"/></g>'+eyes;
else if(c.kind==='crystal')shape='<path d="m80 32 31 36-9 50-22 18-26-20-8-49Z" fill="#b9d9db" stroke="#8cabb7"/><path d="m80 32-8 42 8 62 19-60Z" fill="#e5edf3"/><path d="m46 67 26 7-18 42m57-48-12 8 3 42" fill="none" stroke="#93b6c5"/>';
else if(c.kind==='flower'||c.kind==='guardian')shape='<path d="M80 137V84m0 35q-33-25-30-2 10 13 30 9m0-14q32-26 30-3-8 14-30 12" fill="#a5b77d" stroke="#809664" stroke-width="3"/><g fill="'+c.color+'"><ellipse cx="80" cy="65" rx="16" ry="29"/><ellipse cx="80" cy="65" rx="16" ry="29" transform="rotate(60 80 65)"/><ellipse cx="80" cy="65" rx="16" ry="29" transform="rotate(120 80 65)"/></g><circle cx="80" cy="65" r="17" fill="#fff0b5"/><circle cx="74" cy="63" r="2" fill="#736744"/><circle cx="86" cy="63" r="2" fill="#736744"/><path d="M76 71q4 3 8 0" fill="none" stroke="#736744"/>';
else if(c.kind==='butterfly')shape='<g fill="'+c.color+'"><ellipse cx="57" cy="65" rx="23" ry="29" transform="rotate(-25 57 65)"/><ellipse cx="104" cy="65" rx="23" ry="29" transform="rotate(25 104 65)"/><ellipse cx="60" cy="104" rx="20" ry="22"/><ellipse cx="100" cy="104" rx="20" ry="22"/></g><path d="M80 111V61m0 0L70 48m10 13 10-13" stroke="#797663" stroke-width="6" stroke-linecap="round"/>';
else{shape=(c.kind==='bee'?'<g fill="#faf7e2"><ellipse cx="58" cy="61" rx="21" ry="15"/><ellipse cx="104" cy="61" rx="21" ry="15"/></g>':'')+'<ellipse cx="80" cy="94" rx="35" ry="36" fill="'+c.color+'"/>'+(c.kind==='sheep'?'<g fill="#ece5d5"><circle cx="53" cy="69" r="15"/><circle cx="79" cy="59" r="17"/><circle cx="104" cy="70" r="16"/></g>':'')+eyes+(c.kind==='sprout'?'<path d="M80 62V42q-28 1-27-17 27-3 27 17 3-24 27-19 0 20-27 19" fill="#859e66"/>':c.kind==='bird'?'<path d="m104 91 16 5-16 6" fill="#cda260"/><path d="M61 113v19m19-19v19" stroke="#cda260" stroke-width="3"/>':'');}
return '<svg viewBox="0 0 160 165" aria-hidden="true"><circle cx="123" cy="30" r="15" fill="#fff9dc" opacity=".55"/><path d="M0 134q45-35 83-8t77-2v41H0" fill="#a9bb8f" opacity=".45"/><ellipse cx="80" cy="139" rx="41" ry="9" fill="#637751" opacity=".15"/><g class="creature">'+shape+'</g><g class="spark" fill="#fff0bb"><path d="m28 36 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="m130 101 2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g></svg>';}

const springNames=['Brotinho de Esperança','Juju entre Margaridas','Alfredo do Orvalho','Ovelhinha Algodão','Cogumelo do Pomar','Abelhinha Bilhetinho','Tulipinha Nuvem','Moranguinho Estrelar','Borboleta Açucarada','Solária da Primavera'];
const originalArt=art;
art=function(c){let svg=originalArt(c);const scenery='<g opacity=".65"><path d="M4 90V63l21-17 21 17v32" fill="#e4c7a7"/><path d="m1 64 24-21 25 21" fill="none" stroke="#ae9b79" stroke-width="4" stroke-linecap="round"/><path d="M17 91V73h14v18" fill="#b7bc96"/><path d="M114 119v-17m19 19V99m18 25v-18M109 109l47 6" stroke="#c1ab85" stroke-width="4" stroke-linecap="round"/></g>';
svg=svg.replace('<g class="creature">',scenery+'<g class="creature">');
const blossoms=Array.from({length:7},(_,i)=>{const x=12+i*23,y=144+(i%2)*9;return '<path d="M'+x+' '+(y+8)+'v-11" stroke="#82945d" stroke-width="1.5"/><g fill="'+(i%2?'#f2c4bb':'#fff8df')+'"><circle cx="'+(x-3)+'" cy="'+y+'" r="3"/><circle cx="'+(x+3)+'" cy="'+y+'" r="3"/><circle cx="'+x+'" cy="'+(y-3)+'" r="3"/></g><circle cx="'+x+'" cy="'+y+'" r="1.7" fill="#d2ae61"/>';}).join('');
if(c.id===7)svg=svg.replace(/<g class="creature">[\s\S]*?<\/g><g class="spark"/,'<g class="creature"><path d="M47 72q30-21 64 0 6 35-31 60-38-23-33-60" fill="#d08b92" stroke="#b9777c" stroke-width="2"/><path d="m80  seventy"/><path d="m80 73-22-14 12 20-22 1 24 9 8-10 12 9 22-9-22-1 11-20Z" fill="#9daa73"/><g fill="#f5daa6"><ellipse cx="62" cy="94" rx="2" ry="3"/><ellipse cx="80" cy="105" rx="2" ry="3"/><ellipse cx="96" cy="94" rx="2" ry="3"/><ellipse cx="80" cy="121" rx="2" ry="3"/></g></g><g class="spark"');
return svg.replace('<path d="m80  seventy"/>','').replace('</svg>',blossoms+'</svg>');};
window.AlbumArtwork={names:springNames,render:art,card:index=>({...collection[index],name:springNames[index]})};
})();

