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
const GL = { now: 0, texEpoch: 0, drawEpoch: 0, cacheMode: null, lastMiss: 0, ready: false, broken: false, gl: null, canvas: null, prog: null, buf: null, loc: null, texs: new Map(), recs: [],
  frame: false, shown: false, stats: { quads: 0, draws: 0, live: 0, over: 0, up: 0, miss: 0 } };
let GLPASS = false;                                             // gerade läuft der aufgezeichnete Welt-Durchgang
const GL_Q = new URLSearchParams(location.search).get('gl');
// eingeschaltet? ?gl=1 / ?gl=0, sonst gemerkte Wahl (Einstellungen), vorerst standardmäßig aus, bis es auf dem iPad gemessen ist
function glWanted() {
  if (GL_Q === '0') return false;
  if (GL_Q === '1') return true;
  try { return localStorage.getItem('kachelhausen_gl') === '1'; } catch (e) { return false; }
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
  uniform sampler2D tx, a0, a1, a2, a3, a4, a5; out vec4 o;
  void main() {
    if (gl_FragCoord.x < clip.x || gl_FragCoord.x > clip.y) discard;
    vec2 u = clamp(uv, rect.xy, rect.zw); vec4 c;
    if (page < 0) c = texture(tx, u); else if (page == 0) c = texture(a0, u); else if (page == 1) c = texture(a1, u); else if (page == 2) c = texture(a2, u);
    else if (page == 3) c = texture(a3, u); else if (page == 4) c = texture(a4, u); else c = texture(a5, u);
    o = c * al; }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  try {
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    GL.prog = pr; GL.buf = gl.createBuffer(); GL.sbuf = gl.createBuffer();
    GL.loc = { p: gl.getAttribLocation(pr, 'p'), t: gl.getAttribLocation(pr, 't'), a: gl.getAttribLocation(pr, 'a'), cl: gl.getAttribLocation(pr, 'cl'), pg: gl.getAttribLocation(pr, 'pg'), rc: gl.getAttribLocation(pr, 'rc'),
      w: gl.getAttribLocation(pr, 'wv'), wt: gl.getUniformLocation(pr, 'wt'),
      sz: gl.getUniformLocation(pr, 'sz'), tx: gl.getUniformLocation(pr, 'tx'), off: gl.getUniformLocation(pr, 'off'), at: [0, 1, 2, 3, 4, 5].map(i => gl.getUniformLocation(pr, 'a' + i)) };
  } catch (e) { console.warn('WebGL', e); GL.broken = true; return false; }
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  c.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.ready = false; GL.texs.clear(); atlReset(true); GLS.ok = false; glShow(false); });
  c.addEventListener('webglcontextrestored', () => { GL.broken = false; GL.gl = null; GL.texs.clear(); atlReset(true); glInit(); });
  ATL.size = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));
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
  if (!GLPASS || !(img instanceof HTMLCanvasElement) || !img.width || !img.height || glClip === 'x' || ctx.globalCompositeOperation !== 'source-over') {
    if (GLPASS) { GL.stats.miss++; GLS.dirty = true; }
    return C2D.drawImage.call(ctx, img, ...a);
  }
  let sx = 0, sy = 0, sw = img.width, sh = img.height, dx, dy, dw, dh;
  if (a.length === 2) { [dx, dy] = a; dw = sw; dh = sh; } else if (a.length === 4) [dx, dy, dw, dh] = a; else [sx, sy, sw, sh, dx, dy, dw, dh] = a;
  const t = ctx.getTransform();
  // Abbildung Quelle → Gerät: Ziel (dx, dy, dw, dh) unter der Transformation; als affine Matrix der Einheitsfläche
  const m = { a: t.a * dw, b: t.b * dw, c: t.c * dh, d: t.d * dh, e: t.a * dx + t.c * dy + t.e, f: t.b * dx + t.d * dy + t.f };
  glRec(img, sx, sy, sw, sh, m, ctx.globalAlpha, glClip, ctx.imageSmoothingEnabled === false);
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
function glHook(on) { for (const [k, f] of Object.entries(GL_HOOKS)) { if (on) ctx[k] = f; else delete ctx[k]; } }

// --- Sammelfläche für Live-Gezeichnetes (je Bild neu) ---
const LA = { c: null, x: null, w: 2048, h: 2048, cx: 0, cy: 0, row: 0, used: 0, off: [0, 0] };
function laInit() {
  if (LA.c) return !!LA.x;
  LA.c = document.createElement('canvas'); LA.c.width = LA.w; LA.c.height = LA.h;
  LA.x = LA.c.getContext('2d');
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
  if (LA.used && LA.x) { C2D.setTransform.call(LA.x, 1, 0, 0, 1, 0, 0); LA.x.clearRect(0, 0, LA.w, Math.min(LA.h, LA.used)); }
  LA.cx = 0; LA.cy = 0; LA.row = 0; LA.used = 0;
}
function laAlloc(w, h) {
  w = Math.ceil(w) + 2; h = Math.ceil(h) + 2;
  if (w > LA.w || h > LA.h) return null;
  if (LA.cx + w > LA.w) { LA.cx = 0; LA.cy += LA.row; LA.row = 0; }
  if (LA.cy + h > LA.h) return null;
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
  try { fn(); } finally { C2D.restore.call(X); g = prev; LA.off = [0, 0]; }
  GL.stats.live++;
  glRec(LA.c, cell.x, cell.y, bw, bh, { a: bw, b: 0, c: 0, d: bh, e: bx0, f: by0 }, 1, glClip, false);
}

