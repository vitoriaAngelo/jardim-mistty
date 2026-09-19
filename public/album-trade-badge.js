(() => {
  const button = document.querySelector('#album-button');
  const badge = document.querySelector('#album-trade-badge');
  if (!button || !badge) return;

  let checking = false;
  async function updateTradeBadge() {
    const token = sessionStorage.getItem('twitch_access_token') || '';
    if (checking || !token || document.hidden) return;
    checking = true;
    try {
      const response = await fetch('/.netlify/functions/trade-inbox-status', {
        headers:{ Authorization:'Bearer ' + token, 'X-Garden-Session':sessionStorage.getItem('garden_session_id') || '' },
        cache:'no-store',
      });
      if (!response.ok) return;
      const data = await response.json();
      const count = Math.max(0, Number(data.pendingCount) || 0);
      badge.textContent = count > 9 ? '9+' : String(count);
      badge.classList.toggle('visible', count > 0);
      button.setAttribute('aria-label', count ? `Álbum de figurinhas, ${count} ofertas de troca pendentes` : 'Álbum de figurinhas');
    } catch (_) {
      // Preserva o último estado conhecido caso a consulta falhe temporariamente.
    } finally {
      checking = false;
    }
  }

  updateTradeBadge();
  window.setInterval(updateTradeBadge, 30000);
  window.addEventListener('focus', updateTradeBadge);
})();
