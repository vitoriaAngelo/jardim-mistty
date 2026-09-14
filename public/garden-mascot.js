(() => {
  const style = document.createElement('style');
  style.textContent = `
    .garden-mascot{position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));z-index:85;display:flex;flex-direction:column;align-items:flex-start;pointer-events:none;opacity:0;visibility:hidden;transform:translateY(12px) scale(.94);transform-origin:left bottom;transition:opacity .32s ease,transform .42s cubic-bezier(.22,1,.36,1),visibility 0s linear .42s}
    .garden-mascot[hidden]{display:none}
    .garden-mascot.is-visible{opacity:1;visibility:visible;transform:translateY(0) scale(1);pointer-events:none;transition-delay:0s}
    .mascot-button{width:96px;height:106px;padding:0;border:0;background:none;cursor:pointer;pointer-events:auto;filter:drop-shadow(0 5px 3px #354b2520)}
    .mascot-button:focus-visible{outline:2px solid #829968;outline-offset:3px;border-radius:40px}
    .garden-mascot .mascot-button,.garden-mascot .mascot-button *{cursor:var(--cozy-click-cursor,pointer)!important}
    .mascot-button>svg{overflow:visible}
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
      <g class="mascot-body">
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
      </g><path class="mascot-affection" d="M96 31C84 23 87 14 93 16Q96 17 97 20Q102 13 106 18C111 24 101 30 96 33Z"/></svg></button>`;
  document.body.append(mascot);
  const bubble = mascot.querySelector('.mascot-bubble');
  const message = mascot.querySelector('p');
  const minute = 60000;
  const cooldowns = new Map();
  let greeted = false, nextMessage = 0, hideAt = 0, startedAt = 0, lastMessageAt = 0, warnedDayKey = '';
  const close = () => { bubble.hidden = true; message.textContent = ''; };
  mascot.querySelector('.mascot-dismiss').onclick = close;
  function say(text, key, cooldown = 10 * minute) {
    const now = Date.now();
    lastMessageAt = now;
    message.textContent = text;
    bubble.hidden = false;
    hideAt = now + 9000;
    nextMessage = now + 90000;
    cooldowns.set(key, now + cooldown);
  }
  function blocked() {
    return document.hidden || !!document.querySelector('.modal-overlay:not(.hidden), .profile-overlay:not(.hidden), .help-overlay:not(.hidden), .mail-overlay:not(.hidden), .levelup-overlay:not(.hidden)');
  }
  const petMessages = [
    'Um carinho e uma pausa… crescer também leva tempo. Que bom ter você aqui! 🌿',
    'Se eu pudesse, te dava um abraço de folhinhas. Sinta-se abraçado! 💚',
    'Seu jardim fica mais bonito quando você aparece. Vamos cuidar dele juntinhos? 🌱',
    'Pausa para respirar… até as florzinhas crescem no seu próprio ritmo. 🌼'
  ];
  let petMessageIndex = 0;
  const petButton = mascot.querySelector('.mascot-button');
  let reactionTimer;
  petButton.onclick = () => {
    if (blocked()) return;
    clearTimeout(reactionTimer);
    petButton.classList.remove('mascot-hop', 'mascot-dance');
    void petButton.offsetWidth;
    const reaction = petMessageIndex % 2 === 0 ? 'mascot-hop' : 'mascot-dance';
    petButton.classList.add(reaction);
    reactionTimer = setTimeout(() => petButton.classList.remove(reaction), 1400);
    say(petMessages[petMessageIndex++ % petMessages.length], 'pet');
  };
  function tick() {
    const now = Date.now();
    const loggedIn = !!seUser && document.getElementById('login-overlay')?.classList.contains('hidden');
    mascot.hidden = !loggedIn;
    mascot.classList.toggle('is-visible', loggedIn && !blocked());
    if (!loggedIn) { greeted = false; startedAt = 0; close(); return; }
    if (now >= hideAt) close();
    if (blocked()) { close(); return; }
    if (!greeted) {
      greeted = true;
      startedAt = now;
      cooldowns.clear();
      say('Oi! Eu sou o Brotinho 🌱 Vou cuidar deste cantinho com você. Vamos cultivar coisas bonitas?', 'hello');
      return;
    }
    const dayRemaining = typeof seasonDayEndsAt === 'number' ? seasonDayEndsAt - now : Infinity;
    const dayKey = `${G.seasonIdx}:${G.seasonDay}:${seasonDayEndsAt}`;
    if (dayRemaining > 0 && dayRemaining <= minute && warnedDayKey !== dayKey && now - lastMessageAt >= 20000) {
      warnedDayKey = dayKey;
      say('O dia está quase acabando… falta menos de um minutinho! Aproveite para terminar seus cuidados. 🌙', `day-end-${dayKey}`, 0);
      return;
    }
    if (now < nextMessage) return;
    const plots = G.plots.slice(0, G.unlockedPlots);
    const plants = plots.filter(p => p && !p.outOfSeason);
    const ready = plants.some(p => p.growCount >= effectiveMaxGrow(p.type));
    const thirsty = plants.some(p => p.waterCount < effectiveMaxWater(p.type) && p.growCount < effectiveMaxGrow(p.type));
    const almost = plants.some(p => p.waterCount >= effectiveMaxWater(p.type) && p.growCount < effectiveMaxGrow(p.type) && p.growCount / effectiveMaxGrow(p.type) >= .75);
    const pendingPoints = lastKnownSEPoints !== null && G.pts !== lastKnownSEPoints;
    const tips = [
      ['season', G.seasonDay >= SEASON_DAYS_LEN - 1, `Sente essa brisinha? ${SEASONS[(G.seasonIdx + 1) % SEASONS.length].name} está chegando. Vamos preparar o jardim? 🍃`, 25 * minute],
      ['water', thirsty, 'Tem plantinha com sede por aqui… uma reguinha e ela volta a crescer feliz! 💧', 8 * minute],
      ['ready', ready, 'Olha só: já tem plantinha pronta! Sua colheita está esperando um carinho. 🧺', 10 * minute],
      ['almost', almost, 'Suas plantinhas estão quase prontas… falta só um pouquinho para colher! 🌼', 10 * minute],
      ['plant', plots.some(p => !p), 'Tem um pedacinho de terra esperando uma sementinha. Que tal plantar algo bonito? 🌱', 12 * minute],
      ['sync', pendingPoints && now - startedAt >= 5 * minute, 'Quando puder, toque em sincronizar os pontos para atualizar seu saldo da live. ✨', 15 * minute]
    ];
    // Pick the least recently mentioned eligible tip; never queue stale messages.
    const tip = tips.filter(([key, valid]) => valid && now >= (cooldowns.get(key) || 0))
      .sort((a, b) => (cooldowns.get(a[0]) || 0) - (cooldowns.get(b[0]) || 0))[0];
    if (tip) say(tip[2], tip[0], tip[3]);
  }
  setInterval(tick, 2000);
  document.addEventListener('visibilitychange', tick);
  tick();
})();
