'use strict';
// ---------------------------------------------------------------------------
// Bot-Simulation (Block 62): zwei Spieler spielen im echten Spielcode bis zum Laternenfest.
//   'normal'  – baut gemischt: je Gebäudeart nur ein paar (mehr mit jeder Laterne), Häuser mit Weg und Blumen, etwas Deko
//   'spammer' – steckt alles in das, was sich am schnellsten abbezahlt, ohne Obergrenze
// Beide kaufen Laternen, Inseln (Steg + Boot), Forschung und Hausausbau, sobald es geht, und bauen Schulen für Ideen
// und Rohstoff-Betriebe für das Material, das gerade fehlt. Gleiche Regeln, gleiche Karte – nur die Bau-Strategie
// unterscheidet sich. Läuft nur auf Wunsch: SIM=1 npx vitest run tests/sim-bots.test.js
// ---------------------------------------------------------------------------
function simRun(strategy, opts = {}) {
  const maxT = (opts.hours || 20) * 3600, DT = opts.dt || 10, DECIDE = opts.decide || 60;
  startNew(); closeModal(); closePanel();
  state.tutorial = -1; state.tipsOff = true; QUIET = true;
  recalc();
  const out = { strategy, events: [], samples: [], counts: {} };
  let simT = 0, arrive = null;
  const inc = () => T.inc * boostMul('inc') + (saleRate || 0);
  const ev = (kind, name) => out.events.push({ t: simT, kind, name, inc: Math.round(inc()), lanterns: lanternCount(), pop: T.pop });
  const count = b => { let n = 0; for (const t of state.tiles.values()) if (t.b === b) n++; return n; };
  // eigenes Land (alle Felder der eigenen Inseln), in fester, gemischter Reihenfolge
  let land = [], landAt = 0;
  const refreshLand = () => {
    land = [];
    for (const c of state.owned) { const [cx, cy] = c.split(',').map(Number);
      for (let y = cy * CHUNK; y < cy * CHUNK + CHUNK; y++) for (let x = cx * CHUNK; x < cx * CHUNK + CHUNK; x++) if (!isSea(x, y) && terrainAt(x, y) !== 'water') land.push([x, y]); }
    land.sort((p, q) => hash(p[0], p[1], 77) - hash(q[0], q[1], 77));
  };
  refreshLand();
  // freier Platz für b (ohne Roden, nicht auf Wege); near: bevorzugt nahe an diesem Feld
  const spotFor = (b, tries = 160, near = null) => {
    const list = near ? land.filter(([x, y]) => Math.abs(x - near[0]) + Math.abs(y - near[1]) <= 3) : land;
    for (let i = 0; i < Math.min(tries, list.length); i++) {
      const [x, y] = list[(landAt + i) % list.length];
      if (COVER.has(x + ',' + y)) continue;
      const rot = placeRot(b, x, y), err = placeError(b, x, y, rot);   // Geld, Material, Einwohner, Strom prüft der Bot selbst
      if ((!err || /^Zu wenig|fehlt noch|Einwohner|Strom/.test(err)) && !clearCost(b, x, y, rot)) { if (!near) landAt = (landAt + i + 1) % list.length; return [x, y]; }
    }
    return null;
  };
  // Steg: ins Meer direkt an die Küste
  const seaSpot = b => {
    for (const [x, y] of land) for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if ((isSea(nx, ny) || terrainAt(nx, ny) === 'water') && !COVER.has(nx + ',' + ny) && !placeError(b, nx, ny, placeRot(b, nx, ny))) return [nx, ny];
    }
    return null;
  };
  // Paket: das Gebäude und was es braucht (Häuser für Mitarbeiter, Windräder für Strom)
  const plan = (b, tries) => {
    const d = ITEMS[b], acts = [];
    const free = T.pop - T.jobs, need = Math.max(0, (d.workers || 0) - free);
    for (let i = 0; i < Math.ceil(need / 4); i++) { const sp = spotFor('haus'); if (!sp) return null; acts.push(['haus', ...sp]); }
    const pw = CONSUMERS[b] || 0, left = T.rail && T.rail.power ? T.rail.power.left : 0;
    if (pw && left < pw && available('windrad')) for (let i = 0; i < Math.ceil(pw - left); i++) { const sp = spotFor('windrad'); if (!sp) return null; acts.push(['windrad', ...sp]); }
    const spot = spotFor(b, tries);
    if (!spot || acts.some(([, x, y]) => x === spot[0] && y === spot[1])) return null;
    acts.push([b, ...spot]);                                            // zuerst Häuser und Strom, dann das Gebäude
    return acts;
  };
  const priceOf = acts => acts.reduce((s, [b]) => s + ITEMS[b].cost, 0);
  // Probebauen: was bringt es? Danach alles zurück
  const trial = acts => {
    const m0 = state.money, r0 = { ...state.res }, keys = [], val = () => T.inc * boostMul('inc') + (T.salesInc || 0), i0 = val();
    state.money = 1e15;
    for (const [b, x, y] of acts) { if (!build(b, x, y, true)) break; keys.push(x + ',' + y); }
    const ok = keys.length === acts.length;
    recalc();
    const gain = val() - i0;
    for (const k of keys) state.tiles.delete(k);
    state.money = m0; state.res = r0;
    rebuildCover(); recalc();
    return ok ? gain : null;
  };
  const doActs = acts => { for (const [b, x, y] of acts) if (!build(b, x, y, true)) return false; const m = acts[acts.length - 1][0]; out.counts[m] = (out.counts[m] || 0) + 1; return true; };
  const INCOME_CATS = new Set(['bau', 'laden', 'kultur', 'markt']);
  const NO = new Set(['leuchtturm', 'reihenhaus', 'baumhaus', 'hausboot', 'kristallmine', 'holz', 'stein', 'mine', 'obst', 'saege', 'steinmetz', 'schmiede']);
  const capOf = b => strategy === 'spammer' || b === 'haus' ? Infinity : 2 + Math.floor(lanternCount() / 2);
  // nächstes Ziel: billigste Laterne, die gerade geht, sonst die nächste Insel
  const goalCost = () => {
    let best = Infinity;
    for (const type of Object.keys(LM_STAGES)) { const i = restoreInfo(type); if (i.next && i.pos && isleOpen(ISLE_OF_LM[type] || 'home')) best = Math.min(best, i.money); }
    const isle = nextIsle();
    if (isle && !isle.far) best = Math.min(best, isleMoney(isle));
    return best;
  };
  const MAT_SRC = { bretter: ['saege', 'holz'], holz: ['holz'], quader: ['steinmetz', 'stein'], stein: ['stein'], metall: ['schmiede', 'mine'], erz: ['mine'], kristall: ['kristallmine'], obst: ['obst'] };
  function decide() {
    // 1. Laternen
    for (let again = true; again;) {
      again = false;
      for (const type of Object.keys(LM_STAGES)) {
        const i = restoreInfo(type);
        if (i.next && !i.err && restoreLandmark(type)) { closeModal(); ev('laterne', lmStepName(type, state.restore[type])); again = true; }
      }
    }
    // 2. Leuchtturm → Fest
    if (lanternCount() >= ITEMS.leuchtturm.lanterns && available('leuchtturm') && state.money >= ITEMS.leuchtturm.cost) {
      let a = plan('leuchtturm', 4000);
      if (!a) {                                                   // Küste zugebaut: ein paar Felder/Fischer am Ufer abreißen
        let n = 0;
        for (const [x, y] of land) {
          if (n >= 12) break;
          const t = state.tiles.get(x + ',' + y);
          if (t && (t.b === 'feld' || t.b === 'fischer') && DIRS.some(([dx, dy]) => isSea(x + dx, y + dy))) { demolish(x, y); n++; }
        }
        rebuildCover(); recalc();
        a = plan('leuchtturm', 4000);
      }
      if (a && state.money >= priceOf(a) && doActs(a)) { closeModal(); ev('fest', 'Leuchtturm'); return; }
      if (!out.lhTry) { out.lhTry = true; ev('leuchtturm-versuch', a ? 'Platz da' : 'kein Platz'); }
    }
    // 3. Inseln: Steg, Boot
    const isle = nextIsle();
    if (isle && !isle.far && !state.expedition) {
      if (!stegs().length) { const s = seaSpot('bootssteg'); if (s) build('bootssteg', s[0], s[1], true); }
      if (!expeditionError(isle) && sendExpedition()) { arrive = simT + expMinutes(isle) * 60; ev('boot', isle.name); }
    }
    // 4. Forschung (die billigste, die geht) und Ideen-Gebäude
    for (let again = true; again;) {
      again = false;
      const tch = TECHS.filter(t => !hasTech(t.id) && techReady(t) && state.science >= techCost(t)).sort((a, b) => techCost(a) - techCost(b))[0];
      if (tch) { research(tch.id); closeModal(); ev('forschung', tch.name); again = true; }
    }
    for (const [b, n] of [['schule', 2], ['bibliothek', 1], ['uni', 1]]) if (available(b) && count(b) < n && state.money >= ITEMS[b].cost * 1.2) { const a = plan(b); if (a && state.money >= priceOf(a)) doActs(a); }
    // 5. Häuser ausbauen
    for (const [k, t] of [...state.tiles]) if (t.b === 'haus') { const [x, y] = keyXY(k), w = houseWishes(t, x, y); if (w.ready && w.next && state.money >= houseCost(w.next).money && !matError(w.next.mat)) houseUpgrade(x, y, true); }
    // 6. Material, das für die nächste Laterne fehlt: Rohstoff-Betriebe
    for (const type of Object.keys(LM_STAGES)) {
      const i = restoreInfo(type);
      if (!i.next || !i.pos) continue;
      for (const [r, n] of Object.entries(i.mat || {})) if (state.res[r] < n) for (const b of MAT_SRC[r] || []) {
        if (!available(b) || count(b) >= 1 + Math.floor(lanternCount() / 3)) continue;
        const a = plan(b); if (a && state.money >= priceOf(a)) doActs(a);
      }
    }
    // 7. Einkommen: bestes Verhältnis Mehr-Einkommen/Preis, solange es sich vor dem nächsten Ziel abbezahlt
    for (let n = 0; n < 12; n++) {
      const goal = goalCost(), wait = Math.max(0, goal - state.money) / Math.max(1, inc());
      let best = null;
      for (const b of Object.keys(ITEMS)) {
        const d = ITEMS[b];
        if (!INCOME_CATS.has(d.cat) || NO.has(b) || d.far || !available(b) || count(b) >= capOf(b) || d.cost > state.money) continue;
        const a = plan(b);
        if (opts.debug && (out.dbg = out.dbg || []).length < 40) out.dbg.push(['plan', simT, b, JSON.stringify(a)]);
        if (!a) continue;
        const price = priceOf(a);
        if (price > state.money) continue;
        const gain = trial(a);
        if (opts.debug && out.events.length < 1 && (out.dbg = out.dbg || []).length < 60) out.dbg.push([simT, b, price, gain, JSON.stringify(a)]);
        if (!gain || gain <= 0) continue;
        const pay = price / gain;
        if (!best || pay < best.pay) best = { a, pay, price };
      }
      if (!best || best.pay > Math.max(180, wait) || !doActs(best.a)) break;
    }
    // 8. Normal: Häuser bekommen Weg und Blumen, dazu etwas Deko (ein Teil des Geldes geht in Schönes)
    if (strategy === 'normal') {
      let budget = state.money * 0.15;
      for (const [k, t] of [...state.tiles]) {
        if (t.b !== 'haus' || budget < 60) continue;
        const [x, y] = keyXY(k);
        if (!houseWishes(t, x, y).list.some(w => !w.ok)) continue;
        for (const b of ['weg', 'blumen']) { const s = spotFor(b, 40, [x, y]); if (s && build(b, s[0], s[1], true)) budget -= ITEMS[b].cost; }
      }
    }
  }
  let nextDecide = 0, nextSample = 0;
  while (simT < maxT && !state.festival) {
    earn(DT); state.science += T.sci * boostMul('sci') * DT; produce(DT); peakTick(DT);
    floats.length = 0; sparkles.length = 0; confetti.length = 0;            // Effekte räumt sonst die Zeichenschleife ab
    simT += DT;
    if (arrive != null && simT >= arrive) { const id = state.expedition && state.expedition.isle; state.expedition = null; arrive = null; if (id) { discoverIsland(id); closeModal(); refreshLand(); ev('insel', ISLE_BY_ID[id].name); } }
    if (simT >= nextDecide) { decide(); recalc(); nextDecide = simT + DECIDE; }
    if (simT >= nextSample) { out.samples.push({ t: simT, inc: Math.round(inc()), money: Math.round(state.money), lanterns: lanternCount(), pop: T.pop, tiles: state.tiles.size }); nextSample = simT + 600; }
  }
  out.end = { t: simT, festival: state.festival, inc: Math.round(inc()), lanterns: lanternCount(), pop: T.pop, peak: Math.round(state.incPeak || 0) };
  QUIET = false;
  return out;
}
