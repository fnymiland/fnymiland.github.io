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
// Im Spiel (Konsole):  inselLied.play(3, 'harfe')   ·  inselLied.stop()   ·  await inselLied.wav(3, 'vibra') → Blob (WAV) · Klangsets: spieluhr, harfe, vibra
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

  // Klangbausteine: echte Klangfarben statt Sinustönen – gezupfte Saiten (Karplus-Strong), Spieluhr-Zungen,
  // Marimba/Vibraphon (Holz- bzw. Metallplatten mit ihren Obertönen), Streicher-Fläche, Holzblock. Alles mit Hall.
  function rig(ctx, set) {
    const rate = ctx.sampleRate, out = ctx.createGain(); out.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    const verb = ctx.createConvolver(), len = rate * 2.6, ir = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let r = 7 + ch; for (let i = 0; i < len; i++) { r = (r * 16807) % 2147483647; d[i] = (r / 1073741823 - 1) * Math.pow(1 - i / len, 3.2); } }
    verb.buffer = ir; const wet = ctx.createGain(); wet.gain.value = 0.32;
    out.connect(comp); out.connect(verb); verb.connect(wet); wet.connect(comp); comp.connect(ctx.destination);
    let seed = 99; const rnd = () => (seed = (seed * 16807) % 2147483647) / 1073741823 - 1;
    const noise = ctx.createBuffer(1, rate, rate); { const d = noise.getChannelData(0); for (let i = 0; i < rate; i++) d[i] = rnd(); }
    const env = (node, t0, dur, vol, att = 0.006) => { const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(vol, t0 + att); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); node.connect(gn); return gn; };
    const osc = (f, t0, dur, type, vol, dest = out, att) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; env(o, t0, dur, vol, att).connect(dest); o.start(t0); o.stop(t0 + dur + 0.05); };
    const burst = (t0, dur, vol, type, freq, q) => { const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(); src.buffer = noise; fl.type = type; fl.frequency.value = freq; fl.Q.value = q; src.connect(fl); env(fl, t0, dur, vol, 0.002).connect(out); src.start(t0, Math.abs(rnd()) * 0.5); src.stop(t0 + dur + 0.02); };
    // gezupfte Saite: Rauschen läuft durch eine Verzögerungsschleife; exakte Tonhöhe über playbackRate
    const ks = new Map();
    const pluck = (f, t0, dur, vol, bright = 0.5, decay = 0.996, dest = out, att = 0) => {
      const N = Math.max(4, Math.floor(rate / f - 0.5)), key = N + '|' + bright + '|' + decay + '|' + dur;
      if (!ks.has(key)) {
        const n = Math.ceil(dur * rate), b = ctx.createBuffer(1, n, rate), d = b.getChannelData(0), ring = new Float32Array(N);
        let lp = 0; for (let i = 0; i < N; i++) { lp += bright * (rnd() - lp); ring[i] = lp; }
        for (let i = 0; i < n; i++) { const j = i % N, v = ring[j]; d[i] = v; ring[j] = decay * 0.5 * (v + ring[(j + 1) % N]); }
        ks.set(key, b);
      }
      const src = ctx.createBufferSource(); src.buffer = ks.get(key); src.playbackRate.value = f / (rate / (N + 0.5));
      const gn = ctx.createGain(); if (att) { gn.gain.setValueAtTime(0, t0); gn.gain.linearRampToValueAtTime(vol * 2.2, t0 + att); } else gn.gain.value = vol * 2.2;
      src.connect(gn).connect(dest); src.start(t0);
    };
    const lowpass = (freq) => { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = freq; fl.connect(out); return fl; };
    const bassBus = lowpass(900), padBus = lowpass(1500);
    const V = {
      spieluhr: (f, t, dur, vol) => { osc(f, t, dur * 1.3, 'sine', vol); osc(f * 1.003, t, dur * 1.3, 'sine', vol * 0.5); osc(f * 4.1, t, dur * 0.3, 'sine', vol * 0.16); osc(f * 9.7, t, 0.08, 'sine', vol * 0.05); burst(t, 0.015, vol * 0.25, 'highpass', 5000, 0.7); },
      harfe: (f, t, dur, vol) => pluck(f, t, Math.max(1.2, dur * 1.8), vol * 1.1, 0.55, 0.997),
      vibra: (f, t, dur, vol) => {
        const trem = ctx.createGain(), lfo = ctx.createOscillator(), dep = ctx.createGain(); trem.gain.value = 0.8; lfo.frequency.value = 5.2; dep.gain.value = 0.2;
        lfo.connect(dep).connect(trem.gain); trem.connect(out); lfo.start(t); lfo.stop(t + dur * 2 + 0.1);
        osc(f, t, dur * 2, 'sine', vol, trem, 0.004); osc(f * 4, t, dur * 0.4, 'sine', vol * 0.12, trem, 0.003); burst(t, 0.012, vol * 0.12, 'bandpass', 3000, 1);
      },
      marimba: (f, t, vol) => { osc(f, t, 0.5, 'sine', vol, out, 0.003); osc(f * 4, t, 0.09, 'sine', vol * 0.35, out, 0.002); osc(f * 10, t, 0.03, 'sine', vol * 0.1, out, 0.002); },
      weichbass: (f, t, dur, vol) => { osc(f, t, dur, 'sine', vol, bassBus, 0.02); osc(f * 2, t, dur * 0.7, 'triangle', vol * 0.18, bassBus, 0.02); },
      holzblock: (t, vol) => { burst(t, 0.05, vol * 3, 'bandpass', 1700, 9); osc(1200, t, 0.03, 'sine', vol * 0.6); },
      shaker: (t, vol) => burst(t, 0.07, vol * 2.2, 'highpass', 6500, 0.8),
      besen: (t, vol) => burst(t, 0.12, vol * 1.6, 'bandpass', 4000, 0.6),
      streicher: (fs, t, dur, vol) => { for (const f of fs) for (const dt of [-0.004, 0, 0.004]) { const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f * (1 + dt);
        gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.6); gn.gain.setValueAtTime(vol, t + dur - 0.2); gn.gain.linearRampToValueAtTime(0.0001, t + dur + 0.9);
        o.connect(gn).connect(padBus); o.start(t); o.stop(t + dur + 1); } },
    };
    const S = SETS[set];
    return {
      mel: (f, t, dur, vol) => V[S.mel](f, t, dur, vol),
      bass: (f, t, dur, vol) => V[S.bass](f, t, dur, vol),
      tick: (t, vol) => V[S.tick](t, vol),
      tree: (f, t, vol) => V.marimba(f, t, vol),
      harp: (f, t, vol) => V.harfe(f, t, 1.2, vol),
      pad: S.pad ? (fs, t, dur, vol) => V.streicher(fs, t, dur, vol) : () => {},
    };
  }
  // drei Klangsets zum Vergleichen (gleiche Noten); gewählt: Spieluhr (Nutzer 22.10.2026: „nur spieluhr, das klingt toll“) – im Spiel js/oper.js.
  // Bass überall weich (Sinus + Dreieck): ein gezupfter Kontrabass klang „knallig“ und „scheiße“, auch höher und leiser
  const SETS = {
    spieluhr: { name: 'Spieluhr & Streicher', mel: 'spieluhr', bass: 'weichbass',  tick: 'holzblock', pad: true },
    harfe:    { name: 'Harfe & Holz',         mel: 'harfe',    bass: 'weichbass',  tick: 'shaker',    pad: false },
    vibra:    { name: 'Vibraphon am Abend',   mel: 'vibra',    bass: 'weichbass',  tick: 'besen',     pad: true },
  };

  // alle Töne einplanen; liefert die Dauer
  function arrange(ctx, t0, stufe, set = 'spieluhr') {
    const { steps, first, last, bars } = score(), R = rig(ctx, set);
    // reines Meer am Rand: nur 4 Schläge vor/nach der Insel (Harfe in Stufe 3, sonst Stille)
    const from = Math.max(0, first - 4), to = Math.min(steps.length - 1, last + 4);
    for (let i = from; i <= to; i++) {
      const st = steps[i], k = i - from, t = t0 + k * STEP;
      if (i < first || i > last) { if (stufe >= 3) R.harp(hz(i < first ? 8 + (i - from) * 2 : 14 - (i - last) * 2), t, 0.07); continue; }
      const j = i - first, bar = bars[Math.floor(j / 8)], beat = j % 8, ch = Math.floor(j / 8) % 4;
      const M = bar.kind && MOTIF[bar.kind], off = M && M.n[beat];
      if (off != null && (st.n || (bar.kind === 'gruen' && st.baum))) {
        const p = ANCHOR[ch] + bar.shift + off;
        R.mel(hz(p), t, M.len, M.vol);
        if (bar.kind === 'fest' && beat === 0) R.mel(hz(p - 2), t + 0.01, 1.4, 0.07);                     // Fanfare: Terz darunter
        if (stufe >= 3 && st.lvl >= 5 && beat % 2 === 0) R.mel(hz(p + 5), t + STEP / 2, 0.35, 0.04);     // hohe Häuser funkeln
      }
      if (stufe >= 2 && beat === 0) R.bass(hz(BASS[ch], 65.41), t, STEP * 4.5, 0.3);
      if (stufe >= 2 && beat === 4) R.bass(hz(BASS[ch] + 3, 65.41), t, STEP * 4, 0.2);
      if (stufe >= 3 && beat === 0) R.pad(CHORD[ch].map(d => hz(d, 261.63)), t, STEP * 8, 0.012);
      if (stufe >= 2 && st.weg && beat % 2 === 0) R.tick(t, beat === 0 ? 0.035 : 0.025);
      if (stufe >= 3 && st.baum >= 2 && beat % 2 === 1) R.tree(hz(CHORD[ch][(beat >> 1) % 3], 130.81), t, Math.min(0.08, 0.03 + st.baum * 0.008));
    }
    // Schluss: Akkord
    const tEnd = t0 + (last + 1 - from) * STEP;
    for (const [d, v] of [[5, 0.12], [7, 0.08], [8, 0.07]]) R.mel(hz(d), tEnd, 2.2, v);
    if (stufe >= 2) R.bass(hz(0, 65.41), tEnd, 2.4, 0.3);
    if (stufe >= 3) R.pad([0, 2, 3].map(d => hz(d, 261.63)), tEnd, 2, 0.012);
    return { dur: (to - from + 1) * STEP + 3, from, steps };
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
  function play(stufe = 3, set = 'spieluhr') {
    stop();
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), t0 = ctx.currentTime + 0.3;
    run = { ctx }; const plan = arrange(ctx, t0, stufe, set); sweep(ctx, t0, plan);
    return `spielt ${plan.dur.toFixed(0)} s`;
  }

  // WAV zum Mitnehmen (16 Bit, Stereo)
  async function wav(stufe = 3, set = 'spieluhr') {
    const rate = 44100, probe = score(), n = probe.last - probe.first + 9;
    const ctx = new OfflineAudioContext(2, Math.ceil((n * STEP + 3.2) * rate), rate);
    arrange(ctx, 0.05, stufe, set);
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
