// Gemeinsame Test-Umgebung: stellt nach, was der Browser vor den Spiel-Skripten bereitstellt.
const fs = require('fs');
const path = require('path');

// <body> aus index.html einsetzen, damit alle getElementById-Aufrufe echte Elemente finden
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
document.body.innerHTML = body ? body[1].replace(/<script[\s\S]*?<\/script>/g, '') : '';

// jsdom kann kein Canvas: ein Zeichenkontext, der alles schluckt
const noop = () => {};
const STATE_PROPS = ['globalCompositeOperation', 'globalAlpha', 'fillStyle', 'strokeStyle', 'lineWidth'];
const stack = [];
const fakeCtx = new Proxy({ globalCompositeOperation: 'source-over', globalAlpha: 1 }, {
  get(target, prop) {
    if (prop in target) return target[prop];
    // save/restore wie im Browser (Mischart, Deckkraft, Farben), damit Tests den Zustand prüfen können
    if (prop === 'save') return () => stack.push(STATE_PROPS.map(k => target[k]));
    if (prop === 'restore') return () => { const s = stack.pop(); if (s) STATE_PROPS.forEach((k, i) => { target[k] = s[i]; }); };
    if (prop === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'createImageData') return (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop: noop });
    // wie im Browser: negativer Radius wirft (IndexSizeError) – im echten Spiel hält das alles an (blauer Bildschirm)
    const neg = (name, rs) => { if (rs.some(r => r < 0)) throw new Error(`${name}: negativer Radius ${rs.join(', ')}`); };
    if (prop === 'arc') return (x, y, r) => neg('arc', [r]);
    if (prop === 'ellipse') return (x, y, rx, ry) => neg('ellipse', [rx, ry]);
    return noop;
  },
  set(target, prop, value) { target[prop] = value; return true; },
});
HTMLCanvasElement.prototype.getContext = () => fakeCtx;

// Die Spielschleife läuft im Test nicht von selbst – Tests rufen gezielt Funktionen auf
globalThis.requestAnimationFrame = () => 0;

localStorage.clear();

// Zufall mit festem Startwert: neue Inseln (Lage der Sehenswürdigkeiten) sind in jedem Testlauf gleich
let seed = 12345;
Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
