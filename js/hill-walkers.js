'use strict';
// ---------------------------------------------------------------------------
// Spaziergänger auf Anhöhen (Block 157d): kommen von einem nahen Weg zum Fuß einer Hügeltreppe oder Rampe (Stufe 2), steigen hinauf, bummeln
// oben (Raster 1/3 Feld wie die Leute auf dem Dach: nur gleich hohe Anhöhe, Wiese oder Weg, nicht in Deko, nicht durch Linien, Abstand zur
// Kante), setzen sich gern auf eine Bank und gehen wieder hinunter und weg. Gezeichnet wie alle Bewohner mit dem Feld, auf dem sie stehen
// (render.js byTile): w.up ist die Höhe über diesem Feld – oben 0 (das Feld hebt sie an), auf Treppe/Rampe ihre Höhe, am Boden null
// (dann gelten Brücken, Treppen und Rampen wie bei allen: figUp in movers.js). So bleibt die Höhe beim Übergang Treppe → oben stetig.
// Aufgang w.stair (hwStairs): { k: Ding, x, y: Fuß, dx, dy: hinauf, rot, len (Treppe 1), ramp, tx, ty: oberes Feld } aus hillStairs() und
// hillRamps() (hills.js); d = −½ Vorderkante des Fußes … len − ½ oberes Ende
// ---------------------------------------------------------------------------
const hillWalkers = [], HW_MAX = 16;
const HW_EDGE = 0.2;              // Abstand der Rasterpunkte zur Kante: die äußeren Punkte (1/6 vor einer Wand oder Linie) fallen weg
const HW_TOP = 2 / 3;             // d am Ausstieg: Rasterpunkt ein Drittel Feld hinter dem oberen Ende der Treppe
const HW_REACH = 8;               // so weit (Schritte) suchen sie den Weg, von dem sie kommen
let hwCache = { ver: '' };
function hwFresh() {
  const v = groundVersion + ':' + state.hills.size + ':' + state.tiles.size + ':' + state.decos.size;
  if (hwCache.ver !== v || hwCache.st !== state) {
    const upAt = new Map();                                              // oberes Feld → Aufgang (Treppe: ihr Feld)
    if (typeof hillStairs === 'function') for (const s of hillStairs()) upAt.set(s.k, { ...s, len: 1, ramp: false, tx: s.x, ty: s.y });
    if (typeof hillRamps === 'function') for (const r of hillRamps()) upAt.set(r.top.join(), { k: r.k, x: r.foot[0], y: r.foot[1], dx: r.dx, dy: r.dy, rot: r.rot, len: r.len, ramp: true, tx: r.top[0], ty: r.top[1] });
    hwCache = { ver: v, st: state, upAt, spots: new Map(), groups: new Map(), stairs: null, benches: null };
  }
  return hwCache;
}
// Feld oben begehbar: Anhöhe dieser Ebene, Wiese ohne etwas darauf (kein Wald, Fels, große Deko, Platz-Ding) oder ein Weg (Stufe 2)
const hwTileOk = (x, y, lv) => { if (hillLevel(x, y) !== lv) return false; const t = objAt(x, y); return t ? t.b === 'weg' : terrainAt(x, y) === 'grass'; };
// über eine Seite weiter: gleich hohe Anhöhe ohne Linie dazwischen – oder das obere Feld einer Treppe/Rampe, die hierher führt
function hwSideOk(x, y, nx, ny, lv) {
  if (hwTileOk(nx, ny, lv)) return !edgeBlocks(x, y, nx, ny);
  const s = hwFresh().upAt.get(nx + ',' + ny);
  return !!s && s.tx + s.dx === x && s.ty + s.dy === y;
}
// Deko (auch auf den Nachbarfeldern und an Eckpunkten) näher als ihr Umriss + m am Punkt (u, v)?
function hwDecoNear(u, v, x, y, m) {
  for (let ty = y - 1; ty <= y + 1; ty++) for (let tx = x - 1; tx <= x + 1; tx++) {
    const ds = decosAt(tx + ',' + ty);
    if (!ds) continue;
    for (let i = 0; i < ds.length; i++) {
      const d = ds[i];
      if (!d) continue;
      const [su, sv] = slotPos(tx, ty, i, d), [ru, rv] = decoExt(d);
      if (Math.abs(tx + su - u) < ru + m && Math.abs(ty + sv - v) < rv + m) return true;
    }
  }
  return false;
}
// Rasterpunkt (a/3, b/3) oben begehbar (Ebene lv)?
function hwSpotOk(a, b, lv) {
  const c = hwFresh(), key = a + ',' + b + ',' + lv;
  if (c.spots.has(key)) return c.spots.get(key);
  const u = a / 3, v = b / 3, x = Math.round(u), y = Math.round(v), ou = u - x, ov = v - y;
  const su = Math.abs(ou) > 0.5 - HW_EDGE ? Math.sign(ou) : 0, sv = Math.abs(ov) > 0.5 - HW_EDGE ? Math.sign(ov) : 0;
  let ok = hwTileOk(x, y, lv);
  if (ok && su) ok = hwSideOk(x, y, x + su, y, lv);
  if (ok && sv) ok = hwSideOk(x, y, x, y + sv, lv);
  if (ok && su && sv) ok = hwTileOk(x + su, y + sv, lv) || c.upAt.has((x + su) + ',' + (y + sv));   // Ecke: auch das Feld schräg davor
  if (ok) ok = !hwDecoNear(u, v, x, y, 0.08);
  c.spots.set(key, ok);
  return ok;
}
// Schritt zum Nachbarpunkt: nicht mitten durch eine Deko zwischen den beiden Punkten
const hwPassOk = (a, b, a2, b2) => { const u = (a + a2) / 6, v = (b + b2) / 6; return !hwDecoNear(u, v, Math.round(u), Math.round(v), 0.03); };
// Treppen und Rampen, auf denen man hinaufkommt (oben Platz zum Aussteigen), mit ihrer Anhöhe (G: zusammenhängende Felder gleicher Ebene)
function hwStairs() {
  const c = hwFresh();
  if (c.stairs) return c.stairs;
  const out = [];
  for (const s0 of c.upAt.values()) {
    const b0 = hillLevel(s0.x, s0.y), lv = b0 + 1, hx = s0.tx + s0.dx, hy = s0.ty + s0.dy;
    if (hillLevel(hx, hy) !== lv) continue;
    const s = { ...s0, b0, lv, ea: 3 * hx - s0.dx, eb: 3 * hy - s0.dy };   // Ausstieg: Rasterpunkt oben, ein Drittel Feld hinter dem oberen Ende
    if (!hwSpotOk(s.ea, s.eb, lv) || !DIRS.some(([dx, dy]) => hwSpotOk(s.ea + dx, s.eb + dy, lv) && hwPassOk(s.ea, s.eb, s.ea + dx, s.eb + dy))) continue;
    let G = c.groups.get(hx + ',' + hy);
    if (!G) { const tiles = hillGroup(hx, hy); G = { n: tiles.length, stairs: [], live: [], want: 0 }; for (const [tx, ty] of tiles) c.groups.set(tx + ',' + ty, G); }
    G.stairs.push(s); s.G = G;
    out.push(s);
  }
  return (c.stairs = out);
}
// Bänke oben (Ebene lv): Sitzplatz, Feld und Platz – Rundbank und Picknicktisch haben keinen Platz in der Mitte (wie im Park)
function hwBenches(lv) {
  const c = hwFresh();
  if (!c.benches) c.benches = new Map();
  if (c.benches.has(lv)) return c.benches.get(lv);
  const out = [];
  for (const [k, ds] of state.decos) {
    const [x, y] = keyXY(k);
    if (hillLevel(x, y) !== lv) continue;
    ds.forEach((d, i) => {
      if (!d || d.b !== 'bank' || i === VSLOT || ['rund', 'picknick'].includes(lookForm('bank', d))) return;
      const [su, sv] = slotPos(x, y, i, d);
      out.push({ u: x + su, v: y + sv, k, i, key: k + ':' + i });
    });
  }
  c.benches.set(lv, out);
  return out;
}
// freie Bank nah am Rasterpunkt (höchstens 0,45 Feld, gleich hoch)
function hwBench(w) {
  const u = w.fa / 3, v = w.fb / 3;
  let best = null, bd = 0.45;
  for (const b of hwBenches(w.stair.lv)) {
    const d = Math.hypot(b.u - u, b.v - v);
    if (d < bd && !hillWalkers.some(o => o !== w && o.bench && o.bench.key === b.key)) { bd = d; best = b; }
  }
  return best;
}
const hwBenchThere = b => { const ds = b && decosAt(b.k); return !!ds && !!ds[b.i] && ds[b.i].b === 'bank'; };

