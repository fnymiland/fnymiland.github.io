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
  // Umfärben: bestehenden Weg im anderen Stil übermalen
  const k0 = x + ',' + y, old = state.tiles.get(k0);
  if (STYLES[b] && ownedTile(x, y) && old && (old.b === b || (b === 'weg' && isCrossing(old)))) {
    const style = currentStyle(b);
    if ((old.style || 'sand') === style) return false;
    if (state.money < ITEMS[b].cost) { fail('Zu wenig Taler'); return false; }
    state.money -= ITEMS[b].cost;
    old.style = style;
    groundVersion++;
    sfx('road'); save();
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
  const err = placeError(b, x, y);
  if (err) { if (!quiet || err === 'Zu wenig Taler') fail(err); return false; }
  const d = ITEMS[b], k = x + ',' + y, c = costOf(b, x, y), bridge = b === 'schiene' && terrainAt(x, y) === 'water', rot = placeRot(b, x, y);
  const under = plazaSpot(b, x, y) ? wegUnder(state.tiles.get(k)) : null;      // auf dem Platz: der Weg bleibt darunter
  clearNature(b, x, y, rot);                        // Wald, Fels … auf dem Bauplatz verschwinden (Roden/Sprengen)
  state.money -= c.cost;
  payMat(c.mat);
  if ((CLAIM_TOOLS.has(b) || d.needs === 'meer' || d.needs === 'boot' || d.needs === 'offshore') && !ownedTile(x, y)) claimTile(x, y);
  if (d.needs === 'pier') for (const [fx, fy] of footprint(b, x, y, rot)) if (!ownedTile(fx, fy)) claimTile(fx, fy);   // Seebrücke ins Meer
  if (b === 'graben') { state.terra.set(k, 'water'); sandCache.clear(); waterChanged(); sfx('dig'); }
  else if (TERRAFORM[b]) {
    const ter = terrainAt(x, y);
    state.terra.set(k, TERRAFORM[b]); sandCache.clear(); landCache.clear(); sfx('dig');
    if (b === 'parkrasen' && (ter === 'forest' || ter === 'obst') && !decosAt(k)) {   // Wald im Park: die Bäume bleiben als Parkbäume
      const ds = newSlots(), n = 1 + Math.floor(hash(x, y, 91) * 2);
      for (const i of [0, 3, 1, 2].slice(0, n)) ds[i] = { b: 'baum', rot: 0 };
      state.decos.set(k, ds);
    }
  }
  else if (b === 'schuett') {
    state.terra.set(k, 'grass'); sandCache.clear(); waterChanged(); sfx('dig');
    const rt = state.tiles.get(k);                 // unter einer Brücke aufgeschüttet: normale Schiene, Unterschied zurück
    if (rt && rt.bridge) {
      delete rt.bridge;
      state.money += BRIDGE.cost - ITEMS.schiene.cost;
      for (const [r, n] of Object.entries(BRIDGE.mat)) state.res[r] += n - (ITEMS.schiene.mat[r] || 0);
    }
  } else {
    state.tiles.set(k, { b, lvl: 1, born: performance.now(), rot, ...(STYLES[b] ? { style: currentStyle(b) } : {}), ...(bridge ? { bridge: true } : {}), ...(under ? { weg: under } : {}), ...(d.wonder ? { phase: 0, rate: wonderRate() } : {}) });
    if (isHome(b)) assignResident(state.tiles.get(k), Math.random, Math.random);
    if (b === 'haus') {
      const t = state.tiles.get(k), walls = colorsOf('wall'), roofs = colorsOf('roof');
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
    const gone = state.tiles.get(info.anchor);
    state.tiles.delete(info.anchor);
    if (gone && gone.weg != null) state.tiles.set(info.anchor, { b: 'weg', lvl: 1, style: gone.weg });   // Platz bleibt
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
function removeLawn(x, y) {
  if (terraLook(x, y) !== 'park') return false;
  state.terra.set(x + ',' + y, 'grass'); state.money += ITEMS.parkrasen.cost;
  sandCache.clear(); landCache.clear(); sfx('dig'); recalc(); save();
  return true;
}
// Verschieben: aufnehmen, Ziel antippen, ablegen – kostenlos. Während des Tragens bleibt das Objekt
// im Spielstand an seinem alten Platz (serialize), damit beim Schließen der App nichts verloren geht.
let moving = null;       // { kind: 'tile', t, from } | { kind: 'deco', d, from: [feld, ecke] } | { kind: 'group', items, cx, cy }
const movingType = () => moving && (moving.kind === 'tile' ? moving.t.b : moving.kind === 'deco' ? moving.d.b : null);
// Was man trägt, als Liste (eine Gruppe oder ein einzelnes Ding) – fürs Speichern und Zurücklegen
const carried = () => !moving ? [] : moving.kind === 'group' ? moving.items : [moving];
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
    if (t.weg != null) state.tiles.set(a, { b: 'weg', lvl: 1, style: t.weg });   // Platz bleibt liegen (cancelMove legt es wieder drauf)
    buildRot = t.rot || 0;
    rotManual = false;
  }
  recalc();
  sfx('deco');
  $('rot-btn').hidden = !ROTATABLE.has(movingType());
  toast('Tippe, wohin es soll' + (ROTATABLE.has(movingType()) ? ' – drehen mit ⟳ oder Mausrad' : ''));
}
// Mehrere Dinge auf einmal: alles, was ganz im Rechteck steht (samt Deko, Wegen, Schienen), wird angehoben und
// zieht mit gleichen Abständen um. Das Gelände bleibt; Rathaus und Sehenswürdigkeiten bleiben stehen.
function pickUpGroup(x0, y0, x1, y1) {
  const items = [], seen = new Set();
  let stays = 0;
  const inside = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const k = x + ',' + y, a = anchorAt(x, y), t = a && state.tiles.get(a);
    if (t && !seen.has(a)) {
      seen.add(a);
      const [ax, ay] = keyXY(a);
      if (t.b === 'lm' || ITEMS[t.b].fixed || !footprint(t.b, ax, ay, t.rot || 0, t).every(([fx, fy]) => inside(fx, fy))) stays++;
      else items.push({ kind: 'tile', t, from: a, dx: ax - x0, dy: ay - y0 });
    }
    (decosAt(k) || []).forEach((d, slot) => { if (d) items.push({ kind: 'deco', d, from: [k, slot], dx: x - x0, dy: y - y0 }); });
  }
  if (!items.length) { toast(stays ? 'Das bleibt stehen (Rathaus, Sehenswürdigkeit oder ragt hinaus)' : 'Hier ist nichts zum Verschieben'); return false; }
  if (items.length === 1) {                          // ein einzelnes Ding: wie gewohnt (mit Drehen)
    const it = items[0], [x, y] = it.kind === 'tile' ? keyXY(it.from) : keyXY(it.from[0]);
    pickUp(x, y, it.kind === 'deco' ? it.from[1] : 0);
    return true;
  }
  for (const it of items) {
    if (it.kind === 'tile') state.tiles.delete(it.from);
    else { const [k, slot] = it.from, ds = decosAt(k); ds[slot] = null; if (ds.every(v => !v)) state.decos.delete(k); }
  }
  moving = { kind: 'group', items, cx: Math.round((x1 - x0) / 2), cy: Math.round((y1 - y0) / 2) };
  $('rot-btn').hidden = true;
  recalc();
  sfx('deco');
  toast(`${items.length} Dinge angehoben – tippe, wohin sie sollen` + (stays ? ' (manches bleibt stehen)' : ''));
  return true;
}
// Passt die Gruppe mit ihrer Mitte auf (hx, hy)? Fehler je Ding (Map) und der erste
function groupErrors(hx, hy) {
  const ox = hx - moving.cx, oy = hy - moving.cy, errs = new Map();
  let first = null;
  for (const it of moving.items) {
    const x = ox + it.dx, y = oy + it.dy;
    let err = null;
    if (it.kind === 'deco') err = smallError(it.d.b, x, y, it.from[1], { move: true });
    else {
      const b = it.t.b;
      if (b === 'schiene' || b === 'weg') {
        const water = terrainAt(x, y) === 'water';
        if (!ownedTile(x, y)) err = notMine(x, y);
        else if (it.t.bridge && !water) err = 'Brücken nur übers Wasser';
        else if (b === 'schiene' && !it.t.bridge && water) err = 'Übers Wasser braucht die Schiene eine Brücke';
      }
      err = err || placeError(b, x, y, it.t.rot || 0, { move: true, t: it.t });
    }
    errs.set(it, err);
    first = first || err;
  }
  return { ox, oy, errs, first };
}
function dropGroup(hx, hy) {
  const { ox, oy, first } = groupErrors(hx, hy);
  if (first) { fail(first); return false; }
  const now = performance.now();
  for (const it of moving.items) {
    const k = (ox + it.dx) + ',' + (oy + it.dy);
    if (it.kind === 'tile') state.tiles.set(k, { ...it.t, born: now });
    else { if (!state.decos.has(k)) state.decos.set(k, newSlots()); state.decos.get(k)[it.from[1]] = { ...it.d, born: now }; }
  }
  moving = null;
  sfx('build');
  recalc();
  save();
  return true;
}
function moveError(x, y, slot) {
  if (moving.kind === 'deco') return smallError(moving.d.b, x, y, slot, { move: true });
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
    const k = x + ',' + y, under = plazaSpot(moving.t.b, x, y) ? wegUnder(state.tiles.get(k)) : null, t = { ...moving.t, rot, born: performance.now() };
    if (under) t.weg = under; else delete t.weg;
    state.tiles.set(k, t);
  }
  moving = null;
  $('rot-btn').hidden = true;
  sfx('build');
  recalc();
  save();
}
function cancelMove() {
  if (!moving) return;
  for (const it of carried()) {
    if (it.kind === 'deco') {
      const [k, slot] = it.from;
      if (!state.decos.has(k)) state.decos.set(k, newSlots());
      state.decos.get(k)[slot] = it.d;
    } else state.tiles.set(it.from, it.t);
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

// Kunstakademie: ein Stück Aussehen (Farbe, Wege-Stil, Deko) mit Talern freischalten
function buyDesign(id) {
  const d = DESIGN_BY_ID[id], err = designError(d);
  if (err) { fail(err); return false; }
  state.money -= designPrice(d);
  state.design.add(id);
  sfx('research');
  buildToolbar();
  save();
  toast(`Freigeschaltet: ${d.name}`);
  return true;
}


function tap(sx, sy, isTouch) {
  const { x, y, slot } = slotAt(sx, sy);
  lastTap = { sx, sy, t: performance.now() };             // Handy: Fenster rückt das Angetippte ins Bild
  const v = planPoint(sx, sy);                              // Zaun & Co.: Eckpunkt statt Feld
  if (planTap(v.x, v.y, isTouch)) return;                   // Linie/Rechteck: Ende setzen, bauen oder abbrechen
  const ek = tool === 'abriss' && edgeNear(sx, sy);           // Abreißen: auf eine Linie getippt
  if (ek) { if (removeEdge(ek)) { sfx('dig'); recalc(); save(); } return; }
  const gk = tool === 'look' && edgeNear(sx, sy);             // Ansehen: Durchgang angetippt → Torbogen wählen
  if (gk) { openGateInfo(gk); return; }                       // jede Linie: Fenster mit Löschen (am Durchgang auch Bögen)
  if (collectStarAt(x, y)) return;                          // Sternschnuppe aufsammeln (Sternwarte)
  const ck = chunkOf(x, y);
  const a = anchorAt(x, y), t = a && state.tiles.get(a);
  const [ax, ay] = a ? keyXY(a) : [x, y];
  const isle = isleOf(x, y);
  if (isle && !isleOpen(isle.id)) { openIsle(isle.id, sx, sy); return; }
  if (t && t.b === 'lm' && (tool === 'look' || !state.owned.has(ck))) { openLandmark(ax, ay); return; }
  if (!ownedTile(x, y) && !(seaTool(tool) && isSea(x, y))) { toast('Da ist nur Meer.'); return; }
  const ds = decosAt(x + ',' + y);
  if (tool === 'look') {
    const ct = critterAt(sx, sy);                             // Tier in der Natur angetippt (Block 56)
    if (ct) { tapCritter(ct); return; }
    const wk = walkerAt(sx, sy);                              // Bewohner angetippt (Block 55)
    if (wk) { openWalkerInfo(wk); return; }
    if (ds && ds[slot]) openDecoInfo(x, y, slot);
    else if (t) openInfo(ax, ay);
    else if (terraLook(x, y) === 'park') openParkInfo(x, y);
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
let undoPending = null;
const UNDO_MAPS = { tiles: () => state.tiles, decos: () => state.decos, edges: () => state.edges, terra: () => state.terra };
const undoStr = v => JSON.stringify(v, (key, val) => key === 'born' || key === 'rate' ? undefined : val);   // ohne Animation/Tempo
function undoSnap() {
  const maps = {};
  for (const [n, get] of Object.entries(UNDO_MAPS)) { const m = new Map(); for (const [k, v] of get()) m.set(k, undoStr(v)); maps[n] = m; }
  return { money: state.money, res: { ...state.res }, claimed: new Set(state.claimed), maps };
}
function undoCommit(s) {
  const changes = [];
  for (const [n, get] of Object.entries(UNDO_MAPS)) {
    const before = s.maps[n], cur = get();
    for (const [k, v] of cur) { const a = undoStr(v); if (before.get(k) !== a) changes.push([n, k, before.get(k), a]); }
    for (const [k, b] of before) if (!cur.has(k)) changes.push([n, k, b, undefined]);
  }
  const claimed = [...state.claimed].filter(k => !s.claimed.has(k)), dres = {};
  for (const r of Object.keys(state.res)) if (state.res[r] !== s.res[r]) dres[r] = state.res[r] - (s.res[r] || 0);
  if (!changes.length && !claimed.length) return;
  undoStack.push({ changes, claimed, dm: state.money - s.money, dres });
  if (undoStack.length > UNDO_MAX) undoStack.shift();
  if (typeof updateUndoBtn === 'function') updateUndoBtn();
}
// Eine Nutzer-Aktion: alles darin wird ein Schritt (beim Verschieben erst, wenn abgelegt ist)
function undoable(fn) {
  if (!undoPending) undoPending = undoSnap();
  try { return fn(); } finally { if (!moving && undoPending) { const s = undoPending; undoPending = null; undoCommit(s); } if (typeof updateUndoBtn === 'function') updateUndoBtn(); }
}
function undo() {
  if (moving) { cancelMove(); undoPending = null; return true; }
  const step = undoStack.pop();
  if (typeof updateUndoBtn === 'function') updateUndoBtn();
  if (!step) { toast('Nichts zum Rückgängigmachen'); return false; }
  for (const [n, k, , a] of step.changes) {                        // seitdem dort etwas verändert? Dann lieber nicht
    const v = UNDO_MAPS[n]().get(k);
    if ((v === undefined ? undefined : undoStr(v)) !== a) { fail('Geht nicht mehr – dort hat sich seitdem etwas verändert'); return false; }
  }
  const short = state.money - step.dm < 0 ? 'Taler' : Object.entries(step.dres).find(([r, d]) => state.res[r] - d < 0);
  if (short) { fail(`Zu wenig ${short === 'Taler' ? 'Taler' : RES[short[0]].name}, um das zurückzunehmen`); undoStack.push(step); updateUndoBtn(); return false; }
  for (const [n, k, b] of step.changes) { const m = UNDO_MAPS[n](); if (b === undefined) m.delete(k); else m.set(k, JSON.parse(b)); }
  for (const k of step.claimed) state.claimed.delete(k);
  state.money -= step.dm;
  for (const [r, d] of Object.entries(step.dres)) state.res[r] -= d;
  sandCache.clear(); landCache.clear(); waterChanged(); previewCache = null;
  sfx('dig'); recalc(); save();
  toast('↶ Rückgängig');
  return true;
}
