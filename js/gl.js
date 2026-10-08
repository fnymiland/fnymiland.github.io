'use strict';
// ---------------------------------------------------------------------------
// WebGL weit weg (Block 144): Die Grafikkarte zeichnet die fertigen Bildchen (Boden, Gebäude, Dekos, Linien, Wald, Wellen) in einem
// Rutsch, statt dass der Browser sie einzeln einsetzt (Full HD, große Welt: 4.464 drawImage je Bild, ~30 ms → wenige ms).
// Aufbau: eine WebGL-Leinwand #world-gl UNTER der 2D-Leinwand #world. In einem GL-Bild ist #world durchsichtig; während des
// Welt-Durchgangs (GLPASS: Boden bis einschließlich der Felder-Schleife) wird jedes drawImage einer Leinwand auf ctx nicht
// gemalt, sondern als Rechteck aufgezeichnet (glRec) – in derselben Reihenfolge, also Maler-Prinzip wie bisher. Was dort live
// gezeichnet wird (Figuren, Züge, Schiffe, live Gebäude …), malt glLive in eine Sammelfläche (LA) und zeichnet es als Rechteck an
// derselben Stelle. Danach (Himmel, Symbole, Schilder …) malt alles wie bisher auf #world obendrauf.
// Rückfall: ohne WebGL2, mit ?gl=0, nach einem Fehler oder Kontextverlust zeichnet render wie bisher alles in 2D (deckend).
// Vorerst nur bei Tag, weit weg (nicht SPRITES_NEAR) und ohne Bau-Vorschau; sonst 2D.
// ---------------------------------------------------------------------------
const GL = { bgB: null, bg: false, sky: false, nightDone: false, now: 0, upMs: 0, texEpoch: 0, drawEpoch: 0, cacheMode: null, lastMiss: 0, ready: false, broken: false, gl: null, canvas: null, prog: null, buf: null, loc: null, texs: new Map(), recs: [],
  frame: false, shown: false, stats: { quads: 0, draws: 0, live: 0, over: 0, up: 0, miss: 0 } };
