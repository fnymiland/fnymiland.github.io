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
    sfx('road'); save();
    return true;
  }
  const err = placeError(b, x, y);
  if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
  const d = ITEMS[b], k = x + ',' + y;
  state.money -= d.cost;
  payMat(d.mat);
  if (b === 'graben') { state.terra.set(k, 'water'); sfx('dig'); }
  else if (b === 'schuett') { state.terra.set(k, 'grass'); sfx('dig'); }
  else {
    state.tiles.set(k, { b, lvl: 1, born: performance.now(), rot: placeRot(b, x, y), ...(STYLES[b] ? { style: currentStyle(b) } : {}) });
    if (b === 'haus') assignResident(state.tiles.get(k), Math.random, Math.random);
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

function buyPlot(ck) {
  if (!purchasable(ck)) return;
  const price = plotPrice();
  if (state.money < price) { fail('Zu wenig Taler'); return; }
  state.money -= price;
  state.owned.add(ck);
  recalc();
  save();
  closePanel();
  sfx('buy');
  const lms = landmarksIn(ck);
  toast(lms.length ? `Grundstück gekauft! Verbinde ${LANDMARKS[lms[0]].name} per Weg mit dem Dorf.` : 'Neues Grundstück gekauft!');
}

function upgrade(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || !upgradable(t)) return;
  const c = upgradeCost(t);
  if (state.money < c) { fail('Zu wenig Taler'); return; }
  state.money -= c;
  t.lvl++;
  t.born = performance.now();
  recalc();
  addFloat(x, y, 'Stufe ' + t.lvl + '!', '#b8860b');
  sfx('buy');
  checkStars();
  save();
  openInfo(x, y);
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
  }
}
const animalOf = t => ANIMALS.find(a => a.id === t.animal) || ANIMALS[0];

// Haus ausbauen: nur wenn alle Wünsche erfüllt sind; kostet Material
function houseUpgrade(x, y) {
  const t = state.tiles.get(x + ',' + y);
  if (!t || t.b !== 'haus') return;
  const w = houseWishes(t, x, y);
  if (!w.next) return;
  if (!w.ready) { fail('Erst alle Wünsche erfüllen'); return; }
  const err = matError(w.next.mat);
  if (err) { fail(err); return; }
  payMat(w.next.mat);
  t.lvl++;
  t.born = performance.now();
  recalc();
  sparkle(x, y);
  sfx('star');
  toast(`${t.name}s Haus ist jetzt ein ${HOUSE_STAGES[t.lvl - 1].name}!`);
  checkStars();
  save();
  openInfo(x, y);
}

function research(id) {
  const tch = TECH_BY_ID[id];
  if (!tch || hasTech(id) || !(tch.req || []).every(hasTech) || state.science < tch.cost) return;
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

function landmarksIn(ck) {
  const [cx, cy] = ck.split(',').map(Number), out = [];
  for (let y = cy * CHUNK; y < cy * CHUNK + CHUNK; y++)
    for (let x = cx * CHUNK; x < cx * CHUNK + CHUNK; x++) {
      const t = state.tiles.get(x + ',' + y);
      if (t && t.b === 'lm') out.push(t.lm);
    }
  return out;
}

function tap(sx, sy, isTouch) {
  const { x, y, slot } = slotAt(sx, sy);
  const ck = chunkOf(x, y);
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = a ? keyXY(a) : [x, y];
  if (t && t.b === 'lm' && (tool === 'look' || !state.owned.has(ck))) { openLandmark(ax, ay); return; }
  if (!state.owned.has(ck)) {
    if (purchasable(ck)) openBuy(ck, sx, sy);
    else if (onIsland(ck)) toast('Kauf erst die Grundstücke dazwischen');
    else toast('Da ist nur Meer.');
    return;
  }
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
  if (tool === 'verschieben') dropAt(x, y, slot);
  else if (tool === 'abriss') { if (ds && ds[slot]) removeSmall(x, y, slot); else demolish(x, y); }
  else if (ITEMS[tool].small) buildSmall(tool, x, y, slot);
  else build(tool, x, y);
}

