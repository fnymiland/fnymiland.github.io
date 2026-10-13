'use strict';
// ---------------------------------------------------------------------------
// Aktionen
// ---------------------------------------------------------------------------
let tool = 'look';
let menuTop = 'stadt', menuSub = 'wohnen';      // Baumenü: Bereich und Filter
let hover = null;
let hoverChunk = null;
const floats = [];

function fail(msg) { toast(msg); sfx('error'); }

function build(b, x, y, quiet) {
  if (b === 'bruecke') { if (!quiet) fail('Brücke: von der Oberkante einer Anhöhe hinüber zur anderen ziehen'); return false; }   // nur als Ganzes (plan.js scanBruecke)
  if (b === 'anhoehe') {                               // Anhöhe (Block 157): Feld anheben bzw. die Wand umstellen (hills.js)
    const err = quiet && !hillAt(x, y) && hillRaiseError(x, y);
    if (err && err !== 'Zu wenig Taler') return false;                    // im Rechteck still wie die anderen
    return raiseHill(x, y);
  }
  // Umfärben: bestehenden Weg im anderen Stil übermalen
  const k0 = x + ',' + y, old = state.tiles.get(k0);
  if (b === 'schiene' && ownedTile(x, y) && old && old.b === 'schiene') {   // Gleis-Stil (Block 109): übermalen kostet nichts
    const f = decoLookNew('schiene').form || 0;
    if ((old.form || 0) === f) return false;
    if (f) old.form = f; else delete old.form;
    groundVersion++; sfx('road'); save();
    return true;
  }
  if (STYLES[b] && ownedTile(x, y) && old && (old.b === b || (b === 'weg' && isCrossing(old)))) {
    const style = currentStyle(b), shape = b === 'weg' && !old.bridge && !old.cross;            // Wegform (Block 77): umstellen kostet nichts
    const sameStyle = (old.style || 'sand') === style;
    if (sameStyle && (!shape || sameWegShape(old))) return false;
    if (!sameStyle) {
      if (state.money < ITEMS[b].cost) { fail('Zu wenig Taler'); return false; }
      state.money -= ITEMS[b].cost;
      if (isWegBridge(old)) { old.brk = bridgeKind(old); if (old.brk === (BRIDGE_OF_STYLE[style] || 'stein')) delete old.brk; }   // Brücke bleibt, wie sie bezahlt ist
      old.style = style;
      if (old.b === 'weg' && old.lauf == null) old.lauf = wegLaufNew(x, y);   // alter Weg bekommt einen Belag: Richtung wie beim Neubau (Block 158)
    }
    if (shape) applyWegShape(old);
    groundVersion++;
    sfx('road'); save();
    return true;
  }
  if (b === 'dach') {                                  // Überdachung (Block 138): über dem Weg, darunter bleibt alles
    const err = placeError(b, x, y);
    if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
    state.money -= ITEMS.dach.cost; payMat(ITEMS.dach.mat);
    const old = state.roofs.get(k0), nr = { ...decoLookNew('dach') };
    if (roofForm(nr) === 'arkaden') nr.par = 1;                         // neue Steinarkaden: mit Mauer (abschaltbar im Fenster)
    if (old && old.top) { if (roofForm(nr) === 'arkaden') nr.top = old.top; else roofTopClear(old); }   // Deko oben bleibt nur auf Stein (Block 138b)
    state.roofs.set(k0, nr);
    roofDirty(x, y); groundVersion++; sfx('deco'); recalc(); save();   // groundVersion: Schatten im Boden-Bild
    return true;
  }
  if (b === 'tunnel') {                                // Tunnel (Block 136): unter der Oberfläche, oben bleibt alles stehen
    if (state.tunnels.has(k0) && ownedTile(x, y)) return false;           // liegt schon
    const err = placeError(b, x, y);
    if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
    const c = costOf(b, x, y);
    state.money -= c.cost; payMat(c.mat);
    if (!ownedTile(x, y)) claimTile(x, y);
    state.tunnels.set(k0, {});
    groundVersion++; sfx('dig'); recalc(); save();
    return true;
  }
  if (b === 'pb_station' && old && old.b === 'pb_gleis') {           // Station auf ein Stück Parkbahn-Gleis (Block 136): Gleis wird Station
    const err = placeError(b, x, y);
    if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
    const c = costOf(b, x, y);
    state.money -= c.cost - ITEMS.pb_gleis.cost; payMat(c.mat);         // das Gleis ist schon bezahlt
    old.b = 'pb_station'; old.born = performance.now(); Object.assign(old, decoLookNew('pb_station'));
    sfx('build'); recalc(); save();
    return true;
  }
  if (b === 'fz_hoch' || b === 'fz_tief') {          // Höhen-Pinsel (Block 60e): eine Stufe höher bzw. tiefer
    const err = placeError(b, x, y);
    if (err) { if (!quiet) fail(err); return false; }
    const t = state.tiles.get(x + ',' + y);
    t.hgt = Math.max(0, Math.min(COASTER_MAXSTEP, trackLevel(x, y) + (b === 'fz_hoch' ? 1 : -1)));
    if (state.album) state.album.add('b:' + b);                // Album: benutzt (Block 84c)
    recalc(); save();
    return true;
  }
  if (b === 'fz_looping') {                          // Looping auf die Schiene (Block 60c)
    const err = placeError(b, x, y);
    if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
    const c = ITEMS.fz_looping.cost, t = state.tiles.get(x + ',' + y);
    state.money -= c; t.loop = true; t.loopPrice = c;
    sfx('build'); recalc(); save();
    return true;
  }
  if (b === 'weg' && decoOver(x, y)) {                // Weg unter einen Brunnen & Co. legen, ohne die Deko wegzunehmen (Block 58)
    const err = placeError(b, x, y);
    if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
    state.money -= ITEMS.weg.cost;
    wegUnderDeco(x, y, currentStyle('weg'));
    groundVersion++; sfx('road'); recalc(); save();
    return true;
  }
  if (ownedTile(x, y) && crossCandidate(b, x, y)) {    // Weg über Schiene / Schiene über Weg: Bahnübergang
    const err = crossError(b, x, y);
    if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
    const c = costOf(b, x, y);
    state.money -= c.cost; payMat(c.mat);
    if (b === 'weg') { old.cross = true; old.style = currentStyle('weg'); }
    else state.tiles.set(k0, { b: 'schiene', lvl: 1, rot: 0, cross: true, style: old.style || 'sand', born: performance.now() });
    sfx('road'); recalc(); save();
    return true;
  }
  if (b === 'huegeltreppe' && state.hills && state.hills.size && stairAt(x, y)) {   // Treppe auf eine Treppe (hills.js): nur ausrichten, kostenlos
    const e = stairRefitError(x, y);
    if (e) { if (!quiet) fail(e); return false; }
    refitStairs(x, y); sfx('deco'); recalc(); save();
    return true;
  }
  const err = placeError(b, x, y);
  if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
  const d = ITEMS[b], k = x + ',' + y, c = costOf(b, x, y), bridge = (b === 'schiene' || b === 'weg') && terrainAt(x, y) === 'water', rot = placeRot(b, x, y);   // Weg übers Wasser: Brücke (Block 66)
  const covered = d.paint || TERRAFORM[b] || b === 'graben' || b === 'schuett' ? [] : pathsUnder(b, x, y, rot);   // Wege auf dem Bauplatz
  const under = plazaOk(b) ? covered : [], replaced = replacesWeg(b) ? covered : [];   // Deko: Weg bleibt darunter; Gebäude: ersetzt ihn
  const back = b === 'huegeltreppe' ? stairIntoBack(x, y) : b === 'huegelrampe' ? rampIntoBack(x, y, rot) : 0;          // Treppe/Gleis-Rampe A, C in die Anhöhe (hills.js): Felder absenken, Erstattung verrechnet
  for (const [fx, fy] of covered) state.tiles.delete(fx + ',' + fy);
  if (replaced.length) { state.money += replaced.length * ITEMS.weg.cost; if (!quiet) toast(`Weg ersetzt: +${fmt(replaced.length * ITEMS.weg.cost)}`); }
  clearNature(b, x, y, rot);                        // Wald, Fels … auf dem Bauplatz verschwinden (Roden/Sprengen)
  state.money -= c.cost;
  payMat(c.mat);
  claimSea(b, x, y, rot, null, bridge);
  if (b === 'graben') { state.terra.set(k, 'water'); sandCache.clear(); waterChanged(); sfx('dig'); }
  else if (TERRAFORM[b]) {
    const ter = terrainAt(x, y);
    state.terra.set(k, TERRAFORM[b]); sandCache.clear(); landCache.clear(); sfx('dig');
    if (b === 'parkrasen' && (ter === 'forest' || ter === 'obst') && !decosAt(k)) {   // Wald im Park: die Bäume bleiben als Parkbäume
      const ds = newSlots(), n = 1 + Math.floor(hash(x, y, 91) * 2);
      for (const i of [0, 3, 1, 2].slice(0, n)) ds[i] = { b: 'baum', rot: 0, free: true };   // geschenkt: bringt beim Entfernen nichts
      state.decos.set(k, ds);
    }
  }
  else if (b === 'schuett') {
    state.terra.set(k, 'grass'); sandCache.clear(); waterChanged(); sfx('dig');
    const rt = state.tiles.get(k);                 // unter einer Brücke aufgeschüttet: normale Schiene, Unterschied zurück
    if (rt && rt.bridge) {
      const { money, ...mat } = brPaid(rt, rt.b === 'weg' ? 'wasser' : 'gleis');   // was die Brücke gekostet hat (160c A4), Weg-/Schienenpreis bleibt
      delete rt.bridge; delete rt.brk; delete rt.brp; for (const f of BR_KEYS) delete rt[f];   // ganz zur normalen Schiene bzw. zum Weg
      state.money += money - ITEMS[rt.b].cost;
      for (const [r, n] of Object.entries(mat)) state.res[r] += n - ((ITEMS[rt.b].mat || {})[r] || 0);
    }
  } else {
    if (back && b === 'huegelrampe') rampIntoSink(x, y, rot);              // Gleis-Rampe in die Anhöhe (A, C; hills.js): ihre eingelassenen Felder absenken
    else if (back) { hillTake(x, y); hwLowered(x, y); }                   // Spaziergänger: wer dort oben steht, ist weg; wer hinwollte, kehrt um
    const ecke = b === 'huegeltreppe' && stairCornerNew(x, y);        // Ecktreppe (hills.js): zwischen zwei Treppen um die Ecke
    const wbS = bridge && b === 'weg' ? wbNewSpec(x, y) || (L => ({ look: L, zk: null, raw: null, brk: L.kind && WEG_BRIDGE[L.kind] ? L.kind : brFallback('wasser', L.mat).brk }))(brNewLook(x, y, 'wasser')) : null;   // 160c D3: vor dem Setzen (sonst gehört das Feld schon zur Spanne)
    state.tiles.set(k, { b, lvl: 1, born: performance.now(), rot, ...paintNewOf(b), ...(ecke ? { ecke: true } : {}), ...(STYLES[b] ? { style: currentStyle(b) } : {}), ...(b === 'weg' && !bridge ? wegShapeNew() : {}), ...(bridge ? { bridge: true } : {}), ...(d.wonder ? { phase: 0, rate: wonderRate() } : {}), ...(b === 'hbf' ? HBF_NEW : {}), ...(b === 'station' && stationNewLen === 3 ? { len: 3 } : {}) });   // Hbf: Halle in der Mitte (Block 123)
    if (ecke) delete state.tiles.get(k).schmal;                      // Ecktreppen sind immer breit
    if (b === 'huegeltreppe') refitStairs(x, y);                     // Treppen ringsum neu ausrichten (Ecken, hills.js)
    if (wbS) {                                                        // Wasser-Wegbrücke (160c D3): immer im neuen Format, aus dem Aussehen (nie Rohfelder), bezahlt = costOf
      const nt = state.tiles.get(k);
      brWriteLook(nt, wbS.look, wbS.brk, wbS.zk, wbS.raw);
      nt.brp = { ...brPrice(wbS.look, 'wasser'), k: brSig(nt, 'wasser') };
      wbUnify(x, y);                                                  // zwei Brücken wachsen zusammen: angleichen
    } else if (bridge) {                                              // Gleisbrücke verlängern: Aussehen der alten übernehmen (66c; 160c: alle br-Felder, nur Eingeschaltetes)
      const want = b === 'weg' ? isWegBridge : (t => !!t && t.b === 'schiene' && !!t.bridge);
      const nb = DIRS.map(([dx, dy]) => state.tiles.get((x + dx) + ',' + (y + dy))).find(want), nt = state.tiles.get(k);
      if (nb) {
        for (const key of BR_KEYS) if (nb[key] != null && !((key === 'brl' || key === 'brz') && nb[key] !== 'an')) nt[key] = nb[key];
        if (b === 'weg') { if (bridgeKind(nb) !== bridgeKind(nt)) nt.brk = bridgeKind(nb); else delete nt.brk; }
        const at = b === 'weg' ? 'wasser' : 'gleis';
        if (brIsNew(nb, at)) { if (b === 'weg') nt.brk = bridgeKind(nb); brStamp(nt, at, brOnLook(brLook(nb, at))); }   // neues Format: bezahlt, was costOf abgebucht hat (brNewLook)
      }
    }
    if (under.length) setUnder(state.tiles.get(k), x, y, under);
    if (b === 'weg') state.tiles.get(k).lauf = wegLaufNew(x, y);        // Wegrichtung (Block 158): aus der Zugrichtung, sonst wie die Nachbarn
    if (d.fl0) state.tiles.get(k).fl = d.fl0;                       // Torturm: Stockwerke (Block 60f)
    if (b === 'fz_schloss') state.tiles.get(k).cs = csNew();     // Märchenschloss: Gestalt (Block 60g)
    if (baseOf(b) === 'busch') Object.assign(state.tiles.get(k), bushColNew('busch'));   // Buschfarbe (Block 89)
    if (DECO_LOOKS[baseOf(b)]) Object.assign(state.tiles.get(k), decoLookNew(baseOf(b)));   // Form/Farbe (Block 106)
    if (incMinOf(d) || d.baseCost) state.tiles.get(k).price = c.cost;   // Preis nach Einkommen (auch Leuchtturm): fürs Erstatten merken (Block 60/61)
    if (isHome(b)) assignResident(state.tiles.get(k), Math.random, Math.random);
    if (b === 'haus') {                                                  // bunt gemischt – außer „neu gebaute bekommen diese Farben“
      const t = state.tiles.get(k), walls = colorsOf('wall'), roofs = colorsOf('roof');
      if (t.wall == null) t.wall = walls[Math.floor(Math.random() * walls.length)][1];
      if (t.roof == null) t.roof = roofs[Math.floor(Math.random() * roofs.length)][1];
    }
    sfx(d.paint ? 'road' : d.cat === 'deko' ? 'deco' : 'build');
  }
  recalc();
  if (d.cost && !d.paint) addFloat(x, y, '−' + fmt(d.cost - back), '#d9534a');
  const s = statusOf(x, y);
  if (s && s.how === 'weit' && !quiet) toast(hillNoStair(x, y) ? 'Oben ohne Treppe: nur halbe Kraft. Eine Treppe hinauf hilft.' : 'Weit weg vom Dorf: nur halbe Kraft. Ein Weg zum Dorf hilft.');   // Anhöhe ohne Treppe (157j)
  else if (!quiet && hillsOn() && hillStairBlock(x + ',' + y)) toast('Versperrt die Treppe – zu Fuß kommt sonst niemand mehr auf die Anhöhe');   // auf Fuß/oberem Feld (157j)
  if (b === 'leuchtturm') { if (!state.festival) undoCut = true; festival(); startFireworks([x + 1, y + 1]); }   // das Fest lässt sich nicht zurückkaufen   // Einweihung mit Feuerwerk (Block 83)
  checkStars();
  save();
  return true;
}

