// Entwurf (Anhöhen Stufe 2: Wege oben + Rampe, auch Fahrzeuge sollen hinauf): vier Varianten einer Rampe, über die ein Weg von unten auf
// die Anhöhe führt. Alle eingelassen wie die Treppe (Rampenfeld liegt unten, steigt auf dem Feld von der Vorderkante bis zur Oberkante der
// Anhöhe dahinter; seitlich Anhöhe = deren Wand ist die Wange, offene Seite = Keil wie bei der Treppe). Nur als Bild: die Rampe steht als
// Treppe ('huegeltreppe') im Spielstand, und nur für dieses Bild malen paintStair (Rampe statt Stufen), paintHill (Weg oben), pathArms
// (Wege nur auf gleicher Höhe verbunden, dazu an Fuß und Ende der Rampe) und hillStairEnds (eine Rampe hat keine oberste Stufe: dunkle
// Kante oben bis ans Ende) anders – danach ist alles wie vorher. Kein Spielcode geändert.
// Im Browser (?welt=neu, Bild-Sammler scratchpad/sink.py an):
// fetch('tools/rampe-entwurf.js').then(r => r.text()).then(t => (0, eval)(t)); await rampeBild('rampe-varianten.png')
// Nahaufnahmen zum Prüfen: await rampeNahBogen([[n, u, v, höhe, 'Text'], …], 'name.png', zoom)  (n = Variante 0–3, u/v relativ zu
// ihrem Ursprung, höhe in Bildpunkten); einzelne Bildpunkte nachmessen: rampeShot(n, u, v, zoom, größe, höhe) → Leinwand
(function rampeEntwurf() {
  const VARS = [
    ['A', 'Rampe 1 Feld – Wände als Wangen', 0],
    ['B', 'Rampe 2 Felder (flacher)', 0],
    ['C', 'offene Seite: Keil mit Geländer', 2],
    ['D', 'längs der Wand hinauf, mit Wange', 1],
  ];
  const STYLE = 'kopf';                                                  // Kopfstein: Weg unten, Rampe, Weg oben
  const RAMPS = new Map();                                               // Feld → { h0, h1 (Höhe vorn/hinten), kind, rail }
  const UPWEG = new Set();                                               // Wegfelder oben auf der Anhöhe
  let base = null, z = 1;

  // --- Rampe malen (statt der Stufen). P(u, v, up) wie in paintStair: Feldkoordinaten relativ zur Feldmitte, Höhe in Bildpunkten ---
  function paintRamp(P, o, x, y, R) {
    const H = HILL_H, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du, kind = R.kind || o.kind, S = HILL_STY[kind] || HILL_STY.fels;
    const UV = (d, s) => [Du * d + Su * s, Dv * d + Sv * s];               // d längs (hinauf), s quer
    const full = R.h1 >= H - 1e-6;                                       // endet oben (sonst geht es auf dem nächsten Rampenfeld weiter)
    const hd = d => { const h = Math.max(0, R.h0 + (R.h1 - R.h0) * (d + 0.5)); return full ? Math.min(H, h) : h; };   // über die Enden hinaus: waagerecht
    const W = (d, s) => P(...UV(d, s), hd(d));
    const toward = Du + Dv > 0, nearP = Su + Sv > 0;
    const lk = lookFar(pathLook(o.style), 1);
    const bk = 0.5 + 0.0075;                                             // hinten 0,0075 über die Feldgrenze (wie Anhöhe an Anhöhe): keine Fuge
    // vorn am Fuß ebenso 0,0075 flach auf den Boden davor: dort endet der Schatten der Rampe (im Boden-Bild) genau an der Kante, und seine
    // geglättete Kante stand sonst als feiner dunkler Strich unter der geglätteten Kante der Rampe
    const fe = R.prev ? 0 : 0.0075, ft = -0.5 - fe;
    const lo = o.m === 'k' ? -0.5 + STAIR_CW : o.m === 'j' ? -0.51 : -0.5, hi = o.p === 'k' ? 0.5 - STAIR_CW : o.p === 'j' ? 0.51 : 0.5;
    const seed = x * 5 + y * 9 + o.rot;
    // Keil = schmale Anhöhe neben der Rampe: oben genau auf der Linie der Rampenkante (vorn so hoch wie die Rampe vorn, hinten wie die
    // Anhöhe), Oberseite in Bodenfarbe, sichtbare Seite als Wand mit derselben Grasnarbe
    const keil = sg => {
      const sOut = 0.5 * sg, sIn = sg * (0.5 - STAIR_CW), outVis = sg * (Su + Sv) > 0;
      const sF = outVis ? sOut : sIn, nu = (outVis ? sg : -sg) * Su;
      // Oberseite: hinten nur über die Anhöhe hinaus (bk), vorn immer 0,0075 weiter – zum nächsten Rampenfeld unter dessen Keil (der kommt
      // später und deckt es); umgekehrt läge sie über dessen Grasnarbe (helle Kerbe)
      const kb = full ? bk : 0.5, kf = -0.5 - 0.0075;
      const topQ = [W(kf, sIn), W(kf, sOut), W(-0.5, sOut), W(0.5, sOut), W(kb, sOut), W(kb, sIn), W(0.5, sIn), W(-0.5, sIn)];
      poly(topQ, C(o.top || S.lip));
      if (!outVis) {                                                     // hinterer Keil: außen oben die dunkle Kante zur Wiese
        g.save();
        try {
          g.beginPath(); topQ.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
          const e = [W(-0.6, sOut), W(0.6, sOut)];
          g.beginPath(); e.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
          g.strokeStyle = 'rgba(45,85,30,0.5)'; g.lineWidth = 3; g.lineCap = 'butt'; g.stroke();
        } finally { g.restore(); }
      }
      // Wand ein Stück unter das später gezeichnete Bildchen verlängern, das sie in derselben Ebene fortsetzt (sonst schimmert an der Fuge
      // der Boden durch: feiner Strich): vorn unter das nächste Rampenfeld (R.prev = davor geht die Rampe weiter, das liegt vorn und kommt
      // später), hinten über die Wand der Anhöhe, an die der Keil anschließt (die kam früher – die Verlängerung deckt ihre Fuge)
      const [a0, b0] = UV(-0.5, sF), [a1, b1] = UV(0.5, sF), tx = x + Du, ty = y + Dv;
      const e0 = R.prev ? 0.0075 : 0, e1 = full && hillLevel(tx, ty) === 1 && hillLevel(tx + sg * Su, ty + sg * Sv) < 1 ? 0.0075 : 0;
      paintHillWall(P, a0, b0, a1, b1, nu > 0 ? 'u' : 'v', kind, 0, R.h0, seed + 3 * sg, R.h1, true, 1, e0, e1);
      if (!toward && R.h0 > 0.01 && !R.prev) {                           // Stirn am Fuß (nur, wenn davor keine Rampe weitergeht)
        const [c0, e0] = UV(-0.5, sIn), [c1, e1] = UV(-0.5, sOut);
        paintHillWall(P, c0, e0, c1, e1, -Du > 0 ? 'u' : 'v', kind, 0, R.h0, seed + sg);
      }
      if (R.rail) rail(sg);
    };
    // Geländer wie an den Überdachungen (roofs.js): Pfosten etwa alle 0,2, Handlauf oben (7 hoch) und ein zweiter darunter – parallel zur
    // Rampe. Der untere auf 0,6 der Höhe (nicht 0,5): sonst liefe er im Bild fast genau auf der Innenkante des Keils, mit einem haarfeinen
    // Streifen Pflaster dazwischen (sah aus wie eine Fuge)
    const rail = sg => {
      const sR = sg * (0.5 - STAIR_CW / 2), hh = 7, col = C('#4f4a44');
      const ln = (a, b, w) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
      const at = (d, up) => P(...UV(d, sR), hd(d) + up);
      const posts = [-0.45, -0.225, 0, 0.225, 0.45];
      for (const [k, w] of [[hh * 0.6, 0.6], [hh, 1.1]]) ln(at(posts[0], k), at(posts[posts.length - 1], k), w);
      for (const d of posts) ln(at(d, 0), at(d, hh), 0.9);
    };
    if ((nearP ? o.m : o.p) === 'k') keil(nearP ? -1 : 1);
    // Fahrbahn: eine schräge Fläche im Wegbelag (Muster im Weltraster wie die Wege), hinten bündig über die Feldgrenze
    const q = [UV(ft, lo), UV(ft, hi), UV(-0.5, hi), UV(0.5, hi), UV(bk, hi), UV(bk, lo), UV(0.5, lo), UV(-0.5, lo)];
    const L = ([u, v]) => P(u, v, hd(u * Du + v * Dv));
    poly(q.map(L), C(lk.fill));
    // Muster flach gemalt und als Ganzes auf die schräge Ebene abgebildet (affin: h = hc + gu·u + gv·v) – so liegen die Steine auf der
    // Rampe, und an Fuß und oberem Ende treffen sie genau die Steine des Wegs davor bzw. dahinter (einzeln angehoben verrutschten sie
    // dort um ihre eigene Höhe: feiner Strich in Fugenfarbe)
    if (lk.pat) {
      const k = R.h1 - R.h0, gu = k * Du, gv = k * Dv, hc = R.h0 + k / 2;
      g.save();
      try {
        clipTo([q], L);
        g.transform(1, -(gu - gv) / TW, 0, 1 - (gu + gv) / TH, 0, -hc);
        patSeam = true;
        pattern(([u, v]) => P(u, v, 0), lk.pat[0], x, y, 1, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill);
      } finally { patSeam = false; g.restore(); }
    }
    if ((nearP ? o.p : o.m) === 'k') keil(nearP ? 1 : -1);
  }

  // --- Patches nur fürs Bild ---
  function patched(fn) {
    const o = { paintStair, paintHill, hillStairEnds, pathArms };
    // Wege verbinden sich nur auf gleicher Höhe – und mit der Rampe: unten an ihrem Fuß, oben an ihrem Ende
    window.pathArms = function (x, y) {
      const lv = hillLevel(x, y), out = o.pathArms(x, y).filter(([dx, dy]) => !RAMPS.has((x + dx) + ',' + (y + dy)) && hillLevel(x + dx, y + dy) === lv);
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, R = RAMPS.get(nx + ',' + ny), t = R && state.tiles.get(nx + ',' + ny);
        if (!t) continue;
        const [Du, Dv] = STAIR_UP[(t.rot || 0) & 3];
        if ((lv === 0 && R.h0 === 0 && nx - Du === x && ny - Dv === y) || (lv === 1 && R.h1 >= HILL_H && nx + Du === x && ny + Dv === y)) out.push([dx, dy]);
      }
      return out;
    };
    window.paintStair = function (P, ob, x, y) {
      const R = RAMPS.get(x + ',' + y);
      return R ? paintRamp(P, ob, x, y, R) : o.paintStair(P, ob, x, y);
    };
    window.paintHill = function (x, y, h) {
      o.paintHill(x, y, h);
      const k = x + ',' + y, t = state.tiles.get(k);
      if (!t || t.b !== 'weg' || !UPWEG.has(k)) return;
      // Weg oben: wie am Boden (drawPath), angehoben; zugeschnitten auf die Raute, an allen Seiten 0,0075 darüber (Wegfeld an Wegfeld
      // ohne Fuge – sonst schimmerte zwischen zwei Bildchen die Wiese durch). Wo er an der Rampe endet, deckt die Rampe den Rest
      const top = (h.h || 1) * HILL_H, e = 0.0075, P = (u, v) => [(u - v) * TW / 2, (u + v) * TH / 2 - top];
      g.save();
      try {
        g.beginPath(); [P(-0.5 - e, -0.5 - e), P(0.5 + e, -0.5 - e), P(0.5 + e, 0.5 + e), P(-0.5 - e, 0.5 + e)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
        drawPath(0, -top, 1, x, y, t);
      } finally { g.restore(); }
    };
    // Rampe: keine oberste Stufe – die dunkle Kante oben läuft an ihren Seiten bis ans Ende (a–d entfallen)
    window.hillStairEnds = function (x, y) {
      if (!stairFresh().n && !hillGap) return '';
      let s = '';
      for (const [c, r, dx, dy] of [['v', 0, 0, 1], ['u', 3, 1, 0], ['U', 1, -1, 0], ['V', 2, 0, -1], ['a', 0, -1, 0], ['b', 2, -1, 0], ['c', 3, 0, -1], ['d', 1, 0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if ('abcd'.includes(c) && RAMPS.has(nx + ',' + ny)) continue;
        if (stairRotAt(nx, ny) === r && (!'abcd'.includes(c) || drawLevel(nx, ny) + 1 === hillLevel(x, y))) s += c;
      }
      return s;
    };
    const clear = () => { for (const e of hillSprites.values()) freeCanvas(e.c); hillSprites.clear(); };
    const me0 = state.me;                                                // die eigene Figur (Bürgermeister·in) nicht im Bild
    state.me = { ...(me0 || {}), off: true }; bubble = null;
    clear();
    groundVersion++;                                                     // Boden-Bild (Wege) neu – mit den Verbindungen von oben
    try { return fn(); } finally { Object.assign(window, o); state.me = me0; groundVersion++; clear(); }
  }

  // --- Welt aufbauen: vier Anhöhen im Raster 2 × 2, fest auf der Insel von ?welt=neu (nicht vom Bildausschnitt abhängig) ---
  const ORIG = [[2, 6], [16, 6], [2, 19], [16, 19]];
  function setup() {
    for (const [ox, oy] of ORIG) for (let y = oy - 5; y <= oy + 6; y++) for (let x = ox - 4; x <= ox + 8; x++) { const k = x + ',' + y; state.claimed.add(k); state.terra.set(k, 'grass'); state.tiles.delete(k); state.decos.delete(k); state.hills.delete(k); }
    for (const k of [...state.edges.keys()]) state.edges.delete(k);
    state.money = 1e9; state.techs.add('terraform'); for (const d of DESIGN) state.design.add(d.id);
    RAMPS.clear(); UPWEG.clear();
    const HH = HILL_H, of = window.fail, errs = [];
    window.fail = m => errs.push(m);
    const weg = (x, y, up) => { state.tiles.set(x + ',' + y, { b: 'weg', lvl: 1, style: STYLE }); if (up) UPWEG.add(x + ',' + y); };
    const ramp = (x, y, rot, h0, h1, kind, extra = {}) => { state.tiles.set(x + ',' + y, { b: 'huegeltreppe', lvl: 1, rot, style: STYLE }); RAMPS.set(x + ',' + y, { h0, h1, kind, ...extra }); };
    const hills = (x0, x1, y0, y1, skip = () => false) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!skip(x, y)) raiseHill(x, y); };
    const spots = [];
    try {
      VARS.forEach(([, , w], n) => {
        const [x0, by] = ORIG[n], kind = HILL_WALLS[w];
        state.paintNew.anhoehe = { form: w };
        if (n === 0) {                                                   // A: 3 × 3, Rampe vorn in der Mitte
          hills(x0, x0 + 2, by - 1, by + 1, (x, y) => x === x0 + 1 && y === by + 1);
          ramp(x0 + 1, by + 1, 0, 0, HH, kind);
          weg(x0 + 1, by, true); weg(x0 + 1, by - 1, true); weg(x0 + 2, by - 1, true);
          weg(x0 + 1, by + 2); for (let x = x0 - 1; x <= x0 + 3; x++) weg(x, by + 3);
          buildSmall('baum', x0, by - 1, CSLOT); buildSmall('laterne', x0 + 2, by, 0); buildSmall('bank', x0, by, 4);
          spots.push({ x0, by, c: [x0 + 1.1, by + 0.9], figs: [[x0 + 0.8, by + 1.4], [x0 + 1.15, by + 0.6], [x0 + 1.0, by - 0.4, HH], [x0 + 2.2, by - 1.0, HH], [x0 + 0.4, by + 2.9]], car: [x0 + 0.85, by + 0.85] });
        } else if (n === 1) {                                            // B: 3 × 4, Rampe über zwei Felder (vorn halbe Höhe)
          hills(x0, x0 + 2, by - 2, by + 1, (x, y) => x === x0 + 1 && (y === by + 1 || y === by));
          ramp(x0 + 1, by + 1, 0, 0, HH / 2, kind); ramp(x0 + 1, by, 0, HH / 2, HH, kind, { prev: true });
          weg(x0 + 1, by - 1, true); weg(x0 + 2, by - 1, true);
          weg(x0 + 1, by + 2); for (let x = x0 - 1; x <= x0 + 3; x++) weg(x, by + 3);
          buildSmall('baum', x0, by - 2, CSLOT); buildSmall('baum', x0 + 2, by - 2, CSLOT); buildSmall('laterne', x0 + 2, by, 0); buildSmall('bank', x0, by - 1, 4);
          spots.push({ x0, by, c: [x0 + 1.1, by + 0.4], figs: [[x0 + 0.8, by + 1.3], [x0 + 1.05, by + 0.0], [x0 + 1.0, by - 0.9, HH], [x0 + 2.4, by - 1.1, HH], [x0 + 0.4, by + 2.9]], car: [x0 + 0.88, by + 0.6] });
        } else if (n === 2) {                                            // C: links Anhöhe, rechts offen (Keil mit Geländer)
          hills(x0, x0 + 2, by - 1, by); hills(x0, x0, by + 1, by + 1);
          ramp(x0 + 1, by + 1, 0, 0, HH, kind, { rail: true });
          weg(x0 + 1, by, true); weg(x0 + 1, by - 1, true); weg(x0 + 2, by - 1, true);
          weg(x0 + 1, by + 2); for (let x = x0 - 1; x <= x0 + 3; x++) weg(x, by + 3);
          buildSmall('baum', x0, by - 1, CSLOT); buildSmall('laterne', x0 + 2, by, 0); buildSmall('bank', x0, by, 4);
          spots.push({ x0, by, c: [x0 + 1.2, by + 0.9], figs: [[x0 + 0.95, by + 1.25], [x0 + 1.05, by + 0.7], [x0 + 1.0, by - 0.4, HH], [x0 + 2.2, by - 1.0, HH], [x0 + 2.4, by + 2.9]] });
        } else {                                                         // D: längs der vorderen Wand, oben ein vorspringendes Feld
          hills(x0, x0 + 3, by - 1, by + 1); hills(x0, x0, by + 2, by + 2);
          ramp(x0 + 2, by + 2, 3, 0, HH / 2, kind); ramp(x0 + 1, by + 2, 3, HH / 2, HH, kind, { prev: true });
          weg(x0, by + 2, true); weg(x0, by + 1, true); weg(x0, by, true); weg(x0 + 1, by, true); weg(x0 + 2, by, true);
          weg(x0 + 3, by + 2); for (let x = x0 - 1; x <= x0 + 5; x++) weg(x, by + 3);
          buildSmall('baum', x0 + 3, by - 1, CSLOT); buildSmall('baum', x0 + 1, by - 1, CSLOT); buildSmall('laterne', x0 + 1, by + 1, 0); buildSmall('bank', x0 + 3, by, 6);
          spots.push({ x0, by, c: [x0 + 1.6, by + 1.4], figs: [[x0 + 2.25, by + 2.0], [x0 + 1.25, by + 1.95], [x0 + 0.05, by + 1.6, HH], [x0 + 1.6, by - 0.05, HH], [x0 + 3.6, by + 2.9]], car: [x0 + 1.75, by + 1.9] });
        }
      });
    } finally { window.fail = of; }
    state.paintNew.anhoehe = {}; recalc(); groundVersion++; floats.length = 0; if (typeof gameHour !== 'undefined') gameHour = () => 12;
    base = { spots };
    return errs;
  }

  // Höhe auf einer Rampe an Weltpunkt (u, v) – für Figuren und Fahrzeug
  const rampH = (u, v) => {
    const x = Math.round(u), y = Math.round(v), R = RAMPS.get(x + ',' + y), t = state.tiles.get(x + ',' + y);
    if (!R || !t) return 0;
    const [Du, Dv] = STAIR_UP[(t.rot || 0) & 3], d = (u - x) * Du + (v - y) * Dv;
    return R.h0 + (R.h1 - R.h0) * (d + 0.5);
  };
  const fig = (i, u, v, up, now) => {
    const w = { px: u, py: v, up: up != null ? up : rampH(u, v), kind: i % 6, fur: FUR[(i * 3) % FUR.length], shirt: SHIRTS[i % SHIRTS.length], speed: 0.3 + i * 0.07, wait: 0 };
    drawWalker(w, z, now);
  };
  // Fahrzeug wie im Spiel (drawCar: Kasten 0,17 × 0,17 Felder, 3,5 hoch, Kabine obenauf), aber mit dem Boden auf der Rampe: jede Ecke auf
  // der Höhe der Rampe darunter (schräg), Seiten senkrecht
  const car = (u, v, col) => {
    const sb = (r, h0, hh, c) => {                                      // Kasten r × r um (u, v), Fuß h0 über der Rampe, hh hoch
      const at = (a, b, up) => { const p = toScreen(u + a, v + b); return [p.x, p.y - (rampH(u + a, v + b) + up) * z]; };
      const q = [[-r, -r], [r, -r], [r, r], [-r, r]];
      poly([at(-r, r, h0), at(r, r, h0), at(r, r, h0 + hh), at(-r, r, h0 + hh)], C(c));                       // vorn (+v)
      poly([at(r, r, h0), at(r, -r, h0), at(r, -r, h0 + hh), at(r, r, h0 + hh)], C(shade(c, LIGHT.side)));    // rechts (+u)
      poly(q.map(([a, b]) => at(a, b, h0 + hh)), C(shade(c, 0.08)));
    };
    sb(0.086, 0, 3.5, col); sb(0.052, 3.5, 2.5, '#dff1ff');
  };

  function shot(n, cxW, cyW, zz, C, now, up = 0) {
    const s = base.spots[n];
    z = zz;
    const p = iso(cxW, cyW); cam.x = p.x; cam.y = p.y - up; cam.z = z;
    walkers.length = 0; if (Array.isArray(hillWalkers)) hillWalkers.length = 0; critters.length = 0; meFigs.length = 0;   // nur die Figuren des Entwurfs
    spriteNoBudget = true; for (let k = 0; k < 6; k++) render(now + k * 16); spriteNoBudget = false; render(now + 200);
    g = ctx; g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const items = s.figs.map(([u, v, up], i) => [u + v, () => fig(i + n * 2, u, v, up, now)]);   // von hinten nach vorn
    if (s.car) items.push([s.car[0] + s.car[1], () => car(s.car[0], s.car[1], '#e8604f')]);
    items.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
    const comp = document.createElement('canvas'); comp.width = C; comp.height = C;
    const c2 = comp.getContext('2d'); c2.fillStyle = '#fffaf0'; c2.fillRect(0, 0, C, C);
    if (typeof GL !== 'undefined' && GL.shown) c2.drawImage(GL.canvas, canvas.width / 2 - C / 2, canvas.height / 2 - C / 2, C, C, 0, 0, C, C);
    c2.drawImage(canvas, canvas.width / 2 - C / 2, canvas.height / 2 - C / 2, C, C, 0, 0, C, C);
    return comp;
  }
  const post = async (name, cv) => { try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: cv.toDataURL('image/png') }); return await r.text(); } catch (e) { return 'kein Sammler'; } };

  window.rampeSetup = setup;
  window.rampeBild = async (name = 'rampe-varianten.png', zz = 2.2, C = 1000) => {
    const errs = setup();
    const sheet = document.createElement('canvas'); sheet.width = C * 2 + 30; sheet.height = C * 2 + 120;
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    patched(() => {
      for (let n = 0; n < 4; n++) {
        const s = base.spots[n], comp = shot(n, s.c[0], s.c[1], zz, C, performance.now());
        const X = (n % 2) * (C + 30), Y = Math.floor(n / 2) * (C + 60) + 55;
        sx.drawImage(comp, X, Y);
        sx.font = '800 34px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${VARS[n][0]}  ${VARS[n][1]}`, X + 10, Y - 14);
      }
    });
    return [await post(name, sheet), errs];
  };
  window.rampeNah = async (n, u, v, name, zz = 5, C = 900, up = 0) => {
    if (!base) setup();
    const s = base.spots[n];
    let comp;
    patched(() => { comp = shot(n, s.x0 + u, s.by + v, zz, C, performance.now(), up); });
    return post(name, comp);
  };
  // Ausschnitt als Leinwand (Mitte = Punkt u, v in Höhe up) – zum Nachmessen einzelner Bildpunkte
  window.rampeShot = (n, u, v, zz = 8, C = 400, up = 0) => { if (!base) setup(); const s = base.spots[n]; return patched(() => shot(n, s.x0 + u, s.by + v, zz, C, performance.now(), up)); };
  // mehrere Nahaufnahmen als ein Bogen: list = [[n, u, v, höhe, Beschriftung], …]
  window.rampeNahBogen = async (list, name, zz = 7, C = 700, cols = 3) => {
    if (!base) setup();
    const rows = Math.ceil(list.length / cols), sheet = document.createElement('canvas');
    sheet.width = cols * (C + 20); sheet.height = rows * (C + 60);
    const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
    patched(() => list.forEach(([n, u, v, up, label], i) => {
      const s = base.spots[n], comp = shot(n, s.x0 + u, s.by + v, zz, C, performance.now(), up);
      const X = (i % cols) * (C + 20), Y = Math.floor(i / cols) * (C + 60) + 45;
      sx.drawImage(comp, X, Y);
      sx.font = '800 28px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(label, X + 8, Y - 12);
    }));
    return post(name, sheet);
  };
  return 'ok';
})();
