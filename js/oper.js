'use strict';
// ---------------------------------------------------------------------------
// 🎭 Opernhaus (Prachtbau, Block 161f, Nutzer 22.10.2026): nach der Semperoper – Rundbau mit Bögen, Saal mit Kuppel, Portal als
// erhöhtes Stück des Rings nach links vorn. Einmal im Spiel, 3×3, kostet Taler, drei Stufen (Ausbau per Knopf im Infofenster).
// Wirkung: „Deine Insel als Lied“ – Antippen → ▶ spielt die Insel wie eine Spieluhr ab, ein goldener Streifen läuft von links nach
// rechts mit. Bild aus tools/prachtbauten-entwurf.js (semper, abgenommen), Lied aus tools/insel-lied.js
// (Klangset Spieluhr, weicher Bass – Nutzer: „nur Spieluhr, das klingt toll“; gezupfter Kontrabass klang „scheiße“).
// ---------------------------------------------------------------------------
// Ausbau = schöneres Gebäude und mehr 🌸; das Lied ist in jeder Stufe nur die Spieluhr (Nutzer 22.10.2026: „ja auch nur spieluhr“)
const OPER_STAGES = [
  { name: 'Opernhaus', look: 'Rundbau mit Bögen' },
  { name: 'Großes Opernhaus', look: 'zweites Geschoss und grüne Kuppel', cost: { money: 1.5e9 } },
  { name: 'Prachtoper', look: 'Gold, Lyra und Krone', cost: { money: 4e9 } },
];
ITEMS.oper = { cat: 'deko', name: 'Opernhaus', size: [3, 3], cost: 500e6, needs: 'grass', h: 82, beauty: 100, festival: true, unique: true, the: 'Das Opernhaus',
  operStages: OPER_STAGES, desc: 'Rundbau mit Bögen und grüner Kuppel. Antippen: Das Opernhaus spielt deine Insel als Lied.' };
FX.oper = '🎶 spielt deine Insel · 🌸 je Stufe';
ITEM_TIPS.oper = 'Einmal im Spiel, braucht 3×3 Felder Wiese. Antippen und ▶ – das Opernhaus spielt deine Insel als Lied, und Bauen klingt nach deiner Insel.';
{ const fz = MENU.find(m => m.id === 'freizeit'), kultur = fz && fz.groups.find(gr => gr.id === 'kultur'); if (kultur) kultur.items.push('oper'); }

