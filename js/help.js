'use strict';
// ---------------------------------------------------------------------------
// Hilfe am Ort (Block 92): Was man nicht versteht, antippt man dort, wo es steht – Material („Woher?“), Wünsche der
// Häuser, Begriffe. Es erscheint eine kleine Sprechblase mit 2–3 Sätzen und Knöpfen („Zeig mir“, „Bauen“, „Mehr“).
// Dazu das Nachschlagebuch mit Suche („Was ist …?“). Rohstoffe und Gebäude werden aus den Spieldaten erzeugt, damit
// sie immer stimmen; Begriffe und Wünsche stehen unten als Text.
// Antippbar macht man etwas mit data-help="res:metall" | "wish:markt" | "term:viertel" | "b:schmiede" (helpAttr).
// ---------------------------------------------------------------------------
const helpAttr = key => `data-help="${key}"`;
const lxLink = (key, label) => `<span class="link lx" data-lx="${key}">${label}</span>`;
const bLink = id => ITEMS[id] ? lxLink('b:' + id, ITEMS[id].name) : id;
const resLink = r => lxLink('res:' + r, `${RES[r].icon} ${RES[r].name}`);
// Wo steht es im Baumenü?
function menuPath(id) {
  for (const m of MENU) {
    if (m.groups) { const g = m.groups.find(gr => gr.items.includes(id)); if (g) return `${m.label} → ${g.label}`; }
    else if (m.items.includes(id)) return m.label;
  }
  return '';
}
// Wo man ein Ding bauen darf (Gelände)
const NEEDS_NOTE = { forest: 'nur im Wald', rock: 'nur auf Fels', erz: 'nur am Erzberg', kristall: 'nur auf Kristallfels (Kristallinsel)',
  obst: 'nur im Wilden Obsthain', shore: 'am Wasser', strand: 'auf Sand am Wasser', boot: 'auf dem Wasser am Ufer', meer: 'im Meer', offshore: 'im Meer' };
const needsNote = d => [d.far ? 'nur auf fernen Inseln' : NEEDS_NOTE[d.needs] || ''].filter(Boolean).join(', ');
const lockNote = id => available(id) ? '' : ` <span class="muted">(🔒 ${unlockText(ITEMS[id], true)})</span>`;
const BUILDABLE = () => MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items);

// --- Rohstoffe: woher, wofür ---------------------------------------------------------------
const resMakers = r => BUILDABLE().filter(id => ITEMS[id].prod && ITEMS[id].prod[r]);
const resConverters = r => BUILDABLE().filter(id => ITEMS[id].conv && ITEMS[id].conv.to === r);
function resWhere(r, deep = true) {
  const out = [];
  for (const id of resMakers(r)) { const n = needsNote(ITEMS[id]); out.push(`<b>${bLink(id)}</b>${n ? ' – ' + n : ''}${lockNote(id)}`); }
  for (const id of resConverters(r)) {
    const from = ITEMS[id].conv.from;
    out.push(`<b>${bLink(id)}</b> macht es aus ${resLink(from)} (${CONV_RATIO} ${RES[from].icon} → 1 ${RES[r].icon})${lockNote(id)}`);
    if (deep) out.push(...resWhere(from, false).map(s => `${RES[from].icon} ${RES[from].name}: ${s}`));
  }
  return out;
}
function resUses(r) {
  const b = BUILDABLE().filter(id => ITEMS[id].mat && ITEMS[id].mat[r]).map(id => ITEMS[id].name);
  const h = HOUSE_STAGES.filter(st => st.mat && st.mat[r]).map(st => `Haus → ${st.name}`);
  const s = Object.keys(SHOPS).filter(id => SHOPS[id].ware === r).map(id => `${ITEMS[id].name} (verkauft)`);
  return [...h, ...b, ...s];
}
// Das Gebäude, zu dem „Zeig mir“ führt: erst eins, das man bauen darf (Veredler vor Rohstoff-Betrieb, damit man die Kette sieht)
const resShow = r => { const all = [...resConverters(r), ...resMakers(r)]; return all.find(available) || all[0] || null; };

