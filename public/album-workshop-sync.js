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
})();