const OPER_ART = (() => {
  const GOLD = '#f5c84b', GOLD_D = '#c9962a', GOLD_L = '#ffe9a0';
  const lit = () => night > 0.15 && isLive();
  const glowP = (p, r) => { const q = 0.4; glowQuad([[p[0] - q, p[1] + q], [p[0] + q, p[1] + q], [p[0] + q, p[1] - q], [p[0] - q, p[1] - q]], r); };
  const L = (col, w, z, pts) => { g.strokeStyle = col; g.lineWidth = Math.max(0.5, w * z); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.stroke(); };
  const lyre = (x, y, z, s = 1) => { g.strokeStyle = C(GOLD); g.lineWidth = 1.2 * z * s; g.beginPath();
    g.moveTo(x - 3 * z * s, y); g.quadraticCurveTo(x - 4.6 * z * s, y - 6 * z * s, x - 2 * z * s, y - 9 * z * s);
    g.moveTo(x + 3 * z * s, y); g.quadraticCurveTo(x + 4.6 * z * s, y - 6 * z * s, x + 2 * z * s, y - 9 * z * s);
    g.moveTo(x - 2.4 * z * s, y - 8 * z * s); g.lineTo(x + 2.4 * z * s, y - 8 * z * s); g.stroke();
    L(C(GOLD_D), 0.4 * s, z, [[x - 1 * z * s, y - 1 * z * s], [x - 1 * z * s, y - 8 * z * s]]); L(C(GOLD_D), 0.4 * s, z, [[x + 1 * z * s, y - 1 * z * s], [x + 1 * z * s, y - 8 * z * s]]);
    box(x, y + 0.5 * z * s, 4 * z * s, 2 * z * s, 1.4 * z * s, GOLD_D, null, 0); };
  const crown = (x, y, z, s = 1) => { ellipse(x, y, 4 * z * s, 1.8 * z * s, C(GOLD_D)); for (const k of [-3, -1.5, 0, 1.5, 3]) poly([[x + (k - 0.7) * z * s, y], [x + (k + 0.7) * z * s, y], [x + k * z * s, y - 3.4 * z * s]], C(GOLD)); circle(x, y - 4.4 * z * s, 1 * z * s, C(GOLD_L)); };
  // Rundbau (Bildschirm-Zylinder): Punkt auf dem Mantel, Winkel t (0 = vorn, Blick +a+b), Höhe h über dem Fuß
  const ring = (cx, cy, rx, ry, z) => (t, h) => [cx + Math.sin(t) * rx, cy + Math.cos(t) * ry - h * z];
  const onRing = (R, t0, t1, h0, h1, fill) => { if (Math.cos((t0 + t1) / 2) < 0.35) return; const pts = [], n = 8, rise = (h1 - h0) * 0.3;   // fast seitliche Fenster wären nur halbe Striche
    for (let i = 0; i <= n; i++) pts.push(R(t0 + (t1 - t0) * i / n, h0));
    for (let i = n; i >= 0; i--) { const t = t0 + (t1 - t0) * i / n; pts.push(R(t, h1 - rise + Math.sqrt(Math.sin(Math.PI * i / n)) * rise)); }   // Wurzel: Rundbogen statt Spitze
    poly(pts, fill); };

  // Stufen: 1 = eingeschossiger Ring, Saal mit flachem Dach; 2 = zweites Geschoss, Kuppel; 3 = Gold, Lyra, Krone
  return function semper(K, stufe) {
    const z = K.z, WALL = '#efe4cf', TRIM = '#e2d3b4', DOME = '#7fb8a4', s2 = stufe >= 2, s3 = stufe >= 3;
    const winCol = lit() ? '#ffd873' : C('#9fc3e3'), dark = C('#5f4a3a');
    const H = s2 ? 24 : 13, T = H + 2.5;
    K.block({ a: 0, b: 0, ha: 1.42, hb: 1.42, h: 3, wall: '#cfc3a5', type: 'flat', roof: '#e2d8c0' });
    const [cx, cy] = K.P(-0.1, -0.1, 3), r1 = 1.15 * Math.SQRT2 * TW / 2 * z, r2 = 0.52 * Math.SQRT2 * TW / 2 * z;   // Ring breit, Saal schmaler
    // äußerer Rundbau mit Bögen (ab Stufe 2 zweigeschossig)
    cyl(cx, cy, r1, r1 / 2, H * z, WALL);
    const R = ring(cx, cy, r1, r1 / 2, z);
    for (let t = -1.35; t <= 1.36; t += 0.27) { onRing(R, t - 0.08, t + 0.08, 2, 10, dark); if (s2) onRing(R, t - 0.08, t + 0.08, 13, 21, winCol); if (lit() && Math.cos(t) > 0.15) glowP(R(t, s2 ? 17 : 7), 12 * z); }
    if (s2) { g.strokeStyle = C(s3 ? GOLD : shade(TRIM, -0.06)); g.lineWidth = 1 * z; g.beginPath(); for (let i = 0; i <= 24; i++) { const p = R(-Math.PI / 2 + Math.PI * i / 24, 11.5); i ? g.lineTo(...p) : g.moveTo(...p); } g.stroke(); }
    cyl(cx, cy - H * z, r1, r1 / 2, 2.5 * z, s3 ? GOLD : TRIM);            // Brüstung
    ellipse(cx, cy - T * z, r1 * 0.96, r1 * 0.48, C(shade(WALL, 0.07)));   // Terrasse
    // Saal: höherer Rundbau aus der Mitte (beginnt auf der Terrasse, nicht im Ring – sonst stand er vor dessen Obergeschoss)
    const sh = s2 ? 16 : 10, base = cy - T * z;
    cyl(cx, base, r2, r2 / 2, sh * z, shade(WALL, -0.02));
    const R2 = ring(cx, base, r2, r2 / 2, z);
    for (let t = -1.2; t <= 1.21; t += 0.4) onRing(R2, t - 0.1, t + 0.1, s2 ? 4 : 3, s2 ? 12 : 8, winCol);
    ellipse(cx, base - sh * z, r2 * 1.04, r2 * 0.52, C(s3 ? GOLD : TRIM));
    if (!s2) ellipse(cx, base - sh * z, r2 * 0.94, r2 * 0.47, C(shade(WALL, 0.05)));       // Stufe 1: flaches Dach (eine flache Kuppel sah wie eine Schüssel aus)
    else dome(cx, base - sh * z, r2, r2 / 2, 14 * z, DOME);
    if (s2 && !s3) cyl(cx, base - (sh + 14) * z, 3.2 * z, 1.6 * z, 4 * z, TRIM);    // Laterne schlicht
    if (s3) { cyl(cx, base - (sh + 14) * z, 3.2 * z, 1.6 * z, 4 * z, GOLD); crown(cx, base - (sh + 18) * z, z, 0.75); }
    // Portal nach links vorn (+b, wie die Eingänge aller Gebäude) als Teil des Rundbaus: ein Stück des Rings springt leicht vor und
    // steigt über die Brüstung (Exedra wie in Dresden) – kein angesetzter Kasten (Nutzer: „schwebend und komisch rangesetzt“)
    const tc = -Math.PI / 4, t0 = tc - 0.36, t1 = tc + 0.36, ph = s2 ? 40 : 24, ro = r1 * 1.05, ri = r1 * 0.9;
    const Ro = ring(cx, cy, ro, ro / 2, z), Ri = ring(cx, cy, ri, ri / 2, z), arc = (Rf, a, b, h) => Array.from({ length: 17 }, (_, i) => Rf(a + (b - a) * i / 16, h));
    const strip = (h0, h1, col, a, b) => poly([...arc(Ro, a, b, h0), ...arc(Ro, b, a, h1)], C(col));
    // Streifen auf dem Mantel; was rechts von vorn (t > 0) liegt, im Schatten wie der Ring
    const band = (h0, h1, col, a = t0, b = t1) => { const m = Math.min(Math.max(0, a), b);
      if (m > a) strip(h0, h1, col, a, m); if (b > m) strip(h0, h1, shade(col, LIGHT.side), m, b); };
    if (tc >= 0) poly([Ro(t0, T), Ro(t0, ph), Ri(t0, ph), Ri(t0, T)], C(shade(WALL, 0.06)));        // Stirnseiten über der Terrasse
    if (tc <= 0) poly([Ro(t1, T), Ro(t1, ph), Ri(t1, ph), Ri(t1, T)], C(shade(WALL, LIGHT.side)));
    band(0, ph, shade(WALL, 0.03));                                                                        // Mantel
    poly([...arc(Ro, t0, t1, ph), ...arc(Ri, t1, t0, ph)], C(shade(TRIM, -0.05)));                         // Abdeckung, dunkler als die Terrasse
    for (const d of [-0.31, -0.19, 0.19, 0.31]) band(0, ph - 1.2, shade(WALL, -0.04), tc + d - 0.025, tc + d + 0.025);   // Pilaster
    for (const d of [-0.25, 0.25]) { onRing(Ro, tc + d - 0.03, tc + d + 0.03, 2, 10, dark); if (s2) onRing(Ro, tc + d - 0.03, tc + d + 0.03, 15, 23, winCol); }
    onRing(Ro, tc - 0.13, tc + 0.13, 2, s2 ? 31 : 19, C('#4f3d30'));                                     // Nische
    onRing(Ro, tc - 0.08, tc + 0.08, 3, s2 ? 14 : 13, C('#8a5a3c'));                                     // Tor
    if (s2) onRing(Ro, tc - 0.08, tc + 0.08, 17, 28, winCol);
    // Gesimse auf Höhe der Ringgesimse (11,5 und Brüstung), in der Nische unterbrochen; oben die Attika-Kante
    const sims = [[H, T, s3 ? GOLD : TRIM, 0.13], [ph - 1.2, ph, s3 ? GOLD : TRIM, 0]];
    if (s2) sims.unshift([11.5, 13, s3 ? GOLD : shade(TRIM, -0.06), 0.13]);
    for (const [h0, h1, col, cut] of sims) { band(h0, h1, col, t0, tc - cut); band(h0, h1, col, tc + cut, t1); }
    if (s3) { const [o, i] = [Ro(tc, ph), Ri(tc, ph)]; lyre(o[0] * 0.25 + i[0] * 0.75, o[1] * 0.25 + i[1] * 0.75, z, 1.2); }   // ganz auf der Abdeckung
    if (lit()) glowP(Ro(tc, s2 ? 22 : 10), (s2 ? 22 : 14) * z);
  };
})();
BIG_ART.oper = (cx, cy, z, now, x, y, lvl) => OPER_ART(kit(cx, cy, z, 0), Math.max(1, Math.min(3, lvl || 1)));

