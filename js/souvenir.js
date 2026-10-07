'use strict';
// ---------------------------------------------------------------------------
// Souvenirs (Block 129): Geschenke von Freunden, die man nur geschenkt bekommt – in Farbe und Flagge der Insel des Absenders,
// mit seinem Namen. Kostenlos, einmal am Tag je Freund (🌐 → Freunde → 🎁). Sie kommen in den Briefkasten, beim Abholen ins
// Sammelregal (Album) und lassen sich von dort einmal aufstellen; abreißen legt sie zurück ins Regal.
// Datenbank: mail/<empfänger>/<id> { from, n, a, at, sv: { k, c, s, t } } (Regeln: firebase-rules.json)
// Spielstand: state.souvenirs = [{ id, k, from, n, t, a, c, s, at }] (svClean in data.js), aufgestellt als Deko
// { b: 'souvenir', sv: id } – ob eins steht, ergibt sich immer aus den Dekos (svPlaced), nie aus einem eigenen Merker.
// ---------------------------------------------------------------------------
let svPick = null;                                                       // gerade zum Aufstellen gewählt (Kennung)
const svById = id => (state.souvenirs || []).find(s => s.id === id) || null;
function svPlaced() {
  const out = new Set();
  for (const ds of state.decos.values()) for (const d of ds) if (d && d.b === 'souvenir' && d.sv) out.add(d.sv);
  return out;
}
const svFree = id => !!svById(id) && !svPlaced().has(id);
// Souvenir einer Deko an (x, y, Ecke); beim Aufstellen (Vorschau) das gewählte
function svAt(x, y, slot) {
  const d = (state.decos.get(x + ',' + y) || [])[slot];
  return svById(d && d.b === 'souvenir' ? d.sv : svPick);
}
// fürs Bildchen weit weg (decoVariant): alles, wovon die Zeichnung abhängt
const svVariant = (x, y, slot) => { const s = svAt(x, y, slot); return s ? `${s.k}|${s.c}|${s.s}|${s.a}` : '?'; };
const svKind = k => SV_KINDS.find(q => q.id === k) || SV_KINDS[0];
const svName = s => `${svKind(s.k).name} von ${s.n}`;

