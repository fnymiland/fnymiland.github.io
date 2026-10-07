const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Block 141: Freundesbuch übersichtlich – Zahlen oben, je Freund eine Zeile, Gästebuch gekürzt; Altes wandert in Zähler
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
const DAY = 864e5, NOW = Date.now();
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("socialUid = undefined; cloudUser = null; socialReset()");
  game("liveFollowStop(); cloudApi = makeTree(); cloudUser = { uid: 'u1', name: 'a@b.de', display: 'Anna Beispiel' }; cloudState = 'ok'; cloudLeadInfo = { dev: cloudDevice(), name: 'Mac', at: Date.now() }; myAnimal = null; bookAll = {}; mailAll = {}; statsAll = {}");
});
// viel los: 5 Freunde, je 200 Tage Besuch und Herz, 300 Gästebuch-Einträge
const busy = () => game(`(() => { const b = {};
  for (let f = 0; f < 5; f++) for (let d = 0; d < 200; d++) { const at = ${NOW} - d * ${DAY} - f * 1000;
    b['v_f' + f + '_' + d] = { k: 'v', from: 'f' + f, n: 'Freund' + f, a: f, at }; b['h_f' + f + '_' + d] = { k: 'h', from: 'f' + f, n: 'Freund' + f, a: f, at: at + 1 }; }
  for (let i = 0; i < 300; i++) b['g_f' + (i % 5) + '_x_' + i] = { k: 'g', from: 'f' + (i % 5), n: 'Freund' + (i % 5), a: 0, t: i % 20, s: 0, at: ${NOW} - i * 3600e3 };
  return b; })()`);

describe('Freundesbuch (Block 141)', () => {
  it('1000 Besuche, 1000 Herzen, 300 Einträge: oben die Zahlen, 5 Zeilen für 5 Freunde, Gästebuch 10 + „Ältere anzeigen“', () => {
    game(`bookAll = ${JSON.stringify(busy())}`);
    const html = game("friendsHallHtml('book')");
    expect(html).toMatch(/❤️ <b>1\.000<\/b> Herzen/);
    expect(html).toMatch(/👋 <b>1\.000<\/b> Besuche/);
    expect(html).toMatch(/📖 <b>300<\/b> Einträge/);
    game(`openModal('<div id="fb">' + friendsHallHtml('book') + '</div>'); wireFriendsHall($('modal-card'))`);
    expect(game("document.querySelectorAll('.fb-p').length")).toBe(5);
    expect(game("document.querySelectorAll('.fb-g:not([hidden])').length")).toBe(10);
    game("document.querySelector('[data-fbmore=\"g\"]').click()");
    expect(game("document.querySelectorAll('.fb-g:not([hidden])').length")).toBe(30);
    expect(game("document.querySelector('.fb-p').textContent")).toMatch(/Freund0.*❤️ 200 · 👋 200 · 📖 60.*heute/s);
  });
  it('Aufräumen: Altes wandert in die Zähler – Zahlen bleiben gleich, das Buch wird klein; zweimal zählt nichts doppelt', async () => {
    const b = busy();
    game(`bookAll = ${JSON.stringify(b)}; cloudApi.tree.book = { u1: JSON.parse(JSON.stringify(bookAll)) }`);
    const before = game("bookPeople().map(p => [p.from, p.h, p.v, p.g])");
    await game('bookFold("u1")');
    const left = Object.keys(game('cloudApi.tree.book.u1'));
    expect(left.length).toBeLessThan(5 * 31 * 2 + 200 + 10);                       // 30 Tage + 200 Einträge
    expect(left.filter(k => k.startsWith('g_')).length).toBe(200);
    game('statsAll = cloudApi.tree.users.u1.bookStats');
    game('bookAll = JSON.parse(JSON.stringify(cloudApi.tree.book.u1))');
    expect(game("bookPeople().map(p => [p.from, p.h, p.v, p.g])")).toEqual(before);
    // zweites Gerät mit dem alten Buch (Löschen noch nicht angekommen): zählt nicht doppelt
    game(`bookAll = ${JSON.stringify(b)}`);
    await game('bookFold("u1")');
    game('statsAll = cloudApi.tree.users.u1.bookStats; bookAll = JSON.parse(JSON.stringify(cloudApi.tree.book.u1 || {}))');
    expect(game("bookPeople().map(p => [p.from, p.h, p.v, p.g])")).toEqual(before);
    // gezählt, aber noch nicht gelöscht: in der Anzeige nicht doppelt
    game(`bookAll = ${JSON.stringify(b)}`);
    expect(game("bookPeople().map(p => [p.from, p.h, p.v, p.g])")).toEqual(before);
  });
  it('„Neu seit deinem letzten Blick“; ohne Besuch ein Hinweis', () => {
    expect(game("friendsHallHtml('book')")).toMatch(/Noch niemand/);
    game(`frLS('seen_u1', ${NOW - 1000}); bookAll = { a: { k: 'h', from: 'f1', n: 'Ben', a: 1, at: ${NOW} }, b: { k: 'v', from: 'f1', n: 'Ben', a: 1, at: ${NOW} }, c: { k: 'v', from: 'f1', n: 'Ben', a: 1, at: ${NOW - 5000} } }`);
    expect(game("friendsHallHtml('book')")).toMatch(/Neu seit deinem letzten Blick: 1 Herz, 1 Besuch/);
  });
  it('Gästebuch: Schlüssel je Tag (höchstens 3), belegt → nächste Nummer; Regel prüft den Schlüssel', async () => {
    game("visitOwner = 'o1'; visitUser = { uid: 'u1', nick: 'Anna' }; myAnimal = 2");
    let calls = [];
    game(`cloudApi.set = async (p, v) => { globalThis.__calls.push(p); if (p.endsWith('_0')) { const e = new Error('PERMISSION_DENIED'); e.code = 'PERMISSION_DENIED'; throw e; } }`);
    game('globalThis.__calls = []; visitBook()');
    game("$('bk-send').click()"); await tick(20);
    calls = game('globalThis.__calls');
    expect(calls).toEqual([`book/o1/g_u1_${game('dayKey()')}_0`, `book/o1/g_u1_${game('dayKey()')}_1`]);
    expect(game("frLS('book_' + dayKey())")).toBe(2);
    const v = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase-rules.json'), 'utf8')).rules.book.$owner.$id['.validate'];
    expect(v).toContain("$id.beginsWith('g_' + auth.uid + '_')");
    expect(v).toContain('_[0-2]$');
  });
});
