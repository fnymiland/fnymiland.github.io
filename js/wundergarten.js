// Riesenrad und Sternwarte nur als Gebäude, ringsum echte Dinge (Nutzer 24.10.2026, wie der Botanische Garten; Entwurf tools/wunder-garten-entwurf.js).
// Riesenrad 3×3 auf einem Platz wie echte Riesenräder: unter dem Rad Pflaster im Belag des Wegs davor (COURTS, ohne Weg Kies), ringsum breite Wege,
// Zaun um den Fuß, vorn Mitte ein offenes Tor, links davon das Tickethäuschen in der Absperrung. Sternwarte quer 1×2: schlanker Turm neben
// dem Institut, vorn ein Weg zur Tür, Beet, Bänke zum Sternegucken, Hecke. t.g2 = neuer Zuschnitt; alte Stände rückt wunderUmbau() beim Laden.

// --- Riesenrad (3×3). Das Rad steht in jeder Drehung in der Bildebene: Füße (Welt, ab der Mitte) vorn bei (1,39 | −0,77) und (−0,77 | 1,39),
// hinten bei (0,59 | −1,09) und (−1,09 | 0,59). Das Tickethäuschen neben dem Tor muss darum im Bild nah an der Mitte stehen (dort sind die
// Beine hoch in der Luft): je nach Drehung links oder rechts vom Tor – rrKiosk(rot) = seine Lage längs der Vorderseite (b)
const rrKiosk = rot => (rot & 1) ? -1 : 1;
function riesenradArt(K, cx, cy, z, now, x, y, t) {
  if (groundPart(() => { if (t) courtFloor(K, t, x, y, () => kPave(K, () => kRectPath(K, -1.5, -1.5, 1.5, 1.5), PATH_LOOK.sand, x, y)); })) return;
  kShadow(K, 1.2);
  const idle = T.rail.power.idle.has(x + ',' + y);                          // ohne Strom: Rad steht, Lichter aus
  const R = 86 * z, hx = cx, hy = cy - 120 * z, rot = idle ? 0.12 : now / 11000, lit = night > 0.15 && isLive() && !idle, kb = rrKiosk(t ? t.rot || 0 : 0);
  const leg = (bx, by, w, col) => { g.strokeStyle = C(col); g.lineWidth = w * z; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, by); g.lineTo(hx, hy); g.stroke(); };
  const wheel = () => {
    cyl(cx, cy + 2 * z, 20 * z, 10 * z, 4 * z, '#e8e2d6');                      // Einstiegsplattform (klein, keine Platte)
    leg(cx - R * 0.62, cy - 8 * z, 4.5, '#dcd6ca'); leg(cx + R * 0.62, cy - 8 * z, 4.5, '#dcd6ca');   // hintere Stützen
    g.strokeStyle = C('#f4f1ea'); g.lineWidth = 3.2 * z; g.beginPath(); g.arc(hx, hy, R, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1.6 * z; g.beginPath(); g.arc(hx, hy, R * 0.9, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1 * z; g.beginPath(); g.arc(hx, hy, R * 0.3, 0, Math.PI * 2); g.stroke();
    g.beginPath();
    for (let i = 0; i < 16; i++) { const a = rot + i / 16 * Math.PI * 2; g.moveTo(hx + Math.cos(a) * R * 0.3, hy + Math.sin(a) * R * 0.3); g.lineTo(hx + Math.cos(a) * R, hy + Math.sin(a) * R); }
    g.stroke();
    const cols = ['#e8604f', '#6f8fd8', '#f2c14e', '#58b36a', '#f28cb1', '#b07ad6', '#5fc4c9', '#f29a5a'];
    for (let i = 0; i < 16; i++) {                                            // Gondeln
      const a = rot + i / 16 * Math.PI * 2, gx = hx + Math.cos(a) * R, gy = hy + Math.sin(a) * R, col = cols[i % cols.length];
      g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.9 * z; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + 4 * z); g.stroke();
      ellipse(gx, gy + 4 * z, 6.2 * z, 2.2 * z, C(shade(col, -0.18)));
      poly([[gx - 5.6 * z, gy + 4.5 * z], [gx + 5.6 * z, gy + 4.5 * z], [gx + 4.6 * z, gy + 14 * z], [gx - 4.6 * z, gy + 14 * z]], C(col));
      poly([[gx - 3.8 * z, gy + 6 * z], [gx + 3.8 * z, gy + 6 * z], [gx + 3.4 * z, gy + 9.6 * z], [gx - 3.4 * z, gy + 9.6 * z]], lit ? '#ffd873' : C('#e6f4ff'));
    }
    circle(hx, hy, 7 * z, C('#d9534a')); circle(hx, hy, 3 * z, C('#f4f1ea'));
    leg(cx - R * 0.8, cy + 10 * z, 5, '#f4f1ea'); leg(cx + R * 0.8, cy + 10 * z, 5, '#f4f1ea');   // vordere Stützen
    if (lit) for (let i = 0; i < 32; i++) {
      const a = rot + i / 32 * Math.PI * 2, lx = hx + Math.cos(a) * R, ly = hy + Math.sin(a) * R;
      circle(lx, ly, 1.4 * z, ['#ffe58a', '#ff9fc4', '#9fdcf7'][i % 3]);
      glowQuad([[lx - 1, ly - 1], [lx + 1, ly - 1], [lx + 1, ly + 1], [lx - 1, ly + 1]], 12 * z);
    }
  };
  const ticket = () => {                                                      // Tickethäuschen: zwei Schalter mit Brett und Schild nach vorn, Tür seitlich
    const B = K.block({ a: 1.3, b: kb, ha: 0.2, hb: 0.44, h: 15, wall: '#fff6e6', roof: '#e8604f', roofH: 8 }), F = B.faces.front;
    if (F) {
      for (const [t0, t1] of [[0.1, 0.45], [0.55, 0.9]]) { faceQuad(F.P, F.Q, t0, t1, F.H * 0.42, F.H * 0.8, lit ? '#ffd873' : C('#3d4a5c')); faceQuad(F.P, F.Q, t0 - 0.03, t1 + 0.03, F.H * 0.36, F.H * 0.44, C('#c9a46a')); }
      faceQuad(F.P, F.Q, 0.08, 0.92, F.H * 0.86, F.H * 1.02, C('#f2c14e'));
    }
    K.door(B, 'right', 0.3, 0.7, 0.75, '#6f8fd8'); K.door(B, 'left', 0.3, 0.7, 0.75, '#6f8fd8');
  };
  K.scene([[0, 0, wheel], [1.3, kb, ticket]]);
}