// Ausbau: nächste Stufe (oder null), bezahlte Ausbau-Taler (Abriss gibt alles zurück wie bei Wahrzeichen)
const operNext = t => OPER_STAGES[t.lvl || 1] || null;
const operPaidUp = t => OPER_STAGES.slice(1, t.lvl || 1).reduce((s, st) => s + st.cost.money, 0);
function operUpgrade(x, y) {
  const t = state.tiles.get(x + ',' + y), nx = t && t.b === 'oper' && operNext(t);
  if (!nx) return false;
  if (!canPay(nx.cost)) { fail('Zu wenig Taler'); return false; }
  state.money -= nx.cost.money;
  t.lvl = (t.lvl || 1) + 1;
  t.born = performance.now();
  recalc();
  sparkle(x + 1.5, y + 1.5);
  confettiBurst(); sfx('star');
  toast(`🎉 ${nx.name}: ${nx.look}!`);
  save();
  return true;
}
// Infofenster (ui.js openInfo): Lied abspielen, Stufe, Ausbau
function operInfoHtml(t) {
  if (t.b !== 'oper') return '';
  const lvl = t.lvl || 1, nx = operNext(t);
  return `<div class="label">${OPER_STAGES[lvl - 1].name} · Stufe ${lvl} von ${OPER_STAGES.length}</div>
    <p class="muted">🎶 Spielt deine Insel als Lied auf der Spieluhr. Was du baust, verändert die Melodie, und Bauen klingt nach deiner Insel.</p>
    <div class="row"><button class="btn" id="p-oper-lied">${operPlaying() ? '■ Anhalten' : '▶ Lied spielen'}</button></div>
    ${nx ? `<div class="label">Nächste Stufe: ${nx.name}</div>
      <p class="muted">${nx.look[0].toUpperCase() + nx.look.slice(1)} · 🌸 +${ITEMS.oper.beauty}.</p>
      <div class="stats">${costSpans(nx.cost.money, {})}</div>
      <div class="row"><button class="btn" id="p-oper-up" ${canPay(nx.cost) ? '' : 'disabled'}>✨ Ausbauen</button></div>`
    : '<p class="ok">Höchste Stufe – prächtiger geht es nicht!</p>'}`;
}

