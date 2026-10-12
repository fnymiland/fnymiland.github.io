'use strict';
// ---------------------------------------------------------------------------
// Anhöhen (Block 157, Relief wie bei Animal Crossing): Felder liegen eine Ebene höher. `state.hills`: Feld → { w: Wandart, h?: Ebene
// (fehlt = 1) }. Alles auf dem Feld wird angehoben gezeichnet (render.js tileA/tileB), die Oberseite ist der normale Boden (drawGround),
// sichtbare Wände (+x, +y), wo das Nachbarfeld tiefer liegt. Stufe 2: oben Wege, Gleise, Plätze (Dinge, die auf einen Weg dürfen), Deko
// und Gelände; Stufe 3 (157j): auch Gebäude und Bahnhöfe. Hinauf führen die Treppe (Block 157d, zu Fuß; Wegenetz) und die Gleis-Rampe (nur Züge) –
// unten in dieser Datei.
// ---------------------------------------------------------------------------
const HILL_H = 26;                                                       // eine Ebene (so hoch wie die Steinarkaden)
const HILL_WALLS = ['fels', 'erde', 'mauer'];
const HILL_STY = {
  fels: { v: '#a69a8c', u: '#8a7f73', line: 'rgba(70,60,50,0.35)', lip: '#86c35b', lipH: 2.2 },
  erde: { v: '#a57a52', u: '#8a6342', line: 'rgba(60,40,25,0.35)', lip: '#7fbf55', lipH: 4 },
  mauer: { v: '#cbbda4', u: '#b2a48b', line: 'rgba(90,75,55,0.45)', lip: '#8fcf68', lipH: 2.2 },
};
const hillAt = (x, y) => (state.hills && state.hills.size && state.hills.get(x + ',' + y)) || null;
const hillLevel = (x, y) => { const h = hillAt(x, y); return h ? (h.h || 1) : 0; };
const hillLift = (x, y) => hillLevel(x, y) * HILL_H;
const hillWall = h => HILL_WALLS[(h && h.w) || 0] || 'fels';
// Gleiche Höhe auf allen Feldern (große Deko, Eckpunkt-Deko)
const sameLevel = tiles => tiles.every(([x, y]) => hillLevel(x, y) === hillLevel(tiles[0][0], tiles[0][1]));

// --- Was darf auf eine Anhöhe (Stufe 3, Block 157j, Nutzer 10.10.2026) ---
// Alle Gebäude (Häuser, Betriebe, Läden, Bildung, Strom auf Wiese), große Bauten (Wunder, Kultur, Freizeitpark), Bahnhof und Hbf (Züge halten
// oben, hinauf über die Gleis-Rampe), U-Bahn-Eingang (auf dem Tunnel unter der Anhöhe), dazu wie in Stufe 2 Wege, Gleise, Plätze, Deko, Gelände.
// Nicht: was Wasser braucht (Ufer, Strand, Steg, Meer, Seebrücke: HILL_WET), die Tunneleinfahrt (nur unten), Überdachungen (eigener Block 157k),
// Parkbahn und Seilbahn-Station (fahren/hängen am Boden), Treppe und Gleis-Rampe (stehen unten), Teich und Aufschütten. Mehrfeld-Gebäude stehen
// ganz oben auf einer Ebene (sameLevel, auch getragen, gedreht, kopiert). Ohne Treppe geht Bauen trotzdem – „weit weg“ (hillRegions)
const HILL_NO = new Set(['dach', 'dachtreppe', 'stuetze', 'pb_gleis', 'pb_station', 'seilbahn', 'tunneleinfahrt', 'huegeltreppe', 'huegelrampe', 'graben', 'schuett']);
const HILL_ROOF = new Set(['dach', 'dachtreppe', 'stuetze']);
const HILL_WET = new Set(['shore', 'strand', 'boot', 'meer', 'offshore', 'pier']);
const hillOk = b => { const d = ITEMS[b]; return !!d && !HILL_NO.has(b) && !HILL_WET.has(d.needs) && !d.edge; };
// Was beim Anheben und Abtragen mit hinauf bzw. hinunter kommt (wie Stufe 2): Wege, Gleise, Plätze, Deko-Felder, Gelände. Gebäude nie – erst mit
// ✋ wegtragen, dann oben absetzen (157j); große Deko auch nicht (hillStuckOn)
const HILL_CARRY_NO = new Set(['dach', 'dachtreppe', 'stuetze', 'pb_gleis', 'pb_station', 'seilbahn', 'ubahn', 'huegeltreppe', 'huegelrampe']);
const hillCarryOk = b => { const d = ITEMS[b]; return !!d && !HILL_CARRY_NO.has(b) && (b === 'anhoehe' || b === 'weg' || b === 'schiene' || !!TERRAFORM[b] || (d.cat === 'deko' && !d.edge) || plazaOk(b)); };
const HILL_STUCK_UP = 'Hier steht ein Gebäude – erst mit ✋ wegtragen, dann oben absetzen';
const HILL_STUCK_DOWN = 'Oben steht ein Gebäude – erst abreißen oder mit ✋ wegtragen';
// Steht auf Feld (x, y) etwas, das beim Anheben/Abtragen nicht mitkommt (Gebäude, große Deko)? → das Ding oder null. Nur, was noch in state.tiles
// steht und das Feld deckt: im Abriss-Rechteck (batch) ist COVER noch vom alten Stand
function hillStuckOn(x, y) {
  const a = COVER.get(x + ',' + y), t = a && state.tiles.get(a);
  if (!t) return null;
  const [ax, ay] = keyXY(a), [w, h] = sizeOf(t.b, t.rot || 0, t);
  if (x < ax || y < ay || x >= ax + w || y >= ay + h) return null;
  return !hillCarryOk(t.b) || w > 1 || h > 1 ? t : null;
}
// Fehler, wenn b auf (Teilen von) tiles nicht stehen darf
function hillError(b, tiles) {
  if (!state.hills || !state.hills.size) return null;
  const up = tiles.some(([x, y]) => hillAt(x, y));
  if (!up) return null;
  if (!hillOk(b)) {
    const d = ITEMS[b];
    return b === 'pb_gleis' || b === 'pb_station' ? 'Die Parkeisenbahn fährt unten – auf Anhöhen geht die Eisenbahn'
      : b === 'tunneleinfahrt' ? 'Die Tunneleinfahrt steht unten – der Tunnel darf unter der Anhöhe weiterführen'
      : b === 'seilbahn' ? 'Die Seilbahn-Station steht unten – nicht auf einer Anhöhe'
      : HILL_ROOF.has(b) ? 'Auf einer Anhöhe geht keine Überdachung'
      : d && HILL_WET.has(d.needs) ? 'Das gehört ans Wasser – oben auf der Anhöhe geht es nicht'
      : 'Das geht oben auf einer Anhöhe nicht';
  }
  if (!sameLevel(tiles)) return 'Nicht über die Kante einer Anhöhe';
  return null;
}
// Fußgängerbrücke (Bogenbrücke über den Bahnübergang, draw-objects.js archAt): ihre Rampen reichen je ein halbes Feld auf die Nachbarn längs des
// Wegs – dort muss ebener Boden derselben Höhe sein, sonst hinge sie über der Kante einer Anhöhe bzw. steckte in deren Wand, einer Treppe oder
// Gleis-Rampe (Nutzer: „nichts steht über“). archHillError: darf der Bahnübergang (x, y) eine bekommen (setCrossing)? Ohne Anhöhen immer.
// archAround: (x, y) ist eine Fußgängerbrücke oder ihr Nachbar längs des Wegs – dort ändert sich die Höhe nicht (Anheben, Abtragen, Treppe,
// Gleis-Rampe). Prüft auch ohne Anhöhen (die erste Anhöhe könnte daneben entstehen)
const ARCH_LEVEL = 'Die Fußgängerbrücke braucht auf beiden Seiten ebenen Boden in derselben Höhe';
function archHillError(x, y) {
  if (!state.hills || !state.hills.size) return null;
  const { n } = crossingAxes(x, y), lv = hillLevel(x, y);
  return [-1, 1].some(s => hillLevel(x + s * n[0], y + s * n[1]) !== lv || slopeAt(x + s * n[0], y + s * n[1])) ? ARCH_LEVEL : null;
}
function archAround(x, y) {
  for (const [dx, dy] of [[0, 0], ...DIRS]) {
    const t = state.tiles.get((x + dx) + ',' + (y + dy));
    if (!isCrossing(t) || !t.foot) continue;
    if (!dx && !dy) return true;
    const { n } = crossingAxes(x + dx, y + dy);
    if (Math.abs(dx) === n[0] && Math.abs(dy) === n[1]) return true;
  }
  return false;
}
const ARCH_HERE = 'Hier steht eine Fußgängerbrücke – ihr Boden bleibt eben';
// Ein Feld anheben? (Rechteck aufziehen, plan.js)
function hillRaiseError(x, y, noCost) {
  if (!available('anhoehe')) return `Anhöhe: ${lockText('anhoehe').replace('🔒 ', 'erst mit ')}`;
  if (!ownedTile(x, y)) return notMine(x, y);
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  if (bpFronts(x, y).length) return 'Vor dem Bergportal muss Platz bleiben – dort kommt die Schiene hinein';   // Block 157m
  const t = objAt(x, y);
  if (t) {
    if (t.b === 'huegeltreppe') return 'Hier steht eine Treppe – erst abreißen';   // Treppe (Block 157d)
    if (t.b === 'huegelrampe') return 'Hier ist eine Gleis-Rampe – erst abreißen';
    if (!hillCarryOk(t.b)) return HILL_STUCK_UP;                         // Gleise kommen mit hinauf (wie Wege); Gebäude nie (157j)
    const [w, h] = sizeOf(t.b, t.rot || 0, t);
    if (w > 1 || h > 1) return 'Große Deko erst wegnehmen – sie kommt danach auf die fertige Anhöhe';
  }                                                                      // Wege (auch unter Platz-Dingen) kommen mit hinauf (Stufe 2)
  const ds = decosAt(x + ',' + y);                                       // Stütze im Eck-/Seitenplatz (geht auch ohne Dach): oben gibt es keine (smallError)
  if (ds && ds.some(d => d && baseOf(d.b) === 'stuetze')) return 'Hier steht eine Stütze – erst wegnehmen';
  if (state.roofs && roofAt(x, y)) return 'Unter einer Überdachung geht keine Anhöhe';
  if (bkAt(x, y)) return 'Unter einer Brücke geht keine Anhöhe';             // Brücke (Block 160)
  for (const k of ['a' + x + ',' + y, 'a' + x + ',' + (y + 1), 'b' + x + ',' + y, 'b' + (x + 1) + ',' + y]) if (state.edges.has(k)) return `Am Rand steht: ${ITEMS[state.edges.get(k).b].name} – erst entfernen`;
  for (const [vx, vy] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (postAt(vx, vy)) return 'An der Ecke steht schon etwas';
  if (stairsAround(x, y, true).length) return 'Vor dem Fuß der Treppe muss Platz bleiben';   // Treppe (Block 157d): sonst führte sie in eine Wand
  if (rampsAround(x, y, true).length) return 'Vor dem Fuß der Gleis-Rampe muss Platz bleiben';
  if (archAround(x, y)) return ARCH_HERE;
  if (noCost) return null;
  if (state.money < ITEMS.anhoehe.cost) return 'Zu wenig Taler';
  return matError(ITEMS.anhoehe.mat);
}
function raiseHill(x, y) {
  const k = x + ',' + y, w = decoLookNew('anhoehe').form || 0, h = hillAt(x, y);
  if (h) { if ((h.w || 0) === w) return false; h.w = w; groundVersion++; sfx('deco'); recalc(); save(); return true; }   // nur die Wand umstellen
  const err = hillRaiseError(x, y);
  if (err) { fail(err); return false; }
  state.money -= ITEMS.anhoehe.cost; payMat(ITEMS.anhoehe.mat);
  state.hills.set(k, { w });
  groundVersion++; sfx('dig'); recalc(); save();
  return true;
}
// Abtragen: voll zurück; was oben steht, landet unten
function lowerHill(x, y) {
  const k = x + ',' + y;
  if (!state.hills.has(k)) return false;
  if (stairsAround(x, y).length || rampsAround(x, y).length || archAround(x, y) || bkOnHill(x, y)) return false;   // Treppe/Gleis-Rampe führt hinauf, Fußgängerbrücke, Brücke liegt auf: erst sie abreißen (demolishInfo sagt es)
  if (hillStuckOn(x, y)) { fail(HILL_STUCK_DOWN); return false; }      // Gebäude oben (157j): käme sonst über die Kante
  hillTake(x, y);
  addFloat(x, y, '+' + fmt(ITEMS.anhoehe.cost), '#3f8f43');
  sfx('dig'); recalc(); save();
  return true;
}
// Anhöhe vom Feld nehmen und voll erstatten (lowerHill, Treppe in die Anhöhe)
function hillTake(x, y) {
  const k = x + ',' + y;
  state.hills.delete(k);
  const e = hillSprites.get(k);                                          // Bildchen gleich freigeben
  if (e) { freeCanvas(e.c); hillSprites.delete(k); }
  state.money += ITEMS.anhoehe.cost;
  for (const [r, n] of Object.entries(ITEMS.anhoehe.mat || {})) state.res[r] += n;
  groundVersion++;
}
// alle verbundenen Felder gleicher Höhe (Wandart für die ganze Anhöhe umstellen)
function hillGroup(x, y) {
  const lv = hillLevel(x, y), out = [], seen = new Set([x + ',' + y]), q = [[x, y]];
  while (q.length && out.length < 2000) {
    const [cx, cy] = q.shift(); out.push([cx, cy]);
    for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy, nk = nx + ',' + ny; if (!seen.has(nk) && hillLevel(nx, ny) === lv) { seen.add(nk); q.push([nx, ny]); } }
  }
  return out;
}
function setHillWall(x, y, w) {
  let n = 0;
  for (const [hx, hy] of hillGroup(x, y)) { const h = hillAt(hx, hy); if (h && (h.w || 0) !== w) { h.w = w; n++; } }
  if (n) { groundVersion++; sfx('deco'); recalc(); save(); }
  return n;
}

// --- Zeichnen: je Feld ein Bildchen (Oberseite + sichtbare Wände), wie die Dächer ---
const hillSprites = new Map(), HILL_BUDGET = 6;   // ms je Bild fürs Neumalen nach dem Zoomen; danach das alte Bildchen (andere Stufe) weiter
let hillPaintMs = 0, hillPaintFrame = -1;
const HILL_BOX = { left: -TW / 2 - 3, top: -TH / 2 - HILL_H - 8, w: TW + 6, h: TH + HILL_H + 14 };
// Vorschau „Treppe in die Anhöhe“ (render.js, nur für dieses Bild): { k, x, y, rot, lv } – das Feld zeichnet sich eine Ebene tiefer mit
// der Treppe (rot), seine Nachbarn als eigene Bildchen (drawHillTile 'p' + Feld), die echten bleiben. Spielregeln fragen es nie.
// Gleis-Rampe (rampGapFor): dazu ramp: true, keys = alle abgesenkten Felder (die eingelassenen, bis 2), top = Schlüssel ihres oberen Felds,
// len/form = ihre Länge und Form, ax/ay = Anker
let hillGap = null;
const hillGapHas = k => !!hillGap && (hillGap.keys ? hillGap.keys.has(k) : hillGap.k === k);   // Feld k gehört zur Vorschau (render.js)
const drawLevel = (x, y) => hillGap && (hillGap.keys ? hillGap.keys.has(x + ',' + y) : hillGap.x === x && hillGap.y === y) ? hillGap.lv : hillLevel(x, y);
const gapStair = (x, y) => !!hillGap && !hillGap.ramp && hillGap.x === x && hillGap.y === y;   // Geist der Treppe in die Anhöhe
const gapNear = (x, y) => !!hillGap && (hillGap.keys ? [...hillGap.keys].some(k => { const [gx, gy] = keyXY(k); return Math.abs(gx - x) + Math.abs(gy - y) === 1; })
  : Math.abs(hillGap.x - x) + Math.abs(hillGap.y - y) === 1);
