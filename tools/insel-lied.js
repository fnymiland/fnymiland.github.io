'use strict';
// ---------------------------------------------------------------------------
// Hörprobe „Deine Insel als Lied“ (Opernhaus-Idee, Nutzer 22.10.2026) – nur Werkzeug, nicht im Spiel.
// Ein goldener Streifen läuft von links nach rechts über die Insel; jede Bildschirm-Spalte (gleiches x − y) ist ein Schlag.
// Töne nur aus der Dur-Fünftonleiter (C D E G A), damit nie etwas schief klingt. Je 8 Spalten ein Takt (Akkorde C – a – d – G):
//   Glöckchen (Melodie): je Takt ein kurzes Motiv, gewählt nach dem, was dort steht (Wohnen ruhig, Läden lebhaft,
//   Wahrzeichen/Kultur als Fanfare, nur Bäume lang und tief); gespielt wird ein Motivton nur, wo die Spalte etwas hat –
//   lichte Gegenden klingen darum luftiger als die dichte Stadt. Je 4 Takte rückt die Lage nach der Höhe der Gegend
//   Bass (ab Stufe 2): Grundton je Takt, Quinte auf 5 · Takt (ab Stufe 2): Wege als leises Holzklopfen
//   Harfe (Stufe 3): Meer am Anfang und Ende · Holz (Stufe 3): Bäume als Akkordtöne · hohe Häuser funkeln
// Im Spiel (Konsole):  inselLied.play(3)   ·  inselLied.stop()   ·  await inselLied.wav(3) → Blob (WAV)
// ---------------------------------------------------------------------------
(() => {
  const SCALE = [0, 2, 4, 7, 9];
  const hz = (i, base = 261.63) => base * 2 ** ((12 * Math.floor(i / 5) + SCALE[((i % 5) + 5) % 5]) / 12);
  const STEP = 0.2;                                                     // Sekunden je Spalte
  const BASS = [0, -1, 1, -2];                                          // C, A, D, G (Stufen der Fünftonleiter)
  const CHORD = [[0, 2, 3], [-1, 0, 2], [1, 3, 4], [-2, 1, 3]];       // Akkordtöne dazu (Fünftonleiter-Stufen)
  // Art eines Feldes nach der Kategorie in ITEMS
  const HOUSES = ['haus', 'reihenhaus', 'ferienhaus', 'hausboot', 'baumhaus'];
  const KIND = b => { const cat = ITEMS[b] && ITEMS[b].cat;
    if (cat === 'netz') return 'weg'; if (HOUSES.includes(b)) return 'haus';
    if (b === 'lm' || b === 'rathaus' || ['wunder', 'kultur', 'bildung'].includes(cat)) return 'fest';
    if (['laden', 'markt', 'fz'].includes(cat)) return 'laden'; if (cat === 'deko' || b === 'feld' || b === 'obst') return 'gruen'; return 'werk'; };
  const ANCHOR = [5, 4, 6, 3];                                          // Ausgangston je Akkord (C5, A4, D5, G4)
  const MOTIF = {                                                       // 8 Schläge, Stufen über dem Ausgangston, null = Pause
    fest:  { n: [0, 2, 3, null, 5, null, 3, null], len: 1.1, vol: 0.17 },
    laden: { n: [0, 1, 2, 1, 0, 1, 2, 3], len: 0.45, vol: 0.12 },
    werk:  { n: [-2, null, -2, null, -1, null, -2, null], len: 0.35, vol: 0.12 },
    haus:  { n: [0, null, 1, null, 2, 1, 0, null], len: 0.8, vol: 0.13 },
    gruen: { n: [-2, null, null, null, -3, null, null, null], len: 1.8, vol: 0.12 },
  };

  // Insel in Spalten zerlegen: c = x − y (Bildschirm-x), s = x + y (Bildschirm-y)
  function score() {
    const zero = () => ({ haus: 0, laden: 0, fest: 0, werk: 0, gruen: 0, weg: 0, baum: 0, lvl: 0, s: 0, n: 0 });
    const cols = new Map(), col = c => { if (!cols.has(c)) cols.set(c, zero()); return cols.get(c); };
    for (const [k, t] of state.tiles) {
      const [x, y] = keyXY(k), c = col(x - y), kind = KIND(t.b);
      c[kind]++; if (kind === 'weg') continue;
      if (kind === 'haus') c.lvl = Math.max(c.lvl, t.lvl || 1);
      c.s += x + y; c.n++;
    }
    for (const [k, ds] of state.decos) { const [x, y] = keyXY(k); col(x - y).baum += ds.filter(d => d && d.b === 'baum').length; }
    const keys = [...cols.keys()], c0 = Math.min(...keys) - 4, c1 = Math.max(...keys) + 4, empty = zero();
    const steps = []; for (let c = c0; c <= c1; c++) steps.push({ c, ...(cols.get(c) || empty) });
    const has = s => s.n || s.weg || s.baum;
    const first = steps.findIndex(has), last = steps.length - 1 - [...steps].reverse().findIndex(has);
    // je Takt das Motiv, je 4 Takte die Lage (mittlere Bildschirmhöhe der Gebäude: oben = höher)
    const bars = [], all = steps.filter(s => s.n), sMin = Math.min(...all.map(s => s.s / s.n)), sMax = Math.max(...all.map(s => s.s / s.n));
    for (let i = first; i <= last; i += 8) {
      const seg = steps.slice(i, i + 8), sum = k => seg.reduce((a, s) => a + s[k], 0);
      // das Häufigste; Wahrzeichen/Kultur zählen sechsfach, Läden doppelt (sonst gehen sie zwischen Häusern unter)
      const w = { fest: sum('fest') * 6, laden: sum('laden') * 2, haus: sum('haus'), werk: sum('werk'), gruen: sum('gruen') + sum('baum') / 3 };
      const top = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
      const kind = top[1] > 0 ? top[0] : null;
      bars.push({ kind, s: sum('n') ? sum('s') / sum('n') : null });
    }
    for (let p = 0; p < bars.length; p += 4) {
      const ss = bars.slice(p, p + 4).map(b => b.s).filter(v => v != null), up = ss.length ? 1 - (ss.reduce((a, v) => a + v, 0) / ss.length - sMin) / Math.max(1, sMax - sMin) : 0.5;
      for (const b of bars.slice(p, p + 4)) b.shift = Math.round((up - 0.5) * 4);
    }
    return { steps, first, last, bars };
  }

  // Klangbausteine (gleiche Hüllkurve wie tone() in audio.js, aber für jeden Kontext, mit Hall)
  function rig(ctx) {
    const out = ctx.createGain(); out.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    const verb = ctx.createConvolver(), len = ctx.sampleRate * 2.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let r = 7 + ch; for (let i = 0; i < len; i++) { r = (r * 16807) % 2147483647; d[i] = (r / 1073741823 - 1) * Math.pow(1 - i / len, 3); } }
    verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.28;
    out.connect(comp); out.connect(verb); verb.connect(wet); wet.connect(comp); comp.connect(ctx.destination);
    const osc = (f, t0, dur, type, vol) => {
      const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.value = f;
      gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(vol, t0 + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gn).connect(out); o.start(t0); o.stop(t0 + dur + 0.05);
    };
    return {
      bell: (f, t, dur, vol) => { osc(f, t, dur, 'sine', vol); osc(f * 2, t, dur * 0.5, 'sine', vol * 0.25); osc(f * 3, t, dur * 0.25, 'sine', vol * 0.08); },
      bass: (f, t, dur, vol) => { osc(f, t, dur, 'sine', vol); osc(f * 2, t, dur * 0.6, 'triangle', vol * 0.15); },
      wood: (f, t, vol) => osc(f, t, 0.12, 'triangle', vol),
      harp: (f, t, vol) => { osc(f, t, 1.4, 'triangle', vol); osc(f * 2, t, 0.6, 'sine', vol * 0.3); },
    };
  }

  // alle Töne einplanen; liefert die Dauer
  function arrange(ctx, t0, stufe) {
    const { steps, first, last, bars } = score(), R = rig(ctx);
    // reines Meer am Rand: nur 4 Schläge vor/nach der Insel (Harfe in Stufe 3, sonst Stille)
    const from = Math.max(0, first - 4), to = Math.min(steps.length - 1, last + 4);
    for (let i = from; i <= to; i++) {
      const st = steps[i], k = i - from, t = t0 + k * STEP;
      if (i < first || i > last) { if (stufe >= 3) R.harp(hz(i < first ? 8 + (i - from) * 2 : 14 - (i - last) * 2), t, 0.07); continue; }
      const j = i - first, bar = bars[Math.floor(j / 8)], beat = j % 8, ch = Math.floor(j / 8) % 4;
      const M = bar.kind && MOTIF[bar.kind], off = M && M.n[beat];
      if (off != null && (st.n || (bar.kind === 'gruen' && st.baum))) {
        const p = ANCHOR[ch] + bar.shift + off;
        R.bell(hz(p), t, M.len, M.vol);
        if (bar.kind === 'fest' && beat === 0) R.bell(hz(p - 2), t + 0.01, 1.4, 0.07);                    // Fanfare: Terz darunter
        if (stufe >= 3 && st.lvl >= 5 && beat % 2 === 0) R.bell(hz(p + 5), t + STEP / 2, 0.35, 0.04);    // hohe Häuser funkeln
      }
      if (stufe >= 2 && beat === 0) R.bass(hz(BASS[ch], 65.41), t, STEP * 4.5, 0.3);
      if (stufe >= 2 && beat === 4) R.bass(hz(BASS[ch] + 3, 65.41), t, STEP * 4, 0.2);
      if (stufe >= 2 && st.weg && beat % 2 === 0) R.wood(hz(beat === 0 ? 10 : 12, 261.63), t, 0.03);
      if (stufe >= 3 && st.baum >= 2 && beat % 2 === 1) R.wood(hz(CHORD[ch][(beat >> 1) % 3], 130.81), t, Math.min(0.08, 0.03 + st.baum * 0.008));
    }
    // Schluss: Akkord aus Glöckchen
    const tEnd = t0 + (last + 1 - from) * STEP;
    for (const [d, v] of [[5, 0.12], [7, 0.08], [8, 0.07]]) R.bell(hz(d), tEnd, 2.2, v);
    if (stufe >= 2) R.bass(hz(0, 65.41), tEnd, 2.4, 0.3);
    return { dur: (to - from + 1) * STEP + 2.5, from, steps };
  }

  // goldener Streifen über der Insel, läuft mit
  let run = null;
  function sweep(ctx, t0, plan) {
    const cv = document.createElement('canvas'); cv.id = 'liedstreifen';
    Object.assign(cv.style, { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 });
    cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv);
    const c2 = cv.getContext('2d');
    const frame = () => {
      if (!run) return;
      const k = (ctx.currentTime - t0) / STEP; if (k > plan.dur / STEP) return stop();
      const i = Math.min(plan.steps.length - 1, plan.from + Math.max(0, k)), c = plan.steps[Math.floor(i)].c + (i % 1);
      const x = (c * TW / 2 - cam.x) * cam.z + W / 2, w = Math.max(10, TW * cam.z * 0.6);
      c2.clearRect(0, 0, cv.width, cv.height);
      const gr = c2.createLinearGradient(x - w, 0, x + w, 0);
      gr.addColorStop(0, 'rgba(255,214,110,0)'); gr.addColorStop(0.5, 'rgba(255,214,110,0.38)'); gr.addColorStop(1, 'rgba(255,214,110,0)');
      c2.fillStyle = gr; c2.fillRect(x - w, 0, 2 * w, cv.height);
      run.raf = requestAnimationFrame(frame);
    };
    run.raf = requestAnimationFrame(frame);
  }
  function stop() { if (!run) return; cancelAnimationFrame(run.raf); document.getElementById('liedstreifen')?.remove(); try { run.ctx.close(); } catch (e) { /* schon zu */ } run = null; }
  function play(stufe = 3) {
    stop();
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), t0 = ctx.currentTime + 0.3;
    run = { ctx }; const plan = arrange(ctx, t0, stufe); sweep(ctx, t0, plan);
    return `spielt ${plan.dur.toFixed(0)} s`;
  }

  // WAV zum Mitnehmen (16 Bit, Stereo)
  async function wav(stufe = 3) {
    const rate = 44100, probe = score(), n = probe.last - probe.first + 9;
    const ctx = new OfflineAudioContext(2, Math.ceil((n * STEP + 2.6) * rate), rate);
    arrange(ctx, 0.05, stufe);
    const buf = await ctx.startRendering(), L = buf.getChannelData(0), Rr = buf.getChannelData(1), len = buf.length;
    let pk = 0; for (const ch of [L, Rr]) for (let i = 0; i < len; i++) pk = Math.max(pk, Math.abs(ch[i]));
    const gain = pk > 0 ? 0.89 / pk : 1;                                    // auf gleiche Lautstärke bringen
    const dv = new DataView(new ArrayBuffer(44 + len * 4)), str = (o, s) => [...s].forEach((ch, i) => dv.setUint8(o + i, ch.charCodeAt(0)));
    str(0, 'RIFF'); dv.setUint32(4, 36 + len * 4, true); str(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
    dv.setUint32(24, rate, true); dv.setUint32(28, rate * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, len * 4, true);
    for (let i = 0; i < len; i++) { dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i] * gain)) * 32767, true); dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, Rr[i] * gain)) * 32767, true); }
    return new Blob([dv], { type: 'audio/wav' });
  }

  window.inselLied = { play, stop, wav, score };
})();
