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
    state.tiles.set(k, { b, lvl: 1, born: performance.now(), rot: ROTATABLE.has(b) ? buildRot : 0, ...(STYLES[b] ? { style: currentStyle(b) } : {}) });
    sfx(d.paint ? 'road' : d.cat === 'deko' ? 'deco' : 'build');
  }
  recalc();
  if (d.cost && !d.paint) addFloat(x, y, '−' + fmt(d.cost), '#d9534a');
  const s = statusOf(x, y);
  if (s && s.how === 'weit' && !quiet) toast('Weit weg vom Dorf: nur halbe Kraft. Ein Weg zum Dorf hilft.');
  checkStars();
  save();
  return true;
}

function demolish(x, y) {
  const info = demolishInfo(x, y);
  if (info.err) { fail(info.err); return; }
  const k = x + ',' + y;
  if (info.refund != null) {
    state.tiles.delete(k);
    state.money += info.refund;
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
  const t = state.tiles.get(x + ',' + y);
  if (t && t.b === 'lm' && (tool === 'look' || !state.owned.has(ck))) { openLandmark(x, y); return; }
  if (!state.owned.has(ck)) {
    if (purchasable(ck)) openBuy(ck);
    else if (onIsland(ck)) toast('Kauf erst die Grundstücke dazwischen');
    else toast('Da ist nur Meer.');
    return;
  }
  const ds = decosAt(x + ',' + y);
  if (tool === 'look') {
    if (ds && ds[slot]) openDecoInfo(x, y, slot);
    else if (t) openInfo(x, y);
    else { closePanel(); toast(TERRAIN_NAMES[terrainAt(x, y)]); }
    return;
  }
  // Auf dem Touchscreen: erstes Tippen zeigt die Vorschau, zweites baut.
  if (isTouch && (!hover || hover.x !== x || hover.y !== y || (ITEMS[tool].small && hoverSlot !== slot))) {
    hover = { x, y };
    hoverSlot = slot;
    previewCache = null;
    return;
  }
  if (tool === 'abriss') { if (ds && ds[slot]) removeSmall(x, y, slot); else demolish(x, y); }
  else if (ITEMS[tool].small) buildSmall(tool, x, y, slot);
  else build(tool, x, y);
}

// Sterne
function reqs(i) {
  const s = STARS[i];
  const r = [
    { icon: '👥', label: 'Einwohner', have: T.pop, need: s.pop },
    { icon: '🪙', label: 'Taler pro Sekunde', have: T.inc, need: s.inc, rate: true },
    { icon: '🌸', label: 'Schönheit', have: T.beauty, need: s.beauty },
  ];
  if (s.techs) r.push({ icon: '💡', label: 'Erforscht', have: state.techs.size, need: s.techs });
  if (s.lm) r.push({ icon: '🗺️', label: 'Sehenswürdigkeiten angeschlossen', have: T.lm, need: s.lm });
  if (s.landmark) r.push({ icon: '🗼', label: ITEMS[s.landmark].name + ' bauen', have: hasBuilt(s.landmark) ? 1 : 0, need: 1, flag: true });
  return r;
}
function checkStars() {
  if (PROBE) return;
  let up = 0;
  while (state.stars < STARS.length && reqs(state.stars).every(r => r.have >= r.need)) {
    const rw = STARS[state.stars].reward;
    state.money += rw.money; state.science += rw.sci;
    state.stars++; up++;
  }
  if (up) { save(); celebrate(); }
}
