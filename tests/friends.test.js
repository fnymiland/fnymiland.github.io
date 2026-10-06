const { loadGame, game } = require('./helpers/load-game');

// Block 96: Freunde auf der Insel – Figuren, Herzchen, Gästebuch, Päckchen mit Briefkasten (Datenbank-Attrappe wie live.test.js)
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
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("liveFollowStop(); cloudApi = makeTree(); cloudUser = { uid: 'u1', name: 'a@b.de', display: 'Anna Beispiel' }; cloudState = 'ok'; cloudLeadInfo = { dev: cloudDevice(), name: 'Mac', at: Date.now() }; myAnimal = null; visitorFigs.length = 0; bookAll = {}; mailAll = {}");
});
const tree = () => game('cloudApi.tree');

describe('Freunde auf der Insel (Block 96)', () => {
  it('Besucher erscheinen als Figur mit Namensschild und Aussehen, spazieren selbst herum; gehen sie, ist die Figur weg', async () => {
    game("setGuests({ f1: { a: 2, n: 'Ben', x: 5, y: 6, look: { shirt: 3, hat: 'krone', face: 'brille' } } })");
    expect(game('visitorFigs.length')).toBe(1);
    expect(game('visitorFigs[0].label')).toBe('Ben');
    expect(game('ANIMALS[visitorFigs[0].kind].id')).toBe('hase');
    expect(game('visitorFigs[0].hat')).toBe('krone');
    expect(game('visitorFigs[0].face')).toBe('brille');
    expect(game('visitorFigs[0].shirt')).toBe(game('SHIRTS[3]'));
    const f0 = game('[visitorFigs[0].px, visitorFigs[0].py]');
    game("setGuests({ f1: { a: 2, n: 'Ben', x: 40, y: 40, look: { hat: 'zylinder' } } })");  // neue Werte: Figur springt nicht
    expect(game('[visitorFigs[0].px, visitorFigs[0].py]')).toEqual(f0);
    expect(game('visitorFigs[0].hat')).toBe('zylinder');
    game("setGuests({ f1: { a: 2, n: 'Ben', look: { hat: 'quatsch', shirt: 999 } } })");     // Unsinn wird ignoriert
    expect(game('visitorFigs[0].hat')).toBe(null);
    expect(game('visitorFigs[0].shirt')).toBe(game('SHIRTS[0]'));
    game('setGuests({})');
    expect(game('visitorFigs.length')).toBe(0);
    game("setGuests({ me: { a: 1, n: 'Ich', x: 1, y: 1 } }, 'me')");                          // sich selbst nicht doppelt
    expect(game('visitorFigs.length')).toBe(0);
  });
  it('eigene Figur: kommt auf dem eigenen Gerät aus dem Spielstand (Block 97)', async () => {
    game("state.me = { a: 5, shirt: 4, hat: 'blume', fur: 2 }");
    expect(await game("friendAnimal('u1')")).toBe(5);
    expect(await game("friendLook('u1')")).toEqual({ fur: 2, shirt: 4, hat: 'blume', face: null, body: null, hand: null });
    expect(game("figFrom(0, { fur: 2 }, 'X').fur")).toBe(game('FUR[2]'));
    expect(() => game("figPreview(document.createElement('canvas'), figFrom(0, null, ''))")).not.toThrow();
  });
  it('Rathaus „Besuch“: Briefkasten, Herzen, Gästebuch, Besuche', () => {
    game(`bookAll = { h_f1_20261006: { k: 'h', n: 'Ben', a: 2, at: Date.now() }, gx1: { k: 'g', n: 'Ben', a: 2, t: 1, s: 3, at: Date.now() }, v_f1_20261006: { k: 'v', n: 'Ben', a: 2, at: Date.now() } };
      mailAll = { m1: { from: 'f1', n: 'Ben', a: 2, items: { holz: 50 } } }`);
    game("openTownHall('besuch')");
    const txt = game("document.getElementById('modal-card').textContent");
    expect(txt).toMatch(/Herzen · 1/);
    expect(txt).toMatch(/Dein Schloss ist der Hammer/);
    expect(txt).toMatch(/Von Ben/);
    expect(txt).toMatch(/Ben \(heute\)/);
    expect(game('mailWaiting()')).toBe(true);
  });
  it('Päckchen abholen: genau einmal ins Lager', async () => {
    game(`cloudApi.tree = { mail: { u1: { m1: { from: 'f1', n: 'Ben', a: 2, items: { holz: 50, gold: 9 } } } } }; mailAll = cloudApi.tree.mail.u1; state.res.holz = 10`);
    await game("mailClaim('m1')");
    expect(game('state.res.holz')).toBe(60);
    expect(game('state.res.gold')).toBe(undefined);                                          // Unbekanntes wird ignoriert
    expect(((tree().mail || {}).u1 || {}).m1).toBe(undefined);
    await game("mailClaim('m1')");                                                           // nochmal: nichts
    expect(game('state.res.holz')).toBe(60);
    expect(game('cloudMeta().acts')).toBeGreaterThan(0);                                     // wird gesichert
  });
  it('Päckchen schicken: geht vom eigenen Lager ab; klappt es nicht, kommt es zurück; höchstens 5 am Tag je Freund', async () => {
    game('state.res.holz = 100');
    await game("mailSend('f1', 'Ben', { holz: 40 })");
    expect(game('state.res.holz')).toBe(60);
    const m = Object.values(tree().mail.f1)[0];
    expect(m.items).toEqual({ holz: 40 });
    expect(m.from).toBe('u1');
    game("cloudApi.set = async () => { throw new Error('Permission denied'); }");
    await game("mailSend('f1', 'Ben', { holz: 10 })");
    expect(game('state.res.holz')).toBe(60);                                                 // zurück
    game(`frLS('mail_' + dayKey(), { f1: 5 }); mailCompose('f1', 'Ben')`);
    expect(game("document.getElementById('modal').hidden")).toBe(true);                      // kein Fenster mehr heute
  });
  it('beim Zuschauen kein Abholen und kein Schicken', async () => {
    game("cloudLeadInfo = { dev: 'ipad', name: 'iPad', at: Date.now() }");
    game(`cloudApi.tree = { mail: { u1: { m1: { from: 'f1', n: 'Ben', items: { holz: 5 } } } } }; state.res.holz = 0`);
    await game("mailClaim('m1')");
    expect(game('state.res.holz')).toBe(0);
    expect(tree().mail.u1.m1).toBeTruthy();
  });
  it('zu Besuch bei einem Freund: Besuch eingetragen, Herz und Gästebuch landen beim Besitzer', async () => {
    game("cloudUser = null; cloudApi.tree = { fr: { v1: { own1: { st: 'freund' } } } }; visitUser = { uid: 'v1', display: 'Vera Gast' }; visitOwner = 'own1'");
    await game('visitFriendCheck()'); await tick();
    expect(game('visitFriend')).toBe(true);
    const day = game('dayKey()');
    expect(tree().book.own1[`v_v1_${day}`].k).toBe('v');
    await game('visitHeart()');
    expect(tree().book.own1[`h_v1_${day}`].n).toBe('Vera');
    expect(game("document.getElementById('toast').textContent")).toMatch(/Herz dagelassen/);
    await game('visitHeart()');                                                               // zweites Mal: klare Meldung
    expect(game("document.getElementById('toast').textContent")).toMatch(/schon/);
    game('visitBook()'); game("document.querySelector('[data-bl=\"4\"]').click()"); game("document.getElementById('bk-send').click()"); await tick();
    const g = Object.values(tree().book.own1).find(e => e.k === 'g');
    expect(g.t).toBe(4);
  });
  it('kein Freund (nur über den Link): keine Figur, kein Herz, kein Gästebuch', async () => {
    game("cloudUser = null; cloudApi.tree = {}; visitUser = { uid: 'v2', display: 'X' }; visitOwner = 'own1'");
    await game('visitFriendCheck()');
    expect(game('visitFriend')).toBe(false);
    expect(tree().book).toBe(undefined);
  });
});
