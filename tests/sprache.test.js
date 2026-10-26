const fs = require('fs');
const path = require('path');

// Spieltexte ohne Gedankenstrich (Nutzer 26.10.2026: „überprüfe das ganze Spiel auf KI-Sprache, also Gedankenstriche usw.“).
// Gedankenstriche „ – “ wirken in Texten maschinell; statt dessen Punkt, Komma, Doppelpunkt oder Klammer. Erlaubt bleiben
// Bindestriche in Wörtern und Bereiche ohne Leerzeichen („3–5“). Kommentare im Code zählen nicht.
const ROOT = path.join(__dirname, '..');
const files = () => {
  const out = [];
  const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (p.endsWith('.js')) out.push(p); } };
  walk(path.join(ROOT, 'js'));
  return out;
};
// Kommentare ausblenden (Zeilen bleiben erhalten): Zeichen für Zeichen mitlesen, ob wir in '…', "…", `…` (samt ${…}) oder
// in einem Kommentar stehen – Kommentare dürfen Anführungszeichen enthalten, Texte dürfen „//“ enthalten (https://…)
const stripComments = src => {
  let out = '', i = 0;
  const stack = [];                                   // offene Texte: "'", '"', '`' oder '{' (Platzhalter in einer Schablone)
  while (i < src.length) {
    const c = src[i], d = src[i + 1], top = stack[stack.length - 1];
    if (top === "'" || top === '"' || top === '`') {
      if (c === '\\') { out += c + (d || ''); i += 2; continue; }
      if (top === '`' && c === '$' && d === '{') { stack.push('{'); out += '${'; i += 2; continue; }
      if (c === top) stack.pop();
      out += c; i++; continue;
    }
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2), end = e < 0 ? src.length : e + 2; out += src.slice(i, end).replace(/[^\n]/g, ' '); i = end; continue; }
    if (c === '/' && /(^|[(,=:[!&|?{};+\-*%<>~^]|\breturn|\btypeof)\s*$/.test(out.slice(-12))) {   // regulärer Ausdruck (enthält oft ' oder ")
      let j = i + 1, cls = false;
      while (j < src.length && src[j] !== '\n') { const r = src[j]; if (r === '\\') { j += 2; continue; } if (r === '[') cls = true; else if (r === ']') cls = false; else if (r === '/' && !cls) break; j++; }
      out += src.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === "'" || c === '"' || c === '`') stack.push(c);
    else if (c === '{' && top === '{') stack.push('{');
    else if (c === '}' && top === '{') stack.pop();
    out += c; i++;
  }
  return out;
};

describe('Sprache der Spieltexte', () => {
  it('kein Gedankenstrich „ – “ in Texten, die man im Spiel sieht', () => {
    const hits = [];
    for (const f of files()) {
      const code = stripComments(fs.readFileSync(f, 'utf8'));
      code.split('\n').forEach((l, i) => { if (/\s–\s|[^\s\d]–\s|\s–[^\s\d]/.test(l)) hits.push(`${path.relative(ROOT, f)}:${i + 1}: ${l.trim().slice(0, 100)}`); });
    }
    expect(hits).toEqual([]);
  });

  it('auch nicht in index.html (sichtbare Texte, aria-label, title)', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    expect(html.match(/[^\n]*\s–\s[^\n]*/g) || []).toEqual([]);
  });
});