// --- Wünsche der Häuser ----------------------------------------------------------------------
const WISH_HELP = {
  weg:     { name: 'Weg vor der Tür', text: 'Ein Weg muss direkt an das Haus grenzen – an irgendeiner Seite. Zieh einfach ein Stück Weg daneben.', build: ['weg'] },
  deko:    { name: 'Deko in der Nähe', text: 'Irgendeine Deko höchstens 2 Felder vom Haus entfernt: Baum, Busch, Blumentopf, Bank … Auch eine Hecke, ein Zaun oder eine Mauer zählen.', build: ['blumentopf', 'baum', 'busch', 'hecke'] },
  baecker: { name: 'Bäckerei erreichbar', text: 'Eine Bäckerei höchstens 6 Felder entfernt – oder weiter weg, wenn sie über Wege verbunden ist (im selben Viertel) oder mit der Bahn erreichbar.', build: ['baecker'] },
  ruhe:    { name: 'Ruhe', text: 'Direkt neben dem Haus darf kein lauter Betrieb stehen: Sägewerk, Steinmetz, Schmiede, Werkstatt, Steinbruch, Holzfäller, Bergwerk oder Kristallmine. Schieb ihn mit ✋ ein Stück weg.' },
  markt:   { name: 'Marktplatz erreichbar', text: 'Ein Marktplatz entsteht, wenn auf zusammenhängenden Wegfeldern mindestens 3 Marktstände stehen (Obst, Blumen, Brot …) – die Stände stellst du direkt auf den Weg. Er muss höchstens 8 Felder entfernt oder über Wege/Bahn erreichbar sein.', build: ['stand_obst', 'stand_blumen', 'stand_brot'], term: 'marktplatz' },
  park:    { name: 'Park oder Brunnen erreichbar', text: 'Ein Brunnen oder ein Park höchstens 4 Felder entfernt, oder über Wege verbunden. Einen Park legst du aus Parkrasen an und stellst Deko darauf (ab 4 Feldern mit 3 Deko).', build: ['brunnen', 'parkrasen'], term: 'park' },
  schule:  { name: 'Schule erreichbar', text: 'Eine Schule höchstens 10 Felder entfernt – oder über Wege/Bahn erreichbar.', build: ['schule'] },
  schoen:  { name: 'Schöne Umgebung', text: 'Rund ums Haus (3 Felder) müssen zusammen 🌸 30 Schönheit stehen. Blumenbeete, Bäume, Brunnen und andere Deko bringen Schönheit, laute Betriebe nehmen sie weg.', build: ['blumen', 'brunnen', 'baum'], term: 'schoenheit' },
  wasser:  { name: 'Blick aufs Wasser', text: 'Ein Teich, See, Fluss oder das Meer höchstens 3 Felder entfernt. Einen Teich kannst du selbst graben.', build: ['graben'] },
  laden:   { name: 'Laden erreichbar', text: 'Irgendein Laden (Kiosk, Blumenladen, Friseur, Post …) höchstens 8 Felder entfernt – oder über Wege/Bahn erreichbar.', build: ['kiosk', 'blumenladen'] },
  cafe:    { name: 'Café erreichbar', text: 'Ein Café, Teeladen, Bubble Tea, Eisdiele, Konditorei oder Chocolaterie höchstens 8 Felder entfernt – oder über Wege/Bahn erreichbar.', build: ['cafe', 'eisdiele', 'teeladen'] },
  kultur:  { name: 'Kultur erreichbar', text: 'Ein Kino, Theater, Museum, eine Konzerthalle, ein Aquarium, Zoo oder Stadion höchstens 12 Felder entfernt – oder über Wege/Bahn erreichbar.', build: ['kino', 'theater', 'museum'] },
};

