(() => {
  const button = document.querySelector('#combine');
  const openWorkshop = button?.onclick;
  const legacyNames = [
    'Pipo, o brotinho', 'Juju do galinheiro', 'Alfredo do lago',
    'Mimi das nuvens', 'Bento, o cogumelo', 'Mel, a abelhinha',
    'Luna do luar', 'Íris cristalina', 'Aurora das asas',
    'Solária, guardiã do jardim'
  ];

  if (!button || !openWorkshop) return;

  button.onclick = event => {
    if (window.parent !== window) {
      const latestCards = window.parent.__farmAlbumCards || {};
      collection.forEach((card, index) => {
        const quantity = latestCards[card.name] ?? latestCards[legacyNames[index]];
        if (quantity !== undefined) card.qty = Math.max(0, Number(quantity) || 0);
      });
      render();
    }

    openWorkshop.call(button, event);

    const notice = document.querySelector('#modal-body .notice');
    if (notice) {
      notice.textContent = 'Os números mostram as cópias repetidas disponíveis. Uma cópia de cada figurinha permanece no álbum.';
    }
  };

  const modalBody = document.querySelector('#modal-body');
  new MutationObserver(() => {
    const reveal = modalBody.querySelector('.reveal');
    const card = reveal?.querySelector('.reveal-card');
    if (!card || card.dataset.farmFindSent) return;
    const name = card.querySelector('h3')?.textContent?.trim();
    const rarity = card.querySelector('p')?.textContent?.trim();
    if (!name || !rarity) return;
    card.dataset.farmFindSent = 'true';
    window.parent.postMessage({ type:'card-found', card:{ name, rarity, prismatic:false } }, '*');
  }).observe(modalBody, { childList:true, subtree:true });
})();
