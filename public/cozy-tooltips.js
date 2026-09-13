/* A single viewport-aware tooltip for static and dynamically rendered controls. */
(() => {
  const sources = '.header-btn-tip, .plot-tooltip, .inv-tip, .fert-tip';
  const hosts = '.header-icon-wrap, .plot, .inv-slot, .fert-inv-slot';
  const bubble = document.createElement('div');
  bubble.className = 'cozy-tooltip';
  bubble.id = 'cozy-tooltip';
  bubble.role = 'tooltip';
  bubble.hidden = true;
  document.body.append(bubble);
  document.body.classList.add('cozy-tooltips-ready');
  let activeHost, activeSource, describedControl;
  const sourceObserver = new MutationObserver(() => {
    if (activeSource) { bubble.innerHTML = activeSource.innerHTML; position(); }
  });
  function hide() {
    sourceObserver.disconnect();
    if (describedControl) {
      const remaining = (describedControl.getAttribute('aria-describedby') || '').split(' ').filter(id => id && id !== bubble.id).join(' ');
      if (remaining) describedControl.setAttribute('aria-describedby', remaining);
      else describedControl.removeAttribute('aria-describedby');
    }
    bubble.hidden = true;
    activeHost = activeSource = describedControl = null;
  }
  function position() {
    if (!activeHost?.isConnected) return hide();
    const rect = activeHost.getBoundingClientRect();
    const box = bubble.getBoundingClientRect();
    const gap = 12;
    const below = rect.top < box.height + gap + 12;
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - box.width / 2, window.innerWidth - box.width - 12));
    const top = below ? rect.bottom + gap : rect.top - box.height - gap;
    bubble.classList.toggle('below', below);
    bubble.style.left = `${left}px`;
    bubble.style.top = `${Math.max(12, Math.min(top, window.innerHeight - box.height - 12))}px`;
    bubble.style.setProperty('--tip-arrow', `${Math.max(16, Math.min(rect.left + rect.width / 2 - left, box.width - 16))}px`);
  }
  function show(host) {
    const source = host?.querySelector(sources);
    if (!source || activeHost === host) return;
    hide();
    activeHost = host;
    activeSource = source;
    bubble.innerHTML = source.innerHTML;
    bubble.hidden = false;
    describedControl = host.querySelector('button, [role="button"]') || host;
    const existing = describedControl.getAttribute('aria-describedby');
    describedControl.setAttribute('aria-describedby', [existing, bubble.id].filter(Boolean).join(' '));
    position();
    sourceObserver.observe(source, { childList: true, subtree: true, characterData: true });
  }
  function prepare(root) {
    const tips = [...(root.matches?.(sources) ? [root] : []), ...root.querySelectorAll(sources)];
    tips.forEach(source => {
      const host = source.closest(hosts);
      if (!host) return;
      source.setAttribute('aria-hidden', 'true');
      if (!host.querySelector('button, [tabindex]') && !host.hasAttribute('tabindex')) host.tabIndex = 0;
      if (host.matches('.inv-slot, .fert-inv-slot, .plot')) {
        host.setAttribute('role', 'button');
        host.setAttribute('aria-label', source.querySelector('strong')?.textContent || source.textContent.trim());
      }
    });
  }
  prepare(document);
  new MutationObserver(records => {
    if (activeHost && !activeHost.isConnected) hide();
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1 && node !== bubble && !bubble.contains(node)) prepare(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('pointerover', event => {
    if (event.pointerType !== 'touch') show(event.target.closest(hosts));
  });
  document.addEventListener('pointerout', event => {
    if (activeHost && !activeHost.contains(event.relatedTarget)) hide();
  });
  document.addEventListener('focusin', event => show(event.target.closest(hosts)));
  document.addEventListener('focusout', hide);
  document.addEventListener('pointerdown', hide);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hide();
    const host = event.target.closest('.inv-slot, .fert-inv-slot, .plot');
    if (host && event.target === host && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); host.click(); hide();
    }
  });
  const reposition = () => { if (activeHost) position(); };
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
})();