let GLPASS = false;                                             // gerade läuft der aufgezeichnete Welt-Durchgang
const GL_Q = new URLSearchParams(location.search).get('gl');
// eingeschaltet? ?gl=1 / ?gl=0, sonst gemerkte Wahl (Einstellungen), vorerst standardmäßig aus, bis es auf dem iPad gemessen ist
function glWanted() {
  if (GL_Q === '0') return false;
  if (GL_Q === '1') return true;
  try { return localStorage.getItem('kachelhausen_gl') !== '0'; } catch (e) { return true; }   // Standard an (Block 144); ☰ → Grafik schaltet aus
}
// Schalter im Menü (☰ → Grafik, nur dieses Gerät); ?gl=0/1 in der Adresse geht vor
function setGlWanted(on) {
  try { localStorage.setItem('kachelhausen_gl', on ? '1' : '0'); } catch (e) { /* privates Fenster */ }
  glTouch();
}
function glInit() {
  if (GL.ready || GL.broken) return GL.ready;
  if (typeof WebGL2RenderingContext === 'undefined') { GL.broken = true; return false; }   // Test (jsdom), alte Browser
  const c = document.getElementById('world-gl');
  if (!c) { GL.broken = true; return false; }
  let gl = null;
  try { gl = c.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: true }); } catch (e) { gl = null; }
  if (!(gl instanceof WebGL2RenderingContext)) { GL.broken = true; return false; }
  // Sammelbilder (Atlas): pg = Seite (−1: eigene Textur in tx), rc = eigener Bereich (Texturkoordinaten, je ½ Texel nach innen) –
  // dort wird geklemmt, sonst mischt das Glätten am Rand die Nachbarn im Atlas ein (drawImage klemmt am Bildrand genauso)
  const VS = `#version 300 es
  in vec2 p; in vec2 t; in float a; in vec2 cl; in float pg; in vec4 rc; in vec2 wv; uniform vec2 sz; uniform vec2 off; uniform float wt;
  out vec2 uv; out float al; out vec2 clip; flat out int page; out vec4 rect;
  void main() { uv = t; al = a; clip = cl + off.x; page = int(pg); rect = rc; vec2 q = p + off; q.x += sin(wt + wv.x) * wv.y; gl_Position = vec4(q.x / sz.x * 2.0 - 1.0, 1.0 - q.y / sz.y * 2.0, 0.0, 1.0); }`;
  const FS = `#version 300 es
  precision highp float;
  in vec2 uv; in float al; in vec2 clip; flat in int page; in vec4 rect;
  uniform sampler2D tx, a0, a1, a2, a3, a4, a5; uniform float nk;
  layout(location = 0) out vec4 o; layout(location = 1) out vec4 o1;
  void main() {
    if (gl_FragCoord.x < clip.x || gl_FragCoord.x > clip.y) discard;
    vec2 u = clamp(uv, rect.xy, rect.zw); vec4 c;
    if (page < 0) c = texture(tx, u); else if (page == 0) c = texture(a0, u); else if (page == 1) c = texture(a1, u); else if (page == 2) c = texture(a2, u);
    else if (page == 3) c = texture(a3, u); else if (page == 4) c = texture(a4, u); else c = texture(a5, u);
    // Nacht (Block 144): al < 0 = Loch stanzen (destination-out) mit −al · Nachtstärke nk. Mit derselben Mischung (ONE,
    // ONE_MINUS_SRC_ALPHA) wird o zur Farbe mit Löchern und o1.r zur echten Deckkraft (o.a stimmt nach Löchern nicht mehr)
    if (al < 0.0) { float e = c.a * -al * nk; o = vec4(0.0, 0.0, 0.0, e); o1 = vec4(0.0, 0.0, 0.0, e); }
    else { o = c * al; o1 = vec4(o.a, 0.0, 0.0, o.a); } }`;
  // Nacht zusammensetzen: Welt (Farbe w0, Deckkraft w1.r), darüber das Nachtblau wie source-atop
  const CVS = `#version 300 es
  void main() { vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0); gl_Position = vec4(p, 0.0, 1.0); }`;
  const CFS = `#version 300 es
  precision highp float;
  uniform sampler2D w0, w1; uniform vec4 tint; out vec4 o;
  void main() { ivec2 q = ivec2(gl_FragCoord.xy); vec4 c = texelFetch(w0, q, 0); float A = texelFetch(w1, q, 0).r;
    o = vec4(tint.rgb * tint.a * A + c.rgb * (1.0 - tint.a), A); }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  try {
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    GL.prog = pr; GL.buf = gl.createBuffer(); GL.sbuf = gl.createBuffer(); GL.lbuf = gl.createBuffer();
    const cp = gl.createProgram();
    gl.attachShader(cp, sh(gl.VERTEX_SHADER, CVS)); gl.attachShader(cp, sh(gl.FRAGMENT_SHADER, CFS)); gl.linkProgram(cp);
    if (!gl.getProgramParameter(cp, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(cp));
    GL.comp = { prog: cp, w0: gl.getUniformLocation(cp, 'w0'), w1: gl.getUniformLocation(cp, 'w1'), tint: gl.getUniformLocation(cp, 'tint') };
    GL.loc = { p: gl.getAttribLocation(pr, 'p'), t: gl.getAttribLocation(pr, 't'), a: gl.getAttribLocation(pr, 'a'), cl: gl.getAttribLocation(pr, 'cl'), pg: gl.getAttribLocation(pr, 'pg'), rc: gl.getAttribLocation(pr, 'rc'),
      w: gl.getAttribLocation(pr, 'wv'), wt: gl.getUniformLocation(pr, 'wt'), nk: gl.getUniformLocation(pr, 'nk'),
      sz: gl.getUniformLocation(pr, 'sz'), tx: gl.getUniformLocation(pr, 'tx'), off: gl.getUniformLocation(pr, 'off'), at: [0, 1, 2, 3, 4, 5].map(i => gl.getUniformLocation(pr, 'a' + i)) };
  } catch (e) { console.warn('WebGL', e); GL.broken = true; return false; }
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  c.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.ready = false; GL.fbo = null; GL.texs.clear(); atlReset(true); GLS.ok = false; glShow(false); });
  c.addEventListener('webglcontextrestored', () => { GL.broken = false; GL.gl = null; GL.texs.clear(); atlReset(true); glInit(); });
  ATL.size = Math.min(GL_LOWMEM ? 2048 : 4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));   // höchstens 6 Seiten: 96 MB (Safari) bzw. 384 MB
  GL.gl = gl; GL.canvas = c; GL.ready = true;
  return true;
}
function glShow(on) { if (GL.canvas && GL.shown !== on) { GL.canvas.style.visibility = on ? 'visible' : 'hidden'; GL.shown = on; } }
// Leinwand freigegeben (freeCanvas): Textur auch weg
function glForget(c) {
  const e = GL.texs.get(c), s = ATL.slots.get(c);
  if (s) { ATL.slots.delete(c); ATL.waste += s.w * s.h; }                // Platz im Atlas bleibt bis zum nächsten Aufräumen belegt
  if (e) { if (GL.gl) GL.gl.deleteTexture(e.tex); GL.texs.delete(c); }
  if ((e || s) && GLS.srcs.has(c)) GL.texEpoch++;                        // nur wenn das Standbild sie braucht
}
// --- Sammelbilder (Atlas, Block 144): alle Bildchen auf wenigen großen Texturen (Seiten), damit ein Standbild in EINEM Auftrag
// gezeichnet werden kann (vorher je Bildchen eine Textur: 2.000–4.000 Aufträge je Bild, auf einem i5 mehrere ms Rechenzeit).
// Regale (shelf): Zeilen nach der Höhe des ersten Bildchens; 2 Punkte Luft. Freigegebenes bleibt belegt (waste) – ist alles voll,
// wird der Atlas geleert (atlReset) und füllt sich mit dem, was gerade gebraucht wird, neu
const ATL = { size: 4096, pages: [], slots: new Map(), waste: 0, max: 6 };
function atlReset(lost) {
  if (!lost && GL.gl) for (const p of ATL.pages) GL.gl.deleteTexture(p.tex);
  ATL.pages = []; ATL.slots.clear(); ATL.waste = 0; GL.texEpoch++;
}
function atlNewPage() {
  const gl = GL.gl, tex = gl.createTexture(), S = ATL.size;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, S, S);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const p = { tex, x: 0, y: 0, row: 0 };
  ATL.pages.push(p);
  return p;
}
// Platz für Leinwand c (einmal hochladen); null: passt nicht (zu groß, Atlas voll) → eigene Textur
// Vorab hochladen (Block 144): fertige Bildchen gleich nach dem Malen/Zuschneiden in die Sammelbilder, je Bild nur ein paar ms
// (glEnd). Vorher kamen nach dem Zoomen beim Tausch der scharfen Bildchen bis zu 500 auf einmal – Safari liest jedes zurück, das ruckelte
const GL_WARM = new Set();
function glWarm(c) { if (GL.ready && c && c.width) GL_WARM.add(c); }
function glWarmStep() {
  if (!GL_WARM.size) return;
  const t0 = performance.now(), lim = GL_LOWMEM ? 3 : 2;
  for (const c of GL_WARM) {
    GL_WARM.delete(c);
    if (c.width && !ATL.slots.has(c) && !atlPut(c)) { GL_WARM.clear(); break; }   // Sammelbilder voll: lassen (glVerts entscheidet)
    if (performance.now() - t0 > lim) break;
  }
}
function atlPut(c) {
  const s = ATL.slots.get(c);
  if (s && s.w === c.width && s.h === c.height) return s;
  const w = c.width, h = c.height, S = ATL.size;
  if (!w || !h || w > S / 2 || h > S / 2) return null;
  let p = ATL.pages[ATL.pages.length - 1], pi = ATL.pages.length - 1;
  const fits = q => (q.x + w + 2 <= S ? q.y : q.y + q.row) + h + 2 <= S;
  if (!p || !fits(p)) {
    if (ATL.pages.length >= ATL.max) return null;
    p = atlNewPage(); pi = ATL.pages.length - 1;
  }
  if (p.x + w + 2 > S) { p.x = 0; p.y += p.row; p.row = 0; }
  const slot = { page: pi, x: p.x + 1, y: p.y + 1, w, h };
  p.x += w + 2; p.row = Math.max(p.row, h + 2);
  const gl = GL.gl;
  gl.bindTexture(gl.TEXTURE_2D, p.tex);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, slot.x, slot.y, gl.RGBA, gl.UNSIGNED_BYTE, c);
  GL.stats.up++;
  ATL.slots.set(c, slot);
  return slot;
}

// --- Aufzeichnen (ctx.drawImage während GLPASS) ---
const C2D = typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D.prototype : {};   // im Test (jsdom) gibt es keins – dort ist GL ohnehin aus
let glClip = null, glClipStack = [], glPathRect = null;           // Streifen großer Gebäude: senkrechter Ausschnitt [x0, x1] in Gerätepunkten
const GL_NOCLIP = [-1e9, 1e9];
function glRec(src, sx, sy, sw, sh, m, alpha, clip, nearest) {
  const x0 = m.e, y0 = m.f;                                       // Ecke (0,0) des Zielrechtecks steckt in m (siehe glDrawImage)
  GL.recs.push({ src, sx, sy, sw, sh, m, alpha, clip: clip || GL_NOCLIP, nearest: !!nearest, x0, y0 });
}
// ersetzt ctx.drawImage während GLPASS: Leinwände werden aufgezeichnet, alles andere wie gehabt
function glDrawImage(img, ...a) {
  const out = ctx.globalCompositeOperation === 'destination-out';      // Nacht: Loch stanzen (Löschbild, Lichtmaske)
  if (!GLPASS || !(img instanceof HTMLCanvasElement) || !img.width || !img.height || glClip === 'x' || (ctx.globalCompositeOperation !== 'source-over' && !out)) {
    if (GLPASS) { GL.stats.miss++; GLS.dirty = true; GLS.dirtyWhy = 'kein Bildchen'; }
    if (GL.bg) return;                                                    // Hintergrund: nicht ins Bild
    return C2D.drawImage.call(ctx, img, ...a);
  }
  let sx = 0, sy = 0, sw = img.width, sh = img.height, dx, dy, dw, dh;
  if (a.length === 2) { [dx, dy] = a; dw = sw; dh = sh; } else if (a.length === 4) [dx, dy, dw, dh] = a; else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
  const t = ctx.getTransform();
  // Abbildung Quelle → Gerät: Ziel (dx, dy, dw, dh) unter der Transformation; als affine Matrix der Einheitsfläche
  const m = { a: t.a * dw, b: t.b * dw, c: t.c * dh, d: t.d * dh, e: t.a * dx + t.c * dy + t.e, f: t.b * dx + t.d * dy + t.f };
  if (out) { const k = nightK(); if (k > 0) glRec(img, sx, sy, sw, sh, m, -ctx.globalAlpha / k, glClip, false); return; }   // Stärke ∝ Nacht: im Shader (nk)
  glRec(img, sx, sy, sw, sh, m, ctx.globalAlpha, glClip, ctx.imageSmoothingEnabled === false);
}
// zeichnet g gerade in die Welt des GL-Bilds (nicht in ein Bildchen, das nebenbei entsteht)?
function glOnWorld() { return GLPASS && (g === ctx || (!!LA.x && g === LA.x)); }
// Nachtstärke 0 … 1 (alle Löcher sind proportional dazu: punchGlow, Löschbild, Lichtmaske) – im Standbild als Uniform nk
function nightK() { return Math.min(1, night / NIGHT_MAX); }
// Loch stanzen (punchGlow im GL-Bild): Bildchen (weicher Schein) bzw. Fensterfläche q (Parallelogramm) in Bildschirmpunkten;
// a relativ zur Nachtstärke. In einer Sammelflächen-Zelle (glLive) erst nach deren Rechteck (glLive sortiert nach)
function glOut(src, x, y, w, h, a) {
  glRec(src, 0, 0, src.width, src.height, { a: w * DPR, b: 0, c: 0, d: h * DPR, e: x * DPR, f: y * DPR }, -a, Array.isArray(glClip) ? glClip : null, false);
}
function glOutQuad(q, a) {
  const [p0, p1, , p3] = q;
  glRec(glSolid('#000'), 0, 0, 4, 4, { a: (p1[0] - p0[0]) * DPR, b: (p1[1] - p0[1]) * DPR, c: (p3[0] - p0[0]) * DPR, d: (p3[1] - p0[1]) * DPR, e: p0[0] * DPR, f: p0[1] * DPR }, -a, Array.isArray(glClip) ? glClip : null, false);
}
// einfarbige Fläche bzw. runder Fleck als Bildchen (Nachtlicht, Löcher)
const GL_SOLID = new Map();
function glSolid(col, disc = false) {
  const k = col + (disc ? 'o' : ''); let c = GL_SOLID.get(k);
  if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = disc ? 64 : 4;
  const x = c.getContext('2d');
  if (x) { x.fillStyle = col; if (disc) { x.beginPath(); x.arc(32, 32, 32, 0, Math.PI * 2); x.fill(); } else x.fillRect(0, 0, 4, 4); }
  GL_SOLID.set(k, c);
  return c;
}
function glSave() { glClipStack.push(glClip); return C2D.save.call(ctx); }
function glRestore() { glClip = glClipStack.length ? glClipStack.pop() : null; return C2D.restore.call(ctx); }
function glBeginPath() { glPathRect = null; return C2D.beginPath.call(ctx); }
function glRect(x, y, w, h) {
  const t = ctx.getTransform();
  glPathRect = glPathRect === null && !t.b && !t.c ? [t.a * x + t.e, t.a * (x + w) + t.e] : 'x';
  return C2D.rect.call(ctx, x, y, w, h);
}
function glClipFn(...a) {
  const r = glPathRect;
  if (!Array.isArray(r) || a.length) glClip = 'x';                 // anderer Ausschnitt: dann wird eben in 2D gezeichnet (obendrauf)
  else if (glClip !== 'x') { const lo = Math.min(r[0], r[1]), hi = Math.max(r[0], r[1]); glClip = glClip ? [Math.max(glClip[0], lo), Math.min(glClip[1], hi)] : [lo, hi]; }
  return C2D.clip.apply(ctx, a);
}
const GL_HOOKS = { drawImage: glDrawImage, save: glSave, restore: glRestore, beginPath: glBeginPath, rect: glRect, clip: glClipFn };
// Standbild im Hintergrund: was direkt auf die Leinwand malen würde, malt nichts (sonst stünde es im Bild) – das Feld bleibt lebendig
function glBgFill() { GLS.dirty = true; if (MESS && !GLS.dirtyWhy) GLS.dirtyWhy = '2D'; }
const GL_BG_HOOKS = { fill: glBgFill, stroke: glBgFill, fillRect: glBgFill, strokeRect: glBgFill, fillText: glBgFill, strokeText: glBgFill, putImageData: glBgFill, clearRect: glBgFill };
function glHook(on, bg = false) {
  for (const [k, f] of Object.entries(GL_HOOKS)) { if (on) ctx[k] = f; else delete ctx[k]; }
  for (const [k, f] of Object.entries(GL_BG_HOOKS)) { if (on && bg) ctx[k] = f; else delete ctx[k]; }
}

// --- Sammelfläche für Live-Gezeichnetes (je Bild neu) ---
// Höhe wächst/schrumpft mit dem Bedarf (256 … 4096, 1024 breit): Safari liest beim Hochladen die GANZE Leinwand zurück, egal wie viel
// benutzt ist – bei 2048² waren das auf dem iPad 14 ms je Bild für 70 benutzte Zeilen
// Safari zusätzlich im Arbeitsspeicher (willReadFrequently): dann muss es nichts von der Grafikkarte zurücklesen und lädt nur die
// benutzten Zeilen hoch. ?la=cpu / ?la=gpu zum Vergleichen
const GL_SAFARI = /^((?!chrome|android|crios|fxios).)*safari/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
const LA_CPU = (() => { const q = new URLSearchParams(location.search).get('la'); return q ? q === 'cpu' : GL_SAFARI; })();
// wenig Speicher (Safari, v. a. iPad: Tab stürzt sonst ab – „wiederholt ein Fehler aufgetreten“): Sammelbilder kleiner und früher
// aufräumen. ?glmem=low / ?glmem=hi zum Testen
const GL_LOWMEM = (() => { const q = new URLSearchParams(location.search).get('glmem'); return q ? q === 'low' : GL_SAFARI; })();
const LA = { c: null, x: null, w: 1024, h: 256, cx: 0, cy: 0, row: 0, used: 0, off: [0, 0], need: 0, peak: 0, calm: 0 };
function laInit() {
  if (LA.c) return !!LA.x;
  LA.c = document.createElement('canvas'); LA.c.width = LA.w; LA.c.height = LA.h;
  LA.x = LA.c.getContext('2d', LA_CPU ? { willReadFrequently: true } : undefined);
  if (!LA.x) return false;
  // Zeichencode setzt manchmal Bildschirm-Transformationen (setTransform(DPR,…)): in der Sammelfläche um die Zelle verschieben
  const st = C2D.setTransform, gt = C2D.getTransform;
  LA.x.setTransform = function (a, b, c, d, e, f) {
    if (typeof a === 'object' && a) ({ a, b, c, d, e, f } = a);
    if (a === undefined) return st.call(this);
    return st.call(this, a, b, c, d, e + LA.off[0], f + LA.off[1]);
  };
  LA.x.resetTransform = function () { return st.call(this, 1, 0, 0, 1, LA.off[0], LA.off[1]); };
  LA.x.getTransform = function () { const m = gt.call(this); m.e -= LA.off[0]; m.f -= LA.off[1]; return m; };
  return true;
}
function laReset() {
  if (LA.c) {                                                           // Größe nach Bedarf: zu klein → sofort größer, lange viel Luft → kleiner
    let h = LA.h;
    if (LA.need > h) while (h < LA.need && h < (ATL.size || 2048)) h *= 2;
    else { LA.peak = Math.max(LA.peak, LA.used); if (++LA.calm > 600) { if (LA.peak < h / 2 && h > 256) h /= 2; LA.peak = 0; LA.calm = 0; } }
    if (h !== LA.h) { LA.h = h; LA.c.height = h; LA.used = 0; LA.peak = 0; LA.calm = 0; }   // neue Höhe: Leinwand leer, Textur neu (glTex)
    LA.need = 0;
  }
  if (LA.used && LA.x) { C2D.setTransform.call(LA.x, 1, 0, 0, 1, 0, 0); LA.x.clearRect(0, 0, LA.w, Math.min(LA.h, LA.used)); }
  LA.cx = 0; LA.cy = 0; LA.row = 0; LA.used = 0;
}
function laAlloc(w, h) {
  w = Math.ceil(w) + 2; h = Math.ceil(h) + 2;
  if (w > LA.w || h > (ATL.size || 2048)) return null;
  if (h > LA.h) { LA.need = Math.max(LA.need, LA.cy + LA.row + h); return null; }
  if (LA.cx + w > LA.w) { LA.cx = 0; LA.cy += LA.row; LA.row = 0; }
  if (LA.cy + h > LA.h) { LA.need = Math.max(LA.need, LA.cy + h); return null; }   // nächstes Bild größer (diesmal obendrauf in 2D)
  const r = { x: LA.cx + 1, y: LA.cy + 1 };
  LA.cx += w; LA.row = Math.max(LA.row, h); LA.used = Math.max(LA.used, LA.cy + h);
  return r;
}
// fn live zeichnen; im GL-Bild in eine Zelle der Sammelfläche (Rahmen in Bildschirmpunkten um (x, y): links, oben, rechts, unten)
function glLive(x, y, l, u, r, d, fn) {
  if (!GLPASS) return fn();
  const bx0 = Math.floor((x - l) * DPR), by0 = Math.floor((y - u) * DPR), bw = Math.ceil((x + r) * DPR) - bx0, bh = Math.ceil((y + d) * DPR) - by0;
  if (bx0 > W * DPR || by0 > H * DPR || bx0 + bw < 0 || by0 + bh < 0) return;   // ganz außerhalb (W/H: beim Aufzeichnen mit Rand)
  GLS.dirty = true;                                                     // dieses Feld ist „lebendig“ (Standbild: jedes Bild neu)
  if (MESS && !GLS.dirtyWhy) GLS.dirtyWhy = 'bewegt sich';
  if (GL.bg) return;                                                    // Hintergrund: gemalt wird es beim Abspielen
  const cell = laInit() && laAlloc(bw, bh);
  if (!cell) { GL.stats.over++; return fn(); }                    // voll: diesmal obendrauf (2D)
  const prev = g, X = LA.x;
  LA.off = [cell.x - bx0, cell.y - by0];
  C2D.save.call(X);
  C2D.setTransform.call(X, 1, 0, 0, 1, 0, 0);
  X.beginPath(); X.rect(cell.x, cell.y, bw, bh); X.clip();
  X.setTransform(DPR, 0, 0, DPR, 0, 0);                            // Bildschirmpunkte → Zelle
  X.globalAlpha = ctx.globalAlpha;
  g = X;
  const r0 = GL.recs.length;
  try { fn(); } finally { C2D.restore.call(X); g = prev; LA.off = [0, 0]; }
  GL.stats.live++;
  const holes = GL.recs.length > r0 ? GL.recs.splice(r0) : null;        // Löcher, die fn gestanzt hat: erst nach dem Gemalten (wie 2D)
  glRec(LA.c, cell.x, cell.y, bw, bh, { a: bw, b: 0, c: 0, d: bh, e: bx0, f: by0 }, 1, glClip, false);
  if (holes) for (const r of holes) GL.recs.push(r);
}

// --- Bild ---
// Darf dieses Bild über die Grafikkarte? (render, nach SPRITES_ON)
function glFrameOk(z) {
  // Grund fürs Messen (?messen): warum gerade (nicht) per Grafikkarte
  GL.why = GL.off || !glWanted() ? 'aus (☰ → Grafik)' : !SPRITES_ON ? 'nah dran (2D)' : SPRITES_NEAR ? 'Zoom ≥ 1 (2D)' : spriteForce === false ? 'Messwerkzeug (2D)'
    : tool !== 'look' || moving || plan ? 'Werkzeug gewählt (2D)' : !glInit() ? 'kein WebGL2 im Browser (2D)' : '';
  return !GL.why;
}
function glBegin() {
  const gl = GL.gl, c = GL.canvas;
  if (c.width !== canvas.width || c.height !== canvas.height) { c.width = canvas.width; c.height = canvas.height; }
  GL.recs.length = 0; glClip = null; glClipStack.length = 0; glPathRect = null;
  for (const k in GL.stats) GL.stats[k] = 0;
  laReset();
  glHook(true); GLPASS = true; GL.frame = true;
}
function glTex(src, nearest) {
  const gl = GL.gl;
  let e = GL.texs.get(src);
  if (e && e.w === src.width && e.h === src.height && src !== LA.c) return e;
  if (!e) { e = { tex: gl.createTexture(), w: 0, h: 0 }; GL.texs.set(src, e); }
  gl.bindTexture(gl.TEXTURE_2D, e.tex);
  const f = nearest ? gl.NEAREST : gl.LINEAR;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (src === LA.c && e.w === src.width && e.h === src.height) {
    // Sammelfläche: jedes Bild neu, aber nur die benutzten Zeilen (vorher immer 2048² = 16 MB je Bild)
    if (LA.used) { const t0 = MESS ? performance.now() : 0; gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, src.width, Math.min(src.height, Math.ceil(LA.used)), gl.RGBA, gl.UNSIGNED_BYTE, src); if (MESS) GL.upMs = performance.now() - t0; }
  } else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  e.w = src.width; e.h = src.height;
  GL.stats.up++;
  return e;
}
// Rechtecke → Eckpunkte (6 je Rechteck: Position in Gerätepunkten, Texturkoordinate, Deckkraft, Ausschnitt x0/x1, Seite, Bereich).
// Legt dabei neue Bildchen in den Atlas (r.pg = Seite oder −1 = eigene Textur: Sammelfläche, Wellen, Tiefe, was nicht passt)
const GL_F = 14;                                                        // … dazu Wellen-Phase und -Ausschlag (Shader schaukelt)
function glVerts(recs) {
  const data = new Float32Array(recs.length * 6 * GL_F), S = ATL.size;
  let o = 0;
  for (const r of recs) {
    const { m, sx, sy, sw, sh, src } = r;
    const slot = src === LA.c || src === GL_WAVE.c || r.nearest || !src.width ? null : atlPut(src);
    let u0, v0, u1, v1, k0, k1, k2, k3, pg;
    if (slot) {
      pg = slot.page; u0 = (slot.x + sx) / S; v0 = (slot.y + sy) / S; u1 = (slot.x + sx + sw) / S; v1 = (slot.y + sy + sh) / S;
    } else {
      const W0 = src.width || 1, H0 = src.height || 1;
      pg = -1; u0 = sx / W0; v0 = sy / H0; u1 = (sx + sw) / W0; v1 = (sy + sh) / H0;
    }
    const tw = slot ? S : src.width || 1, th = slot ? S : src.height || 1;
    k0 = u0 + 0.5 / tw; k1 = v0 + 0.5 / th; k2 = u1 - 0.5 / tw; k3 = v1 - 0.5 / th;   // ½ Texel nach innen klemmen
    r.pg = pg;
    const ax = m.e, ay = m.f, bx = m.a + m.e, by = m.b + m.f, cx = m.c + m.e, cy = m.d + m.f, dx = m.a + m.c + m.e, dy = m.b + m.d + m.f;
    const al = r.alpha, c0 = r.clip[0], c1 = r.clip[1];
    const wp = r.wph || 0, wa = r.wamp || 0;
    const V = (px, py, tu, tv) => {                                      // ohne Hilfslisten
      data[o] = px; data[o + 1] = py; data[o + 2] = tu; data[o + 3] = tv; data[o + 4] = al; data[o + 5] = c0; data[o + 6] = c1;
      data[o + 7] = pg; data[o + 8] = k0; data[o + 9] = k1; data[o + 10] = k2; data[o + 11] = k3; data[o + 12] = wp; data[o + 13] = wa; o += GL_F;
    };
    V(ax, ay, u0, v0); V(bx, by, u1, v0); V(cx, cy, u0, v1); V(cx, cy, u0, v1); V(bx, by, u1, v0); V(dx, dy, u1, v1);
  }
  return data;
}
function glAttribs(buf) {
  const gl = GL.gl, L = GL.loc, S = GL_F * 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(L.p); gl.vertexAttribPointer(L.p, 2, gl.FLOAT, false, S, 0);
  gl.enableVertexAttribArray(L.t); gl.vertexAttribPointer(L.t, 2, gl.FLOAT, false, S, 8);
  gl.enableVertexAttribArray(L.a); gl.vertexAttribPointer(L.a, 1, gl.FLOAT, false, S, 16);
  gl.enableVertexAttribArray(L.cl); gl.vertexAttribPointer(L.cl, 2, gl.FLOAT, false, S, 20);
  gl.enableVertexAttribArray(L.pg); gl.vertexAttribPointer(L.pg, 1, gl.FLOAT, false, S, 28);
  gl.enableVertexAttribArray(L.rc); gl.vertexAttribPointer(L.rc, 4, gl.FLOAT, false, S, 32);
  gl.enableVertexAttribArray(L.w); gl.vertexAttribPointer(L.w, 2, gl.FLOAT, false, S, 48);
}
// Atlas-Seiten an die Einheiten 1 … 6 binden (einmal je Bild)
function atlBind() {
  const gl = GL.gl;
  for (let i = 0; i < 6; i++) { gl.activeTexture(gl.TEXTURE1 + i); gl.bindTexture(gl.TEXTURE_2D, ATL.pages[i] ? ATL.pages[i].tex : null); gl.uniform1i(GL.loc.at[i], 1 + i); }
  gl.activeTexture(gl.TEXTURE0); gl.uniform1i(GL.loc.tx, 0);
}
// Rechtecke a … b−1 aus dem gebundenen Puffer zeichnen: alles aus dem Atlas am Stück, eigene Texturen je gleiche Textur
function glDrawRange(recs, a, b) {
  const gl = GL.gl;
  let i = a;
  while (i < b) {
    const r0 = recs[i]; let j = i + 1;
    if (r0.pg >= 0) { while (j < b && recs[j].pg >= 0) j++; gl.drawArrays(gl.TRIANGLES, i * 6, (j - i) * 6); GL.stats.draws++; i = j; continue; }
    const src = r0.src;
    while (j < b && recs[j].pg < 0 && recs[j].src === src) j++;
    const e = src === LA.c ? GL.texs.get(LA.c) : src.width ? glTex(src, r0.nearest) : null;   // inzwischen freigegeben: auslassen
    if (e) { gl.bindTexture(gl.TEXTURE_2D, e.tex); gl.drawArrays(gl.TRIANGLES, i * 6, (j - i) * 6); GL.stats.draws++; }
    i = j;
  }
}
// Ende des Welt-Durchgangs: alles Aufgezeichnete zeichnen (Standbild: gemerkte Rechtecke verschoben + was dieses Bild neu kam)
function glEnd() {
  glHook(false); GLPASS = false;
  const gl = GL.gl, recs = GL.recs, n = recs.length, mode = GL.cacheMode;
  GL.lastMiss = GL.stats.miss + GL.stats.over;
  if (mode === 'rec') { W = GLS.W0; H = GLS.H0; }                      // Rand fürs Aufzeichnen wieder weg (Schilder & Co. in echter Größe)
  try {
    const CW = GL.canvas.width, CH = GL.canvas.height, dark = night > 0;
    // Nacht (Block 144): Welt mit Löchern ins Zwischenbild, dann Nachtblau (source-atop) und die Lichtschicht dahinter
    // (destination-over) – wie drawNight. Lichter dieses Bilds hinten an die Rechtecke (gleicher Puffer)
    const dyn = dark ? glDynLights(mode) : null;
    let screen0 = 0;
    if (dyn) {
      for (const r of dyn.recs) recs.push(r);
      screen0 = recs.length;
      const full = c => recs.push({ src: glSolid(c), sx: 0, sy: 0, sw: 4, sh: 4, m: { a: CW, b: 0, c: 0, d: CH, e: 0, f: 0 }, alpha: 1, clip: GL_NOCLIP, nearest: false });
      if (mode === 'play' ? dyn.warm || (GLS.light && GLS.light.warm) : nightWarm) full('rgb(255,205,100)');   // übrige Löcher aus warmen Nachtbildern
      full('#2a3f66');                                                     // Sicherheitsnetz: nie durchsichtig
    }
    gl.viewport(0, 0, CW, CH);
    if (dark) {
      const F = glFbo(CW, CH);
      gl.bindFramebuffer(gl.FRAMEBUFFER, F.fb);
      gl.clearBufferfv(gl.COLOR, 0, [0x6f / 255, 0xcb / 255, 0xe2 / 255, 1]); gl.clearBufferfv(gl.COLOR, 1, [1, 0, 0, 1]);
    } else { gl.clearColor(0x6f / 255, 0xcb / 255, 0xe2 / 255, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    gl.useProgram(GL.prog);
    gl.uniform2f(GL.loc.sz, CW, CH); gl.uniform1i(GL.loc.tx, 0); gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(GL.loc.wt, (GL.now / 900) % (2 * Math.PI));                // Wellen schaukeln wie drawWave (sin(now/900 + Phase))
    gl.uniform1f(GL.loc.nk, nightK());                                       // Stärke der Löcher (Dämmerung: schwächer)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);       // source-over, vormultipliziert
    if (LA.used) glTex(LA.c, false);                                       // Sammelfläche einmal je Bild hochladen
    glWarmStep();
    const verts = glVerts(recs);                                           // legt Neues in den Atlas
    gl.bindBuffer(gl.ARRAY_BUFFER, GL.buf); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
    atlBind();
    let off = [0, 0], dOff = 0;                                              // Standbild-Verschiebung; Neues beim Aufnehmen mit Rand
    if (mode === 'play') {
      off = glPlayOff();
      for (const op of GLS.ops) {
        if (op[0] === 's') { if (op[2] > op[1]) { glAttribs(GL.sbuf); gl.uniform2f(GL.loc.off, off[0], off[1]); glDrawRange(GLS.recs, op[1], op[2]); } }
        else if (op[2] > op[1]) { glAttribs(GL.buf); gl.uniform2f(GL.loc.off, 0, 0); glDrawRange(recs, op[1], op[2]); }
      }
      if (n > GLS.tail) { glAttribs(GL.buf); gl.uniform2f(GL.loc.off, 0, 0); glDrawRange(recs, GLS.tail, n); }
      GL.stats.quads = n + GLS.recs.length;
    } else {
      dOff = mode === 'rec' ? -GLS.M * DPR : 0;
      glAttribs(GL.buf);
      gl.uniform2f(GL.loc.off, dOff, dOff);
      glDrawRange(recs, 0, n);
      GL.stats.quads = n;
      if (mode === 'rec') { glRecFinish(); off = [dOff, dOff]; }
    }
    GL.nightDone = false;
    if (dark) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const C = GL.comp, F = GL.fbo;
      gl.disable(gl.BLEND);
      gl.useProgram(C.prog);
      gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, F.t0); gl.uniform1i(C.w0, 7);
      gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, F.t1); gl.uniform1i(C.w1, 8);
      gl.uniform4f(C.tint, 25 / 255, 35 / 255, 85 / 255, night);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE0);
      // Lichtschicht hinter die Welt: destination-over
      gl.useProgram(GL.prog);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE_MINUS_DST_ALPHA, gl.ONE);
      const L = mode !== null && GLS.light ? GLS.light : null;
      for (let k = 0; k < 4; k++) {
        if (L && L.ph[k + 1] > L.ph[k]) { glAttribs(GL.lbuf); gl.uniform2f(GL.loc.off, off[0], off[1]); glDrawRange(L.recs, L.ph[k], L.ph[k + 1]); }
        if (dyn.ph[k + 1] > dyn.ph[k]) { glAttribs(GL.buf); gl.uniform2f(GL.loc.off, dOff, dOff); glDrawRange(recs, n + dyn.ph[k], n + dyn.ph[k + 1]); }
      }
      glAttribs(GL.buf); gl.uniform2f(GL.loc.off, 0, 0); glDrawRange(recs, screen0, recs.length);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      GL.nightDone = true;
      if (MESS) MESS.lights = dyn.n + (L ? L.n : 0);
    }
    glShow(true);
  } catch (e) { console.warn('WebGL', e); GL.broken = true; GL.ready = false; GL.nightDone = false; glShow(false); }
  GL.frame = false;
}
// 2D-Bild: GL-Leinwand verstecken (die deckende 2D-Leinwand liegt ohnehin darüber)
function glIdle() { if (GL.shown) glShow(false); GL.nightDone = false; }
// Lichtschicht der Nacht als Rechtecke (dieselbe Reihenfolge wie drawNight, nightLights in render.js), in Phasen: 0 Fenster,
// 1 warme Scheiben neben Blau, 2 Schein, 3 Lichtbilder – Standbild und lebendige Felder werden Phase für Phase zusammengelegt
function glNightRecs(lights, pics, panes, warm) {
  const P = [[], [], [], []], D = DPR;
  const rect = (k, c, x, y, w, h) => P[k].push({ src: c, sx: 0, sy: 0, sw: c.width, sh: c.height, m: { a: w * D, b: 0, c: 0, d: h * D, e: x * D, f: y * D }, alpha: 1, clip: GL_NOCLIP, nearest: false });
  nightLights(lights, pics, panes, warm, {
    win: q => { const [p0, p1, , p3] = q, c = glSolid('#ffd873');
      P[0].push({ src: c, sx: 0, sy: 0, sw: 4, sh: 4, m: { a: (p1[0] - p0[0]) * D, b: (p1[1] - p0[1]) * D, c: (p3[0] - p0[0]) * D, d: (p3[1] - p0[1]) * D, e: p0[0] * D, f: p0[1] * D }, alpha: 1, clip: GL_NOCLIP, nearest: false }); },
    pre: (c, x, y, w, h) => rect(1, c, x, y, w, h),
    square: (x, y, sz, f) => rect(2, glSolid(f), x, y, sz, sz),
    disc: (x, y, r, f) => rect(2, glSolid(f, true), x - r, y - r, 2 * r, 2 * r),
    pic: (c, x, y, w, h) => rect(3, c, x, y, w, h),
  });
  const recs = [], ph = [];
  for (const l of P) { ph.push(recs.length); for (const r of l) recs.push(r); }
  ph.push(recs.length);
  return { recs, ph, warm, n: lights.length };
}
// Nacht-Zwischenbild: Farbe (0) und echte Deckkraft (1) – in Bildschirmgröße, bei Größenwechsel neu
function glFbo(w, h) {
  const gl = GL.gl; let F = GL.fbo;
  if (F && F.w === w && F.h === h) return F;
  if (!F) F = GL.fbo = { fb: gl.createFramebuffer(), t0: gl.createTexture(), t1: gl.createTexture(), w: 0, h: 0 };
  for (const t of [F.t0, F.t1]) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, F.fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, F.t0, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, F.t1, 0);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!ok) throw new Error('Nacht-Zwischenbild nicht möglich');
  F.w = w; F.h = h;
  return F;
}
// Lichter dieses Bilds, die nicht im Standbild stehen: beim Abspielen alle (nur lebendige Felder und Bewegtes liefen), beim
// Aufnehmen alle außer Boden und ruhenden Feldern, ohne Standbild alle
function glDynLights(mode) {
  if (mode !== 'rec') return glNightRecs(nightDedup(glows), nightPics, nightPanes, nightWarm);
  const G = GLS.gl0, mark = [new Uint8Array(glows.length), new Uint8Array(nightPics.length), new Uint8Array(nightPanes.length)];
  mark[0].fill(1, 0, G[0]); mark[1].fill(1, 0, G[1]); mark[2].fill(1, 0, G[2]);
  let warm = false;
  for (const c of GLS.tiles) { if (c.dyn) { warm = warm || c.warm; continue; } mark[0].fill(1, c.g0, c.g1); mark[1].fill(1, c.p0, c.p1); mark[2].fill(1, c.n0, c.n1); }
  return glNightRecs(nightDedup(glows.filter((_, i) => !mark[0][i])), nightPics.filter((_, i) => !mark[1][i]), nightPanes.filter((_, i) => !mark[2][i]), warm);
}
// Wellen (Block 144): alle haben dieselbe Form – ein Bildchen je Zoom, je Welle ein Rechteck (live waren es Striche im Bild obendrauf)
const GL_WAVE = { c: null, k: '' };
function glWaves(list, z, now) {
  const col = C('#c4f0f8'), k = (z * DPR).toFixed(4) + col, lw = 1.6 * z, hx = 5 * z + lw, hy0 = 1.25 * z + lw, hy1 = lw;
  if (GL_WAVE.k !== k) {
    if (GL_WAVE.c) { glForget(GL_WAVE.c); freeCanvas(GL_WAVE.c); }
    const c = document.createElement('canvas'), w = Math.ceil(2 * hx * DPR) + 4, h = Math.ceil((hy0 + hy1) * DPR) + 4, x = c.getContext('2d');
    c.width = w; c.height = h;
    if (!x) return false;
    x.setTransform(DPR, 0, 0, DPR, 2 + hx * DPR, 2 + hy0 * DPR);        // Ursprung = Wellenmitte (wx, wy)
    x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-5 * z, 0); x.quadraticCurveTo(0, -2.5 * z, 5 * z, 0); x.stroke();
    GL_WAVE.c = c; GL_WAVE.k = k; GL_WAVE.ox = 2 + hx * DPR; GL_WAVE.oy = 2 + hy0 * DPR;
  }
  const c = GL_WAVE.c, w = c.width, h = c.height, off = DEPTH * z * 0.7, amp = 5 * z * DPR;
  // Grundposition ohne Schaukeln; das macht der Shader (sin(wt + Phase) · Ausschlag) – so können Wellen im Standbild stehen
  for (let i = 0; i < list.length; i += 2) {
    const x = list[i], y = list[i + 1], p = toScreen(x, y), wx = p.x * DPR, wy = (p.y + off + (hash(x, y, 11) - 0.5) * 10 * z) * DPR;   // wie drawWave
    glRec(c, 0, 0, w, h, { a: w, b: 0, c: 0, d: h, e: wx - GL_WAVE.ox, f: wy - GL_WAVE.oy }, 1, glClip, false);
    const r = GL.recs[GL.recs.length - 1]; r.wph = (hash(x, y, 10) * 20) % (2 * Math.PI); r.wamp = amp;
  }
  return true;
}
// Rahmen um Bewegtes (Bildschirmpunkte: links, oben, rechts, unten) – großzügig, was hinausragt, würde abgeschnitten
function glMoverBox(m, z) {
  if (m.ship || m.boat || m.cargo || m.fish) return [110 * z, 130 * z, 110 * z, 50 * z];
  if (m.train || m.coaster || !m.fur && !m.critter) return [60 * z, 80 * z, 60 * z, 35 * z];
  if (m.critter) return [25 * z, 35 * z, 25 * z, 12 * z];
  const lb = m.fur ? wegBridgeLift(m.px, m.py) * z : 0;                 // auf einer Bogenbrücke höher (Block 150)
  return m.label ? [80 * z, 70 * z + lb, 80 * z, 12 * z] : [30 * z, 60 * z + lb, 40 * z, 12 * z];
}

// ---------------------------------------------------------------------------
// Standbild-Merker (Block 144): Rechnen war bei einem schwächeren Prozessor der Engpass (i5: ~20 ms je Bild, Feldschleife). Darum die
// ruhenden Rechtecke (Boden, Tiefe, Linien, Gebäude, Dekos, Natur) einmal für einen etwas größeren Bereich aufzeichnen (Rand M) und
// auf der Grafikkarte behalten; danach nur verschoben zeichnen (Uniform off). Jedes Bild neu: Wellen, Bewegtes (Teil B je Feld) und
// „lebendige“ Felder (Live-Zeichnung, Uhren, Rathaus, fehlende Bildchen) – an ihrer Stelle in der Maler-Reihenfolge (GLS.ops).
// Neu aufgezeichnet bei anderem Zoom, Größe, groundVersion, freigegebenen Texturen (texEpoch: neue/zugeschnittene Bildchen),
// Spieländerungen (drawEpoch: save), außerhalb des Rands und spätestens nach GLS_AGE ms. Nur in ruhigen Bildern (calm), sonst
// wird wie bisher jedes Bild aufgezeichnet.
// ---------------------------------------------------------------------------
const GLS = { dynWhy: new Map(), dirtyWhy: '', srcs: new Set(), ok: false, key: '', tex: -1, draw: -1, at: 0, cam: null, M: 0, W0: 0, H0: 0, recs: [], tiles: [], dyn: [], sA0: [], sA1: [],
  order: new Map(), icons: [], labels: [], waves: [], ents: [], calm: 0, last: '', dirty: false, cur: null, w0: -1, w1: -1, gEnd: 0, ops: [] };
const GLS_AGE = 8000, GLS_CALM = 6;
function glTouch() { GL.drawEpoch++; }                                  // Spielstand geändert (save, neue Welt)
const glPlayOff = () => [(-GLS.M + (GLS.cam.x - cam.x) * cam.z) * DPR, (-GLS.M + (GLS.cam.y - cam.y) * cam.z) * DPR];
// am Bildanfang (render, vor den Sichtgrenzen): abspielen, aufzeichnen oder normal
function glCacheStart(z, now) {
  GL.now = now;
  if (!GLP.cam0 || GLP.cam0.x !== cam.x || GLP.cam0.y !== cam.y || GLP.cam0.z !== z) { GLP.cam0 = { x: cam.x, y: cam.y, z }; GLP.movedAt = now; }   // Vorladen nur in Ruhe
  // Sammelbilder voll und viel davon Freigegebenes: neu anfangen (vor dem Bild – das Standbild wird dann neu aufgenommen). Vorher erst
  // bei 2 Seiten Abfall und nie beim Abspielen: der Atlas hielt alles je Benutzte fest (bis 384 MB auf der Grafikkarte, iPad stürzte ab)
  if (ATL.pages.length >= ATL.max && ATL.waste > ATL.size * ATL.size * (GL_LOWMEM ? 1 : 2)) atlReset(false);
  // Uhren (alle 10 Spielminuten ein neues Bildchen) und das Briefkasten-Fähnchen am Rathaus: dann neu aufnehmen statt jedes Bild live
  // Nacht: ob Lichter/Nachtbilder an sind, ändert, was gezeichnet wird (die Stärke selbst regelt der Shader: nk, Nachtblau)
  const key = [z, W, H, DPR, groundVersion, SPRITES_ON, FOG, Math.floor(gameHour() * 6), typeof mailWaiting === 'function' && mailWaiting() ? 1 : 0,
    night > 0 ? 1 : 0, night > 0.15 ? 1 : 0, nightPicOn() ? 1 : 0].join('|'), sig = key + '|' + GL.texEpoch + '|' + GL.drawEpoch;
  GLS.calm = sig === GLS.last && !spriteZooming && !spriteCatch && !spritePrep ? GLS.calm + 1 : 0;
  GLS.last = sig;
  // im Hintergrund vorbereitetes Standbild übernehmen – nur, wenn sich seitdem nichts geändert hat
  if (GLB.st === 'done') { if (!GLB.bad && GLB.key === key && GLB.tex === GL.texEpoch && GLB.draw === GL.drawEpoch && glBgAlive()) glBgSwapIn(); GLB.st = 'idle'; }
  const dx = GLS.cam ? (GLS.cam.x - cam.x) * z : 1e9, dy = GLS.cam ? (GLS.cam.y - cam.y) * z : 1e9;
  if (GLS.ok && GLS.key === key && GLS.tex === GL.texEpoch && GLS.draw === GL.drawEpoch && now - GLS.at < GLS_AGE
    && Math.abs(dx) < GLS.M * 0.9 && Math.abs(dy) < GLS.M * 0.9) {
    // das nächste schon vorbereiten, bevor der Rand erreicht ist (oder das Standbild zu alt wird) – dann gibt es keinen teuren Aufnahme-Haken
    if (GLB.st === 'run' && (GLB.key !== key || GLB.tex !== GL.texEpoch || GLB.draw !== GL.drawEpoch)) GLB.st = 'idle';
    if (GLB.st === 'idle' && GLS.calm >= GLS_CALM && !GL.lastMiss && (Math.abs(dx) > GLS.M * GLB_FROM || Math.abs(dy) > GLS.M * GLB_FROM || now - GLS.at > GLS_AGE * 0.6))
      glBgStart(key, z, now, dx, dy);
    else if (GLB.st === 'idle' && GLP.st === 'idle' && !GL_LOWMEM && now - GLP.movedAt > 1000 && !GL.lastMiss && glPreWanted(z)) glPreStart(z);
    return (GL.cacheMode = 'play');
  }
  GLB.st = 'idle';                                                       // zu spät: jetzt doch auf einmal aufnehmen
  GLS.ok = false;
  GLS.why = GLS.calm < GLS_CALM ? 'unruhig' : GL.lastMiss ? `2D-Reste ${GL.lastMiss}` : '';
  if (GLS.why) return (GL.cacheMode = null);                             // unruhig oder etwas fiele aufs Overlay
  GLS.M = Math.round(Math.max(W, H) * 0.25); GLS.W0 = W; GLS.H0 = H; GLS.cam = { x: cam.x, y: cam.y }; GLS.key = key; GLS.at = now;
  W += 2 * GLS.M; H += 2 * GLS.M;                                        // mit Rand aufzeichnen (toScreen verschiebt alles um M)
  GLS.tiles.length = 0; GLS.dyn.length = 0; GLS.dynWhy = new Map(); GLS.w0 = GLS.w1 = -1; GLS.waves = [];
  GLS.why = '';
  return (GL.cacheMode = 'rec');
}
// Feld i beginnt (start) bzw. endet (Teil A) – Grenzen der Rechtecke, Symbole und Schilder merken
function glRecTile(i, x, y, nIcons, nLabels, start) {
  if (start) {
    GLS.cur = { x, y, a0: GL.recs.length, i0: nIcons, l0: nLabels, g0: glows.length, p0: nightPics.length, n0: nightPanes.length, wb: nightWarm };
    GLS.dirty = false; GLS.dirtyWhy = ''; nightWarm = false; return;
  }
  const c = GLS.cur, a = COVER.get(x + ',' + y), t = a && state.tiles.get(a);
  c.a1 = GL.recs.length; c.i1 = nIcons; c.l1 = nLabels; c.g1 = glows.length; c.p1 = nightPics.length; c.n1 = nightPanes.length;
  c.warm = nightWarm; nightWarm = nightWarm || c.wb;                    // hat dieses Feld Nachtbilder eingesetzt?
  c.dyn = GLS.dirty;                                                     // Uhren: neu aufnehmen, wenn sie weiterspringen (Schlüssel)
  if (c.dyn && MESS) {                                                   // ?messen: was hält Felder „lebendig“?
    const ds = decosAt(x + ',' + y), n = (t ? t.b : ds && ds.find(Boolean) ? ds.find(Boolean).b : 'Feld') + (GLS.dirtyWhy ? ' (' + GLS.dirtyWhy + ')' : '');
    GLS.dynWhy.set(n, (GLS.dynWhy.get(n) || 0) + 1);
  }
  GLS.dirtyWhy = '';
  GLS.tiles.push(c);
}
// Ende des Aufzeichnens: ruhende Rechtecke als Standbild auf die Grafikkarte; Symbole des Aufzeichnens auf echte Größe
function glRecFinish(pre = null) {                                     // pre: im Hintergrund schon gebaut (glBgStep, gleiche Reihenfolge)
  const recs = GL.recs;
  let st, groundEnd;
  if (pre) { st = pre.slist; groundEnd = pre.groundEnd; GLS.order = pre.order; GLS.sA0 = pre.sA0; GLS.sA1 = pre.sA1; GLS.dyn = pre.dyn; }
  else {
    st = [];
    for (let i = 0; i < GLS.gEnd; i++) st.push(recs[i]);               // Boden, Wellen (schaukeln im Shader), Tiefe, Wege-Bildchen
    groundEnd = st.length;
    GLS.order = new Map(); GLS.sA0 = []; GLS.sA1 = []; GLS.dyn = [];
    GLS.tiles.forEach((c, j) => {
      GLS.order.set(c.x + ',' + c.y, j);
      GLS.sA0[j] = st.length;
      if (!c.dyn) for (let i = c.a0; i < c.a1; i++) st.push(recs[i]); else GLS.dyn.push(j);
      GLS.sA1[j] = st.length;
    });
  }
  GLS.recs = st; GLS.groundEnd = groundEnd;
  const gl = GL.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, GL.sbuf); gl.bufferData(gl.ARRAY_BUFFER, pre ? pre.verts : glVerts(st), gl.STATIC_DRAW);
  // Nacht: Lichter der ruhenden Felder (und des Bodens) einmal als Lichtschicht – die lebendigen kommen jedes Bild neu dazu
  const L = pre ? pre.light : glStaticLights(GLS.tiles, GLS.gl0);
  GLS.light = L;
  gl.bindBuffer(gl.ARRAY_BUFFER, GL.lbuf); gl.bufferData(gl.ARRAY_BUFFER, pre ? pre.lverts : glVerts(L.recs), gl.STATIC_DRAW);
  // was gemerkt ist, gilt als benutzt (sonst räumt die Hauspflege es nach einer Weile weg)
  const used = GLS.srcs = pre ? pre.srcs : new Set(st.map(r => r.src));
  for (const r of L.recs) used.add(r.src);
  GLS.ents = [...objSprites.values()].filter(e => used.has(e.c)).concat([...groundCache.values()].filter(e => used.has(e.c)));
  GLS.tex = GL.texEpoch; GLS.draw = GL.drawEpoch; GLS.ok = true;
}
// Lichtschicht der ruhenden Felder (aus glows/nightPics/nightPanes dieser Aufnahme)
function glStaticLights(tiles, G) {
  if (!(night > 0)) return { recs: [], ph: [0, 0, 0, 0, 0], warm: false, n: 0 };
  const lg = glows.slice(0, G[0]), lp = nightPics.slice(0, G[1]), ln = nightPanes.slice(0, G[2]);
  let warm = G[3];
  for (const c of tiles) if (!c.dyn) {
    for (let i = c.g0; i < c.g1; i++) lg.push(glows[i]); for (let i = c.p0; i < c.p1; i++) lp.push(nightPics[i]); for (let i = c.n0; i < c.n1; i++) ln.push(nightPanes[i]);
    warm = warm || c.warm;
  }
  return glNightRecs(nightDedup(lg), lp, ln, warm);
}
// render (rec): Symbole/Schilder der ruhenden Felder merken, alle Symbole auf echte Bildschirmpunkte
function glRecOverlay(icons, labels) {
  const M = GLS.M, keepI = [], keepL = [];
  for (const c of GLS.tiles) if (!c.dyn) { for (let i = c.i0; i < c.i1; i++) keepI.push(icons[i]); for (let i = c.l0; i < c.l1; i++) keepL.push([labels[i], c.x, c.y]); }
  GLS.icons = keepI.map(([x, y, s]) => [x - M, y - M, s]); GLS.labels = keepL;
  for (const ic of icons) { ic[0] -= M; ic[1] -= M; }
}
// render (play): statt der Feldschleife nur Wellen, lebendige Felder und Bewegtes – in Maler-Reihenfolge zwischen den Standbild-Teilen
function glPlayTiles(z, now, byTile, icons, labels, tileA, tileB) {
  const ops = GLS.ops; ops.length = 0;
  for (const e of GLS.ents) e.used = frameNo;
  ops.push(['s', 0, GLS.groundEnd]);                                   // Boden, Wellen, Tiefe, Brücken, leuchtende Wege
  let d0;
  const ev = new Set(GLS.dyn);
  for (const k of byTile.keys()) { const j = GLS.order.get(k); if (j != null) ev.add(j); }
  const list = [...ev].sort((p, q) => p - q);
  let cur = GLS.groundEnd;
  for (const j of list) {
    const c = GLS.tiles[j], p = toScreen(c.x, c.y);
    ops.push(['s', cur, c.dyn ? GLS.sA0[j] : GLS.sA1[j]]); cur = GLS.sA1[j];
    d0 = GL.recs.length;
    if (c.dyn) tileA(c.x, c.y, p.x, p.y);
    tileB(c.x, c.y, p.x, p.y);
    ops.push(['d', d0, GL.recs.length]);
  }
  ops.push(['s', cur, GLS.recs.length]);
  GLS.tail = GL.recs.length;                                             // was danach noch kommt (Himmel nachts) – glEnd zeichnet es obendrauf
  const off = glPlayOff();
  for (const [x, y, s] of GLS.icons) icons.push([x + off[0] / DPR + GLS.M, y + off[1] / DPR + GLS.M, s]);
  // Schilder nur, wenn ihr Feld wirklich im Bild ist (wie visibleTiles) – sonst schöbe pill sie aus dem Rand ins Bild
  const mX = TW * z, mTop = 110 * z, mBot = TH * z, mBig = 420 * z;
  for (const [l, x, y] of GLS.labels) {
    const p = toScreen(x, y), a = COVER.get(x + ',' + y), t = a && state.tiles.get(a), [w, h] = t ? sizeOf(t.b, t.rot, t) : [1, 1];
    if (p.x >= -mX && p.x <= W + mX && p.y >= -mBot && p.y <= H + (w > 1 || h > 1 ? mBig : mTop)) labels.push(l);   // Schild steht am Eckfeld: große Gebäude dürfen tiefer
  }
}

// --- Standbild im Hintergrund (Block 144): Während das alte spielt, wird das nächste in kleinen Stücken aufgenommen (glBgStep am
// Ende von render, GLB_MS je Bild), dann nur umgeschaltet (glCacheStart → glBgSwapIn). Vorher kostete jedes neue Standbild ein
// ganzes teures Bild (Mac ~35 ms, PC mehr) – beim Verschieben alle paar Bildschirmbreiten, sonst alle 8 s
const GLB = { st: 'idle', bad: false, gpaint: 0, retry: false };                                  // st: idle | run | done
const GLB_MS = 4, GLB_FROM = 0.15;                                        // ms je Bild; Start ab 15 % des Rands (Block 125c: vorher 30 % –
// schnelles Ziehen erreichte auf dem iPad den Rand, bevor das neue Standbild fertig war → alles auf einmal, Ruckler mitten im Ziehen)
// Je näher am Rand (Anteil r von 0,9 M), desto mehr Zeit je Bild: bis 3× GLB_MS – lieber etwas langsamer als ein Bild mit 100 ms
const glBgBudget = () => { if (!GLS.cam) return GLB_MS; const r = Math.max(Math.abs(GLS.cam.x - cam.x), Math.abs(GLS.cam.y - cam.y)) * cam.z / (GLS.M * 0.9); return GLB_MS * (1 + 2 * Math.max(0, Math.min(1, (r - 0.4) / 0.5))); };
function glBgStart(key, z, now, dx, dy) {
  // etwas in Bewegungsrichtung vorausgreifen (dx/dy: wie weit das Bild schon vom alten Standbild weg ist)
  const lead = 0.6, cx = cam.x - dx / z * lead, cy = cam.y - dy / z * lead;
  Object.assign(GLB, { st: 'run', bad: false, key, tex: GL.texEpoch, draw: GL.drawEpoch, at: now, cam: { x: cx, y: cy, z }, M: Math.round(Math.max(W, H) * 0.25), W0: W, H0: H,
    V: null, i: -1, recs: [], tiles: [], vparts: [], pend: [], slist: [], srcs: new Set(), order: new Map(), sA0: [], sA1: [], dyn: [], groundEnd: 0, verts: null, light: null, lverts: null, icons: [], labels: [], glows: [], pics: [], panes: [], seen: new Set(), warm: false, cells: new Map(), dynWhy: new Map(), gEnd: 0, gl0: null });
}
// ein Stück aufnehmen: Zustand des Bilds beiseite (Liste, Kamera, Größe, Lichter, Symbole), Hintergrund-Zustand einsetzen, Felder bis GLB_MS
function glBgStep(z, now, tileA, icons, labels, B = GLB) {
  const t0 = performance.now(), miss0 = SPRITE_STATS.miss + SPRITE_STATS.nmiss, ms = B === GLB ? glBgBudget() : GLB_MS;   // vor dem Tausch der Kamera
  GL.bgB = B;
  const keep = { recs: GL.recs, cam, W, H, FOG, g, gc: groundCached, tiles: GLS.tiles, dynWhy: GLS.dynWhy, warm: nightWarm, cells: glowCells, stats: { ...GL.stats },
    glows: glows.splice(0), pics: nightPics.splice(0), panes: nightPanes.splice(0), seen: [...nightSeen], icons: icons.splice(0), labels: labels.splice(0), am: afterMovers.splice(0) };
  GL.recs = B.recs; cam = B.cam; W = B.W0 + 2 * B.M; H = B.H0 + 2 * B.M; GLS.tiles = B.tiles; GLS.dynWhy = B.dynWhy;
  for (const x of B.glows) glows.push(x); for (const x of B.pics) nightPics.push(x); for (const x of B.panes) nightPanes.push(x);
  nightSeen.clear(); for (const k of B.seen) nightSeen.add(k);
  nightWarm = B.warm; glowCells = B.cells; for (const x of B.icons) icons.push(x); for (const x of B.labels) labels.push(x);
  g = ctx; glHook(true, true); GLPASS = true; GL.bg = true;
  try {
    if (!B.V) B.V = worldView(z);
    const ground = B.i < 0;
    if (B.i < 0) {                                                         // zuerst Boden, Wellen, Tiefe, leuchtende Wege
      GLS.dirty = false; B.gpaint = 0; B.retry = false;
      worldGround(B.V, z, now, false);
      if (GLS.dirty) B.bad = true;                                          // Boden mit Lebendigem: so nicht merkbar
    }
    if (B.i < 0 && (B.retry || B.dry)) {                                    // fehlende Boden-Stücke: je Bild nur ein paar malen, dann noch einmal
      GL.recs.length = 0; glows.length = 0; nightPics.length = 0; nightPanes.length = 0; nightSeen.clear(); nightWarm = false; glowCells = new Map();
      if (B.dry && !B.retry) B.i = 0;                                       // Vorladen: Boden ist gemalt, weiter mit den Feldern
    } else if (B.i < 0) {
      B.gEnd = GL.recs.length; B.gl0 = [glows.length, nightPics.length, nightPanes.length, nightWarm]; B.i = 0;
      // Standbild-Liste, Reihenfolge, Bildchen und Eckpunkte schon jetzt (sonst beim Umschalten 6–15 ms am Stück)
      B.slist = GL.recs.slice(0, B.gEnd); B.groundEnd = B.gEnd; for (const r of B.slist) { B.srcs.add(r.src); B.pend.push(r); }
    }
    const vis = B.V.visible;
    while (!ground && B.i >= 0 && B.i < vis.length && performance.now() - t0 < ms) {   // Boden allein in seinem Bild
      const i = B.i, x = vis[i], y = vis[i + 1];
      glRecTile(i >> 2, x, y, icons.length, labels.length, true);
      tileA(x, y, vis[i + 2], vis[i + 3]);
      glRecTile(i >> 2, x, y, icons.length, labels.length, false);
      if (B.dry) { GL.recs.length = 0; B.tiles.length = 0; B.i += 4; continue; }   // Vorladen: nur die Bildchen zählen, nichts merken
      const j = B.tiles.length - 1, c = B.tiles[j];
      B.order.set(c.x + ',' + c.y, j); B.sA0[j] = B.slist.length;
      if (!c.dyn) for (let k = c.a0; k < c.a1; k++) { const r = GL.recs[k]; B.slist.push(r); B.pend.push(r); B.srcs.add(r.src); } else B.dyn.push(j);
      B.sA1[j] = B.slist.length;
      B.i += 4;
    }
    if (B.pend.length && !ground) { B.vparts.push(glVerts(B.pend)); B.pend = []; }   // Eckpunkte des Bodens im nächsten Bild
    if (B.i >= 0 && B.i >= vis.length && !B.dry) {                          // fertig: Lichtschicht und Eckpunkte am Stück
      if (B.pend.length) { B.vparts.push(glVerts(B.pend)); B.pend = []; }
      B.light = glStaticLights(B.tiles, B.gl0); B.lverts = glVerts(B.light.recs);
      let n = 0; for (const v of B.vparts) n += v.length;
      B.verts = new Float32Array(n); n = 0; for (const v of B.vparts) { B.verts.set(v, n); n += v.length; }
      B.vparts = [];
    }
  } catch (e) { B.bad = true; console.warn('Standbild im Hintergrund', e); }
  finally {
    B.miss = (B.miss || 0) + SPRITE_STATS.miss + SPRITE_STATS.nmiss - miss0;
    if (B.dry) { glows.length = 0; nightPics.length = 0; nightPanes.length = 0; nightSeen.clear(); icons.length = 0; labels.length = 0; }
    GL.bg = false; GLPASS = false; glHook(false);
    afterMovers.length = 0;                                                 // gehört zu Bewegtem – das läuft beim Abspielen
    B.glows = glows.splice(0); B.pics = nightPics.splice(0); B.panes = nightPanes.splice(0); B.seen = new Set(nightSeen); B.warm = nightWarm; B.cells = glowCells;
    B.icons = icons.splice(0); B.labels = labels.splice(0);
    GL.recs = keep.recs; cam = keep.cam; W = keep.W; H = keep.H; FOG = keep.FOG; g = keep.g; groundCached = keep.gc; GLS.tiles = keep.tiles; GLS.dynWhy = keep.dynWhy;
    nightWarm = keep.warm; glowCells = keep.cells; Object.assign(GL.stats, keep.stats);
    for (const x of keep.glows) glows.push(x); for (const x of keep.pics) nightPics.push(x); for (const x of keep.panes) nightPanes.push(x);
    nightSeen.clear(); for (const k of keep.seen) nightSeen.add(k);
    for (const x of keep.icons) icons.push(x); for (const x of keep.labels) labels.push(x); for (const x of keep.am) afterMovers.push(x);
  }
  if (B.bad) B.st = 'idle';
  else if (B.V && B.i >= B.V.visible.length) B.st = 'done';
}
// sind alle Bildchen des Hintergrund-Standbilds noch da? (inzwischen ersetzte werden freigegeben: Breite 0)
function glBgAlive() {
  const B = GLB;
  return B.recs.every(r => r.src.width > 0) && B.pics.every(p => p[0].width > 0) && B.panes.every(p => p[0].erase.c && p[0].erase.c.width > 0);
}
// fertiges Hintergrund-Standbild als Standbild übernehmen (wie glRecFinish nach einer Aufnahme)
function glBgSwapIn() {
  const B = GLB, keep = GL.recs;
  GL.recs = B.recs; GLS.tiles = B.tiles; GLS.dynWhy = B.dynWhy; GLS.gEnd = B.gEnd; GLS.gl0 = B.gl0;
  GLS.M = B.M; GLS.W0 = B.W0; GLS.H0 = B.H0; GLS.cam = { x: B.cam.x, y: B.cam.y }; GLS.key = B.key; GLS.at = B.at;
  try { glRecFinish(B); glRecOverlay(B.icons, B.labels); GL.bgSwaps = (GL.bgSwaps || 0) + 1; }
  catch (e) { GLS.ok = false; console.warn('Standbild im Hintergrund', e); }
  finally { GL.recs = keep; B.recs = null; B.V = null; B.vparts = []; B.slist = null; B.verts = null; B.lverts = null; }
}

// --- Vorladen (Block 144, Wunsch Nutzer): ruht das Bild ~1 s, werden Bildchen und Boden für einen Ring von einer Bildschirmbreite
// rings um das Bild schon gemalt (glBgStep trocken: nichts merken, nur getSprite/Boden). Je Bild höchstens GLB_MS, das
// Hintergrund-Standbild geht vor. Nicht auf Safari/iPad (Speicher). Fehlte etwas (Budget), noch einmal – höchstens 3 Durchgänge
const GLP = { st: 'idle', dry: true, last: null, pass: 0, off: new URLSearchParams(location.search).get('vorladen') === '0' };   // ?vorladen=0 zum Vergleichen
function glPreWanted(z) {
  const L = GLP.last;
  if (GLP.off) return false;
  return !L || L.z !== z || Math.abs(L.x - cam.x) * z > W * 0.4 || Math.abs(L.y - cam.y) * z > H * 0.4 || (L.again && GLP.pass < 3);
}
function glPreStart(z) {
  const again = GLP.last && GLP.last.again && GLP.last.z === z && GLP.last.x === cam.x && GLP.last.y === cam.y;
  GLP.pass = again ? GLP.pass + 1 : 1;
  Object.assign(GLP, { st: 'run', bad: false, cam: { x: cam.x, y: cam.y, z }, M: Math.round(Math.max(W, H)), W0: W, H0: H, V: null, i: -1, recs: [], tiles: [],
    vparts: [], pend: [], slist: [], srcs: new Set(), order: new Map(), sA0: [], sA1: [], dyn: [], icons: [], labels: [], glows: [], pics: [], panes: [], seen: new Set(),
    warm: false, cells: new Map(), dynWhy: new Map(), gEnd: 0, gl0: null, miss: 0, gpaint: 0, retry: false });
  GLP.last = { x: cam.x, y: cam.y, z, again: false };
}
// nach einem Schritt: fertig? Dann merken, ob noch etwas fehlte (dann später noch ein Durchgang)
function glPreAfter() {
  if (GLP.st === 'done' || GLP.bad) { if (GLP.last) GLP.last.again = !GLP.bad && GLP.miss > 0; GLP.st = 'idle'; GLP.V = null; GLP.recs = []; }
}