// Ins Meer gebaut oder verschoben: das Feld gehört dann zur Insel (sonst ließe es sich nicht mehr antippen, Block 84b)
function claimSea(b, x, y, rot, t, bridge) {
  const d = ITEMS[b];
  if ((CLAIM_TOOLS.has(b) || d.needs === 'meer' || d.needs === 'boot' || d.needs === 'offshore' || (b === 'weg' && bridge)) && !ownedTile(x, y)) claimTile(x, y);
  if (d.needs === 'pier') for (const [fx, fy] of footprint(b, x, y, rot, t)) if (!ownedTile(fx, fy)) claimTile(fx, fy);   // Seebrücke ins Meer
}
function demolish(x, y, under = false) {
  let info = demolishInfo(x, y, under);
  if (info.err) { fail(info.err); return; }
  if (info.hill) { lowerHill(...keyXY(info.hill)); return; }            // Anhöhe (Block 157): abtragen – erstattet, zeigt es, rechnet neu
  const k = x + ',' + y;
  if (info.roof) {                                                      // Überdachung (Block 138): voll zurück, der Weg bleibt
    const r = state.roofs.get(info.roof), tb = roofTopBack(r);
    roofTopClear(r);                                                    // Deko oben: voll zurück, samt Material (Block 138b)
    state.roofs.delete(info.roof);
    state.money += info.refund - tb;
    for (const [r, n] of Object.entries(info.mat || {})) state.res[r] += n;
    addFloat(x, y, '+' + fmt(info.refund), '#3f8f43');
    roofDirty(x, y); groundVersion++;
  } else if (info.tunnel) {                                                    // Tunnel (Block 136): voll zurück
    state.tunnels.delete(info.tunnel);
    state.money += info.refund;
    for (const [r, n] of Object.entries(info.mat || {})) state.res[r] += n;
    addFloat(x, y, '+' + fmt(info.refund), '#3f8f43');
    groundVersion++;
  } else if (info.refund != null) {
    const gone = state.tiles.get(info.anchor);
    if (gone && gone.b === 'pb_station' && gone.pbz) info = { ...info, refund: info.refund + pbHandOver(info.anchor, gone) };   // Block 136e
    state.tiles.delete(info.anchor);
    if (gone) restoreUnder(gone, ...keyXY(info.anchor));                  // Platz bleibt (auch unter großer Deko)
    state.money += info.refund;
    for (const [r, n] of Object.entries(info.mat || {})) state.res[r] += n;
    if (info.refund) addFloat(x, y, '+' + fmt(info.refund), '#3f8f43');
  } else {
    if (state.money < info.cost) { fail('Zu wenig Taler'); return; }
    state.money -= info.cost;
    state.terra.set(k, 'grass');
    addFloat(x, y, '−' + fmt(info.cost), '#d9534a');
  }
  sfx('dig');
  recalc();
  save();
}

