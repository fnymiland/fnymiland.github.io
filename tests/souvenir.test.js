const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Block 129: Souvenirs statt Rohstoff-Geschenken; Rohstoffe nur für den Wunschzettel, der jetzt auch „unterwegs“ kennt
beforeAll(() => {
  loadGame();
  game(`window.makeTree = () => {
    const api = { tree: {}, watchers: [], updates: [] };
    const keys = p => p.split('/').filter(Boolean), clone = v => v === undefined ? null : JSON.parse(JSON.stringify(v));
    const getAt = p => keys(p).reduce((o, k) => (o == null ? undefined : o[k]), api.tree);
    const setAt = (p, v) => { const ks = keys(p); let o = api.tree; for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
      const last = ks[ks.length - 1]; if (v === null || v === undefined) delete o[last]; else o[last] = clone(v); };
    const notify = () => setTimeout(() => { for (const [p, cb] of api.watchers) cb(clone(getAt(p))); }, 0);
    Object.assign(api, {
      get: async p => clone(getAt(p)), set: async (p, v) => { setAt(p, v); notify(); },
      update: async o => { api.updates.push(o); for (const [p, v] of Object.entries(o)) setAt(p, v); notify(); },
      tx: async (p, fn) => { const n = fn(clone(getAt(p))); if (n === undefined) return { ok: false, val: clone(getAt(p)) }; setAt(p, n); notify(); return { ok: true, val: clone(n) }; },
      watch: (p, cb) => { const w = [p, cb]; api.watchers.push(w); setTimeout(() => cb(clone(getAt(p))), 0); return () => { api.watchers = api.watchers.filter(x => x !== w); }; },
      TS: () => Date.now(), now: () => Date.now(),
      leadTx: async () => ({ ok: false, cur: null }),
    });
    return api;
  }`);
});
const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true; svPick = null");
  game("socialUid = undefined; cloudUser = null; socialReset()");                       // Beobachter vom vorigen Test weg
  game("liveFollowStop(); cloudApi = makeTree(); cloudUser = { uid: 'u1', name: 'a@b.de', display: 'Anna Beispiel' }; cloudState = 'ok'; cloudLeadInfo = { dev: cloudDevice(), name: 'Mac', at: Date.now() }; myAnimal = null; bookAll = {}; mailAll = {}; myWish = null");
  game("frList = { f1: { st: 'freund', name: 'Ben · Benstadt', wid: 'w2' } }");
  game("for (let y = 3; y <= 6; y++) for (let x = 3; x <= 6; x++) { state.terra.set(x + ',' + y, 'grass'); state.tiles.delete(x + ',' + y); state.decos.delete(x + ',' + y); } recalc()");
});
const SV = (id, k = 'blume', c = '#e8604f') => ({ id, k, c, s: '⭐', from: 'f1', n: 'Ben', t: 'Benstadt', a: 2, at: 1e12 });