// --- Sternwarte quer (1×2): Turm (Welt-Radius 0,42, ganz in seinem Feld, Umgang bis 0,49) bei b −0,5, Institut bei b +0,5 (0,16 Abstand);
// nachts öffnet sich der Spalt und das Fernrohr schaut heraus
const SW_R = 0.42;
function sternwarteArt(K, cx, cy, z, now, x, y, t) {
  if (groundPart(() => { if (t) courtFloor(K, t, x, y, () => {}); })) return;   // Weg zur Tür des Instituts (COURTS)
  kShadow(K, 0.8);
  const lit = night > 0.15 && isLive();
  const tower = () => {
    const [x0, y0] = K.P(0, -0.5), rx = SW_R * TW / Math.SQRT2 * z, ry = rx / 2, H = 46 * z, q = rx / (36 * z);
    cyl(x0, y0, rx, ry, H, '#f6efe2');
    g.fillStyle = C('#e6dccb'); g.beginPath(); g.ellipse(x0, y0 - H * 0.52, rx, ry, 0, 0, Math.PI); g.lineTo(x0 - rx, y0 - H * 0.52 - 3 * z); g.ellipse(x0, y0 - H * 0.52 - 3 * z, rx, ry, 0, Math.PI, 0, true); g.fill();   // Gesims
    for (const dx of [-22, -8, 6, 20]) for (const f of [[0.12, 0.42], [0.62, 0.9]]) faceQuadRect(x0 + dx * q * z, y0 + ry * 0.75 * Math.sqrt(Math.max(0, 1 - (dx * q * z / rx) ** 2)), 5.5 * q * z, H * f[0], H * f[1], lit);
    ellipse(x0, y0 - H, rx * 1.16, ry * 1.16, C('#d8cfbd'));                    // Umgang
    g.strokeStyle = C('#f4f1ea'); g.lineWidth = 0.9 * z; g.beginPath();
    for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12, px = x0 + Math.cos(a) * rx * 1.14, py = y0 - H + Math.sin(a) * ry * 1.14; g.moveTo(px, py); g.lineTo(px, py - 6 * z); }
    g.stroke(); g.beginPath(); g.ellipse(x0, y0 - H - 6 * z, rx * 1.14, ry * 1.14, 0, 0, Math.PI); g.stroke();
    const dh = 36 * q * z, top = y0 - H - dh;
    dome(x0, y0 - H, rx * 0.92, ry * 0.92, dh, '#cfd8e3');
    g.strokeStyle = C('#b9c4d2'); g.lineWidth = 0.9 * z; g.beginPath(); g.ellipse(x0, y0 - H, rx * 0.5, dh, 0, Math.PI, Math.PI * 2); g.stroke();   // Rippen
    if (lit) {
      poly([[x0 - 5 * q * z, y0 - H - 3 * z], [x0 + 5 * q * z, y0 - H - 3 * z], [x0 + 4 * q * z, top + 1 * z], [x0 - 4 * q * z, top + 1 * z]], '#2c3245');
      g.strokeStyle = '#5a6278'; g.lineWidth = 6 * q * z; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0 - H - 16 * q * z); g.lineTo(x0 + 14 * q * z, top - 12 * z); g.stroke();
      for (let i = 0; i < 6; i++) { const tw = (Math.sin(now / 500 + i * 1.7) + 1) / 2; circle(x0 - 30 * z + i * 12 * z, top - 18 * z - (i % 2) * 9 * z, (0.7 + tw) * z, `rgba(255,248,200,${0.4 + tw * 0.6})`); }
    } else {
      g.strokeStyle = C('#aab5c2'); g.lineWidth = 4 * q * z; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(x0, y0 - H - 1 * z); g.lineTo(x0, top + 1 * z); g.stroke();
    }
    circle(x0, top - 1.5 * z, 2.2 * z, C('#f2c14e'));
  };
  const annex = () => {
    const B = K.block({ a: 0, b: 0.5, ha: 0.42, hb: 0.42, h: 20, wall: '#f3e1c4', roof: '#6f8fd8', roofH: 12, entry: true });
    K.door(B, 'front', 0.4, 0.6, 0.55);
    K.wins(B, 'front', 3, 0.35, 0.72, 0.1, 0.9, [1]);
    K.sideWins(B, 2, 0.35, 0.72);
  };
  K.scene([[0, -0.5, tower], [0, 0.5, annex]]);
}
WONDER_ART.riesenrad = riesenradArt;
WONDER_ART.sternwarte = sternwarteArt;