// Parkrasen an einem Feld entfernen (wird wieder Wiese), Preis zurück
// Freizeitpark-Boden entfernen (Block 60): nur, wo kein Fahrgeschäft darauf steht
function removeFzGround(x, y) {
  if (terraLook(x, y) !== 'fz') return false;
  const a = COVER.get(x + ',' + y), t = a && state.tiles.get(a);
  if (t && ITEMS[t.b].cat === 'fz') { fail('Hier steht ein Fahrgeschäft'); return false; }
  state.terra.set(x + ',' + y, 'grass'); state.money += ITEMS.fzboden.cost;
  sandCache.clear(); landCache.clear(); sfx('dig'); recalc(); save();
  return true;
}
function removeLawn(x, y) {
  if (terraLook(x, y) !== 'park') return false;
  state.terra.set(x + ',' + y, 'grass'); state.money += ITEMS.parkrasen.cost;
  sandCache.clear(); landCache.clear(); sfx('dig'); recalc(); save();
  return true;
}
// Wald, Obsthain, Fels räumen – auch oben auf einer Anhöhe (Block 157), wo demolish zuerst die Anhöhe meint. Preise wie demolishInfo
function landClearInfo(x, y) {
  const ter = terrainAt(x, y);
  return ter === 'forest' || ter === 'obst' ? { cost: 10, label: 'Roden' } : ter === 'rock' || ter === 'erz' || ter === 'kristall' ? { cost: 50, label: 'Sprengen' } : null;
}
function clearLand(x, y) {
  const c = landClearInfo(x, y);
  if (!c || COVER.has(x + ',' + y)) return false;
  if (state.money < c.cost) { fail('Zu wenig Taler'); return false; }
  state.money -= c.cost;
  state.terra.set(x + ',' + y, 'grass');
  addFloat(x, y, '−' + fmt(c.cost), '#d9534a');
  sfx('dig'); recalc(); save();
  return true;
}
// Verschieben: aufnehmen, Ziel antippen, ablegen – kostenlos. Während des Tragens bleibt das Objekt
// im Spielstand an seinem alten Platz (serialize), damit beim Schließen der App nichts verloren geht.
let moving = null;       // { kind: 'tile', t, from } | { kind: 'deco', d, from: [feld, ecke] } | { kind: 'group', items, cx, cy, W, H, r }
const movingType = () => moving && (moving.kind === 'tile' ? moving.t.b : moving.kind === 'deco' ? moving.d.b : null);
// Was man trägt, als Liste (eine Gruppe oder ein einzelnes Ding) – fürs Speichern und Zurücklegen
const carried = () => !moving || moving.copy ? [] : moving.kind === 'group' ? moving.items : [moving];   // Kopie (Block 134): das Original steht ja noch
function pickUp(x, y, slot) {
  if (moving) return;                                 // erst ablegen (sonst ginge das Getragene verloren, Block 84a)
  const k = x + ',' + y, ds = decosAt(k);
  if (ds && ds[slot]) {
    moving = { kind: 'deco', d: ds[slot], from: [k, slot] };
    ds[slot] = null;
    if (ds.every(v => !v)) state.decos.delete(k);
    buildRot = moving.d.rot || 0;
    rotManual = false;
  } else {
    const a = anchorAt(x, y), t = a && state.tiles.get(a);
    if (!t) { toast('Hier ist nichts zum Verschieben'); return; }
    if (t.b === 'lm' && lmStage(t.lm) < 1) { fail('Erst restaurieren, dann kann sie umziehen'); return; }
    if (t.b === 'huegeltreppe' && !t.ecke && cornerOn(...keyXY(a))) { fail('Hier hängt eine Ecktreppe dran – erst die Ecktreppe aufnehmen'); return; }
    if (t.b === 'bergportal') { fail('Das Bergportal sitzt in der Wand – abreißen und an der neuen Wand neu bauen'); return; }   // Block 157m
    moving = { kind: 'tile', t, from: a };
    state.tiles.delete(a);
    restoreUnder(t, ...keyXY(a));                     // Platz bleibt liegen (cancelMove legt es wieder drauf)
    buildRot = t.rot || 0;
    rotManual = false;
  }
  recalc();
  sfx('deco');
  $('rot-btn').hidden = !ROTATABLE.has(movingType()) && !wegFlipNow();   // Wegfeld mit Richtung: Muster drehen (Block 158)
  toast('Tippe, wohin es soll' + (ROTATABLE.has(movingType()) ? ' – drehen mit ⟳ oder Mausrad' : wegFlipNow() ? ' – Muster drehen mit ⟳ oder R' : ''));
}
// Mehrere Dinge auf einmal: alles, was ganz im Rechteck steht (samt Deko, Wegen, Schienen), wird angehoben und
// zieht mit gleichen Abständen um. Das Gelände bleibt; Rathaus und Sehenswürdigkeiten bleiben stehen.
function pickUpGroup(x0, y0, x1, y1) {
  if (moving) return false;
  const items = [], seen = new Set();
  let stays = 0;
  const inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = x + ',' + y, a = anchorAt(x, y), t = a && state.tiles.get(a);
    if (t && !seen.has(a)) {
      seen.add(a);
      const [ax, ay] = keyXY(a);
      if (t.b === 'lm' || t.b === 'bergportal' || ITEMS[t.b].fixed || !footprint(t.b, ax, ay, t.rot || 0, t).every(([fx, fy]) => inside(fx, fy))) stays++;   // Bergportal (157m): sitzt in der Wand
      else items.push({ kind: 'tile', t, from: a, dx: ax - x0, dy: ay - y0 });
    }
    (decosAt(k) || []).forEach((d, slot) => { if (d) items.push({ kind: 'deco', d, from: [k, slot], dx: x - x0, dy: y - y0 }); });
    const look = terraLook(x, y);                                       // Parkrasen, Freizeitpark-Boden ziehen mit (Block 117)
    if (look === 'park' || look === 'fz') items.push({ kind: 'ground', look, from: k, dx: x - x0, dy: y - y0 });
    if (state.roofs.has(k)) items.push({ kind: 'roof', r: roofCopy(state.roofs.get(k)), from: k, dx: x - x0, dy: y - y0 });   // Überdachung zieht mit (Block 138)
  }
  for (const [k, e] of state.edges) {                                    // Hecken, Zäune, Mauern im Rechteck und auf seinem Rand
    const [mx, my] = edgeMid(k);
    if (mx >= x0 - 0.5 && mx <= x1 + 0.5 && my >= y0 - 0.5 && my <= y1 + 0.5) items.push({ kind: 'edge', e, from: k, mx: mx - x0, my: my - y0 });
  }
  if (!items.length) { toast(stays ? 'Das bleibt stehen (Rathaus, Sehenswürdigkeit oder ragt hinaus)' : 'Hier ist nichts zum Verschieben'); return false; }
  if (items.length === 1 && (items[0].kind === 'tile' || items[0].kind === 'deco')) {   // ein einzelnes Ding: wie gewohnt (mit Drehen)
    const it = items[0], [x, y] = it.kind === 'tile' ? keyXY(it.from) : keyXY(it.from[0]);
    pickUp(x, y, it.kind === 'deco' ? it.from[1] : 0);
    return true;
  }
  for (const it of items) {
    if (it.kind === 'tile') state.tiles.delete(it.from);
    else if (it.kind === 'ground') state.terra.set(it.from, 'grass');
    else if (it.kind === 'roof') { state.roofs.delete(it.from); roofDirty(...keyXY(it.from)); groundVersion++; }
    else if (it.kind === 'edge') state.edges.delete(it.from);
    else { const [k, slot] = it.from, ds = decosAt(k); ds[slot] = null; if (ds.every(v => !v)) state.decos.delete(k); }
  }
  if (items.some(it => it.kind === 'ground')) { sandCache.clear(); landCache.clear(); }
  moving = { kind: 'group', items, cx: Math.round((x1 - x0) / 2), cy: Math.round((y1 - y0) / 2), W: x1 - x0 + 1, H: y1 - y0 + 1, r: 0 };
  $('rot-btn').hidden = false;                                           // die ganze Gruppe dreht sich (Block 117)
  recalc();
  sfx('deco');
  toast(`${items.length} Dinge angehoben – tippe, wohin sie sollen · drehen mit ⟳` + (stays ? ' (manches bleibt stehen)' : ''));
  return true;
}
// Überdachung verschieben (Block 138, Nutzer: „kein Verschieben-Knopf“): die Dachfelder samt Deko oben und den Stützen, die nur
// sie tragen – als Gruppe (Ablegen, Drehen, Abbrechen wie beim Rechteck). keys: ein Feld oder alle verbundenen
function pickUpRoofs(keys) {
  if (moving) return false;
  const set = new Set(keys.filter(k => state.roofs.has(k)));
  if (!set.size) { toast('Hier ist nichts zum Verschieben'); return false; }
  const cells = [...set].map(keyXY), x0 = Math.min(...cells.map(c => c[0])), y0 = Math.min(...cells.map(c => c[1]));
  const x1 = Math.max(...cells.map(c => c[0])), y1 = Math.max(...cells.map(c => c[1]));
  const items = [...set].map(k => { const [x, y] = keyXY(k); return { kind: 'roof', r: roofCopy(state.roofs.get(k)), from: k, dx: x - x0, dy: y - y0 }; });
  const seen = new Set();
  for (const [x, y] of cells) for (const [tx, ty] of PILLAR_NEAR(x, y)) {
    const k = tx + ',' + ty, ds = decosAt(k);
    if (!ds) continue;
    ds.forEach((d, i) => {
      if (!d || d.b !== 'stuetze' || seen.has(k + '|' + i)) return;
      seen.add(k + '|' + i);
      const [pu, pv] = pillarPos(tx, ty, i, d), under = [];               // Dachfelder, die die Stütze berührt
      for (let fy = Math.round(pv) - 1; fy <= Math.round(pv) + 1; fy++) for (let fx = Math.round(pu) - 1; fx <= Math.round(pu) + 1; fx++)
        if (state.roofs.has(fx + ',' + fy) && Math.abs(pu - fx) <= 0.5 + 1e-6 && Math.abs(pv - fy) <= 0.5 + 1e-6) under.push(fx + ',' + fy);
      if (under.length && under.every(f => set.has(f))) items.push({ kind: 'deco', d, from: [k, i], dx: tx - x0, dy: ty - y0 });
    });
  }
  for (const [k, t] of state.tiles) if (t.b === 'dachtreppe') {           // Dachtreppen ganz unter den Feldern ziehen mit (Block 138d)
    const [ax, ay] = keyXY(k);
    if (footprint(t.b, ax, ay, t.rot || 0, t).every(([fx, fy]) => set.has(fx + ',' + fy))) items.push({ kind: 'tile', t, from: k, dx: ax - x0, dy: ay - y0 });
  }
  for (const it of items) {
    if (it.kind === 'roof') { state.roofs.delete(it.from); roofDirty(...keyXY(it.from)); }
    else if (it.kind === 'tile') state.tiles.delete(it.from);
    else { const [k, slot] = it.from, ds = decosAt(k); ds[slot] = null; if (ds.every(v => !v)) state.decos.delete(k); }
  }
  groundVersion++;
  moving = { kind: 'group', items, cx: Math.round((x1 - x0) / 2), cy: Math.round((y1 - y0) / 2), W: x1 - x0 + 1, H: y1 - y0 + 1, r: 0 };
  $('rot-btn').hidden = false;
  recalc();
  sfx('deco');
  toast(`${set.size === 1 ? 'Überdachung' : set.size + ' Dachfelder'} angehoben – tippe, wohin · drehen mit ⟳`);
  return true;
}
// Deko oben dreht mit dem Dach (Gruppe drehen): Plätze und Blickrichtung wie bei Deko am Boden
function roofTopTurn(top, r) {
  if (!top || !r) return top;
  const out = newSlots();
  top.forEach((d, slot) => {
    if (!d || slot === VSLOT) return;
    if (slot === CSLOT) { out[slot] = { ...d, rot: ROTATABLE.has(d.b) ? ((d.rot || 0) + r) & 3 : d.rot || 0 }; return; }   // Mitte bleibt Mitte (Block 156)
    const [u0, v0] = SLOT_UV(slot), [u, v] = kitTurn(r, u0, v0);
    const ns = slot < 4 ? (u > 0 ? 1 : 0) | (v > 0 ? 2 : 0) : 4 + MID_SIDE.findIndex(([a, b]) => a === Math.sign(u) && b === Math.sign(v));
    const auto = slot >= 4 && MID_TURN.has(d.b) && (d.rot || 0) === midRot(slot);
    out[ns] = { ...d, rot: auto ? midRot(ns) : ROTATABLE.has(d.b) ? ((d.rot || 0) + r) & 3 : d.rot || 0 };
  });
  return out;
}
// Mitte einer Linie in Feldkoordinaten: a i,j liegt zwischen (i, j−1) und (i, j), b i,j zwischen (i−1, j) und (i, j)
const edgeMid = k => { const { dir, i, j } = edgeParse(k); return dir === 'a' ? [i, j - 0.5] : [i - 0.5, j]; };
const edgeAtMid = (mx, my) => Math.abs(my - Math.round(my)) > 0.25 ? 'a' + Math.round(mx) + ',' + Math.round(my + 0.5) : 'b' + Math.round(mx + 0.5) + ',' + Math.round(my);
// Gruppe drehen (Block 117): ein Punkt im Rahmen der Gruppe (0…W−1, 0…H−1) nach moving.r Vierteldrehungen – dieselbe Drehung
// wie kitTurn, damit jedes Ding mit rot + r genau so zu seinen Nachbarn steht wie vorher
function grot(px, py) {
  let W = moving.W, H = moving.H, x = px, y = py;
  for (let i = 0; i < (moving.r || 0); i++) { [x, y] = [H - 1 - y, x]; [W, H] = [H, W]; }
  return [x, y];
}
function rotateGroup(dir) {
  if (!moving || moving.kind !== 'group') return false;
  moving.r = ((moving.r || 0) + dir + 4) % 4;
  const [W, H] = moving.r & 1 ? [moving.H, moving.W] : [moving.W, moving.H];
  moving.cx = Math.round((W - 1) / 2); moving.cy = Math.round((H - 1) / 2);
  return true;
}
const SLOT_UV = i => i < 4 ? [i & 1 ? 1 : -1, i & 2 ? 1 : -1] : MID_SIDE[i - 4];
// Wo und wie ein Ding der Gruppe nach der Drehung liegt: { dx, dy } im Rahmen, dazu t (Feld), d + slot (Deko), key (Linie)
function groupPlaced(it) {
  const r = moving.r || 0;
  if (!r) return it.kind === 'edge' ? { mx: it.mx, my: it.my, e: it.e } : it.kind === 'deco' ? { dx: it.dx, dy: it.dy, d: it.d, slot: it.from[1] } : it;
  if (it.kind === 'ground') { const [dx, dy] = grot(it.dx, it.dy); return { dx, dy, r: it.r }; }
  if (it.kind === 'roof') { const [dx, dy] = grot(it.dx, it.dy); return { dx, dy, r: it.r.top ? { ...it.r, top: roofTopTurn(it.r.top, r) } : it.r }; }   // Deko oben dreht mit (138b)
  if (it.kind === 'edge') { const [mx, my] = grot(it.mx, it.my); return { mx, my, e: it.e }; }
  if (it.kind === 'deco') {
    const d = it.d, slot = it.from[1];
    if (slot === VSLOT) { const [px, py] = grot(it.dx - 0.5, it.dy - 0.5); return { dx: Math.round(px + 0.5), dy: Math.round(py + 0.5), slot, d }; }
    if (slot === CSLOT) { const [dx, dy] = grot(it.dx, it.dy); return { dx, dy, slot, d: { ...d, rot: ROTATABLE.has(d.b) ? ((d.rot || 0) + r) & 3 : d.rot || 0 } }; }   // Mitte (Block 156)
    const [dx, dy] = grot(it.dx, it.dy), [u0, v0] = SLOT_UV(slot), [u, v] = kitTurn(r, u0, v0);
    const ns = slot < 4 ? (u > 0 ? 1 : 0) | (v > 0 ? 2 : 0) : 4 + MID_SIDE.findIndex(([a, b]) => a === Math.sign(u) && b === Math.sign(v));
    const auto = slot >= 4 && MID_TURN.has(d.b) && (d.rot || 0) === midRot(slot);   // Bank am Wegrand: wie das Spiel sie selbst stellt
    const rot = auto ? midRot(ns) : ROTATABLE.has(d.b) ? ((d.rot || 0) + r) & 3 : d.rot || 0;
    return { dx, dy, slot: ns, d: { ...d, rot } };
  }
  const t = it.t, rot0 = t.rot || 0, cells = footprint(t.b, it.dx, it.dy, rot0, t).map(([x, y]) => grot(x, y));
  const ax = Math.min(...cells.map(c => c[0])), ay = Math.min(...cells.map(c => c[1]));
  const turns = ROTATABLE.has(t.b) || t.b === 'weg' || t.b === 'schiene' || t.b === 'huegeltreppe' || t.b === 'huegelrampe', rot = turns ? (rot0 + r) & 3 : rot0;   // Treppe (157d): zeigt mit der Gruppe weiter hinauf
  const nt = { ...t, rot };
  if (t.b === 'weg' && (r & 1)) nt.lauf = wegLauf(t) ^ 1;             // Wegrichtung (Block 158): das Muster dreht mit
  if (t.wegs) { nt.wegs = {}; for (const [o, st] of Object.entries(t.wegs)) { const [ox, oy] = keyXY(o), [px, py] = grot(it.dx + ox, it.dy + oy); nt.wegs[(px - ax) + ',' + (py - ay)] = st; } }
  const fit = footprint(t.b, ax, ay, rot, nt).map(c => c.join()).sort().join(';') === cells.map(c => c.join()).sort().join(';');
  return { dx: ax, dy: ay, t: nt, bad: fit ? null : `${ITEMS[t.b].name} lässt sich nicht drehen` };
}
// Passt die Gruppe mit ihrer Mitte auf (hx, hy)? Fehler je Ding (Map) und der erste
function groupErrors(hx, hy) {
  const ox = hx - moving.cx, oy = hy - moving.cy, errs = new Map();
  let first = null;
  // erst die Dächer prüfen, dann zur Probe hinlegen: was darunter steht (Dachtreppe), braucht sie schon (Nutzer: „Aufgänge nicht mit
  // kopieren und bewegen“) – danach wieder weg
  const order = [...moving.items].sort((p, q) => (p.kind === 'roof' ? 0 : 1) - (q.kind === 'roof' ? 0 : 1)), probe = [];
  // Wege der Gruppe zählen beim Prüfen schon als gelegt (160c V4): sonst fand das mittlere Feld einer Wegbrücke keinen Arm am Ufer
  const planned0 = PLANNED, mine = new Set();
  for (const it of moving.items) if (it.kind === 'tile') { const P = groupPlaced(it); if (P.t && (P.t.b === 'weg' || isCrossing(P.t))) mine.add((ox + P.dx) + ',' + (oy + P.dy)); }
  if (mine.size) PLANNED = planned0 ? new Set([...planned0, ...mine]) : mine;
  // Brücke darüber (160c C1): Wege/Gleise der Gruppe zählen beim Prüfen der Stützen schon als gelegt (sonst längs durch eine Stütze)
  const grp0 = BK_GROUP;
  if (bkOn()) { BK_GROUP = { weg: new Set(), schiene: new Set() }; for (const it of moving.items) if (it.kind === 'tile') { const P = groupPlaced(it), k = (ox + P.dx) + ',' + (oy + P.dy);
    if (P.t && (P.t.b === 'weg' || isCrossing(P.t))) BK_GROUP.weg.add(k); if (P.t && P.t.b === 'schiene') BK_GROUP.schiene.add(k); } }
  try {
  for (const it of order) {
    if (it.kind !== 'roof' && !probe.done) {
      probe.done = true;
      for (const r of moving.items) if (r.kind === 'roof' && !errs.get(r)) { const P = groupPlaced(r), k = (ox + P.dx) + ',' + (oy + P.dy); if (!state.roofs.has(k)) { state.roofs.set(k, P.r); probe.push(k); } }
    }
    const P = groupPlaced(it);
    let err = null;
    if (it.kind === 'edge') {
      const k = edgeAtMid(ox + P.mx, oy + P.my);
      err = state.edges.has(k) ? 'Hier steht schon eine Linie' : (P.e.arch && edgeTiles(k).some(([x, y]) => bkAt(x, y))) ? 'Unter der Brücke ist kein Platz für einen Torbogen' : edgeError(P.e.b, k);   // R8
    } else if (it.kind === 'ground') {
      const x = ox + P.dx, y = oy + P.dy, k = x + ',' + y, ot = state.tiles.get(COVER.get(k) || k);
      if (!ownedTile(x, y)) err = notMine(x, y);
      else if (terrainAt(x, y) !== 'grass') err = it.look === 'fz' ? 'Freizeitpark-Boden nur auf Wiese' : 'Parkrasen nur auf Wiese';
      else if (ot && !(it.look === 'fz' ? fzOk(ot.b) : parkOk(ot.b))) err = 'Hier steht ein Gebäude';
    } else if (it.kind === 'roof') {                                     // Überdachung (Block 138): eigenes Land, kein Gebäude, kein anderes Dach
      const x = ox + P.dx, y = oy + P.dy, k = x + ',' + y, ot = state.tiles.get(COVER.get(k) || k);
      if (!ownedTile(x, y)) err = notMine(x, y);
      else if (state.roofs.has(k)) err = 'Hier ist schon eine Überdachung';
      else if (hillAt(x, y)) err = 'Auf einer Anhöhe geht keine Überdachung';   // Anhöhe (Block 157), wie roofError
      else if (bkAt(x, y)) err = 'Unter einer Brücke geht keine Überdachung';   // Brücke (Block 160), wie roofError
      else if (ot && (isWegBridge(ot) || isCrossing(ot))) err = 'Nicht auf Brücken und Bahnübergängen';
      else if (ot && ot.b === 'huegeltreppe') err = 'Über einer Treppe geht keine Überdachung';   // Treppe in die Anhöhe (Block 157d), wie roofError
      else if (ot && ot.b === 'huegelrampe') err = 'Über einer Gleis-Rampe geht keine Überdachung';
      else if (!ot && terrainAt(x, y) === 'water') err = 'Nicht übers Wasser';
      else if (!roofOver(ot)) err = 'Nicht über Gebäude';
      else if (tallUnder(x, y, P.r.form || 0)) err = 'Darunter steht etwas zu Hohes';
    } else if (it.kind === 'deco') err = smallError(P.d.b, ox + P.dx, oy + P.dy, P.slot, { move: !moving.copy, noCost: true, form: P.d.form || 0, rot: P.d.rot || 0 });
    else {
      const x = ox + P.dx, y = oy + P.dy, b = P.t.b;
      err = P.bad;
      if (!err && (b === 'schiene' || b === 'weg')) {
        const water = terrainAt(x, y) === 'water';
        if (!ownedTile(x, y)) err = notMine(x, y);
        else if (P.t.bridge && !water) err = 'Brücken nur übers Wasser';
        else if (!P.t.bridge && water) err = b === 'schiene' ? 'Übers Wasser braucht die Schiene eine Brücke' : 'Übers Wasser braucht der Weg eine Brücke';
      }
      err = err || placeError(b, x, y, P.t.rot || 0, { move: !moving.copy, noCost: true, t: P.t });   // Kopie (Block 134): wie ein Neubau
    }
    errs.set(it, err);
    first = first || err;
  }
  } finally { for (const k of probe) state.roofs.delete(k); PLANNED = planned0; BK_GROUP = grp0; }
  return { ox, oy, errs, first };
}
function dropGroup(hx, hy) {
  const { ox, oy, first } = groupErrors(hx, hy);
  if (first) { fail(first); return false; }
  if (moving.copy) {                                                     // Kopie (Block 134): erst bezahlen, sonst gar nichts
    if (!canPay(moving.cost)) { fail(state.money < (moving.cost.money || 0) ? `Zu wenig Taler (${fmt(moving.cost.money)} nötig)` : 'Material fehlt noch'); return false; }
    addCost(moving.cost, -1);
  }
  const now = performance.now();
  const order = k => k === 'ground' ? 0 : k === 'roof' ? 2 : 1;            // erst der Rasen, dann was darauf steht, zuletzt die Dächer
  for (const it of [...moving.items].sort((p, q) => order(p.kind) - order(q.kind))) {
    const P = groupPlaced(it);
    if (it.kind === 'ground') { state.terra.set((ox + P.dx) + ',' + (oy + P.dy), it.look); continue; }
    if (it.kind === 'roof') { state.roofs.set((ox + P.dx) + ',' + (oy + P.dy), roofCopy(P.r)); roofDirty(ox + P.dx, oy + P.dy); groundVersion++; continue; }
    if (it.kind === 'edge') { state.edges.set(edgeAtMid(ox + P.mx, oy + P.my), { ...P.e, born: now }); continue; }
    const k = (ox + P.dx) + ',' + (oy + P.dy);
    if (it.kind === 'tile') {
      const [x, y] = keyXY(k), b = P.t.b, t = { ...P.t, born: now }, covered = b === 'weg' || b === 'schiene' ? [] : pathsUnder(b, x, y, t.rot || 0, t);
      for (const [fx, fy] of covered) state.tiles.delete(fx + ',' + fy);   // Wege am Ziel: unter die Deko bzw. vom Gebäude ersetzt (Block 58)
      if (covered.length) { if (plazaOk(b)) setUnder(t, x, y, [...covered, ...Object.entries(t.wegs || {}).map(([o, st]) => [x + keyXY(o)[0], y + keyXY(o)[1], st]), ...(t.weg != null ? [[x, y, t.weg]] : [])]); else if (replacesWeg(b)) state.money += covered.length * ITEMS.weg.cost; }
      state.tiles.set(k, t);
      if (moving.copy && isHome(b)) assignResident(t, Math.random, Math.random);   // neue Bewohner in die Kopie
      claimSea(b, x, y, t.rot || 0, t, t.bridge);
    }
    else { if (!state.decos.has(k)) state.decos.set(k, newSlots()); state.decos.get(k)[P.slot] = { ...P.d, born: now }; }
  }
  if (moving.items.some(it => it.kind === 'ground')) { sandCache.clear(); landCache.clear(); }
  for (const it of moving.items) if (it.kind === 'tile' && it.t.b === 'huegeltreppe') { const P = groupPlaced(it); stairDropped(ox + P.dx, oy + P.dy); }
  for (const it of moving.items) if (it.kind === 'tile' && isWegBridge(it.t)) { const P = groupPlaced(it); wbUnify(ox + P.dx, oy + P.dy); }   // Brücken angleichen (160c D3)   // Treppen: Ecke oder gerade wie gebaut (hills.js)
  if (moving.copy) {                                                     // Stempel: dieselbe Kopie gleich noch einmal (frische Dinge)
    moving.items = moving.items.map(copyClone);
    addFloat(hx, hy, '−' + fmt(moving.cost.money || 0), '#d9534a');
  } else {
    moving = null;
    $('rot-btn').hidden = true;
  }
  sfx('build');
  recalc();
  save();
  return true;
}
// --- Kopieren (Block 134, Wunsch Nutzer): mit ✋ markieren → „⧉ Kopieren“. Gleiche Stufe zum vollen Preis (was ein Neubau samt
// Ausbauten kostet), die Kopie bleibt als Stempel am Finger, neue Bewohner ziehen ein. Einzelstücke bleiben draußen. Nur eine Art
// Linie in einem Stil (Weg, Gleis, Hecke/Zaun/Mauer): Pipette – das Werkzeug mit genau diesem Stil in die Hand
const noCopy = b => b === 'lm' || b === 'bergportal' || !!ITEMS[b].fixed || !!WONDERS[b] || !!ITEMS[b].gift;   // Bergportal (157m): nur in die Wand bauen
function copyClone(it) {
  const c = { ...it };
  if (it.kind === 'tile') {
    const t = JSON.parse(JSON.stringify(it.t));
    for (const f of ['animal', 'name', 'more', 'born', 'ships', 'pbz', 'train', 'trainCol', 'trainPlus', 'extra', 'gleis']) delete t[f];   // Bewohner, Fahrzeuge: nicht mit
    if (t.cross && !t.foot) { delete t.footPaid; delete t.brp; for (const f of BR_KEYS) delete t[f]; }   // Schranken: die Brücke von früher ist nicht mitgekauft (160c V3)
    const at = t.b === 'weg' && t.bridge ? 'wasser' : t.b === 'schiene' && t.bridge ? 'gleis' : t.cross && t.foot ? 'uebergang' : null;
    if (at) {                                                            // Brücke (160c A4): die Kopie hat bezahlt, was sie kostet – nur Eingeschaltetes,
      const look = brOnLook(brLook(t, at));                               // Aussehen ausdrücklich (brp = neues Format, die Altfelder bleiben als Rückfall)
      if (at === 'wasser') t.brk = bridgeKind(t);                         // Art fest (nicht mehr aus dem Wegstil): brSig bleibt beim Umstreichen gleich
      if (at === 'uebergang' && !footPaidOf(t)) t.footPaid = brFallback('uebergang', look.mat).footPaid;   // foot ohne footPaid: bezahlt ist jetzt das Design
      t.brm = look.mat; t.brb = look.deck;
      if (look.licht === 'an' && !look.lichtGratis) t.brl = 'an'; else delete t.brl;   // alter Kristall-Übergang: Licht bleibt ohne Aufpreis
      if (look.zacken) t.brz = 'an'; else delete t.brz;
      if (look.stuetzen !== 'wenige') t.bru = look.stuetzen; else delete t.bru;
      // brc/brw nur, wie sie am Original stehen: Rot/Ziegel-Farben ergeben sich aus der Art (folgen ihr beim Artwechsel wie am Original)
      brStamp(t, at, look);
    }
    c.t = t;
  } else if (it.kind === 'deco') { const { born, sv, free, ...d } = it.d; c.d = d; }   // free (Parkbaum aus dem Wald): die Kopie ist bezahlt
  else if (it.kind === 'edge') { const { born, ...e } = it.e; c.e = e; }
  else if (it.kind === 'roof') c.r = roofCopy(it.r, true);           // samt Deko oben (Block 138b)
  return c;
}
function copyCollect(x0, y0, x1, y1) {
  const items = [], seen = new Set();
  let stays = 0;
  const inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = x + ',' + y, a = anchorAt(x, y), t = a && state.tiles.get(a);
    if (t && !seen.has(a)) {
      seen.add(a);
      const [ax, ay] = keyXY(a);
      if (noCopy(t.b) || !footprint(t.b, ax, ay, t.rot || 0, t).every(([fx, fy]) => inside(fx, fy))) stays++;
      else items.push({ kind: 'tile', t, from: a, dx: ax - x0, dy: ay - y0 });
    }
    (decosAt(k) || []).forEach((d, slot) => { if (d) { if (ITEMS[d.b].gift) stays++; else items.push({ kind: 'deco', d, from: [k, slot], dx: x - x0, dy: y - y0 }); } });
    const look = terraLook(x, y);
    if (look === 'park' || look === 'fz') items.push({ kind: 'ground', look, from: k, dx: x - x0, dy: y - y0 });
    if (state.roofs.has(k)) items.push({ kind: 'roof', r: state.roofs.get(k), from: k, dx: x - x0, dy: y - y0 });   // Überdachung (Block 138)
  }
  for (const [k, e] of state.edges) {
    const [mx, my] = edgeMid(k);
    if (mx >= x0 - 0.5 && mx <= x1 + 0.5 && my >= y0 - 0.5 && my <= y1 + 0.5) items.push({ kind: 'edge', e, from: k, mx: mx - x0, my: my - y0 });
  }
  return { items: items.map(copyClone), stays };
}
// Was die Kopie kostet: wie ein Neubau (Gebäude samt Ausbauten, Brücken, Dekos, Linien, Rasen)
function copyCost(items) {
  const c = { money: 0 }, add = (m, mat, n = 1) => { c.money += (m || 0) * n; for (const [r, v] of Object.entries(mat || {})) c[r] = (c[r] || 0) + v * n; };
  for (const it of items) {
    if (it.kind === 'tile') { const { money, ...mat } = copyTileCost(it.t); add(money, mat); } else if (it.kind === 'deco') add(ITEMS[it.d.b].cost, ITEMS[it.d.b].mat);
    else if (it.kind === 'edge') { add(ITEMS[it.e.b].cost, ITEMS[it.e.b].mat); if (it.e.arch && ARCHES[it.e.arch]) add(ARCHES[it.e.arch].cost); }   // Tor-/Rosenbogen kostet extra
    else if (it.kind === 'roof') { add(ITEMS.dach.cost, ITEMS.dach.mat); for (const d of roofTopsOf(it.r)) if (d) add(ITEMS[d.b].cost, ITEMS[d.b].mat); }   // Deko oben (Block 138b)
    else add((it.look === 'fz' ? ITEMS.fzboden : ITEMS.parkrasen).cost, null);
  }
  return c;
}
// Ein Feld wie neu gebaut, zum heutigen Preis (manches wird mit dem Einkommen teurer – nicht der alte, damals bezahlte Preis), samt
// Ausbaustufen und Aufpreisen: Brücke, Märchenschloss-Gestalt, langer Bahnhof, Gleise im Hauptbahnhof, Looping, Bahnübergang/Fußgängerbrücke
function copyTileCost(t) {
  const d = ITEMS[t.b], c = { money: 0 }, add = (o, n = 1) => { for (const [r, v] of Object.entries(o || {})) c[r] = (c[r] || 0) + v * n; };
  if (t.b === 'weg' && t.bridge) add(brPrice(brOnLook(brLook(t, 'wasser')), 'wasser'));        // Brücke (160c A4): im Aussehen, nur Eingeschaltetes
  else if (t.b === 'schiene' && t.bridge) add(brPrice(brOnLook(brLook(t, 'gleis')), 'gleis'));
  else if (t.b === 'huegelrampe') { const R = rampCost(rampFormOf(t)); add({ money: R.cost, ...R.mat }); }   // Gleis-Rampe: Preis ihrer Form (ITEMS zeigt die der Leiste)
  else if (t.b === 'fz_schloss') add({ money: castlePrice(csOf(t)), ...d.mat });
  else add({ money: d.cost || 0, ...d.mat });
  if (t.b === 'haus') for (let l = 1; l < t.lvl; l++) add(houseCost(HOUSE_STAGES[l]));
  else if (BUILD_STAGES[t.b]) BUILD_STAGES[t.b].up.slice(0, (t.lvl || 1) - 1).forEach(u => add(u.cost));
  if (t.b === 'station' && stationLen(t) === 3) add(STATION_LEN_COST);
  if (t.b === 'hbf') add(GLEIS_COST, Math.max(0, hbfGleise(t) - HBF_MIN));
  if (t.loop) add({ money: ITEMS.fz_looping.cost });
  if (t.cross) { add({ money: ITEMS.weg.cost }); if (t.foot) add(brPrice(brOnLook(brLook(t, 'uebergang')), 'uebergang')); }
  return c;
}
// Pipette: nur Wege, nur Gleise oder nur eine Linienart – jeweils ein Stil. Gibt das Werkzeug zurück (oder null)
function copyPipette(items) {
  if (!items.length) return null;
  const tiles = items.filter(it => it.kind === 'tile'), edges = items.filter(it => it.kind === 'edge');
  if (tiles.length && !edges.length && items.length === tiles.length) {
    const b = tiles[0].t.b;
    if ((b !== 'weg' && b !== 'schiene') || !tiles.every(it => it.t.b === b && !it.t.cross)) return null;
    const key = t => b === 'weg' ? (t.style || 'sand') : (t.form || 0);
    if (!tiles.every(it => key(it.t) === key(tiles[0].t))) return null;
    return { tool: b, style: key(tiles[0].t) };
  }
  if (edges.length && items.length === edges.length) {
    const e0 = edges[0].e;
    if (!edges.every(it => it.e.b === e0.b && it.e.style === e0.style && (it.e.col || 0) === (e0.col || 0))) return null;
    return { tool: e0.b, style: e0.style, col: e0.col };
  }
  return null;
}
function startCopy(x0, y0, x1, y1) {
  if (moving) return false;
  const { items, stays } = copyCollect(x0, y0, x1, y1);
  if (!items.length) { toast(stays ? 'Das lässt sich nicht kopieren (Rathaus, Sehenswürdigkeit, Wunderwerk – oder ragt hinaus)' : 'Hier ist nichts zum Kopieren'); return false; }
  const pip = copyPipette(items);
  if (pip) {                                                             // Pipette: Werkzeug mit diesem Stil in die Hand
    setTool(pip.tool);
    if (pip.tool === 'weg' || EDGE_TOOLS.has(pip.tool)) chosenStyle[pip.tool] = pip.style;
    if (pip.tool === 'schiene') state.paintNew.schiene = { ...(state.paintNew.schiene || {}), form: pip.style };
    if (pip.tool === 'hecke') state.paintNew.hecke = pip.col ? { col: pip.col } : {};
    renderStyleBar(pip.tool); updateHint();
    const got = pip.tool === 'schiene' ? (decoLookNew('schiene').form || 0) === (pip.style || 0) : currentStyle(pip.tool) === pip.style;
    toast(got ? `🖌️ ${ITEMS[pip.tool].name} in der Hand – zieh die Linie wie gewohnt` : `🖌️ ${ITEMS[pip.tool].name} in der Hand – diesen Stil hast du nicht freigeschaltet (Kunstakademie), darum der Standard`);
    return true;
  }
  moving = { kind: 'group', copy: true, items, cost: copyCost(items), cx: Math.round((x1 - x0) / 2), cy: Math.round((y1 - y0) / 2), W: x1 - x0 + 1, H: y1 - y0 + 1, r: 0 };
  if (tool !== 'verschieben') setTool('verschieben');
  $('rot-btn').hidden = false;
  sfx('deco');
  toast(`⧉ Kopie am Finger · 🪙 ${fmt(moving.cost.money)} je Stück – tippe, wohin · drehen mit ⟳ · fertig mit Esc` + (stays ? ' (manches bleibt draußen)' : ''));
  return true;
}
function moveError(x, y, slot) {
  if (moving.kind === 'deco') return smallError(moving.d.b, x, y, slot, { move: true, form: moving.d.form || 0 });
  const b = moving.t.b;
  if (b === 'schiene' || b === 'weg') {                       // Brücken wie beim Verschieben einer Gruppe (Block 84b)
    const water = terrainAt(x, y) === 'water';
    if (moving.t.bridge && !water) return 'Brücken nur übers Wasser';
    if (!moving.t.bridge && water) return b === 'schiene' ? 'Übers Wasser braucht die Schiene eine Brücke' : 'Übers Wasser braucht der Weg eine Brücke';
  }
  return placeError(moving.t.b, x, y, placeRot(moving.t.b, x, y), { move: true, t: moving.t });
}
function dropAt(x, y, slot) {
  if (moving.kind === 'group') return dropGroup(x, y);
  const err = moveError(x, y, slot);
  if (err) { fail(err); return; }
  const rot = moving.kind === 'deco' ? (ROTATABLE.has(movingType()) ? buildRot : 0) : placeRot(movingType(), x, y);
  if (moving.kind === 'deco') {
    const k = x + ',' + y;
    if (!state.decos.has(k)) state.decos.set(k, newSlots());
    state.decos.get(k)[slot] = { ...moving.d, rot, born: performance.now() };
  } else {
    const k = x + ',' + y, b = moving.t.b, t = { ...moving.t, rot, born: performance.now() }, covered = pathsUnder(b, x, y, rot, t);
    for (const [fx, fy] of covered) state.tiles.delete(fx + ',' + fy);
    if (replacesWeg(b) && covered.length) state.money += covered.length * ITEMS.weg.cost;   // Gebäude ersetzt den Weg
    setUnder(t, x, y, plazaOk(b) ? covered : []);
    state.tiles.set(k, t);
    claimSea(b, x, y, rot, t, t.bridge);
    if (isWegBridge(t)) wbUnify(x, y);                                  // an eine andere Brücke gelegt: angleichen (160c D3)
    if (b === 'huegeltreppe') stairDropped(x, y);                       // Treppe: Ecke oder gerade wie gebaut (hills.js)
  }
  moving = null;
  $('rot-btn').hidden = true;
  sfx('build');
  recalc();
  save();
}
// 🗑️ Wegwerfen (Block 155b, Nutzer: „Abreißen in die Auswahl“): was am Finger hängt, an den alten Platz zurück und dort abreißen –
// Erstattung und Sperren wie beim Abreißen (Haus mit Arbeitern bleibt stehen). Reihenfolge: Deko oben, Dächer, Deko, Gebäude, Linien
function discardCarried() {
  if (!moving || moving.copy) return false;
  const its = carried().slice();
  cancelMove();
  const xy = it => keyXY(Array.isArray(it.from) ? it.from[0] : it.from);
  return undoable(() => {
    let n = 0;
    batch(() => {
      for (const it of its) if (it.kind === 'deco' && it.top && removeRoofTop(...xy(it), it.from[1])) n++;
      for (const it of its) if (it.kind === 'roof' && state.roofs.has(it.from)) { demolish(...xy(it)); if (!state.roofs.has(it.from)) n++; }
      for (const it of its) if (it.kind === 'deco' && !it.top) {
        const ds = decosAt(it.from[0]);
        if (ds && ds[it.from[1]] === it.d) { removeSmall(...xy(it), it.from[1]); n++; }
      }
      for (const it of its) if (it.kind === 'tile' && state.tiles.get(it.from) === it.t) { demolish(...xy(it), true); if (state.tiles.get(it.from) !== it.t) n++; }
      for (const it of its) if (it.kind === 'edge' && state.edges.get(it.from) === it.e && removeEdge(it.from)) n++;
    });
    return n > 0;
  });
}
function cancelMove() {
  if (!moving) return;
  if (moving.copy) { moving = null; $('rot-btn').hidden = true; undoPending = null; return; }   // Kopie (Block 134): nichts zurückzulegen
  for (const it of carried()) {
    if (it.kind === 'ground') state.terra.set(it.from, it.look);
    else if (it.kind === 'roof') { state.roofs.set(it.from, it.r); roofDirty(...keyXY(it.from)); groundVersion++; }
    else if (it.kind === 'edge') state.edges.set(it.from, it.e);
    else if (it.kind === 'deco' && it.top) roofTopPutBack(it);         // Deko vom Dach (Block 138b)
    else if (it.kind === 'deco') {
      const [k, slot] = it.from;
      if (!state.decos.has(k)) state.decos.set(k, newSlots());
      state.decos.get(k)[slot] = it.d;
    } else {
      const [fx, fy] = keyXY(it.from);
      for (const o of Object.keys(it.t.wegs || {})) { const [dx, dy] = keyXY(o); state.tiles.delete((fx + dx) + ',' + (fy + dy)); }   // die liegengelassenen Wege wieder zudecken
      if ('lauf0' in it) { if (it.lauf0 == null) delete it.t.lauf; else it.t.lauf = it.lauf0; }   // aufgenommenen Weg gedreht (Block 158): wie vorher
      state.tiles.set(it.from, it.t);
    }
  }
  if (moving.kind === 'group' && moving.items.some(it => it.kind === 'ground')) { sandCache.clear(); landCache.clear(); }
  moving = null;
  $('rot-btn').hidden = true;
  undoPending = null;                                 // abgebrochen: kein Schritt (sonst rechnet der nächste ab dem Aufheben)
  recalc();
}


