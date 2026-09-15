(() => {
  const style = document.createElement('style');
  style.textContent = `
    .garden-mascot{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));z-index:650;display:flex;flex-direction:column;align-items:flex-start;pointer-events:none;opacity:0;visibility:hidden;transform:translateY(12px) scale(.94);transform-origin:left bottom;transition:opacity .32s ease,transform .42s cubic-bezier(.22,1,.36,1),visibility 0s linear .42s}
    .garden-mascot[hidden]{display:none}
    .garden-mascot.is-visible{opacity:1;visibility:visible;transform:translateY(0) scale(1);pointer-events:none;transition-delay:0s}
    .mascot-button{width:96px;height:106px;padding:0;border:0;background:none;cursor:pointer;pointer-events:auto;filter:drop-shadow(0 5px 3px #354b2520)}
    .mascot-button:focus-visible{outline:2px solid #829968;outline-offset:3px;border-radius:40px}
    .garden-mascot .mascot-button,.garden-mascot .mascot-button *{cursor:var(--cozy-click-cursor,pointer)!important}
    .mascot-button>svg{overflow:visible}
    .mascot-premium-active .mascot-button>svg{filter:sepia(.72) saturate(1.75) hue-rotate(352deg) brightness(1.08) drop-shadow(0 0 7px #ffd96c) drop-shadow(0 4px 5px #a77628aa)}
    .mascot-premium-active .mascot-button::after{content:'✦';position:absolute;right:2px;top:10px;color:#ffd96c;font-size:18px;text-shadow:0 0 7px #fff2a8;animation:premium-sparkle 1.5s ease-in-out infinite}
    .mascot-button{position:relative}
    .mascot-button.mascot-transform{animation:mascot-transform 1.15s cubic-bezier(.2,.8,.2,1) both}
    .mascot-orange-form{display:none}
    .mascot-orange-active .mascot-sprout-form{display:none}
    .mascot-orange-active .mascot-orange-form{display:block}
    .mascot-button.mascot-orange-celebrate{animation:mascot-orange-celebrate 1.25s cubic-bezier(.2,.85,.25,1) both}
    .mascot-apple-form,.mascot-strawberry-form{display:none}
    .mascot-apple-active .mascot-sprout-form,.mascot-strawberry-active .mascot-sprout-form,.mascot-apple-active .mascot-orange-form,.mascot-strawberry-active .mascot-orange-form{display:none}
    .mascot-apple-active .mascot-apple-form,.mascot-strawberry-active .mascot-strawberry-form{display:block}
    .mascot-button.mascot-apple-celebrate,.mascot-button.mascot-strawberry-celebrate{animation:mascot-orange-celebrate 1.25s cubic-bezier(.2,.85,.25,1) both}
    .mascot-body{transform-origin:60px 100px;animation:mascot-breathe 4.5s ease-in-out infinite}
    .mascot-leaves{transform-origin:60px 37px;animation:mascot-sway 5s ease-in-out infinite}
    .mascot-eyes{transform-origin:60px 68px;animation:mascot-blink 7s infinite}
    .mascot-wave{transform-origin:91px 79px;transition:transform .5s ease}
    .mascot-affection{opacity:0;transform:translateY(5px);transition:opacity .4s ease,transform .6s ease;fill:#b28c9b}
    .mascot-button:is(:hover,:focus-visible,:active) .mascot-body{animation:mascot-greet 1.8s ease-in-out infinite}
    .mascot-button:is(:hover,:focus-visible,:active) .mascot-wave{animation:mascot-wave 1.2s ease-in-out infinite}
    .mascot-button:is(:hover,:focus-visible,:active) .mascot-affection{opacity:1;transform:translateY(0)}
    .mascot-button:is(:hover,:focus-visible,:active) .mascot-eyes{animation:none;transform:scaleY(.55)}
    @keyframes mascot-greet{0%,100%{transform:translateY(-2px) rotate(0deg)}50%{transform:translateY(-6px) rotate(-4deg)}}
    @keyframes mascot-wave{0%,100%{transform:rotate(-15deg)}50%{transform:rotate(-45deg)}}
    .garden-mascot .mascot-button.mascot-hop .mascot-body{animation:mascot-hop 1s ease-in-out both}
    .garden-mascot .mascot-button.mascot-dance .mascot-body{animation:mascot-dance 1.4s ease-in-out both}
    @keyframes mascot-hop{0%,100%{transform:translateY(0) scale(1)}20%{transform:translateY(2px) scale(1.06,.94)}48%{transform:translateY(-16px) scale(.97,1.03) rotate(-3deg)}75%{transform:translateY(0) scale(1.04,.96)}}
    @keyframes mascot-dance{0%,100%{transform:rotate(0) translateY(0)}20%{transform:rotate(-9deg) translateY(-3px)}40%{transform:rotate(8deg) translateY(-2px)}60%{transform:rotate(-7deg) translateY(-3px)}80%{transform:rotate(5deg) translateY(-1px)}}
    @keyframes mascot-transform{0%{transform:scale(1);filter:brightness(1)}35%{transform:scale(.86) rotate(-5deg);filter:brightness(1.3)}70%{transform:scale(1.16) rotate(4deg);filter:brightness(1.7)}100%{transform:scale(1);filter:brightness(1)}}
    @keyframes premium-sparkle{0%,100%{opacity:.45;transform:scale(.8) rotate(0)}50%{opacity:1;transform:scale(1.2) rotate(20deg)}}
    @keyframes mascot-orange-celebrate{0%,100%{transform:translateY(0) rotate(0) scale(1)}20%{transform:translateY(-13px) rotate(-8deg) scale(1.06)}42%{transform:translateY(0) rotate(6deg) scale(.96)}65%{transform:translateY(-9px) rotate(8deg) scale(1.08)}82%{transform:translateY(-2px) rotate(-4deg) scale(1.02)}}
    .mascot-bubble{position:relative;width:220px;max-width:calc(100vw - 40px);padding:15px 27px 15px 16px;margin:0 0 4px 12px;border:1px solid #d8dfc9;border-radius:19px 19px 19px 5px;background:#fffdf3;color:#516046;box-shadow:0 5px 20px #354b2512;font:13px/1.6 inherit;pointer-events:auto;animation:mascot-hello .5s ease-out}
    .mascot-bubble[hidden]{display:none}
    .mascot-bubble strong{display:block;font-size:11px;letter-spacing:.5px;color:#819567;margin-bottom:4px}
    .mascot-bubble p{margin:0;font-size:13px;line-height:1.6}
    .mascot-dismiss{position:absolute;right:6px;top:5px;border:0;background:none;color:#819567;font-size:18px;cursor:pointer;padding:3px 5px}
    body.dark-mode .mascot-bubble{background:#303c2d;color:#e3ebd8;border-color:#526348}
    body.dark-mode .mascot-bubble strong{color:#b5c99d}
    @keyframes mascot-breathe{50%{transform:translateY(-4px) rotate(-2deg)}}
    @keyframes mascot-sway{50%{transform:rotate(7deg)}}
    @keyframes mascot-blink{0%,43%,47%,100%{transform:scaleY(1)}45%{transform:scaleY(.1)}}
    @keyframes mascot-hello{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:600px){.mascot-button{width:66px;height:75px}.garden-mascot{left:8px;bottom:10px}.mascot-bubble{width:195px}}
    @media(prefers-reduced-motion:reduce){.garden-mascot *{animation:none!important;transition:none!important}}
  `;
  document.head.append(style);
  const mascot = document.createElement('aside');
  mascot.className = 'garden-mascot';
  mascot.hidden = true;
  mascot.setAttribute('aria-label', 'Brotinho, seu companheiro de jardim');
  mascot.innerHTML = `<div class="mascot-bubble" hidden><strong>BROTINHO</strong><button class="mascot-dismiss" aria-label="Fechar recado">×</button><p role="status" aria-live="polite"></p></div>
    <button class="mascot-button" aria-label="Conversar com o Brotinho">
    <svg viewBox="0 0 120 130" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="119" rx="33" ry="5" fill="#819567" opacity=".18"/>
      <g class="mascot-body mascot-sprout-form">
        <ellipse cx="40" cy="110" rx="14" ry="9" fill="#80976b"/><ellipse cx="80" cy="110" rx="14" ry="9" fill="#80976b"/>
        <path d="M29 67Q10 64 16 86Q22 98 31 85" fill="#a5bc89" stroke="#7f9867" stroke-width="2"/>
        <path class="mascot-wave" d="M91 67Q110 57 105 79Q100 92 89 85" fill="#a5bc89" stroke="#7f9867" stroke-width="2"/>
        <path d="M25 75C20 50 36 33 60 34C85 33 100 52 96 79Q102 111 62 114Q21 114 25 75" fill="#bbcf9e" stroke="#829b6e" stroke-width="2"/>
        <ellipse cx="60" cy="91" rx="24" ry="18" fill="#e3e9c5"/>
        <g class="mascot-leaves"><path d="M60 39Q57 24 63 14" stroke="#718b58" stroke-width="3" stroke-linecap="round"/><path d="M60 30Q34 33 34 12Q56 9 60 30" fill="#8eac72"/><path d="M61 24Q63 3 88 8Q85 30 61 24" fill="#afc68a"/><path d="M63 24L79 14M57 28L41 17" stroke="#718b58" stroke-linecap="round"/></g>
        <g class="mascot-eyes" fill="#46563b"><ellipse cx="44" cy="66" rx="3.5" ry="5"/><ellipse cx="76" cy="66" rx="3.5" ry="5"/></g>
        <ellipse cx="35" cy="76" rx="7" ry="4" fill="#d6ad93" opacity=".7"/><ellipse cx="85" cy="76" rx="7" ry="4" fill="#d6ad93" opacity=".7"/>
        <path d="M54 76Q60 83 66 76" stroke="#526342" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M56 94Q49 88 50 95Q51 99 60 103Q69 99 70 95Q71 88 64 94L60 97Z" fill="#a8bc89"/>
      </g>
      <g class="mascot-body mascot-orange-form">
        <defs><linearGradient id="orangeCozyBody" x1="35" y1="42" x2="88" y2="108" gradientUnits="userSpaceOnUse"><stop stop-color="#ffd66b"/><stop offset=".52" stop-color="#f6a33f"/><stop offset="1" stop-color="#df762e"/></linearGradient></defs>
        <ellipse cx="40" cy="109" rx="14" ry="8" fill="#c86d32"/><ellipse cx="80" cy="109" rx="14" ry="8" fill="#c86d32"/>
        <path d="M31 70Q13 67 18 87Q23 97 33 86" fill="#f0a04b" stroke="#bd682d" stroke-width="2"/>
        <path class="mascot-wave" d="M89 70Q107 61 103 82Q98 94 88 86" fill="#f0a04b" stroke="#bd682d" stroke-width="2"/>
        <path d="M25 75Q24 42 59 37Q96 40 96 76Q100 108 61 114Q22 112 25 75Z" fill="url(#orangeCozyBody)" stroke="#bd682d" stroke-width="2.3"/>
        <ellipse cx="48" cy="54" rx="13" ry="7" fill="#fff4b0" opacity=".34" transform="rotate(-28 48 54)"/>
        <path d="M59 39Q57 27 63 18" stroke="#6e813e" stroke-width="3" stroke-linecap="round"/>
        <g class="mascot-leaves"><path d="M60 31Q40 31 40 14Q58 13 60 31Z" fill="#8fa95a" stroke="#667c3e"/><path d="M61 27Q67 8 87 13Q82 31 61 27Z" fill="#aec56d" stroke="#667c3e"/><path d="M63 26L78 17M57 28L45 19" stroke="#667c3e" stroke-linecap="round"/></g>
        <g class="mascot-eyes" fill="#69432e"><ellipse cx="45" cy="70" rx="3.5" ry="5"/><ellipse cx="76" cy="70" rx="3.5" ry="5"/></g>
        <ellipse cx="36" cy="80" rx="7" ry="4" fill="#df6f68" opacity=".62"/><ellipse cx="85" cy="80" rx="7" ry="4" fill="#df6f68" opacity=".62"/>
        <path d="M53 80Q60 88 68 80" stroke="#70452d" stroke-width="2.7" stroke-linecap="round"/>
        <path d="M55 95Q48 89 49 97Q52 103 60 106Q69 102 71 96Q72 89 65 95L60 99Z" fill="#ffe19a" opacity=".8"/>
      </g>
      <g class="mascot-body mascot-apple-form"><ellipse cx="40" cy="110" rx="14" ry="8" fill="#b85058"/><ellipse cx="80" cy="110" rx="14" ry="8" fill="#b85058"/><path d="M25 75Q24 43 43 38Q52 31 60 38Q68 31 78 38Q96 44 96 76Q99 111 61 114Q22 111 25 75Z" fill="url(#appleCozyBody)" stroke="#a6444d" stroke-width="2.3"/><defs><linearGradient id="appleCozyBody" x1="34" y1="40" x2="87" y2="108" gradientUnits="userSpaceOnUse"><stop stop-color="#ffb0b1"/><stop offset=".46" stop-color="#ed6f78"/><stop offset="1" stop-color="#c83f50"/></linearGradient></defs><path d="M60 39Q59 24 67 16" stroke="#6e813e" stroke-width="3" stroke-linecap="round"/><path d="M65 25Q72 10 88 15Q82 29 65 27Z" fill="#9fbd72" stroke="#657c45"/><ellipse cx="48" cy="53" rx="12" ry="6" fill="#fff5dd" opacity=".38" transform="rotate(-28 48 53)"/><g class="mascot-eyes" fill="#633d42"><ellipse cx="44" cy="70" rx="3.5" ry="5"/><ellipse cx="76" cy="70" rx="3.5" ry="5"/></g><ellipse cx="35" cy="80" rx="7" ry="4" fill="#f39b9d"/><ellipse cx="85" cy="80" rx="7" ry="4" fill="#f39b9d"/><path d="M53 80Q60 88 67 80" stroke="#633d42" stroke-width="2.7" stroke-linecap="round"/></g>
      <g class="mascot-body mascot-strawberry-form"><ellipse cx="40" cy="110" rx="14" ry="8" fill="#6c2834"/><ellipse cx="80" cy="110" rx="14" ry="8" fill="#6c2834"/><path d="M24 61Q31 40 60 37Q89 40 96 61L84 104Q61 120 36 104Z" fill="url(#strawberryBody)" stroke="#541f2b" stroke-width="2.3"/><defs><linearGradient id="strawberryBody" x1="35" y1="40" x2="83" y2="108" gradientUnits="userSpaceOnUse"><stop stop-color="#ff646e"/><stop offset=".52" stop-color="#dd263f"/><stop offset="1" stop-color="#8c152d"/></linearGradient></defs><path d="M60 40Q59 27 64 18" stroke="#496033" stroke-width="3" stroke-linecap="round"/><path d="M62 31Q42 32 40 16Q55 13 62 28Q69 10 85 16Q81 31 62 31Z" fill="#71904e" stroke="#40552e"/><g fill="#1e1820"><ellipse cx="42" cy="66" rx="2" ry="4" transform="rotate(-25 42 66)"/><ellipse cx="57" cy="59" rx="2" ry="4" transform="rotate(-10 57 59)"/><ellipse cx="73" cy="62" rx="2" ry="4" transform="rotate(15 73 62)"/><ellipse cx="48" cy="82" rx="2" ry="4" transform="rotate(-20 48 82)"/><ellipse cx="67" cy="78" rx="2" ry="4" transform="rotate(18 67 78)"/><ellipse cx="78" cy="91" rx="2" ry="4"/></g><g class="mascot-eyes" fill="#211620"><ellipse cx="44" cy="72" rx="3.5" ry="5"/><ellipse cx="76" cy="72" rx="3.5" ry="5"/></g><path d="M54 82Q60 77 66 82" stroke="#211620" stroke-width="2.7" stroke-linecap="round"/></g><path class="mascot-affection" d="M96 31C84 23 87 14 93 16Q96 17 97 20Q102 13 106 18C111 24 101 30 96 33Z"/></svg></button>`;
  document.body.append(mascot);
  const bubble = mascot.querySelector('.mascot-bubble');
  const message = mascot.querySelector('p');
  let hideTimer = null;
  let mascotNotification = null;
  const close = () => {
    clearTimeout(hideTimer);
    hideTimer = null;
    bubble.hidden = true;
    message.textContent = '';
  };
  mascot.querySelector('.mascot-dismiss').onclick = close;
  function say(text) {
    clearTimeout(hideTimer);
    message.textContent = text;
    bubble.hidden = false;
    hideTimer = setTimeout(close, 9000);
  }
  function blocked() {
    return document.hidden || !!document.querySelector('.modal-overlay:not(.hidden), .help-overlay:not(.hidden), .mail-overlay:not(#shop-overlay):not(#inventory-overlay):not(#premium-overlay):not(#mascot-overlay):not(.hidden), .levelup-overlay:not(.hidden)');
  }
  window.mascotNotify = (text, duration = 2400) => {
    syncVisibility();
    const now = Date.now();
    const same = mascotNotification && mascotNotification.text === text && now < mascotNotification.until;
    mascotNotification = {
      text,
      count: same ? mascotNotification.count + 1 : 1,
      until: now + Math.max(4000, Number(duration) || 2400)
    };
    if (!blocked() && seUser && document.getElementById('login-overlay')?.classList.contains('hidden')) {
      const countText = mascotNotification.count > 1 ? ` ×${mascotNotification.count}` : '';
      say(`${text}${countText}`);
    }
  };
  let petReactionIndex = 0;
  const petButton = mascot.querySelector('.mascot-button');
  window.setMascotPremium = (active, animate = false) => {
    document.body.classList.toggle('mascot-premium-active', Boolean(active));
    mascot.setAttribute('aria-label', active ? 'Brotinho Premium, seu companheiro dourado' : 'Brotinho, seu companheiro de jardim');
    const mascotName = mascot.querySelector('.mascot-bubble strong');
    if (mascotName) mascotName.textContent = active ? 'BROTINHO PREMIUM' : 'BROTINHO';
    if (animate) {
      petButton.classList.remove('mascot-transform');
      void petButton.offsetWidth;
      petButton.classList.add('mascot-transform');
      setTimeout(() => petButton.classList.remove('mascot-transform'), 1250);
    }
  };
  window.setGardenMascot = (type, animate = false) => {
    const orange = type === 'orange';
    const apple = type === 'apple';
    const strawberry = type === 'strawberry';
    const premium = type === 'premium';
    document.body.classList.toggle('mascot-orange-active', orange);
    document.body.classList.toggle('mascot-apple-active', apple);
    document.body.classList.toggle('mascot-strawberry-active', strawberry);
    window.setMascotPremium(premium, premium && animate);
    const mascotName = mascot.querySelector('.mascot-bubble strong');
    if (mascotName) mascotName.textContent = orange ? 'LARANJINHA' : apple ? 'MAÇANZINHA' : strawberry ? 'MORANGUINHO' : premium ? 'BROTINHO PREMIUM' : 'BROTINHO';
    mascot.setAttribute('aria-label', orange ? 'Laranjinha, seu companheiro de jardim' : apple ? 'Maçanzinha, seu companheiro de jardim' : strawberry ? 'Moranguinho, seu companheiro de jardim' : premium ? 'Brotinho Premium, seu companheiro dourado' : 'Brotinho, seu companheiro de jardim');
    if ((orange || apple || strawberry) && animate) {
      petButton.classList.remove('mascot-orange-celebrate','mascot-apple-celebrate','mascot-strawberry-celebrate');
      void petButton.offsetWidth;
      petButton.classList.add(orange ? 'mascot-orange-celebrate' : apple ? 'mascot-apple-celebrate' : 'mascot-strawberry-celebrate');
      setTimeout(() => petButton.classList.remove('mascot-orange-celebrate','mascot-apple-celebrate','mascot-strawberry-celebrate'), 1350);
    }
  };
  window.setGardenMascot(document.body.classList.contains('mascot-orange-active') ? 'orange' : document.body.classList.contains('mascot-apple-active') ? 'apple' : document.body.classList.contains('mascot-strawberry-active') ? 'strawberry' : document.body.classList.contains('mascot-premium-active') ? 'premium' : null);
  let reactionTimer;
  petButton.onclick = () => {
    if (blocked()) return;
    clearTimeout(reactionTimer);
    petButton.classList.remove('mascot-hop', 'mascot-dance');
    void petButton.offsetWidth;
    const reaction = petReactionIndex++ % 2 === 0 ? 'mascot-hop' : 'mascot-dance';
    petButton.classList.add(reaction);
    reactionTimer = setTimeout(() => petButton.classList.remove(reaction), 1400);
  };
  function syncVisibility() {
    const loggedIn = !!seUser && document.getElementById('login-overlay')?.classList.contains('hidden');
    mascot.hidden = !loggedIn;
    mascot.classList.toggle('is-visible', loggedIn && !blocked());
    if (!loggedIn) { close(); return; }
    if (blocked()) { close(); return; }
  }
  document.addEventListener('visibilitychange', syncVisibility);
  window.addEventListener('focus', syncVisibility);
  window.addEventListener('garden-login-state-change', syncVisibility);
  window.addEventListener('profile-modal-state-change', syncVisibility);
  syncVisibility();
})();