// --- Garten aus echten Dingen um einen Bau, in jeder Drehung. spec({ side: 'vorn'|'hinten'|'links'|'rechts', p, n, ecke }) im Rahmen des Baus
// (vorn = Eingangsseite, links = −b) → Liste von Aktionen: ['weg', {…}] | ['blumen'] | ['klein', b, [[sa, sb], …]] (Ecken des Felds im Rahmen
// des Baus, ±1). edge(cell, Seite nach außen [da, db]) → 'hecke'|'zaun'|null für die Außenkanten des Rings; inner(da, db, b) → 'zaun'|null
// für die Kanten zwischen Bau und Ring (Seite des Baus, b = Lage längs). Nur auf freien eigenen Wiesenfeldern; alles geschenkt (Weg/Beete
// price 0, Kleinkram und Linien free), Geld und Rohstoffe bleiben unverändert
function wonderGarden(b, x, y, rot, spec, edge, inner) {
  const r = (rot || 0) & 3, [w, h] = ITEMS[b].size, HA = w / 2, HB = h / 2, fp = footprint(b, x, y, r);
  const cx = fp.reduce((s, p) => s + p[0], 0) / fp.length, cy = fp.reduce((s, p) => s + p[1], 0) / fp.length, inv = (4 - r) & 3;
  const local = (tx, ty) => kitTurn(inv, tx - cx, ty - cy), world = (a, b2) => { const [u, v] = kitTurn(r, a, b2); return [Math.round(cx + u), Math.round(cy + v)]; };
  const slot = ([sa, sb]) => { const [u, v] = kitTurn(r, sa, sb); return (u > 0 ? 1 : 0) + (v > 0 ? 2 : 0); };
  const money = state.money, res = { ...state.res }, b0 = BATCH;
  const free = (tx, ty) => { const k = tx + ',' + ty; return ownedTile(tx, ty) && terrainAt(tx, ty) === 'grass' && !COVER.has(k) && !state.tiles.has(k) && !state.decos.has(k); };
  const line = (k, kind) => { if (!state.edges.has(k) && !edgeError(kind, k)) state.edges.set(k, { b: kind, style: currentStyle(kind), free: true, flush: newFlush(k), born: performance.now() }); };
  const cells = [];
  for (let a = -HA - 0.5; a <= HA + 0.5 + 1e-6; a++) for (let bb = -HB - 0.5; bb <= HB + 0.5 + 1e-6; bb++) {
    const ea = Math.abs(Math.abs(a) - (HA + 0.5)) < 1e-6, eb = Math.abs(Math.abs(bb) - (HB + 0.5)) < 1e-6;
    if (!ea && !eb) continue;
    const side = ea ? (a > 0 ? 'vorn' : 'hinten') : (bb < 0 ? 'links' : 'rechts'), p = Math.round(ea ? bb + HB + 0.5 : a + HA + 0.5);
    const [tx, ty] = world(a, bb);
    cells.push({ side, p, n: Math.round(ea ? 2 * HB + 1 : 2 * HA + 1), ecke: ea && eb, a, b: bb, tx, ty });
  }
  BATCH = 1;
  try {
    for (const c of cells) {
      if (!free(c.tx, c.ty)) continue;
      const k = c.tx + ',' + c.ty;
      for (const act of spec(c) || []) {
        if (act[0] === 'weg' || act[0] === 'blumen') {
          if (placeError(act[0], c.tx, c.ty, 0, { noCost: true }) || (state.tiles.has(k) && state.tiles.get(k).b !== 'weg')) continue;
          if (!state.tiles.has(k)) { state.money = 1e15; build(act[0], c.tx, c.ty, true); }
          const t = state.tiles.get(k);
          if (t) { t.price = 0; if (act[1]) Object.assign(t, act[1].along ? { rot: kitTurn(r, act[1].along[0], act[1].along[1])[0] ? 0 : 1, end: 'rand' } : act[1]); }
        } else if (act[0] === 'klein') {
          const ds = state.decos.get(k) || newSlots();
          for (const s of act[2]) { const i = slot(s); if (!ds[i]) ds[i] = { b: act[1], rot: 0, free: true, ...(DECO_LOOKS[act[1]] ? decoLookNew(act[1]) : {}) }; }
          state.decos.set(k, ds);
        }
      }
    }
    for (const c of cells) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {   // Außenkanten des Rings
      const oa = c.a + da, ob = c.b + db;
      if (Math.abs(oa) <= HA + 0.5 + 1e-6 && Math.abs(ob) <= HB + 0.5 + 1e-6) continue;
      const kind = edge && edge(c, [da, db]);
      if (kind && ownedTile(c.tx, c.ty)) { const [nx, ny] = world(oa, ob); line(edgeBetween(c.tx, c.ty, nx, ny), kind); }
    }
    if (inner) for (let a = -HA + 0.5; a <= HA - 0.5 + 1e-6; a++) for (let bb = -HB + 0.5; bb <= HB - 0.5 + 1e-6; bb++) for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const oa = a + da, ob = bb + db;                                          // Kanten zwischen Bau und Ring
      if (Math.abs(oa) < HA && Math.abs(ob) < HB) continue;
      const kind = inner(da, db, da ? bb : a);
      if (!kind) continue;
      const [ix, iy] = world(a, bb), [ox, oy] = world(oa, ob);
      if (ownedTile(ox, oy)) line(edgeBetween(ix, iy, ox, oy), kind);
    }
  } finally { BATCH = b0; state.money = money; Object.assign(state.res, res); }
  sandCache.clear(); landCache.clear(); waterChanged(); groundVersion++;
}

