// Entwurf (Nutzer 26.10.2026: „die Leiste oben ist unübersichtlich und vollgepackt, die zwei Symbole am Schluss sehen aus wie Dinge im
// Spiel – ein Hintergrund wäre nicht schlecht, gib mir mehrere Konzepte“). Im Spiel laden, dann LK_APPLY('A'…'D'); LK_APPLY(null) stellt
// die Leiste wieder her. Ordnet die echten Knöpfe vorübergehend in Gruppen (Ort · Werte · Knöpfe), ändert nichts Gespeichertes.
//   A Zwei Gruppen   – Werte gemeinsam auf einem Brett bzw. einer Wolke, Knöpfe rechts als runde Scheiben
//   B Täfelchen      – jeder Wert auf eigenem Täfelchen, Knöpfe als Kacheln mit Wort darunter
//   C Aufgeräumt     – nur Taler, Einwohner, Ideen; rechts nur „Du“ und „Menü“ (Lager, Sternstaub, Online wandern ins Menü)
//   D Leiste wie unten – durchgehendes Beet bzw. Wolke wie die Bauleiste, Knöpfe mit Wort darunter
(() => {
  const $ = id => document.getElementById(id);
  const GROUPS = [['lk-info', ['town-btn']], ['lk-vals', ['money-btn', 'pop-btn', 'sci-btn', 'sd-btn']], ['lk-act', ['store-btn', 'you-btn', 'net-btn', 'menu-btn']]];
  const LABELS = { 'store-btn': 'Lager', 'you-btn': 'Du', 'net-btn': 'Freunde', 'menu-btn': 'Menü' };
  let order = null;
  const restore = () => {
    const hud = $('hud');
    if (order) for (const el of order) hud.append(el);
    for (const w of hud.querySelectorAll('.lk-grp')) w.remove();
    for (const l of hud.querySelectorAll('.lk-lab')) l.remove();
    for (const id of ['sd-btn', 'store-btn', 'net-btn']) $(id).style.removeProperty('display');
    if (hud.dataset.slab) { hud.classList.remove('slab'); delete hud.dataset.slab; delete hud.dataset.slabKey; for (const p of ['--slab', '--slab-pad', '--slab-depth']) hud.style.removeProperty(p); if (typeof SLABS !== 'undefined') SLABS.delete(hud); if (typeof slabObs !== 'undefined' && slabObs) slabObs.unobserve(hud); }
    document.body.classList.remove('lk', 'lk-A', 'lk-B', 'lk-C', 'lk-D');
    order = null;
  };
  const css = `
  body.lk #hud { gap: 12px; align-items: center; flex-wrap: nowrap; }
  body.lk #hud .pill b { white-space: nowrap; }
  body.lk #hud .lk-grp { display: flex; align-items: center; pointer-events: none; }
  body.lk #hud .lk-act { margin-left: auto; gap: 10px; }
  body.lk.look-hecke { --lk-tx: #5a3d24; --lk-plate: #ecd4a3; --lk-edge: #8a5a34; }
  body.lk.look-wolke { --lk-tx: #3b4763; --lk-plate: #ffffff; --lk-edge: #9fb3d6; }
  /* Schrift auf Platten: dunkel statt weiß mit Umriss */
  body.lk:not(.lk-D) #hud .pill, body.lk:not(.lk-D) #hud .pill b, body.lk:not(.lk-D) #hud .pill small, body.lk:not(.lk-D) #town-name, body.lk:not(.lk-D) #town-btn .tod { color: var(--lk-tx); text-shadow: none; }
  body.lk.look-wolke.lk-D #hud .pill, body.lk.look-wolke.lk-D #hud .pill b, body.lk.look-wolke.lk-D #hud .pill small, body.lk.look-wolke.lk-D #town-name, body.lk.look-wolke.lk-D #town-btn .tod { color: var(--lk-tx); text-shadow: none; }
  /* Platte: Hecke = helles Brett mit Maserung, Wolken = weiße Wolke */
  body.lk.look-hecke #hud .lk-plate { background: var(--grain), var(--lk-plate); border: 1.5px solid var(--lk-edge); border-radius: 6px; box-shadow: 0 3px 0 var(--lk-edge), 0 7px 12px rgba(40, 30, 20, .2); }
  body.lk.look-wolke #hud .lk-plate { border: 0 solid transparent; border-image: var(--lk-cloud) 32 32 38 32 fill / 16px 16px 19px 16px round;
    background: linear-gradient(#fff, #fff) 9px 9px / calc(100% - 18px) calc(100% - 21px) no-repeat; filter: drop-shadow(0 5px 7px rgba(50, 70, 110, .2)); }
  /* runde Scheibe für Knöpfe */
  body.lk.look-hecke #hud .lk-disc { border-radius: 50%; background: radial-gradient(circle at 50% 35%, #f3dcae, #d7a868 72%); border: 2px solid var(--lk-edge); box-shadow: 0 3px 0 var(--lk-edge), 0 6px 10px rgba(40, 30, 20, .22); }
  body.lk.look-wolke #hud .lk-disc { border-radius: 50%; background: radial-gradient(circle at 50% 35%, #ffffff, #e9f0fa 72%); border: 2.5px solid #a9bde0; box-shadow: 0 3px 0 #a9bde0, 0 6px 10px rgba(50, 70, 110, .2); }

  /* ---------- A Zwei Gruppen ---------- */
  body.lk-A #hud .lk-info { padding: 7px 14px 8px; }
  body.lk-A #hud .lk-vals { padding: 6px 16px 7px; gap: 0; }
  body.lk-A #hud .lk-vals .pill { padding: 0 10px; }
  body.lk-A #hud .lk-vals .pill + .pill { border-left: 1.5px dotted color-mix(in srgb, var(--lk-tx) 35%, transparent); }
  body.lk-A #hud .lk-act .pill { width: 46px; height: 46px; padding: 0; justify-content: center; align-items: center; }
  body.lk-A #hud .lk-act .pill i.wi, body.lk-A #hud .lk-act #you-face { margin: 0; width: 31px; height: 29px; }

  /* ---------- B Täfelchen ---------- */
  body.lk-B #hud .lk-info { padding: 7px 14px 8px; }
  body.lk-B #hud .lk-vals { gap: 14px; }
  body.lk-B #hud .lk-vals .pill { padding: 5px 14px 6px 8px; }
  body.lk-B #hud .lk-vals .pill i.wi { margin: -6px 0 -6px -18px; }
  body.lk-B #hud .lk-act { gap: 8px; }
  body.lk-B #hud .lk-act .pill { flex-direction: column; align-items: center; justify-content: center; width: 58px; height: 58px; padding: 3px 0 4px; gap: 0; border-radius: 10px; }
  body.lk-B.look-hecke #hud .lk-act .pill { border-radius: 6px; }
  body.lk-B #hud .lk-act .pill i.wi, body.lk-B #hud .lk-act #you-face { margin: 0; width: 34px; height: 30px; }
  body.lk-B #hud .lk-lab, body.lk-D #hud .lk-lab { font: 800 11.5px/1.1 'Alegreya Sans', Nunito, sans-serif; letter-spacing: .02em; }

  /* ---------- C Aufgeräumt ---------- */
  body.lk-C #hud .lk-info { padding: 7px 14px 8px; }
  body.lk-C #hud .lk-vals { padding: 6px 18px 7px; gap: 22px; margin-left: auto; margin-right: auto; }
  body.lk-C #hud .lk-act { margin-left: 0; }
  body.lk-C #hud .lk-act .pill { width: 52px; height: 52px; padding: 0; justify-content: center; align-items: center; }
  body.lk-C #hud .lk-act .pill i.wi, body.lk-C #hud .lk-act #you-face { margin: 0; width: 36px; height: 34px; }

  /* ---------- D Leiste wie unten ---------- */
  body.lk-D #hud { padding: 10px 16px 9px; gap: 16px; }
  body.lk-D #hud .lk-vals { gap: 16px; }
  body.lk-D #hud .lk-act { gap: 12px; }
  body.lk-D #hud .lk-act .pill { flex-direction: column; align-items: center; gap: 1px; padding: 0; }
  body.lk-D #hud .lk-act .pill i.wi, body.lk-D #hud .lk-act #you-face { margin: 0; width: 34px; height: 30px; }
  body.lk-D.look-hecke #hud .lk-lab { color: #fff7e6; text-shadow: var(--ol); }
  body.lk-D #hud .lk-act { padding-left: 16px; border-left: 2px dotted rgba(255, 255, 255, .45); }
  body.lk-D.look-wolke #hud .lk-act { border-left-color: rgba(90, 110, 150, .3); }

  /* Handy: kleiner, Gruppen bleiben */
  @media (max-width: 600px) {
    body.lk #hud { gap: 6px; }
    body.lk-A #hud .lk-vals .pill, body.lk-C #hud .lk-vals .pill { padding: 0 6px; }
    body.lk-A #hud .lk-vals, body.lk-C #hud .lk-vals { padding: 4px 6px 5px; gap: 0; }
    body.lk-C #hud .lk-vals { gap: 6px; }
    body.lk-A #hud .lk-act, body.lk-C #hud .lk-act { gap: 5px; }
    body.lk-A #hud .lk-act .pill, body.lk-C #hud .lk-act .pill { width: 36px; height: 36px; }
    body.lk-A #hud .lk-act .pill i.wi, body.lk-A #hud .lk-act #you-face, body.lk-C #hud .lk-act .pill i.wi, body.lk-C #hud .lk-act #you-face { width: 24px; height: 23px; }
    body.lk-B #hud .lk-vals { gap: 5px; } body.lk-B #hud .lk-vals .pill { padding: 3px 6px 4px 4px; } body.lk-B #hud .lk-vals .pill i.wi { margin: -3px 0 -3px -8px; }
    body.lk-B #hud .lk-act { gap: 4px; } body.lk-B #hud .lk-act .pill { width: 40px; height: 42px; }
    body.lk-B #hud .lk-act .pill i.wi, body.lk-B #hud .lk-act #you-face, body.lk-D #hud .lk-act .pill i.wi, body.lk-D #hud .lk-act #you-face { width: 22px; height: 20px; }
    body.lk-B #hud .lk-lab, body.lk-D #hud .lk-lab { font-size: 9.5px; }
    body.lk-D #hud { padding: 8px 10px 7px; gap: 8px; } body.lk-D #hud .lk-vals { gap: 7px; } body.lk-D #hud .lk-act { gap: 6px; padding-left: 7px; }
    body.lk #hud .lk-info { padding: 4px 7px 5px; }
    /* A, B: Knöpfe rechts untereinander (eine Zeile reicht auf dem Handy nicht für Ort, Werte und vier Knöpfe) */
    body.lk-A #hud .lk-act, body.lk-B #hud .lk-act { flex-direction: column; position: absolute; right: 0; top: calc(100% + 10px); gap: 6px; }
    body.lk-A #hud .lk-act .pill { width: 38px; height: 38px; }
    /* D: zweite Zeile im Beet bzw. in der Wolke für die Knöpfe mit Wort */
    body.lk-D #hud { flex-wrap: wrap; row-gap: 4px; }
    body.lk-D #hud .lk-act { width: 100%; justify-content: space-around; margin-left: 0; padding: 4px 0 0; border-left: 0; border-top: 2px dotted rgba(255, 255, 255, .45); }
    body.lk-D.look-wolke #hud .lk-act { border-top-color: rgba(90, 110, 150, .3); }
    body.lk-D #hud .lk-act .pill i.wi, body.lk-D #hud .lk-act #you-face { width: 26px; height: 24px; }
    body.lk-D #hud .lk-act .pill { margin: 0; flex: 1 1 0; }
  }`;
  window.LK_APPLY = opt => {
    restore();
    let st = $('lk-style');
    if (!opt) { if (st) st.textContent = ''; if (typeof updateHud === 'function') updateHud(); return; }
    if (!st) { st = document.createElement('style'); st.id = 'lk-style'; document.head.append(st); }
    st.textContent = css;
    if (typeof cloudKnobImage === 'function') document.body.style.setProperty('--lk-cloud', `url(${cloudKnobImage('#ffffff', '#c7d4e8', '#ffffff')})`);
    const hud = $('hud');
    order = [...hud.children];
    for (const [cls, ids] of GROUPS) {
      const g = document.createElement('div'); g.className = `lk-grp ${cls}`;
      for (const id of ids) g.append($(id));
      hud.append(g);
    }
    hud.append(...order.filter(el => !el.closest('.lk-grp')));
    document.body.classList.add('lk', 'lk-' + opt);
    const plate = el => el.classList.add('lk-plate');
    if (opt === 'A') { plate(hud.querySelector('.lk-info')); plate(hud.querySelector('.lk-vals')); for (const b of hud.querySelectorAll('.lk-act .pill')) b.classList.add('lk-disc'); }
    if (opt === 'B') { plate(hud.querySelector('.lk-info')); for (const b of hud.querySelectorAll('.lk-vals .pill, .lk-act .pill')) plate(b); }
    if (opt === 'C') { plate(hud.querySelector('.lk-info')); plate(hud.querySelector('.lk-vals')); for (const id of ['sd-btn', 'store-btn', 'net-btn']) $(id).style.display = 'none'; for (const b of hud.querySelectorAll('.lk-act .pill')) b.classList.add('lk-disc'); }
    if (opt === 'B' || opt === 'D') for (const [id, t] of Object.entries(LABELS)) { const s = document.createElement('span'); s.className = 'lk-lab'; s.textContent = t; $(id).append(s); }
    if (opt === 'D' && typeof lookSlab === 'function') lookSlab(hud, 'bar');
  };
  window.LK_CLEAN = () => {                                   // Klassen der Platten an den Knöpfen wieder weg
    for (const el of document.querySelectorAll('#hud .lk-plate, #hud .lk-disc')) el.classList.remove('lk-plate', 'lk-disc');
  };
  const prev = window.LK_APPLY;
  window.LK_APPLY = opt => { LK_CLEAN(); prev(opt); };
})();
