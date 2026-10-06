const { loadGame, game } = require('./helpers/load-game');

// Block 105: Füreinander – Freundschaftsstufen, Wunschzettel mit Danke, Partnerstadt (Datenbank-Attrappe wie friends.test.js)
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
  game("liveFollowStop(); cloudApi = makeTree(); cloudUser = { uid: 'u1', name: 'a@b.de', display: 'Anna Beispiel' }; cloudState = 'ok'; cloudLeadInfo = { dev: cloudDevice(), name: 'Mac', at: Date.now() }; myAnimal = null; visitorFigs.length = 0; bookAll = {}; mailAll = {}; myBonds = {}; myWish = null; wishWid = null; liveWid = null; frList = {}; state.bond = 0; state.partner = null");
});
const tree = () => game('cloudApi.tree');

describe('Füreinander (Block 105)', () => {
  it('Freundschaft: Punkte → Herzen; Empfangenes zählt genau einmal; höchste Stufe schaltet Belohnungen frei', async () => {
    expect(game('[0, 3, 10, 25, 50, 100].map(bondLevel)')).toEqual([0, 1, 2, 3, 4, 5]);
    await game("bondAdd('u1', 'f1', 2)"); await game("bondAdd('u1', 'f1', 2)");
    expect(tree().users.u1.bonds.f1.p).toBe(4);
    game("bookAll = { a: { k: 'g', from: 'f1', n: 'Ben', at: 100 }, b: { k: 'h', from: 'f1', n: 'Ben', at: 200 } }");
    game("bondFromBook('u1')"); await tick(); game("bondFromBook('u1')"); await tick();
    expect(tree().users.u1.bonds.f1.p).toBe(4 + 2 + 1);                                     // nicht doppelt
    expect(game("available('freundesbank')")).toBe(false);
    expect(game("wearOk('band')")).toBe(false);
    game("myBonds = { f1: { p: 60 } }; bondSync()");
    expect(game('state.bond')).toBe(4);
    expect(game("available('freundesbank')")).toBe(true);
    expect(game("available('freundschaftsbaum')")).toBe(false);
    expect(game("wearOk('band') && wearOk('herzballon')")).toBe(true);
    game("myBonds = { f1: { p: 3 } }; bondSync()");
    expect(game('state.bond')).toBe(4);                                                     // wird nie kleiner
  });
  it('Wunschzettel: aushängen, Freund hilft mit Päckchen, Abholen füllt den Wunsch, Danke und Freundschaft', async () => {
    await game("wishSet('bretter', 200)");
    const wid = game('liveWid');
    expect(tree().worlds[wid].wish).toMatchObject({ r: 'bretter', n: 200, got: 0 });
    expect(tree().worlds[wid].owner).toBe('u1');
    game("myWish = wishClean(cloudApi.tree.worlds[liveWid].wish); wishWid = liveWid; openTownHall('overview')");
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Wunschzettel.*0 \/ 200/s);
    // Freund f1 schickt 150 Bretter für den Wunsch (hier als fertiges Päckchen im Briefkasten)
    game(`cloudApi.tree.mail = { u1: { m1: { from: 'f1', n: 'Ben', a: 2, items: { bretter: 150 }, wish: true, at: 5 } } }; mailAll = cloudApi.tree.mail.u1; state.res.bretter = 0`);
    await game("mailClaim('m1')"); await tick(20);
    expect(game('state.res.bretter')).toBe(150);
    expect(tree().worlds[wid].wish.got).toBe(150);
    expect(tree().book.f1.d_u1_m1.k).toBe('d');                                             // Danke an den Helfer
    expect(tree().users.u1.bonds.f1.p).toBe(3);                                             // Wunsch-Hilfe zählt am meisten
  });
  it('Freund hilft: Fenster zeigt seinen Wunsch, „Helfen“ füllt die fehlende Menge vor, das Päckchen trägt die Wunsch-Markierung', async () => {
    game(`frList = { f1: { st: 'freund', name: 'Ben · Fischdorf', wid: 'w1' } }; frOff = () => {}; cloudApi.tree = { fr: { f1: { u1: { st: 'freund' } } }, worlds: { w1: { owner: 'f1', wish: { r: 'bretter', n: 200, got: 50, at: 1 } } } }; state.res.bretter = 500`);
    await game("openYou('freunde')"); await tick(20);
    const txt = game("document.getElementById('modal-card').textContent");
    expect(txt).toMatch(/wünscht sich .*200 Bretter/);
    expect(txt).toMatch(/♡♡♡♡♡/);
    game("document.querySelector('[data-frhelp=\"f1\"]').click()");
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/es fehlen noch 150/);
    game("document.getElementById('mm-send').click()"); await tick(20);
    const m = Object.values(tree().mail.f1)[0];
    expect(m.items.bretter).toBe(150);
    expect(m.wish).toBe(true);
    expect(game('state.res.bretter')).toBe(350);
  });
  it('Partnerstadt: Flagge des Freundes, wird gespeichert, steht im Rathaus unter „Ort“', async () => {
    game(`frList = { f1: { st: 'freund', name: 'Ben · Fischdorf', wid: 'w1', flag: { c: '#58b36a', s: '🌻' } } }`);
    await game("togglePartner('f1', frList.f1)");
    expect(game('state.partner')).toMatchObject({ uid: 'f1', c: '#58b36a', s: '🌻' });
    expect(game('parseSave(JSON.parse(JSON.stringify(serialize()))).partner.s')).toBe('🌻');
    game("openTownHall('town')");
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Partnerstadt.*Ben · Fischdorf/s);
    await game("togglePartner('f1', frList.f1)");
    expect(game('state.partner')).toBe(null);
  });
  it('Flagge ohne Eintrag: aus der Insel des Freundes gelesen; nur echte Farbe und festes Symbol (kein CSS von fremden Spielern)', async () => {
    game(`cloudApi.tree = { worlds: { w9: { rest: JSON.stringify({ town: { name: 'X', color: '#e8604f', symbol: '⚓' } }) } } }`);
    expect(await game("friendFlag('f9', { wid: 'w9' })")).toEqual({ c: '#e8604f', s: '⚓' });
    expect(await game("friendFlag('f8', { flag: { c: 'url(//ev.il/p)', s: '⚓' } })")).toBe(null);
    expect(game("parseSave({ ...JSON.parse(JSON.stringify(serialize())), partner: { uid: 'x', name: 'X', c: 'red;background:url(x)', s: '⚓' } }).partner")).toBe(null);
  });
  it('Partnerstadt für Besucher nur als Flagge (Name und Kennung des Freundes bleiben privat)', () => {
    game("state.partner = { uid: 'f1', name: 'Ben · Fischdorf', c: '#58b36a', s: '🌻' }");
    const sp = game('liveSplit(serialize())');
    expect(JSON.parse(sp.rest).partner).toEqual({ uid: '', name: '', c: '#58b36a', s: '🌻' });
    expect(JSON.parse(sp.priv).partner.name).toBe('Ben · Fischdorf');
  });
  it('Freunde-Fenster springt nicht von selbst auf, wenn es geschlossen ist (Änderung bei den Freunden)', async () => {
    game("frOff = null; cloudApi.tree = { fr: { u1: { f1: { st: 'freund', name: 'Ben' } } } }");
    await game("openYou('freunde')"); await tick(20);
    game('closeModal()');
    await game("cloudApi.set('fr/u1/f1/flag', { c: '#58b36a', s: '🌻' })"); await tick(30);
    expect(game("document.getElementById('modal').hidden")).toBe(true);
    game('if (frOff) frOff(); frOff = null');
  });
});