// Riesenrad: ringsum breite Wege (ein Platz mit dem Pflaster unter dem Rad), hinten an den Ecken Bäume, vor dem Tor zwei Laternen, an den
// Seiten Bänke; Zaun um den Fuß, vorn Mitte das Tor (offen), daneben (rrKiosk) steht das Tickethäuschen
const WIDE = { wide: true, sq: true };
function riesenradGarden(x, y, rot) {
  wonderGarden('riesenrad', x, y, rot, c => {
    const out = [['weg', WIDE]];
    if (c.side === 'hinten' && c.ecke) out.push(['klein', 'baum', [[-1, -1], [1, -1], [-1, 1], [1, 1]]]);
    else if (c.side === 'vorn' && c.p === 2) out.push(['klein', 'laterne', [[1, -1], [1, 1]]]);
    else if ((c.side === 'links' || c.side === 'rechts') && c.p === 2) out.push(['klein', 'bank', [[-1, c.side === 'links' ? 1 : -1]]]);
    return out;
  }, null, (da, db, pos) => da === 1 && (Math.abs(pos) < 0.1 || Math.abs(pos - rrKiosk(rot || 0)) < 0.1) ? null : 'zaun');
}
// Sternwarte: vorn ein Weg zur Tür des Instituts (b +0,5) mit zwei Laternen, vor dem Turm ein Beet, an den vorderen Ecken Büsche (nichts vor
// der Fassade), an den Seiten Bank und Busch, hinten Bäume; Hecke außen herum, vor dem Weg offen
function sternwarteGarden(x, y, rot) {
  wonderGarden('sternwarte', x, y, rot, c => {
    const inward = c.side === 'links' ? 1 : -1;
    if (c.side === 'vorn') return c.ecke ? [['klein', 'busch', [[-1, -1], [-1, 1]]]] : c.p === 2 ? [['weg', { along: [1, 0] }], ['klein', 'laterne', [[1, -1], [1, 1]]]] : [['blumen']];
    if (c.side === 'hinten') return [['klein', 'baum', c.ecke ? [[1, -1], [1, 1]] : [[-1, -1], [1, -1], [-1, 1], [1, 1]]]];
    return [['klein', 'bank', [[1, inward]]], ['klein', 'busch', [[-1, inward]]]];
  }, (c, [da]) => c.side === 'vorn' && c.p === 2 && da === 1 ? null : 'hecke');
}