// Wand ein Stück unter das später gezeichnete Bildchen des Nachbarn verlängern (Nutzer: bündig – sonst schimmert an der Fuge zweier
// Wandbildchen der Boden durch beide geglätteten Kanten: grünlicher Strich). Nur wo der Nachbar es ganz deckt: gerade weiter (seine Wand
// gleich hoch) oder Innenecke (Anhöhe davor); nie an Außenecken und nicht an Treppen. [vorn +y, rechts +x]
// Schmale Treppe daneben (M/N): die Wand ihres Streifens Anhöhe am Fuß läuft in dieser weiter – wie gleich hoch
const HILL_EXT = 0.0075;
function hillExt(x, y, lv, st, wu = lv - drawLevel(x + 1, y), wv = lv - drawLevel(x, y + 1)) {
  const strip = c => c === 'v' ? st.includes('M') && stairRotAt(x + 1, y) === 0 : st.includes('N') && stairRotAt(x, y + 1) === 3;
  const ok = (nx, ny, fx, fy, c) => (drawLevel(nx, ny) === lv || strip(c)) && (drawLevel(fx, fy) === drawLevel(fx - (nx - x), fy - (ny - y)) || drawLevel(fx, fy) >= lv)
    && !st.includes(c) && !hillStairEnds(nx, ny).includes(c);
  return [wv > 0 && ok(x + 1, y, x + 1, y + 1, 'v') ? HILL_EXT : 0, wu > 0 && ok(x, y + 1, x + 1, y + 1, 'u') ? HILL_EXT : 0];
}
// Wände nach +x/+y (in Ebenen): keine, wo eine schmale Treppe ihren Streifen Anhöhe an das Feld lehnt (M/N – er deckt die Wand, oben bündig)
const hillWallsAt = (x, y, lv, st) => [st.includes('M') ? 0 : lv - drawLevel(x + 1, y), st.includes('N') ? 0 : lv - drawLevel(x, y + 1)];
function hillSig(x, y, h) {
  const lv = h.h || 1, st = hillStairEnds(x, y), [wu, wv] = hillWallsAt(x, y, lv, st);
  let s = (h.w || 0) + ':' + wu + ':' + wv + ':' + (drawLevel(x - 1, y) < lv ? 1 : 0) + (drawLevel(x, y - 1) < lv ? 1 : 0) + ':' + terrainAt(x, y) + ':' + (terraLook(x, y) || '') + ':' + (COVER.has(x + ',' + y) ? 1 : 0) + ':' + (isBeach(x, y) ? 1 : 0);
  if (terraLook(x, y) === 'park' || terraLook(x, y) === 'fz') {          // Parkrand (drawGround): Nachbarn und ☰ „Ränder aus“
    s += state.noBorders ? 'r' : '';
    for (const [dx, dy] of DIRS) s += terraLook(x + dx, y + dy) === terraLook(x, y) ? 1 : 0;
  }
  if (st) s += ':t' + st;                                                // Treppe (Block 157d): dort keine Grasnarbe bzw. keine Kante
  if (hillMiter(x, y, lv)) { const rl = miterRamp(x - 1, y, 1, lv), ru = miterRamp(x, y - 1, 2, lv); s += ':m' + (rl || ru ? rl + '' + ru : ''); }
  const ex = hillExt(x, y, lv, st, wu, wv);
  if (ex[0] || ex[1]) s += ':e' + (ex[0] ? 1 : 0) + (ex[1] ? 1 : 0);
  s += hillShadeSig(x, y);                                               // Schlagschatten der Dinge oben (Block 157j)
  if (bpOn()) { const bp = bpAt(x, y); if (bp) s += bpSig(x, y, bp); }   // Bergportal (157m): Form, Richtung, Gleisbett davor
  return s;
}
// Treppen, die auf Feld (x, y) hinaufführen, als Zeichen je Seite: v/u = vorn (+y/+x, Wand ohne Grasnarbe – die Stufen decken sie),
// U/V = hinten (−x/−y, keine dunkle Kante oben – die oberste Stufe schließt bündig an). Treppen hinten daneben (Feld ist ihre Wange, oberste
// Stufe so hoch wie die Oberseite): a/b = bei −x, oberste Stufe bei −y/+y; c/d = bei −y, oberste Stufe bei −x/+x. '' = keine.
// Gleis-Rampe: ihr oberes Feld eingelassen (A, C) wie die oberste Stufe (v/u/U/V – ganz breit bzw. mit den Streifen Anhöhe gleich hoch); a–d
// nicht. Davor (B Damm, D Viadukt, schmal): vorn behält die Wand ihre Grasnarbe (die Rampe deckt sie nur in der Mitte), hinten endet die dunkle
// Kante nur, wo die Rampe anschließt: P/Q = bei −x/−y ein Damm (±GR_DW), X/Y = ein Viadukt (±GR_VW).
// Schmale Treppe daneben: ihr Streifen Anhöhe lehnt an dieses Feld, gleich hoch – A/C = bei −x/−y (statt a–d: dort gar keine dunkle Kante),
// M/N = bei +x/+y (keine Wand, die Oberseite reicht ein Stück unter den Streifen wie unter eine gleich hohe Anhöhe). Ebenso der Streifen im
// schmalen Einschnitt der Gleis-Rampe C daneben: U/V bei −x/−y, M/N bei +x/+y
function hillStairEnds(x, y) {
  const rs = rampFresh().n > 0 || (!!hillGap && !!hillGap.ramp);
  if (!stairFresh().n && !rs && !hillGap) return '';
  let s = '';
  for (const [c, r, dx, dy] of [['v', 0, 0, 1], ['u', 3, 1, 0], ['U', 1, -1, 0], ['V', 2, 0, -1], ['a', 0, -1, 0], ['b', 2, -1, 0], ['c', 3, 0, -1], ['d', 1, 0, -1]]) {
    const nx = x + dx, ny = y + dy, side = 'abcd'.includes(c);
    if (stairRotAt(nx, ny) === r && (!side || drawLevel(nx, ny) + 1 === hillLevel(x, y))) s += c;   // schmal wie breit: neben ihr die Böschung (11.10.2026), die Wand hier ist ihre Wange
    else if (!side && rs) {
      const F = RAMP_FORMS[rampTopFormAt(nx, ny, r)];
      if (F) s += F.cut ? c : c === 'U' ? (F.viadukt ? 'X' : 'P') : c === 'V' ? (F.viadukt ? 'Y' : 'Q') : '';
    }
  }
  if (rs) for (const [c, dx, dy] of [['U', -1, 0], ['V', 0, -1], ['M', 1, 0], ['N', 0, 1]]) {   // Streifen im schmalen Einschnitt daneben
    if (!s.includes(c) && rampStripAt(x + dx, y + dy, dy ? 1 : 0) && drawLevel(x + dx, y + dy) + 1 === hillLevel(x, y)) s += c;
  }
  return s;
}
// Drehung der Treppe auf (x, y), auch der Vorschau „Treppe in die Anhöhe“ (hillGap); −1 = keine
const stairRotAt = (x, y) => { const t = stairAt(x, y); return t ? stairRotOf(t) : gapStair(x, y) ? hillGap.rot : -1; };
// Innenecke hinten: enden an der hinteren Ecke von (x, y) die dunklen Kanten oben von links (−y-Kante von x − 1, y bzw. der hintere Keil
// einer Treppe dort hinauf) und von rechts (−x-Kante von x, y − 1 bzw. Keil) – Anhöhe in L-Form, Treppe an der Kante. Dann schließt
// (x, y) ihre Gehrung (paintHill), sonst bliebe zwischen ihnen eine helle Kerbe
function hillMiter(x, y, lv) {
  const cl = drawLevel(x - 1, y - 1);
  if (cl >= lv) return false;
  const arm = (ax, ay, r, cut) => {                                      // r: Treppe dort hinauf zu (x, y); cut: Zeichen, mit denen die Kante vor der Ecke endet
    if (hillAt(ax, ay) && drawLevel(ax, ay) === lv) { const st = hillStairEnds(ax, ay); return !cut.some(c => st.includes(c)); }
    if (rampTopRotAt(ax, ay) === r) {                                    // Gleis-Rampe A (ganz breit): ihre offene Seite hinten trägt die Kante
      if (!rampWideForm(rampTopFormAt(ax, ay, r))) return false;          // schmale (B, C, D): ihre Kante trifft die der Anhöhe nicht an der Ecke
      const a = rampAt(ax, ay), n = rampAt(x - 1, y - 1);
      return drawLevel(ax, ay) + 1 === lv && cl <= drawLevel(ax, ay) && !(a && n && rampWide(a, n));
    }
    return stairRotAt(ax, ay) === r && drawLevel(ax, ay) + 1 === lv && cl <= drawLevel(ax, ay) && stairRotAt(x - 1, y - 1) !== r;   // dort ein Keil
  };
  return arm(x - 1, y, 1, ['V', 'd', 'C']) && arm(x, y - 1, 2, ['U', 'b', 'A']);
}
// Arm der Gehrung (hillMiter) an Feld (ax, ay), das mit Drehung r hinauf zu (x, y) führt: Länge der Gleis-Rampe A, deren offene Seite hinten
// dort die Kante trägt (auch Vorschau in die Anhöhe); 0 = gerade Kante (Anhöhe, Treppe – deren Keil liegt oben waagerecht)
const miterRamp = (ax, ay, r, lv) => {
  if ((hillAt(ax, ay) && drawLevel(ax, ay) === lv) || rampTopRotAt(ax, ay) !== r) return 0;
  const a = rampAt(ax, ay);
  return a ? a.len : (hillGap && hillGap.len) || 1;
};
// Gehrung, wenn ein Arm die schräge Kante einer Gleis-Rampe A ist (paintHill; Nutzer: bündig – sonst blieb unter der Ecke eine helle Kerbe):
// Fläche zwischen den Enden der beiden dunklen Streifen unter der Ecke V – V, Ende des linken (an der −x-Kante), Schnitt der Unterkanten, Ende
// des hinteren (an der −y-Kante). Gerade Kante: Streifen 1,68 senkrecht darunter (wie paintHill); Rampe (paintRamp): quer zu ihrer schrägen
// Kante 1,5 breit. rl/ru: Länge der Rampe links bzw. hinten, 0 = gerade. Bildpunkte bei Zoom 1
function rampMiter(V, rl, ru) {
  const dU = [TW / 2, TH / 2], dV = [-TW / 2, TH / 2];                    // −y-Kante (längs u) und −x-Kante (längs v) im Bild
  const low = (len, along, side) => {                                    // Unterkante des Streifens: [Punkt, Richtung]
    if (!len) return [[V[0], V[1] + 1.68], along];
    const d = [along[0], along[1] - HILL_H / len], l = Math.hypot(d[0], d[1]);   // Kante des Keils: je Feld HILL_H/len hinauf
    let n = [-d[1] / l, d[0] / l];
    if (n[0] * side[0] + n[1] * side[1] < 0) n = [-n[0], -n[1]];          // zur Oberseite des Keils hin
    const w = Math.min(1.5, 0.5 * (n[0] * side[0] + n[1] * side[1]));   // ganz breit (A): nie schmaler als der Streifen
    return [[V[0] + w * n[0], V[1] + w * n[1]], d];
  };
  const cut = ([p, d], [q, e]) => { const c = d[0] * e[1] - d[1] * e[0]; if (Math.abs(c) < 1e-9) return null; const t = ((q[0] - p[0]) * e[1] - (q[1] - p[1]) * e[0]) / c; return [p[0] + t * d[0], p[1] + t * d[1]]; };
  const A = low(rl, dU, dV), B = low(ru, dV, dU), h = cut(A, [V, dV]), q = cut(B, [V, dU]), m = cut(A, B);
  const side = p => (q[0] - h[0]) * (p[1] - h[1]) - (q[1] - h[1]) * (p[0] - h[0]);
  return m && side(m) * side(V) < 0 ? [V, h, m, q] : [V, h, q];          // verschieden breite Streifen: gerade von Ende zu Ende
}
// eine Wand von (a0, b0) nach (a1, b1) (Feldkoordinaten relativ zum Feld), Höhe hb..ht, nach +x ('u') bzw. +y ('v'). ht1: Höhe am Ende
// (Keil der Treppe, Block 157d: oben schräg; sonst = ht), lip false: ohne Grasnarbe, knee: ab da oben waagerecht auf ht1 (Keil: oberste Stufe).
// Grasnarbe und Schichten treffen an den Enden genau ihre Mitte – so laufen sie über Feldgrenzen und um Ecken bündig weiter (Nachbarwand,
// Keil, Stirn); dazwischen wellig wie bisher. Die Grasnarbe reicht nie unter den Fuß der Wand.
// e0/e1: Stück über Anfang/Ende hinaus (Anteil der Wand) – nur unter ein später gezeichnetes Bildchen, das es ganz deckt (Nachbarwand
// geradeaus, Innenecke, Keil ↔ Anhöhe). Sonst schimmert an der Fuge der Boden durch beide geglätteten Kanten (grünlicher Strich).
// Dort Höhe wie am Ende, Schichten waagerecht weiter, die Grasnarbe läuft auf die Oberkante aus (an Innenecken stünde sie sonst über).
// hs: Höhe, nach der Felsschichten und Mauerreihen verteilt sind (sonst die der Wand) – Damm einer Gleis-Rampe über mehrere Felder: das untere
// Stück ist niedriger, seine Schichten liegen trotzdem wie die des oberen (sonst springen sie an der Feldgrenze).
// len: Länge der Wand in Feldern – kurze Wände (Streifen Anhöhe neben der schmalen Treppe) mit entsprechend weniger Wellen, Rissen, Steinen
// (sonst standen auf 0,14 Feld drei Risse dicht nebeneinander und die Schichten zackten); 1 = wie bisher
function paintHillWall(P, a0, b0, a1, b1, dir, kind, hb, ht, seed, ht1 = ht, lip = true, knee = 1, e0 = 0, e1 = 0, hs = null, len = 1) {
  const S = HILL_STY[kind], at = (s, h) => P(a0 + (a1 - a0) * s, b0 + (b1 - b0) * s, h), H = Math.max(ht, ht1) - hb, HL = hs == null ? H : hs, top = s => ht + (ht1 - ht) * Math.min(1, Math.max(0, s) / knee);
  const quad = [at(-e0, hb), at(1 + e1, hb)];
  if (e1) quad.push(at(1 + e1, ht1));
  quad.push(at(1, ht1));
  if (knee < 1) quad.push(at(knee, ht1));
  quad.push(at(0, ht));
  if (e0) quad.push(at(-e0, ht));
  poly(quad, C(dir === 'u' ? S.u : S.v));
  g.save(); g.beginPath(); quad.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
  const line = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
  const r = i => hash(seed, i, 157), one = len === 1, cnt = k => one ? k : Math.round(k * len), wl = 1 / len;   // wl: Stück der Wand je Feld
  if (kind === 'fels') {                                                 // Schichten und Risse
    const nw = one ? 6 : Math.max(1, cnt(6));
    for (let k = 1; k < 5; k++) {
      const pts = [], h = hb + k * HL / 5;
      if (e0) pts.push(at(-e0, h));
      for (let i = 0; i <= nw; i++) pts.push(at(i / nw, h + (i % nw ? r(k * 7 + i) - 0.5 : 0) * 3));
      if (e1) pts.push(at(1 + e1, h));
      line(pts, S.line, 0.9);
    }
    for (let c = 0, nc = cnt(3); c < nc; c++) { const s = one ? 0.18 + 0.3 * c + r(50 + c) * 0.1 : (c + 0.3 + r(50 + c) * 0.4) / nc; line([at(s, hb + H * 0.85), at(s + 0.05 * wl, hb + H * 0.55), at(s - 0.02 * wl, hb + H * 0.3)], S.line, 0.8); }
  } else if (kind === 'erde') {                                          // Wurzeln und Steinchen
    for (let c = 0, nc = cnt(4); c < nc; c++) { const s = one ? 0.15 + 0.22 * c : (c + 0.5) / nc; line([at(s, top(s) - 3), at(s + 0.03 * wl, top(s) - 8 - r(60 + c) * 6)], 'rgba(70,45,25,0.5)', 0.7); }
    for (let c = 0, nc = cnt(6); c < nc; c++) { const p = at(r(70 + c) * 0.9 + 0.05, hb + 3 + r(80 + c) * (H - 10)); g.beginPath(); g.ellipse(p[0], p[1], 1.6, 1.1, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(200,185,160,0.8)'; g.fill(); }
  } else {                                                               // Trockenmauer: Steine im Verband
    const rows = 5, n = one ? 4 : Math.max(1, cnt(4));
    for (let k = 0; k < rows; k++) {
      const h0 = hb + k * HL / rows, h1 = hb + (k + 1) * HL / rows, off = k % 2 ? 0.5 / n : 0;
      line([at(-e0, h1), at(1 + e1, h1)], S.line, 0.9);
      for (let i = 0; i <= n; i++) { const s = i / n + off; if (s > 0 && s < 1) line([at(s, h0), at(s, h1)], S.line, 0.9); }
    }
  }
  g.restore();
  if (!lip) return;
  const pts = [], m = one ? 8 : Math.max(1, cnt(8));                    // Grasnarbe oben (wellig)
  if (e0) pts.push(at(-e0, top(0)));
  for (let i = 0; i <= m; i++) pts.push(at(i / m, top(i / m) + 0.4));
  const low = i => { const b = top(i / m) - S.lipH - (i % m ? r(90 + i) : 0.5) * S.lipH * 0.7; return b - hb < S.lipH ? hb : b; };   // bliebe darunter kaum Wand (Keil vorn), reicht sie bis zum Fuß – keine Zacken
  if (e1) pts.push(at(1 + e1, top(1)), at(1 + e1, low(m)));
  for (let i = m; i >= 0; i--) pts.push(at(i / m, low(i)));
  if (e0) pts.push(at(-e0, low(0)));
  poly(pts, C(S.lip));
}
function paintHill(x, y, h) {
  const lv = h.h || 1, top = lv * HILL_H, kind = hillWall(h), st = hillStairEnds(x, y);
  const P = (u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up];   // relativ zur Feldmitte
  // Oberseite: der Boden, angehoben – zugeschnitten auf ihre Raute: drawGround malt darunter die Seiten des Bodens (Brauntöne, 0,5 Punkte
  // breiter als das Feld), die sonst an jeder Feldgrenze als feine Striche in der Grasnarbe der Wand standen. Nach vorn (+x, +y) ein wenig
  // größer, wo dort Anhöhe gleicher Höhe anschließt (das später gezeichnete Nachbarfeld deckt es, keine Fuge); nach hinten und über einer
  // Wand genau – sonst stünde an Ecken und Feldgrenzen eine Spitze über die Grasnarbe (Nutzer: bündig)
  const [wu, wv] = hillWallsAt(x, y, lv, st), fu = wu > 0 ? 0 : 0.0075, fv = wv > 0 ? 0 : 0.0075;
  const T = P(-0.5, -0.5, top), R = P(0.5 + fu, -0.5, top), B = P(0.5 + fu, 0.5 + fv, top), L = P(-0.5, 0.5 + fv, top);
  const clip = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); };
  g.save(); clip([T, R, B, L]);
  try { drawGround(x, y, { x: 0, y: -top }, 1, 0, true); } finally { g.restore(); }
  // Kante oben zur tieferen Seite hinten (Nutzer: Oberseite hob sich hinten nicht von der Wiese ab) – wie im Konzeptbild, 1,5 breit innen an
  // der Kante. Zugeschnitten wie die Oberseite: an Feldgrenzen schließt sie bündig an die des Nachbarn an, an Ecken steht nichts über;
  // treffen sich beide hinten an der Ecke, je eine Hälfte der Raute (auf Gehrung, nie doppelt dunkel). Neben einer Treppe (a/b, c/d) endet
  // sie an der obersten Stufe – dort liegen Stufe und Oberseite gleich hoch. Hinter einer schmalen Gleis-Rampe (P/Q Damm, X/Y Viadukt) fehlt
  // sie nur, wo die Rampe anschließt (gerade abgeschnitten)
  const bu = drawLevel(x - 1, y) < lv && !st.includes('U') && !st.includes('A'), bv = drawLevel(x, y - 1) < lv && !st.includes('V') && !st.includes('C');
  const both = bu && bv && !st.includes('a') && !st.includes('c'), n1 = 1 / STAIR_N;
  const gap = (c1, c2) => st.includes(c1) ? GR_DW : st.includes(c2) ? GR_VW : 0;
  g.strokeStyle = 'rgba(45,85,30,0.5)'; g.lineWidth = 1.5; g.lineCap = 'butt';
  for (const [on, half, at, s0, s1, gw] of [
    [bu, [T, B, L], (s, w) => P(-0.5 + w, s, top), st.includes('a') ? -0.5 + n1 : -1, st.includes('b') ? 0.5 - n1 : 1, gap('P', 'X')],   // −x: s längs v
    [bv, [T, R, B], (s, w) => P(s, -0.5 + w, top), st.includes('c') ? -0.5 + n1 : -1, st.includes('d') ? 0.5 - n1 : 1, gap('Q', 'Y')],   // −y: s längs u
  ]) {
    if (!on) continue;
    for (const [a0, a1] of gw ? [[s0, -gw], [gw, s1]] : [[s0, s1]]) {
      g.save();
      try {
        clip(both ? half : [T, R, B, L]);
        if (a0 > -1 || a1 < 1) clip([at(a0, -1), at(a0, 2), at(a1, 2), at(a1, -1)]);
        const p = at(-0.6, 0), q = at(0.6, 0);
        g.beginPath(); g.moveTo(p[0], p[1] + 0.84); g.lineTo(q[0], q[1] + 0.84); g.stroke();
      } finally { g.restore(); }
    }
  }
  if (hillMiter(x, y, lv)) {                                             // Innenecke hinten: die Gehrung der Kanten von links und rechts
    const rl = miterRamp(x - 1, y, 1, lv), ru = miterRamp(x, y - 1, 2, lv);
    g.save();
    try {
      clip([T, R, B, L]);
      if (rl || ru) {                                                    // offene Seite eines Einschnitts A: kommt schräg heran (rampMiter)
        g.beginPath(); rampMiter(T, rl, ru).forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
        g.fillStyle = 'rgba(45,85,30,0.5)'; g.fill();
      } else {
        const a = P(-0.5, -0.6, top), b = P(-0.5, 0.6, top);
        clip([a, b, [b[0], b[1] + 1.68], [a[0], a[1] + 1.68]]);            // Streifen längs −x …
        const p = P(-0.6, -0.5, top), q = P(0.6, -0.5, top);
        g.beginPath(); g.moveTo(p[0], p[1] + 0.84); g.lineTo(q[0], q[1] + 0.84); g.stroke();   // … mit dem längs −y
      }
    } finally { g.restore(); }
  }
  hillShadePaint(x, y, top, [T, R, B, L]);                               // Schlagschatten der Dinge oben (Block 157j, render.js)
  const [ev, eu] = hillExt(x, y, lv, st, wu, wv);
  if (wv > 0) paintHillWall(P, -0.5, 0.5, 0.5, 0.5, 'v', kind, top - wv * HILL_H, top, x * 7 + y * 13, top, !st.includes('v'), 1, 0, ev);
  if (wu > 0) paintHillWall(P, 0.5, -0.5, 0.5, 0.5, 'u', kind, top - wu * HILL_H, top, x * 11 + y * 5 + 3, top, !st.includes('u'), 1, 0, eu);
  if (bpOn()) { const bp = bpAt(x, y); if (bp) paintBergportal(P, x, y, bp, top, kind); }   // Bergportal (157m): Öffnung in dieselbe Wand
}
function drawHillTile(x, y, px, py, z) {
  const h = hillAt(x, y);
  if (!h) return;
  const gap = gapNear(x, y);                                             // Nachbar der Vorschau „Treppe/Rampe in die Anhöhe“: eigenes Bildchen
  const want = DPR * Math.pow(2, Math.ceil(Math.log2(Math.max(z, 0.2)) * 2 - 1e-9) / 2), key = (gap ? 'p' : '') + x + ',' + y;
  let e = hillSprites.get(key);
  // Schlüssel nur neu rechnen, wenn sich am Spielstand etwas getan hat (wie die Dächer); nach dem Zoomen im Zeitbudget neu malen
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + state.hills.size + (FOG ? 'n' : '') + (gap ? '|' + hillGap.k + ':' + hillGap.rot + (hillGap.schmal ? 'n' : '') + (hillGap.keys ? ':' + [...hillGap.keys].join(';') : '') : '');
  const base = e && e.ver === ver ? e.base : hillSig(x, y, h) + (FOG ? 'n' : ''), sig = base + '|' + want.toFixed(3);
  if (e && e.base === base) e.ver = ver;
  if (hillPaintFrame !== frameNo) { hillPaintFrame = frameNo; hillPaintMs = 0; }
  if (!e || (e.sig !== sig && !(e.base === base && hillPaintMs > HILL_BUDGET))) {
    hillPurge();                                                         // ↶ & Co.
    const t0 = performance.now(), B = HILL_BOX, c = document.createElement('canvas');
    c.width = Math.ceil(B.w * want); c.height = Math.ceil((B.h + ((h.h || 1) - 1) * HILL_H) * want);
    const cg = c.getContext('2d');
    if (!cg) return;
    const prev = g; g = cg;
    try { g.setTransform(want, 0, 0, want, -B.left * want, (-B.top + ((h.h || 1) - 1) * HILL_H) * want); paintHill(x, y, h); } finally { g = prev; }
    if (e) freeCanvas(e.c);
    e = { c, sig, base, ver, up: ((h.h || 1) - 1) * HILL_H };
    hillSprites.set(key, e);
    hillPaintMs += performance.now() - t0;
  }
  const B = HILL_BOX;
  g.drawImage(e.c, px + B.left * z, py + (B.top - e.up) * z, B.w * z, (B.h + e.up) * z);
}
// Bildchen von Feldern, die keine Anhöhe (bzw. Treppe 's' + Feld, Rampe 'r' + Feld) mehr sind, freigeben – erst, wenn es deutlich mehr
// sind als nötig
function hillPurge() {
  if (hillSprites.size <= state.hills.size + stairFresh().n + rampFresh().f + 64) return;
  for (const k of hillSprites.keys()) if (!state.hills.has(k) && !(k[0] === 's' && k !== 'sg' && stairAt(...keyXY(k.slice(1))))
    && !(k[0] === 'r' && k[1] !== 'g' && rampAt(...keyXY(k.slice(1))))) { freeCanvas(hillSprites.get(k).c); hillSprites.delete(k); }
}
// Schatten am Boden (im Boden-Bild, wie Dächer): die Grundfläche, mit der Sonne verschoben
function drawHillShadows(want) {
  if (!state.hills || !state.hills.size) return;
  g.beginPath();
  for (const [k, h] of state.hills) {
    const [x, y] = keyXY(k);
    if (!want([x, y])) continue;
    const H = (h.h || 1) * HILL_H, dx = SUN.dx * H, dy = SUN.dy * H;
    const c = [[x - 0.5, y - 0.5], [x + 0.5, y - 0.5], [x + 0.5, y + 0.5], [x - 0.5, y + 0.5]].map(([u, v]) => { const p = iso(u, v); return [p.x + dx, p.y + dy]; });
    c.forEach((p, n) => n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
  }
  if (stairFresh().n) for (const [k, t] of state.tiles) {                // Treppe (Block 157d): ein Keil – hinten so hoch wie die Anhöhe
    if (!isStair(t)) continue;
    const [x, y] = keyXY(k);
    if (!want([x, y])) continue;
    const [Du, Dv] = STAIR_UP[stairRotOf(t)], H = HILL_H, P = (u, v, up) => { const p = iso(x + u, y + v); return [p.x + SUN.dx * up, p.y + SUN.dy * up]; };
    const pts = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].flatMap(([u, v]) => u * Du + v * Dv > 0 ? [P(u, v, 0), P(u, v, H)] : [P(u, v, 0)]);
    const shape = pts => {
      let c = hull(pts), area = 0;
      for (let i = 0; i < c.length; i++) { const a = c[i], b = c[(i + 1) % c.length]; area += a[0] * b[1] - b[0] * a[1]; }
      if (area < 0) c = c.reverse();                                     // gleicher Drehsinn wie die Anhöhen: Überlappung bleibt Schatten
      c.forEach((p, n) => n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    };
    shape(pts);
  }
  if (rampFresh().n) for (const [k, t] of state.tiles) {                 // Gleis-Rampe: je Feld der Körper (vorn h0, hinten h1) samt Grundfläche –
    if (!isRamp(t)) continue;                                            // Damm schmal, Viadukt schmaler, schmaler Einschnitt mit seinen Streifen ganz hoch
    const [ax, ay] = keyXY(k), rot = (t.rot || 0) & 3, len = rampLen(t), [Du, Dv] = STAIR_UP[rot], F = RAMP_FORMS[rampFormOf(t)], Su = -Dv, Sv = Du;
    rampFields(ax, ay, rot, len).forEach(([x, y], i) => {
      if (!want([x, y])) return;
      const cut = i >= len - F.cut, strip = cut && F.narrow, w = F.viadukt ? GR_VW : F.narrow && !cut ? GR_DW : 0.5;
      const h0 = strip ? HILL_H : HILL_H * i / len, h1 = strip ? HILL_H : HILL_H * (i + 1) / len, P = (u, v, up) => { const p = iso(x + u, y + v); return [p.x + SUN.dx * up, p.y + SUN.dy * up]; };
      const pts = [[-0.5, -w], [0.5, -w], [0.5, w], [-0.5, w]].flatMap(([d, s]) => { const u = Du * d + Su * s, v = Dv * d + Sv * s, h = d > 0 ? h1 : h0; return h > 0 ? [P(u, v, 0), P(u, v, h)] : [P(u, v, 0)]; });
      let c = hull(pts), area = 0;
      for (let n = 0; n < c.length; n++) { const a = c[n], b = c[(n + 1) % c.length]; area += a[0] * b[1] - b[0] * a[1]; }
      if (area < 0) c = c.reverse();
      c.forEach((p, n) => n ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
    });
  }
  g.fillStyle = 'rgba(30,42,62,0.22)'; g.fill('nonzero');
}

// --- Antippen in der Höhe ---
// Feld unter dem Zeiger samt Höhe: der Strahl von vorn oben nach hinten unten; das erste Feld, in dessen Block er steckt, gilt.
// Liefert [a, b] (Feldkoordinaten auf der getroffenen Höhe) – wie tileFrac, nur mit Anhöhen
// Anhöhe unter dem Zeiger (Oberseite oder Wand): verdeckt sie, was dahinter steht (Stützen, Deko auf Dächern)?
function hillHit(sx, sy) {
  if (!state.hills || !state.hills.size || !cam) return null;
  for (let t = HILL_H; t > 0; t -= 2) { const [a, b] = tileFrac(sx, sy + t * cam.z), x = Math.round(a), y = Math.round(b); if (hillLift(x, y) >= t) return { x, y }; }
  return null;
}
const hillInFront = (sx, sy, x, y) => { const h = hillHit(sx, sy); return !!h && h.x + h.y > x + y; };
function pickFrac(sx, sy) {
  if (!state.hills || !state.hills.size || !cam) return tileFrac(sx, sy);
  const maxLv = 1, top = maxLv * HILL_H, stairs = stairFresh().n > 0, ramps = rampFresh().n > 0;
  for (let t = top; t > 0; t -= 2) {
    const [a, b] = tileFrac(sx, sy + t * cam.z), x = Math.round(a), y = Math.round(b), lift = hillLift(x, y);
    if (lift >= t) return [a, b];                                          // oben oder an seiner Wand getroffen
    if (stairs && stairHeight(x, y, a, b) >= t) return [a, b];             // Treppe (Block 157d): die Stufe unter dem Zeiger – nicht die Anhöhe dahinter
    if (ramps && rampHitHeight(x, y, a, b) >= t) return [a, b];            // Gleis-Rampe: die Stelle unter dem Zeiger (Schräge, Streifen, Brüstung)
  }
  return tileFrac(sx, sy);
}

// ---------------------------------------------------------------------------
// Treppe in die Anhöhe (Block 157d, Nutzer: „eingelassen – links und rechts Anhöhe, in der Mitte die Treppe“, Entwurf
// tools/treppe-entwurf.js): Ding 'huegeltreppe' auf einem Feld der Ebene 0, dahinter (STAIR_UP[rot]) eine Anhöhe genau eine Ebene höher.
// Die Stufen steigen auf dem Feld selbst von der Vorderkante (Boden) bis zur Hinterkante (Oberkante der Anhöhe). Liegt seitlich Anhöhe,
// ist ihre Wand die Wange; fehlt sie, bekommt die Treppe dort einen Keil in der Wandart der Anhöhe dahinter. Gleich gerichtete Treppen
// nebeneinander sind eine breite Treppe (keine Wangen dazwischen, Stufen laufen durch). Trittflächen im Wegstil (t.style, Muster im
// Weltraster wie die Wege), Stirnseiten etwas dunkler. Gezeichnet als Bildchen je Feld (hillSprites, Schlüssel 's' + Feld)
// ---------------------------------------------------------------------------
const STAIR_UP = [[0, -1], [1, 0], [0, 1], [-1, 0]];                     // vom Treppenfeld zur Anhöhe, je t.rot & 3
const STAIR_N = 8, STAIR_CW = 0.1;                                       // Stufen je Feld; Keil: Breite (Feld)
const isStair = t => !!t && t.b === 'huegeltreppe';
const stairAt = (x, y) => { const t = state.tiles.get(x + ',' + y); return isStair(t) ? t : null; };
const stairRotOf = t => (t.rot || 0) & 3;
// Schmale Treppe (Nutzer, 10.10.2026: „die Treppe soll auch so dünn wie die Wege sein können“): t.schmal (fehlt = breit wie bisher). Stufen so
// breit wie ein Weg samt Rand (EDGE_W, draw-objects.js) – ein Weg davor und oben schließt ohne Grasstreifen an. Daneben im Feld: ein Streifen
// Anhöhe, wo seitlich Anhöhe ist (eingelassen), sonst ein Keil bis an die Feldgrenze. Schmale stehen für sich (nie breit zusammen), Ecktreppen
// sind immer breit. Neu gebaut: die Wahl in der Leiste (stairNewWide), sonst wie die Wegform (wegShape.wide → breit)
const STAIR_NW = EDGE_W;                                                 // halbe Breite der Stufen
const stairSchmal = t => !!t && t.schmal === true && !t.ecke;
let stairNewWide = null;                                                 // Leiste: null = wie die Wegform, sonst true (breit) / false (schmal)
const stairWideNew = () => stairNewWide != null ? !!stairNewWide : !!wegShape.wide;
// schmale Treppe auf (x, y), auch der Geist der Vorschau in die Anhöhe (hillGap)
const stairSchmalAt = (x, y) => { const t = stairAt(x, y); return t ? stairSchmal(t) : gapStair(x, y) && !!hillGap.schmal; };
// Seite sg (−1 / +1 quer zur Steigung, S = (−Dv, Du)) der Treppe t auf (x, y): 'h' Anhöhe daneben (breit: ihre Wand ist die Wange; schmal: im
// Feld bleibt ein Streifen Anhöhe stehen), 'j' breite Treppe läuft weiter (beide breit, gleiche Richtung, oder eine Ecktreppe hängt hier),
// 'k' Keil. Treppe gleicher Richtung daneben, eine davon schmal (zwei Durchgänge): in die Anhöhe eingelassen (stairRowCut) bleibt dazwischen
// die Anhöhe stehen – schmal ein Streifen 'r', breit 'h' (der Streifen der schmalen ist ihre Wange); vor der Wand je ein Keil bis an die
// Feldgrenze ohne Außenwand 'w'. L: Ebenen
function stairSide(x, y, t, sg, L = hillLevel) {
  const rot = stairRotOf(t), [Du, Dv] = STAIR_UP[rot], nx = x - sg * Dv, ny = y + sg * Du, n = stairAt(nx, ny);
  if (L(nx, ny) > L(x, y)) return 'h';
  if (n && n.ecke) {                                                     // Ecktreppe daneben: läuft um die Ecke weiter (nur an breiten)
    const [D1, D2] = cornerAxes(stairRotOf(n));
    return !stairSchmal(t) && ((nx + D1[0] === x && ny + D1[1] === y) || (nx + D2[0] === x && ny + D2[1] === y)) ? 'j' : 'k';
  }
  if (!n || stairRotOf(n) !== rot) return 'k';
  if (!stairSchmal(t) && !stairSchmal(n)) return 'j';
  return !stairRowCut(x, y, rot, L) ? 'w' : stairSchmal(t) ? 'r' : 'h';
}
// Reihe gleich gerichteter Treppen durch (x, y) (quer zur Steigung, ohne Ecktreppen): grenzt eines ihrer Enden an Anhöhe (in die Anhöhe
// eingelassen)?
function stairRowCut(x, y, rot, L = hillLevel) {
  const [Du, Dv] = STAIR_UP[rot], lv = L(x, y);
  for (const sg of [1, -1]) for (let i = 1; i < 60; i++) {
    const nx = x - sg * i * Dv, ny = y + sg * i * Du, n = stairAt(nx, ny);
    if (n && !n.ecke && stairRotOf(n) === rot) continue;
    if (L(nx, ny) > lv) return true;
    break;
  }
  return false;
}
const stairStrip = c => c === 'h' || c === 'r';                          // schmal: Seite mit Grasböschung (Anhöhe bzw. schmale Treppe daneben; bis 11.10.2026 ein Streifen Anhöhe)
// alle Treppen (gemerkt je Boden-Fassung wie rfFresh): list = die, hinter denen Anhöhe liegt; n = alle Treppenfelder
let stairCache = { ver: '', list: [], n: 0 };
function stairFresh() {
  if (!state.hills || !state.hills.size) return stairCache.n ? (stairCache = { ver: '', list: [], n: 0 }) : stairCache;   // ohne Anhöhen keine Treppen
  const v = groundVersion + ':' + state.tiles.size + ':' + state.hills.size;
  if (stairCache.ver === v) return stairCache;
  const list = [];
  let n = 0, ecken = 0;
  for (const [k, t] of state.tiles) {
    if (!isStair(t)) continue;
    n++;
    if (t.ecke) { ecken++; continue; }                                    // Ecktreppe: kein Aufgang für Spaziergänger (führt schräg)
    const [x, y] = keyXY(k), rot = stairRotOf(t), [dx, dy] = STAIR_UP[rot];
    if (hillLevel(x + dx, y + dy) === hillLevel(x, y) + 1) list.push({ k, x, y, dx, dy, rot });
  }
  stairCache = { ver: v, list, n, ecken };
  return stairCache;
}
// [{ k, x, y, dx, dy, rot }] – (dx, dy) zeigt hinauf zur Anhöhe (Spaziergänger, js/hill-walkers.js)
const hillStairs = () => stairFresh().list;
// Höhe (Bildpunkte bei Zoom 1, 0 … HILL_H) auf der Treppe (x, y) am Punkt (u, v) in Feldkoordinaten der Welt (wie px/py der Figuren):
// die Stufe, auf der man dort steht; 0 außerhalb des Felds oder ohne Treppe
function stairHeight(x, y, u, v) {
  const t = stairAt(x, y), a = u - x, b = v - y;
  if (!t || Math.abs(a) > 0.5 || Math.abs(b) > 0.5) return 0;
  if (stairSchmal(t)) {                                                  // schmal: neben den Stufen die Grasböschung (gerade vom Fuß bis oben)
    const [Du, Dv] = STAIR_UP[stairRotOf(t)], s = b * Du - a * Dv;
    if (Math.abs(s) > STAIR_NW && stairStrip(stairSide(x, y, t, Math.sign(s)))) return HILL_H * Math.max(0, Math.min(1, a * Du + b * Dv + 0.5 + 1 / STAIR_N));   // wie der Keil: vorn eine Stufe hoch
  }
  const idx =([Du, Dv]) => Math.min(STAIR_N - 1, Math.max(0, Math.floor((a * Du + b * Dv + 0.5) * STAIR_N)));
  const i = t.ecke ? Math.min(...cornerAxes(stairRotOf(t)).map(idx)) : idx(STAIR_UP[stairRotOf(t)]);   // Ecke: L-förmig
  return HILL_H * (i + 1) / STAIR_N;
}
// Treppen um Feld (x, y): foot = die, deren Fuß (Feld davor) (x, y) ist; sonst die, die auf (x, y) hinaufführen. [[x, y], …]
function stairsAround(x, y, foot = false) {
  const out = [];
  for (const [ex, ey] of DIRS) {
    const t = stairAt(x + ex, y + ey);
    if (!t || t.ecke) continue;
    const [dx, dy] = STAIR_UP[stairRotOf(t)];
    if (foot ? dx === ex && dy === ey : dx === -ex && dy === -ey) out.push([x + ex, y + ey]);
  }
  // Ecktreppen ringsum: führen schräg hinauf auf die Ecke (n + D1 + D2), ihre Füße sind die beiden äußeren Seiten (n − D1, n − D2)
  if (stairFresh().ecken) for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) {
    const nx = x + ex, ny = y + ey, t = (ex || ey) && stairAt(nx, ny);
    if (!t || !t.ecke) continue;
    const [D1, D2] = cornerAxes(stairRotOf(t));
    if (foot ? (nx - D1[0] === x && ny - D1[1] === y) || (nx - D2[0] === x && ny - D2[1] === y) : nx + D1[0] + D2[0] === x && ny + D1[1] + D2[1] === y) out.push([nx, ny]);
  }
  return out;
}
// Ecktreppe (Nutzer, 10.10.2026: „Treppen sollten auch um die Ecke gehen dürfen – ein erhöhter Platz, der aus allen Richtungen begangen
// werden kann“): das Feld schräg vor der Ecke einer Anhöhe, an den beiden Seiten zur Ecke hin je eine Treppe, die um diese Ecke hinaufführt.
// Drehung r: Seiten D1 = STAIR_UP[r], D2 = STAIR_UP[r + 1]; die Ecke der Anhöhe liegt bei D1 + D2. Stufen L-förmig (wie eine Stufenpyramide):
// Stufe = kleinere der beiden Stufen längs D1 und D2 – an der Grenze zur Nachbartreppe genau deren Stufen, ohne Fuge
// wird eine neue Treppe auf (x, y) eine Ecktreppe? (keine gerade Richtung, aber eine Ecke; build, Vorschau)
const stairCornerNew = (x, y) => !stairDirs(x, y, stairBase(x, y)).length && cornerDirs(x, y).length > 0;
const cornerAxes = r => [STAIR_UP[r & 3], STAIR_UP[(r + 1) & 3]];
// Ecktreppen gibt es nur breit: beide Treppen, an denen sie hängt, sind breit (any: auch schmale – für den Hinweis in stairError)
function cornerDirs(x, y, lv = stairBase(x, y), any = false) {
  const out = [];
  for (let r = 0; r < 4; r++) {
    const [[ax, ay], [bx, by]] = cornerAxes(r), s1 = stairAt(x + ax, y + ay), s2 = stairAt(x + bx, y + by);
    if (!any && (stairSchmal(s1) || stairSchmal(s2))) continue;
    if (hillLevel(x + ax + bx, y + ay + by) === lv + 1 && s1 && !s1.ecke && stairRotOf(s1) === ((r + 1) & 3) && s2 && !s2.ecke && stairRotOf(s2) === r
      && hillLevel(x + ax, y + ay) === lv && hillLevel(x + bx, y + by) === lv) out.push(r);
  }
  return out;
}
// Treppen ausrichten (Nutzer, 10.10.2026: „was ist, wenn da schon so etwas steht – erst die Teile entfernen und neu bauen ist umständlich“):
// Wie soll die Treppe auf (x, y) liegen? Ecke, wenn es eine Ecke ist; sonst gerade – die eigene Richtung, solange sie passt, sonst die beste
// (stairRot). null = passt nirgends hin
function stairFit(x, y) {
  const t = stairAt(x, y);
  if (!t) return null;
  const lv = hillLevel(x, y), cd = stairSchmal(t) ? [] : cornerDirs(x, y, lv);   // eine schmale wird nie zur Ecke
  if (cd.length) return { ecke: true, rot: t.ecke && cd.includes(stairRotOf(t)) ? stairRotOf(t) : cd[0] };
  const ok = stairDirs(x, y, lv);
  if (!ok.length) return null;
  return { ecke: false, rot: !t.ecke && ok.includes(stairRotOf(t)) ? stairRotOf(t) : stairRot(x, y) };
}
// Treppen um (x, y) (5 × 5) neu ausrichten, bis nichts mehr wechselt (Ecken hängen an geraden Nachbarn). dry: nur zählen, danach wie vorher.
// Liefert die Zahl der umgestellten Treppen
function refitStairs(x, y, dry = false) {
  const before = new Map();
  let n = 0;
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const t = stairAt(x + dx, y + dy), f = t && stairFit(x + dx, y + dy);
      if (!f || (f.ecke === !!t.ecke && f.rot === stairRotOf(t))) continue;
      const k = (x + dx) + ',' + (y + dy);
      if (!before.has(k)) { before.set(k, { rot: t.rot, ecke: t.ecke }); n++; }
      t.rot = f.rot; if (f.ecke) t.ecke = true; else delete t.ecke;
      changed = true;
    }
    if (!changed) break;
  }
  if (dry) for (const [k, o] of before) { const t = state.tiles.get(k); t.rot = o.rot; if (o.ecke) t.ecke = true; else delete t.ecke; }
  else if (n) groundVersion++;
  return n;
}
// Treppe auf eine Treppe gesetzt: nur ausrichten (kostenlos) – geht, wenn sich dabei etwas ändert
const stairRefitError = (x, y) => refitStairs(x, y, true) ? null : 'Hier steht schon eine Treppe, die passt';
// Getragen abgelegt (✋, Gruppe, ⧉ Kopie: dropAt/dropGroup) wie gebaut: in der Ecke zwischen zwei breiten Treppen eine Ecktreppe (immer breit),
// sonst gerade; dann die Treppen ringsum ausrichten. Sonst stand eine Ecktreppe vor gerader Wand bzw. eine gerade (auch schmale) in der Ecke –
// beide führten ins Leere
function stairDropped(x, y) {
  const t = stairAt(x, y);
  if (!t) return;
  if (stairCornerNew(x, y)) { t.ecke = true; delete t.schmal; } else delete t.ecke;
  refitStairs(x, y);
}
const STAIR_ECKE_BREIT = 'Um die Ecke geht nur die breite Treppe';
// Feld (x, y) wird zur Treppe eingesetzt, obwohl schon Treppen hinaufführen: geht, wenn die sich danach neu ausrichten lassen (z. B. als Ecke).
// Probehalber: Anhöhe weg, Treppe hin, ausrichten, prüfen – danach alles wie vorher. why: statt false 'schmal', wenn eine der Treppen eine
// Ecktreppe würde, wäre sie samt Nachbarn breit (Hinweis in stairIntoError)
function stairIntoRefits(x, y, why = false) {
  const k = x + ',' + y, h = state.hills.get(k), old = state.tiles.get(k);
  if (old) return false;
  const tmp = { b: 'huegeltreppe', lvl: 1, rot: 0, ...(stairWideNew() ? {} : { schmal: true }) };   // so breit, wie sie gebaut würde
  state.hills.delete(k); state.tiles.set(k, tmp);
  const saved = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const t = stairAt(x + dx, y + dy); if (t && t !== tmp) saved.push([t, t.rot, t.ecke, x + dx, y + dy]); }
  try {
    tmp.rot = stairRot(x, y);
    refitStairs(x, y);
    const all = [[x, y], ...saved.map(([, , , tx, ty]) => [tx, ty])];
    if (all.every(([tx, ty]) => !!stairFit(tx, ty))) return true;
    return why && all.some(([tx, ty]) => !stairFit(tx, ty) && cornerDirs(tx, ty, hillLevel(tx, ty), true).length) ? 'schmal' : false;
  } finally {
    for (const [t, r, e] of saved) { t.rot = r; if (e) t.ecke = true; else delete t.ecke; }
    state.tiles.delete(k); state.hills.set(k, h);
  }
}
// Ecktreppe neben (x, y), die an dieser Treppe hängt (Abreißen, Aufnehmen sperren)
function cornerOn(x, y) {
  if (!stairFresh().ecken) return null;
  for (const [ex, ey] of DIRS) {
    const t = stairAt(x + ex, y + ey);
    if (!t || !t.ecke) continue;
    const [D1, D2] = cornerAxes(stairRotOf(t));
    if ((x + ex + D1[0] === x && y + ey + D1[1] === y) || (x + ex + D2[0] === x && y + ey + D2[1] === y)) return [x + ex, y + ey];
  }
  return null;
}
// Richtungen, in die eine Treppe auf (x, y) zeigen kann: dahinter eine Anhöhe genau eine Ebene höher, davor kein Wasser und nichts Höheres.
// lv: Ebene, auf der die Treppe steht (stairBase: in eine Anhöhe eingelassen eine tiefer)
function stairDirs(x, y, lv = hillLevel(x, y)) {
  const out = [];
  for (let r = 0; r < 4; r++) {
    const [dx, dy] = STAIR_UP[r];
    if (hillLevel(x + dx, y + dy) === lv + 1 && hillLevel(x - dx, y - dy) <= lv && terrainAt(x - dx, y - dy) !== 'water') out.push(r);
  }
  return out;
}
// Drehung beim Setzen (placeRot, auch Vorschau und Verschieben): zur Anhöhe hin; passen mehrere, die mit einem Weg am Fuß, darunter
// die gewählte (buildRot), sonst die erste. Passt keine: buildRot (die Vorschau zeigt dann rot)
function stairRot(x, y) {
  const ok = stairDirs(x, y, stairBase(x, y));
  if (!ok.length) { const cd = cornerDirs(x, y); return cd.length ? cd[0] : buildRot & 3; }   // Ecktreppe
  // selbst gedreht (⟳, R, Mausrad: rotManual): die gewählte bzw. die nächste passende – wie bei der Gleis-Rampe (Nutzer 11.10.2026: „warum
  // erlaubt er mir nicht, die Treppe nach rechts zu drehen?“ – vorher gewann die Wertung unten, z. B. eine Treppe daneben, und R tat nichts)
  if (rotManual) for (let k = 0; k < 4; k++) { const r = (buildRot + k * rotStep + 8) & 3; if (ok.includes(r)) return r; }
  // Punkte: Weg am Fuß, ein echter Fuß (keine Treppe – sonst dreht sich eine am Rand eingesetzte längs zur Nachbartreppe), eine Treppe gleicher
  // Richtung daneben (wird breit); bei Gleichstand die gewählte Drehung, sonst die erste
  const score = r => {
    const [dx, dy] = STAIR_UP[r], fx = x - dx, fy = y - dy;
    const side = [[x - dy, y + dx], [x + dy, y - dx]].some(([nx, ny]) => { const n = stairAt(nx, ny); return n && !n.ecke && stairRotOf(n) === r; });
    return (wegAt(fx, fy) != null ? 4 : 0) + (stairAt(fx, fy) ? 0 : 2) + (side ? 1 : 0);
  };
  const best = Math.max(...ok.map(score)), c = ok.filter(r => score(r) === best);
  return c.includes(buildRot & 3) ? buildRot & 3 : c[0];
}
// Stehende Treppe im Fenster drehen (⟳, Nutzer 11.10.2026): reihum die Richtungen, in die sie hier hinaufführt (stairDirs auf ihrer Ebene, ohne
// Linie quer davor) – nie gegen eine Wand oder ins Leere; Ecktreppen nicht. Danach die Treppen ringsum ausrichten (breit, Ecken)
function stairTurns(x, y) {
  const t = stairAt(x, y);
  if (!t || t.ecke) return [];
  return stairDirs(x, y, hillLevel(x, y)).filter(r => { const [dx, dy] = STAIR_UP[r]; return ![[x - dx, y - dy], [x + dx, y + dy]].some(([nx, ny]) => state.edges.get(edgeBetween(x, y, nx, ny))); });
}
function turnStair(x, y) {
  const t = stairAt(x, y), opts = stairTurns(x, y);
  if (!t || opts.length < 2) return false;
  const i = opts.indexOf(stairRotOf(t));
  t.rot = opts[(i + 1) % opts.length];
  refitStairs(x, y); groundVersion++; sfx('deco'); recalc(); save();
  return true;
}
// Darf hier eine Treppe stehen (placeError, vor den allgemeinen Prüfungen: Belegung, kleine Deko, Gelände)? move: getragen (✋, Kopie)
function stairError(x, y, rot, move) {
  if (!ownedTile(x, y)) return notMine(x, y);
  const into = !!hillAt(x, y);
  if (into) { const e = stairIntoError(x, y, move); if (e) return e; }
  if (terrainAt(x, y) === 'water') return 'Nicht auf dem Wasser';
  if (wegAt(x, y) != null) return 'Nicht auf einen Weg – stell die Treppe ans Ende des Wegs';
  if (archAround(x, y)) return ARCH_HERE;
  if (bpFronts(x, y).length) return 'Vor dem Bergportal muss Platz bleiben – dort kommt die Schiene hinein';   // Block 157m
  if (state.roofs && state.roofs.size && roofAt(x, y)) return 'Unter einer Überdachung geht keine Treppe';
  const ok = stairDirs(x, y, stairBase(x, y)), cd = ok.length ? [] : cornerDirs(x, y);
  if (cd.length) {                                                       // Ecktreppe zwischen zwei Treppen um die Ecke
    if (!cd.includes(rot & 3)) return 'Die Ecktreppe muss in die Ecke der Anhöhe zeigen';
    for (const [ex, ey] of DIRS) { const e = state.edges.get(edgeBetween(x, y, x + ex, y + ey)); if (e) return `An der Ecktreppe steht: ${ITEMS[e.b].name} – erst entfernen`; }
    return null;
  }
  if (!ok.length && cornerDirs(x, y, stairBase(x, y), true).length) return STAIR_ECKE_BREIT;   // an schmalen Treppen keine Ecke
  if (!ok.length && into) {                                              // Randfeld, aber kein Fuß: davor Wasser, oder dahinter keine Anhöhe
    const lv = hillLevel(x, y), wet = DIRS.some(([dx, dy]) => hillLevel(x + dx, y + dy) === lv && hillLevel(x - dx, y - dy) < lv);
    return wet ? 'Vor der Treppe braucht es Platz – kein Wasser' : 'Hinter der Treppe muss Anhöhe bleiben – hier ist sie zu schmal';
  }
  if (!ok.length) return DIRS.some(([dx, dy]) => hillLevel(x + dx, y + dy) > hillLevel(x, y)) ? 'Vor der Treppe braucht es Platz – keine Anhöhe und kein Wasser' : 'Direkt vor die Wand einer Anhöhe stellen – die Treppe führt hinauf';
  if (!ok.includes(rot & 3)) return 'Die Treppe muss zur Anhöhe hinauf zeigen';
  const [dx, dy] = STAIR_UP[rot & 3];
  for (const [nx, ny] of [[x - dx, y - dy], [x + dx, y + dy]]) { const e = state.edges.get(edgeBetween(x, y, nx, ny)); if (e) return `Quer vor der Treppe steht: ${ITEMS[e.b].name} – erst entfernen`; }
  for (const [nx, ny] of [[x - dy, y + dx], [x + dy, y - dx]]) {         // daneben eine Treppe gleicher Richtung: wird breit, also keine Linie dazwischen
    const n = stairAt(nx, ny), e = n && stairRotOf(n) === (rot & 3) && state.edges.get(edgeBetween(x, y, nx, ny));
    if (e) return `Zwischen den Treppen steht: ${ITEMS[e.b].name} – erst entfernen`;
  }
  return null;
}
// Treppe in eine bestehende Anhöhe (Nutzer, 10.10.2026: „nicht erst ranbauen und dann links rechts eine Anhöhe drumrum, sondern auch
// überschreiben“): auf ein Randfeld der Anhöhe getippt, wird das Feld abgesenkt (hillTake: Erstattung wie lowerHill, mit dem Treppenpreis
// verrechnet) und die Treppe steht dort – Fuß-Bedingungen wie unten (stairDirs eine Ebene tiefer), Drehung über stairRot. Ein Schritt
// für ↶ (Feld und Anhöhe zusammen). Getragen (✋ Verschieben, Gruppen, ⧉ Kopien) nicht: Ablegen senkt nie Gelände ab und erstattet nichts
// – Abreißen gibt alles zurück, dort neu bauen kostet also nicht mehr
const stairBase = (x, y) => hillAt(x, y) ? hillLevel(x, y) - 1 : hillLevel(x, y);   // Ebene, auf der eine Treppe hier stünde
const stairIntoBack = (x, y) => hillAt(x, y) ? ITEMS.anhoehe.cost : 0;   // Erstattung fürs Absenken (Preisprüfung, Schild, build)
function stairIntoError(x, y, move) {
  if (move) return 'Nur vor die Wand – in die Anhöhe die Treppe neu bauen';
  const lv = hillLevel(x, y);
  if (lv !== 1) return 'Die Treppe führt nur auf die erste Ebene';
  if (DIRS.every(([dx, dy]) => hillLevel(x + dx, y + dy) >= lv)) return 'Die Treppe gehört an den Rand der Anhöhe';
  if (stairsAround(x, y).length) {                                       // sie führte sonst ins Leere – außer sie richtet sich neu aus (z. B. als Ecke)
    const fit = stairIntoRefits(x, y, true);
    if (fit !== true) return fit === 'schmal' ? STAIR_ECKE_BREIT : 'Hierher führt schon eine Treppe hinauf';
  }
  if (rampsAround(x, y).length) return 'Hierher führt schon eine Gleis-Rampe hinauf';   // abgesenkt führte sie gegen die Treppe (wie rampIntoError)
  if (archAround(x, y)) return ARCH_HERE;
  if (bkOnHill(x, y)) return BK_ON_HILL;                                 // Brücke liegt auf (Block 160)
  const t = objAt(x, y), d = (decosAt(x + ',' + y) || []).find(Boolean);
  if (t || d) return `Hier steht: ${ITEMS[(t || d).b].name} – erst wegnehmen`;
  for (const k of ['a' + x + ',' + y, 'a' + x + ',' + (y + 1), 'b' + x + ',' + y, 'b' + (x + 1) + ',' + y])   // wie lowerHill: stünden sonst an der Kante
    if (state.edges.has(k)) return `Am Rand steht: ${ITEMS[state.edges.get(k).b].name} – erst entfernen`;
  for (const [vx, vy] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (postAt(vx, vy)) return `An der Ecke steht: ${ITEMS[postAt(vx, vy).b].name} – erst wegnehmen`;
  return null;
}
// Linie k an einer Treppe (edgeError): nicht quer vor den Fuß oder ans obere Ende, nicht mitten durch eine breite Treppe (die Linie
// stünde unten zwischen den Stufen); an die Seite schon. Gleis-Rampe genauso (sonst stünde sie quer über dem Gleis), dazu nicht zwischen ihre
// Felder und nicht zwischen zwei Einschnitte A nebeneinander (ein Einschnitt, zwei Gleise)
function stairEdgeError(k) {
  const [[ax, ay], [bx, by]] = edgeTiles(k), a = stairAt(ax, ay), b = stairAt(bx, by);
  if (bpOn()) for (const [px, py, ox, oy] of [[ax, ay, bx, by], [bx, by, ax, ay]]) {   // Bergportal (157m): nicht quer vor die Öffnung
    const t = bpAt(px, py);
    if (t && ox === px - bpDir(t)[0] && oy === py - bpDir(t)[1]) return 'Nicht vor das Bergportal – dort fährt der Zug hinein';
  }
  if ((a && a.ecke) || (b && b.ecke)) return 'Nicht an die Ecktreppe';
  if (a && b && stairRotOf(a) === stairRotOf(b)) return stairSchmal(a) || stairSchmal(b) ? 'Nicht zwischen die Treppen' : 'Nicht mitten durch die breite Treppe';
  for (const [t, x, y, ox, oy] of [[a, ax, ay, bx, by], [b, bx, by, ax, ay]]) {
    if (!t) continue;
    const [dx, dy] = STAIR_UP[stairRotOf(t)];
    if (Math.abs(ox - x) === Math.abs(dx) && Math.abs(oy - y) === Math.abs(dy)) return 'Nicht quer vor die Treppe – an ihre Seiten geht es';
  }
  if (!rampFresh().n) return null;
  const ra = rampAt(ax, ay), rb = rampAt(bx, by);
  if (ra && rb && ra.k === rb.k) return 'Nicht quer über die Gleis-Rampe';
  if (ra && rb && rampWide(ra, rb) && rampWideForm(ra.form)) return 'Nicht mitten durch den Einschnitt';
  for (const [r, x, y, ox, oy] of [[ra, ax, ay, bx, by], [rb, bx, by, ax, ay]]) {
    if (!r) continue;
    const [dx, dy] = STAIR_UP[r.rot];
    if (Math.abs(ox - x) === Math.abs(dx) && Math.abs(oy - y) === Math.abs(dy)) return 'Nicht quer vor die Gleis-Rampe – an ihre Seiten geht es';
  }
  return null;
}
// Wegstil der Stufen: jeder Belag außer Trittsteinen (keine Fläche). Neu gebaut: die Wahl in der Leiste, sonst der Stil des Wegs
const stairStyleOk = id => typeof id === 'string' && isWegStyle(id) && !pathLook(id).stones;
function stairStyleNew() {
  const c = chosenStyle.huegeltreppe;
  if (stairStyleOk(c) && styleOk(styleDef('weg', c))) return c;
  const w = currentStyle('weg');
  return stairStyleOk(w) ? w : roofBelDefault();
}
const stairStyleOf = t => (t && stairStyleOk(t.style) ? t.style : t && t.style == null ? stairStyleNew() : 'sand');
// breite Treppe: diese und alle gleich gerichteten Treppen daneben (quer zur Steigung) – Stil im Fenster für alle. Eine schmale steht für sich;
// any: alle gleich gerichteten nebeneinander, ob schmal oder breit (Breite im Fenster für die ganze Reihe)
function stairRow(x, y, any = false) {
  const t0 = stairAt(x, y);
  if (!t0) return [];
  if (!any && stairSchmal(t0)) return [[x, y]];
  const rot = stairRotOf(t0), [Du, Dv] = STAIR_UP[rot], out = [[x, y]];
  for (const sg of [1, -1]) for (let i = 1; i < 60; i++) {
    const nx = x - sg * i * Dv, ny = y + sg * i * Du, t = stairAt(nx, ny);
    if (!t || stairRotOf(t) !== rot || (!any && stairSchmal(t))) break;
    out.push([nx, ny]);
  }
  return out;
}

// --- Zeichnen ---
// Aussehen aus der Nachbarschaft: je Seite (m = −S, p = +S, S quer zur Steigung) 'h' Anhöhe (ihre Wand ist die Wange), 'j' Nachbartreppe
// gleicher Richtung (Stufen laufen durch), 'k' eigener Keil; kind = Wandart der Anhöhe dahinter, top = Oberseite des Keils (Boden des Felds)
// Schmal (nar): km/kp Wandart des Streifens Anhöhe (die der Anhöhe daneben), fm/fp: seine Wand am Fuß läuft in der des Nachbarn weiter (Anhöhe,
// Streifen der schmalen Treppe daneben), om/op: daneben eine breite Treppe – die Außenseite des Streifens ist ihre Wange
function stairLook(x, y, t) {
  const L = gapStair(x, y) ? drawLevel : hillLevel;                      // Geist der Vorschau in die Anhöhe: eine Ebene tiefer (echte Treppen nie)
  const rot = stairRotOf(t), [Du, Dv] = STAIR_UP[rot];
  if (t.ecke) { const [D1, D2] = cornerAxes(rot); return { rot, ecke: true, style: stairStyleOf(t), kind: hillWall(hillAt(x + D1[0] + D2[0], y + D1[1] + D2[1])), m: 'j', p: 'j', top: groundTopAt(x, y) }; }
  const o = { rot, style: stairStyleOf(t), kind: hillWall(hillAt(x + Du, y + Dv)), m: stairSide(x, y, t, -1, L), p: stairSide(x, y, t, 1, L), top: groundTopAt(x, y) };
  if (stairSchmal(t)) {
    o.nar = 1;
    for (const [sg, c] of [[-1, 'm'], [1, 'p']]) {                       // daneben eine breite (Reihe in der Anhöhe): Böschung mit Außenwand zu ihr
      const n = o[c] === 'r' && stairAt(x - sg * Dv, y + sg * Du);
      if (n && !stairSchmal(n)) o['o' + c] = 1;
    }
  }
  return o;
}
// Treppe malen. P(u, v, up) → Bildpunkt (Feldkoordinaten relativ zur Feldmitte, Höhe in Bildpunkten bei Zoom 1); x, y: Feld (Musterraster).
// Von hinten nach vorn: Keil bzw. Streifen Anhöhe auf der abgewandten Seite, die Stufen (Trittfläche im Wegstil, sichtbare Stirnseite dunkler),
// Keil bzw. Streifen vorn
function paintStair(P, o, x, y) {
  if (o.ecke) { paintStairCorner(P, o, x, y); return; }
  const H = HILL_H, n = STAIR_N, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du, S = HILL_STY[o.kind] || HILL_STY.fels;
  const UV = (d, s) => [Du * d + Su * s, Dv * d + Sv * s];               // d längs (hinauf), s quer → (u, v)
  const W = (d, s, h) => P(...UV(d, s), h);
  const toward = Du + Dv > 0, nearP = Su + Sv > 0;                       // steigt zum Betrachter an (Stirnseiten abgewandt); Seite +S liegt vorn
  const lk = lookFar(pathLook(o.style), 1), riser = shade(lk.fill, -0.2);
  // Stufen quer: schmal so breit wie ein Weg; breit bis an die Wange (h), den Keil (k, w) bzw. zur Nachbartreppe ohne Fuge (j)
  const nar = !!o.nar, cw = nar ? 0.5 - STAIR_NW : STAIR_CW, edge = c => nar ? STAIR_NW : c === 'k' || c === 'w' ? 0.5 - STAIR_CW : c === 'j' ? 0.51 : 0.5;
  const lo = -edge(o.m), hi = edge(o.p);
  const ll = Math.max(lo, -0.5), lh = Math.min(hi, 0.5);                // Kanten nur bis zur Feldgrenze: breit nie doppelt (sonst heller Fleck)
  const line = (a, b, col, w) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.stroke(); };
  const clipPts = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); };
  const DARK = 'rgba(45,85,30,0.5)', E = 0.0075;
  // Keil = schmale Anhöhe neben den Stufen (Nutzer: „bündig“): oben auf der Linie der Stufenkanten – vorn so hoch wie die erste Stufe, ab der
  // obersten waagerecht auf Höhe der Anhöhe (kn); Oberseite wie der Boden, sichtbare Seiten als Wand mit derselben Grasnarbe wie die Anhöhe.
  // Oberseite hinten 0,0075 über die Feldgrenze (bk, wie Anhöhe an Anhöhe in paintHill): sonst ein feiner dunkler Strich an der Fuge zur
  // Oberseite dahinter (deren Wand schimmert durch die geglätteten Kanten) bzw. eine helle Kerbe in der dunklen Kante. Schmal reicht er bis an
  // die Feldgrenze (cw). 'w' (Treppe daneben, eine schmal): ohne Außenwand und dunkle Kante außen – dort steht der Keil der Nachbartreppe gleich
  // hoch; nach +x/+y reicht er ein Stück unter dessen Bildchen
  const hf = H / n, kn = 1 - 1 / n, bk = 0.5 + E;
  const kh = hf, kk = kn;
  const keil = (sg, bank) => {                                           // bank: Böschung der schmalen – true ohne Außenwand, 'wand' mit (zur breiten Treppe), beide ohne dunkle Kante
    const w = bank === true || (sg < 0 ? o.m : o.p) === 'w', sOut = 0.5 * sg, sIn = sg * (0.5 - cw), outVis = sg * (Su + Sv) > 0, sT = w && outVis ? sg * (0.5 + E) : sOut;
    const sF = outVis ? sOut : sIn, nu = (outVis ? sg : -sg) * Su;       // sichtbare Seite: außen (vorderer Keil) bzw. innen (hinterer); zeigt nach +u?
    const topQ = [W(-0.5, sIn, kh), W(-0.5, sT, kh), W(kk - 0.5, sT, H), W(bk, sT, H), W(bk, sIn, H), W(kk - 0.5, sIn, H)];
    poly(topQ, C(o.top || S.lip));
    if (!outVis && !w && !bank) {                                        // hinterer Keil: außen oben die dunkle Kante zur Wiese wie bei der Anhöhe (paintHill), 1,5 breit innen
      g.save();
      try {
        clipPts(topQ);
        const e = [W(-0.6, sOut, kh - H * 0.1), W(kk - 0.5, sOut, H), W(0.6, sOut, H)];
        g.beginPath(); e.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        g.strokeStyle = DARK; g.lineWidth = 3; g.lineJoin = 'miter'; g.lineCap = 'butt'; g.stroke();
      } finally { g.restore(); }
    }
    if (!(w && outVis)) {
      const [a0, b0] = UV(-0.5, sF), [a1, b1] = UV(0.5, sF);
      paintHillWall(P, a0, b0, a1, b1, nu > 0 ? 'u' : 'v', o.kind, 0, kh, x * 5 + y * 9 + 3 * sg + o.rot, H, true, kk);
    }
    if (!toward && kh) {                                                 // Stirn am Fuß (zum Betrachter hin liegt die hintere in der Anhöhe)
      const [c0, e0] = UV(-0.5, sIn), [c1, e1] = UV(-0.5, sOut);
      paintHillWall(P, c0, e0, c1, e1, -Du > 0 ? 'u' : 'v', o.kind, 0, hf, x * 3 + y * 7 + sg + o.rot, hf, true, 1, 0, w && outVis ? E / cw : 0);   // e: Anteil der Wand
    }
  };
  // Grasböschung neben schmalen Stufen (Nutzer 11.10.2026: „der Aufgang immer gleich breit, nur der Weg darauf schmaler oder breiter – links und
  // rechts eine Graskante“; Höhe: „hoch“ – auf der Linie der Stufenvorderkanten wie der Keil, die Stufen sind versenkt, sonst stand neben einem
  // Keil eine flache Böschung): ein Keil ohne Außenwand und dunkle Kante (außen die Wand der Anhöhe bzw. die Böschung der Treppe daneben)
  const slope = sg => keil(sg, o[sg < 0 ? 'om' : 'op'] ? 'wand' : true);   // neben einer breiten Treppe (eine Stufe tiefer): mit Außenwand, ohne dunkle Kante
  const side = sg => { const c = sg < 0 ? o.m : o.p; if (c === 'k' || c === 'w') keil(sg); else if (nar && stairStrip(c)) slope(sg); };
  const step = i => {
    const d0 = -0.5 + i / n, d1 = d0 + 1 / n, h = H * (i + 1) / n, hb = H * i / n;
    if (!toward) poly([W(d0, lo, hb), W(d0, hi, hb), W(d0, hi, h), W(d0, lo, h)], C(riser));   // Stirnseite
    const q = [UV(d0, lo), UV(d1, lo), UV(d1, hi), UV(d0, hi)], L = ([u, v]) => P(u, v, h);
    poly(q.map(L), C(lk.fill));
    if (lk.pat) { g.save(); clipTo([q], L); patSeam = true; try { pattern(L, lk.pat[0], x, y, 1, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); } }
    if (!toward) line(W(d0, ll, h), W(d0, lh, h), 'rgba(255,255,255,0.35)', 0.7);   // Kante vorn im Licht
    else if (i > 0) line(W(d0, ll, h), W(d0, lh, h), 'rgba(40,30,20,0.28)', 0.9);   // steigt zum Betrachter an: Schattenkante, wo es hinabgeht
  };
  side(nearP ? -1 : 1);
  for (let j = 0; j < n; j++) step(toward ? j : n - 1 - j);
  side(nearP ? 1 : -1);
}
// Ecktreppe malen: n × n Zellen, Höhe je Zelle = Stufe min(i1, i2) (L-förmig um die Ecke); von hinten nach vorn (u + v), je Zelle die sichtbaren
// Seiten bis zur tieferen Nachbarzelle (außen bis zum Boden; zur Nachbartreppe gleich hoch – keine Seite), dann die Trittfläche im Wegstil.
// Kanten wie bei der geraden Treppe: oben an einer sichtbaren Stirnseite hell, wo es nach hinten hinabgeht dunkel
function paintStairCorner(P, o, x, y) {
  const H = HILL_H, n = STAIR_N, [D1, D2] = cornerAxes(o.rot);
  const UV = (s1, s2) => [D1[0] * (s1 - 0.5) + D2[0] * (s2 - 0.5), D1[1] * (s1 - 0.5) + D2[1] * (s2 - 0.5)];   // s1, s2: 0 außen … 1 zur Ecke
  const lk = lookFar(pathLook(o.style), 1), riser = shade(lk.fill, -0.2);
  const ht = (i, j) => i < 0 || j < 0 ? 0 : i >= n || j >= n ? H : H * (Math.min(i, j) + 1) / n;   // außen Boden, innen (Nachbartreppe/Anhöhe) oben
  const cells = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const [u, v] = UV((i + 0.5) / n, (j + 0.5) / n); cells.push([i, j, u + v]); }
  cells.sort((p, q) => p[2] - q[2]);
  const line = (a, b, col, w) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.stroke(); };
  for (const [i, j] of cells) {
    const h = ht(i, j), c = [UV(i / n, j / n), UV((i + 1) / n, j / n), UV((i + 1) / n, (j + 1) / n), UV(i / n, (j + 1) / n)];
    // Seiten: zu den vier Nachbarzellen (−s1, +s1, −s2, +s2) – sichtbar, wenn sie zum Betrachter zeigen und der Nachbar tiefer liegt
    const sides = [[c[0], c[3], i - 1, j, -1, 0], [c[1], c[2], i + 1, j, 1, 0], [c[0], c[1], i, j - 1, 0, -1], [c[3], c[2], i, j + 1, 0, 1]];
    const edgesTop = [];
    for (const [a, b, ni, nj, g1, g2] of sides) {
      const hn = ht(ni, nj);
      if (hn >= h) continue;
      const nu = D1[0] * g1 + D2[0] * g2, nv = D1[1] * g1 + D2[1] * g2, vis = nu + nv > 0;
      if (vis) poly([P(...a, hn), P(...b, hn), P(...b, h), P(...a, h)], C(riser));
      edgesTop.push([a, b, vis]);
    }
    const q = c.map(([u, v]) => P(u, v, h));
    poly(q, C(lk.fill));
    if (lk.pat) { const L = ([u, v]) => P(u, v, h); g.save(); clipTo([c], L); patSeam = true; try { pattern(L, lk.pat[0], x, y, 1, lk.pat[1] && C(lk.pat[1]), lk.cols, 0, null, lk.fill); } finally { patSeam = false; g.restore(); } }
    for (const [a, b, vis] of edgesTop) line(P(...a, h), P(...b, h), vis ? 'rgba(255,255,255,0.35)' : 'rgba(40,30,20,0.28)', vis ? 0.7 : 0.9);
  }
}
const stairSig = o => (o.ecke ? 'E' : '') + o.rot + '|' + o.style + '|' + o.kind + '|' + o.m + o.p + '|' + o.top + (o.nar ? '|n' + (o.om ? 'm' : '') + (o.op ? 'p' : '') : '');
// drawObject 'huegeltreppe' (draw-objects.js): als Bildchen je Feld (wie drawHillTile, mit Zeitbudget beim Zoomen). Steht die Treppe so
// nicht auf dem Feld (Vorschau beim Bauen/Verschieben): ein eigenes Bildchen 'sg' mit dem Feld im Schlüssel (Muster im Weltraster).
// t kann eine Kopie sein (spriteTile malt mit einer) – verglichen wird der Inhalt, nicht das Ding
function drawHillStair(cx, cy, z, x, y, t) {
  t = t || stairAt(x, y);
  if (!t) return;
  // Geist der Vorschau (Bauen, Tragen): wird eine Ecktreppe (immer breit) – eine getragene Ecktreppe vor gerader Wand wieder gerade (stairDropped)
  if (!stairAt(x, y) && (t.ecke == null ? stairCornerNew(x, y) : t.ecke && stairDirs(x, y, stairBase(x, y)).length > 0)) t = { ...t, ecke: !t.ecke };
  const on = stairAt(x, y), real = !!on && stairRotOf(on) === stairRotOf(t) && on.style === t.style && !!on.ecke === !!t.ecke && stairSchmal(on) === stairSchmal(t), key = real ? 's' + x + ',' + y : 'sg';
  const want = DPR * Math.pow(2, Math.ceil(Math.log2(Math.max(z, 0.2)) * 2 - 1e-9) / 2);
  let e = hillSprites.get(key);
  // Aussehen nur neu bestimmen, wenn sich am Spielstand etwas getan hat (Stil im Fenster: groundVersion++)
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + (state.hills ? state.hills.size : 0) + ':' + state.tiles.size + (FOG ? 'n' : '') + '|' + stairRotOf(t) + t.style + (stairSchmal(t) ? 'n' : '');
  const fresh = real && e && e.ver === ver, o = fresh ? e.o : stairLook(x, y, t);
  const base = fresh ? e.base : stairSig(o) + (real ? '' : '|' + x + ',' + y) + (FOG ? 'n' : ''), sig = base + '|' + want.toFixed(3);
  if (e && e.base === base) { e.ver = ver; e.o = o; }
  if (hillPaintFrame !== frameNo) { hillPaintFrame = frameNo; hillPaintMs = 0; }
  if (!e || (e.sig !== sig && !(e.base === base && hillPaintMs > HILL_BUDGET))) {
    hillPurge();
    const t0 = performance.now(), B = HILL_BOX, c = document.createElement('canvas');
    c.width = Math.ceil(B.w * want); c.height = Math.ceil(B.h * want);
    const cg = c.getContext('2d');
    if (!cg) return;
    const prev = g; g = cg;
    try { g.setTransform(want, 0, 0, want, -B.left * want, -B.top * want); paintStair((u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up], o, x, y); } finally { g = prev; }
    if (e) freeCanvas(e.c);
    e = { c, sig, base, ver, o };
    hillSprites.set(key, e);
    hillPaintMs += performance.now() - t0;
  }
  const B = HILL_BOX;
  g.drawImage(e.c, cx + B.left * z, cy + B.top * z, B.w * z, B.h * z);
}
// Für Figuren auf der Treppe (Spaziergänger, nach der Figur aufrufen): was auf dem Treppenfeld vor einer Figur an der Stelle d (−½ Fuß … ½
// oben) liegt, aus dem Bildchen noch einmal darüber – der vordere Keil und, steigt die Treppe zum Betrachter an, die höheren Stufen davor.
// Nachbarfelder (Anhöhe vorn, breite Treppe) zeichnen sich danach ohnehin selbst
function drawHillStairOver(x, y, z, d) {
  const e = stairAt(x, y) && hillSprites.get('s' + x + ',' + y), o = e && e.o;
  if (!o) return;
  const H = HILL_H, n = STAIR_N, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du, nearP = Su + Sv > 0, c = toScreen(x, y);
  const W = (dd, s, h) => { const u = Du * dd + Su * s, v = Dv * dd + Sv * s; return [c.x + (u - v) * TW / 2 * z, c.y + (u + v) * TH / 2 * z - h * z]; };
  const add = pts => {                                                   // gleicher Drehsinn für alle (sonst heben sich Überlappungen auf)
    let a = 0;
    for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[(k + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    const list = a < 0 ? [...pts].reverse() : pts;
    list.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
  };
  let any = false;
  g.save(); g.beginPath();
  const near = nearP ? o.p : o.m, sg = nearP ? 1 : -1, sO = 0.5 * sg, sI = sg * (o.nar ? STAIR_NW : 0.5 - STAIR_CW);
  if (near === 'k' || near === 'w' || (o.nar && stairStrip(near))) {                                                  // Keil (bzw. hohe Böschung) wie in paintStair: vorn eine Stufe hoch, ab der obersten waagerecht
    add(hull([[-0.5, 0], [-0.5, H / n], [0.5 - 1 / n, H], [0.5, H], [0.5, 0]].flatMap(([dd, h]) => [W(dd, sO, h), W(dd, sI, h)]))); any = true;
  }
  if (Du + Dv > 0) {
    const ed = c => o.nar ? STAIR_NW : c === 'k' || c === 'w' ? 0.5 - STAIR_CW : 0.5, lo = -ed(o.m), hi = ed(o.p);
    for (let j = Math.max(0, Math.floor((d + 0.5) * n) + 1); j < n; j++) { const d0 = -0.5 + j / n, d1 = d0 + 1 / n, h = H * (j + 1) / n; add([W(d0, lo, h), W(d1, lo, h), W(d1, hi, h), W(d0, hi, h)]); any = true; }
  }
  try { if (any) { g.clip('nonzero'); const B = HILL_BOX; g.drawImage(e.c, c.x + B.left * z, c.y + B.top * z, B.w * z, B.h * z); } } finally { g.restore(); }
}
// Vorschaubild (Leiste, Bau-Infofenster): ein Eck Anhöhe (Felswand), rechts davor die eingelassene Treppe mit Keil (nar: schmal – links ein
// Streifen Anhöhe, rechts der Keil bis an die Feldgrenze)
function drawStairIcon(cx, cy, z, style, nar = false) {
  const k = z * 0.56, H = HILL_H, P = (u, v, up = 0) => [cx + (u - v) * TW / 2 * k, cy + (u + v + 0.5) * TH / 2 * k - (up - H * 0.45) * k];
  const top = (u, v) => poly([P(u - 0.5, v - 0.5, H), P(u + 0.5, v - 0.5, H), P(u + 0.5, v + 0.5, H), P(u - 0.5, v + 0.5, H)], C('#a2d879'));
  const at = (u, v) => (a, b, h) => P(u + a, v + b, h);
  top(-1, -1);
  top(0, -1); paintHillWall(at(0, -1), 0.5, -0.5, 0.5, 0.5, 'u', 'fels', 0, H, 3);
  top(-1, 0); paintHillWall(at(-1, 0), 0.5, -0.5, 0.5, 0.5, 'u', 'fels', 0, H, 5); paintHillWall(at(-1, 0), -0.5, 0.5, 0.5, 0.5, 'v', 'fels', 0, H, 7);
  paintStair(at(0, 0), { rot: 0, style: stairStyleOk(style) ? style : 'sand', kind: 'fels', m: 'h', p: 'k', top: '#a2d879', ...(nar ? { nar: 1, km: 'fels', fm: 1 } : {}) }, 1e6, 1e6);
}

// ---------------------------------------------------------------------------
// Gleis-Rampe (Nutzer 10.10.2026: „die Rampe ist nur für Züge da – Autos soll es nie geben“; Entwurf tools/gleisrampe-entwurf.js, Bild
// tools/vorschau/gleisrampe-varianten.png): Ding 'huegelrampe' unten (Ebene 0), steigt gleichmäßig von der Vorderkante des Fußfelds (Boden)
// bis zur Hinterkante des oberen Felds (Oberkante der Anhöhe dahinter; STAIR_UP[rot] zeigt hinauf). Vier Formen (t.form 'a'–'d', RAMP_FORMS
// in data.js; neu gebaut die Wahl in der Leiste, rampNewForm): A 2 Felder in die Anhöhe eingelassen – ganz breit, die Wände der Anhöhe daneben
// sind die Wangen; B 3 Felder Damm mit Stützmauer vor der Wand (schmal wie das Gleis); C 4 Felder, oben 2 schmal eingelassen (links und rechts
// bleibt ein Streifen Anhöhe stehen), unten 2 als Damm; D 4 Felder Viadukt auf Steinbögen vor der Wand, mit Brüstung. Wie alle großen Dinge
// steht sie mit dem Ankerfeld im Spielstand (kleinstes x/y, Grundfläche sizeOf [1, len]); welches Feld was ist, sagt nur rampAt. Gleise
// verbinden sich über sie (levelLink 'gleis', railRampTrack), Wege, Bewohner und Fahrzeuge nie – hinauf zu Fuß geht es über die Treppe
// ---------------------------------------------------------------------------
let rampNewForm = 'a';                                                   // Form neu gebauter Gleis-Rampen (Leiste)
const RAMP_MAX = 4;                                                      // längste Form in Feldern (so weit sucht rampAt zurück)
const GR_E = 0.0075, GR_DW = 0.32, GR_VW = 0.3, GR_PW = 0.035, GR_PH = 3;   // Überlapp; schmal (Damm, Einschnitt) ±GR_DW, Viadukt ±GR_VW, Brüstung dick/hoch
const GR_STONE = { v: '#d6cdbb', u: '#bcb29f', top: '#e6dfcf', deck: '#bdb4a3' };   // Viadukt: hell wie die Steinbogenbrücke
const isRamp = t => !!t && t.b === 'huegelrampe';
// Form gerade beim Setzen: getragen die der getragenen Rampe, sonst die Wahl in der Leiste
const rampFormNow = () => typeof moving !== 'undefined' && moving && moving.kind === 'tile' && isRamp(moving.t) && rampFormOk(moving.t.form) ? moving.t.form : rampNewForm;
// Form der Rampe t ('a'–'d'); ohne gültige Form (Vorschau-Kachel in previewDelta) wie gerade gesetzt
const rampFormOf = t => (t && rampFormOk(t.form) ? t.form : rampFormNow());
// Länge der Rampe t; ohne t so, wie sie gerade gesetzt würde (sizeOf, placeRot, Vorschau)
const rampLen = t => RAMP_FORMS[rampFormOf(t)].len;
// ganz breit (Einschnitt A): nebeneinander ein Einschnitt mit mehreren Gleisen, keine Wand dazwischen
const rampWideForm = f => rampFormOk(f) && !RAMP_FORMS[f].narrow && !RAMP_FORMS[f].viadukt;
// Form zur Länge (placeError gibt nur die Länge): f, wenn sie passt, sonst die gerade gesetzte, sonst die erste so lange
const rampFormFor = (len, f) => rampFormOk(f) && RAMP_FORMS[f].len === len ? f : RAMP_FORMS[rampFormNow()].len === len ? rampFormNow() : Object.keys(RAMP_FORMS).find(k => RAMP_FORMS[k].len === len) || 'a';
// Preis einer Form { cost, mat } (ITEMS.huegelrampe.cost/.mat zeigen die gerade gesetzte); bezahlt für die Rampe t (Abreißen erstattet es voll –
// Deko-Regel –, Form wechseln verrechnet es)
const rampCost = (f = rampFormNow()) => ({ cost: RAMP_FORMS[f].cost, mat: RAMP_FORMS[f].mat });
const rampPaid = t => ({ cost: t && t.price != null ? t.price : RAMP_FORMS[rampFormOf(t)].cost, mat: RAMP_FORMS[rampFormOf(t)].mat });
// neu gebaute Rampe (build und Vorschau über paintNewOf): Form aus der Leiste, bezahlter Preis
const rampNew = () => ({ form: rampNewForm, price: RAMP_FORMS[rampNewForm].cost });
// Felder einer Rampe mit Anker (ax, ay), vom Fuß (i = 0) bis zum oberen Feld
function rampFields(ax, ay, rot, len) {
  const [Du, Dv] = STAIR_UP[rot & 3], fx = ax + (len - 1) * Math.max(0, -Du), fy = ay + (len - 1) * Math.max(0, -Dv), out = [];
  for (let i = 0; i < len; i++) out.push([fx + i * Du, fy + i * Dv]);
  return out;
}
// Rampe auf Feld (x, y): { k: Ankerfeld, t, ax, ay, len, rot, i: 0 Fuß … len − 1 oberes Feld, form } oder null. Schaut selbst nach (nicht in
// COVER) – stimmt auch mitten in einem batch
let rampIgnore = null;                                                   // Ankerfeld einer Rampe, die gerade nicht zählt (rampFormPlan)
function rampAt(x, y) {
  let ax = x, ay = y, t = state.tiles.get(x + ',' + y);
  if (!isRamp(t)) {
    t = null;
    for (let i = 1; i < RAMP_MAX && !t; i++) {                          // rot 1/3 liegt längs x, rot 0/2 längs y
      const a = state.tiles.get((x - i) + ',' + y), b = state.tiles.get(x + ',' + (y - i));
      if (isRamp(a) && (a.rot & 1) && rampLen(a) > i) { t = a; ax = x - i; }
      else if (isRamp(b) && !(b.rot & 1) && rampLen(b) > i) { t = b; ay = y - i; }
    }
    if (!t) return null;
  }
  const k = ax + ',' + ay;
  if (k === rampIgnore) return null;                                     // Form wechseln: die alte zählt beim Prüfen nicht
  const rot = (t.rot || 0) & 3, form = rampFormOf(t), len = RAMP_FORMS[form].len, [Du, Dv] = STAIR_UP[rot];
  const fx = ax + (len - 1) * Math.max(0, -Du), fy = ay + (len - 1) * Math.max(0, -Dv);
  return { k, t, ax, ay, len, rot, i: (x - fx) * Du + (y - fy) * Dv, form };
}
// zwei Rampenfelder (rampAt) nebeneinander auf gleicher Höhe: gleiche Richtung, Form und Stufe, verschiedene Rampen (nur A wird dadurch breit)
const rampWide = (a, b) => a.k !== b.k && a.rot === b.rot && a.form === b.form && a.i === b.i;
// Lage längs der ganzen Rampe am Weltpunkt (u, v) auf ihrem Feld (x, y): 0 Vorderkante des Fußes … len Hinterkante oben; null ohne Rampe
function rampAlong(x, y, u, v) {
  const r = rampAt(x, y);
  if (!r) return null;
  const [Du, Dv] = STAIR_UP[r.rot];
  return r.i + (u - x) * Du + (v - y) * Dv + 0.5;
}
// Höhe des Gleises (Bildpunkte bei Zoom 1, 0 … HILL_H) auf dem Rampenfeld (x, y) am Weltpunkt (u, v): stetig linear von der Vorderkante des
// Fußes (0) bis zur Hinterkante des oberen Felds (HILL_H); 0 außerhalb des Felds oder ohne Rampe
function rampHeight(x, y, u, v) {
  const r = rampAt(x, y), a = u - x, b = v - y;
  if (!r || Math.abs(a) > 0.5 || Math.abs(b) > 0.5) return 0;
  const [Du, Dv] = STAIR_UP[r.rot];
  return HILL_H * (r.i + a * Du + b * Dv + 0.5) / r.len;
}
// Antippen (pickFrac): Höhe dessen, was dort zu sehen ist – im schmalen Einschnitt die Streifen Anhöhe ganz hoch, am Viadukt die Brüstung
function rampHitHeight(x, y, u, v) {
  const r = rampAt(x, y), a = u - x, b = v - y;
  if (!r || Math.abs(a) > 0.5 || Math.abs(b) > 0.5) return 0;
  const F = RAMP_FORMS[r.form], [Du, Dv] = STAIR_UP[r.rot];
  if (F.narrow && r.i >= r.len - F.cut && Math.abs(b * Du - a * Dv) > GR_DW) return HILL_H;
  return rampHeight(x, y, u, v) + (F.viadukt ? GR_PH : 0);
}
// Höhe der Oberfläche am Weltpunkt (u, v): Anhöhe des Felds, auf einer Gleis-Rampe das Gleis, auf einer Treppe die Stufe
function surfaceHeight(u, v) {
  if (!state.hills || !state.hills.size) return 0;
  const x = Math.round(u), y = Math.round(v), base = hillLift(x, y);
  const c = rampFresh();
  if (c.n && rampAt(x, y)) return base + rampHeight(x, y, u, v);
  if (c.s && stairAt(x, y)) return base + stairHeight(x, y, u, v);
  return base;
}
// alle Rampen (gemerkt je Boden-Fassung wie stairFresh, aber ohne Text-Schlüssel: levelLink fragt oft): list = die, hinter deren oberem
// Feld die Anhöhe eine Ebene höher liegt (hillRamps); n = Rampen, f = ihre Felder, s = Treppen
const RAMP_NONE = { list: [], n: 0, f: 0, s: 0, p: 0 };
let rampCache = RAMP_NONE;
function rampFresh() {
  const c = rampCache;
  if (!state.hills || !state.hills.size) return (rampCache = RAMP_NONE);  // ohne Anhöhen keine Rampen (und Treppen)
  if (c.gv === groundVersion && c.ts === state.tiles.size && c.hs === state.hills.size && c.st === state) return c;
  const list = [];
  let n = 0, f = 0, s = 0, p = 0;
  for (const [k, t] of state.tiles) {
    if (isStair(t)) s++;
    else if (t.b === 'bergportal') p++;                                  // Bergportale (157m): bpOn
    if (!isRamp(t)) continue;
    const [ax, ay] = keyXY(k), rot = (t.rot || 0) & 3, form = rampFormOf(t), len = RAMP_FORMS[form].len, [dx, dy] = STAIR_UP[rot], F = rampFields(ax, ay, rot, len), top = F[len - 1];
    n++; f += len;
    if (hillLevel(top[0] + dx, top[1] + dy) === hillLevel(top[0], top[1]) + 1) list.push({ k, ax, ay, len, rot, dx, dy, form, foot: F[0], top });
  }
  rampCache = { gv: groundVersion, ts: state.tiles.size, hs: state.hills.size, st: state, list, n, f, s, p };
  return rampCache;
}
// [{ k: Ankerfeld, ax, ay, len, rot, dx, dy, form, foot: [x, y], top: [x, y] }] – (dx, dy) zeigt hinauf; nur Rampen, die auf die Anhöhe führen
const hillRamps = () => rampFresh().list;
// Drehung der Rampe, deren oberes Feld (x, y) ist (auch der Vorschau in die Anhöhe); −1 = keine
const rampTopRotAt = (x, y) => {
  const r = rampFresh().n ? rampAt(x, y) : null;
  if (r) return r.i === r.len - 1 ? r.rot : -1;
  return hillGap && hillGap.ramp && hillGap.top === x + ',' + y ? hillGap.rot : -1;
};
// Form der Rampe, deren oberes Feld (x, y) ist und die mit Drehung r hinaufführt (auch die Vorschau in die Anhöhe); null = keine
const rampTopFormAt = (x, y, r) => {
  const a = rampFresh().n ? rampAt(x, y) : null;
  if (a) return a.i === a.len - 1 && a.rot === r ? a.form : null;
  return hillGap && hillGap.ramp && hillGap.top === x + ',' + y && hillGap.rot === r ? hillGap.form : null;
};
// (x, y) liegt im schmalen Einschnitt (C oben) einer Rampe längs y (ax 0: rot 0/2) bzw. längs x (ax 1) – an beiden Seiten stehen Streifen
// Anhöhe (auch die Vorschau in die Anhöhe)
function rampStripAt(x, y, ax) {
  const r = rampFresh().n ? rampAt(x, y) : null;
  if (r) { const F = RAMP_FORMS[r.form]; return !!F.narrow && r.i >= r.len - F.cut && (r.rot & 1) === ax; }
  return !!hillGap && !!hillGap.ramp && hillGap.keys.has(x + ',' + y) && !!RAMP_FORMS[hillGap.form].narrow && (hillGap.rot & 1) === ax;
}
// Für das Schienennetz: das Rampenfeld (x, y) als gerades Gleisstück längs seiner Achse, null ohne Gleis-Rampe. { k: Anker, rot, form, i, len,
// dx, dy: hinauf, arms: [[dx, dy], [−dx, −dy]] – Arme nur in Achsrichtung; ob dort Gleis anschließt, sagt levelLink(…, 'gleis') –, foot, top:
// Felder, h0/h1: Höhe des Gleises an Vorder-/Hinterkante dieses Felds (Bildpunkte bei Zoom 1) }
function railRampTrack(x, y) {
  const r = rampAt(x, y);
  if (!r) return null;
  const [dx, dy] = STAIR_UP[r.rot], F = rampFields(r.ax, r.ay, r.rot, r.len);
  return { k: r.k, rot: r.rot, form: r.form, i: r.i, len: r.len, dx, dy, arms: [[dx, dy], [0 - dx, 0 - dy]], foot: F[0], top: F[r.len - 1], h0: HILL_H * r.i / r.len, h1: HILL_H * (r.i + 1) / r.len };
}

// --- Wer kommt wohin (Wegenetz, Bewohner, Fahrzeuge, Gleise) ---
// Darf man von Feld (x1, y1) auf das Nachbarfeld (x2, y2)? who: 'weg' (Wegenetz, Viertel, Erreichbarkeit), 'fuss' (Bewohner zu Fuß), 'fahr'
// (Fahrzeuge) oder 'gleis' (Schiene ↔ Schiene). Gleiche Ebene, keine Rampe/Treppe dabei: ja. Gleis-Rampe nur für 'gleis', nur längs ihrer Achse
// (Fuß ↔ Feld davor auf ihrer Ebene, oberes Feld ↔ Anhöhe dahinter, ihre Felder untereinander), nie quer (auch nicht im breiten Einschnitt).
// Treppe (Nutzer, 10.10.2026: sie verbindet auch das Wegenetz) für 'weg' und 'fuss' längs ihrer Achse, quer nur in der breiten Treppe –
// schmale stehen für sich (Ecktreppe: ihre beiden Füße und die beiden Treppen, an denen sie hängt); nicht für Fahrzeuge und Gleise. Über Eck
// nie an Rampe oder Treppe. Ohne Anhöhen immer ja (wie bisher)
function levelLink(x1, y1, x2, y2, who = 'weg') {
  if (!state.hills || !state.hills.size) return true;
  const c = rampFresh(), rs = c.n > 0, ss = c.s > 0;
  const a = rs ? rampAt(x1, y1) : null, b = rs ? rampAt(x2, y2) : null;
  const sa = !a && ss ? stairAt(x1, y1) : null, sb = !b && ss ? stairAt(x2, y2) : null;
  if (!a && !b && !sa && !sb) return hillLevel(x1, y1) === hillLevel(x2, y2);
  if (Math.abs(x2 - x1) + Math.abs(y2 - y1) !== 1 || (a && sb) || (b && sa)) return false;   // über Eck; Rampe ↔ Treppe
  if (a || b) return who === 'gleis' && (a ? rampLinks(a, x1, y1, x2, y2, b) : rampLinks(b, x2, y2, x1, y1, a));   // Gleis-Rampe: nur Züge
  if (who === 'fahr' || who === 'gleis') return false;                   // Treppe: keine Fahrzeuge, keine Gleise
  return sa ? stairLinks(sa, x1, y1, x2, y2, sb) : stairLinks(sb, x2, y2, x1, y1, sa);
}
// vom Rampenfeld r (x, y) zum Nachbarn (nx, ny); n = rampAt dort (dort keine Treppe – levelLink prüft das)
function rampLinks(r, x, y, nx, ny, n) {
  const [Du, Dv] = STAIR_UP[r.rot], dx = nx - x, dy = ny - y;
  if (dx === Du && dy === Dv) return r.i < r.len - 1 ? !!n && n.k === r.k : !n && hillLevel(nx, ny) === hillLevel(x, y) + 1;   // hinauf
  if (dx === -Du && dy === -Dv) return r.i > 0 ? !!n && n.k === r.k : !n && hillLevel(nx, ny) === hillLevel(x, y);              // hinab
  return false;                                                          // quer: Gleise laufen nie seitlich ab
}
// von der Treppe s (x, y) zum Nachbarn (nx, ny); n = Treppe dort
function stairLinks(s, x, y, nx, ny, n) {
  const lv = hillLevel(x, y), dx = nx - x, dy = ny - y;
  if (s.ecke) {
    for (const [ex, ey] of cornerAxes(stairRotOf(s))) {
      if (dx === -ex && dy === -ey) return !n && hillLevel(nx, ny) === lv;   // ihr Fuß
      if (dx === ex && dy === ey) return !!n && !n.ecke && !stairSchmal(n);   // die Treppe, an der sie hängt (breit)
    }
    return false;
  }
  const [Du, Dv] = STAIR_UP[stairRotOf(s)];
  if (dx === Du && dy === Dv) return !n && hillLevel(nx, ny) === lv + 1;
  if (dx === -Du && dy === -Dv) return !n && hillLevel(nx, ny) === lv;
  if (!n) return false;
  if (n.ecke) return !stairSchmal(s) && cornerAxes(stairRotOf(n)).some(([ex, ey]) => nx + ex === x && ny + ey === y);
  return stairRotOf(n) === stairRotOf(s) && !stairSchmal(s) && !stairSchmal(n);   // breite Treppe (schmale nebeneinander: getrennt)
}

// --- Regeln ---
// Rampen um Feld (x, y): foot = die, deren Fuß direkt hinter (x, y) liegt ((x, y) ist das Feld davor); sonst die, die auf (x, y) hinaufführen.
// [[x, y], …] = das Rampenfeld daneben (lowerHill, Abtragen, Anheben, Teich: Fuß frei)
function rampsAround(x, y, foot = false) {
  const out = [];
  for (const [ex, ey] of DIRS) {
    const r = rampAt(x + ex, y + ey);
    if (!r) continue;
    const [dx, dy] = STAIR_UP[r.rot];
    if (foot ? r.i === 0 && dx === ex && dy === ey : r.i === r.len - 1 && dx === -ex && dy === -ey) out.push([x + ex, y + ey]);
  }
  return out;
}
// Passt eine Rampe der Form form (Anker x, y) in Richtung rot? Alle Felder auf einer Ebene (eingelassene eine tiefer, stairBase), hinter dem
// oberen Feld Anhöhe genau eine Ebene höher, vor dem Fuß dieselbe Ebene und kein Wasser – und die Form (rampFormFits)
function rampFits(x, y, rot, len = rampLen(), form = rampFormFor(len)) {
  const F = rampFields(x, y, rot, len), [dx, dy] = STAIR_UP[rot & 3], [fx, fy] = F[0], [tx, ty] = F[len - 1], lv = stairBase(fx, fy);
  return F.every(([px, py]) => stairBase(px, py) === lv) && hillLevel(tx + dx, ty + dy) === lv + 1 && hillLevel(fx - dx, fy - dy) === lv
    && terrainAt(fx - dx, fy - dy) !== 'water' && rampFormFits(F, rot, lv, form);
}
// Form: die oberen RAMP_FORMS[form].cut Felder liegen in der Anhöhe – jetzt Anhöhe (wird beim Bauen abgesenkt) oder schon eingelassen –, je mit
// einer Wange (rampCutOk); die übrigen stehen davor: keine Anhöhe und nicht mitten in einem Einschnitt (beidseits Anhöhe)
function rampFormFits(F, rot, lv, form) {
  const cut = RAMP_FORMS[form].cut, [Du, Dv] = STAIR_UP[rot & 3], hi = (nx, ny) => hillLevel(nx, ny) === lv + 1;
  return F.every(([px, py], i) => i >= F.length - cut ? rampCutOk(px, py, rot, lv, form, i) : !hillAt(px, py) && !(hi(px - Dv, py + Du) && hi(px + Dv, py - Du)));
}
// eingelassenes Feld i: an mindestens einer Seite Anhöhe (die Wange) bzw. ein gleiches eingelassenes Feld (A, C nebeneinander)
function rampCutOk(x, y, rot, lv, form, i) {
  const [Du, Dv] = STAIR_UP[rot & 3];
  return [[x - Dv, y + Du], [x + Dv, y - Du]].some(([nx, ny]) => {
    const n = rampAt(nx, ny);
    return n ? n.rot === (rot & 3) && n.form === form && n.i === i : hillLevel(nx, ny) === lv + 1;
  });
}
const rampDirs = (x, y, len = rampLen(), form = rampFormFor(len)) => [0, 1, 2, 3].filter(r => rampFits(x, y, r, len, form));
// Angetipptes Feld → Anker und Drehung (für Vorschau/Bauen, wer mag): der Anker ist sonst das kleinste x/y, also bei Rampen hinauf nach +x/+y
// ihr Fuß – bis zu 3 Felder vor dem angetippten. Hier gilt das Feld an der Wand: bei A und C das erste in der Anhöhe, bei B und D das oberste.
// Liefert { ax, ay, rot } der besten passenden Richtung (wie rampRot) oder null
function rampSnap(x, y, form = rampFormNow()) {
  const len = RAMP_FORMS[form].len, iw = len - Math.max(1, RAMP_FORMS[form].cut), out = [];
  for (let r = 0; r < 4; r++) {
    const [Du, Dv] = STAIR_UP[r], fx = x - iw * Du, fy = y - iw * Dv, ax = Math.min(fx, fx + (len - 1) * Du), ay = Math.min(fy, fy + (len - 1) * Dv);
    if (rampFits(ax, ay, r, len, form)) out.push({ ax, ay, rot: r });
  }
  if (out.length < 2) return out[0] || null;
  const best = out.find(o => o.rot === rampRot(o.ax, o.ay, len, form));
  return best || out[0];
}
// Bauen und Ablegen (tap, setHover; wie einAnchor der Tunneleinfahrt): passt die Rampe mit dem angetippten Feld als Anker, bleibt es (wie bisher);
// sonst gilt es als Feld an der Wand (rampSnap) – an Wänden hinten (hinauf nach +x/+y) läge der Anker sonst bis zu 3 Felder davor. Ohne Anhöhen:
// (x, y). rampTool: gerade eine Gleis-Rampe bauen oder eine getragene (✋, einzeln) ablegen
const rampTool = () => tool === 'huegelrampe' || (tool === 'verschieben' && !!moving && moving.kind === 'tile' && isRamp(moving.t));
function rampAnchor(x, y) {
  if (!state.hills || !state.hills.size || rampDirs(x, y).length) return [x, y];
  const s = rampSnap(x, y);
  return s ? [s.ax, s.ay] : [x, y];
}
// Drehung beim Setzen (placeRot, Vorschau, Verschieben): zur Anhöhe hin. Selbst gedreht (⟳, R, Mausrad: rotManual): die gewählte bzw. die
// nächste passende (so geht es z. B. an einer Ecke längs der Wand). Sonst Punkte: ein Gleis vor dem Fuß, ein echter Fuß (keine Treppe/Rampe
// davor), eine gleiche Rampe daneben (A: ein Einschnitt), je abzusenkendes Feld einer weniger – bei Gleichstand die gewählte (buildRot), sonst
// die erste. Passt keine: buildRot
function rampRot(x, y, len = rampLen(), form = rampFormFor(len)) {
  const ok = rampDirs(x, y, len, form);
  if (!ok.length) return buildRot & 3;
  if (rotManual) for (let k = 0; k < 4; k++) if (ok.includes((buildRot + k) & 3)) return (buildRot + k) & 3;   // selbst gedreht: die nächste passende
  const score = r => {
    const F = rampFields(x, y, r, len), [dx, dy] = STAIR_UP[r], ffx = F[0][0] - dx, ffy = F[0][1] - dy, ft = state.tiles.get(ffx + ',' + ffy);
    const side = F.some(([px, py], i) => [[px - dy, py + dx], [px + dy, py - dx]].some(([nx, ny]) => { const n = rampAt(nx, ny); return n && n.rot === r && n.form === form && n.i === i; }));
    return (ft && ft.b === 'schiene' ? 8 : 0) + (stairAt(ffx, ffy) || rampAt(ffx, ffy) ? 0 : 4) + (side ? 2 : 0) - F.filter(([px, py]) => hillAt(px, py)).length;
  };
  const best = Math.max(...ok.map(score)), c = ok.filter(r => score(r) === best);
  return c.includes(buildRot & 3) ? buildRot & 3 : c[0];
}
// Darf hier (Anker x, y) eine Gleis-Rampe der Form form stehen (placeError, vor den allgemeinen Prüfungen)? Wie die Treppe: unten vor der Wand
// bzw. (A, C) in den Rand einer Anhöhe eingelassen (Felder werden abgesenkt, nicht getragen: move), nicht auf Wasser, Weg, Gleis, unter einem
// Dach; frei (alle Felder: Dinge, kleine Deko, Eckpunkte); keine Linie quer (vor dem Fuß, hinter dem oberen Feld, zwischen den Feldern, im
// breiten Einschnitt). form fehlt: die zur Länge passende (rampFormFor – placeError sollte die Form der getragenen mitgeben)
function rampError(x, y, rot, len = rampLen(), move = false, form = null) {
  rot &= 3; form = rampFormFor(len, form);
  const Fm = RAMP_FORMS[form], F = rampFields(x, y, rot, len), into = F.filter(([fx, fy]) => hillAt(fx, fy));
  for (const [fx, fy] of F) if (!ownedTile(fx, fy)) return notMine(fx, fy);
  if (into.length) { const e = rampIntoError(into, move, Fm); if (e) return e; }
  if (F.some(([fx, fy]) => terrainAt(fx, fy) === 'water')) return 'Nicht auf dem Wasser';
  if (F.some(([fx, fy]) => wegAt(fx, fy) != null)) return 'Nicht auf einen Weg – Gleis und Weg kreuzen sich nur auf ebenem Boden';
  if (F.some(([fx, fy]) => archAround(fx, fy))) return ARCH_HERE;
  if (F.some(([fx, fy]) => bpFronts(fx, fy).length)) return 'Vor dem Bergportal muss Platz bleiben – dort kommt die Schiene hinein';   // Block 157m
  if (F.some(([fx, fy]) => { const t = objAt(fx, fy); return t && t.b === 'schiene'; })) return 'Nicht auf ein Gleis – stell die Rampe ans Ende des Gleises';
  if (state.roofs && state.roofs.size && F.some(([fx, fy]) => roofAt(fx, fy))) return 'Unter einer Überdachung geht keine Gleis-Rampe';
  const ok = rampDirs(x, y, len, form);
  if (!ok.length) return rampWhy(x, y, len, form, into);
  if (!ok.includes(rot)) return 'Die Gleis-Rampe muss zur Anhöhe hinauf zeigen';
  for (const [fx, fy] of F) {
    if (objAt(fx, fy) && !(rampIgnore && COVER.get(fx + ',' + fy) === rampIgnore)) return 'Hier ist nicht genug Platz';
    if ((decosAt(fx + ',' + fy) || []).some(Boolean)) return 'Hier stehen schon kleine Dekos';
  }
  const [dx, dy] = STAIR_UP[rot], [x0, y0] = F[0], [x1, y1] = F[len - 1];
  for (let vy = Math.min(y0, y1); vy <= Math.max(y0, y1) + 1; vy++) for (let vx = Math.min(x0, x1); vx <= Math.max(x0, x1) + 1; vx++) { const p = postAt(vx, vy); if (p) return `An der Ecke steht schon: ${ITEMS[p.b].name}`; }
  const edge = (ax, ay, bx, by) => state.edges.get(edgeBetween(ax, ay, bx, by));
  for (const [ax, ay, bx, by] of [[x0, y0, x0 - dx, y0 - dy], [x1, y1, x1 + dx, y1 + dy]]) { const e = edge(ax, ay, bx, by); if (e) return `Quer vor der Gleis-Rampe steht: ${ITEMS[e.b].name} – erst entfernen`; }
  for (let i = 1; i < len; i++) { const e = edge(...F[i - 1], ...F[i]); if (e) return `Quer über die Gleis-Rampe läuft: ${ITEMS[e.b].name} – erst entfernen`; }
  if (rampWideForm(form)) for (let i = 0; i < len; i++) for (const [nx, ny] of [[F[i][0] - dy, F[i][1] + dx], [F[i][0] + dy, F[i][1] - dx]]) {   // daneben ein gleicher Einschnitt
    const n = rampAt(nx, ny), e = n && n.rot === rot && n.form === form && n.i === i && edge(...F[i], nx, ny);
    if (e) return `Zwischen den Einschnitten steht: ${ITEMS[e.b].name} – erst entfernen`;
  }
  return null;
}
// Warum passt keine Richtung (rampError)? Erst, was für jede Form gilt (Wasser, Anhöhe dahinter, Rand), dann die Lage der Form
function rampWhy(x, y, len, form, into) {
  const G = [0, 1, 2, 3].map(r => rampFields(x, y, r, len)), at = (r, k) => { const [dx, dy] = STAIR_UP[r], [px, py] = G[r][k < 0 ? 0 : len - 1]; return [px + k * dx, py + k * dy]; };
  const base = r => { const lv = stairBase(...G[r][0]); return G[r].every(([px, py]) => stairBase(px, py) === lv) && hillLevel(...at(r, 1)) === lv + 1 && hillLevel(...at(r, -1)) === lv; };
  if ([0, 1, 2, 3].some(r => base(r) && terrainAt(...at(r, -1)) === 'water')) return 'Vor der Gleis-Rampe braucht es Platz – kein Wasser';
  if ([0, 1, 2, 3].some(base)) return RAMP_FORMS[form].where;           // die Lage passt, nur nicht für diese Form
  if (into.length) return [0, 1, 2, 3].every(r => hillLevel(...at(r, -1)) >= 1) ? 'Die Gleis-Rampe gehört an den Rand der Anhöhe' : 'Hinter der Gleis-Rampe muss Anhöhe bleiben – hier ist sie zu schmal';
  return G[0].some(([fx, fy]) => DIRS.some(([dx, dy]) => hillLevel(fx + dx, fy + dy) > hillLevel(fx, fy))) ? 'Vor der Gleis-Rampe braucht es Platz – keine Anhöhe und kein Wasser' : RAMP_FORMS[form].where;
}
// In eine bestehende Anhöhe (A, C; wie stairIntoError): nur die erste Ebene, die Felder leer (nichts darauf, keine Linie am Rand, nichts an den
// Ecken) und keine Treppe/Rampe, die auf sie hinaufführt (sie führte sonst ins Leere). Getragen (✋, Gruppe, ⧉ Kopie) nie: Ablegen senkt nichts
// ab. B und D stehen immer davor
function rampIntoError(into, move, Fm) {
  if (!Fm.cut) return Fm.where;
  if (move) return 'Nur in einen schon vorhandenen Einschnitt – in die Anhöhe die Gleis-Rampe neu bauen';
  if (into.some(([x, y]) => hillLevel(x, y) !== 1)) return 'Die Gleis-Rampe führt nur auf die erste Ebene';
  for (const [x, y] of into) {
    if (stairsAround(x, y).length) return 'Hierher führt schon eine Treppe hinauf';
    if (rampsAround(x, y).length) return 'Hierher führt schon eine Gleis-Rampe hinauf';
    if (archAround(x, y)) return ARCH_HERE;
    if (bkOnHill(x, y)) return BK_ON_HILL;                               // Brücke liegt auf (Block 160)
    const t = objAt(x, y), d = (decosAt(x + ',' + y) || []).find(Boolean);
    if (t || d) return `Hier steht: ${ITEMS[(t || d).b].name} – erst wegnehmen`;
    for (const k of ['a' + x + ',' + y, 'a' + x + ',' + (y + 1), 'b' + x + ',' + y, 'b' + (x + 1) + ',' + y])
      if (state.edges.has(k)) return `Am Rand steht: ${ITEMS[state.edges.get(k).b].name} – erst entfernen`;
    for (const [vx, vy] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (postAt(vx, vy)) return `An der Ecke steht: ${ITEMS[postAt(vx, vy).b].name} – erst wegnehmen`;
  }
  return null;
}
// Erstattung fürs Absenken (Preisprüfung, Schild, build): je Feld, das jetzt Anhöhe ist, eine Anhöhe
const rampIntoBack = (x, y, rot = rampRot(x, y), len = rampLen()) => rampFields(x, y, rot, len).filter(([fx, fy]) => hillAt(fx, fy)).length * ITEMS.anhoehe.cost;
// Felder der neuen Rampe absenken (build, vor dem Setzen): Anhöhe weg und erstattet (hillTake), Spaziergänger dort oben gehen (hwLowered)
function rampIntoSink(x, y, rot = rampRot(x, y), len = rampLen()) {
  let n = 0;
  for (const [fx, fy] of rampFields(x, y, rot, len)) {
    if (!hillAt(fx, fy)) continue;
    hillTake(fx, fy); n++;
    if (typeof hwLowered === 'function') hwLowered(fx, fy);
  }
  return n;
}
// Vorschau „Gleis-Rampe in die Anhöhe“ (render.js setzt hillGap für ein Bild): die abgesenkten Felder; null, wenn nichts abgesenkt wird oder es
// nicht geht
function rampGapFor(x, y, rot = rampRot(x, y), len = rampLen(), form = rampFormFor(len)) {
  const F = rampFields(x, y, rot, len), into = F.filter(([fx, fy]) => hillAt(fx, fy));
  if (!into.length || rampError(x, y, rot, len, false, form)) return null;
  const [gx, gy] = into[0];
  return { k: gx + ',' + gy, x: gx, y: gy, rot: rot & 3, lv: hillLevel(gx, gy) - 1, keys: new Set(into.map(p => p.join())), ramp: true, top: F[len - 1].join(), len, form, ax: x, ay: y };
}
// Form im Fenster wechseln (Nutzer: nur, wenn Platz und Regeln passen, sonst Hinweis): oberes Feld und Richtung bleiben, die Rampe wird zum Fuß
// hin kürzer oder länger. Gelände ändert sich dabei nie – A/C liegen in der Anhöhe, B/D davor: dazwischen nur über Abreißen und neu Bauen. Bezahlt
// wird wie Abreißen (voll zurück, Deko) und neu Bauen: die Differenz. Liefert { ax, ay, money, mat: { r: n } (Saldo, negativ = zurück) } oder
// einen Hinweis
function rampFormPlan(x, y, form) {
  const r = rampAt(x, y), Fm = rampFormOk(form) && RAMP_FORMS[form];
  if (!r || !Fm) return 'Hier ist keine Gleis-Rampe';
  if (r.form === form) return `${Fm.name} ist sie schon`;
  const [Du, Dv] = STAIR_UP[r.rot], [tx, ty] = rampFields(r.ax, r.ay, r.rot, r.len)[r.len - 1], fx = tx - (Fm.len - 1) * Du, fy = ty - (Fm.len - 1) * Dv;
  const ax = Math.min(fx, tx), ay = Math.min(fy, ty);
  if (!!RAMP_FORMS[r.form].cut !== !!Fm.cut) return Fm.cut ? `${Fm.name} liegt in der Anhöhe – diese Rampe steht davor. Dafür abreißen und auf den Rand der Anhöhe neu bauen`
    : `${Fm.name} steht vor der Wand – diese Rampe liegt in der Anhöhe. Dafür abreißen und vor der Wand neu bauen`;
  rampIgnore = r.k;                                                     // probehalber ohne die alte prüfen (wie getragen: nichts absenken)
  let err;
  try { err = rampError(ax, ay, r.rot, Fm.len, true, form); } finally { rampIgnore = null; }
  if (err) return err;
  const old = rampPaid(r.t), mat = {};
  for (const [k, n] of Object.entries(Fm.mat || {})) mat[k] = (mat[k] || 0) + n;
  for (const [k, n] of Object.entries(old.mat || {})) mat[k] = (mat[k] || 0) - n;
  const money = Fm.cost - old.cost;
  if (money > 0 && state.money < money) return 'Zu wenig Taler';
  for (const [k, n] of Object.entries(mat)) if (n > 0 && state.res[k] < n) return `Zu wenig ${RES[k].name} (${n} ${RES[k].icon} mehr nötig)`;
  return { ax, ay, money, mat };
}
// Form wechseln (Fenster, in undoable): liefert den neuen Anker [ax, ay] oder null (Hinweis über fail)
function setRampForm(x, y, form) {
  const p = rampFormPlan(x, y, form);
  if (typeof p === 'string') { fail(p); return null; }
  const r = rampAt(x, y), t = r.t;
  state.tiles.delete(r.k);
  t.form = form; t.price = RAMP_FORMS[form].cost;
  state.tiles.set(p.ax + ',' + p.ay, t);
  state.money -= p.money;
  for (const [k, n] of Object.entries(p.mat)) state.res[k] -= n;
  if (Object.values(p.mat).some(n => n > 0) && typeof flashStore === 'function') flashStore(Object.fromEntries(Object.entries(p.mat).filter(([, n]) => n > 0)));
  groundVersion++; sfx('deco'); recalc(); save();
  return [p.ax, p.ay];
}

// --- Zeichnen ---
// Aussehen eines Rampenfelds aus der Nachbarschaft: je Seite (m = −S, p = +S, S quer zur Steigung) 'h' Anhöhe daneben (A: ihre Wand ist die
// Wange; im schmalen Einschnitt auch ein gleicher Einschnitt daneben – Streifen an Streifen), 'j' gleicher Einschnitt A daneben (ein Einschnitt,
// keine Wand), 'k' offen (tiefer: Damm-/Streifenwand bzw. dunkle Kante). cut: Feld liegt im Einschnitt, first: das vorderste davon; kind = Wandart
// der Anhöhe hinter dem oberen Feld (Grasnarbe), wall = Wand des Damms (B: Stützmauer); rl = Gleis-Stil (RAIL_LOOK) der Strecke am Fuß bzw. oben.
// r: rampAt bzw. Geist { t, ax, ay, rot, len, i, form }; real false: Geist – Nachbarhöhen wie gezeichnet (Vorschau in die Anhöhe, drawLevel)
function rampLook(x, y, r, real = true) {
  const L = real ? hillLevel : drawLevel, rot = r.rot & 3, [Du, Dv] = STAIR_UP[rot], Su = -Dv, Sv = Du, lv = L(x, y);
  const form = rampFormOk(r.form) ? r.form : 'a', Fm = RAMP_FORMS[form], cutI = i => i >= r.len - Fm.cut && i < r.len, cut = cutI(r.i);
  const side = sg => {
    const nx = x + sg * Su, ny = y + sg * Sv;
    if (L(nx, ny) > lv) return 'h';
    const n = rampAt(nx, ny);
    if (n && n.rot === rot && n.form === form && n.i === r.i && (!real || n.k !== r.k)) return Fm.narrow && cut ? 'h' : rampWideForm(form) ? 'j' : 'k';
    return 'k';
  };
  const F = rampFields(r.ax, r.ay, rot, r.len), [tx, ty] = F[r.len - 1], [fx, fy] = F[0], kind = hillWall(hillAt(tx + Du, ty + Dv));
  const rail = [[fx - Du, fy - Dv], [tx + Du, ty + Dv]].map(([px, py]) => state.tiles.get(px + ',' + py)).find(t => t && t.b === 'schiene');
  // freies Ende (Prellbock wie am Ende eines Gleises): vor dem Fuß keine Schiene auf seiner Ebene, hinter dem oberen Feld keine eine Ebene höher
  const railOn = (px, py, lv) => { const t = state.tiles.get(px + ',' + py); return !!t && t.b === 'schiene' && L(px, py) === lv; };
  return { rot, len: r.len, i: r.i, form, cut, first: cut && !cutI(r.i - 1), narrow: !!Fm.narrow, viadukt: !!Fm.viadukt, kind, wall: Fm.wall || kind,
    m: side(-1), p: side(1), top: groundTopAt(x, y), rl: (DECO_LOOKS.schiene.forms[(rail && rail.form) || 0] || {}).id || 'schotter',
    ef: r.i === 0 && !railOn(fx - Du, fy - Dv, L(fx, fy)), et: r.i === r.len - 1 && !railOn(tx + Du, ty + Dv, L(tx, ty) + 1) };
}
const rampSig = o => 'G' + o.form + o.rot + o.len + o.i + '|' + o.kind + o.wall + '|' + o.m + o.p + '|' + o.top + '|' + o.rl + (o.ef ? 'f' : '') + (o.et ? 't' : '');
// Gleis gerade über ein Rampenfeld von d0 bis d1 (längs; W(d, s) → Bildpunkt auf der Schräge), Farben und Maße wie drawRailBed (Bett ±RAIL_W
// samt Rand, Schwellen alle 0,125 wie im Boden, zwei Schienen mit Glanz); Pflastergleis: Belag des Wegs bis an die Schienen. trim [x, y]: Büschel
// und Blumen am Gleis wie im Boden (railTrim, fest nach Feld) – auf Damm und Einschnitt, nicht auf dem Steinviadukt
function rampRail(W, d0, d1, lk, trim = null) {
  const ds = [d0, ...[-0.5, 0.5].filter(d => d > d0 && d < d1), d1];  // Knicke der Höhe (oben waagerecht) mitnehmen
  const band = w => [...ds.map(d => W(d, -w)), ...ds.slice().reverse().map(d => W(d, w))];
  if (lk.pave) { const pl = pathLook(lk.pave); poly(band(RAIL_W + 0.05), C(pl.edge)); poly(band(RAIL_W + 0.02), C(pl.fill)); }
  else {
    poly(band(RAIL_W + 0.03), C(lk.edge)); poly(band(RAIL_W), C(lk.bed));
    g.strokeStyle = C(lk.tie); g.lineWidth = 1.7; g.lineCap = 'butt'; g.beginPath();
    for (let d = -0.4375; d < 0.5; d += 0.125) { const a = W(d, -0.15), b = W(d, 0.15); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); }
    g.stroke();
    if (trim) railTrim(([d, s]) => W(d, s), [[[-0.5, 0], [0.5, 0]]], lk, trim[0], trim[1], 1);
  }
  const line = (o, col, w, dy) => { g.beginPath(); ds.forEach((d, i) => { const p = W(d, o); i ? g.lineTo(p[0], p[1] + dy) : g.moveTo(p[0], p[1] + dy); }); g.strokeStyle = C(col); g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
  for (const o of [-RAIL_GAUGE, RAIL_GAUGE]) { line(o, lk.rail, lk.rw, 0); line(o, '#dfe3e8', 0.45, -0.4); }
}
// Prellbock an einem freien Ende der Rampe (rampLook ef/et; wie drawRailBed am Ende eines Gleises): quer über den Schienen, kurz vor der Kante
function rampStop(W, o) {
  for (const d of [...(o.ef ? [-0.48] : []), ...(o.et ? [0.48] : [])]) {               // wie im Boden knapp vor dem Ende der Schienen
    const a = W(d, -0.17, 1.5), b = W(d, 0.17, 1.5);
    g.strokeStyle = C('#d9534a'); g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.strokeStyle = C('#ffffff'); g.lineWidth = 1; g.beginPath(); g.moveTo(...lerp(a, b, 0.35)); g.lineTo(...lerp(a, b, 0.65)); g.stroke();
  }
}
// Stirn eines Streifens im schmalen Einschnitt (an der Vorderkante seines ersten Felds, s0 … s1 quer): die Wand, die hier ohne Einschnitt stünde
// (ganzes Feld, Seite und Muster wie paintHill), auf den Streifen zugeschnitten – so liegen Steine und Wurzeln wie an jeder Anhöhe. Die
// Grasnarbe eigens für das Stück: an beiden Enden genau in der Mitte (wie paintHillWall), so läuft sie um die Ecke zur Wand des Einschnitts
// und über die Feldgrenze zur Anhöhe daneben bündig weiter (ext: dort ein Stück darüber – nur, wo daneben Anhöhe ist)
function rampStirn(P, x, y, UV, s0, s1, dir, kind, ext) {
  const H = HILL_H, E = GR_E, S = HILL_STY[kind] || HILL_STY.fels, sa = Math.min(s0, s1), sb = Math.max(s0, s1), o = 0.5 + 2 * E;
  const lo = sa <= -0.5 && ext ? -o : sa, hi = sb >= 0.5 && ext ? o : sb;
  const [ua, va] = UV(-0.5, lo), [ub, vb] = UV(-0.5, hi);
  g.save();
  try {
    g.beginPath(); [P(ua, va, -2), P(ub, vb, -2), P(ub, vb, H + 2), P(ua, va, H + 2)].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
    if (dir === 'v') paintHillWall(P, -0.5, 0.5, 0.5, 0.5, 'v', kind, 0, H, x * 7 + y * 13, H, false, 1, E, E);
    else paintHillWall(P, 0.5, -0.5, 0.5, 0.5, 'u', kind, 0, H, x * 11 + y * 5 + 3, H, false, 1, E, E);
  } finally { g.restore(); }
  const [a0, b0] = UV(-0.5, s0), [a1, b1] = UV(-0.5, s1), at = (t, h) => P(a0 + (a1 - a0) * t, b0 + (b1 - b0) * t, h);
  const ext0 = Math.abs(s0) >= 0.5 && ext ? E / Math.abs(s1 - s0) : 0, ext1 = Math.abs(s1) >= 0.5 && ext ? E / Math.abs(s1 - s0) : 0, n = 2;
  const low = i => H - S.lipH - (i % n ? hash(x * 3 + y, 90 + i, 157) : 0.5) * S.lipH * 0.7;
  const pts = [at(-ext0, H + 0.4)];
  for (let i = 0; i <= n; i++) pts.push(at(i / n, H + 0.4));
  pts.push(at(1 + ext1, H + 0.4), at(1 + ext1, low(n)));
  for (let i = n; i >= 0; i--) pts.push(at(i / n, low(i)));
  pts.push(at(-ext0, low(0)));
  poly(pts, C(S.lip));
}
// Ein Rampenfeld malen (Entwurf tools/gleisrampe-entwurf.js). P(u, v, up) → Bildpunkt (Feldkoordinaten relativ zur Feldmitte, Höhe in
// Bildpunkten bei Zoom 1); x, y: Feld (Muster). Bündig (Nutzer): vorn flach 0,0075 auf den Boden davor (nur der Fuß), hinten 0,0075 unter bzw.
// über das nächste Feld; Wände derselben Ebene reichen ein Stück unter das später gezeichnete Bildchen; Schichten nach der ganzen Höhe
function paintRamp(P, o, x, y) {
  const H = HILL_H, E = GR_E, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du;
  const h0 = H * o.i / o.len, h1 = H * (o.i + 1) / o.len, full = o.i === o.len - 1, prev = o.i > 0;
  const UV = (d, s) => [Du * d + Su * s, Dv * d + Sv * s];               // d längs (hinauf), s quer → (u, v)
  const hd = d => { const h = Math.max(0, h0 + (h1 - h0) * (d + 0.5)); return full ? Math.min(H, h) : h; };   // über die Enden hinaus waagerecht
  const W = (d, s, up = 0) => P(...UV(d, s), hd(d) + up);
  const sgF = Su + Sv > 0 ? 1 : -1, toward = Du + Dv > 0;                // Seite zum Betrachter; steigt zum Betrachter an
  const ft = prev ? -0.5 : -0.5 - E, bk = 0.5 + E, ds = [ft, -0.5, 0.5, bk];
  const quad = (s0, s1) => [...ds.map(d => W(d, s0)), ...ds.slice().reverse().map(d => W(d, s1))];
  const lk = RAIL_LOOK[o.rl] || RAIL_LOOK.schotter, seed = x * 5 + y * 9 + o.rot, dk = 'rgba(45,85,30,0.5)';
  const trace = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
  const K = { H, E, Du, Dv, Su, Sv, h0, h1, full, prev, UV, hd, W, sgF, toward, ft, bk, ds, quad, lk, seed, dk, trace };
  if (o.viadukt) return paintViaduct(P, o, x, y, K);
  if (o.narrow && o.cut) return paintRampCut(P, o, x, y, K);
  // Damm (B, C unten; schmal ±GR_DW) bzw. Einschnitt A über das ganze Feld: Oberseite in Bodenfarbe, darauf das Gleis. Hinten an den schmalen
  // Seiten etwas schmaler (sonst stand ihr Eck über der Stirn des Einschnitts dahinter)
  const w = o.narrow ? GR_DW : 0.5, back = sgF > 0 ? o.m : o.p, front = sgF > 0 ? o.p : o.m;
  const sa = -w - (back === 'j' && sgF > 0 ? E : 0), sb = w + (back === 'j' && sgF < 0 ? E : 0);   // breiter Einschnitt: hinten ein Stück über den Nachbarn
  const nb = (s, sg) => Math.abs(s) >= 0.5 ? s : s - sg * 2 * E;
  poly([W(ft, sa), W(-0.5, sa), W(0.5, sa), W(bk, nb(sa, -1)), W(bk, nb(sb, 1)), W(0.5, sb), W(-0.5, sb), W(ft, sb)], C(o.top));
  rampRail(W, ft, bk, lk, [x, y]);
  rampStop(W, o);
  if (back === 'k') {                                                    // offene Seite hinten: dunkle Kante oben, am Fuß bis ¼ Höhe eingeblendet
    const sOut = -w * sgF;
    g.save();
    try {
      trace(quad(-w, w)); g.closePath(); g.clip();
      const WL = (d, s) => P(...UV(d, s), h0 + (h1 - h0) * (d + 0.5));
      const e = full ? [WL(-0.6, sOut), WL(0.5, sOut), W(0.6, sOut)] : [WL(-0.6, sOut), WL(0.6, sOut)], d1 = (H / 4 - h0) / (h1 - h0) - 0.5;
      let st = dk;
      if (d1 > -0.5) { const a = W(-0.5, sOut), b = W(Math.min(0.5, d1), sOut), gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); if (gr) { gr.addColorStop(0, 'rgba(45,85,30,0)'); gr.addColorStop(1, dk); st = gr; } }
      trace(e); g.strokeStyle = st; g.lineWidth = 3; g.lineCap = 'butt'; g.stroke();
    } finally { g.restore(); }
  }
  if (front === 'k') {                                                   // offene Seite vorn: Wand des Damms, Grasnarbe in der Farbe der Anhöhe
    const sF = w * sgF, [a0, b0] = UV(-0.5, sF), [a1, b1] = UV(0.5, sF), nu = sgF * Su;
    // oben am Ende nur bis zur hinteren Kante der Oberseite: die Grasnarbe steht 0,4 über der Kante und schaute sonst als hellgrüner Zipfel über
    // die Wand dahinter (Stirn des Einschnitts, Anhöhe)
    const c = W(0.5, sF), q = W(0.5, -sF), f = W(-0.5, sF), dx = q[0] - c[0], dy = q[1] - c[1], sd = Math.sign(dx * (f[1] - c[1]) - dy * (f[0] - c[0]));
    const e0 = prev && !toward ? E : 0, e1 = !full && toward ? E : 0;    // unter das später gezeichnete Nachbarfeld derselben Rampe
    g.save();
    try {
      if (full) { g.beginPath(); g.moveTo(c[0] + dx * 50, c[1] + dy * 50); g.lineTo(c[0] - dx * 50, c[1] - dy * 50);
        g.lineTo(c[0] - dx * 50 - sd * dy * 50, c[1] - dy * 50 + sd * dx * 50); g.lineTo(c[0] + dx * 50 - sd * dy * 50, c[1] + dy * 50 + sd * dx * 50); g.closePath(); g.clip(); }
      const S0 = HILL_STY[o.wall] || HILL_STY.fels;
      HILL_STY[o.wall] = { ...S0, lip: (HILL_STY[o.kind] || S0).lip };   // Stützmauer vor Fels: an der Ecke sonst zwei Grüntöne
      try { paintHillWall(P, a0, b0, a1, b1, nu > 0 ? 'u' : 'v', o.wall, 0, h0, seed + 3, h1, true, 1, e0, e1, H); } finally { HILL_STY[o.wall] = S0; }
    } finally { g.restore(); }
  }
}
// Schmaler Einschnitt (C oben): links und rechts bleibt ein Streifen Anhöhe stehen (bis ±GR_DW), dazwischen der Boden mit dem Gleis. Im ersten
// Feld (davor kein Einschnitt) vorn die Stirn der Streifen – sie setzt die Wand der Anhöhe daneben fort (steigt die Rampe zum Betrachter an,
// liegt sie abgewandt: dort oben die dunkle Kante). Ist neben einem Streifen tiefer Boden ('k'), hat er außen eine Wand (vorn) bzw. oben die
// dunkle Kante (hinten); sonst reicht er ein Stück über die Feldgrenze (gleich hoch)
function paintRampCut(P, o, x, y, K) {
  const { H, E, Du, UV, W, sgF, toward, ft, bk, quad, lk, seed, dk, trace, h0, h1, full } = K, Hq = (d, s) => P(...UV(d, s), H);
  const kind = o.kind, back = sgF > 0 ? o.m : o.p, front = sgF > 0 ? o.p : o.m, fs = o.first ? -0.5 : -0.5 - E;
  const topQ = (s0, s1) => [Hq(fs, s0), Hq(0.5 + E, s0), Hq(0.5 + E, s1), Hq(fs, s1)];
  const sBo = -(back === 'h' ? 0.5 + E : 0.5) * sgF, sBi = -GR_DW * sgF, sFi = GR_DW * sgF, sFo = (front === 'h' ? 0.5 + E : 0.5) * sgF;
  const dirS = sgF * K.Su > 0 ? 'u' : 'v', dirD = -Du > 0 ? 'u' : 'v', stirn = o.first && !toward;
  const e0 = !o.first && !toward ? E : 0, e1 = !full && toward ? E : 0;  // Wände unter das später gezeichnete Nachbarfeld
  // dunkle Kanten oben als ein Linienzug je Streifen (an Ecken auf Gehrung, nie doppelt dunkel), über die Enden hinaus und auf die Oberseite
  // zugeschnitten – so treffen sie die Kante der Anhöhe daneben genau
  const edge = (pts, clipPts, st = dk) => { if (pts.length < 2) return; g.save(); try { trace(clipPts); g.closePath(); g.clip(); trace(pts); g.strokeStyle = st; g.lineWidth = 3; g.lineCap = 'butt'; g.lineJoin = 'miter'; g.stroke(); } finally { g.restore(); } };
  const down = o.first && toward;                                        // steigt zum Betrachter an: vorn (abgewandt) geht es hinab
  // hinterer Streifen: Oberseite, Wand zum Einschnitt, dunkle Kanten, Stirn
  const bq = topQ(sBo, sBi);
  poly(bq, C(o.top));
  { const [a0, b0] = UV(-0.5, sBi), [a1, b1] = UV(0.5, sBi); paintHillWall(P, a0, b0, a1, b1, dirS, kind, 0, H, seed + 11, H, true, 1, e0, e1); }
  edge([...(back === 'k' ? [Hq(0.6, -0.5 * sgF), Hq(down ? -0.5 : -0.6, -0.5 * sgF)] : down ? [Hq(-0.5, -0.6 * sgF)] : []), ...(down ? [Hq(-0.5, 0)] : [])], bq);
  if (stirn) rampStirn(P, x, y, UV, -0.5 * sgF, sBi, dirD, kind, back === 'h');
  poly(quad(-GR_DW, GR_DW), C(o.top));                                  // Boden (deckt den unteren Teil der Wand) und Gleis
  rampRail(W, ft, bk, lk, [x, y]);
  rampStop(W, o);
  // vorderer Streifen: Oberseite mit dunkler Kante zum Einschnitt – sie blendet aus, wo der Boden die Oberkante erreicht (oben am Ende gleich hoch)
  const fq = topQ(sFi, sFo);
  poly(fq, C(o.top));
  const dA = (H * 0.75 - h0) / (h1 - h0) - 0.5, dB = (H - h0) / (h1 - h0) - 0.5;
  let st = dk;
  if (dA < 0.5 + E) { const a = Hq(dA, sFi), b = Hq(dB, sFi), gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); if (gr) { gr.addColorStop(0, dk); gr.addColorStop(1, 'rgba(45,85,30,0)'); st = gr; } }
  edge(down ? [Hq(0.6, sFi), Hq(-0.5, sFi), Hq(-0.5, 0.6 * sgF)] : [Hq(0.6, sFi), Hq(-0.6, sFi)], fq, st);
  if (front === 'k') { const [a0, b0] = UV(-0.5, 0.5 * sgF), [a1, b1] = UV(0.5, 0.5 * sgF); paintHillWall(P, a0, b0, a1, b1, dirS, kind, 0, H, seed + 13, H, true, 1, e0, e1); }
  if (stirn) rampStirn(P, x, y, UV, sFi, 0.5 * sgF, dirD, kind, front === 'h');
}
// Viadukt (D): schmaler als das Feld (±GR_VW), Wand mit Bögen, Brüstung beidseits, Gleis obenauf. Bögen über die ganze Rampe (viaductArches:
// zwei je Feld, Pfeiler an Feldgrenze und Feldmitte), Mauerwerk längs der ganzen Rampe ausgerichtet – über Feldgrenzen bündig
function viaductArches(len) {
  const out = [], r = 0.17;
  for (let c = 0.25; c < len; c += 0.5) {
    const hc = HILL_H * (c - r) / len - 4.5;                             // Scheitel 4,5 unter der Fahrbahn an ihrem unteren Ende; zu niedrig: voll
    if (hc < 7) continue;
    out.push({ c, r, hc, hs: hc - Math.min(6, hc - 1.5) });
  }
  return out;
}
function paintViaduct(P, o, x, y, K) {
  const { E, UV, hd, W, ds, sgF, prev, lk, h0, h1 } = K, i0 = o.i, [Du, Dv] = STAIR_UP[o.rot & 3];
  const sF = sgF * GR_VW, sB = -sgF * GR_VW, side = sgF * K.Su > 0 ? GR_STONE.u : GR_STONE.v;
  const Wh = (d, s, h) => P(...UV(d, s), h);
  const trace = pts => pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
  const strip = (s0, s1, up) => [...ds.map(d => W(d, s0, up)), ...ds.slice().reverse().map(d => W(d, s1, up))];
  const sBi = sB + sgF * GR_PW;                                           // hintere Brüstung: Innenseite und Oberseite
  poly([...ds.map(d => W(d, sBi, 0)), ...ds.slice().reverse().map(d => W(d, sBi, GR_PH))], C(shade(GR_STONE.v, -0.08)));
  poly(strip(sB, sBi, GR_PH), C(GR_STONE.top));
  poly(strip(sBi, sF - sgF * GR_PW, 0), C(GR_STONE.deck));               // Fahrbahn und Gleis
  rampRail(W, ds[0], ds[3], lk);
  rampStop(W, o);
  // vordere Wand mit Bögen (d − 0,5 … 0,5 im Feld, vorn ein Stück unter das Feld davor, hinten ein Hauch über das dahinter)
  const dA = -0.5 - (prev ? E : 0), dB = 0.5 + E;
  const opens = viaductArches(o.len).map(a => ({ ...a, d: a.c - i0 - 0.5 })).filter(a => a.d + a.r > -0.5 && a.d - a.r < 0.5);
  const archPts = (a, s) => {
    const out = [Wh(a.d - a.r, s, -1)];
    for (let k = 0; k <= 16; k++) { const t = Math.PI - k * Math.PI / 16; out.push(Wh(a.d + Math.cos(t) * a.r, s, a.hs + Math.sin(t) * (a.hc - a.hs))); }
    out.push(Wh(a.d + a.r, s, -1));
    return out;
  };
  const wallPts = s => { const dd = [dA, ...[-0.5, 0.5].filter(d => d > dA && d < dB), dB]; return [...dd.map(d => Wh(d, s, 0)), ...dd.slice().reverse().map(d => W(d, s, 0))]; };
  const inner = shade(side, -0.4), pier = shade(side, -0.16);
  for (const a of opens) {                                               // durch die Öffnung: Rückwand (mit ihrer Öffnung) und Laibung
    const Fo = archPts(a, sF), Bo = archPts(a, sB);
    g.save();
    try {
      g.beginPath(); trace(wallPts(sF)); g.closePath(); g.clip();
      g.beginPath(); trace(Fo); g.closePath(); g.clip();
      g.beginPath(); trace(wallPts(sB)); g.closePath(); trace(Bo); g.closePath();
      g.fillStyle = C(inner); g.fill('evenodd');
      // Laibung: nur Flächen, die zum Betrachter zeigen – Normale (Δh, −Δd) gegen die Blickrichtung (1, 1, 32/39,2 je Feld; 39,2 Bildpunkte
      // Höhe = 1 Feld). Von oben sieht man nie ins Gewölbe, nur die Laibung des hinteren Pfeilers
      const pts = [[a.d - a.r, -1], ...Array.from({ length: 17 }, (_, k) => { const t = Math.PI - k * Math.PI / 16; return [a.d + Math.cos(t) * a.r, a.hs + Math.sin(t) * (a.hc - a.hs)]; }), [a.d + a.r, -1]];
      for (let k = 0; k < Fo.length - 1; k++) {
        const dd = pts[k + 1][0] - pts[k][0], dh = (pts[k + 1][1] - pts[k][1]) / 39.2;
        if (dh * (Du + Dv) - 0.816 * dd > 1e-6) poly([Fo[k], Fo[k + 1], Bo[k + 1], Bo[k]], C(pier));
      }
    } finally { g.restore(); }
  }
  g.save();
  try {
    g.beginPath(); trace(wallPts(sF)); g.closePath(); g.clip();
    g.beginPath(); g.rect(-1e4, -1e4, 2e4, 2e4); for (const a of opens) { trace(archPts(a, sF)); g.closePath(); } g.clip('evenodd');
    poly(wallPts(sF), C(side));
    const RH = 4.2, BL = 0.3;                                            // Mauerwerk in festen Steinen (wie archWall)
    g.strokeStyle = C(shade(side, -0.2)); g.lineWidth = 0.6; g.lineCap = 'butt'; g.beginPath();
    for (let k = 0, h = -1; h < HILL_H + 2; k++, h += RH) {
      const p0 = Wh(dA, sF, h), p1 = Wh(dB, sF, h); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]);
      const sh = (k & 1) * BL / 2, g0 = i0 + dA + 0.5;
      // Stoßfugen bis einschließlich der Feldgrenze dahinter (dieses Feld liegt darüber – sonst nur eine halbe Fuge)
      for (let s = Math.ceil((g0 - sh) / BL) * BL + sh; s < i0 + 1 + 1e-6; s += BL) { const d = s - i0 - 0.5, q0 = Wh(d, sF, h), q1 = Wh(d, sF, h + RH); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); }
    }
    g.stroke();
  } finally { g.restore(); }
  g.strokeStyle = C(shade(side, 0.14)); g.lineWidth = 0.8; g.lineCap = 'butt';   // heller Bogenrand
  for (const a of opens) { g.save(); try { g.beginPath(); trace(wallPts(sF)); g.closePath(); g.clip(); g.beginPath(); trace(archPts(a, sF).slice(1, -1)); g.stroke(); } finally { g.restore(); } }
  // vordere Brüstung: Außenseite (in der Ebene der Wand, etwas heller) und Oberseite; am Fuß die Stirn. Außen reicht sie als Gesims 1,6 unter
  // die Fahrbahn – dort liefen die waagerechten Fugen sonst flach in die schräge Oberkante (lange dünne Keile)
  const sFi = sF - sgF * GR_PW, gs = d => -Math.min(1.6, hd(d)), dk = -0.5 + (1.6 - h0) / (h1 - h0), dg = [ds[0], ds[1], ...(dk > -0.5 && dk < 0.5 ? [dk] : []), ...ds.slice(2)];   // am Fuß nie unter den Boden
  poly([...dg.map(d => W(d, sF, gs(d))), ...ds.slice().reverse().map(d => W(d, sF, GR_PH))], C(shade(side, 0.06)));
  g.strokeStyle = C(shade(side, -0.12)); g.lineWidth = 0.5; g.lineCap = 'butt'; g.beginPath();
  dg.forEach((d, i) => { const p = W(d, sF, gs(d)); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke();
  poly(strip(sFi, sF, GR_PH), C(GR_STONE.top));
  // Stirnseiten der Brüstungen: am Fuß, wenn die Rampe vom Betrachter weg steigt, oben am Ende, wenn sie zu ihm hin steigt (dort ragen sie über
  // die Anhöhe davor); die abgewandten nie (sie lägen über Fahrbahn und Brüstung)
  const ends = [...(!prev && !K.toward ? [-0.5] : []), ...(K.full && K.toward ? [0.5] : [])];
  for (const d of ends) for (const s0 of [sBi, sF]) { const s1 = s0 === sF ? sFi : sB; poly([W(d, s0, 0), W(d, s1, 0), W(d, s1, GR_PH), W(d, s0, GR_PH)], C(shade(GR_STONE.v, -0.04))); }
}
// drawObject 'huegelrampe' (draw-objects.js). Steht genau diese Rampe auf (x, y), malt es dieses eine Feld bei (cx, cy) – render.js zeichnet
// jedes Rampenfeld für sich (eigene Reihenfolge, nie in Streifen). Sonst (Vorschau beim Bauen/Verschieben, Bildchen der Leiste): (x, y) ist
// der Anker und (cx, cy) die Mitte der Grundfläche – alle Felder, von hinten nach vorn. t kann eine Kopie sein (spriteTile): verglichen wird
// der Inhalt
function drawHillRamp(cx, cy, z, x, y, t) {
  const r = rampAt(x, y);
  t = t || (r && r.t);
  if (!t) return;
  const rot = (t.rot || 0) & 3, form = rampFormOf(t), len = RAMP_FORMS[form].len;
  if (r && (r.t === t || (r.rot === rot && r.form === form))) { rampFieldDraw(cx, cy, z, x, y, r, true); return; }
  const F = rampFields(x, y, rot, len), mx = x + (rot & 1 ? (len - 1) / 2 : 0), my = y + (rot & 1 ? 0 : (len - 1) / 2);
  const order = F.map((p, i) => [p, i]).sort((a, b) => a[0][0] + a[0][1] - b[0][0] - b[0][1]).map(([[fx, fy], i]) => {
    const du = fx - mx, dv = fy - my;
    return [cx + (du - dv) * TW / 2 * z, cy + (du + dv) * TH / 2 * z, fx, fy, i];
  });
  const draw = () => { for (const [px, py, fx, fy, i] of order) rampFieldDraw(px, py, z, fx, fy, { t, ax: x, ay: y, rot, len, i, form }, false); };
  // Geist (halb durchsichtig) über mehrere Felder: erst deckend zusammensetzen, dann einmal durchsichtig darüber – sonst stand, wo sich die
  // Felder bündig überlappen, ein heller Strich quer über der Rampe
  if (g.globalAlpha >= 1) { draw(); return; }
  const B = HILL_BOX, tr = g.getTransform ? g.getTransform() : null, sc = Math.max(0.1, tr ? Math.hypot(tr.a, tr.b) : 1);
  const x0 = Math.min(...order.map(o => o[0])) + B.left * z, y0 = Math.min(...order.map(o => o[1])) + B.top * z;
  const w = Math.max(...order.map(o => o[0])) + (B.left + B.w) * z - x0, h = Math.max(...order.map(o => o[1])) + (B.top + B.h) * z - y0;
  const c = rampGhostBuf || (rampGhostBuf = document.createElement('canvas')), cw = Math.ceil(w * sc), ch = Math.ceil(h * sc);
  if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
  const cg = c.getContext('2d');
  if (!cg) { draw(); return; }
  cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, cw, ch); cg.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc);
  const prev = g; g = cg;
  try { draw(); } finally { g = prev; }
  g.drawImage(c, x0, y0, w, h);
}
let rampGhostBuf = null;                                                 // Zwischenbild für den Geist (drawHillRamp)
// ein Rampenfeld als Bildchen (hillSprites 'r' + Feld, Geist 'rg' + Stufe; mit Zeitbudget beim Zoomen wie drawHillStair)
function rampFieldDraw(px, py, z, x, y, r, real) {
  const key = real ? 'r' + x + ',' + y : 'rg' + r.i;
  const want = DPR * Math.pow(2, Math.ceil(Math.log2(Math.max(z, 0.2)) * 2 - 1e-9) / 2);
  let e = hillSprites.get(key);
  // Aussehen nur neu bestimmen, wenn sich am Spielstand etwas getan hat (Form im Fenster, Gleis-Stil daneben: groundVersion++)
  const ver = groundVersion + ':' + (typeof GL !== 'undefined' ? GL.drawEpoch : 0) + ':' + (state.hills ? state.hills.size : 0) + ':' + state.tiles.size + (FOG ? 'n' : '') + '|' + r.rot + r.form;
  const fresh = real && e && e.ver === ver, o = fresh ? e.o : rampLook(x, y, r, real);
  const base = fresh ? e.base : rampSig(o) + (real ? '' : '|' + x + ',' + y) + (FOG ? 'n' : ''), sig = base + '|' + want.toFixed(3);
  if (e && e.base === base) { e.ver = ver; e.o = o; }
  if (hillPaintFrame !== frameNo) { hillPaintFrame = frameNo; hillPaintMs = 0; }
  if (!e || (e.sig !== sig && !(e.base === base && hillPaintMs > HILL_BUDGET))) {
    hillPurge();
    const t0 = performance.now(), B = HILL_BOX, c = document.createElement('canvas');
    c.width = Math.ceil(B.w * want); c.height = Math.ceil(B.h * want);
    const cg = c.getContext('2d');
    if (!cg) return;
    const prev = g; g = cg;
    try { g.setTransform(want, 0, 0, want, -B.left * want, -B.top * want); paintRamp((u, v, up = 0) => [(u - v) * TW / 2, (u + v) * TH / 2 - up], o, x, y); } finally { g = prev; }
    if (e) freeCanvas(e.c);
    e = { c, sig, base, ver, o };
    hillSprites.set(key, e);
    hillPaintMs += performance.now() - t0;
  }
  const B = HILL_BOX;
  g.drawImage(e.c, px + B.left * z, py + B.top * z, B.w * z, B.h * z);
}
// Über einen Zug auf der Rampe (nach ihm aufrufen): was im Feld (x, y) der Rampe vor ihm liegt, aus dem Bildchen noch einmal darüber – im
// schmalen Einschnitt der vordere Streifen Anhöhe (sein ganzer Block), am Viadukt die vordere Brüstung. Damm und Einschnitt A liegen nie vor
// dem Zug (die Anhöhen daneben sind eigene Felder). lift: um so viel (Bildschirmpunkte) ist g gerade nach oben verschoben (wird aufgehoben)
function drawHillRampOver(x, y, z, lift = 0) {
  const e = rampAt(x, y) && hillSprites.get('r' + x + ',' + y), o = e && e.o;
  if (!o || !(o.viadukt || (o.narrow && o.cut))) return;
  const H = HILL_H, [Du, Dv] = STAIR_UP[o.rot & 3], Su = -Dv, Sv = Du, sgF = Su + Sv > 0 ? 1 : -1, c = toScreen(x, y);
  const h0 = H * o.i / o.len, h1 = Math.min(H, H * (o.i + 1) / o.len);
  const Wp = (d, s, h) => { const u = Du * d + Su * s, v = Dv * d + Sv * s; return [c.x + (u - v) * TW / 2 * z, c.y + (u + v) * TH / 2 * z - h * z]; };
  const sF = sgF * GR_VW, sFi = sF - sgF * GR_PW, E = GR_E;
  // Viadukt: die Brüstung als Ganzes (Umriss). Schmaler Einschnitt: nur die Flächen des vorderen Streifens, die man sieht – Oberseite, Wand
  // außen (nur bei tieferem Boden daneben, 'k'), Stirn vorn (paintRampCut). Nie sein Umriss: darin lagen Boden und Gleis des Einschnitts (wo die
  // Anhöhe daneben die Außenseite deckt), die dann über der Anhöhe davor standen (Nutzer: „nichts steht über“)
  const front = sgF > 0 ? o.p : o.m, so = 0.5 + (front === 'h' ? E : 0), ss = 0.5 + (front === 'h' ? 2 * E : 0), d0 = o.first ? -0.5 : -0.5 - E;   // Stirn: wie rampStirn
  const faces = o.viadukt ? [hull([[-0.5, h0], [0.5, h1]].flatMap(([d, h]) => [Wp(d, sF, h - 0.5), Wp(d, sF, h + GR_PH + 0.6), Wp(d, sFi, h + GR_PH + 0.6), Wp(d, sFi, h)]))]
    : [[Wp(d0, GR_DW * sgF, H), Wp(0.5 + E, GR_DW * sgF, H), Wp(0.5 + E, so * sgF, H), Wp(d0, so * sgF, H)],
      ...(front === 'k' ? [[Wp(-0.5 - E, 0.5 * sgF, -2), Wp(0.5 + E, 0.5 * sgF, -2), Wp(0.5 + E, 0.5 * sgF, H + 0.6), Wp(-0.5 - E, 0.5 * sgF, H + 0.6)]] : []),
      ...(o.first && !(Du + Dv > 0) ? [[Wp(-0.5, GR_DW * sgF, -2), Wp(-0.5, ss * sgF, -2), Wp(-0.5, ss * sgF, H + 0.6), Wp(-0.5, GR_DW * sgF, H + 0.6)]] : [])];
  const B = HILL_BOX;
  for (const pts of faces) {
    g.save();
    try {
      if (lift) g.translate(0, lift);
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
      g.drawImage(e.c, c.x + B.left * z, c.y + B.top * z, B.w * z, B.h * z);
    } finally { g.restore(); }
  }
}
// dasselbe für alle Felder der Rampe durch (x, y), die längs a0 … a1 (rampAlong: 0 Fuß … len oben) unter dem Zug liegen
function rampOverSpan(x, y, a0, a1, z, lift = 0) {
  const r = rampAt(x, y);
  if (!r) return;
  rampFields(r.ax, r.ay, r.rot, r.len).forEach(([fx, fy], i) => { if (i + 1 > a0 && i < a1) drawHillRampOver(fx, fy, z, lift); });
}
// Schatten eines Wagens auf der Gleis-Rampe (movers.js drawTrainCarBody, vor seiner Ellipse): neben Damm und Viadukt fällt er nicht auf deren
// Wand – die Streifen quer neben ihrer Oberseite (|quer| > Breite, über die Felder vor der Anhöhe, in der Höhe der Schräge) spart der Ausschnitt
// aus (sonst hingen Schattenreste an der Stützmauer bzw. unter der Brüstung). S(u, v, h) → Bildpunkt. Liefert, ob ausgeschnitten wurde
function rampShadowClip(x, y, S) {
  const r = rampAt(x, y), Fm = r && RAMP_FORMS[r.form], w = !Fm ? 0 : Fm.viadukt ? GR_VW : Fm.narrow ? GR_DW : 0, n = r ? r.len - (Fm.cut || 0) : 0;
  if (!w || n <= 0) return false;
  const [Du, Dv] = STAIR_UP[r.rot], [fx, fy] = rampFields(r.ax, r.ay, r.rot, r.len)[0];
  const b = hillLift(fx, fy), Wp = (d, s) => S(fx + Du * d - Dv * s, fy + Dv * d + Du * s, b + HILL_H * (d + 0.5) / r.len);   // d längs ab der Mitte des Fußes, s quer
  g.beginPath(); g.rect(-1e5, -1e5, 2e5, 2e5);
  for (const sg of [-1, 1]) [Wp(-0.5, sg * w), Wp(n - 0.5, sg * w), Wp(n - 0.5, sg * 2), Wp(-0.5, sg * 2)].forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); if (i === 3) g.closePath(); });
  g.clip('evenodd');
  return true;
}
// Vorschaubild (Leiste, Bau-Infofenster): ein Stück Anhöhe (Felswand) mit Gleis oben, davor bzw. darin die Gleis-Rampe der Form form
function drawRampIcon(cx, cy, z, form) {
  // so groß wie das Bild der Treppe (2 × 2 Felder bei z · 0,56): die ganze Szene (3 Felder breit, Länge + 1 tief) passt hinein
  const Fm = RAMP_FORMS[rampFormOk(form) ? form : 'a'], len = Fm.len, H = HILL_H, k = z * 2.25 / (len + 4);
  const P = (u, v, up = 0) => [cx + (u - v - (2 - len) / 2) * TW / 2 * k, cy + (u + v - (len - 2) / 2) * TH / 2 * k - (up - H * 0.5) * k];
  const hill = new Set();
  for (let v = -1; v < Fm.cut; v++) for (let u = -1; u <= 1; u++) if (u || v < 0) hill.add(u + ',' + v);
  const at = (u, v) => (a, b, h = 0) => P(u + a, v + b, h);
  const cells = [];
  for (let v = -1; v < len; v++) for (let u = -1; u <= 1; u++) if (hill.has(u + ',' + v) || u === 0) cells.push([u, v]);
  cells.sort((a, b) => a[0] + a[1] - b[0] - b[1] || a[0] - b[0]);
  for (const [u, v] of cells) {
    if (hill.has(u + ',' + v)) {
      const A = at(u, v);
      poly([A(-0.5, -0.5, H), A(0.5, -0.5, H), A(0.5, 0.5, H), A(-0.5, 0.5, H)], C('#a2d879'));
      if (!hill.has(u + ',' + (v + 1))) paintHillWall(A, -0.5, 0.5, 0.5, 0.5, 'v', 'fels', 0, H, u * 7 + v * 13);
      if (!hill.has((u + 1) + ',' + v)) paintHillWall(A, 0.5, -0.5, 0.5, 0.5, 'u', 'fels', 0, H, u * 11 + v * 5);
      if (u === 0) rampRail((d, s) => A(s, -d, H), -0.5, 0.5, RAIL_LOOK.schotter);   // das Gleis oben weiter
    } else {
      const i = len - 1 - v, cut = i >= len - Fm.cut;
      paintRamp(at(u, v), { rot: 0, len, i, form, cut, first: cut && i === len - Fm.cut, narrow: !!Fm.narrow, viadukt: !!Fm.viadukt, kind: 'fels', wall: Fm.wall || 'fels',
        m: cut ? 'h' : 'k', p: cut ? 'h' : 'k', top: '#a2d879', rl: 'schotter' }, 1e6, 1e6);
    }
  }
}