// Weg zur Treppe (wie rfWalkIn): von einem Weg in der Nähe (sonst Wiese, 2–6 Schritte) über den Boden bis aufs Feld vor dem Fuß, dann an
// den Fuß (Mitte der Vorderkante). Unten bleiben: auf der Ebene des Fußes, nicht über andere Treppen und Rampen. Punkte in
// Feldkoordinaten; null, wenn man nicht hinkommt
const hwIsWay = (x, y) => { const t = objAt(x, y); return !!t && (t.b === 'weg' || isCrossing(t)); };
function hwWalkIn(s) {
  const fx = s.x - s.dx, fy = s.y - s.dy, lv = hillLevel(s.x, s.y), flat = (x, y) => hillLevel(x, y) === lv && !slopeAt(x, y);
  if (!walkable(fx, fy) || !flat(fx, fy) || edgeBlocks(fx, fy, s.x, s.y)) return null;
  const prev = new Map([[fx + ',' + fy, null]]), dist = new Map([[fx + ',' + fy, 0]]), q = [[fx, fy]], ways = [], grass = [];
  for (let i = 0; i < q.length && i < 500; i++) {
    const [x, y] = q[i], k = x + ',' + y, d0 = dist.get(k);
    if (d0 >= 2) (hwIsWay(x, y) ? ways : d0 <= 6 ? grass : []).push(k);
    if (d0 >= HW_REACH) continue;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, nk = nx + ',' + ny;
      if (dist.has(nk) || !walkable(nx, ny) || !flat(nx, ny) || edgeBlocks(x, y, nx, ny)) continue;
      dist.set(nk, d0 + 1); prev.set(nk, k); q.push([nx, ny]);
    }
  }
  const pool = ways.length ? ways : grass;
  if (!pool.length) return null;
  const path = [];
  for (let k = pool[Math.floor(Math.random() * pool.length)]; k; k = prev.get(k)) path.push(keyXY(k));
  path.push([s.x - s.dx * 0.5, s.y - s.dy * 0.5]);
  return path;
}

