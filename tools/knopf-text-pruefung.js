// Prüfwerkzeug (Nutzer 26.10.2026: „ist der Text immer zentriert, überlappt da nirgendwo etwas?“). Im Spiel laden, dann
// `await KT_RUN()` – öffnet alle großen Fenster samt Reitern und das Infofenster, in beiden Aussehen, und meldet je Knopf:
// sichtbarer Inhalt (Text + gezeichnete Symbole, nicht das unsichtbare Emoji darin) zu nah am Rand / an den Nägeln bzw. Buckeln,
// nicht mittig (waagrecht > 3 px, senkrecht > 1,6 px zur Wolke bzw. zum Brett), mehrzeilig; und Knöpfe, die sich überdecken.
(() => {
  const KN = '.btn, #goal .task.ready .t-go, .look, .set-btn, .look-pick button, .arrange-btn, .arrange-mv, .store-row .keep, .sub, .style-chip, #goal .task-chips .chip, #visit-band .btn';
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]'); };
  // sichtbare Rechtecke: Textstücke (ohne das Emoji in i.wt) und Bilder/Symbole
  const visRects = (e, textOnly = false) => {
    const rs = [];
    const walk = n => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) {
          if (!c.textContent.trim()) continue;
          const p = c.parentElement, cs = getComputedStyle(p);
          if (parseFloat(cs.fontSize) < 1 || cs.color === 'rgba(0, 0, 0, 0)' || p.closest('i.wt, i.wi')) continue;
          const rg = document.createRange(); rg.selectNodeContents(c);
          rs.push(...[...rg.getClientRects()].filter(q => q.width > 0.5));
        } else if (c.nodeType === 1) {
          const cs = getComputedStyle(c);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          if (c.matches('i.wt, i.wi, canvas, img, svg') || (cs.backgroundImage !== 'none' && !c.children.length && !c.textContent.trim())) {
            const q = c.getBoundingClientRect(); if (q.width > 0.5 && !textOnly) rs.push(q);
          } else walk(c);
        }
      }
    };
    walk(e);
    return rs;
  };
  const check = (look, where) => {
    const els = [...document.querySelectorAll(KN)].filter(vis), bad = [];
    for (const e of els) {
      const rs = visRects(e);
      if (!rs.length) continue;
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      const t = { l: Math.min(...rs.map(q => q.left)), r: Math.max(...rs.map(q => q.right)), t: Math.min(...rs.map(q => q.top)), b: Math.max(...rs.map(q => q.bottom)) };
      const name = `${e.className.split(' ').filter(Boolean).join('.') || e.tagName} „${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 18)}“`;
      const lh = cs.lineHeight === 'normal' ? parseFloat(cs.fontSize) * 1.25 : parseFloat(cs.lineHeight);
      // Zeilen nur aus echtem Text (Symbole sitzen etwas versetzt): Zeilen, deren Oberkanten mehr als eine halbe Zeilenhöhe auseinanderliegen
      const tops = visRects(e, true).map(q => q.top).sort((a, b) => a - b);
      const lines = tops.reduce((n, y, i) => n + (i && y - tops[i - 1] > lh * 0.5 ? 1 : 0), tops.length ? 1 : 0);
      let top = r.top, bot = r.bottom, side, vpad;
      if (look === 'wolke') {
        const W = cs.borderImageWidth.split(' ').map(parseFloat), T = W[0], R = W[1] ?? T, B = W[2] ?? T, L = W[3] ?? R;
        const f = Math.min(1, r.height / (T + B), r.width / (L + R)), s = f * T / 15.5;
        bot = r.bottom - B * f * 3 / 18.5; side = 6 * s; vpad = 4 * s;
      } else {
        top += parseFloat(cs.borderTopWidth); bot -= parseFloat(cs.borderBottomWidth);
        side = e.matches('.btn, #goal .task.ready .t-go') ? 11 : 5; vpad = 2;
      }
      const gl = t.l - r.left, gr = r.right - t.r, cy = (t.t + t.b) / 2 - (top + bot) / 2, p = [];
      if (gl < side - 0.5 || gr < side - 0.5) p.push(`Rand L${gl.toFixed(1)} R${gr.toFixed(1)} (min ${side.toFixed(1)})`);
      if (t.t - top < vpad - 0.5 || bot - t.b < vpad - 0.5) p.push(`oben ${(t.t - top).toFixed(1)} unten ${(bot - t.b).toFixed(1)}`);
      if (Math.abs(cy) > 1.6) p.push(`senkrecht ${cy.toFixed(1)}`);
      if (Math.abs(gl - gr) > 3 && cs.justifyContent !== 'space-between' && cs.textAlign !== 'left') p.push(`waagrecht L${gl.toFixed(1)} R${gr.toFixed(1)}`);
      if (lines > 1) p.push(lines + ' Zeilen');
      if (p.length) bad.push([name, `${Math.round(r.width)}x${Math.round(r.height)}`, p.join('; ')]);
    }
    // Überdeckung nur innerhalb derselben Ebene (Fenster liegen übereinander, das ist gewollt)
    // sichtbarer Teil: geschnitten mit allen scrollenden/abschneidenden Vorfahren (weggescrollte Knöpfe überdecken nichts)
    const shown = e => {
      const q = e.getBoundingClientRect(); let l = q.left, t = q.top, r = q.right, b = q.bottom;
      for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') { const c = a.getBoundingClientRect(); l = Math.max(l, c.left); t = Math.max(t, c.top); r = Math.min(r, c.right); b = Math.min(b, c.bottom); }
      }
      return { left: l, top: t, right: r, bottom: b };
    };
    const ov = [], layer = e => e.closest('#modal-card, #panel, #goal, #sheet, #toolbar, #sel-bar, #visit-band');
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a0 = els[i], b0 = els[j];
      if (layer(a0) !== layer(b0) || a0.contains(b0) || b0.contains(a0)) continue;
      const a = shown(a0), b = shown(b0);
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 0.5 && h > 0.5) ov.push([a0.textContent.trim().slice(0, 14), b0.textContent.trim().slice(0, 14), `${w.toFixed(1)}x${h.toFixed(1)}`]);
    }
    return { where, n: els.length, bad, ov };
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const OPENERS = [['Rathaus', () => openTownHall('overview')], ['Forschung', () => openResearch()], ['Einstellungen', () => showSettings()],
    ['Du', () => openYou('figur')], ['Netz', () => openNet()], ['Hilfe', () => openHelp()], ['Album', () => openAlbum()], ['Basar', () => openBasar()],
    ['Lexikon', () => openLexikon()], ['Tagebuch', () => openDiary()], ['Freischalten', () => openUnlocks()], ['Tipps', () => openTipBook()],
    ['Sternstaub', () => openStardust()], ['Wünsche', () => openWishPicker()]];
  // Abstand Knopf (samt Kante) ↔ Papierrand (Nutzer 26.10.2026: „in der Holzansicht sind die Buttons unten in der Hecke“).
  // Papier: Hecke = Form + 11 px Büsche, Wolke = Form; Form = Element (Platte per ::before) bzw. Element − pad (Platte als Hintergrund)
  const paper = (host, look) => {
    const r = host.getBoundingClientRect(), inset = host.classList.contains('slab-in'), L = SLAB_STYLE[look].paper;
    const p0 = inset ? L.pad : 0, hb = look === 'hecke' ? 11 : 2;
    return { l: r.left + p0 + hb, t: r.top + p0 + hb, r: r.right - p0 - hb, b: r.bottom - p0 - (inset ? L.depth : 0) - hb };
  };
  const edge = look => {
    const g = {};
    for (const host of document.querySelectorAll('#goal, #panel, #modal-card, #sheet')) {
      if (!vis(host)) continue;
      const s = paper(host, look);
      for (const e of host.querySelectorAll('.btn, .look, .set-btn, .chip, .t-go, .style-chip, .arrange-btn, .sub, .tool, .sw, input')) {
        if (!vis(e)) continue;
        const q = e.getBoundingClientRect(), cs = getComputedStyle(e);
        let t = q.top, b = q.bottom, shown = true;
        const sh = cs.boxShadow !== 'none' && cs.boxShadow.match(/(-?\d+(?:\.\d+)?)px (-?\d+(?:\.\d+)?)px/);
        if (sh) b += Math.max(0, +sh[2]);
        for (let a = e.parentElement; a && a !== host; a = a.parentElement) {
          const c = getComputedStyle(a);
          if (c.overflowY !== 'visible' || c.overflowX !== 'visible') { const r = a.getBoundingClientRect(); if (b < r.top || t > r.bottom) shown = false; t = Math.max(t, r.top); b = Math.min(b, r.bottom); }
        }
        if (!shown || b <= t) continue;
        const k = host.id, m = g[k] ||= { l: 99, t: 99, r: 99, b: 99 };
        m.l = Math.min(m.l, q.left - s.l); m.r = Math.min(m.r, s.r - q.right); m.t = Math.min(m.t, t - s.t); m.b = Math.min(m.b, s.b - b);
      }
    }
    for (const k in g) for (const s in g[k]) g[k][s] = +g[k][s].toFixed(1);
    return g;
  };
  // alle Fenster, oben und unten gescrollt; meldet je Fenster den kleinsten Abstand je Seite
  window.KT_EDGE = async (info = [-20, 47]) => {
    const res = {}, note = (key, g) => { for (const [h, m] of Object.entries(g)) { const k = `${key} ${h}`; const o = res[k] ||= { l: 99, t: 99, r: 99, b: 99 }; for (const s in m) o[s] = Math.min(o[s], m[s]); } };
    const scrollAll = async y => { for (const x of document.querySelectorAll('#modal-card, #modal-card *, #panel .p-scroll, #sheet .tools')) if (x.scrollHeight > x.clientHeight + 4) x.scrollTop = y; await sleep(120); };
    for (const look of ['hecke', 'wolke']) {
      setUiLook(look); closeModal(); closePanel(); await sleep(250);
      note(look, edge(look));
      openInfo(...info); await sleep(300);
      for (const y of [0, 99999]) { await scrollAll(y); note(look, edge(look)); }
      closePanel();
      for (const [name, f] of OPENERS) {
        try { closeModal(); f(); await sleep(250); } catch (e) { continue; }
        for (const y of [0, 99999]) { await scrollAll(y); note(`${look} ${name}`, edge(look)); }
      }
      closeModal();
    }
    return Object.entries(res).filter(([, m]) => Object.values(m).some(v => v < 6)).map(([k, m]) => `${k}: ${JSON.stringify(m)}`);
  };
  window.KT_CHECK = check;
  window.KT_RUN = async (info = [-20, 47], looks = ['hecke', 'wolke']) => {
    const out = [];
    for (const look of looks) {
      setUiLook(look); closeModal(); closePanel();
      openInfo(...info); await sleep(300);
      const sc = document.querySelector('#panel .p-scroll');
      for (let y = 0; sc && y < sc.scrollHeight; y += 260) { sc.scrollTop = y; await sleep(80); out.push([look, check(look, 'Infofenster')]); }
      closePanel();
      for (const [name, f] of OPENERS) {
        try { closeModal(); f(); await sleep(250); } catch (e) { out.push([look, { where: name, n: 0, bad: [['FEHLER', '', e.message]], ov: [] }]); continue; }
        out.push([look, check(look, name)]);
        for (const t of [...document.querySelectorAll('#modal-card [data-tab]')].map(b => b.dataset.tab)) {
          const b = document.querySelector(`#modal-card [data-tab="${t}"]`); if (!b) continue;
          b.click(); await sleep(200); out.push([look, check(look, `${name}/${t}`)]);
        }
      }
      closeModal();
    }
    const agg = {}, ovs = {};
    let n = 0;
    for (const [l, a] of out) {
      n += a.n;
      for (const [nm, sz, p] of a.bad) { const k = `${l} | ${a.where.split('/')[0]} | ${nm} ${sz} | ${p}`; agg[k] = (agg[k] || 0) + 1; }
      for (const o of a.ov) { const k = `${l} | ${a.where} | ${o.join(' ↔ ')}`; ovs[k] = 1; }
    }
    return { n, text: Object.keys(agg), overlap: Object.keys(ovs) };
  };
})();