// --- Zeichnen ---
function svHeart(x, y, r, col) {
  g.beginPath(); g.moveTo(x, y + r);
  g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.5, x, y - r * 0.5);
  g.bezierCurveTo(x + r * 0.7, y - r * 1.5, x + r * 1.6, y - r * 0.2, x, y + r);
  g.fillStyle = col; g.fill();
}
function svFlag(px, top, z, s, h = 6) {                                   // kleines Fähnchen mit Symbol
  const fw = 9 * z, fh = h * z;
  poly([[px, top], [px + fw, top + 0.6 * z], [px + fw, top + fh + 0.6 * z], [px, top + fh]], C(s.c));
  g.font = `${4.6 * z}px system-ui, sans-serif`; g.textBaseline = 'middle';
  centerText(s.s, px + fw / 2, top + fh / 2 + 0.4 * z);
}
function drawSouvenir(cx, cy, z, s) {
  if (!s) {                                                              // unbekannt (Daten fehlen): ein Geschenkpaket
    ellipse(cx, cy + 1 * z, 7 * z, 3 * z, 'rgba(40,60,20,0.15)');
    box(cx, cy, 5 * z, 2.6 * z, 7 * z, '#e8604f', null);
    g.fillStyle = C('#ffd23f'); g.fillRect(cx - 0.8 * z, cy - 7 * z, 1.6 * z, 9 * z);
    return;
  }
  const col = s.c;
  switch (s.k) {
    case 'statue': {                                                     // das Tier des Absenders aus Stein auf einem Sockel
      ellipse(cx, cy + 1 * z, 8 * z, 3.4 * z, 'rgba(40,60,20,0.15)');
      box(cx, cy, 6.5 * z, 3.3 * z, 6 * z, '#d8d2c4', null);
      poly([[cx - 6.5 * z, cy - 6 * z], [cx, cy - 2.7 * z], [cx, cy - 1.6 * z], [cx - 6.5 * z, cy - 4.9 * z]], C(col));   // Band in seiner Farbe
      poly([[cx, cy - 2.7 * z], [cx + 6.5 * z, cy - 6 * z], [cx + 6.5 * z, cy - 4.9 * z], [cx, cy - 1.6 * z]], C(shade(col, -0.18)));
      const ots = toScreen, foot = cy - 6 * z, fz = z * 0.8;
      toScreen = () => ({ x: cx - 6 * fz, y: foot });                  // drawWalker setzt die Figur 6 Punkte rechts vom Feld
      try { drawWalker({ kind: Math.max(0, Math.min(ANIMALS.length - 1, s.a | 0)), fur: '#c9c3b6', shirt: '#b3ad9f', px: 0, py: 0, wait: 1, speed: 0.5, full: true }, fz, 0); }
      finally { toScreen = ots; }
      break;
    }
    case 'schild': {                                                     // Wegweiser: zwei Pfeile, oben sein Fähnchen
      ellipse(cx, cy + 1 * z, 5 * z, 2.2 * z, 'rgba(40,60,20,0.15)');
      g.fillStyle = C('#8a5a3c'); g.fillRect(cx - 0.9 * z, cy - 26 * z, 1.8 * z, 26 * z);
      poly([[cx - 1 * z, cy - 19 * z], [cx + 9 * z, cy - 19 * z], [cx + 12 * z, cy - 16.5 * z], [cx + 9 * z, cy - 14 * z], [cx - 1 * z, cy - 14 * z]], C(col));
      poly([[cx + 1 * z, cy - 12 * z], [cx - 9 * z, cy - 12 * z], [cx - 12 * z, cy - 9.5 * z], [cx - 9 * z, cy - 7 * z], [cx + 1 * z, cy - 7 * z]], C('#e9d8b4'));
      g.fillStyle = C(shade(col, -0.35)); g.fillRect(cx + 1 * z, cy - 17 * z, 7 * z, 0.8 * z);
      g.fillStyle = C('#a5835f'); g.fillRect(cx - 8 * z, cy - 10 * z, 7 * z, 0.8 * z);
      svFlag(cx, cy - 33 * z, z, s);
      break;
    }
    case 'blume': {                                                      // Inselblume im Topf, Blüten in seiner Farbe
      ellipse(cx, cy + 1 * z, 7 * z, 3 * z, 'rgba(40,60,20,0.15)');
      poly([[cx - 6 * z, cy - 8 * z], [cx + 6 * z, cy - 8 * z], [cx + 4.4 * z, cy], [cx - 4.4 * z, cy]], C('#d9825b'));
      ellipse(cx, cy - 8 * z, 6 * z, 2 * z, C('#a8764c'));
      g.strokeStyle = C('#4f9a45'); g.lineWidth = 1.2 * z; g.lineCap = 'round';
      const heads = [[-3.5, -17], [3.8, -19], [0, -24]];
      g.beginPath(); for (const [u, v] of heads) { g.moveTo(cx, cy - 8 * z); g.quadraticCurveTo(cx + u * 0.3 * z, cy + (v + 6) * z, cx + u * z, cy + v * z); } g.stroke();
      ellipse(cx - 2.5 * z, cy - 12 * z, 2.4 * z, 1 * z, C('#5aa84f')); ellipse(cx + 2.8 * z, cy - 13 * z, 2.4 * z, 1 * z, C('#5aa84f'));
      for (const [u, v] of heads) {
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; circle(cx + u * z + Math.cos(a) * 2.2 * z, cy + v * z + Math.sin(a) * 1.8 * z, 1.7 * z, C(i % 2 ? col : shade(col, 0.12))); }
        circle(cx + u * z, cy + v * z, 1.2 * z, C('#ffd23f'));
      }
      break;
    }
    case 'turm': {                                                       // Mini-Rathaus mit Dach in seiner Farbe und Fahne
      ellipse(cx, cy + 1 * z, 9 * z, 3.8 * z, 'rgba(40,60,20,0.15)');
      box(cx, cy, 7 * z, 3.6 * z, 9 * z, '#f2e6cf', shade(col, -0.05), 5 * z);
      const onL = (f, up, w, h, col) => { const x = cx - 7 * z + 7 * z * f, y = cy + 3.6 * z * f - up * z;   // auf der linken Wand
        poly([[x - w * z, y - 0.51 * w * z], [x + w * z, y + 0.51 * w * z], [x + w * z, y + 0.51 * w * z - h * z], [x - w * z, y - 0.51 * w * z - h * z]], C(col)); };
      const onR = (f, up, w, h, col) => { const x = cx + 7 * z * f, y = cy + 3.6 * z * (1 - f) - up * z;          // auf der rechten Wand
        poly([[x - w * z, y + 0.51 * w * z], [x + w * z, y - 0.51 * w * z], [x + w * z, y - 0.51 * w * z - h * z], [x - w * z, y + 0.51 * w * z - h * z]], C(col)); };
      onL(0.3, 4, 0.8, 2.2, '#8fc6e8'); onL(0.7, 4, 0.8, 2.2, '#8fc6e8');
      onR(0.5, 0, 1, 4.2, '#6b4f3a');
      g.strokeStyle = C('#8a8f99'); g.lineWidth = 0.8 * z;
      g.beginPath(); g.moveTo(cx, cy - 14 * z); g.lineTo(cx, cy - 24 * z); g.stroke();
      svFlag(cx, cy - 24 * z, z, s, 5.5);
      break;
    }
    default: {                                                           // Freundschaftsbäumchen mit Herzen in seiner Farbe
      tree(cx, cy + 1 * z, z * 0.8, 0.3, null);
      for (const [u, v] of [[-4.2, -12.5], [3.8, -10.5], [0.3, -16], [4.4, -17], [-3.4, -18.5]]) svHeart(cx + u * z, cy + v * z, 2.2 * z, C(col));
      break;
    }
  }
}
// Vorschau auf einer kleinen Leinwand (Album, Auswahl beim Schicken)
function svPreview(cv, s, z = 2.2) {
  const c = cv.getContext && cv.getContext('2d');
  if (!c) return;
  const og = g;
  g = c;
  try { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); drawSouvenir(cv.width / 2, cv.height - 6 * z, z, s); }
  finally { g = og; }
}
const svCanvas = (s, w = 72, h = 80) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.className = 'sv-pic'; svPreview(cv, s); return cv; };