describe('Souvenirs (Block 129)', () => {
  it('Daten von anderen werden streng geprüft; Spielstand behält Souvenirs und aufgestellte', () => {
    const clean = game(`svClean([${JSON.stringify(SV('a'))}, { id: 'b', k: 'quatsch', c: '#000000' }, { id: 'c', k: 'statue', c: 'red' }, { id: 'd', k: 'statue', c: '#123456', s: '<b>', n: 'x'.repeat(99) }, ${JSON.stringify(SV('a'))}])`);
    expect(clean.map(s => s.id)).toEqual(['a', 'd']);
    expect(clean[1].s).toBe('🐟');                                                        // unbekanntes Symbol → Standard
    expect(clean[1].n.length).toBe(20);
    expect(game('svClean(null)')).toEqual([]);
    game(`state.souvenirs = [${JSON.stringify(SV('a'))}]; state.decos.set('4,4', [{ b: 'souvenir', rot: 0, sv: 'a' }, null, null, null, null, null, null, null, null])`);
    const back = game('parseSave(JSON.parse(JSON.stringify(serialize())))');
    expect(back.souvenirs.map(s => s.id)).toEqual(['a']);
    expect(back.decos.get('4,4')[0]).toMatchObject({ b: 'souvenir', sv: 'a' });
  });
  it('schicken: kostenlos, Farbe/Flagge der eigenen Insel, einmal am Tag je Freund', async () => {
    game("state.town.color = '#5f8fe8'; state.town.symbol = '⚓'; state.town.name = 'Annahafen'; const m0 = state.money; globalThis.__m0 = m0");
    await game("svSend('f1', 'Ben', 'schild')");
    const mails = Object.values(game("cloudApi.tree.mail.f1"));
    expect(mails.length).toBe(1);
    expect(mails[0]).toMatchObject({ from: 'u1', sv: { k: 'schild', c: '#5f8fe8', s: '⚓', t: 'Annahafen' } });
    expect(mails[0].items).toBeUndefined();
    expect(game('state.money === globalThis.__m0')).toBe(true);
    await game("svSend('f1', 'Ben', 'blume')");                                            // heute schon: nichts
    expect(Object.keys(game("cloudApi.tree.mail.f1")).length).toBe(1);
    expect(game("svSentToday('f1')")).toBe(true);
  });
  it('Briefkasten → abholen → Sammelregal → aufstellen (einmal) → abreißen legt es zurück', async () => {
    game(`cloudApi.tree.mail = { u1: { s1: { from: 'f1', n: 'Ben', a: 2, at: 1e12, sv: { k: 'turm', c: '#58b36a', s: '🍄', t: 'Benstadt' } } } }; mailAll = cloudApi.tree.mail.u1`);
    expect(game("friendsHallHtml('post')")).toContain('Mini-Rathaus');
    await game("mailClaim('s1')");
    expect(game('cloudApi.tree.mail.u1 && cloudApi.tree.mail.u1.s1')).toBeFalsy();
    expect(game('state.souvenirs')).toEqual([expect.objectContaining({ id: 's1', k: 'turm', c: '#58b36a', s: '🍄', n: 'Ben', from: 'f1' })]);
    await game("mailClaim('s1')");                                                         // schon abgeholt: nicht doppelt
    expect(game('state.souvenirs.length')).toBe(1);
    game('openAlbum()');
    expect(game("!!document.querySelector('[data-svput=\"s1\"]')")).toBe(true);
    expect(game("available('souvenir')")).toBe(false);                                    // nicht in der Leiste
    game("svPut('s1')");
    expect(game('[tool, svPick, available("souvenir")]')).toEqual(['souvenir', 's1', true]);
    expect(game("buildSmall('souvenir', 4, 4, 0)")).toBe(true);
    expect(game("state.decos.get('4,4')[0]")).toMatchObject({ b: 'souvenir', sv: 's1' });
    expect(game('[tool, svPick]')).toEqual(['look', null]);
    expect(game("svFree('s1')")).toBe(false);
    game("svPick = 's1'");
    expect(game("smallError('souvenir', 5, 5, 0)")).toBeTruthy();                         // steht schon
    game('svPick = null; openAlbum()');
    expect(game("document.querySelector('.sv-shelf').textContent")).toContain('steht auf deiner Insel');
    game("removeSmall(4, 4, 0)");
    expect(game("svFree('s1')")).toBe(true);
  });
  it('zeichnen: alle Arten und ein unbekanntes ohne Fehler; Bildchen-Schlüssel folgt Art und Farbe', () => {
    game(`state.souvenirs = ['statue', 'schild', 'blume', 'turm', 'baum'].map((k, i) => (${JSON.stringify(SV('x'))}, { ...${JSON.stringify(SV('x'))}, id: 's' + i, k }))`);
    game("state.decos.set('4,4', [0, 1, 2, 3].map(i => ({ b: 'souvenir', rot: 0, sv: 's' + i }))); state.decos.set('5,5', [{ b: 'souvenir', rot: 0, sv: 's4' }, { b: 'souvenir', rot: 0, sv: 'weg' }, null, null])");
    for (const [x, y, s] of [[4, 4, 0], [4, 4, 1], [4, 4, 2], [4, 4, 3], [5, 5, 0], [5, 5, 1]])
      expect(() => game(`drawObject('souvenir', 0, 0, 1, 0, ${x}, ${y}, 1, { rot: 0, slot: ${s} })`)).not.toThrow();
    const keys = [[4, 4, 0], [4, 4, 1], [4, 4, 2], [4, 4, 3], [5, 5, 0], [5, 5, 1]].map(([x, y, s]) => game(`decoVariant('souvenir', ${x}, ${y}, ${s})`));
    expect(new Set(keys).size).toBe(6);
    game("state.souvenirs[0].c = '#000000'");
    expect(game("decoVariant('souvenir', 4, 4, 0)")).not.toBe(keys[0]);
    expect(() => game("render(performance.now())")).not.toThrow();
  });
  it('nicht in Leiste, Suche, „zuletzt gebaut“, „Neu freigeschaltet“; kein Rechteck-Bauen', () => {
    game(`state.souvenirs = [${JSON.stringify(SV('a'))}]; svPick = 'a'`);
    expect(game('[...unlockKeys()]')).not.toContain('souvenir');
    expect(game("dragKind('souvenir')")).toBe(null);
    game("noteRecent('souvenir')");
    expect(game('recentList()')).not.toContain('souvenir');
    expect(game("MENU.flatMap(m => m.groups ? m.groups.flatMap(g => g.items) : m.items)")).not.toContain('souvenir');
  });
});

