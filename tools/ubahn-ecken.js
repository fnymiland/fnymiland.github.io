// Prüfbild (Nutzer, 09.10.2026: „die Mauerecken sind Schrott – schau dir alle 3 Modelle an“): die drei Formen der U-Bahn-Station in
// allen vier Drehungen, groß gezeichnet (ohne Welt). Im Browser:
// fetch('tools/ubahn-ecken.js').then(r => r.text()).then(t => (0, eval)(t)); await ubahnEcken('ubahn-ecken.png')
window.ubahnEcken = async (name = 'ubahn-ecken.png', z = 7) => {
  const CW = 520, CH = 460, sheet = document.createElement('canvas');
  sheet.width = CW * 4 + 50; sheet.height = CH * 3 + 140;
  const sx = sheet.getContext('2d'); sx.fillStyle = '#fffaf0'; sx.fillRect(0, 0, sheet.width, sheet.height);
  const forms = DECO_LOOKS.ubahn.forms;
  const g0 = g;
  try {
    forms.forEach((f, fi) => {
      for (let r = 0; r < 4; r++) {
        const c = document.createElement('canvas'); c.width = CW; c.height = CH;
        g = c.getContext('2d');
        g.fillStyle = '#9fd47a'; g.fillRect(0, 0, CW, CH);
        drawUbahn(CW / 2, CH * 0.68, z, { b: 'ubahn', lvl: 1, rot: r, form: fi });
        const X = r * (CW + 15) + 5, Y = fi * (CH + 45) + 45;
        sx.drawImage(c, X, Y);
        sx.font = '800 26px Nunito, system-ui'; sx.fillStyle = '#6b4f3a'; sx.fillText(`${f.name} · Drehung ${r}`, X + 6, Y - 10);
      }
    });
  } finally { g = g0; }
  const url = sheet.toDataURL('image/png');
  try { const r = await fetch('http://127.0.0.1:4181/' + name, { method: 'POST', body: url }); return await r.text(); } catch (e) { return 'kein Sammler'; }
};