// --- Begriffe -------------------------------------------------------------------------------
const TERMS = {
  marktplatz: { icon: '🧺', name: 'Marktplatz', also: 'markt wochenmarkt marktstand stand',
    text: `Stell Marktstände (${menuPath('stand_obst')}) direkt auf einen Weg. Stehen auf zusammenhängenden Wegfeldern 3 Stände, ist es ein Marktplatz, ab 6 ein Wochenmarkt, ab 9 ein Großer Markt. Häuser wünschen sich einen Marktplatz in der Nähe; Läden ringsum verdienen mehr, und der Markt zieht Besucher an.` },
  viertel: { icon: '🏘️', name: 'Viertel', also: 'nachbarn bonus',
    text: 'Gebäude, die aneinandergrenzen oder über Wege verbunden sind, bilden ein Viertel. Ab 3, 8 und 15 Gebäuden arbeitet das ganze Viertel 10, 20 und 30 % besser. Wünsche wie „Bäckerei erreichbar“ zählen im ganzen Viertel.' },
  erreichbar: { icon: '🛤️', name: 'Erreichbar', also: 'laufweite nähe felder umkreis',
    text: 'Bei Wünschen wie „Bäckerei erreichbar (6 Felder, oder per Weg/Bahn)“ reicht entweder die Nähe – oder ein Weg, der beide verbindet (dann gehören sie zum selben Viertel), oder ein Bahnhof bei beiden.' },
  schnecke: { icon: '🐌', name: 'Weit weg vom Dorf', also: 'schnecke halb langsam',
    text: 'Die Schnecke heißt: Hier arbeiten die Leute nur halb, weil es weit bis zum Dorf ist. Ein Weg zum Dorf, Häuser in der Nähe (4 Felder) oder ein Bahnhof bringen volle Kraft.' },
  einwohner: { icon: '👥', name: 'Einwohner und Mitarbeiter', also: 'arbeiter mitarbeiter leute bewohner',
    text: 'Häuser bringen Einwohner. Betriebe brauchen freie Einwohner als Mitarbeiter (👷) – fehlen sie, bau mehr Häuser oder bau sie aus. Viele Ausbauten brauchen auch eine Mindestzahl an Einwohnern.' },
  lager: { icon: '📦', name: 'Lager und Rohstoffe', also: 'rohstoffe material vorrat',
    text: 'Holz, Stein, Erz & Co. sammeln sich im 📦 Lager (oben). Dort steht auch, wie viel pro Minute dazukommt. Tipp einen Rohstoff an, um zu sehen, woher er kommt. 🔒 Vorrat: Läden verkaufen nur, was darüber liegt.' },
  veredeln: { icon: '🔨', name: 'Veredeln', also: 'sägewerk steinmetz schmiede bretter pflastersteine metall',
    text: `Sägewerk, Steinmetz und Schmiede (${menuPath('saege')}) machen aus 2 Rohstoffen 1 Ware: Holz → Bretter, Stein → Pflastersteine, Erz → Metall. Die Waren brauchst du für Ausbauten, Laternen und große Gebäude.` },
  strom: { icon: '⚡', name: 'Strom', also: 'kraftwerk windrad energie',
    text: `Laternen, Werkstätten, Hafen, Sägewerk, Universität, Züge und Wunderwerke brauchen Strom. Kraftwerke stehen unter ${menuPath('windrad')} – egal wo. Ohne Strom laufen Gebäude nur halb und Laternen bleiben nachts dunkel. Die Bilanz steht im 📦 Lager.` },
  schoenheit: { icon: '🌸', name: 'Schönheit', also: 'schön deko hübsch',
    text: 'Deko, Beete, Bäume und Brunnen bringen Schönheit 🌸 (neben Häusern sogar mehr), laute Betriebe nehmen sie weg. Häuser und manche Ausbauten wünschen sich eine schöne Umgebung.' },
  ausbauen: { icon: '✨', name: 'Ausbauen', also: 'stufe wachsen funkeln upgrade',
    text: 'Häuser und Betriebe wachsen in Stufen. Tipp sie an: Dort steht, was für die nächste Stufe fehlt. Sind alle Bedingungen erfüllt, funkelt es ✨ – dann „Ausbauen“. Im Rathaus unter „Zu tun“ siehst du alles auf einmal.' },
  park: { icon: '🌳', name: 'Park', also: 'parkrasen grünanlage stadtpark',
    text: 'Zieh Parkrasen auf und stell Deko darauf: ab 4 Feldern mit 3 Deko eine Grünanlage, ab 9 Feldern mit 8 Deko (Baum und Bank) ein Park, ab 16 Feldern mit 15 Deko (dazu Wasser) ein Stadtpark. Parks machen die Umgebung schön und erfüllen den Wunsch „Park erreichbar“.' },
  forschung: { icon: '💡', name: 'Ideen und Forschung', also: 'ideen schule bibliothek universität erfindung',
    text: 'Schulen bringen Ideen 💡. Oben bei 💡 forschst du damit: stärkere Betriebe, neue Gebäude, Bahn, Strom … Bibliothek und Universität öffnen weitere Stufen und Erfindungen.' },
  laternen: { icon: '🏮', name: 'Laternen und Sehenswürdigkeiten', also: 'laterne sehenswürdigkeit freischalten restaurieren',
    text: 'Jede Sehenswürdigkeit hat drei Laternen. Jede Laterne schaltet Neues frei. Oben links steht immer, welche als Nächstes geht – tipp sie an, dann siehst du, was dafür fehlt.' },
  inseln: { icon: '🏝️', name: 'Neue Inseln', also: 'insel steg boot expedition',
    text: `Bau einen Steg ans Ufer (${menuPath('bootssteg')}), tipp ihn an und schick das Boot los. Kommt es zurück, ist die Insel entdeckt – mit eigenen Rohstoffen und einer Sehenswürdigkeit.` },
  kunst: { icon: '🎨', name: 'Kunstakademie', also: 'farben muster design kaufen',
    text: 'Farben für Häuser, schöne Wege, Buschfarben und besondere Deko gibt es einzeln in der Kunstakademie: oben 💡 → 🎨 Kunstakademie.' },
  wunder: { icon: '🏛️', name: 'Wunderwerke', also: 'wunder riesenrad sternwarte schloss baustelle',
    text: `Große Bauprojekte (${menuPath('riesenrad')}): erst die Baustelle hinstellen, dann Abschnitt für Abschnitt bauen. Fertig bringen sie viel – z. B. mehr Taler oder mehr Ideen.` },
  hafen: { icon: '🚢', name: 'Hafen und Aufträge', also: 'frachter schiff verkaufen handel',
    text: 'Ab Stufe 2 (Handelshafen) legen Frachter mit Aufträgen an: Sie kaufen dir ab, was sich im Lager stapelt – oft für deutlich mehr, als es wert ist.' },
  bahn: { icon: '🚆', name: 'Eisenbahn', also: 'zug schiene bahnhof',
    text: 'Zieh Schienen zwischen zwei Orten und stell an beide Enden einen Bahnhof. Der Zug braucht Strom und fährt Pendler und Besucher – alles nah am Bahnhof gilt als „erreichbar“ wie mit einem Weg.' },
  vorplatz: { icon: '🧱', name: 'Vorplatz', also: 'gartenweg weg zur tür belag',
    text: 'Liegt ein Weg vor der Tür, führt ein Belag im Stil des Wegs bis zur Tür. Im Fenster des Gebäudes lässt er sich abschalten oder in einem anderen Muster legen.' },
};

