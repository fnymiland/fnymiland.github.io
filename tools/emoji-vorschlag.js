// Entwurf (Nutzer 26.10.2026: „da sind noch sauviele Emojis drin, z. B. bei ‚Das ist neu‘ Sterne, Rathaus usw. … wäge mal ab, was alles
// weg kann“). Im Spiel laden, dann EV_APPLY(true) / EV_APPLY(false). Blendet nur aus, ändert keine Texte.
// Weg: Bildchen, die nur schmücken – vor Überschriften, auf Reitern, vor dem Text eines Knopfs, am Anfang einer Zeile/eines Absatzes,
//      vor einem Wort, das ohnehin dasteht („Das 📖 Tagebuch“), und echte System-Emojis (💬 🪧 🔢 …).
// Bleibt: Bildchen, die etwas zeigen – an Zahlen (Rohstoffe, Einwohner), Gebäude/Tiere/Dinge in Listen, Bildknöpfe ohne Text,
//      und ein Bildchen, das selbst das Wort ist („unter 🌐.“ – das würde später in Worte umgeschrieben).
(() => {
  const EMO = /[\u{1F000}-\u{1FAFF}\u2795\u2B50]\uFE0F?\s?/gu;                  // nur bunte Emojis; ♥ ✓ ✦ sind Schriftzeichen und bleiben
  const EMO_HAS = new RegExp(EMO.source, 'u');
  const KEEP = 'span, .chip, .stat, .res, .cost, .lx-ic, .ic, .wi, .alb, .wish-ic';      // Zahl + Einheit, Dinge in Listen
  const textAfter = i => { let n = i.nextSibling, t = ''; while (n && t.length < 3) { t += n.textContent || ''; n = n.nextSibling; } return t; };
  const decide = i => {
    const p = i.parentElement;
    if (!p || p.closest(KEEP) && !p.closest('h2, h3, h4, [data-tab], .btn, .look')) return false;
    const rest = p.textContent.replace(i.textContent, '').trim();
    if (!rest) return false;                                                   // Bildknopf ohne Text
    if (p.matches('h2, h3, h4, .label, [data-tab], .btn, .look, summary')) return true;
    const after = textAfter(i).trimStart();
    return /^[\p{L}„(]/u.test(after);                                         // vor einem Wort: weg; vor Zahl: Einheit; vor Satzzeichen: ist selbst das Wort
  };
  let on = false, mo = null;
  const run = () => {
    for (const root of document.querySelectorAll('#modal-card, #panel, #goal, #toast')) {
      for (const i of root.querySelectorAll('i.wt')) i.classList.toggle('ev-weg', on && decide(i));
      if (on) {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; const hit = [];
        while ((n = w.nextNode())) if (!n.parentElement.closest('i.wt, i.wi') && EMO_HAS.test(n.nodeValue)) hit.push(n);
        for (const t of hit) t.nodeValue = t.nodeValue.replace(EMO, '');
      }
    }
  };
  window.EV_APPLY = flag => {
    on = !!flag;
    let st = document.getElementById('ev-style');
    if (!st) { st = document.createElement('style'); st.id = 'ev-style'; st.textContent = 'i.wt.ev-weg { display: none !important; }'; document.head.append(st); }
    if (mo) { mo.disconnect(); mo = null; }
    run();
    if (on) { mo = new MutationObserver(() => { mo.disconnect(); run(); for (const id of ['modal-card', 'panel', 'goal', 'toast']) { const el = document.getElementById(id); if (el) mo.observe(el, { childList: true, subtree: true }); } });
      for (const id of ['modal-card', 'panel', 'goal', 'toast']) { const el = document.getElementById(id); if (el) mo.observe(el, { childList: true, subtree: true }); } }
    return on ? 'Vorschlag an' : 'aus';
  };
})();