function syncHillWalkers() {
  if (!hillWalkers.length && !(state.hills && state.hills.size)) return;   // ohne Anhöhen: nichts (wie vorher)
  const stairs = state.hills && state.hills.size && typeof T !== 'undefined' && T.pop ? hwStairs() : [];
  const byK = new Map(stairs.map(s => [s.k, s]));
  for (const w of hillWalkers) {                                         // Treppe weg oder gedreht, anderer Stand: verschwinden
    const s = byK.get(w.stair.k);
    if (w.st0 !== state || !s || s.rot !== w.stair.rot || s.len !== w.stair.len || s.ramp !== w.stair.ramp) w.gone = true; else w.stair = s;
  }
  if (!stairs.length) return;
  // je Anhöhe nach ihrer Größe (mehr Treppen, etwas mehr Leute), alle zusammen höchstens HW_MAX, nachts halb so viele
  const groups = new Set(stairs.map(s => s.G));
  let want = 0;
  for (const G of groups) { G.want = Math.min(2 + 2 * G.stairs.length, 1 + Math.floor(G.n / 4)); G.live = []; want += G.want; }
  want = Math.min(HW_MAX, want) >> (typeof dayPart === 'function' && dayPart() === 'nacht' ? 1 : 0);
  for (const w of hillWalkers) if (!w.gone && !w.leave && w.st !== 'down' && w.st !== 'out') w.stair.G.live.push(w);
  for (const G of groups) for (let i = G.want; i < G.live.length; i++) G.live[i].leave = true;   // Anhöhe kleiner geworden
  const live = hillWalkers.filter(w => !w.gone && !w.leave && w.st !== 'down' && w.st !== 'out');
  for (let i = want; i < live.length; i++) live[i].leave = true;                                // zu viele: gehen wieder hinunter
  if (live.length >= want) return;
  const open = stairs.filter(s => s.G.live.filter(w => !w.leave).length < s.G.want);
  if (!open.length) return;
  const s = open[Math.floor(Math.random() * open.length)], path = hwWalkIn(s);
  if (!path) return;
  const homes = [...state.tiles].filter(([, t]) => isHome(t.b) && t.animal), [hk, ht] = homes.length ? homes[Math.floor(Math.random() * homes.length)] : [null, null];
  hillWalkers.push({ hillw: true, st0: state, stair: s, st: 'in', path, pi: 0, px: path[0][0], py: path[0][1], up: null, wait: 0, lane: (Math.random() - 0.5) * 0.24,
    ...(hk ? residentLook(hk, Math.floor(Math.random() * residentsOf(ht).length)) : { kind: Math.floor(Math.random() * 3), fur: FUR[Math.floor(Math.random() * FUR.length)] }),
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)], speed: 0.35 + Math.random() * 0.25, life: 20 + Math.random() * 30 });
}
// Lage setzen: h = Höhe über dem Boden (Bildpunkte bei Zoom 1); w.up = Höhe über dem Feld, auf dem die Figur gezeichnet wird
function hwPut(w, u, v, h) { w.px = u; w.py = v; w.up = h - hillLift(Math.round(u), Math.round(v)); }
// Stufenhöhe dort, wo die Füße gezeichnet werden: drawWalker setzt Figuren 6 Punkte (Zoom 1) rechts neben ihre Lage, das sind längs der
// Treppe (dx − dy)·3/32 Feld – mit der Höhe der Lage stünden sie sonst halb vor bzw. in der nächsten Stufe. Oberste Stufe = Oberkante
const hwFootD = (s, d) => Math.max(-0.5, Math.min(0.5 - 1e-6, d + (s.dx - s.dy) * 3 / 32));
const hwStepH = (s, d) => stairHeight(s.x, s.y, s.x + s.dx * d, s.y + s.dy * d);
// Rampe: Höhe am gezeichneten Fußpunkt, stetig von der Vorderkante des Fußes (0) bis zum oberen Ende (HILL_H), darüber hinaus waagerecht
const hwRampH = (s, d) => HILL_H * Math.max(0, Math.min(1, (d + (s.dx - s.dy) * 3 / 32 + 0.5) / s.len));
const hwEnd = s => s.len - 0.5;                                         // d am oberen Ende der Treppe/Rampe
const hwTopD = s => s.len - 1 + HW_TOP;                                 // d am Ausstieg
const hwUpThere = s => { const t = state.tiles.get(s.k); return s.ramp ? isRamp(t) : isStair(t); };
// auf Treppe/Rampe (d bis zum oberen Ende) und oben bis zum Ausstieg: seitlich versetzt (lane), oben zur Mitte des Ausstiegs
function hwOnStair(w) {
  const s = w.stair, d = w.d, e = hwEnd(s), top = hwTopD(s), lane = w.lane * Math.max(0, Math.min(1, (top - d) / (top - e)));
  hwPut(w, s.x + s.dx * d - s.dy * lane, s.y + s.dy * d + s.dx * lane, s.b0 * HILL_H + (s.ramp ? hwRampH(s, d) : d < e ? hwStepH(s, hwFootD(s, d)) : HILL_H));
}
// am Boden zur Treppe hin bzw. von ihr weg
function hwAlong(w, dt) {
  let step = dt * w.speed;
  while (step > 0 && w.pi < w.path.length - 1) {
    const [tx, ty] = w.path[w.pi + 1];
    if (Number.isInteger(tx) && Number.isInteger(ty) && !walkable(tx, ty, true)) { w.gone = true; return; }   // inzwischen verbaut
    const dx = tx - w.px, dy = ty - w.py, l = Math.hypot(dx, dy);
    if (l <= step) { w.px = tx; w.py = ty; w.pi++; step -= l; } else { w.px += dx / l * step; w.py += dy / l * step; step = 0; }
  }
  w.up = null;
  if (w.pi < w.path.length - 1) return;
  if (w.st === 'in') { w.st = 'up'; w.d = -0.5; hwOnStair(w); } else w.gone = true;
}
// heimwärts: kürzester Weg über die Rasterpunkte zum Ausstieg (Breitensuche, dann folgen); null, wenn die Anhöhe zu groß zum Suchen ist
// (dann grob in Richtung Ausstieg), false, wenn es sicher keinen gibt (Zaun oder Deko dazwischen)
function hwRoute(w) {
  const s = w.stair, start = w.fa + ',' + w.fb, goal = s.ea + ',' + s.eb, prev = new Map([[start, null]]), q = [[w.fa, w.fb]];
  for (let i = 0; i < q.length; i++) {
    if (prev.size >= 3000) return null;
    const [a, b] = q[i];
    for (const [dx, dy] of DIRS) {
      const na = a + dx, nb = b + dy, nk = na + ',' + nb;
      if (prev.has(nk) || !hwSpotOk(na, nb, s.lv) || !hwPassOk(a, b, na, nb)) continue;
      prev.set(nk, a + ',' + b);
      if (nk === goal) { const out = []; for (let k = nk; k !== start; k = prev.get(k)) out.push(keyXY(k)); return out.reverse(); }
      q.push([na, nb]);
    }
  }
  return false;
}
// zur Bank und wieder zurück zum Rasterpunkt (w.go 'to' | 'back')
function hwBenchWalk(w, dt) {
  const b = w.bench, sp = [w.fa / 3, w.fb / 3];
  if (w.go === 'to' && !hwBenchThere(b)) { w.go = 'back'; w.bt = 1 - w.bt; }   // Bank weg: umkehren
  const [p0, p1] = w.go === 'to' ? [sp, [b.u, b.v]] : [[b.u, b.v], sp], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  w.bt = Math.min(1, w.bt + (L > 1e-6 ? dt * w.speed / L : 1));
  hwPut(w, p0[0] + (p1[0] - p0[0]) * w.bt, p0[1] + (p1[1] - p0[1]) * w.bt, w.stair.lv * HILL_H);
  if (w.bt < 1) return;
  if (w.go === 'to') { w.sit = true; w.sat = true; w.wait = 5 + Math.random() * 7; w.go = 'back'; w.bt = 0; }
  else { w.go = null; w.bench = null; w.ta = w.fa; w.tb = w.fb; w.t = 1; }
}
function hwStep(w, dt) {
  const s = w.stair;
  if (w.st0 !== state) { w.gone = true; return; }
  if (w.wait > 0) {
    w.wait -= dt;
    if (w.sit && !hwBenchThere(w.bench)) w.wait = 0;                    // Bank weg: aufstehen
    if (w.wait <= 0) { w.wait = 0; w.sit = false; }
    return;
  }
  if (w.st === 'in' || w.st === 'out') { hwAlong(w, dt); return; }
  if (w.st === 'up' || w.st === 'down') {
    if (!hwUpThere(s)) { w.gone = true; return; }                       // Treppe/Rampe abgerissen/aufgenommen: nicht bis zum nächsten Abgleich in der Luft stehen
    w.d += (w.st === 'up' ? 1 : -1) * dt * w.speed * 0.8;
    if (w.st === 'down' && w.d <= -0.5) {                               // unten: auf dem Weg, auf dem man kam, wieder hinaus
      w.st = 'out'; w.path = w.path.slice().reverse(); w.pi = 0; [w.px, w.py] = w.path[0]; w.up = null;
      return;
    }
    if (w.st === 'down' || w.d < hwTopD(s)) { hwOnStair(w); return; }
    w.d = hwTopD(s); w.st = 'top'; w.fa = w.ta = s.ea; w.fb = w.tb = s.eb; w.t = 1; w.pa = w.pb = null;
  }
  // oben
  if (hillLevel(Math.round(w.px), Math.round(w.py)) !== s.lv) { w.gone = true; return; }   // Anhöhe darunter abgetragen
  if (w.go) { hwBenchWalk(w, dt); return; }
  w.life -= dt;
  w.t += dt * w.speed * 3;                                              // ein Rasterschritt ist 1/3 Feld
  if (w.t >= 1) {
    w.fa = w.ta; w.fb = w.tb; w.t = 0;
    const out = w.leave || w.life < 0;
    if (out && w.fa === s.ea && w.fb === s.eb) { w.st = 'down'; w.d = hwTopD(s); w.route = null; hwOnStair(w); return; }
    if (!out && Math.random() < 0.3) { const b = hwBench(w); if (b) { w.bench = b; w.go = 'to'; w.bt = 0; hwBenchWalk(w, 0); return; } }
    const cand = DIRS.map(([dx, dy]) => [w.fa + dx, w.fb + dy]).filter(([a, b]) => hwSpotOk(a, b, s.lv) && hwPassOk(w.fa, w.fb, a, b));
    let pool = cand.length > 1 && w.pa != null ? cand.filter(([a, b]) => a !== w.pa || b !== w.pb) : cand;
    if (out) {                                                          // heimwärts: dem Weg zum Ausstieg folgen
      if (!w.route || !w.route.length || !cand.some(([a, b]) => a === w.route[0][0] && b === w.route[0][1])) w.route = hwRoute(w);
      if (w.route === false) { w.gone = true; return; }                 // kein Weg mehr hinunter (Zaun, Deko): verschwinden statt ewig oben zu kreisen
      if (w.route && w.route.length) pool = [w.route.shift()];
      else { const dist = ([a, b]) => Math.abs(a - s.ea) + Math.abs(b - s.eb), m = Math.min(...cand.map(dist)); if (Math.random() < 0.85) pool = cand.filter(c => dist(c) === m); }
    } else if (!w.sat && pool.length > 1 && Math.random() < 0.35) {    // gern zur nächsten Bank (bis man einmal gesessen hat)
      const bs = hwBenches(s.lv), dist = ([a, b]) => Math.min(...bs.map(q => Math.hypot(q.u - a / 3, q.v - b / 3)));
      if (bs.length) { const m = Math.min(...pool.map(dist)); pool = pool.filter(c => dist(c) === m); }
    }
    w.pa = w.fa; w.pb = w.fb;
    if (!pool.length) { w.ta = w.fa; w.tb = w.fb; w.wait = 1; }
    else { [w.ta, w.tb] = pool[Math.floor(Math.random() * pool.length)]; if (!out && Math.random() < 0.1) w.wait = 1 + Math.random() * 2; }
  }
  hwPut(w, (w.fa + (w.ta - w.fa) * w.t) / 3, (w.fb + (w.tb - w.fb) * w.t) / 3, s.lv * HILL_H);
}
// Feld (x, y) abgesenkt (Treppe in die Anhöhe, actions.js build): wer dort oben steht, ist weg (nie in der Luft); wer gerade dorthin
// geht, kehrt um – der nächste Schritt fragt die Rasterpunkte neu (hwFresh)
function hwLowered(x, y) {
  const on = (u, v) => Math.round(u) === x && Math.round(v) === y;
  for (const w of hillWalkers) {
    if (w.st !== 'top' || w.gone) continue;
    if (on(w.px, w.py) || on(w.fa / 3, w.fb / 3) || (w.bench && on(w.bench.u, w.bench.v))) { w.gone = true; continue; }
    if (on(w.ta / 3, w.tb / 3)) { [w.fa, w.fb, w.ta, w.tb] = [w.ta, w.tb, w.fa, w.fb]; w.t = 1 - w.t; w.route = null; w.pa = w.pb = null; }
  }
}
function stepHillWalkers(dt) {
  if (!hillWalkers.length) return;
  for (const w of hillWalkers) if (!w.gone) hwStep(w, dt);
  for (let i = hillWalkers.length - 1; i >= 0; i--) if (hillWalkers[i].gone) hillWalkers.splice(i, 1);
}
// Zeichnen (render.js drawMover): wie alle Bewohner (drawWalker kennt Treppe und Rampe unter der Figur)
function drawHillWalker(w, z, now) { drawWalker(w, z, now); }
// Figur auf der Treppe (x, y) zeichnen (drawWalker, movers.js), d = gezeichneter Fußpunkt längs der Treppe (−½ … ½). Steigt die Treppe zum
// Betrachter hin an (hinauf nach +x/+y), liegt die nächsthöhere Stufe vor den Füßen – die Figur dann nur oberhalb ihrer Kante (auf dem
// Bildschirm), sonst stünde sie vor der Stufe statt dahinter. Danach, was auf dem Treppenfeld davor liegt (vorderer Keil, höhere Stufen),
// aus dem Bildchen noch einmal darüber (drawHillStairOver, hills.js)
function drawOnStair(w, z, now, x, y, d) {
  const [Du, Dv] = STAIR_UP[stairRotOf(stairAt(x, y))], at = e => stairHeight(x, y, x + Du * e, y + Dv * e);
  let edge = null;
  if (Du + Dv > 0) for (let k = 1, h0 = at(d); k <= 20 && d + k * 0.01 < 0.5; k++) {
    const e = d + k * 0.01, h = at(e);
    if (h <= h0 + 0.5) continue;
    const u = x + Du * e, v = y + Dv * e;                                // Kante der nächsten Stufe, quer über die Treppe verlängert
    edge = [toScreen(u + Dv * 2, v - Du * 2), toScreen(u - Dv * 2, v + Du * 2), h * z];   // Höhe über dem Feld der Figur (der Treppe)
    break;
  }
  if (edge) {
    const [p, q, up] = edge;
    g.save(); g.beginPath(); g.moveTo(p.x, p.y - up); g.lineTo(q.x, q.y - up); g.lineTo(q.x, -1e5); g.lineTo(p.x, -1e5); g.closePath(); g.clip();
    try { drawFigure(w, z, now); } finally { g.restore(); }
  } else drawFigure(w, z, now);
  drawHillStairOver(x, y, z, d);
}
