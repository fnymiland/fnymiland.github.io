// Basar-Durchsicht: Blatt mit großen Zeichnungen einzelner Basar-Stücke (Tag und, mit nachts=true, mit Nachtlicht), zum Prüfen von Entwürfen.
// Im Spiel: (0, eval)(await (await fetch('tools/basar-blatt.js')).text()); basarBlatt(['sd_pfau', …], { z: 4, nachts: false }) → data-URL
window.basarBlatt = function basarBlatt(ids, { z = 4, nachts = false, cols = 3, cw = 360, ch = 360, art = null } = {}) {
  const rows = Math.ceil(ids.length / cols), c = document.createElement('canvas');
  c.width = cols * cw; c.height = rows * ch;
  const x = c.getContext('2d'), prev = g, nv = night;
  x.fillStyle = nachts ? '#1d2440' : '#eef5e6'; x.fillRect(0, 0, c.width, c.height);
  g = x; FOG = false;
  try {
    ids.forEach((id, i) => {
      const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch + ch * 0.72;
      night = nachts ? NIGHT_MAX : 0;
      diamond(cx, cy, TW / 2 * z, TH / 2 * z, nachts ? '#3c5a3a' : '#96d56f');
      if (art && art[id]) art[id](cx, cy, z); else drawObject(id, cx, cy, z, 1e6, 5, 5, 1, { b: id, rot: 0, slot: 0 });
      x.fillStyle = nachts ? '#fff' : '#333'; x.font = '600 16px system-ui'; x.fillText(ITEMS[id] ? ITEMS[id].name : id, cx - cw / 2 + 10, cy - ch * 0.72 + 22);
    });
  } finally { g = prev; night = nv; }
  return c.toDataURL();
};
window.basarZeigeBlatt = url => {
  let im = document.getElementById('blatt');
  if (!im) { im = document.createElement('img'); im.id = 'blatt'; im.style.cssText = 'position:fixed;inset:0;z-index:99999;width:100%;height:100%;object-fit:contain;background:#fff'; im.onclick = () => im.remove(); document.body.append(im); }
  im.src = url;
};
