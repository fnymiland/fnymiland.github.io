const { loadGame, game } = require('./helpers/load-game');
const fs = require('fs'), path = require('path');

// Block 130: Online-Status der Freunde – grüner Punkt „spielt gerade“, sonst „zuletzt vor …“; lesen dürfen nur Freunde
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
  game(`window.__onTree = () => { const api = makeTree(); api.left = []; api.onLeave = (p, v) => api.left.push([p, v]); api.now = () => 1e12; api.TS = () => 1e12; return api; }`);
});
const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("liveFollowStop(); cloudApi = __onTree(); cloudUser = { uid: 'u1', name: 'a@b.de', display: 'Anna Beispiel' }; cloudState = 'ok'; cloudLeadInfo = { dev: cloudDevice(), name: 'Mac', at: Date.now() }; myAnimal = null; bookAll = {}; mailAll = {}");
});
const N = 1e12, MIN = 60e3;

describe('Online-Status (Block 130)', () => {
  it('Text: frisch und spielt → grün; sonst „zuletzt vor …“; ohne Meldung nichts', () => {
    const t = (o, now = N) => game(`onlineText(${JSON.stringify(o)}, ${now})`);
    expect(t({ at: N - 30e3, play: true })).toEqual({ on: true, text: 'spielt gerade' });
    expect(t({ at: N - 5 * MIN, play: true })).toEqual({ on: false, text: 'zuletzt vor 5 Min.' });    // iPad schläft, ohne Abmeldung
    expect(t({ at: N - 30e3, play: false })).toEqual({ on: false, text: 'zuletzt gerade eben' });
    expect(t({ at: N - 3 * 3600e3, play: false }).text).toBe('zuletzt vor 3 Std.');
    expect(t({ at: N - 30 * 3600e3 }).text).toBe('zuletzt gestern');
    expect(t({ at: N - 5 * 86400e3 }).text).toBe('zuletzt vor 5 Tagen');
    expect(t({ at: N - 90 * 86400e3 }).text).toBe('zuletzt vor über einem Monat');
    expect(t({ at: N + 5000, play: true }).on).toBe(true);                                          // Uhr leicht voraus: kein Minus
    expect(t(null)).toBe(null);
    expect(t({ play: true })).toBe(null);
  });
  it('Melden: spielt → play true und beim Gehen play false (onDisconnect); weggeklickt → play false', async () => {
    await game('onlineBeat(true)');
    expect(game('cloudApi.tree.on.u1')).toEqual({ at: N, play: true });
    expect(game('cloudApi.left')).toEqual([['on/u1', { at: N, play: false }]]);
    await game('onlineBeat(false)');
    expect(game('cloudApi.tree.on.u1')).toEqual({ at: N, play: false });
    game('cloudUser = null');
    await game('onlineBeat(true)');                                                                  // abgemeldet: schreibt nichts
    expect(game('cloudApi.tree.on.u1.play')).toBe(false);
  });
  it('Freundesliste: grüner Punkt, „zuletzt vor …“, bei alten App-Versionen nichts; frischt sich auf, ohne Eingaben zu verlieren', async () => {
    game(`cloudApi.tree.fr = { u1: { f1: { st: 'freund', name: 'Ben · Benstadt' }, f2: { st: 'freund', name: 'Cem · Cemdorf' }, f3: { st: 'freund', name: 'Dora · Alt' } } };
      cloudApi.tree.on = { f1: { at: ${N - 20e3}, play: true }, f2: { at: ${N - 2 * 3600e3}, play: false } };
      cloudApi.tree.users = { u1: { profile: { code: 'ABCDE' }, pub: { wid: 'w1', open: false } } }`);
    game('openFriends()'); await tick(30);
    const st = id => game(`(() => { const el = document.querySelector('[data-fron="${id}"]'); return el ? [el.classList.contains('on'), el.textContent, !!el.querySelector('i')] : null; })()`);
    expect(st('f1')).toEqual([true, 'spielt gerade', true]);
    expect(st('f2')).toEqual([false, 'zuletzt vor 2 Std.', false]);
    expect(st('f3')).toEqual([false, '', false]);
    game("$('fr-in').value = 'ABC'; cloudApi.tree.on.f1 = { at: " + (N - 10 * MIN) + ", play: false }");
    await game('onlineRefresh()');
    expect(st('f1')).toEqual([false, 'zuletzt vor 10 Min.', false]);
    expect(game("$('fr-in').value")).toBe('ABC');
  });
  it('Regeln: nur Freunde lesen, nur man selbst schreibt, feste Felder', () => {
    const r = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'firebase-rules.json'), 'utf8')).rules.on.$uid;
    expect(r['.read']).toContain("root.child('fr').child($uid).child(auth.uid).child('st').val() === 'freund'");
    expect(r['.write']).toBe('auth != null && auth.uid === $uid');
    expect(Object.keys(r).sort()).toEqual(['$other', '.read', '.validate', '.write', 'at', 'play']);
  });
});
