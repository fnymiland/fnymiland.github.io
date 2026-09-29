'use strict';
// ---------------------------------------------------------------------------
// Klänge (klein, synthetisch)
// ---------------------------------------------------------------------------
let actx = null;
function audio() {
  if (state.muted) return null;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  } catch (e) { return null; }
}
function tone(f, dur, type, vol, when = 0, slide = 0) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + when;
  const o = a.createOscillator(), gn = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  gn.gain.setValueAtTime(0.0001, t0);
  gn.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
const SFX = {
  build: () => { tone(330, 0.14, 'sine', 0.25, 0, 660); tone(880, 0.08, 'triangle', 0.06, 0.08); },
  road: () => tone(520, 0.06, 'triangle', 0.08, 0, 600),
  deco: () => { tone(784, 0.1, 'triangle', 0.12); tone(1175, 0.14, 'triangle', 0.1, 0.06); },
  dig: () => tone(180, 0.18, 'sine', 0.22, 0, 90),
  coin: () => { tone(988, 0.07, 'square', 0.04); tone(1319, 0.14, 'square', 0.04, 0.06); },
  error: () => tone(220, 0.16, 'sine', 0.14, 0, 170),
  buy: () => [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, i * 0.07)),
  research: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.16, 'sine', 0.14, i * 0.06)),
  star: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i === 4 ? 0.5 : 0.2, 'triangle', 0.15, i * 0.1)),
};
const sfx = k => { if (BATCH) return; try { SFX[k](); } catch (e) { /* ohne Ton weiter */ } };