// Alte Stände (Nutzer 24.10.2026): Bau in die Mitte seiner alten Fläche (vor v9 kleiner, OLD_WONDER_SIZE), Garten drumherum (nach recalc, state.js)
const WG_PREV = { riesenrad: [5, 5], sternwarte: [3, 3] };
function wunderUmbau() {
  const out = [];
  for (const [k, t] of [...state.tiles]) {
    if (!WG_PREV[t.b] || t.g2) continue;
    const [x, y] = keyXY(k), r = (t.rot || 0) & 3, o = state.growWonders ? OLD_WONDER_SIZE[t.b] : WG_PREV[t.b], old = r & 1 ? [o[1], o[0]] : o, [w, h] = sizeOf(t.b, r, t);
    const nx = x + Math.floor((old[0] - w) / 2 + 0.5), ny = y + Math.floor((old[1] - h) / 2 + 0.5);
    state.tiles.delete(k); t.g2 = true; state.tiles.set(nx + ',' + ny, t);
    out.push([t.b, nx, ny, r]);
  }
  if (out.length) rebuildCover();
  return out;
}
const wonderGardenFor = (b, x, y, rot) => b === 'riesenrad' ? riesenradGarden(x, y, rot) : b === 'sternwarte' ? sternwarteGarden(x, y, rot) : null;