// --- Bild ---
// Darf dieses Bild über die Grafikkarte? (render, nach SPRITES_ON)
function glFrameOk(z) {
  // Grund fürs Messen (?messen): warum gerade (nicht) per Grafikkarte
  GL.why = GL.off || !glWanted() ? 'aus (?gl=1 zum Einschalten)' : !SPRITES_ON ? 'nah dran (2D)' : SPRITES_NEAR ? 'Zoom ≥ 1 (2D)' : spriteForce === false ? 'Messwerkzeug (2D)'
    : night !== 0 ? 'Nacht/Dämmerung (noch 2D)' : tool !== 'look' || moving || plan ? 'Werkzeug gewählt (2D)' : !glInit() ? 'kein WebGL2 im Browser (2D)' : '';
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
    if (LA.used) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);   // Sammelfläche: jedes Bild neu
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
    const CW = GL.canvas.width, CH = GL.canvas.height;
    gl.viewport(0, 0, CW, CH);
    gl.clearColor(0x6f / 255, 0xcb / 255, 0xe2 / 255, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(GL.prog);
    gl.uniform2f(GL.loc.sz, CW, CH); gl.uniform1i(GL.loc.tx, 0); gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(GL.loc.wt, (GL.now / 900) % (2 * Math.PI));                // Wellen schaukeln wie drawWave (sin(now/900 + Phase))
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);       // source-over, vormultipliziert
    if (LA.used) glTex(LA.c, false);                                       // Sammelfläche einmal je Bild hochladen
    if (mode !== 'play' && ATL.waste > ATL.size * ATL.size * 2 && ATL.pages.length >= ATL.max) atlReset(false);   // voll mit Freigegebenem: neu anfangen (nie beim Abspielen)
    const verts = glVerts(recs);                                           // legt Neues in den Atlas
    gl.bindBuffer(gl.ARRAY_BUFFER, GL.buf); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STREAM_DRAW);
    atlBind();
    if (mode === 'play') {
      const off = glPlayOff();
      for (const op of GLS.ops) {
        if (op[0] === 's') { if (op[2] > op[1]) { glAttribs(GL.sbuf); gl.uniform2f(GL.loc.off, off[0], off[1]); glDrawRange(GLS.recs, op[1], op[2]); } }
        else if (op[2] > op[1]) { glAttribs(GL.buf); gl.uniform2f(GL.loc.off, 0, 0); glDrawRange(recs, op[1], op[2]); }
      }
      GL.stats.quads = n + GLS.recs.length;
    } else {
      glAttribs(GL.buf);
      gl.uniform2f(GL.loc.off, mode === 'rec' ? -GLS.M * DPR : 0, mode === 'rec' ? -GLS.M * DPR : 0);
      glDrawRange(recs, 0, n);
      GL.stats.quads = n;
      if (mode === 'rec') glRecFinish();
    }
    glShow(true);
  } catch (e) { console.warn('WebGL', e); GL.broken = true; GL.ready = false; glShow(false); }
  GL.frame = false;
}
// 2D-Bild: GL-Leinwand verstecken (die deckende 2D-Leinwand liegt ohnehin darüber)
function glIdle() { if (GL.shown) glShow(false); }
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
  return m.label ? [80 * z, 70 * z, 80 * z, 12 * z] : [30 * z, 60 * z, 40 * z, 12 * z];
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
const GLS = { srcs: new Set(), ok: false, key: '', tex: -1, draw: -1, at: 0, cam: null, M: 0, W0: 0, H0: 0, recs: [], tiles: [], dyn: [], sA0: [], sA1: [],
  order: new Map(), icons: [], labels: [], waves: [], ents: [], calm: 0, last: '', dirty: false, cur: null, w0: -1, w1: -1, gEnd: 0, ops: [] };