// Gebäude ausbauen: nur wenn alle Bedingungen erfüllt sind; kostet Taler und Material
// stay: aus dem Rathaus heraus – danach kein Infofenster öffnen
function stageUpgrade(x, y, stay = false) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || !BUILD_STAGES[t.b]) return;
  const info = stageInfo(t, x, y);
  if (!info.next) return;
  if (!info.ready) { say('Erst alle Bedingungen erfüllen'); return; }
  const { money = 0, ...mat } = info.next.cost;
  if (state.money < money) { say('Zu wenig Taler'); return; }
  const err = matError(mat);
  if (err) { say(err); return; }
  state.money -= money;
  payMat(mat);
  t.lvl++;
  t.born = performance.now();
  recalc();
  const [w, h] = sizeOf(t.b, t.rot, t);
  sparkle(x + (w - 1) / 2, y + (h - 1) / 2);
  if (!QUIET) { sfx('star'); toast(`${ITEMS[t.b].name} ist jetzt: ${stageName(t)}!`); checkStars(); save(); }
  if (!stay) openInfo(x, y);
  return true;
}

// Mehrere auf einmal ausbauen (Rathaus): das Günstigste zuerst, solange Taler und Material reichen. Nach jedem Ausbau
// wird neu gerechnet (Mitarbeiter, Wünsche), gesagt und gespeichert wird einmal am Ende.
let QUIET = false;
const say = msg => { if (!QUIET) fail(msg); };
function upgradeMany(list) {
  const todo = list.filter(e => e.kind === 'haus' || e.kind === 'stage').sort((a, b) => (a.cost.money || 0) - (b.cost.money || 0));
  const m0 = state.money;
  let done = 0;
  QUIET = true;
  try {
    for (const e of todo) {
      if (!canPay(e.cost)) continue;
      if (e.kind === 'haus' ? houseUpgrade(e.x, e.y, true) : stageUpgrade(e.x, e.y, true)) done++;
    }
  } finally { QUIET = false; }
  if (!done) { fail('Dafür reicht es gerade nicht'); return 0; }
  sfx('star');
  toast(`✨ ${done} ausgebaut · 🪙 −${fmt(m0 - state.money)}${done < todo.length ? ` – für ${todo.length - done} reicht es gerade nicht` : ''}`);
  checkStars();
  save();
  return done;
}

