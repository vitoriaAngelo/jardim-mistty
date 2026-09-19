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

  button.onclick = async () => {
    body.innerHTML = '<section class="ranking-view"><h2>🏆 Ranking de cartas</h2><p>Cartas descobertas, sem contar repetidas.</p><div class="ranking-loading">Carregando fazendas…</div></section>';
    if (!modal.open) modal.showModal();
    const token = sessionStorage.getItem('twitch_access_token') || '';
    try {
      const response = await fetch('/.netlify/functions/album-ranking', {
        headers: token ? { Authorization:'Bearer ' + token } : {},
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Entre na sua conta para ver o ranking.' : 'Não foi possível carregar o ranking agora.');
      const data = await response.json();
      const rows = Array.isArray(data.ranking) ? data.ranking : [];
      body.innerHTML = '<section class="ranking-view"><h2>🏆 Ranking de cartas</h2><p>Cartas descobertas, sem contar repetidas.</p>' + (rows.length
        ? '<ol class="ranking-list">' + rows.map((player, index) => '<li><span class="ranking-position">' + (index < 3 ? ['🥇','🥈','🥉'][index] : '#' + (index + 1)) + '</span><span class="ranking-farm"><strong>' + escape(player.farmName) + '</strong><small>@' + escape(player.username) + '</small></span><span class="ranking-counts"><b>' + Number(player.total) + '/20</b><small>🌼 ' + Number(player.normalCount) + '/10 · ✨ ' + Number(player.prismaticCount) + '/10</small></span></li>').join('') + '</ol>'
        : '<div class="ranking-loading">Ainda não há fazendas no ranking.</div>') + '</section>';
    } catch (error) {
      body.innerHTML = '<section class="ranking-view"><h2>🏆 Ranking de cartas</h2><p class="ranking-loading" role="status">' + escape(error.message) + '</p></section>';
    }
  };
})();
