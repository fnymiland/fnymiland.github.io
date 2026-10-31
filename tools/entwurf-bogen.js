// Entwurfsbogen für Basar-Entwürfe: zeichnet Einträge eines ENTW_*-Objekts nebeneinander auf eine Leinwand und schickt das Bild an die
// Vorschau-Senke (python, 127.0.0.1:4181 → tools/vorschau/<name>.png). Im Spiel: (0, eval)(await (await fetch('tools/entwurf-bogen.js')).text())
window.sheet = (E, name, keys, { now = 4000, cols = 3, cw = 420, ch = 480, z = 3.6, nachts = false, fy = 0.84 } = {}) => {
  const rows = Math.ceil(keys.length / cols), c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch;
  const x = c.getContext('2d'), prev = g, nv = night, sp = SPRITE_PAINT;
  x.fillStyle = nachts ? '#1d2440' : '#eef5e6'; x.fillRect(0, 0, c.width, c.height); g = x; FOG = false; if (nachts) SPRITE_PAINT = true;
  const errs = [];
  try {
    keys.forEach((k, i) => {
      const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch + ch * fy; night = nachts ? NIGHT_MAX : 0;
      diamond(cx, cy, TW / 2 * z, TH / 2 * z, nachts ? '#3c5a3a' : '#96d56f');
      try { E[k](cx, cy, z, now); } catch (e) { errs.push(k + ': ' + e.message); }
      x.fillStyle = nachts ? '#fff' : '#333'; x.font = '600 16px system-ui'; x.textAlign = 'left'; x.fillText(k, cx - cw / 2 + 10, cy - ch * fy + 22);
    });
  } finally { g = prev; night = nv; SPRITE_PAINT = sp; }
  return fetch('http://127.0.0.1:4181/' + name + '.png', { method: 'POST', body: c.toDataURL() }).then(r => [r.status, errs]);
};
