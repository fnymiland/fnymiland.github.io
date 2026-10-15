const { loadGame, game } = require('./helpers/load-game');

// 160c G1 (karte-querschnitt.md:35, karte-C6-fenster.md:211): neue Brückenmaterialien werden sichtbar freigeschaltet – „Schaltet frei“ der
// Sehenswürdigkeit, Fenster „Neu freigeschaltet“ (Ausprobieren wählt das Material in der Leiste), Schloss in der Leiste (wählbar), Bau-Info,
// Nachschlagebuch. Sperren: Metall und Stein zwischen Anhöhen (Eisenbahn bzw. Windige Klippe), Kristall überall (Kristallhöhle)
beforeAll(() => loadGame());
beforeEach(() => {
  game("startNew(); closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; setTool('look'); state.money = 1e6; for (const r of Object.keys(RES)) state.res[r] = 9999");
  game("state.techs.add('terraform'); state.techs.delete('bahn'); state.restore.klippe = 0; state.restore.kristall = 0; if (state.legacy) for (const k of [...state.legacy]) if (k.startsWith('brmat:')) state.legacy.delete(k); resetUnlockWatch(); recalc()");
});
const $ = id => document.getElementById(id);

describe('Brückenmaterial freischalten (160c G1)', () => {
  it('„Schaltet frei“: die Windige Klippe nennt Stein-Brücken zwischen Anhöhen, die Kristallhöhle Kristall-Brücken', () => {
    expect(game("lmUnlockNames('klippe', 0)")).toContain('Brücken aus Stein zwischen Anhöhen');
    expect(game("lmUnlockNames('kristall', 0)")).toContain('Brücken aus Kristall');
    expect(game("lmUnlockNames('quelle', 0).some(n => /Brücken aus/.test(n))")).toBe(false);
  });
  it('Leiste: gesperrtes Material mit Schloss und Grund, wählbar; Stein: übers Wasser frei; nach dem Freischalten ohne Schloss', () => {
    game("setTool('bruecke'); lookPop = 'form'; renderStyleBar('bruecke')");
    const opt = i => game(`(() => { const b = document.querySelector('[data-lform="${i}"]'); return b ? [b.textContent.trim(), b.title] : null; })()`);
    expect(opt(0)).toEqual(['Holz', '']);
    expect(opt(2)[0]).toBe('🔒 Stein');
    expect(opt(2)[1]).toMatch(/übers Wasser frei/);
    expect(opt(3)[0]).toBe('🔒 Kristall');
    expect(opt(3)[1]).not.toMatch(/übers Wasser frei/);
    game('state.restore.klippe = 1; refreshLive && 0; updateHud()');
    game("lookPop = 'form'; renderStyleBar('bruecke')");
    expect(opt(2)).toEqual(['Stein', '']);
    expect(game("document.querySelector('[data-lpop=\"form\"]').getAttribute('aria-label')")).toMatch(/^Material: /);
    game("lookPop = null; setTool('look')");
  });
  it('„Neu freigeschaltet“: Karte für das neue Material; Ausprobieren nimmt das Werkzeug mit dem Material in der Leiste', () => {
    game('watchUnlocks(); closeModal()');                                   // gemerkt: das Bisherige
    expect(game("unlockKeys().has('brmat:kristall')")).toBe(false);
    game('state.restore.kristall = 1; watchUnlocks()');                     // die Kristallhöhle schaltet mehr frei – je Seite 4 Karten
    expect($('modal').hidden).toBe(false);
    const alle = game("[...document.querySelectorAll('#modal-card [data-try]')].map(b => b.dataset.try).concat(pendingUnlocks)");
    expect(alle).toContain('brmat:kristall');
    game("closeModal(); pendingUnlocks.length = 0; openModal(unlockCard('brmat:kristall')); document.querySelector('#modal-card [data-try]').onclick = e => tryUnlock(e.target.dataset.try)");
    expect($('modal-card').textContent).toContain('Neues Brückenmaterial: Kristall');
    game("document.querySelector('#modal-card [data-try=\"brmat:kristall\"]').click()");
    expect(game('tool')).toBe('bruecke');
    expect(game('bkArtNew()')).toBe('kristall');
    game("closePanel(); setTool('look')");
  });
  it('kommt die Brücke selbst gerade dazu (Gelände formen), keine eigenen Karten für ihre Materialien', () => {
    game("state.techs.delete('terraform'); state.restore.kristall = 1; resetUnlockWatch(); recalc(); watchUnlocks(); closeModal()");
    game("state.techs.add('terraform'); recalc(); watchUnlocks()");
    const txt = game("document.getElementById('modal-card').textContent");
    expect(txt).not.toContain('Neues Brückenmaterial');
    game('closeModal()');
  });
  it('Bau-Info: gewähltes Material gesperrt → Schloss mit Grund; „gebaut“ zählt Brücken zwischen Anhöhen', () => {
    game("state.paintNew.bruecke = { form: 3 }; openBuildInfo('bruecke')");
    expect(game("[...document.querySelectorAll('#panel .status .bad')].map(e => e.textContent).join()")).toMatch(/🔒 Kristall: erst mit/);
    game("state.bruecken.set('14,12', { ax: 0, n: 2, art: 'holz' }); state.paintNew.bruecke = { form: 0 }; openBuildInfo('bruecke')");
    expect(game("[...document.querySelectorAll('#panel .status .bad')].map(e => e.textContent).join()")).not.toMatch(/🔒/);
    expect($('panel').textContent).toContain('1 gebaut');
    game('state.bruecken.clear(); closePanel()');
  });
  it('Nachschlagebuch: Preis je Feld in allen vier Materialien, gesperrte mit Schloss; „Wofür“ jedes Rohstoffs nennt die Brücke', () => {
    const e = game("helpEntry('b:bruecke').text");
    for (const m of ['Holz', 'Metall', 'Stein', 'Kristall']) expect(e).toContain(m + ' 🪙');
    expect(e).toMatch(/Kristall 🪙[^·]*🔒/);
    for (const r of ['bretter', 'metall', 'quader', 'kristall']) expect(game(`resUses('${r}')`), r).toContain('Brücke');
  });
});
