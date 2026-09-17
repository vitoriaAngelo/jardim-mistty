// Mature crops: low roots, leafy rosettes, hanging fruit and distinct flowers.
function maturePlantArt(type, name) {
  if (type === 'lettuce') return null;
  const path = (d, fill, stroke = '#71865c', width = 1.3) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const leaf = (x,y,angle=0,color='#91ac77') => `<g transform="translate(${x} ${y}) rotate(${angle})">${path('M0 0Q-22-2-19-19Q-2-21 0 0Z',color)}${path('M-2-2L-15-15','none','#d6e2b7',1)}</g>`;
  const stem = (d='M40 99Q37 66 41 34') => path(d,'none','#748b60',3);
  const foliage = stem()+leaf(40,80,-15)+leaf(40,67,100)+leaf(40,52,-5);
  const petals = (n,length,width,color,offset=0,shape='round') => Array.from({length:n},(_,i)=>`<g transform="rotate(${offset+i*360/n})">${path(shape==='point'?`M0 3Q-${width} -8 0 -${length}Q${width} -8 0 3Z`:`M0 3C-${width} -2 -${width} -${length} 0 -${length}C${width} -${length} ${width} -2 0 3Z`,color,'#79677a55',.7)}</g>`).join('');
  const center = (r,color='#e6c77f') => `<circle r="${r}" fill="${color}"/><circle cx="-1.5" cy="-1.5" r="1.4" fill="#fff4cc" opacity=".65"/>`;
  const flower = (x,y,art,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})">${art}</g>`;
  const rosette = color => [-65,-32,0,32,65].map((a,i)=>`<g transform="translate(40 96) rotate(${a})">${path('M0 0C-13-9-18-18-12-23C-20-30-13-38-7-35C-10-44 3-47 7-37C17-41 22-31 14-24C21-15 10-6 0 0Z',color[i%color.length])}${path('M0-3V-35M0-14L-8-23M0-21L8-29','none','#e2e5c6',1)}</g>`).join('');
  const roots = {
    carrot: path('M29 76Q40 67 51 76Q48 96 38 104Q30 93 29 76Z','#dba16f','#ac805d')+path('M32 80l8 2m-5 6 8 1','none','#f3cf9c'),
    beetroot: path('M25 82C25 64 54 65 55 82Q55 96 41 98L37 106Q40 100 36 97Q25 95 25 82Z','#b97891','#88576e'),
    star_radish: path('M27 78Q40 64 53 78Q55 94 41 100L37 106Q40 100 35 97Q25 91 27 78Z','#ce99ad','#9f7487')+path('M40 77L43 83L50 84L45 88L46 95L40 91L34 95L35 88L30 84L37 83Z','#f8e8b6','#f8e8b6',.5),
  };
  let art;
  if (roots[type]) art=leaf(39,75,-30)+leaf(40,73,35)+leaf(41,74,105)+stem('M40 77V46')+roots[type];
  if (type==='potato') art=stem('M40 96Q31 74 42 51')+leaf(38,73,-10)+leaf(39,60,100)+leaf(35,86,-40)+path('M15 94C11 82 25 78 34 86C44 77 57 81 63 91Q65 103 51 103H27Q16 104 15 94Z','#cbb08b','#a68b6b')+path('M23 91h2m23-1h2m-12 8h2m16-3h1','none','#987c5c',2);
  if (type==='cassava') art=stem('M40 91V47')+[-55,-25,15,50,85].map(a=>leaf(40,57,a)).join('')+[-22,0,22].map(a=>`<g transform="translate(40 82) rotate(${a})">${path('M-5 0Q-12 12-5 22Q0 28 4 19L6 0Z','#b69c80','#8f7963')}${path('M-2 5v13','none','#dfcbb0')}</g>`).join('');
  if(type==='ruby_kale'||type==='crystal_kale') {art=rosette(type==='ruby_kale'?['#8d697b','#aa7b91','#b991a0']:['#86b39b','#afd6bf','#a0c9b8']); if(type==='crystal_kale') art+=path('M40 56L47 68L40 81L33 68Z','#e1f7e9','#a5cabb');}
  if(type==='purple_cabbage') art=leaf(36,97,-55)+leaf(44,97,115)+path('M15 76C11 53 28 43 40 47C57 42 71 61 65 80Q61 99 40 99Q17 98 15 76Z','#aa8bb5','#7e688b')+path('M40 97Q16 83 25 60Q42 49 52 61Q62 82 40 97M40 97Q57 76 43 59M40 95Q25 76 36 65M22 76Q29 74 34 80M49 78L59 71','none','#d8c4dd',1.8);
  if(type==='broccoli') art=path('M31 98L34 68L21 58L26 54L40 65L53 52L59 58L46 72L49 98Z','#abc48d')+leaf(34,93,-40)+leaf(47,92,115)+[[21,58,13],[59,58,13],[31,47,14],[48,45,15],[40,62,16]].map(([x,y,r],i)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${i%2?'#85a679':'#739768'}" stroke="#60815a" stroke-width="1.2"/><circle cx="${x-4}" cy="${y-4}" r="3" fill="#b9d09a" opacity=".5"/>`).join('');
  if(type==='pumpkin') art=stem('M21 97Q7 79 23 74Q40 70 44 87')+leaf(27,87,-25)+path('M39 65Q32 53 43 49','none','#7a9063',4)+flower(40,82,[-15,15,0].map((x,i)=>`<ellipse cx="${x}" rx="${i===2?13:16}" ry="21" fill="${i===2?'#e7b47e':'#d69a68'}" stroke="#b87c51" stroke-width="1.3"/>`).join(''));
  if(type==='corn') art=stem('M40 100V24')+path('M39 93Q9 77 14 53Q33 61 39 93M41 89Q69 68 65 46Q46 55 41 89','#91ad71')+path('M30 80Q23 54 33 40Q46 45 43 75Z','#ebd594','#b9a06b')+Array.from({length:6},(_,i)=>path(`M30 ${49+i*4}l10 3`,'none','#c4a66a',1)).join('')+path('M35 42Q24 25 28 22M36 42Q40 28 35 23','none','#dfc68e',1.5);
  if(type==='green_mushroom') art=[ [27,85,.75],[49,79,1] ].map(([x,y,s])=>flower(x,y,path('M-5 0L-8 21Q0 26 8 21L5 0Z','#e9e3c9','#a7a88d')+path('M-23 0Q-20-24 0-25Q20-24 23 0Q0 12-23 0Z','#9ab18a','#728669')+`<ellipse cy="1" rx="19" ry="5" fill="#d3d8b5"/><circle cx="-8" cy="-12" r="3" fill="#dce6bc"/><circle cx="8" cy="-16" r="4" fill="#dce6bc"/>`,s)).join('');
  if(['tomato','eggplant','yellow_eggplant','pepper','pink_cucumber'].includes(type)) {
    const colors={tomato:'#d68a7c',eggplant:'#9981b2',yellow_eggplant:'#e2cc7c',pepper:'#a5ba79',pink_cucumber:'#d9a7b6'};
    art=foliage+stem('M40 49Q22 42 23 60M40 61Q60 47 59 69');
    const fruit=type==='tomato'?path('M-12 3C-18-13-3-17 0-12C6-19 19-10 13 5Q2 20-12 3Z',colors[type],'#af7369'):type==='pepper'?path('M-12-9Q-5-18 0-11Q7-18 13-8L11 11Q6 20 0 14Q-7 20-12 9Z',colors[type]):type==='pink_cucumber'?path('M-6-13Q4-17 8-8L6 18Q0 26-7 17Z',colors[type],'#ae8494'):path('M-5-13Q6-15 7-4Q21 19 1 22Q-17 19-9 2Z',colors[type],'#8d7c90');
    art+=[[23,66,.85],[57,78,.9]].map(([x,y,s])=>flower(x,y,fruit+path('M-9-10L-3-8L0-14L4-8L10-10','none','#71865b',2)+path('M-6-3Q-9 5-4 10','none','#fff3d9',1.8),s)).join('');
  }
  const heads={
    daisy:petals(12,21,4,'#fff7df')+center(7),
    sunflower:petals(13,25,6,'#e4c27d',0,'point')+center(12,'#967658')+petals(9,8,1,'#cdb17e'),
    sun_flower:petals(10,27,7,'#e7b66d',0,'point')+petals(10,19,5,'#f2d99b',18,'point')+center(8,'#bd8d58'),
    rose:path('M0 20C-22 18-26-5-15-14Q-7-24 3-17Q21-24 24-6Q26 14 0 20Z','#cc91a1','#a96f87')+path('M-17-5Q-4-12 11-6Q17 6 0 15Q-15 8-13-3M-7-8Q6-17 14-7Q17 0 6 5Q-5 7-6-3Q-2-10 5-5','none','#efd0d8',2),
    tulip:path('M-19-17L-5-9L0-24L8-10L20-18Q24 17 0 23Q-24 17-19-17Z','#d4a1b8','#a47e98')+path('M0 21Q-14 6-19-17M0 21Q14 5 20-18','none','#f3d8df',1.5),
    poppy:petals(4,24,20,'#d99687',45)+center(7,'#6e6877'),
    hibiscus:petals(5,24,17,'#dfa79a',12)+path('M0 5Q5-7 15-14','none','#e9ca84',3)+flower(16,-15,center(3)),
    orchid:petals(3,22,7,'#c7a5cd',0,'point')+flower(-11,0,petals(2,13,13,'#dfc0db',90))+path('M-7 2Q0-4 7 2L11 13L0 18L-11 13Z','#af84b1','#98759f')+center(3),
    jasmine:petals(5,18,6,'#fff9e9',0,'point')+center(3),
    orange_blossom:petals(5,19,9,'#fff5dc')+center(5,'#dfbc72'),
    moon_flower:petals(5,26,14,'#d6cfe9',0,'point')+petals(5,15,7,'#f4ebf4',36,'point')+center(4),
    moon_lily:petals(6,27,10,'#bdb1d8',0,'point')+petals(6,18,6,'#e4def0',30,'point')+center(5),
    royal_dahlia:petals(12,26,7,'#bd869e',0,'point')+petals(12,19,6,'#dba6bc',15,'point')+petals(8,12,5,'#f0cad5',0,'point')+center(4),
  };
  if(heads[type]) art=foliage+flower(40,35,heads[type]);
  if(type==='lavender') art=[[-18,15,-14],[0,0,0],[18,10,14]].map(([x,y,a])=>`<g transform="translate(${x} ${y}) rotate(${a} 40 98)">${stem('M40 98V26')}${leaf(40,80,-10)}${Array.from({length:6},(_,i)=>flower(40,25+i*5,`<ellipse cx="-3" rx="5" ry="3" fill="#aa95c5"/><ellipse cx="3" cy="2" rx="5" ry="3" fill="#c3afd9"/>`)).join('')}</g>`).join('');
  if(type==='bluebell') art=stem('M37 98Q32 33 49 23')+leaf(37,88,-25)+[ [49,32],[25,52],[53,67] ].map(([x,y])=>stem(`M38 ${y-12}Q${x} ${y-18} ${x} ${y}`)+flower(x,y,path('M-9 0Q0-12 9 0Q7 12 14 16Q8 22 3 17Q-2 23-7 18Q-12 22-14 16Q-7 12-9 0Z','#a6b8d7','#7f94b8')+path('M-8 17Q0 12 9 17','none','#e3e8f4'))).join('');
  if(type==='cherry'||type==='cherry_blossom') art=path('M35 100Q42 65 33 36M39 75L60 49M38 57L18 42','none','#a08a75',3)+[[32,34],[17,43],[59,48],[44,61]].map(([x,y],i)=>flower(x,y,petals(5,13,9,i%2?'#e8b7c5':'#f2d1d7')+center(3),i===0?1.15:.85)).join('');
  if(type==='guarana_flower') art=foliage+flower(29,33,petals(5,12,6,'#f7ecd6')+center(3))+flower(53,51,petals(5,10,5,'#fff4df')+center(3))+[ [26,70],[50,81] ].map(([x,y])=>flower(x,y,path('M-9 0Q-10-13 0-12Q12-12 10 0Q9 13 0 12Q-10 13-9 0Z','#c98a7b','#aa7568')+`<ellipse rx="6" ry="8" fill="#fff5df"/><circle r="4" fill="#645554"/>`)).join('');
  if(!art) return null;
  return `<svg class="plant-svg bloom-anim mature-crop" width="80" height="110" viewBox="0 0 80 110" role="img" aria-label="${name} pronta para colher"><ellipse cx="40" cy="101" rx="28" ry="5" fill="#b29e7f" opacity=".35"/><g class="mature-crop-body">${art}</g></svg>`;
}