// Bewohner: Tierart und Vorname (zufällig beim Bau, bei alten Häusern fest aus der Lage). Block 55: jedes Wohnhaus hat
// eine Familie, im Reihenhaus wohnen drei (t.more); neue Arten erst, wenn ihre Insel entdeckt ist (speciesOpen).
const speciesOpen = () => ANIMALS.filter(a => !a.isle || state.islands.has(a.isle));
function pickResident(r1, r2) {
  const open = speciesOpen(), a = open[Math.floor(r1() * open.length)] || ANIMALS[0];
  return { animal: a.id, name: a.names[Math.floor(r2() * a.names.length)] };
}
function assignResident(t, r1, r2) {
  if (!(t.animal && t.name)) Object.assign(t, pickResident(r1, r2));
  if (t.b === 'reihenhaus' && !(t.more && t.more.length === 2)) t.more = [pickResident(r1, r2), pickResident(r1, r2)];
}
// Alle, die in einem Haus wohnen: [{ animal, name }]
const residentsOf = t => t && t.animal ? [{ animal: t.animal, name: t.name }, ...(t.more || [])] : [];
function nameHouses() {
  for (const [k, t] of state.tiles) {
    if (!isHome(t.b)) continue;
    const [x, y] = keyXY(k);
    let n1 = 0, n2 = 0;
    assignResident(t, () => hash(x, y, 501 + 10 * n1++), () => hash(x, y, 502 + 10 * n2++));
    if (t.b !== 'haus') continue;
    // Farbe fest eintragen (früher aus der Lage berechnet) – so bleibt das Haus, wie es war
    if (t.wall == null) t.wall = Math.floor(hash(x, y, 3) * 7);
    if (t.roof == null) t.roof = Math.floor(hash(x, y, 4) * 7);
  }
}
const animalOf = t => ANIMALS.find(a => a.id === t.animal) || ANIMALS[0];
const residentName = r => `${r.name} ${animalOf(r).family}`;