// --- Einträge ------------------------------------------------------------------------------
// { title, text (HTML), show: Gebäude für „Zeig mir/Bauen“ }
function helpEntry(key) {
  const [kind, id] = key.split(':');
  if (kind === 'res' && RES[id]) {
    const R = RES[id], where = resWhere(id), uses = resUses(id);
    return { title: `${R.icon} ${R.name}`, show: resShow(id) ? [resShow(id)] : [],
      short: where.length ? `Woher: ${where.slice(0, 3).join('<br>')}` : 'Kommt von fernen Inseln.',
      text: `${where.length ? `<div class="label">Woher</div><ul>${where.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
        ${uses.length ? `<div class="label">Wofür</div><p>${uses.slice(0, 12).join(' · ')}${uses.length > 12 ? ' …' : ''}</p>` : ''}` };
  }
  if (kind === 'wish' && WISH_HELP[id]) {
    const W = WISH_HELP[id];
    return { title: `🏠 ${W.name}`, show: W.build || [], short: W.text, text: `<p>${W.text}</p>${W.term ? `<p>Mehr: ${lxLink('term:' + W.term, TERMS[W.term].name)}</p>` : ''}` };
  }
  if (kind === 'term' && TERMS[id]) { const T0 = TERMS[id]; return { title: `${T0.icon} ${T0.name}`, show: [], short: T0.text, text: `<p>${T0.text}</p>` }; }
  if (kind === 'b' && ITEMS[id]) {
    const d = ITEMS[id], tip = ITEM_TIPS[id], path = menuPath(id), n = needsNote(d);
    const makes = d.prod ? Object.keys(d.prod).map(resLink).join(', ') : d.conv ? `${resLink(d.conv.to)} aus ${resLink(d.conv.from)}` : '';
    return { title: d.name, show: [id], short: d.desc,
      text: `<p>${d.desc}</p>${tip && tip !== d.desc ? `<p class="muted">💡 ${tip}</p>` : ''}
        <p class="muted">${[costText({ money: d.cost, ...(d.mat || {}) }) || 'kostenlos', makes ? 'liefert ' + makes : '', n, path ? 'im Menü: ' + path : '',
          available(id) ? '' : '🔒 ' + unlockText(d)].filter(Boolean).join(' · ')}</p>` };
  }
  return null;
}
// Alle Einträge fürs Nachschlagen, nach Abschnitten
function helpSections() {
  return [
    ['📖 Begriffe', Object.keys(TERMS).map(k => 'term:' + k)],
    ['🏠 Wünsche der Häuser', Object.keys(WISH_HELP).map(k => 'wish:' + k)],
    ['📦 Rohstoffe und Waren', Object.keys(RES).map(k => 'res:' + k)],
    ...MENU.map(m => [m.label, (m.groups ? m.groups.flatMap(g => g.items) : m.items).filter(id => !ITEMS[id].variantOf).map(id => 'b:' + id)]),
  ];
}
const helpSearchText = key => { const e = helpEntry(key), [kind, id] = key.split(':'); return searchNorm([e.title, e.text.replace(/<[^>]+>/g, ' '), kind === 'term' ? TERMS[id].also : ''].join(' ')); };

// --- Sprechblase ---------------------------------------------------------------------------
let bubbleKey = null;
function closeBubble() { const el = document.getElementById('bubble'); if (el) el.remove(); bubbleKey = null; }
// Knopf „Zeig mir“/„Bauen“: das Ding zum Bauen auswählen – gesperrt: dorthin, wo man es freischaltet
function showBuild(id) {
  closeBubble();
  if (available(id)) { closePanel(); tryUnlock(id); return; }
  const go = unlockGo(ITEMS[ITEMS[id].variantOf || id]);
  if (go) go.go(); else toast('🔒 ' + unlockText(ITEMS[id]));
}
function openBubble(anchor, key) {
  closeBubble();
  const e = helpEntry(key);
  if (!e) return;
  bubbleKey = key;
  const [kind] = key.split(':');
  const btns = e.show.filter(id => ITEMS[id]).slice(0, 2).map(id => `<button class="btn small" data-hbuild="${id}">${available(id) ? (kind === 'res' ? 'Zeig mir: ' : 'Bauen: ') : '🔒 '}${ITEMS[id].name}</button>`);
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div id="bubble" role="dialog"><b class="bubble-title">${e.title}</b><p>${e.short}</p>
    <div class="bubble-row">${btns.join('')}<button class="btn ghost small" data-hmore="${key}">📚 Mehr</button></div></div>`;
  const el = wrap.firstChild;
  document.body.appendChild(el);
  for (const b of el.querySelectorAll('[data-hbuild]')) b.onclick = () => showBuild(b.dataset.hbuild);
  el.querySelector('[data-hmore]').onclick = () => { closeBubble(); openLexikon(key); };
  // über oder unter dem Angetippten, nie aus dem Bild
  const r = anchor.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight, bw = el.offsetWidth, bh = el.offsetHeight;
  const below = r.bottom + 8 + bh <= H - 8 || r.top - 8 - bh < 8;
  el.style.left = Math.max(8, Math.min(W - bw - 8, r.left + r.width / 2 - bw / 2)) + 'px';
  el.style.top = Math.max(8, below ? r.bottom + 8 : r.top - 8 - bh) + 'px';
  el.classList.add(below ? 'down' : 'up');
}
// Antippen von allem mit data-help (auch in Fenstern, die sich laufend neu zeichnen) bzw. eines Verweises (data-lx)
document.addEventListener('click', ev => {
  const h = ev.target.closest && ev.target.closest('[data-help]');
  if (h) { ev.stopPropagation(); ev.preventDefault(); if (bubbleKey === h.dataset.help) closeBubble(); else openBubble(h, h.dataset.help); return; }
  const l = ev.target.closest && ev.target.closest('[data-lx]');
  if (l) { ev.stopPropagation(); closeBubble(); openLexikon(l.dataset.lx); }
}, true);
document.addEventListener('pointerdown', ev => { if (bubbleKey && !ev.target.closest('#bubble, [data-help]')) closeBubble(); }, true);
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && bubbleKey) closeBubble(); });