// --- Schicken ---
const svSentToday = uid => !!((frLS('sv_' + dayKey()) || {})[uid]);
function svMine(k) {                                                      // so sieht mein Souvenir beim Freund aus
  const L = typeof meLook === 'function' ? meLook() : null;
  return { k, c: state.town.color, s: state.town.symbol, n: myNick(), t: state.town.name, a: L ? L.a : 0 };
}
function svCompose(friendUid, name) {
  if (viewOnly()) { cloudBlocked(); return; }
  if (svSentToday(friendUid)) { toast(`🎁 ${name} hat heute schon ein Souvenir von dir – morgen wieder`); return; }
  let k = SV_KINDS[0].id;
  const draw = () => {
    openModal(`<h2>🎁 Souvenir für ${escHtml(name)}</h2>
      <p class="muted">Etwas zum Aufstellen, in den Farben deiner Insel und mit deinem Namen. Kostenlos, eins am Tag für jeden Freund.</p>
      <div class="sv-pick">${SV_KINDS.map(q => `<button class="look sv-opt${q.id === k ? ' on' : ''}" data-svk="${q.id}" aria-pressed="${q.id === k}"><span data-svpic="${q.id}"></span><small>${escHtml(q.name)}</small></button>`).join('')}</div>
      <p><b>${escHtml(svKind(k).name)}</b> – ${escHtml(svKind(k).desc)}</p>
      <div class="row"><button class="btn ghost" id="m-close">Abbrechen</button><button class="btn" id="sv-send" style="flex:1">🎁 Schicken</button></div>`);
    for (const el of document.querySelectorAll('[data-svpic]')) el.append(svCanvas(svMine(el.dataset.svpic), 60, 66));
    for (const b of document.querySelectorAll('[data-svk]')) b.onclick = () => { k = b.dataset.svk; draw(); };
    $('m-close').onclick = () => openFriends();
    $('sv-send').onclick = () => svSend(friendUid, name, k);
  };
  draw();
}
let svBusy = false;
async function svSend(friendUid, name, k) {
  if (svBusy || viewOnly()) return;
  if (svSentToday(friendUid)) { toast(`🎁 ${name} hat heute schon ein Souvenir von dir – morgen wieder`); return; }
  svBusy = true;
  if ($('sv-send')) $('sv-send').disabled = true;
  try {
    const me = svMine(k), a = await friendAnimal(cloudUser.uid).catch(() => me.a);
    await cloudApi.set(`mail/${friendUid}/s${Date.now().toString(36)}${cloudUser.uid.slice(0, 6)}`,
      { from: cloudUser.uid, n: me.n, a, at: cloudApi.TS(), sv: { k, c: me.c, s: me.s, t: String(me.t || '').slice(0, 30) } });
    bondAdd(cloudUser.uid, friendUid, BOND_PTS.mail);
    const log = frLS('sv_' + dayKey()) || {}; log[friendUid] = 1; frLS('sv_' + dayKey(), log);
    closeModal(); toast(`🎁 ${svKind(k).name} an ${name} ist unterwegs`); sfx('deco');
  } catch (e) {
    toast(mailFailText(friendUid));
    if ($('sv-send')) $('sv-send').disabled = false;
  } finally { svBusy = false; }
}
// Abgeholt (mailClaim): ins Regal. Absender-Daten sind fremd – streng prüfen (svClean)
function svReceive(id, m) {
  const s = svClean([{ id, k: m.sv.k, c: m.sv.c, s: m.sv.s, t: m.sv.t, from: m.from, n: m.n, a: m.a, at: +m.at || Date.now() }])[0];
  if (!s || svById(id)) return null;
  state.souvenirs.push(s);
  return s;
}