// Haus ausbauen: nur wenn alle Wünsche erfüllt sind; kostet Material
function houseUpgrade(x, y, stay = false) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || t.b !== 'haus') return;
  const w = houseWishes(t, x, y);
  if (!w.next) return;
  if (!w.ready) { say('Erst alle Wünsche erfüllen'); return; }
  const cost = houseCost(w.next);
  if (state.money < cost.money) { say('Zu wenig Taler'); return; }
  const err = matError(w.next.mat);
  if (err) { say(err); return; }
  state.money -= cost.money;
  payMat(w.next.mat);
  t.lvl++;
  delete t.look;                 // nach dem Ausbau zeigt das Haus seine neue Stufe
  t.born = performance.now();
  recalc();
  sparkle(x, y);
  if (!QUIET) { sfx('star'); toast(`${t.name}s Haus ist jetzt ein ${HOUSE_STAGES[t.lvl - 1].name}!`); checkStars(); save(); }
  if (!stay) openInfo(x, y);
  return true;
}

function research(id) {
  const tch = TECH_BY_ID[id];
  const cost = tch && techCost(tch);
  if (!tch || !techReady(tch) || state.science < cost) return;
  state.science -= cost;
  state.techs.add(id);
  sfx('research');
  recalc();
  buildToolbar();
  checkStars();
  save();
  toast(`Erforscht: ${tch.name}!`);
  openResearch();
}

// Kunstakademie: ein Stück Aussehen (Farbe, Wege-Stil, Deko) mit Talern und Ideen freischalten
function buyDesign(id) {
  const d = DESIGN_BY_ID[id], err = designError(d);
  if (err) { fail(err); return false; }
  state.money -= designPrice(d);
  state.science -= designIdeas(d);
  state.design.add(id);
  sfx('research');
  buildToolbar();
  save();
  toast(`Freigeschaltet: ${d.name}`);
  return true;
}


function tap(sx, sy, isTouch) {
  let { x, y, slot } = slotAt(sx, sy);
  if (tool === 'tunneleinfahrt') [x, y] = einAnchor(x, y);                // wie die Vorschau (Block 136)
  else if (rampTool()) [x, y] = rampAnchor(x, y);                        // Gleis-Rampe bauen oder getragen: angetippt an der Wand (hills.js), wie die Vorschau
  lastTap = { sx, sy, t: performance.now() };             // Handy: Fenster rückt das Angetippte ins Bild
  const v = planPoint(sx, sy);                              // Zaun & Co.: Eckpunkt statt Feld
  if (planTap(v.x, v.y, isTouch, !!v.deck)) return;         // Linie/Rechteck: Ende setzen, bauen oder abbrechen (deck: auf der Brücke angefangen)
  if (tool === 'look' && !plan && (roofers.length || hillWalkers.length)) { const rw = walkerAt(sx, sy); if (rw && (rw.roofer || rw.hillw)) { openWalkerInfo(rw); return; } }   // Leute auf dem Dach vor dem Dach (Block 138d), auf Anhöhe und Treppe vor deren Feld (157d)
  const hh = !plan && (tool === 'look' || tool === 'abriss' || (tool === 'verschieben' && !moving)) && !roofTopHit(sx, sy) ? holeHit(sx, sy) : null;
  if (hh) {                                                        // in die Öffnung getippt: die Treppe darunter (Block 138d)
    if (tool === 'look') { openInfo(hh.x, hh.y); return; }
    if (isTouch && (!hover || !hover.under || hover.x !== hh.x || hover.y !== hh.y)) { hover = { x: hh.x, y: hh.y, under: true }; previewCache = null; return; }
    if (tool === 'abriss') demolish(hh.x, hh.y, true); else pickUp(hh.x, hh.y, -1);
    return;
  }
  if (tool === 'abriss' && !plan) {                              // Deko auf dem Dach zuerst (Block 138b)
    const th = !pillarAt(sx, sy) && roofTopHit(sx, sy);
    if (th) {
      if (isTouch && (!hover || !hover.top || hover.x !== th.x || hover.y !== th.y || hoverSlot !== th.slot)) { hover = { x: th.x, y: th.y, top: true }; hoverSlot = th.slot; previewCache = null; return; }
      removeRoofTop(th.x, th.y, th.slot); return;
    }
  }
  if (tool === 'verschieben' && !moving && !plan) {                // ✋ aufs Dach: erst die Deko oben, sonst das Dachfeld (Block 138b)
    const th = roofTopHit(sx, sy), rp = !th && !pillarAt(sx, sy) && roofPick(sx, sy);
    if (th) { pickUpRoofTop(th.x, th.y, th.slot); return; }
    if (rp) { if (pickUpRoofs([rp.x + ',' + rp.y])) { hover = { x: rp.x, y: rp.y }; } return; }
  }
  const topB = tool === 'verschieben' ? roofTopCarried() : ITEMS[tool] && roofTopOk(tool) ? tool : null;
  if (!plan && topB) {                                             // kleine Deko übers Steindach getippt: oben drauf (Block 138b)
    const tp = roofTopAt(sx, sy);
    if (tp) {
      if (isTouch && (!hover || !hover.top || hover.x !== tp.x || hover.y !== tp.y || hoverSlot !== tp.slot)) { hover = { x: tp.x, y: tp.y, top: true }; hoverSlot = tp.slot; previewCache = null; return; }
      if (tool === 'verschieben') dropRoofTop(tp.x, tp.y, roofTopFree(tp.x, tp.y, tp.slot));
      else if (buildRoofTop(tool, tp.x, tp.y, roofTopFree(tp.x, tp.y, tp.slot))) noteRecent(tool);
      return;
    }
  }
  if (tool === 'abriss') {                                       // Stütze vor Dach, Dach vor dem Feld dahinter (Block 138)
    const ph = pillarAt(sx, sy), rp = !ph && roofPick(sx, sy);
    if (ph) ({ x, y, slot } = ph); else if (rp) { ({ x, y } = rp); slot = -1; }
  }
  const pl = pillAt(sx, sy);                                // Schild angetippt (Block 71): Sehenswürdigkeit nur beim Ansehen
  if (pl && (tool === 'look' || !pl.look)) { pl.open(sx, sy); return; }
  if ((tool === 'look' || tool === 'abriss') && !plan && !pillarAt(sx, sy) && !roofPick(sx, sy)) {   // Deck einer Brücke (Block 160): vor dem Feld dahinter, nicht vor Dingen davor
    const bp = bkPickFront(sx, sy);
    if (bp) {
      if (tool === 'look') { openBkInfo(bp.x, bp.y); return; }
      if (isTouch && (!hover || !hover.deck || hover.x !== bp.x || hover.y !== bp.y)) { hover = bp; hoverEdge = null; previewCache = null; return; }
      bkDemolishAt(bp.x, bp.y); return;
    }
  }
  const ek = tool === 'abriss' && edgeNear(sx, sy);           // Abreißen: auf eine Linie getippt
  if (ek && isTouch && hoverEdge !== ek) { hoverEdge = ek; hover = null; return; }   // Touch: erst zeigen, dann entfernen (Block 84b)
  if (ek) { if (removeEdge(ek)) { hoverEdge = null; sfx('dig'); recalc(); save(); } return; }
  // Ansehen: getroffen ist, was dort gezeichnet ist – auch Dach und Turm, nicht nur das Bodenfeld (Block 71)
  const hit = tool === 'look' ? objectAt(sx, sy) : null;
  const tc = tool === 'look' && !hit ? trainAt(sx, sy) : null, ta = tc && anchorAt(tc.x, tc.y);   // Zug oben auf der Anhöhe/Gleis-Rampe (movers.js): Fenster seines Gleisfelds
  if (tc && tc.deck) { openBkInfo(tc.x, tc.y); return; }                // Zug oben auf einer Brücke (160b): ihr Fenster, nicht das darunter
  if (ta) { openInfo(...keyXY(ta)); return; }
  const gk = tool === 'look' && edgeNear(sx, sy);             // Ansehen: Durchgang angetippt → Torbogen wählen
  if (gk && !(hit && hit.d > edgeDepth(gk))) { openGateInfo(gk); return; }   // jede Linie: Fenster mit Löschen (am Durchgang auch Bögen)
  if (!viewOnly() && collectStarAt(x, y)) return;                          // Sternschnuppe aufsammeln (Sternwarte) – liegt obenauf
  const th = tool === 'look' && !hit ? roofTopHit(sx, sy) : null;      // Deko auf dem Dach (Block 138b): ihr Fenster
  if (th) { openRoofTopInfo(th.x, th.y, th.slot); return; }
  const ph = tool === 'look' && !hit ? pillarAt(sx, sy) : null;        // Stütze angetippt (Block 138): ihr Fenster, nicht das des Dachs
  if (ph) { openDecoInfo(ph.x, ph.y, ph.slot); return; }
  const rp = tool === 'look' && !hit ? roofPick(sx, sy) : null;         // Dach angetippt (Block 138)
  if (rp) { if (state.tiles.get(rp.x + ',' + rp.y)) openInfo(rp.x, rp.y); else openRoofInfo(rp.x, rp.y); return; }
  if (hit) ({ x, y, slot } = hit);
  const ck = chunkOf(x, y);
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = a ? keyXY(a) : [x, y];
  const isle = isleOf(x, y);
  if (isle && !isleOpen(isle.id)) { openIsle(isle.id, sx, sy); return; }
  if (t && t.b === 'lm' && (tool === 'look' || !state.owned.has(ck))) { openLandmark(ax, ay); return; }
  if (!ownedTile(x, y) && !(seaTool(tool) && isSea(x, y))) { if (tool === 'look') closePanel(); toast('Da ist nur Meer.'); return; }   // Ansehen: aufs Meer getippt schließt das Fenster wie Rasen (Block 81)
  const ds = decosAt(x + ',' + y);
  if (tool === 'look') {
    const ct = critterAt(sx, sy);                             // Tier in der Natur angetippt (Block 56)
    if (ct) { tapCritter(ct); return; }
    if (typeof meAt === 'function' && meAt(sx, sy)) { openMeInfo(); return; }   // eigene Figur (Block 97)
    const wk = walkerAt(sx, sy);                              // Bewohner angetippt (Block 55)
    if (wk) { openWalkerInfo(wk); return; }
    if (ds && ds[slot]) openDecoInfo(x, y, slot);
    else if (t) openInfo(ax, ay);
    else if (hillAt(x, y)) openHillInfo(x, y);                       // Anhöhe ohne etwas darauf (Block 157): Wand, Abtragen
    else if (state.tunnels && tunnelAt(x, y)) openTunnelInfo(x, y);   // Tunnel ohne etwas darüber (Block 136)
    else if (roofAt(x, y)) openRoofInfo(x, y);                       // Dach über Wiese (Block 138)
    else if (terraLook(x, y) === 'park') openParkInfo(x, y);
    else if (terraLook(x, y) === 'fz') openFzInfo(x, y);
    else if (demolishInfo(x, y).cost) openLandInfo(x, y);                // Wald/Fels: Roden, Sprengen (Block 155c)
    else { closePanel(); toast(TERRAIN_NAMES[terrainAt(x, y)]); }
    return;
  }
  // Verschieben: erstes Tippen nimmt auf (sofort), danach wie Bauen mit Vorschau
  if (tool === 'verschieben' && !moving) { pickUp(x, y, slot); return; }
  const smallTool = tool === 'verschieben' ? moving.kind === 'deco' : ITEMS[tool].small;
  // Auf dem Touchscreen: erstes Tippen zeigt die Vorschau, zweites baut.
  if (isTouch && (!hover || hover.x !== x || hover.y !== y || (smallTool && hoverSlot !== slot))) {
    hover = { x, y };
    hoverSlot = slot;
    previewCache = null;
    return;
  }
  if (tool === 'verschieben') dropAt(x, y, moving.kind === 'deco' ? freeSlot(x, y, slot) : slot);
  else if (tool === 'abriss') { if (ds && ds[slot]) removeSmall(x, y, slot); else demolish(x, y); }
  else if (ITEMS[tool].small) { if (buildSmall(tool, x, y, freeSlot(x, y, slot))) noteRecent(tool); }
  else if (build(tool, x, y)) { noteRecent(tool); if (tool === 'dach' && roofAutoPillars([[x, y]])) { recalc(); save(); } }   // zuletzt gebaut (Block 120); Stützen kommen mit (138)
}