describe('Wunschzettel (Block 129)', () => {
  const T0 = Date.now();                                                 // frisch – ein Wunsch hängt nur 24 Stunden
  const wish = `{ r: 'holz', n: 1000, got: 200, at: ${T0} }`;
  it('Rohstoffe nur für einen Wunsch, höchstens was noch fehlt; „unterwegs“ zählt mit', async () => {
    game("state.res.holz = 5000; mailCompose('f1', 'Ben')");
    expect(game("$('modal').hidden")).toBe(true);                                         // ohne Wunsch: nichts
    game(`mailCompose('f1', 'Ben', ${wish})`);
    expect(game("$('modal-card').textContent")).toContain('fehlen noch 800');
    await game(`mailSend('f1', 'Ben', { holz: 500 }, ${wish})`);
    expect(Object.values(game('cloudApi.tree.mail.f1'))[0]).toMatchObject({ items: { holz: 500 }, wish: true });
    expect(game(`wishCovered('f1', ${wish})`)).toBe(700);
    game(`mailCompose('f1', 'Ben', ${wish})`);
    expect(game("$('modal-card').textContent")).toContain('fehlen noch 300');
    // der Freund hat abgeholt: nicht doppelt zählen
    expect(game(`wishCovered('f1', { r: 'holz', n: 1000, got: 700, at: ${T0} })`)).toBe(700);
    // anderer Wunsch: neu zählen
    expect(game(`wishCovered('f1', { r: 'holz', n: 1000, got: 0, at: ${T0 + 1} })`)).toBe(0);
  });
  it('genug geschickt: statt „Helfen“ ein Hinweis; keine 100.000er-Grenze in den Regeln', async () => {
    game(`cloudApi.tree.users = { u1: { profile: { code: 'ABCDE' }, pub: { wid: 'w1', open: false } } }; cloudApi.tree.worlds = { w2: { wish: ${wish} } }; cloudApi.tree.fr = { u1: frList }; state.res.holz = 5000`);
    await game(`mailSend('f1', 'Ben', { holz: 800 }, ${wish})`);
    game('openFriends()'); await tick(30);
    const t = game("$('modal-card').textContent");
    expect(t).toContain('du hast genug geschickt');
    expect(game("!!document.querySelector('[data-frhelp]')")).toBe(false);
    const rules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase-rules.json'), 'utf8')).rules.mail.$to.$id;
    expect(rules.items.$r['.validate']).not.toContain('100000 ');
    expect(Object.keys(rules.sv).sort()).toEqual(['$other', '.validate', 'c', 'k', 's', 't']);
  });
  it('Besitzer: Päckchen ohne Wunsch-Merker zählen auch; Abnehmen direkt; Briefkasten-Hinweis', async () => {
    game(`cloudApi.tree.users = { u1: { pub: { wid: 'w1' } } }; liveWid = 'w1'; cloudApi.tree.worlds = { w1: { owner: 'u1', wish: ${wish} } }; myWish = wishClean(${wish})`);
    game("mailAll = { m1: { from: 'f1', n: 'Ben', a: 0, items: { holz: 300 } } }; cloudApi.tree.mail = { u1: { m1: mailAll.m1 } }");
    expect(game('wishHtml()')).toContain('300 liegen schon in deinem Briefkasten');
    expect(game('wishHtml()')).toContain('data-wishoff');
    await game("mailClaim('m1')"); await tick(10);
    expect(game('cloudApi.tree.worlds.w1.wish.got')).toBe(500);
  });
});