// ---------------------------------------------------------------------------
// „Deine Insel als Lied“: jede Bildschirm-Spalte (x − y) ist ein Schlag, je 8 ein Takt (Akkorde C – a – d – G). Töne nur aus der
// Dur-Fünftonleiter (C D E G A), damit nie etwas schief klingt. Je Takt ein kurzes Motiv nach dem, was dort am häufigsten steht
// (Wohnen ruhig, Läden lebhaft, Wahrzeichen/Kultur als Fanfare, Betriebe tief klopfend, Grün lang und tief); ein Motivton erklingt nur,
// wo die Spalte etwas hat. Nur die Spieluhr (Bass, Holzblock, Harfe, Marimba, Streicher je Stufe: Nutzer „auch nur spieluhr“).
// ---------------------------------------------------------------------------
const OPER_LIED = (() => {
  const SCALE = [0, 2, 4, 7, 9];
  const hz = (i, base = 261.63) => base * 2 ** ((12 * Math.floor(i / 5) + SCALE[((i % 5) + 5) % 5]) / 12);
  const STEP = 0.2;                                                     // Sekunden je Spalte
  const ANCHOR = [5, 4, 6, 3];                                          // Ausgangston je Akkord (C5, A4, D5, G4)
  const MOTIF = {                                                       // 8 Schläge, Stufen über dem Ausgangston, null = Pause
    fest:  { n: [0, 2, 3, null, 5, null, 3, null], len: 1.1, vol: 0.17 },
    laden: { n: [0, 1, 2, 1, 0, 1, 2, 3], len: 0.45, vol: 0.12 },
    werk:  { n: [-2, null, -2, null, -1, null, -2, null], len: 0.35, vol: 0.12 },
    haus:  { n: [0, null, 1, null, 2, 1, 0, null], len: 0.8, vol: 0.13 },
    gruen: { n: [-2, null, null, null, -3, null, null, null], len: 1.8, vol: 0.12 },
  };
  const HOUSES = ['haus', 'reihenhaus', 'ferienhaus', 'hausboot', 'baumhaus'];
  const KIND = b => { const cat = ITEMS[b] && ITEMS[b].cat;
    if (cat === 'netz') return 'weg'; if (HOUSES.includes(b)) return 'haus';
    if (b === 'lm' || b === 'rathaus' || b === 'oper' || ['wunder', 'kultur', 'bildung'].includes(cat)) return 'fest';
    if (['laden', 'markt', 'fz'].includes(cat)) return 'laden'; if (cat === 'deko' || b === 'feld' || b === 'obst') return 'gruen'; return 'werk'; };

  // Insel in Spalten zerlegen: c = x − y (Bildschirm-x), s = x + y (Bildschirm-y). region: nur diese Insel (die des Opernhauses –
  // über alle Inseln lief der Streifen weit außerhalb des Bildes, das Lied dauerte Minuten)
  function score(region) {
    const mine = (x, y) => region == null || regionAt(x, y) === region;
    const zero = () => ({ haus: 0, laden: 0, fest: 0, werk: 0, gruen: 0, weg: 0, baum: 0, lvl: 0, s: 0, n: 0 });
    const cols = new Map(), col = c => { if (!cols.has(c)) cols.set(c, zero()); return cols.get(c); };
    let yMin = Infinity, yMax = -Infinity;
    for (const [k, t] of state.tiles) {
      const [x, y] = keyXY(k);
      if (!mine(x, y)) continue;
      yMin = Math.min(yMin, x + y); yMax = Math.max(yMax, x + y);
      const c = col(x - y), kind = KIND(t.b);
      c[kind]++; if (kind === 'weg') continue;
      if (kind === 'haus') c.lvl = Math.max(c.lvl, t.lvl || 1);
      c.s += x + y; c.n++;
    }
    for (const [k, ds] of state.decos) { const [x, y] = keyXY(k); if (mine(x, y)) col(x - y).baum += ds.filter(d => d && d.b === 'baum').length; }
    if (!cols.size) return null;
    const keys = [...cols.keys()], c0 = Math.min(...keys) - 4, c1 = Math.max(...keys) + 4, empty = zero();
    const steps = []; for (let c = c0; c <= c1; c++) steps.push({ c, ...(cols.get(c) || empty) });
    const has = s => s.n || s.weg || s.baum;
    const first = steps.findIndex(has), last = steps.length - 1 - [...steps].reverse().findIndex(has);
    // je Takt das Motiv (das Häufigste; Wahrzeichen/Kultur zählen sechsfach, Läden doppelt), je 4 Takte die Lage (oben = höher)
    const bars = [], all = steps.filter(s => s.n), sMin = Math.min(...all.map(s => s.s / s.n)), sMax = Math.max(...all.map(s => s.s / s.n));
    for (let i = first; i <= last; i += 8) {
      const seg = steps.slice(i, i + 8), sum = k => seg.reduce((a, s) => a + s[k], 0);
      const w = { fest: sum('fest') * 6, laden: sum('laden') * 2, haus: sum('haus'), werk: sum('werk'), gruen: sum('gruen') + sum('baum') / 3 };
      const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
      bars.push({ kind: top[1] > 0 ? top[0] : null, s: sum('n') ? sum('s') / sum('n') : null });
    }
    for (let p = 0; p < bars.length; p += 4) {
      const ss = bars.slice(p, p + 4).map(b => b.s).filter(v => v != null), up = ss.length && sMax > sMin ? 1 - (ss.reduce((a, v) => a + v, 0) / ss.length - sMin) / (sMax - sMin) : 0.5;
      for (const b of bars.slice(p, p + 4)) b.shift = Math.round((up - 0.5) * 4);
    }
    return { steps, first, last, bars, yMin, yMax };                  // yMin/yMax: Bildschirm-Höhe der Insel (für den Streifen)
  }

  // Klang: Spieluhr-Zungen (Grundton, leicht verstimmter Zwilling, Obertöne, feiner Klick) mit Hall
  function rig(ctx, dest) {
    const rate = ctx.sampleRate, out = ctx.createGain(); out.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    const verb = ctx.createConvolver(), len = Math.floor(rate * 2.6), ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let r = 7 + ch; for (let i = 0; i < len; i++) { r = (r * 16807) % 2147483647; d[i] = (r / 1073741823 - 1) * Math.pow(1 - i / len, 3.2); } }
    verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.32;
    out.connect(comp); out.connect(verb); verb.connect(wet); wet.connect(comp); comp.connect(dest);
    let seed = 99; const rnd = () => (seed = (seed * 16807) % 2147483647) / 1073741823 - 1;
    const noise = ctx.createBuffer(1, rate, rate); { const d = noise.getChannelData(0); for (let i = 0; i < rate; i++) d[i] = rnd(); }
    const env = (node, t0, dur, vol, att = 0.006) => { const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(vol, t0 + att); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); node.connect(gn); return gn; };
    const osc = (f, t0, dur, vol) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; env(o, t0, dur, vol).connect(out); o.start(t0); o.stop(t0 + dur + 0.05); };
    const click = (t0, vol) => { const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(); src.buffer = noise; fl.type = 'highpass'; fl.frequency.value = 5000; fl.Q.value = 0.7; src.connect(fl); env(fl, t0, 0.015, vol, 0.002).connect(out); src.start(t0, Math.abs(rnd()) * 0.5); src.stop(t0 + 0.035); };
    return { mel: (f, t, dur, vol) => { osc(f, t, dur * 1.3, vol); osc(f * 1.003, t, dur * 1.3, vol * 0.5); osc(f * 4.1, t, dur * 0.3, vol * 0.16); osc(f * 9.7, t, 0.08, vol * 0.05); click(t, vol * 0.25); } };
  }

  // alle Töne einplanen; liefert Dauer und Spalten (für den Streifen)
  function arrange(ctx, dest, t0, region) {
    const sc = score(region);
    if (!sc) return null;
    const { steps, first, last, bars } = sc, R = rig(ctx, dest);
    const from = Math.max(0, first - 4), to = Math.min(steps.length - 1, last + 4);   // Meer am Rand: 4 stille Schläge vor/nach der Insel
    for (let i = first; i <= last; i++) {
      const st = steps[i], t = t0 + (i - from) * STEP;
      const j = i - first, bar = bars[Math.floor(j / 8)], beat = j % 8, ch = Math.floor(j / 8) % 4;
      const M = bar.kind && MOTIF[bar.kind], off = M && M.n[beat];
      if (off != null && (st.n || (bar.kind === 'gruen' && st.baum))) {
        const p = ANCHOR[ch] + bar.shift + off;
        R.mel(hz(p), t, M.len, M.vol);
        if (bar.kind === 'fest' && beat === 0) R.mel(hz(p - 2), t + 0.01, 1.4, 0.07);                     // Fanfare: Terz darunter
      }
    }
    const tEnd = t0 + (last + 1 - from) * STEP;                         // Schluss: Akkord
    for (const [d, v] of [[5, 0.12], [7, 0.08], [8, 0.07]]) R.mel(hz(d), tEnd, 2.2, v);
    return { dur: (to - from + 1) * STEP + 3, from, steps, STEP, yMin: sc.yMin, yMax: sc.yMax };
  }

  // Ton an einer Stelle: Motiv des Takts dort, Akkord, Lage (für die Bauklänge). Pause im Motiv → der Ton davor
  function noteAt(x, y) {
    const sc = score(regionAt(x, y));
    if (!sc) return null;
    const i = sc.steps.findIndex(s => s.c === x - y), j = i - sc.first;
    if (i < 0 || j < 0 || i > sc.last) return null;
    const bar = sc.bars[Math.floor(j / 8)], beat = j % 8, ch = Math.floor(j / 8) % 4, M = MOTIF[bar.kind || 'haus'];
    let k = beat; while (k > 0 && M.n[k] == null) k--;
    const base = ANCHOR[ch] + bar.shift;
    return { f: hz(base + (M.n[k] != null ? M.n[k] : 0)), phrase: M.n.map(o => o == null ? null : hz(base + o)), len: M.len, vol: M.vol };
  }
  return { score, arrange, rig, noteAt, STEP };
})();