// Stufen-Forschung: nächste Stufe kaufen (Ideen)
function studyMastery(id) {
  const m = MASTERY.find(e => e.id === id), cost = m && masteryCost(id);
  if (!m || !masteryOpen() || state.science < cost) return false;
  state.science -= cost;
  state.mastery[id] = masteryLvl(id) + 1;
  sfx('research'); recalc(); save();
  toast(`${m.icon} ${m.name} ${roman(state.mastery[id])}: +${Math.round(MASTERY_STEP * 100 * state.mastery[id])} % ${m.text}`);
  return true;
}
const roman = n => { let out = ''; for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { out += r; n -= v; } return out; };
// Erfindung kaufen (Ideen)
function invent(id) {
  const inv = INVENTIONS.find(i => i.id === id);
  if (!inv || hasInvention(id) || !inventionsOpen() || state.science < inv.cost) return false;
  state.science -= inv.cost;
  state.inventions.add(id);
  sfx('star'); confettiBurst(); recalc(); buildToolbar(); save();
  toast(`${inv.icon} Erfunden: ${inv.name}!`);
  if (id === 'feuerwerk') startFireworks();
  return true;
}

// Aufträge (Handelshafen): im Takt alte streichen, neue hereinholen; erfüllen = liefern bzw. kaufen
let lastTrade = null;                                // { at: Feld des Hafens, t } – der Frachter läuft aus (nur fürs Bild)
function checkOrders(now = Date.now()) {
  const before = state.orders.length;
  state.orders = state.orders.filter(o => o.until > now);
  const slots = orderSlots();
  if (!slots) return false;
  let added = 0;
  const first = !state.orderNext;                    // der erste Handelshafen: gleich zwei Aufträge
  while (state.orders.length < slots && (now >= (state.orderNext || 0)) && added < (first ? 2 : 1)) {
    const o = makeOrder(now + added);
    if (!o) break;
    state.orders.push(o);
    added++;
    if (o.huge) toast(`🚢 Großauftrag am Hafen: ${fmt(o.amount)} ${RES[o.res].icon} für 🪙 ${fmt(o.pay)}!`);
  }
  if (added || !state.orderNext) state.orderNext = now + ORDER_EVERY;
  return added > 0 || state.orders.length !== before;
}
function fulfillOrder(id, from) {
  const o = state.orders.find(x => x.id === id);
  if (!o) return false;
  if (o.kind === 'sell') {
    if (state.res[o.res] < o.amount) { fail(`Zu wenig ${RES[o.res].name} (${fmt(o.amount)} ${RES[o.res].icon} nötig)`); return false; }
    state.res[o.res] -= o.amount; state.money += o.pay;
    toast(`🚢 Der Frachter lädt ${fmt(o.amount)} ${RES[o.res].icon} – 🪙 +${fmt(o.pay)}`);
  } else {
    if (state.money < o.pay) { fail('Zu wenig Taler'); return false; }
    state.money -= o.pay; state.res[o.res] += o.amount;
    toast(`🚢 Geliefert: ${fmt(o.amount)} ${RES[o.res].icon}`);
  }
  state.orders = state.orders.filter(x => x !== o);
  lastTrade = { at: from, t: Date.now() };
  if (from) { const [x, y] = keyXY(from); addFloat(x, y, (o.kind === 'sell' ? '+' : '−') + fmt(o.pay), o.kind === 'sell' ? '#3f8f43' : '#d9534a'); }
  sfx('star'); save();
  return true;
}

// Verkehrsmittel erforschen (Reiter „Verkehr“): kostet Ideen, braucht Grundforschung und Forschungsstufe
function researchVehicle(kind, id) {
  const m = vehicleModels(kind).find(v => v.id === id);
  if (!m || vehicleOk(kind, id) || !vehicleOpen(kind, m)) return false;
  if (state.science < m.cost) { fail('Zu wenig Ideen'); return false; }
  state.science -= m.cost;
  state.vehicles.add(kind + ':' + id);
  sfx('research'); recalc(); save();
  toast(`${m.icon} Erforscht: ${m.name}!`);
  return true;
}

// Schiffe am Hafen kaufen und verkaufen (volle Erstattung)
function buyShip(k, model, to) {
  const t = state.tiles.get(k), m = SHIP_BY_ID[model];
  if (!t || t.b !== 'hafen' || !m) return false;
  if (!vehicleOk('schiff', model)) { fail(`${m.name}: erst erforschen (Forschung → Verkehr)`); return false; }
  if ((t.ships || []).length >= berthsOf(t)) { fail('Alle Liegeplätze sind belegt'); return false; }
  if (!shipTargets(k).includes(to)) { fail('Das Ziel braucht einen Steg oder Hafen auf einer anderen Insel'); return false; }
  if (!canPay(m.buy)) { fail(state.money < m.buy.money ? 'Zu wenig Taler' : 'Material fehlt noch'); return false; }
  addCost(m.buy, -1);
  t.ships = (t.ships || []).concat([{ model, to }]);
  sfx('build'); toast(`${m.icon} ${m.name} legt ab!`); recalc(); save();
  return true;
}
// Parkeisenbahn (Block 136e): Züge einer Strecke kaufen, umstellen, entfernen. Die Liste liegt an der ersten Station (R.key)
function pbWrite(R, forms) {
  for (const k of R.ring) { const t = state.tiles.get(k); if (t && t.pbz) delete t.pbz; }
  state.tiles.get(R.key).pbz = forms;
}
function pbBuyTrain(R) {
  const f0 = pbForms(R), forms = f0.concat([f0[f0.length - 1]]);
  if (!pbRoom(R, forms)) { fail('Für noch einen Zug ist die Strecke zu kurz'); return false; }
  if (state.money < PB_ZUG_COST) { fail('Zu wenig Taler'); return false; }
  state.money -= PB_ZUG_COST; pbWrite(R, forms);
  sfx('build'); toast('🚂 Noch ein Zug fährt los!'); save();
  return true;
}
function pbSellTrain(R, j) {
  const forms = pbForms(R);
  if (forms.length < 2 || !(j in forms)) return false;
  forms.splice(j, 1); pbWrite(R, forms); pbDropRun(R, j);
  state.money += PB_ZUG_COST;
  sfx('dig'); save();
  return true;
}
function pbSetModel(R, j, f) {
  const forms = pbForms(R);
  if (!(j in forms) || !lookOk('pb_station', 'form', f)) return false;
  forms[j] = f;
  if (!pbRoom(R, forms)) { fail('Der Zug ist zu lang für diese Strecke – erst einen entfernen'); return false; }
  pbWrite(R, forms); sfx('deco'); save();
  return true;
}
// Station abgerissen: ihre Züge wandern an eine andere Station derselben Strecke, sonst gibt es die gekauften zurück (Betrag)
function pbHandOver(k, t) {
  const A = PB_AT.get(k), R = A && PB_RINGS[A.r], to = R && R.ring.find(o => o !== k && (state.tiles.get(o) || {}).b === 'pb_station');
  if (to) { const u = state.tiles.get(to); u.pbz = (u.pbz || []).concat(t.pbz); return 0; }
  return Math.max(0, t.pbz.length - 1) * PB_ZUG_COST;                   // auszahlen macht demolish
}
function sellShip(k, i) {
  const t = state.tiles.get(k), s = t && t.ships && t.ships[i];
  if (!s) return false;
  addCost(shipModel(s).buy, 1);
  t.ships.splice(i, 1);
  if (!t.ships.length) delete t.ships;
  sfx('dig'); recalc(); save();
  return true;
}

// ---------------------------------------------------------------------------
// Rückgängig (Block 45): vor einer Aktion merken, wie Felder, Kleinkram, Linien und Boden aussehen; danach nur die geänderten
// Stellen festhalten (plus Taler/Rohstoffe). Zurücknehmen stellt genau diese Stellen wieder her und bucht exakt zurück –
// was inzwischen woanders passiert ist, bleibt. Hat sich an einer Stelle seitdem etwas verändert: nicht zurücknehmen.
// Verschieben (Aufheben … Ablegen) ist ein Schritt; ein aufgezogenes Rechteck/eine Linie auch.
// ---------------------------------------------------------------------------
const UNDO_MAX = 20, undoStack = [];
let undoPending = null, undoCut = false;
// Neues Spiel, Import: die Schritte gehören zum alten Stand (Block 84a)
function resetUndo() { undoStack.length = 0; undoPending = null; undoCut = false; if (typeof updateUndoBtn === 'function') updateUndoBtn(); }
const UNDO_MAPS = { tiles: () => state.tiles, decos: () => state.decos, edges: () => state.edges, terra: () => state.terra, tunnels: () => state.tunnels, roofs: () => state.roofs,
  hills: () => state.hills || (state.hills = new Map()),                // Anhöhen (Block 157): sonst gäbe ↶ die Taler zurück und die Anhöhe bliebe
  bruecken: () => state.bruecken || (state.bruecken = new Map()) };      // Brücken (Block 160)
