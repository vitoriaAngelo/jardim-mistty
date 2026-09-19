(() => {
  const toolbar = document.querySelector('.toolbar');
  const modal = document.querySelector('#modal');
  const body = document.querySelector('#modal-body');
  if (!toolbar || !modal || !body) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary ranking-open';
  button.textContent = '🏆 Ranking';
  toolbar.append(button);

  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  const heading = '<div class="ranking-heading"><span class="ranking-emblem" aria-hidden="true">✧</span><span class="ranking-eyebrow">COLECIONADORES DA FAZENDA</span><h2>Ranking de cartas</h2><p>Cada descoberta faz sua coleção florescer.</p></div>';
  const quantity = value => Math.min(10, Math.max(0, Math.floor(Number(value) || 0)));
  const albumCount = (label, count, theme) => '<div class="ranking-album '+theme+'"><span>'+label+' <b>'+count+'<small>/10</small></b></span><div class="ranking-meter" aria-hidden="true"><i style="width:'+count*10+'%"></i></div></div>';

  button.onclick = async () => {
    const view = document.createElement('section');
    view.className = 'ranking-view';
    view.innerHTML = heading + '<div class="ranking-loading" role="status">Carregando fazendas…</div>';
    body.replaceChildren(view);
    if (!modal.open) modal.showModal();
    const token = sessionStorage.getItem('twitch_access_token') || '';
    try {
      const response = await fetch('/.netlify/functions/album-ranking', {
        headers: token ? { Authorization:'Bearer ' + token, 'X-Garden-Session':sessionStorage.getItem('garden_session_id') || '' } : {},
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Entre na sua conta para ver o ranking.' : 'Não foi possível carregar o ranking agora.');
      const data = await response.json();
      const rows = Array.isArray(data.ranking) ? data.ranking : [];
      if (!view.isConnected) return;
      view.innerHTML = heading + '<div class="ranking-summary"><span><b>'+rows.length+'</b> fazendas</span><span>20 cartas para descobrir</span></div>' + (rows.length
        ? '<ol class="ranking-list" aria-label="Classificação das fazendas">' + rows.map((player, index) => {
          const normal = quantity(player.normalCount), prism = quantity(player.prismaticCount), total = normal + prism;
          const name = String(player.farmName || player.username || 'Fazenda');
          return '<li class="ranking-row '+(index<3?'ranking-top ranking-top-'+(index+1):'')+'"><span class="ranking-position" aria-label="Posição '+(index+1)+'">'+String(index+1).padStart(2,'0')+'</span><span class="ranking-avatar" aria-hidden="true">'+escape(Array.from(name.trim())[0] || '❀')+'</span><div class="ranking-farm"><strong title="'+escape(name)+'">'+escape(name)+'</strong><small>@'+escape(String(player.username).replace(/^@+/,''))+'</small></div><div class="ranking-total"><b>'+total+'</b><span>/20</span><small>descobertas</small></div><div class="ranking-albums">'+albumCount('Comum',normal,'normal')+albumCount('Prismático',prism,'prismatic')+'</div></li>';
        }).join('') + '</ol><p class="ranking-footnote">Uma carta, uma descoberta. Cópias repetidas não somam pontos.</p>'
        : '<div class="ranking-loading">Ainda não há fazendas no ranking.</div>');
    } catch (error) {
      if (view.isConnected) view.innerHTML = heading + '<p class="ranking-loading" role="status">' + escape(error.message) + '</p>';
    }
  };
})();
