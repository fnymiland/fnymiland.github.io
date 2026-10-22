'use strict';
// ---------------------------------------------------------------------------
// 🌿 Botanischer Garten neu (Nutzer 22.10.2026: „voll broken“ – die Flügel waren zwei Glashäuser, in die Rotunde gesteckt; und „das Zeug
// drumherum zu echten Dingen, die automatisch eingefügt, aber auch entfernt werden können“): Das Wunderwerk ist nur noch das Gebäude
// (2×5, Rotunde mit zwei Glasflügeln, in jeder Drehung). Beim Bauen legt bgGarden ringsum einen Garten aus echten Dingen an – Weg, Hecke
// mit Eingang, Bäume, Laternen, Beete, Teich –, geschenkt (bringt beim Abreißen nichts) und nur auf freien eigenen Feldern.
// Alte Stände: botgartenUmbau rückt den Bau beim Laden in die Mitte seiner alten 5×5-Fläche (t.bg2) und legt dort den Garten an.
// Bild aus tools/prachtbauten-entwurf.js (botgartenNeu, abgenommen) – Änderungen dort zeigen.
// ---------------------------------------------------------------------------
const BG_ART = (() => {
  const GLASS = '#bfe0ee', GLASS_D = '#9cc8dc', FRAME = '#ffffff';
  const lit = () => night > 0.15 && isLive();
  const fRect = (F, t0, t1, h0, h1, fill) => poly([F(t0, h0), F(t1, h0), F(t1, h1), F(t0, h1)], fill);
  const wallOf = (K, fix, along, from, to, lift, axis) => {
    const f = (t, h) => axis === 'b' ? K.P(from + (to - from) * t, fix, lift + h) : K.P(fix, from + (to - from) * t, lift + h);
    f.z = K.z; return f;
  };
  function arch(F, t0, t1, h0, h1, fill) {
    const tm = (t0 + t1) / 2, r = (t1 - t0) / 2, rise = (h1 - h0) * 0.22, pts = [F(t0, h0), F(t1, h0), F(t1, h1 - rise)];
    for (let i = 1; i < 12; i++) { const an = i / 12 * Math.PI; pts.push(F(tm + Math.cos(an) * r, h1 - rise + Math.sin(an) * rise)); }
    pts.push(F(t0, h1 - rise)); poly(pts, fill);
  }
  const ring = (cx, cy, rx, ry, z) => (t, h) => [cx + Math.sin(t) * rx, cy + Math.cos(t) * ry - h * z];
  const onRing = (R, t0, t1, h0, h1, fill) => { if (Math.cos((t0 + t1) / 2) < 0.35) return; const pts = [], n = 8, rise = (h1 - h0) * 0.3;
    for (let i = 0; i <= n; i++) pts.push(R(t0 + (t1 - t0) * i / n, h0));
    for (let i = n; i >= 0; i--) { const t = t0 + (t1 - t0) * i / n; pts.push(R(t, h1 - rise + Math.sqrt(Math.sin(Math.PI * i / n)) * rise)); }
    poly(pts, fill); };
  // Glaswand: Pflanzen drinnen, Glas halb deckend davor, weiße Sprossen; nachts warmes Glas und Licht je Scheibe zwischen den Sprossen
  function glassFace(F, h0, h1, cols, hs, plants, shadeSide) {
    const z = F.z, L = lit(), tint = c => C(shadeSide ? shade(c, -0.2) : c);
    fRect(F, 0, 1, h0, h1, tint(L ? '#e8c77a' : GLASS_D));
    if (plants) for (let i = 0; i < plants; i++) {
      const t = (i + 0.5) / plants, [x, y] = F(t, h0 + 0.5);
      ellipse(x, y - 4 * z, 3.4 * z, 4.4 * z, C(shadeSide ? '#4f9a5e' : '#5fb06c')); ellipse(x + 2 * z, y - 7.5 * z, 2.6 * z, 2.8 * z, C(shadeSide ? '#62a86c' : '#78c67f'));
    }
    g.globalAlpha = 0.62; fRect(F, 0, 1, h0, h1, tint(L ? '#ffe7a8' : GLASS)); g.globalAlpha = 1;
    g.strokeStyle = C(shadeSide ? shade(FRAME, -0.12) : FRAME); g.lineWidth = Math.max(0.5, 0.55 * z); g.beginPath();
    for (let i = 0; i <= cols; i++) { const t = i / cols; g.moveTo(...F(t, h0)); g.lineTo(...F(t, h1)); }
    for (const h of [h0, ...hs, h1]) { g.moveTo(...F(0, h)); g.lineTo(...F(1, h)); }
    g.stroke();
    if (L) { const rows = [h0, ...hs, h1]; for (let i = 0; i < cols; i++) for (let r = 0; r + 1 < rows.length; r++) {
      const a = i / cols + 0.02, b = (i + 1) / cols - 0.02, lo = rows[r] + 0.6, hi = rows[r + 1] - 0.6;
      glowQuad([F(a, lo), F(b, lo), F(b, hi), F(a, hi)], 9 * z); } }
  }
  return function botgarten(K) {
    const z = K.z, WHITE = '#ffffff', R = 0.88, RH = 24, wa = 0.46, wH = 13, wR = 9;
    const SH = 0;                                                         // steht direkt auf dem Boden (ohne Platte, Nutzer)
    const rb = Math.sqrt(R * R - wa * wa);                                 // dort trifft die Flügelwand die Rotunde
    const shadeN = (na, nb) => K.turn(na, nb)[0] > 0.5;                     // Wand im Schatten (Normale zeigt nach rechts vorn)
    // Flügel in jeder Drehung: sichtbar sind die Wände, deren Normale zum Betrachter zeigt (K.facing), am inneren Ende nie (dort ist die
    // Rotunde); Dach: beide Schrägen, die hintere zuerst
    const wing = sgn => {
      const b0 = sgn * rb, b1 = sgn * 2.38, bc = (b0 + b1) / 2, hb = Math.abs(b1 - b0) / 2, top = SH + wH;
      for (const sa of [-1, 1]) if (K.facing(sa, 0) > 0.01) glassFace(wallOf(K, sa * wa, 'b', bc - hb, bc + hb, SH, 'a'), 0, wH, 7, [wH * 0.55], 4, shadeN(sa, 0));
      const endSeen = K.facing(0, sgn) > 0.01;
      if (endSeen) glassFace(wallOf(K, b1, 'a', -wa, wa, SH, 'b'), 0, wH, 3, [wH * 0.55], 2, shadeN(0, sgn));
      const E = (sa, sb) => K.P(sa * wa, bc + sb * hb, top), Rr = sb => K.P(0, bc + sb * hb, top + wR);
      for (const sa of [-1, 1].sort((p, q) => K.facing(p, 0) - K.facing(q, 0))) {
        const [u] = K.turn(sa, 0), dark = u > 0.5;
        poly([E(sa, -1), E(sa, 1), Rr(1), Rr(-1)], C(u < -0.5 ? shade(GLASS, 0.06) : dark ? shade(GLASS, -0.12) : GLASS));
        g.strokeStyle = C(dark ? shade(WHITE, -0.1) : WHITE); g.lineWidth = Math.max(0.5, 0.6 * z); g.beginPath();
        for (let i = 0; i <= 6; i++) { const t = -1 + 2 * i / 6; g.moveTo(...K.P(sa * wa, bc + t * hb, top)); g.lineTo(...K.P(0, bc + t * hb, top + wR)); }
        g.moveTo(...E(sa, -1)); g.lineTo(...E(sa, 1)); g.moveTo(...Rr(-1)); g.lineTo(...Rr(1)); g.stroke();
      }
      if (endSeen) {                                                       // Giebel am äußeren Ende: Glasdreieck mit Sprossen, Tür
        const p = K.P(wa, b1, top), q = K.P(-wa, b1, top), r = K.P(0, b1, top + wR);
        poly([p, q, r], C(shadeN(0, sgn) ? shade(GLASS, -0.12) : GLASS)); g.strokeStyle = C(WHITE); g.lineWidth = Math.max(0.5, 0.6 * z); g.beginPath(); g.moveTo(...p); g.lineTo(...r); g.lineTo(...q); g.moveTo(...lerp(p, q, 0.5)); g.lineTo(...r); g.stroke();
        const F = wallOf(K, b1, 'a', -wa, wa, SH, 'b'); arch(F, 0.38, 0.62, 0, 8, C('#ffffff'));
      }
    };
    // hinterer Flügel zuerst, dann Rotunde, dann der vordere (nach der Tiefe des Flügelmittelpunkts – gilt in jeder Drehung)
    const [wBack, wFront] = [-1, 1].sort((p, q) => K.depth(0, p * 1.6) - K.depth(0, q * 1.6));
    wing(wBack);
    // Rotunde: Glaszylinder auf Steinring, Palmen drinnen, weiße Streben; Glaskuppel mit Rippen und goldener Spitze; Tür nach rechts vorn (+a)
    const [cx, cy] = K.P(0, 0, SH), rx = R * Math.SQRT2 * TW / 2 * z, ry = rx / 2, Rg = ring(cx, cy, rx, ry, z);
    cyl(cx, cy, rx, ry, RH * z, lit() ? '#e8c77a' : GLASS_D);
    // Palmen hinter dem Glas – an der Glaswand abgeschnitten (sonst hingen die Wedel als „grüne Schlangen“ außen an der Rotunde)
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); g.lineTo(cx - rx, cy - RH * z); g.ellipse(cx, cy - RH * z, rx, ry, 0, Math.PI, 0, true); g.closePath(); g.clip();
    for (let i = 0; i < 7; i++) { const t = -1.2 + i * 0.4, [px, py] = Rg(t, 1);
      ellipse(px + (i % 2 ? 4 : -4) * z, py - 3 * z, 4.2 * z, 3.4 * z, C(i % 2 ? '#86cf8a' : '#6fbf7a'));   // Busch am Boden
      g.strokeStyle = C('#9a7a52'); g.lineWidth = 1.3 * z; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 0.6 * z, py - 15 * z); g.stroke();   // Stamm
      g.fillStyle = C('#5fae62');                                          // Krone: Blätter strahlenförmig, nach unten hängend
      for (const an of [-2.6, -2.0, -1.57, -1.1, -0.5]) { g.beginPath(); g.ellipse(px + 0.6 * z + Math.cos(an) * 4 * z, py - 15 * z + Math.sin(an) * 2.2 * z + 1.2 * z, 4.6 * z, 1.3 * z, an + Math.PI / 2 * 0 , 0, Math.PI * 2); g.fill(); } }
    g.restore();
    g.globalAlpha = 0.55; cyl(cx, cy, rx, ry, RH * z, lit() ? '#ffe7a8' : GLASS); g.globalAlpha = 1;
    g.strokeStyle = C(WHITE); g.lineWidth = Math.max(0.5, 0.8 * z); g.beginPath();
    for (let i = -6; i <= 6; i++) { const t = i * Math.PI / 13; const [x0, y0] = Rg(t, 0); g.moveTo(x0, y0); g.lineTo(x0, y0 - RH * z); }
    for (const h of [RH * 0.5, RH]) for (let j = 0; j <= 24; j++) { const p = Rg(-Math.PI / 2 + Math.PI * j / 24, h); j ? g.lineTo(...p) : g.moveTo(...p); }
    g.stroke();
    if (lit()) for (let i = -6; i < 6; i++) {                              // Nachtlicht je Glasfeld zwischen den Streben (unten und oben)
      const t0 = i * Math.PI / 13 + 0.02, t1 = (i + 1) * Math.PI / 13 - 0.02;
      if (Math.cos((t0 + t1) / 2) < 0.3) continue;
      for (const [h0, h1] of [[1, RH * 0.5 - 1], [RH * 0.5 + 1, RH - 1]]) glowQuad([Rg(t0, h0), Rg(t1, h0), Rg(t1, h1), Rg(t0, h1)], 10 * z);
    }
    { const [u, v] = K.turn(1, 0), td = Math.atan2(u - v, (u + v)); onRing(Rg, td - 0.16, td + 0.16, 0, 11, C('#ffffff')); }   // Tür nach +a (onRing lässt sie weg, wenn sie hinten liegt)
    ellipse(cx, cy - RH * z, rx * 1.03, ry * 1.03, C('#f4f1ea'));               // Kranz
    dome(cx, cy - RH * z, rx, ry, 26 * z, lit() ? '#fff0c4' : GLASS);
    { const DH = 26 * z, y0 = cy - RH * z, dp = (lat, ph) => [cx + rx * Math.cos(lat) * Math.sin(ph), y0 + ry * Math.cos(lat) * Math.cos(ph) - DH * Math.sin(lat)];
      g.strokeStyle = C(WHITE); g.lineWidth = Math.max(0.5, 0.8 * z); g.beginPath();
      for (let m = -4; m <= 4; m++) { const ph = m * Math.PI / 9; for (let j = 0; j <= 12; j++) { const p = dp(Math.PI / 2 * j / 12, ph); j ? g.lineTo(...p) : g.moveTo(...p); } }
      for (const lat of [0.4, 0.85]) for (let j = 0; j <= 24; j++) { const p = dp(lat, -Math.PI / 2 + Math.PI * j / 24); j ? g.lineTo(...p) : g.moveTo(...p); }
      g.stroke(); }
    cyl(cx, cy - (RH + 26) * z, 2.2 * z, 1.1 * z, 3 * z, '#f2c14e'); circle(cx, cy - (RH + 30) * z, 1.8 * z, C('#f2c14e'));
    wing(wFront);
  }
})();
WONDER_ART.botgarten = (K, cx, cy, z) => { if (groundPart(() => {})) return; kShadow(K, 1.3); BG_ART(K); };