// --- Sammelregal (Album) und Aufstellen ---
function svShelfHtml() {
  const list = [...(state.souvenirs || [])].sort((p, q) => (q.at || 0) - (p.at || 0)), placed = svPlaced();
  const when = s => s.at ? new Date(s.at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : '';
  return `<div class="album-page sv-shelf"><div class="label">🎁 Souvenirs von Freunden · ${list.length}</div>
    ${list.length ? `<div class="sv-grid">${list.map(s => `<div class="sv-e"><span data-svshelf="${escHtml(s.id)}"></span><b>${escHtml(svKind(s.k).name)}</b>
      <small>von ${escHtml(s.n)}${s.t ? ` · ${escHtml(s.t)}` : ''}<br>${when(s)}</small>
      ${placed.has(s.id) ? '<small class="ok">✓ steht auf deiner Insel</small>' : `<button class="btn small" data-svput="${escHtml(s.id)}">Aufstellen</button>`}</div>`).join('')}</div>`
      : '<p class="muted">Noch keine. Souvenirs gibt es nur geschenkt: Freunde schicken sie dir unter 🌐 → Freunde → 🎁 – du ihnen auch.</p>'}</div>`;
}
function wireSvShelf(card) {
  for (const el of card.querySelectorAll('[data-svshelf]')) el.append(svCanvas(svById(el.dataset.svshelf)));
  for (const b of card.querySelectorAll('[data-svput]')) b.onclick = () => svPut(b.dataset.svput);
}
function svPut(id) {
  if (viewOnly()) { cloudBlocked(); return; }
  if (!svFree(id)) { toast('🎁 Das steht schon auf deiner Insel'); return; }
  closeModal();
  svPick = id;
  setTool('souvenir');
  toast(`🎁 ${svName(svById(id))}: tippe eine freie Ecke an`);
}
// nach dem Aufstellen (buildSmall): fertig, zurück zum Ansehen
function svPutDone() { svPick = null; setTool('look'); }