// Bauklänge (Nutzer 22.10.2026, „B klingt gut“ – Hintergrundmusik war „zu unruhig“): Steht das Opernhaus, klingt Bauen wie der Ton, der an
// dieser Stelle im Lied der Insel liegt, Ausbauen wie der Takt dort. Immer nur die Spieluhr (Nutzer: „Stufe 1 klingt viel cooler als 3“ –
// Bass und Harfe dazu waren zu viel; die Stufen gelten nur fürs ▶ Lied). Liefert true, wenn es
// geklungen hat (dann kein gewöhnlicher Bau-Klang); im Rechteck/Zieh-Rutsch (BATCH) still wie sfx, schnelle Folgen höchstens alle 60 ms
let operVoice = null, operNoteT = 0;
const operTile = () => { for (const t of state.tiles.values()) if (t.b === 'oper') return t; return null; };
function operTone(x, y, phrase = false) {
  if (BATCH) return false;
  const op = operTile(), ctx = op && audio();
  if (!ctx) return false;
  const now = performance.now();
  if (!phrase && now - operNoteT < 60) return true;
  operNoteT = now;
  try {
    const n = OPER_LIED.noteAt(x, y);
    if (!n) return false;
    if (!operVoice || operVoice.ctx !== ctx) { const bus = ctx.createGain(); bus.gain.value = 0.8; bus.connect(ctx.destination); operVoice = { ctx, R: OPER_LIED.rig(ctx, bus) }; }
    const R = operVoice.R, t0 = ctx.currentTime + 0.02;
    if (phrase) {                                                        // Ausbau: der ganze Takt der Stelle
      let k = 0; for (const f of n.phrase) { if (f) R.mel(f, t0 + k * 0.16, n.len, n.vol); k++; }
    } else {
      R.mel(n.f, t0, Math.max(0.6, n.len), 0.15);
    }
    return true;
  } catch (e) { return false; }
}

