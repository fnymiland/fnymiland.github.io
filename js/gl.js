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
const GL = { ready: false, broken: false, gl: null, canvas: null, prog: null, buf: null, loc: null, texs: new Map(), recs: [],
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
  const VS = `#version 300 es
  in vec2 p; in vec2 t; in float a; in vec2 cl; uniform vec2 sz;
  out vec2 uv; out float al; out vec2 clip;
  void main() { uv = t; al = a; clip = cl; gl_Position = vec4(p.x / sz.x * 2.0 - 1.0, 1.0 - p.y / sz.y * 2.0, 0.0, 1.0); }`;
  const FS = `#version 300 es
  precision highp float;
  in vec2 uv; in float al; in vec2 clip; uniform sampler2D tx; out vec4 o;
  void main() { if (gl_FragCoord.x < clip.x || gl_FragCoord.x > clip.y) discard; o = texture(tx, uv) * al; }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  try {
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    GL.prog = pr; GL.buf = gl.createBuffer();
    GL.loc = { p: gl.getAttribLocation(pr, 'p'), t: gl.getAttribLocation(pr, 't'), a: gl.getAttribLocation(pr, 'a'), cl: gl.getAttribLocation(pr, 'cl'), sz: gl.getUniformLocation(pr, 'sz'), tx: gl.getUniformLocation(pr, 'tx') };
  } catch (e) { console.warn('WebGL', e); GL.broken = true; return false; }
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  c.addEventListener('webglcontextlost', e => { e.preventDefault(); GL.ready = false; GL.texs.clear(); glShow(false); });
  c.addEventListener('webglcontextrestored', () => { GL.broken = false; GL.gl = null; GL.texs.clear(); glInit(); });
  GL.gl = gl; GL.canvas = c; GL.ready = true;
  return true;
}
function glShow(on) { if (GL.canvas && GL.shown !== on) { GL.canvas.style.visibility = on ? 'visible' : 'hidden'; GL.shown = on; } }
// Leinwand freigegeben (freeCanvas): Textur auch weg
function glForget(c) { const e = GL.texs.get(c); if (e && GL.gl) GL.gl.deleteTexture(e.tex); GL.texs.delete(c); }

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
    if (GLPASS) GL.stats.miss++;
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
  if (bx0 > ctx.canvas.width || by0 > ctx.canvas.height || bx0 + bw < 0 || by0 + bh < 0) return;   // ganz außerhalb
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
  return !GL.off && glWanted() && SPRITES_ON && !SPRITES_NEAR && spriteForce !== false && night === 0 && tool === 'look' && !moving && !plan && glInit();
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
// Ende des Welt-Durchgangs: alles Aufgezeichnete zeichnen
function glEnd() {
  glHook(false); GLPASS = false;
  const gl = GL.gl, recs = GL.recs, n = recs.length, CW = GL.canvas.width, CH = GL.canvas.height;
  const F = 7, data = new Float32Array(n * 6 * F);
  let o = 0;
  for (const r of recs) {
    const { m, sx, sy, sw, sh } = r, W0 = r.src.width, H0 = r.src.height;
    const u0 = sx / W0, v0 = sy / H0, u1 = (sx + sw) / W0, v1 = (sy + sh) / H0;
    const P = (u, v) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f];
    const A = P(0, 0), B = P(1, 0), Cc = P(0, 1), D = P(1, 1);
    for (const [p, tu, tv] of [[A, u0, v0], [B, u1, v0], [Cc, u0, v1], [Cc, u0, v1], [B, u1, v0], [D, u1, v1]]) {
      data[o++] = p[0]; data[o++] = p[1]; data[o++] = tu; data[o++] = tv; data[o++] = r.alpha; data[o++] = r.clip[0]; data[o++] = r.clip[1];
    }
  }
  try {
    gl.viewport(0, 0, CW, CH);
    gl.clearColor(0x6f / 255, 0xcb / 255, 0xe2 / 255, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(GL.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, GL.buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
    const L = GL.loc, S = F * 4;
    gl.enableVertexAttribArray(L.p); gl.vertexAttribPointer(L.p, 2, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(L.t); gl.vertexAttribPointer(L.t, 2, gl.FLOAT, false, S, 8);
    gl.enableVertexAttribArray(L.a); gl.vertexAttribPointer(L.a, 1, gl.FLOAT, false, S, 16);
    gl.enableVertexAttribArray(L.cl); gl.vertexAttribPointer(L.cl, 2, gl.FLOAT, false, S, 20);
    gl.uniform2f(L.sz, CW, CH); gl.uniform1i(L.tx, 0); gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);       // source-over, vormultipliziert
    if (LA.used) glTex(LA.c, false);                                       // Sammelfläche einmal je Bild hochladen
    let i = 0;
    while (i < n) {                                                        // je gleiche Textur ein Auftrag (Reihenfolge bleibt)
      const src = recs[i].src; let j = i + 1;
      while (j < n && recs[j].src === src) j++;
      const e = src === LA.c ? GL.texs.get(LA.c) : glTex(src, recs[i].nearest);
      gl.bindTexture(gl.TEXTURE_2D, e.tex);
      gl.drawArrays(gl.TRIANGLES, i * 6, (j - i) * 6);
      GL.stats.draws++;
      i = j;
    }
    GL.stats.quads = n;
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
  const c = GL_WAVE.c, w = c.width, h = c.height, off = DEPTH * z * 0.7;
  for (let i = 0; i < list.length; i += 2) {
    const x = list[i], y = list[i + 1], p = toScreen(x, y), ph = now / 900 + hash(x, y, 10) * 20;
    const wx = (p.x + Math.sin(ph) * 5 * z) * DPR, wy = (p.y + off + (hash(x, y, 11) - 0.5) * 10 * z) * DPR;   // wie drawWave
    glRec(c, 0, 0, w, h, { a: w, b: 0, c: 0, d: h, e: wx - GL_WAVE.ox, f: wy - GL_WAVE.oy }, 1, glClip, false);
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