// --- Nachschlagen ----------------------------------------------------------------------------
let lexQ = '';
function openLexikon(key = null, focus = false) {
  if (key) lexQ = '';
  const sec = helpSections();
  const html = `
    ${helpTop('lex')}
    <div id="lx-list">${sec.map(([name, keys]) => `<div class="lx-sec"><div class="label">${name}</div>
      ${keys.map(k => { const e = helpEntry(k); return e ? `<details class="lx-e" data-lxe="${k}"><summary>${e.title}</summary>${e.text}
        ${e.show.length && k.startsWith('b:') ? `<div class="row"><button class="btn small" data-hbuild="${e.show[0]}">${available(e.show[0]) ? 'Bauen' : '🔒 Freischalten'}</button></div>` : ''}</details>` : ''; }).join('')}</div>`).join('')}</div>
    <p class="muted lx-none" hidden>Nichts gefunden – versuch ein anderes Wort.</p>
    <div class="row"><button class="btn ghost" id="m-close" style="flex:1">Schließen</button></div>`;
  if (focus && !$('modal').hidden && $('lx-q')) { setHtml($('modal-card'), html, true); $('modal-card').className = 'card'; modalFrame($('modal-card')); }   // aus der Suche: Feld bleibt (iPad-Tastatur)
  else openModal(html);

  $('modal-card').classList.add('lexikon');
  const filter = () => {
    lexQ = $('lx-q').value;
    const q = searchNorm(lexQ.trim());
    let any = false;
    for (const s of document.querySelectorAll('#lx-list .lx-sec')) {
      let n = 0;
      for (const d of s.querySelectorAll('.lx-e')) { const hit = !q || helpSearchText(d.dataset.lxe).includes(q); d.hidden = !hit; if (hit) n++; }
      s.hidden = !n; any = any || n > 0;
    }
    document.querySelector('#modal-card .lx-none').hidden = any;
  };
  $('lx-q').oninput = filter;
  filter();
  if (focus) { const q = $('lx-q'); q.focus(); try { q.setSelectionRange(q.value.length, q.value.length); } catch (e) { /* type=search */ } }
  for (const b of document.querySelectorAll('#modal-card [data-hbuild]')) b.onclick = () => { closeModal(); showBuild(b.dataset.hbuild); };
  $('m-close').onclick = closeModal;
  const el = key && document.querySelector(`#modal-card [data-lxe="${key}"]`);
  if (el) { el.open = true; if (el.scrollIntoView) el.scrollIntoView({ block: 'center' }); el.classList.add('spot'); }
}
