// Basar-Durchsicht (Nutzer 27.10.2026: „alle Items aus dem Sternenbasar genauer ansehen, da gibt es noch Dinge, die mir nicht gefallen“).
// Läuft im Spiel (Testwelt ?welt=neu, speichert nichts): räumt die Insel leer und stellt jedes Basar-Stück einzeln auf die Wiese,
// in der Reihenfolge der Sammlungen, die Monumente darunter. Liefert die Plätze { id: [x, y, w, h] } für tools/basar-schau.html.
window.basarSchau = function basarSchau() {
  for (const m of ['tiles', 'decos', 'edges', 'roofs', 'tunnels', 'hills']) if (state[m] instanceof Map) state[m].clear();
  for (const k of state.claimed) { const [x, y] = k.split(',').map(Number); if (terrainAt(x, y) !== 'water') state.terra.set(k, 'grass'); }
  state.sdSeen = true;                                             // kein „Sternstaub ist da“ (Testwelt ohne Nachzahlung-Stand)
  if (!document.getElementById('basar-schau-css')) {               // nur die Welt zeigen: Ziel, Bauleiste, Meldungen und Karte ausblenden
    const st = document.createElement('style'); st.id = 'basar-schau-css';
    st.textContent = '#goal, #toolbar, #toast, #achv, #minimap { display: none !important; }';
    document.head.append(st);
  }
  state.money = 1e12; for (const r of Object.keys(state.res)) state.res[r] = 1e6;
  state.sdItems = new Set(SD_SHOP.map(s => s.id));
  recalc();
  const land = (x, y) => terrainAt(x, y) !== 'water' && !isBeach(x, y) && ownedTile(x, y);
  const free = (x, y, n) => { for (let j = -1; j <= n; j++) for (let i = -1; i <= n; i++) if (!land(x + i, y + j)) return false; return true; };
  const xs = [...state.claimed].map(k => +k.split(',')[0]), ys = [...state.claimed].map(k => +k.split(',')[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const order = SD_SAMMLUNGEN.map(s => s[0]);
  const normal = SD_SHOP.filter(s => !ITEMS[s.id].mon).sort((a, b) => order.indexOf(sdSammlung(a.id)) - order.indexOf(sdSammlung(b.id)));
  const mons = SD_SHOP.filter(s => ITEMS[s.id].mon);
  const pos = {}, errs = [];
  const spots = []; for (let y = y0 + 1; y < y1; y += 2) for (let x = x0 + 1; x < x1; x += 2) if (free(x, y, 1)) spots.push([x, y]);
  normal.forEach((s, i) => {
    const [x, y] = spots[i], small = ITEMS[s.id].small;
    if (!(small ? buildSmall(s.id, x, y, 0) : build(s.id, x, y, true))) errs.push(s.id);
    pos[s.id] = [x, y, 1, 1];
  });
  const below = spots[normal.length - 1][1] + 3;
  const mspots = []; for (let y = below; y < y1; y += 4) for (let x = x0 + 1; x < x1; x += 4) if (free(x, y, 2)) mspots.push([x, y]);
  mons.forEach((s, i) => {
    const p = mspots[i]; if (!p) { errs.push(s.id); return; }
    if (!build(s.id, p[0], p[1], true)) errs.push(s.id);
    pos[s.id] = [p[0], p[1], 2, 2];
  });
  for (const t of state.tiles.values()) if (ITEMS[t.b] && ITEMS[t.b].mon && t.phase != null) t.phase = monPhases(t).length;   // fertig gebaut zeigen
  recalc(); groundVersion++;
  const list = [...normal, ...mons].map(s => s.id);
  const items = list.map((id, i) => {
    const d = ITEMS[id], m = typeof MONUMENTS !== 'undefined' && MONUMENTS[id];
    let pic = ''; try { pic = thumb(id, 1, null, 3).toDataURL(); } catch (e) { pic = ''; }
    return { id, nr: i + 1, name: d.name, smlg: d.mon ? 'Monumente' : sdSammlung(id), tag: sdShopItem(id).rare ? 'selten' : m && m.wahr ? 'Wahrzeichen' : '', pic };
  });
  closeModal();
  return { pos, errs, items };
};
// Für die Seite drumherum (let/const des Spiels sind von außen nicht sichtbar)
// Bereit erst, wenn die Testwelt geladen ist (vorher steht kurz der gespeicherte Stand da, den sie danach ersetzt)
if (!window.basarAdopt) { window.basarAdopt = adoptState; adoptState = function (...a) { const r = window.basarAdopt.apply(this, a); window.basarGeladen = true; return r; }; }
window.basarBereit = () => !!(window.basarGeladen || (document.getElementById('toast').textContent || '').includes('Testwelt')) && typeof state !== 'undefined' && !!cam;
window.basarZeige = ([x, y, w, h]) => { jumpTo(x, y, w, h); cam.z = w > 1 ? 1.4 : 2.6; closeModal(); };
window.basarNacht = on => { GFX.day = 'uhr'; nightAt = on ? () => NIGHT_MAX : () => 0; };
