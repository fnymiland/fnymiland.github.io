const { loadGame, game } = require('./helpers/load-game');

// Block 97: Deine Figur – läuft über die eigene Insel, gibt Tipps, Kleiderschrank im Rathaus (Datenbank-Attrappe wie friends.test.js)
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
  game("liveFollowStop(); cloudApi = makeTree(); cloudUser = { uid: 'u1', name: 'a@b.de', display: 'Anna Beispiel' }; cloudState = 'ok'; cloudLeadInfo = { dev: cloudDevice(), name: 'Mac', at: Date.now() }; myAnimal = null; visitorFigs.length = 0; meProfileUid = 'u1'; bubble = null");
});
const tree = () => game('cloudApi.tree');


const txt = () => game("document.getElementById('modal-card').textContent");
const walk = (n = 40, dt = 0.5) => game(`for (let i = 0; i < ${n}; i++) stepMe(${dt}, 1e9 + i)`);

describe('Deine Figur (Block 97)', () => {
  it('Aussehen: gültig auch ohne Einstellung, wird im Spielstand gespeichert und ins Profil kopiert', async () => {
    game('state.me = null');
    const L = game('meLook()');
    expect(game(`!!ANIMALS[${L.a}]`)).toBe(true);
    expect(L.hat).toBe(null);
    game("setMe({ a: 3, shirt: 2, body: 'schal', hand: 'ballon', name: '  Frau Holle  ' })");
    expect(game('state.me.a')).toBe(3);
    expect(game('meLook().name')).toBe('Frau Holle');
    const saved = game('JSON.parse(JSON.stringify(serialize()))');
    expect(saved.me.body).toBe('schal');
    expect(game('parseSave(JSON.parse(JSON.stringify(serialize()))).me.hand')).toBe('ballon');
    await tick();
    expect(tree().users.u1.profile.animal).toBe(3);
    expect(tree().users.u1.profile.look).toEqual({ fur: null, shirt: 2, hat: null, face: null, body: 'schal', hand: 'ballon' });
    game("state.me = { a: 'quatsch', hat: 'nix', shirt: 99, name: 5 }");                 // Unsinn aus alten/fremden Ständen
    const B = game('meLook()');
    expect(game(`!!ANIMALS[${B.a}]`)).toBe(true);
    expect([B.hat, B.shirt, B.name]).toEqual([null, 0, '']);
  });
  it('Besonderes gibt es erst für Erfolge – gesperrt: Schloss und Hinweis, tragen geht nicht', () => {
    game('state.achieved = {}');
    expect(game("wearOk('krone')")).toBe(false);
    expect(game("wearOk('strohhut')")).toBe(true);
    game("setMe({ hat: 'krone' })");
    expect(game('meLook().hat')).toBe(null);
    game("openTownHall('figur')");
    expect(txt()).toMatch(/🔒 Krone/);
    game(`document.querySelector('[data-mewlock="krone"]').click()`);
    expect(game("document.querySelector('#modal-card .wear-lock').textContent")).toMatch(/Krone.*Wunderwerke: 1.*Du hast: 0 \/ 1/s);
    game(`document.querySelector('[data-mego="erfolge"]').click()`);
    expect(txt()).toMatch(/Ehrennadel/);                                                  // Erfolge-Reiter
    game("openTownHall('figur')");
    expect(game("!!document.querySelector('#modal-card .wear-lock')")).toBe(false);       // beim Wechseln zu
    game('state.achieved = { wunder: 1 }');
    expect(game('meLook().hat')).toBe('krone');                                         // jetzt verdient
    game("openTownHall('figur')");
    expect(game(`!!document.querySelector('[data-mew="hat:krone"]')`)).toBe(true);
  });
  it('Rathaus „Deine Figur“: Tier, Farben, Kleidung, Name und Ausblenden', () => {
    game("state.me = null; openTownHall('figur')");
    expect(game("!!document.getElementById('me-prev')")).toBe(true);
    game(`document.querySelector('[data-mea="4"]').click()`);
    expect(game('state.me.a')).toBe(4);
    game(`document.querySelector('[data-meshirt="3"]').click()`);
    game(`document.querySelector('[data-mew="face:brille"]').click()`);
    game(`document.querySelector('[data-mew="hand:ballon"]').click()`);
    expect(game('meLook()')).toMatchObject({ a: 4, shirt: 3, face: 'brille', hand: 'ballon' });
    game(`document.querySelector('[data-mew="hand:"]').click()`);
    expect(game('meLook().hand')).toBe(null);
    game(`const i = document.getElementById('me-name'); i.value = 'Kapitän'; i.onchange()`);
    expect(game('meLook().name')).toBe('Kapitän');
    game(`document.getElementById('me-on').click()`);
    expect(game('meLook().off')).toBe(true);
  });
  it('läuft über die Insel (nur auf begehbaren Feldern), mit Namensschild; ausgeblendet: weg', () => {
    game("state.me = { a: 2, name: 'Anna' }");
    walk(1);
    expect(game('meFigs.length')).toBe(1);
    expect(game('meFigs[0].label')).toBe('Anna');
    expect(game('ANIMALS[meFigs[0].kind].id')).toBe('hase');
    const start = game('[meFig.fx, meFig.fy]');
    walk(80);
    expect(game('walkable(meFig.fx, meFig.fy, true)')).toBe(true);
    expect(game('[meFig.fx, meFig.fy]')).not.toEqual(start);
    game("setMe({ off: true })"); walk(1);
    expect(game('meFigs.length')).toBe(0);
  });
  it('schaut sich Neugebautes an', () => {
    game("state.me = { a: 1 }; state.money = 1e6"); walk(1);
    game('meScanAt = 0; meScan(1)');
    const h = game('townHallAt()');
    let spot = null;
    for (let d = 3; d < 9 && !spot; d++) for (const [x, y] of [[h[0] + d, h[1]], [h[0], h[1] + d], [h[0] - d, h[1]], [h[0], h[1] - d]])
      if (!spot && game(`build('haus', ${x}, ${y}, true)`)) spot = [x, y];
    expect(spot).not.toBe(null);
    game('meScanAt = 0; meScan(2)');
    expect(game('meNew')).toContain(game(`anchorAt(${spot[0]}, ${spot[1]})`));
    game('meFig.path = null; meNextGoal()');
    expect(game('meFig.path && meFig.path.length >= 0')).toBe(true);
    expect(game('ME_NEW_SAY.includes(meFig.say)')).toBe(true);
  });
  it('Helfer: sagt, was dran ist – Einführung, fehlendes Material, Wünsche; Antippen öffnet Tipp und Aussehen', () => {
    game('state.tutorial = 0');
    expect(game('meTip().text')).toContain(game('TUTORIAL[0].text'));
    game('state.tutorial = -1');
    const t = game('const t = meTip(); ({ say: t.say, real: !!t.real })');
    expect(typeof t.say).toBe('string');
    game("state.me = { a: 0 }"); walk(1);
    game('openMeInfo()');
    expect(game("document.getElementById('panel').textContent")).toMatch(/Bürgermeister·in von/);
    expect(game('bubble && bubble.w === meFig')).toBe(true);
    game("document.getElementById('p-look').click()");
    expect(txt()).toMatch(/Name auf dem Schild/);
  });
  it('fehlendes Material: nennt, wer es herstellt', () => {
    const lack = game(`(() => { for (const type of Object.keys(LM_STAGES)) { const i = restoreInfo(type); if (i.next && i.pos && ownedTile(i.pos[0], i.pos[1])) return Object.keys(i.mat || {}); } return []; })()`);
    if (!lack.length) return;                                                          // (Startinsel ohne Laternen-Material)
    game(`for (const r of ${JSON.stringify(lack)}) state.res[r] = 0`);
    const tip = game('const l = meLack(); l && { say: l.say, text: l.text }');
    if (tip) { expect(tip.say).toMatch(/Uns fehlt/); expect(tip.text).toMatch(/brauchen wir/); }
  });
  it('angemeldet, noch nie eingestellt: Figur aus dem Profil übernehmen (Block 96c)', async () => {
    game("state.me = null; meProfileUid = null; cloudApi.tree = { users: { u1: { profile: { animal: 6, look: { shirt: 5, hat: 'muetze' } } } } }");
    game("setCloudMeta({ ...cloudMeta(), acts: 0 })");
    await game('meProfileSync()');
    expect(game('meLook().a')).toBe(6);
    expect(game('meLook().hat')).toBe('muetze');
    expect(game('state.me')).toBe(null);                                                  // nur anzeigen – der Spielstand bleibt unberührt …
    expect(game('cloudMeta().acts || 0')).toBe(0);                                        // … und zählt nicht als eigene Änderung (sonst Konflikt)
    game("setMe({ shirt: 1 })");                                                          // erst selbst einstellen schreibt sie in den Stand
    expect(game('state.me.a')).toBe(6);
  });
  it('wer zuschaut (anderes Gerät führt), kann nichts ändern; Antippen zeigt nur eine Sprechblase', () => {
    game("state.me = { a: 1 }; cloudLeadInfo = { dev: 'ipad', name: 'iPad', at: Date.now() }");
    game("setMe({ a: 3 })");
    expect(game('state.me.a')).toBe(1);
    game('closePanel(); openMeInfo()');
    expect(game("document.getElementById('panel').hidden")).toBe(true);
    expect(game('bubble && bubble.w === meFig')).toBe(true);
  });
});
