'use strict';
// ---------------------------------------------------------------------------
// Aktionen
// ---------------------------------------------------------------------------
let tool = 'look';
let cat = 'bau';
let hover = null;
let hoverChunk = null;
const floats = [];

function fail(msg) { toast(msg); sfx('error'); }

function build(b, x, y, quiet) {
  // Umfärben: bestehenden Weg im anderen Stil übermalen
  const k0 = x + ',' + y, old = state.tiles.get(k0);
  if (STYLES[b] && ownedTile(x, y) && old && old.b === b) {
    const style = currentStyle(b);
    if ((old.style || 'kies') === style) return false;
    if (state.money < ITEMS[b].cost) { fail('Zu wenig Taler'); return false; }
    state.money -= ITEMS[b].cost;
    old.style = style;
    groundVersion++;
    sfx('road'); save();
    return true;
  }
  const err = placeError(b, x, y);
  if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
  const d = ITEMS[b], k = x + ',' + y, c = costOf(b, x, y), bridge = b === 'schiene' && terrainAt(x, y) === 'water', rot = placeRot(b, x, y);
  clearNature(b, x, y, rot);                        // Wald, Fels … auf dem Bauplatz verschwinden (Roden/Sprengen)
  state.money -= c.cost;
  payMat(c.mat);
  if (CLAIM_TOOLS.has(b) && !ownedTile(x, y)) claimTile(x, y);
  if (b === 'graben') { state.terra.set(k, 'water'); sandCache.clear(); sfx('dig'); }
  else if (b === 'schuett') {
    state.terra.set(k, 'grass'); sandCache.clear(); sfx('dig');
    const rt = state.tiles.get(k);                 // unter einer Brücke aufgeschüttet: normale Schiene, Unterschied zurück
    if (rt && rt.bridge) {
      delete rt.bridge;
      state.money += BRIDGE.cost - ITEMS.schiene.cost;
      for (const [r, n] of Object.entries(BRIDGE.mat)) state.res[r] += n - (ITEMS.schiene.mat[r] || 0);
    }
  } else {
    state.tiles.set(k, { b, lvl: 1, born: performance.now(), rot, ...(STYLES[b] ? { style: currentStyle(b) } : {}), ...(bridge ? { bridge: true } : {}) });
    if (b === 'haus') {
      const t = state.tiles.get(k), walls = colorsOf('wall'), roofs = colorsOf('roof');
      assignResident(t, Math.random, Math.random);
      t.wall = walls[Math.floor(Math.random() * walls.length)][1];
      t.roof = roofs[Math.floor(Math.random() * roofs.length)][1];
    }
    sfx(d.paint ? 'road' : d.cat === 'deko' ? 'deco' : 'build');
  }
  recalc();
  if (d.cost && !d.paint) addFloat(x, y, '−' + fmt(d.cost), '#d9534a');
  const s = statusOf(x, y);
  if (s && s.how === 'weit' && !quiet) toast('Weit weg vom Dorf: nur halbe Kraft. Ein Weg zum Dorf hilft.');
  if (b === 'leuchtturm') festival();
  checkStars();
  save();
  return true;
}

function demolish(x, y) {
  const info = demolishInfo(x, y);
  if (info.err) { fail(info.err); return; }
  const k = x + ',' + y;
  if (info.refund != null) {
    state.tiles.delete(info.anchor);
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

// Verschieben: aufnehmen, Ziel antippen, ablegen – kostenlos. Während des Tragens bleibt das Objekt
// im Spielstand an seinem alten Platz (serialize), damit beim Schließen der App nichts verloren geht.
let moving = null;       // { kind: 'tile', t, from } | { kind: 'deco', d, from: [feld, ecke] }
const movingType = () => moving && (moving.kind === 'tile' ? moving.t.b : moving.d.b);
function pickUp(x, y, slot) {
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
    moving = { kind: 'tile', t, from: a };
    state.tiles.delete(a);
    buildRot = t.rot || 0;
    rotManual = false;
  }
  recalc();
  sfx('deco');
  $('rot-btn').hidden = !ROTATABLE.has(movingType());
  toast('Tippe, wohin es soll' + (ROTATABLE.has(movingType()) ? ' – drehen mit ⟳ oder Mausrad' : ''));
}
function moveError(x, y, slot) {
  if (moving.kind === 'deco') return smallError(moving.d.b, x, y, slot, { move: true });
  return placeError(moving.t.b, x, y, placeRot(moving.t.b, x, y), { move: true });
}
function dropAt(x, y, slot) {
  const err = moveError(x, y, slot);
  if (err) { fail(err); return; }
  const rot = moving.kind === 'deco' ? (ROTATABLE.has(movingType()) ? buildRot : 0) : placeRot(movingType(), x, y);
  if (moving.kind === 'deco') {
    const k = x + ',' + y;
    if (!state.decos.has(k)) state.decos.set(k, [null, null, null, null]);
    state.decos.get(k)[slot] = { ...moving.d, rot, born: performance.now() };
  } else {
    state.tiles.set(x + ',' + y, { ...moving.t, rot, born: performance.now() });
  }
  moving = null;
  $('rot-btn').hidden = true;
  sfx('build');
  recalc();
  save();
}
function cancelMove() {
  if (!moving) return;
  if (moving.kind === 'deco') {
    const [k, slot] = moving.from;
    if (!state.decos.has(k)) state.decos.set(k, [null, null, null, null]);
    state.decos.get(k)[slot] = moving.d;
  } else {
    state.tiles.set(moving.from, moving.t);
  }
  moving = null;
  recalc();
}


// Gebäude ausbauen: nur wenn alle Bedingungen erfüllt sind; kostet Taler und Material
// stay: aus dem Rathaus heraus – danach kein Infofenster öffnen
function stageUpgrade(x, y, stay = false) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || !BUILD_STAGES[t.b]) return;
  const info = stageInfo(t, x, y);
  if (!info.next) return;
  if (!info.ready) { fail('Erst alle Bedingungen erfüllen'); return; }
  const { money = 0, ...mat } = info.next.cost;
  if (state.money < money) { fail('Zu wenig Taler'); return; }
  const err = matError(mat);
  if (err) { fail(err); return; }
  state.money -= money;
  payMat(mat);
  t.lvl++;
  t.born = performance.now();
  recalc();
  const [w, h] = sizeOf(t.b, t.rot);
  sparkle(x + (w - 1) / 2, y + (h - 1) / 2);
  sfx('star');
  toast(`${ITEMS[t.b].name} ist jetzt: ${stageName(t)}!`);
  checkStars();
  save();
  if (!stay) openInfo(x, y);
  return true;
}

