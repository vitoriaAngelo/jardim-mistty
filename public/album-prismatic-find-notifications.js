const prismRevealObserver = new MutationObserver(() => {
  const card = document.querySelector('#modal-body .reveal-card');
  if (!card || card.dataset.farmFindSent) return;
  const name = card.querySelector('h3')?.textContent?.trim();
  const rarity = card.querySelector('p')?.textContent?.trim() || 'Prismática';
  if (!name) return;
  card.dataset.farmFindSent = 'true';
  window.parent.postMessage({ type:'card-found', card:{ name, rarity, prismatic:true } }, '*');
});
prismRevealObserver.observe(document.querySelector('#modal-body'), { childList:true, subtree:true });