// ---------------------------------------------------------------------------
// Bergportal (Block 157m, Nutzer 11.10.2026: „wieso haben wir keine Tunneleinfahrt an einer Seitenwand?“ – „als Wand mit Öffnung, kein Block
// vor der Wand“; Entwurf tools/bergportal-entwurf.js, Bilder tools/vorschau/bergportal-zug*.png). Ding 'bergportal' auf einem Randfeld P der
// Anhöhe (das Feld bleibt Anhöhe, oben steht nichts), die Öffnung in ihrer Wand zum Feld F = P − d davor (d = STAIR_UP[rot], in die Anhöhe
// hinein; F eine Ebene tiefer). Ein Gleisstück: vorn die Schiene auf F, hinten der Tunnel auf P + d (bpLinks in trackLink). Gezeichnet im
// Bildchen der Anhöhe (paintHill → paintBergportal), nur an den sichtbaren Wänden (+y: rot 0, +x: rot 3) – an den hinteren verdeckt die
// Anhöhe den Zug von selbst. Form t.form: 0 A Steinbogen, 1 D nur die Öffnung (DECO_LOOKS.bergportal). Wagen am Portal: bpCut/drawCarPortal
// ---------------------------------------------------------------------------
const BP_S0 = 0.2, BP_S1 = 0.8, BP_HK = 7, BP_D = 0.9;                   // Öffnung längs der Wand (0,6 Feld), Kämpfer, Tiefe des Gleises darin
const BP_HOLE = '#2b2723', BP_JAMB = '#5a5148', BP_FLOOR = '#8a8070';
const BP_STONE = { face: '#d6cdbb', dark: '#bcb29f', top: '#e6dfcf', line: 'rgba(90,75,55,0.45)' };
const BP_WALL_LEN = Math.hypot(TW / 2, TH / 2);                          // Bildpunkte je Feld längs der Wand
const bpOn = () => hillsOn() && rampFresh().p > 0;                       // gibt es Bergportale? (sonst nichts nachsehen)
const bpAt = (x, y) => { const t = state.tiles.get(x + ',' + y); return t && t.b === 'bergportal' ? t : null; };
const bpDir = t => STAIR_UP[(t.rot || 0) & 3];
const bpShown = t => ((t.rot || 0) & 3) === 0 || ((t.rot || 0) & 3) === 3;   // Wand nach +y bzw. +x: zu sehen
// Portale, deren Fuß (Feld vor der Wand) (x, y) ist → [[px, py], …] (Anheben, Teich, Treppe, Gleis-Rampe davor)
function bpFronts(x, y) {
  if (!bpOn()) return [];
  const out = [];
  for (const [ex, ey] of DIRS) { const t = bpAt(x + ex, y + ey); if (t) { const [dx, dy] = bpDir(t); if (dx === ex && dy === ey) out.push([x + ex, y + ey]); } }
  return out;
}
// Hängt das Portal t auf (x, y) mit dem Nachbarn (nx, ny) befahrbar zusammen? Vorn die Schiene eine Ebene tiefer, hinten der Tunnel (trackLink)
function bpLinks(t, x, y, nx, ny) {
  const [dx, dy] = bpDir(t);
  if (nx === x - dx && ny === y - dy) return railTileAt(nx, ny) && hillLevel(nx, ny) === hillLevel(x, y) - 1;
  if (nx === x + dx && ny === y + dy) return tunnelAt(nx, ny);
  return false;
}
// Richtungen, in die ein Portal auf (x, y) zeigen kann: davor ebener Boden eine Ebene tiefer – kein Wasser, keine Treppe, keine Gleis-Rampe
function bpDirs(x, y) {
  const out = [], lv = hillLevel(x, y);
  if (!lv) return out;
  for (let r = 0; r < 4; r++) {
    const [dx, dy] = STAIR_UP[r], fx = x - dx, fy = y - dy;
    if (hillLevel(fx, fy) === lv - 1 && !hillAt(fx, fy) && terrainAt(fx, fy) !== 'water' && !stairAt(fx, fy) && !(rampFresh().n && rampAt(fx, fy))) out.push(r);
  }
  return out;
}
// Drehung beim Setzen (placeRot): zur Wand; passen mehrere, die mit Schiene davor, Tunnel dahinter, sichtbarer Wand – bei Gleichstand die gewählte
function bpRot(x, y) {
  const ok = bpDirs(x, y);
  if (!ok.length) return buildRot & 3;
  const score = r => { const [dx, dy] = STAIR_UP[r]; return (railTileAt(x - dx, y - dy) ? 4 : 0) + (tunnelAt(x + dx, y + dy) ? 2 : 0) + (r === 0 || r === 3 ? 1 : 0); };
  const best = Math.max(...ok.map(score)), c = ok.filter(r => score(r) === best);
  return c.includes(buildRot & 3) ? buildRot & 3 : c[0];
}
// Darf hier ein Portal stehen (placeError)? move: getragen (✋, Gruppe, ⧉ Kopie) – nie, es sitzt in der Wand
function bpError(x, y, rot, move, noCost) {
  if (move) return 'Das Bergportal sitzt in der Wand – abreißen und an der neuen Wand neu bauen';
  if (!ownedTile(x, y)) return notMine(x, y);
  if (!hillAt(x, y)) return 'Auf den Rand einer Anhöhe setzen – die Öffnung kommt in ihre Wand';
  if (hillLevel(x, y) !== 1) return 'Das Bergportal geht nur in die Wand der ersten Ebene';
  const ok = bpDirs(x, y);
  if (!ok.length) return DIRS.some(([dx, dy]) => hillLevel(x - dx, y - dy) < 1) ? 'Vor der Wand braucht es ebenen Boden – kein Wasser, keine Treppe, keine Gleis-Rampe' : 'Das Bergportal gehört an den Rand der Anhöhe';
  if (!ok.includes(rot & 3)) return 'Das Bergportal muss in die Wand zeigen';
  const t = objAt(x, y), dd = (decosAt(x + ',' + y) || []).find(Boolean);
  if (t || dd) return `Oben steht: ${ITEMS[(t || dd).b].name} – erst wegnehmen`;
  if (tunnelAt(x, y)) return 'Nicht auf den Tunnel – das Portal kommt vor sein Ende';
  if (stairsAround(x, y).length) return 'Hierher führt eine Treppe hinauf';
  if (rampsAround(x, y).length) return 'Hierher führt eine Gleis-Rampe hinauf';
  if (archAround(x, y)) return ARCH_HERE;
  const [dx, dy] = STAIR_UP[rot & 3], e = state.edges.get(edgeBetween(x, y, x - dx, y - dy));
  if (e) return `Vor der Wand steht: ${ITEMS[e.b].name} – erst entfernen`;
  if (bkAt(x - dx, y - dy)) return 'Vor dieser Wand liegt eine Brücke auf – die Öffnung käme unter ihr Ende';   // 160c R9
  const ter = terrainAt(x, y);
  if (ter !== 'grass' && !willClear('bergportal', ter)) return needError(ITEMS.bergportal, ter, {}) || 'Hier geht es nicht';
  if (noCost) return null;
  if (state.money < ITEMS.bergportal.cost + clearCost('bergportal', x, y, rot)) return 'Zu wenig Taler';
  return matError(ITEMS.bergportal.mat);
}
// Wand des Felds im Bildchen (P wie paintHill, relativ zur Feldmitte): at(s, h) – s längs der Wand (0 … 1, im Bild von links nach rechts),
// h über dem Fuß hb; into(s, d, h): d Felder in die Anhöhe hinein (Laibung, Boden im Tunnel)
function bpWall(P, side, hb) {
  if (side === 'v') return { at: (s, h) => P(-0.5 + s, 0.5, hb + h), into: (s, d, h) => P(-0.5 + s, 0.5 - d, hb + h) };
  return { at: (s, h) => P(0.5, 0.5 - s, hb + h), into: (s, d, h) => P(0.5 - d, 0.5 - s, hb + h) };
}
const bpPath = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
const bpFill = (pts, col) => { bpPath(pts); g.fillStyle = C(col); g.fill(); };
const bpLine = (pts, col, w) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = C(col); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
// Bogenöffnung in der Wand: s0 … s1, Kämpfer bei hk, Halbkreis in der Wandebene (Radius in Bildpunkten der Wand); grow: so viel größer (Ring, Rand)
function bpArch(at, s0, s1, hk, grow = 0, n = 16) {
  const sm = (s0 + s1) / 2, rs = (s1 - s0) / 2 + grow / BP_WALL_LEN, rh = (s1 - s0) / 2 * BP_WALL_LEN + grow, out = [at(sm - rs, 0)];
  for (let i = 0; i <= n; i++) { const a = Math.PI - i * Math.PI / n; out.push(at(sm + Math.cos(a) * rs, hk + Math.sin(a) * rh)); }
  out.push(at(sm + rs, 0));
  return out;
}
// Verlauf ins Dunkle über die Tiefe (Gleis im Tunnel und Wagen darin gleich): von p0 an der Wand bis p1 0,7 Feld tief
function bpDark(p0, p1) {
  const gr = g.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
  gr.addColorStop(0, 'rgba(30,26,22,0.05)'); gr.addColorStop(0.35, 'rgba(30,26,22,0.6)'); gr.addColorStop(1, 'rgba(30,26,22,0.97)');
  return gr;
}
// Inneres: dunkel, Laibung links, Boden mit dem Gleis (Gleisbett wie die Schiene davor, lk), das nach hinten ins Dunkle läuft
// shade: die Öffnung liegt im Schatten der Anhöhe (Wand nach +x, ⚙️ Schatten an) – innen mindestens so dunkel wie der Boden davor, sonst stand an der
// Wandlinie eine helle Stufe
const BP_SHADE = 'rgba(30,42,62,0.22)';                                  // wie drawHillShadows
function bpInside(W, hole, s0, s1, hTop, lk, shade = false) {
  // Naht an der Wand: das Gleis draußen (Boden-Bild) endet genau an der Wandlinie – das Innere reicht einen halben Punkt unter sie (sonst
  // schien dort ein Haar Gras durch die Kantenglättung)
  const clipHole = hole.map((p, i) => i === 0 || i === hole.length - 1 ? [p[0], p[1] + 0.6] : p);
  g.save(); bpPath(clipHole); g.clip();
  try {
    bpFill(hole, BP_HOLE);
    const D = BP_D;
    bpFill([W.at(s0, 0), W.into(s0, D, 0), W.into(s0, D, hTop), W.at(s0, hTop)], BP_JAMB);   // Laibung (zur Kamera hin offen)
    bpFill([W.at(s0, 0), W.at(s1, 0), W.into(s1, D, 0), W.into(s0, D, 0)], BP_FLOOR);       // Boden neben dem Gleis
    // Gleis: Bett, Schwellen, Schienen wie draußen (Maße wie drawRailBed, Schwellen im selben Takt ab der Wand) – dunkel wird es erst über
    // den Verlauf, so geht das Gleis an der Wand ohne Stufe weiter
    const sm = (s0 + s1) / 2, band = w => [W.into(sm - w, -0.03, 0), W.into(sm + w, -0.03, 0), W.into(sm + w, D, 0), W.into(sm - w, D, 0)];
    if (lk.pave) { const pl = pathLook(lk.pave); bpFill(band(RAIL_W + 0.05), pl.edge); bpFill(band(RAIL_W + 0.02), pl.fill); }
    else {
      bpFill(band(RAIL_W + 0.03), lk.edge); bpFill(band(RAIL_W), lk.bed);
      g.strokeStyle = C(lk.tie); g.lineWidth = 1.7; g.lineCap = 'butt'; g.beginPath();
      for (let d = 0.0625; d < D; d += 0.125) { const p = W.into(sm - 0.15, d, 0), q = W.into(sm + 0.15, d, 0); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); }
      g.stroke();
    }
    for (const o of [-RAIL_GAUGE, RAIL_GAUGE]) { bpLine([W.into(sm + o, -0.03, 0), W.into(sm + o, D, 0)], lk.rail, lk.rw); bpLine([W.into(sm + o, -0.03, 0.4), W.into(sm + o, D, 0.4)], '#dfe3e8', 0.45); }
    if (shade) { g.fillStyle = BP_SHADE; bpPath(hole); g.fill(); }
    g.fillStyle = bpDark(W.at(sm, 0), W.into(sm, 0.7, 0)); bpPath(hole); g.fill();
  } finally { g.restore(); }
}
// Steinring (Keilsteine) um die Öffnung, mit hellerem Schlussstein im Scheitel (im Ring, nichts steht über)
function bpRing(W, s0, s1, hk, t) {
  const col = BP_STONE, outer = bpArch(W.at, s0, s1, hk, t), inner = bpArch(W.at, s0, s1, hk, 0);
  bpFill([...outer, ...inner.slice().reverse()], col.face);
  const n = 16, sm = (s0 + s1) / 2, rs = (s1 - s0) / 2, rh = rs * BP_WALL_LEN, at = (i, r, h) => { const a = Math.PI - i * Math.PI / n; return W.at(sm + Math.cos(a) * r, hk + Math.sin(a) * h); };
  for (let i = 1; i < n; i += 2) bpLine([at(i, rs, rh), at(i, rs + t / BP_WALL_LEN, rh + t)], col.line, 0.8);   // Fugen der Keilsteine
  for (const sg of [-1, 1]) for (const h of [hk * 0.33, hk * 0.66]) bpLine([W.at(sm + sg * rs, h), W.at(sm + sg * (rs + t / BP_WALL_LEN), h)], col.line, 0.8);   // Fugen der Pfeiler
  const seg = [];
  for (let i = 7; i <= 9; i++) seg.push(at(i, rs + t / BP_WALL_LEN, rh + t));
  for (let i = 9; i >= 7; i--) seg.push(at(i, rs, rh));
  bpFill(seg, col.top);
  for (const i of [7, 9]) bpLine([at(i, rs, rh), at(i, rs + t / BP_WALL_LEN, rh + t)], col.line, 0.8);
  bpLine(outer.slice(1, -1), col.dark, 0.7);
}
// Gleisbett im Tunnel: wie die Schiene vor der Wand (sonst Schotter)
function bpRailLook(x, y, t) {
  const [dx, dy] = bpDir(t), f = state.tiles.get((x - dx) + ',' + (y - dy));
  return f && f.b === 'schiene' ? railLookOf(f) : RAIL_LOOK.schotter;
}
// Portal in die Wand malen (paintHill, nach den Wänden): P wie dort, top = Oberkante, kind = Wandart; nur an einer sichtbaren Wand, die da ist
function paintBergportal(P, x, y, t, top, kind, lk = bpRailLook(x, y, t)) {
  const r = (t.rot || 0) & 3, side = r === 0 ? 'v' : r === 3 ? 'u' : null;
  if (!side) return;
  const [dx, dy] = bpDir(t), wall = hillLevel(x, y) - drawLevel(x - dx, y - dy);
  if (wall <= 0) return;
  const W = bpWall(P, side, top - wall * HILL_H), H = wall * HILL_H, hole = bpArch(W.at, BP_S0, BP_S1, BP_HK), sh = side === 'u' && GFX.shadows;
  if ((t.form || 0) === 1) {                                              // D: nur die Öffnung, ein schmaler Rand in Wandfarbe
    bpFill(bpArch(W.at, BP_S0, BP_S1, BP_HK, 1.3), HILL_STY[kind].u);
    bpInside(W, hole, BP_S0, BP_S1, H, lk, sh);
  } else {                                                                // A: Steinbogen, Ring aus Keilsteinen
    bpInside(W, hole, BP_S0, BP_S1, H, lk, sh);
    bpRing(W, BP_S0, BP_S1, BP_HK, 2.6);
  }
}
const bpSig = (x, y, t) => ':P' + ((t.rot || 0) & 3) + (t.form || 0) + (GFX.shadows ? 's' : '') + (() => { const [dx, dy] = bpDir(t), f = state.tiles.get((x - dx) + ',' + (y - dy)); return f && f.b === 'schiene' ? 'g' + (f.form || 0) : ''; })();