// Bewohner: Tierart und Vorname (zufällig beim Bau, bei alten Häusern fest aus der Lage)
function assignResident(t, r1, r2) {
  if (t.animal && t.name) return;
  const a = ANIMALS[Math.floor(r1() * ANIMALS.length)];
  t.animal = a.id;
  t.name = a.names[Math.floor(r2() * a.names.length)];
}
function nameHouses() {
  for (const [k, t] of state.tiles) {
    if (t.b !== 'haus') continue;
    const [x, y] = keyXY(k);
    assignResident(t, () => hash(x, y, 501), () => hash(x, y, 502));
    // Farbe fest eintragen (früher aus der Lage berechnet) – so bleibt das Haus, wie es war
    if (t.wall == null) t.wall = Math.floor(hash(x, y, 3) * 7);
    if (t.roof == null) t.roof = Math.floor(hash(x, y, 4) * 7);
  }
}
const animalOf = t => ANIMALS.find(a => a.id === t.animal) || ANIMALS[0];

// Haus ausbauen: nur wenn alle Wünsche erfüllt sind; kostet Material
function houseUpgrade(x, y, stay = false) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || t.b !== 'haus') return;
  const w = houseWishes(t, x, y);
  if (!w.next) return;
  if (!w.ready) { fail('Erst alle Wünsche erfüllen'); return; }
  const err = matError(w.next.mat);
  if (err) { fail(err); return; }
  payMat(w.next.mat);
  t.lvl++;
  delete t.look;                 // nach dem Ausbau zeigt das Haus seine neue Stufe
  t.born = performance.now();
  recalc();
  sparkle(x, y);
  sfx('star');
  toast(`${t.name}s Haus ist jetzt ein ${HOUSE_STAGES[t.lvl - 1].name}!`);
  checkStars();
  save();
  if (!stay) openInfo(x, y);
  return true;
}

function research(id) {
  const tch = TECH_BY_ID[id];
  if (!tch || !techReady(tch) || state.science < tch.cost) return;
  state.science -= tch.cost;
  state.techs.add(id);
  sfx('research');
  recalc();
  buildToolbar();
  checkStars();
  save();
  toast(`Erforscht: ${tch.name}!`);
  openResearch();
}

// Kunstakademie: ein Stück Aussehen (Farbe, Wege-Stil, Deko) mit Talern freischalten
function buyDesign(id) {
  const d = DESIGN_BY_ID[id], err = designError(d);
  if (err) { fail(err); return false; }
  state.money -= d.price;
  state.design.add(id);
  sfx('research');
  buildToolbar();
  save();
  toast(`Freigeschaltet: ${d.name}`);
  return true;
}


function tap(sx, sy, isTouch) {
  const { x, y, slot } = slotAt(sx, sy);
  const ck = chunkOf(x, y);
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = a ? keyXY(a) : [x, y];
  const isle = isleOf(x, y);
  if (isle && !isleOpen(isle.id)) { openIsle(isle.id, sx, sy); return; }
  if (t && t.b === 'lm' && (tool === 'look' || !state.owned.has(ck))) { openLandmark(ax, ay); return; }
  if (!ownedTile(x, y) && !(CLAIM_TOOLS.has(tool) && isSea(x, y))) { toast('Da ist nur Meer.'); return; }
  const ds = decosAt(x + ',' + y);
  if (tool === 'look') {
    if (ds && ds[slot]) openDecoInfo(x, y, slot);
    else if (t) openInfo(ax, ay);
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
  else if (ITEMS[tool].small) buildSmall(tool, x, y, freeSlot(x, y, slot));
  else build(tool, x, y);
}