const undoStr = v => JSON.stringify(v, (key, val) => key === 'born' || key === 'rate' ? undefined : val);   // ohne Animation/Tempo
function undoSnap() {
  const maps = {};
  for (const [n, get] of Object.entries(UNDO_MAPS)) { const m = new Map(); for (const [k, v] of get()) m.set(k, undoStr(v)); maps[n] = m; }
  // Brücken (160c C1): Stützen, die schon vor dem Schritt nicht standen (alter Stand: Linie/Weg auf der Kante) – das ↶ prüft nur neue
  const bkHid = bkOn() ? new Map([...state.bruecken].map(([k, b]) => [k, bkSupports(b).filter(e => bkEdgeBlocker(...bkEdgeCells(...keyXY(k), b.ax, e)))])) : null;
  return { money: state.money, res: { ...state.res }, claimed: new Set(state.claimed), maps, bkHid };
}
function undoCommit(s) {
  if (typeof cloudTouched === 'function') cloudTouched();          // Online-Speicher (Block 93): eigene Aktion
  const changes = [];
  for (const [n, get] of Object.entries(UNDO_MAPS)) {
    const before = s.maps[n], cur = get();
    for (const [k, v] of cur) { const a = undoStr(v); if (before.get(k) !== a) changes.push([n, k, before.get(k), a]); }
    for (const [k, b] of before) if (!cur.has(k)) changes.push([n, k, b, undefined]);
  }
  const claimed = [...state.claimed].filter(k => !s.claimed.has(k)), dres = {};
  for (const r of Object.keys(state.res)) if (state.res[r] !== s.res[r]) dres[r] = state.res[r] - (s.res[r] || 0);
  if (undoCut) { undoCut = false; undoStack.length = 0; if (typeof updateUndoBtn === 'function') updateUndoBtn(); return; }   // z. B. Laternenfest: nicht zurückzukaufen
  if (!changes.length && !claimed.length) return;
  undoStack.push({ changes, claimed, dm: state.money - s.money, dres, ...(s.bkHid && changes.some(c => c[0] === 'bruecken') ? { bkHid: s.bkHid } : {}) });
  if (undoStack.length > UNDO_MAX) undoStack.shift();
  if (typeof updateUndoBtn === 'function') updateUndoBtn();
}
// Eine Nutzer-Aktion: alles darin wird ein Schritt (beim Verschieben erst, wenn abgelegt ist)
function undoable(fn) {
  if (typeof viewOnly === 'function' && viewOnly()) { cloudBlocked(); return undefined; }   // zuschauendes Gerät (Block 94), Besuch (95)
  if (!undoPending) { undoPending = undoSnap(); undoCut = false; }
  else { undoPending.money = state.money; undoPending.res = { ...state.res }; }   // Ablegen: Taler/Lager erst ab jetzt (verdient und gekauft wird inzwischen weiter)
  try { return fn(); } finally { if ((!moving || moving.copy) && undoPending) { const s = undoPending; undoPending = null; undoCommit(s); } if (typeof updateUndoBtn === 'function') updateUndoBtn(); }   // Kopie: jedes Absetzen ein Schritt (Block 134)
}
function undo() {
  if (typeof viewOnly === 'function' && viewOnly()) { cloudBlocked(); return false; }   // zuschauen (Block 94), Besuch (95)
  if (moving) { const copy = moving.copy; cancelMove(); undoPending = null; if (!copy) return true; }   // Kopie am Finger: weglegen und das letzte Absetzen zurück
  const step = undoStack.pop();
  if (typeof updateUndoBtn === 'function') updateUndoBtn();
  if (!step) { toast('Nichts zum Rückgängigmachen'); return false; }
  for (const [n, k, , a] of step.changes) {                        // seitdem dort etwas verändert? Dann lieber nicht
    const v = UNDO_MAPS[n]().get(k);
    if ((v === undefined ? undefined : undoStr(v)) !== a) { fail('Geht nicht mehr – dort hat sich seitdem etwas verändert'); return false; }
  }
  const mine = new Set(step.changes.filter(c => c[0] === 'tiles').map(c => c[1]));    // große Gebäude: ist ihre Fläche noch frei?
  // Gebäude oben (157j): Ebene je Feld nach dem ↶ (Anhöhen dieses Schritts wie vorher, sonst wie jetzt) – ein Ding, das zurückkommt, steht nie
  // über der Kante und nur oben, wenn es dort stehen darf (hillOk). Ohne Anhöhen nichts zu prüfen
  const hillBack = new Map(step.changes.filter(c => c[0] === 'hills').map(c => [c[1], c[2] === undefined ? 0 : JSON.parse(c[2]).h || 1]));
  const lvBack = (x, y) => hillBack.has(x + ',' + y) ? hillBack.get(x + ',' + y) : hillLevel(x, y), hl = hillBack.size > 0 || hillsOn();
  for (const [n, k, b] of step.changes) {
    if (n !== 'tiles' || b === undefined) continue;
    const t = JSON.parse(b), [x, y] = keyXY(k), fp = footprint(t.b, x, y, t.rot || 0, t);
    if (fp.some(([fx, fy]) => { const c = COVER.get(fx + ',' + fy); return c && !mine.has(c); })) { fail('Geht nicht mehr – dort steht inzwischen etwas'); return false; }
    const lv = hl ? fp.map(([fx, fy]) => lvBack(fx, fy)) : null;
    if (lv && lv.some(v => v !== lv[0])) { fail('Geht nicht mehr – das stünde jetzt über der Kante einer Anhöhe'); return false; }
    if (lv && lv[0] && !hillOk(t.b)) { fail('Geht nicht mehr – dort ist inzwischen eine Anhöhe'); return false; }
    if (t.b === 'bergportal') { const [dx, dy] = bpDir(t); if (lvBack(x, y) !== 1 || lvBack(x - dx, y - dy) !== 0) { fail('Geht nicht mehr – die Wand des Bergportals ist nicht mehr da'); return false; } }   // Block 157m
  }
  for (const [n, k, b] of step.changes) {                               // abgetragene Anhöhe zurück (Block 157): nicht unter Gebäude (Wege, Plätze, Deko dürfen hinauf: hillCarryOk)
    if (n === 'hills' && b === undefined && stairsAround(...keyXY(k)).some(([sx, sy]) => !mine.has(sx + ',' + sy))) { fail('Geht nicht mehr – hier führt inzwischen eine Treppe hinauf'); return false; }   // Treppe (Block 157d): wie lowerHill
    if (n === 'hills' && b === undefined && rampsAround(...keyXY(k)).some(([sx, sy]) => !mine.has(rampAt(sx, sy).k))) { fail('Geht nicht mehr – hier führt inzwischen eine Gleis-Rampe hinauf'); return false; }   // Gleis-Rampe (hills.js) wie die Treppe
    if (n === 'hills' && b === undefined && hillStuckOn(...keyXY(k)) && !mine.has(COVER.get(k))) { fail('Geht nicht mehr – oben steht inzwischen ein Gebäude'); return false; }   // Anhöhe weg (157j): wie lowerHill
    if (n !== 'hills' || b === undefined) continue;
    const cur = UNDO_MAPS.hills().get(k);
    if (cur && (cur.h || 1) === (JSON.parse(b).h || 1)) continue;       // nur die Wandart zurück (157j): die Höhe bleibt, was oben steht, darf bleiben
    const o = hillStuckOn(...keyXY(k));                                  // Gebäude, große Deko (157j); Treppe in die Anhöhe: geht mit zurück
    if (o && !mine.has(COVER.get(k))) { fail('Geht nicht mehr – dort steht inzwischen etwas'); return false; }
    if (cur) continue;
    if (stairsAround(...keyXY(k), true).some(([sx, sy]) => !mine.has(sx + ',' + sy))) { fail('Geht nicht mehr – hier steht inzwischen eine Treppe davor'); return false; }   // Fuß frei (wie hillRaiseError)
    if (rampsAround(...keyXY(k), true).some(([sx, sy]) => !mine.has(rampAt(sx, sy).k))) { fail('Geht nicht mehr – hier steht inzwischen eine Gleis-Rampe davor'); return false; }
    if (bpFronts(...keyXY(k)).some(([sx, sy]) => !mine.has(sx + ',' + sy))) { fail('Geht nicht mehr – hier ist inzwischen ein Bergportal davor'); return false; }   // Block 157m
  }
  // Brücken (Block 160): eine Anhöhe, auf der inzwischen eine Brücke aufliegt, kommt nicht weg; nichts Hohes und keine Anhöhe unter eine
  // stehende Brücke zurück; eine Brücke kommt nur zurück, wenn ihre Anhöhen dann da sind und darunter nichts Hohes steht
  if (bkOn() || step.changes.some(c => c[0] === 'bruecken')) {
    const bkMine = new Set(step.changes.filter(c => c[0] === 'bruecken').map(c => c[1])), other = c => c && !bkMine.has(c.k);
    for (const [n, k, b] of step.changes) {
      const [x, y] = keyXY(k);
      if (n === 'hills' && b === undefined && (bkOnHill(x, y) || []).some(other)) { fail('Geht nicht mehr – hier liegt inzwischen eine Brücke auf'); return false; }
      if (n === 'hills' && b !== undefined && !UNDO_MAPS.hills().get(k) && other(bkAt(x, y))) { fail('Geht nicht mehr – darüber liegt inzwischen eine Brücke'); return false; }
      if (n === 'roofs' && b !== undefined && other(bkAt(x, y))) { fail('Geht nicht mehr – darüber liegt inzwischen eine Brücke'); return false; }
      if (n === 'tiles' && b !== undefined) {
        const t = JSON.parse(b);
        const flat = (t.b === 'weg' || t.b === 'schiene') && !t.bridge && !(isCrossing(t) && t.foot);   // Wasser- und Fußgängerbrücken sind zu hoch
        if (!flat && footprint(t.b, x, y, t.rot || 0, t).some(([fx, fy]) => other(bkAt(fx, fy)))) { fail('Geht nicht mehr – darüber liegt inzwischen eine Brücke'); return false; }
      }
      if (n === 'bruecken' && b !== undefined) {                         // auch eine stehende: ein Gleis, das zurückkommt, braucht am Holzsteg Böcke (160b)
        const o = JSON.parse(b), art = bkArtOf(o);
        if (!UNDO_MAPS.bruecken().get(k) && (bkEndsOf(k, o).some(([ex, ey]) => lvBack(ex, ey) !== 1) || bkCellsOf(k, o).some(([cx, cy]) => lvBack(cx, cy) !== 0))) { fail('Geht nicht mehr – die Anhöhen der Brücke sind nicht mehr da'); return false; }
        const stand = !!UNDO_MAPS.bruecken().get(k);                       // steht sie schon: darunter ist alles geprüft, nur neue Stützen zählen (160c C1)
        const hid = (step.bkHid && step.bkHid.get(k)) || [];               // vor dem Schritt schon verdeckt (alter Stand): zählt nicht
        const neu = (stand ? bkSupports(o).filter(e => !bkSupports(UNDO_MAPS.bruecken().get(k)).includes(e)) : bkSupports(o)).filter(e => !hid.includes(e)), [ox, oy] = keyXY(k);
        const Go = bkGeom(o);                                              // Stein (160c C3): Pfeiler und Bögen wie gebaut
        if ((!stand && bkCellsOf(k, o).some(([cx, cy], i) => { const a = COVER.get(cx + ',' + cy); return !(a && mine.has(a)) && bkUnderError(cx, cy, Go, i); }))
          || neu.some(e => { const cs = bkEdgeCells(ox, oy, o.ax, e); return !cs.some(([cx, cy]) => { const a = COVER.get(cx + ',' + cy); return a && mine.has(a); }) && bkEdgeBlocker(...cs); })) { fail('Geht nicht mehr – unter der Brücke steht inzwischen etwas'); return false; }
      }
    }
  }
  const short = state.money - step.dm < 0 ? 'Taler' : Object.entries(step.dres).find(([r, d]) => state.res[r] - d < 0);
  if (short) { fail(`Zu wenig ${short === 'Taler' ? 'Taler' : RES[short[0]].name}, um das zurückzunehmen`); undoStack.push(step); updateUndoBtn(); return false; }
  for (const [n, k, b] of step.changes) { const m = UNDO_MAPS[n](); if (b === undefined) m.delete(k); else m.set(k, JSON.parse(b)); }
  for (const k of step.claimed) state.claimed.delete(k);
  state.money -= step.dm;
  for (const [r, d] of Object.entries(step.dres)) state.res[r] -= d;
  sandCache.clear(); landCache.clear(); waterChanged(); previewCache = null;
  if (step.changes.some(c => c[0] === 'bruecken')) groundVersion++;       // Brücken (160b): bkFresh merkt sich die Objekte je Boden-Fassung – ↶ setzt neue ein
  if (typeof cloudTouched === 'function') cloudTouched();                // auch ↶ ist eine eigene Aktion (Online-Speicher; Anhöhen, Dächer, Brücken)
  sfx('dig'); recalc(); save();
  if (panelLive && !$('panel').hidden) panelLive();             // offenes Fenster: Ding noch da? (sonst zu)
  toast('↶ Rückgängig');
  return true;
}