// --- Wagen am Portal (render.js über trainTunnelCut): draußen normal, das Stück im Berg nur durch die Öffnung und nach hinten dunkel ---
// → null (nicht am Portal), 'hide' (ganz im Berg bzw. hinter einer verdeckten Wand) oder { k: Feld vor der Wand (danach gezeichnet), cut: Stück
// draußen [lo, hi] oder null, portal: { bp: [px, py, dx, dy], inn: Stück im Berg (nur an sichtbarer Wand, bis BP_D tief) oder null, out } }
function bpCut(m) {
  const rx = Math.round(m.px), ry = Math.round(m.py), la = m.len / 2;
  for (const [ox, oy] of [[0, 0], ...DIRS]) {                             // Portal auf dem Feld, dahinter (Wagen auf dem Fuß) oder davor (im Tunnel)
    const px = rx + ox, py = ry + oy, t = bpAt(px, py);
    if (!t) continue;
    const [dx, dy] = bpDir(t);
    if ((ox || oy) && !(ox === dx && oy === dy) && !(ox === -dx && oy === -dy)) continue;
    const ed = m.du * dx + m.dv * dy;
    if (Math.abs(ed) < 0.5) continue;                                     // quer davor (Kurve am Fuß): nicht hinein
    const s = (m.px - px) * dx + (m.py - py) * dy + 0.5, aw = -s / ed;    // s > 0: hinter der Wand; aw: Stelle längs des Wagens an der Wand
    const out = ed > 0 ? [-la, Math.min(la, aw)] : [Math.max(-la, aw), la];
    let inn = ed > 0 ? [Math.max(-la, aw), la] : [-la, Math.min(la, aw)];
    const hasOut = out[1] - out[0] > 0.02, hasIn = inn[1] - inn[0] > 0.02;
    if (inn[1] <= inn[0]) return null;                                    // ganz draußen: wie immer
    if (!hasIn) return { k: (px - dx) + ',' + (py - dy), cut: null, portal: { bp: [px, py, dx, dy], inn: null, out: true } };   // steckt erst einen Hauch drin: ganzer Wagen draußen – nie über trainOnHills (das Ende auf dem Portalfeld galt sonst als oben, der Wagen kippte zwei Bilder lang steil hoch)
    if (!hasOut) inn = [-la, la];                                         // ragt nur ein Hauch heraus: ganzer Wagen (sonst blitzte die Front ein Bild lang als Schnittfläche ohne Fenster auf)
    const near = Math.min(s + inn[0] * ed, s + inn[1] * ed), wall = hillLevel(px, py) > hillLevel(px - dx, py - dy);
    const showIn = bpShown(t) && wall && near < BP_D;
    if (!hasOut && !showIn) return 'hide';
    return { k: (px - dx) + ',' + (py - dy), cut: hasOut ? out : null, portal: { bp: [px, py, dx, dy], inn: showIn ? inn : null, out: hasOut } };
  }
  return null;
}
// Öffnung auf dem Bildschirm (wie im Bildchen der Anhöhe, über toScreen; unten einen halben Punkt tiefer wie bpInside)
function bpHoleScreen(px, py, r, z) {
  const at = r === 0 ? (s, h) => { const p = toScreen(px - 0.5 + s, py + 0.5); return [p.x, p.y - h * z]; }
    : (s, h) => { const p = toScreen(px + 0.5, py + 0.5 - s); return [p.x, p.y - h * z]; };
  return bpArch((s, h) => at(s, h), BP_S0, BP_S1, BP_HK).map(([x, y], i, A) => i === 0 || i === A.length - 1 ? [x, y + 0.6 * z] : [x, y]);
}
// Wagen am Portal: erst das Stück im Berg (nur durch die Öffnung, mit demselben Verlauf ins Dunkle wie das Gleis – auf seine Fläche begrenzt,
// keine Leinwand), dann das Stück draußen darüber (es deckt die Schnittfläche an der Wand)
function drawCarPortal(car, z, now) {
  const Q = car.portal, out = car.cut;
  if (Q.inn) {
    const [px, py, dx, dy] = Q.bp, r = dy ? 0 : 3, tr = car.train, H = tr.kind.h + 1.6, wb = trainHalfW(tr), { du, dv } = car;
    g.save();
    try {
      bpPath(bpHoleScreen(px, py, r, z)); g.clip();
      car.cut = Q.inn; drawTrainCarBody(car, z, now);
      const pts = [];                                                     // Umriss des Stücks (Quader: konvex) – nur dort dunkeln
      for (const a of Q.inn) for (const b of [-wb, wb]) { const p = toScreen(car.px + du * a - dv * b, car.py + dv * a + du * b); pts.push([p.x, p.y], [p.x, p.y - H * z]); }
      const w0 = toScreen(px - dx * 0.5, py - dy * 0.5), w1 = toScreen(px - dx * 0.5 + dx * 0.7, py - dy * 0.5 + dy * 0.7), hp = hull(pts);
      // kein Schatten der Anhöhe auf dem Wagen (das Stück draußen hat keinen – sonst sprang die Front beim Herausfahren von dunkel auf hell); nur der Verlauf, an der Wand fast 0
      g.fillStyle = bpDark([w0.x, w0.y], [w1.x, w0.y]); bpPath(hp); g.fill();   // waagerecht: dunkler nur mit der Tiefe, nicht nach oben (sonst war die Front an der Wand schon dunkel)
    } finally { g.restore(); car.cut = out; }
  }
  if (Q.out) drawTrainCarBody(car, z, now);
}
// Bauleiste/Leiste: Eck einer Anhöhe mit dem Portal in der linken Wand, davor die Schiene (auch das Bild des Tunnels)
function drawBergportalIcon(cx, cy, z, form = 0) {
  const s = 0.75, hw = TW / 2 * z * s, hh = TH / 2 * z * s;
  const P = (u, v, up = 0) => [cx + (u - v) * hw, cy + (u + v) * hh - up * z * s];
  const lk = RAIL_LOOK.schotter, rail = (u0, u1) => {
    const band = w => [P(-w, u0), P(w, u0), P(w, u1), P(-w, u1)];
    poly(band(RAIL_W + 0.03), C(lk.edge)); poly(band(RAIL_W), C(lk.bed));
    for (const o of [-RAIL_GAUGE, RAIL_GAUGE]) { g.strokeStyle = C(lk.rail); g.lineWidth = lk.rw * z * s; g.beginPath(); g.moveTo(...P(o, u0)); g.lineTo(...P(o, u1)); g.stroke(); }
  };
  rail(0.5, 1.2);                                                         // die Schiene davor
  poly([P(-0.5, -0.5, HILL_H), P(0.5, -0.5, HILL_H), P(0.5, 0.5, HILL_H), P(-0.5, 0.5, HILL_H)], C('#a2d879'));
  paintHillWall(P, -0.5, 0.5, 0.5, 0.5, 'v', 'fels', 0, HILL_H, 7);
  paintHillWall(P, 0.5, -0.5, 0.5, 0.5, 'u', 'fels', 0, HILL_H, 3);
  const W = bpWall(P, 'v', 0), hole = bpArch(W.at, BP_S0, BP_S1, BP_HK);
  if (form === 1) { bpFill(bpArch(W.at, BP_S0, BP_S1, BP_HK, 1.3), HILL_STY.fels.u); bpInside(W, hole, BP_S0, BP_S1, HILL_H, lk); }
  else { bpInside(W, hole, BP_S0, BP_S1, HILL_H, lk); bpRing(W, BP_S0, BP_S1, BP_HK, 2.6); }
}