// Abspielen: eigener Ausgang am Klang-Kontext (audio.js), Anhalten blendet ihn aus; der goldene Streifen läuft auf einer eigenen Ebene
let operRun = null;
const operPlaying = () => !!operRun;
function operStop() {
  if (!operRun) return;
  const r = operRun; operRun = null;
  cancelAnimationFrame(r.raf);
  if (r.cv) r.cv.remove();
  try { r.bus.gain.setTargetAtTime(0, r.ctx.currentTime, 0.08); setTimeout(() => r.bus.disconnect(), 600); } catch (e) { /* schon weg */ }
}
function operPlay(region) {
  operStop();
  const ctx = audio();
  if (!ctx) { fail('🔇 Der Ton ist aus – in den Einstellungen einschalten'); return false; }
  const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(ctx.destination);
  const t0 = ctx.currentTime + 0.3, plan = OPER_LIED.arrange(ctx, bus, t0, region);
  if (!plan) { bus.disconnect(); return false; }
  const cv = document.createElement('canvas');
  cv.className = 'oper-streifen';
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 });
  document.body.appendChild(cv);
  operRun = { ctx, bus, cv, raf: 0 };
  const frame = () => {
    if (!operRun) return;
    const k = (ctx.currentTime - t0) / plan.STEP;
    if (k > plan.dur / plan.STEP) { operStop(); return; }
    if (cv.width !== innerWidth || cv.height !== innerHeight) { cv.width = innerWidth; cv.height = innerHeight; }
    const c2 = cv.getContext('2d'), i = Math.min(plan.steps.length - 1, plan.from + Math.max(0, k)), c = plan.steps[Math.floor(i)].c + (i % 1);
    const x = (c * TW / 2 - cam.x) * cam.z + W / 2, w = Math.max(10, TW * cam.z * 0.6);
    c2.clearRect(0, 0, cv.width, cv.height);
    if (k >= 0) {                                                        // nur über der Insel, oben und unten weich auslaufend
      const y0 = (plan.yMin * TH / 2 - cam.y) * cam.z + H / 2 - 90 * cam.z, y1 = (plan.yMax * TH / 2 - cam.y) * cam.z + H / 2 + 20 * cam.z;
      const gr = c2.createLinearGradient(x - w, 0, x + w, 0);
      gr.addColorStop(0, 'rgba(255,214,110,0)'); gr.addColorStop(0.5, 'rgba(255,214,110,0.38)'); gr.addColorStop(1, 'rgba(255,214,110,0)');
      c2.globalCompositeOperation = 'source-over'; c2.fillStyle = gr; c2.fillRect(x - w, y0, 2 * w, y1 - y0);
      const fade = c2.createLinearGradient(0, y0, 0, y1);
      fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(0.2, 'rgba(0,0,0,1)'); fade.addColorStop(0.85, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
      c2.globalCompositeOperation = 'destination-in'; c2.fillStyle = fade; c2.fillRect(x - w, y0, 2 * w, y1 - y0);
      c2.globalCompositeOperation = 'source-over';
    }
    operRun.raf = requestAnimationFrame(frame);
  };
  operRun.raf = requestAnimationFrame(frame);
  return true;
}