// Garten aus echten Dingen rund um das Gebäude (Ring von einem Feld, Entwurf A – Nutzer 22.10.2026): Vorn (Eingangsrichtung FRONT_DIR)
// in der Mitte ein Wegstück zur Tür mit zwei Laternen, links und rechts je zwei Blumenbeete, in den vorderen Ecken Bäume. Stirnseiten:
// Büsche. Hinten: Teich in einer Ecke, Baum in der anderen, dazwischen Bäume und Büsche. Außen herum Hecke, am Eingang offen.
// Nur auf freien eigenen Wiesenfeldern; geschenkt (Weg/Beete price 0, Kleinkram und Hecke free)
function bgGarden(x, y, rot) {
  const fp = footprint('botgarten', x, y, rot), xs = fp.map(p => p[0]), ys = fp.map(p => p[1]);
  const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
  const alongY = x1 - x0 < y1 - y0, [fx, fy] = FRONT_DIR[(rot || 0) & 3];
  const frontLine = alongY ? (fx > 0 ? x1 : x0) : (fy > 0 ? y1 : y0), backLine = alongY ? (fx > 0 ? x0 : x1) : (fy > 0 ? y0 : y1);
  const n = alongY ? y1 - y0 : x1 - x0, mid = Math.round(n / 2), pos = (tx, ty) => alongY ? ty - y0 : tx - x0, line = (tx, ty) => alongY ? tx : ty;
  const outer = [0, 1, 2, 3].filter(i => alongY ? (i & 1 ? 1 : -1) === fx : (i & 2 ? 1 : -1) === fy);   // Ecken eines Feldes zur Eingangsseite
  const money = state.money, res = { ...state.res }, b0 = BATCH;
  const free = (tx, ty) => { const k = tx + ',' + ty; return ownedTile(tx, ty) && terrainAt(tx, ty) === 'grass' && !COVER.has(k) && !state.tiles.has(k) && !state.decos.has(k); };
  const tile = (b, tx, ty) => { if (!free(tx, ty) || placeError(b, tx, ty, 0, { noCost: true })) return false; state.money = 1e15; build(b, tx, ty, true); const t = state.tiles.get(tx + ',' + ty); if (t) t.price = 0; return !!t; };
  const small = (b, tx, ty, slots, onWeg) => { const k = tx + ',' + ty; if (!(onWeg || free(tx, ty))) return;
    const ds = state.decos.get(k) || newSlots(); for (const s of slots) if (!ds[s]) ds[s] = { b, rot: 0, free: true, ...(DECO_LOOKS[b] ? decoLookNew(b) : {}) }; state.decos.set(k, ds); };
  BATCH = 1;
  try {
    for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) {
      if (tx > x0 && tx < x1 && ty > y0 && ty < y1) continue;                 // innen steht das Gebäude
      const p = pos(tx, ty), ln = line(tx, ty), corner = p === 0 || p === n;
      if (ln === frontLine) {
        if (p === mid) { if (tile('weg', tx, ty)) small('laterne', tx, ty, outer, true); }   // Weg zur Tür
        else if (corner) small('baum', tx, ty, [0, 3]);
        else tile('blumen', tx, ty);
      } else if (ln === backLine) {
        if (p === 0) { if (free(tx, ty)) { state.money = 1e15; build('graben', tx, ty, true); } }   // Teich hinten an einem Ende
        else if (p === n) small('baum', tx, ty, [0, 3]);
        else if (p % 2 === 0) small('baum', tx, ty, [0]);
        else small('busch', tx, ty, [1]);
      } else small('busch', tx, ty, [0, 3]);                                 // Stirnseiten
    }
    // Hecke außen herum, vorn in der Mitte offen (Eingang)
    for (let tx = x0; tx <= x1; tx++) for (let ty = y0; ty <= y1; ty++) {
      if (tx > x0 && tx < x1 && ty > y0 && ty < y1) continue;
      for (const [dx, dy] of DIRS) {
        const nx = tx + dx, ny = ty + dy;
        if (nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1) continue;           // Kante nach innen
        if (line(tx, ty) === frontLine && pos(tx, ty) === mid && line(nx, ny) !== frontLine) continue;   // Eingang
        const k = edgeBetween(tx, ty, nx, ny);
        if (state.edges.has(k) || edgeError('hecke', k) || !ownedTile(tx, ty)) continue;
        state.edges.set(k, { b: 'hecke', style: currentStyle('hecke'), free: true, flush: newFlush(k), born: performance.now() });
      }
    }
  } finally { BATCH = b0; state.money = money; Object.assign(state.res, res); }
  sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++;
}

// Alte Stände: Bau in die Mitte der alten Fläche (5×5, vor v9 3×3), Garten drumherum (nach recalc, state.js)
function botgartenUmbau() {
  const out = [];
  for (const [k, t] of [...state.tiles]) {
    if (t.b !== 'botgarten' || t.bg2) continue;
    const [x, y] = keyXY(k), old = state.growWonders ? 3 : 5, [w, h] = sizeOf('botgarten', t.rot, t);
    const nx = x + Math.floor((old - w) / 2 + 0.5), ny = y + Math.floor((old - h) / 2 + 0.5);
    state.tiles.delete(k); t.bg2 = true; state.tiles.set(nx + ',' + ny, t);
    out.push([nx, ny, t.rot || 0]);
  }
  if (out.length) rebuildCover();
  return out;
}