const GLS_AGE = 8000, GLS_CALM = 6;
function glTouch() { GL.drawEpoch++; }                                  // Spielstand geändert (save, neue Welt)
const glPlayOff = () => [(-GLS.M + (GLS.cam.x - cam.x) * cam.z) * DPR, (-GLS.M + (GLS.cam.y - cam.y) * cam.z) * DPR];
// am Bildanfang (render, vor den Sichtgrenzen): abspielen, aufzeichnen oder normal
function glCacheStart(z, now) {
  GL.now = now;
  const key = [z, W, H, DPR, groundVersion, SPRITES_ON, FOG].join('|'), sig = key + '|' + GL.texEpoch + '|' + GL.drawEpoch;
  GLS.calm = sig === GLS.last && !spriteZooming && !spriteCatch && !spritePrep ? GLS.calm + 1 : 0;
  GLS.last = sig;
  const dx = GLS.cam ? (GLS.cam.x - cam.x) * z : 1e9, dy = GLS.cam ? (GLS.cam.y - cam.y) * z : 1e9;
  if (GLS.ok && GLS.key === key && GLS.tex === GL.texEpoch && GLS.draw === GL.drawEpoch && now - GLS.at < GLS_AGE
    && Math.abs(dx) < GLS.M * 0.9 && Math.abs(dy) < GLS.M * 0.9) return (GL.cacheMode = 'play');
  GLS.ok = false;
  GLS.why = GLS.calm < GLS_CALM ? 'unruhig' : GL.lastMiss ? `2D-Reste ${GL.lastMiss}` : '';
  if (GLS.why) return (GL.cacheMode = null);                             // unruhig oder etwas fiele aufs Overlay
  GLS.M = Math.round(Math.max(W, H) * 0.25); GLS.W0 = W; GLS.H0 = H; GLS.cam = { x: cam.x, y: cam.y }; GLS.key = key; GLS.at = now;
  W += 2 * GLS.M; H += 2 * GLS.M;                                        // mit Rand aufzeichnen (toScreen verschiebt alles um M)
  GLS.tiles.length = 0; GLS.dyn.length = 0; GLS.w0 = GLS.w1 = -1; GLS.waves = [];
  GLS.why = '';
  return (GL.cacheMode = 'rec');
}
// Feld i beginnt (start) bzw. endet (Teil A) – Grenzen der Rechtecke, Symbole und Schilder merken
function glRecTile(i, x, y, nIcons, nLabels, start) {
  if (start) { GLS.cur = { x, y, a0: GL.recs.length, i0: nIcons, l0: nLabels }; GLS.dirty = false; return; }
  const c = GLS.cur, a = COVER.get(x + ',' + y), t = a && state.tiles.get(a);
  c.a1 = GL.recs.length; c.i1 = nIcons; c.l1 = nLabels;
  c.dyn = GLS.dirty || !!(t && (CLOCK_SPRITES.has(t.b) || t.b === 'rathaus'));   // Uhren, Briefkasten-Fähnchen: jedes Bild neu
  GLS.tiles.push(c);
}
// Ende des Aufzeichnens: ruhende Rechtecke als Standbild auf die Grafikkarte; Symbole des Aufzeichnens auf echte Größe
function glRecFinish() {
  const recs = GL.recs, st = [];
  for (let i = 0; i < GLS.gEnd; i++) st.push(recs[i]);                 // Boden, Wellen (schaukeln im Shader), Tiefe, Wege-Bildchen
  const groundEnd = st.length;
  GLS.order.clear(); GLS.sA0 = []; GLS.sA1 = []; GLS.dyn = [];
  GLS.tiles.forEach((c, j) => {
    GLS.order.set(c.x + ',' + c.y, j);
    GLS.sA0[j] = st.length;
    if (!c.dyn) for (let i = c.a0; i < c.a1; i++) st.push(recs[i]); else GLS.dyn.push(j);
    GLS.sA1[j] = st.length;
  });
  GLS.recs = st; GLS.groundEnd = groundEnd;
  const gl = GL.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, GL.sbuf); gl.bufferData(gl.ARRAY_BUFFER, glVerts(st), gl.STATIC_DRAW);
  // was gemerkt ist, gilt als benutzt (sonst räumt die Hauspflege es nach einer Weile weg)
  const used = GLS.srcs = new Set(st.map(r => r.src));
  GLS.ents = [...objSprites.values()].filter(e => used.has(e.c)).concat([...groundCache.values()].filter(e => used.has(e.c)));
  GLS.tex = GL.texEpoch; GLS.draw = GL.drawEpoch; GLS.ok = true;
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
  const off = glPlayOff();
  for (const [x, y, s] of GLS.icons) icons.push([x + off[0] / DPR + GLS.M, y + off[1] / DPR + GLS.M, s]);
  // Schilder nur, wenn ihr Feld wirklich im Bild ist (wie visibleTiles) – sonst schöbe pill sie aus dem Rand ins Bild
  const mX = TW * z, mTop = 110 * z, mBot = TH * z, mBig = 420 * z;
  for (const [l, x, y] of GLS.labels) {
    const p = toScreen(x, y), a = COVER.get(x + ',' + y), t = a && state.tiles.get(a), [w, h] = t ? sizeOf(t.b, t.rot, t) : [1, 1];
    if (p.x >= -mX && p.x <= W + mX && p.y >= -mBot && p.y <= H + (w > 1 || h > 1 ? mBig : mTop)) labels.push(l);   // Schild steht am Eckfeld: große Gebäude dürfen tiefer
  }
}
