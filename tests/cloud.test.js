const { loadGame, game } = require('./helpers/load-game');

// Block 93: Online-Speicher (Stufe 1) – mit einer Cloud-Attrappe (gleiche Regeln wie der Firebase-Adapter in cloud.js)
beforeAll(() => {
  loadGame();
  game(`window.makeFakeCloud = () => {
    const db = {};
    const u = uid => db[uid] || (db[uid] = { meta: null, save: null, idx: {}, bak: {}, n: 0 });
    return { db,
      watchers: [], watchMeta(uid, cb) { this.watchers.push([uid, cb]); return () => {}; },
      onUser: () => {}, signInGoogle: async () => {}, sendLink: async () => {}, isLink: () => false, finishLink: async () => {}, signOut: async () => {},
      getMeta: async uid => u(uid).meta && JSON.parse(JSON.stringify(u(uid).meta)),
      getSave: async uid => u(uid).save && { ...u(uid).save },
      claim: async (uid, expect, info) => { const c = u(uid).meta; if (c && (c.rev || 0) !== expect) return { ok: false, cur: JSON.parse(JSON.stringify(c)) };
        const rev = ((c && c.rev) || 0) + 1; u(uid).meta = { rev, at: Date.now(), by: info.by, sum: info.sum };
        setTimeout(() => { for (const [w, cb] of (cloudApi && cloudApi.watchers) || []) if (w === uid) cb(JSON.parse(JSON.stringify(u(uid).meta))); }, 0); return { ok: true, rev }; },
      putSave: async (uid, s) => { u(uid).save = { ...s }; },
      addBackup: async (uid, info, data) => { const id = 'b' + (++u(uid).n); u(uid).idx[id] = { ...info, at: info.at + u(uid).n }; u(uid).bak[id] = data; return id; },
      listBackups: async uid => Object.entries(u(uid).idx).map(([id, b]) => ({ id, ...b })),
      getBackup: async (uid, id) => u(uid).bak[id],
      dropBackup: async (uid, id) => { delete u(uid).idx[id]; delete u(uid).bak[id]; },
    };
  }`);
});
beforeEach(() => {
  game("localStorage.clear(); startNew(); closeModal(); closePanel(); setTool('look'); state.tutorial = -1; state.tipsOff = true");
  game("cloudApi = makeFakeCloud(); cloudUser = null; cloudState = 'aus'; cloudKnown = null; cloudBusy = false; cloudFreshOk = false; cloudLastUp = 0");
});
// eine bespielte Welt: verdient und gebaut
const play = (earned = 50000, name = 'Bespielt') => game(`state.stats.earned = ${earned}; state.town.name = '${name}'; for (let i = 0; i < 20; i++) state.tiles.set((10 + i) + ',12', { b: 'feld', lvl: 1 }); rebuildCover(); recalc(); save()`);
const settle = async () => { for (let i = 0; i < 50 && game('cloudBusy'); i++) await new Promise(r => setTimeout(r, 1)); };
const login = async (uid = 'u1') => { game(`cloudOnUser({ uid: '${uid}', email: 'a@b.de' })`); await settle(); };
const remote = (uid = 'u1') => game(`cloudApi.db['${uid}']`);
// eine bespielte Welt direkt in die Cloud legen (wie von einem anderen Gerät)
const putRemote = async (name, earned = 90000, uid = 'u1') => {
  const d = game(`(() => { const d = JSON.parse(JSON.stringify(serialize())); d.town = { ...d.town, name: '${name}' }; d.stats = { ...d.stats, earned: ${earned} }; d.seed = 777;
    for (let i = 0; i < 30; i++) d.tiles.push([(40 + i) + ',40', { b: 'feld', lvl: 1 }]); return d; })()`);
  await game(`(async () => { const sum = worldSum(${JSON.stringify(d)}); const c = await cloudApi.claim('${uid}', ((cloudApi.db['${uid}'] || {}).meta || {}).rev || 0, { by: 'anderes', sum });
    await cloudApi.putSave('${uid}', { rev: c.rev, data: ${JSON.stringify(JSON.stringify(d))} }); })()`);
};

describe('Online-Speicher (Block 93)', () => {
  it('Entscheidung: leere Welt überschreibt nie eine bespielte, Konflikte werden gefragt', () => {
    const P = { earned: 9000, tiles: 40 }, F = { earned: 10, tiles: 5 };
    const d = o => game(`cloudDecide(${JSON.stringify(o)})`);
    expect(d({ local: F, cloud: null })).toBe('none');
    expect(d({ local: P, cloud: null })).toBe('upload');
    expect(d({ local: F, cloud: { rev: 3, sum: P } })).toBe('take');                        // neues Gerät holt die Cloud
    expect(d({ local: F, cloud: { rev: 3, sum: P }, mine: true, rev: 3, acts: 5 })).toBe('upload');   // eigenes Gerät, nur hier verändert
    expect(d({ local: P, cloud: { rev: 3, sum: F } })).toBe('upload');
    expect(d({ local: P, cloud: { rev: 4, sum: P }, mine: true, rev: 3, acts: 0 })).toBe('take');     // anderes Gerät war weiter, hier nichts gemacht
    expect(d({ local: P, cloud: { rev: 4, sum: P }, mine: true, rev: 3, acts: 2 })).toBe('ask');
    expect(d({ local: P, cloud: { rev: 4, sum: P }, mine: false })).toBe('ask');            // anderes Konto/erstes Mal, beides bespielt
  });
  it('neues Gerät: holt die bespielte Insel aus der Cloud und lädt nie die leere hoch', async () => {
    await putRemote('Wolkenheim');
    await login();
    expect(game('state.town.name')).toBe('Wolkenheim');
    expect(remote().meta.rev).toBe(1);                                                       // nichts hochgeladen
    game('cloudTouched()');
    expect(await game('cloudUpload()')).toBe(true);                                          // ab jetzt geht es normal weiter
    expect(remote().meta.rev).toBe(2);
  });
  it('bespieltes Gerät, leere Cloud: wird hochgeladen; eigene Aktionen gehen als neue Version hinterher', async () => {
    play();
    await login();
    expect(remote().meta.rev).toBe(1);
    expect(JSON.parse(remote().save.data).town.name).toBe('Bespielt');
    expect(await game('cloudUpload()')).toBe(false);                                         // ohne eigene Aktion nichts
    game("undoable(() => { state.tiles.set('15,15', { b: 'feld', lvl: 1 }); })");
    expect(await game('cloudUpload()')).toBe(true);
    expect(remote().meta.rev).toBe(2);
  });
  it('zwei Geräte haben unterschiedlich gespielt: Rückfrage; die Wahl übernimmt, der andere Stand wird gesichert', async () => {
    play(50000, 'Hier');
    await putRemote('Dort');
    await login();
    expect(game('cloudState')).toBe('konflikt');
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Zwei verschiedene Spielstände/);
    await game("cloudResolve('cloud', cloudKnown)");
    expect(game('state.town.name')).toBe('Dort');
    const b = Object.values(remote().idx);
    expect(b.map(x => x.sum.town)).toContain('Hier');                                      // nichts verloren
  });
  it('… oder dieses Gerät gewinnt: der Cloud-Stand kommt vorher in die Sicherungen', async () => {
    play(50000, 'Hier');
    await putRemote('Dort');
    await login();
    await game("cloudResolve('local', cloudKnown)");
    expect(JSON.parse(remote().save.data).town.name).toBe('Hier');
    expect(Object.values(remote().idx).map(x => x.sum.town)).toContain('Dort');
  });
  it('anderes Gerät war weiter, hier nichts gemacht: still übernehmen; beim Hochladen gegen eine alte Version neu entscheiden', async () => {
    play(50000, 'Hier');
    await login();                                                                           // rev 1 von hier
    await putRemote('Dort', 120000);                                                         // rev 2 von woanders
    await game("cloudSync('zurück')");
    expect(game('state.town.name')).toBe('Dort');
    game("undoable(() => { state.tiles.set('15,16', { b: 'feld', lvl: 1 }); })");
    await putRemote('Woanders', 130000);                                                     // rev 3, während hier gespielt wurde
    expect(await game('cloudUpload()')).toBe(false);                                         // Transaktion lehnt ab …
    await new Promise(r => setTimeout(r, 0)); await game('cloudSync()');
    expect(game('cloudState')).toBe('konflikt');                                             // … und es wird gefragt
  });
  it('Neue Insel: die alte bleibt in der Cloud gesichert, die neue darf hoch', async () => {
    play(50000, 'Alt');
    await login();
    game('startNew(); cloudNewWorld()');
    await new Promise(r => setTimeout(r, 10));
    expect(Object.values(remote().idx).map(x => x.sum.town)).toContain('Alt');
    expect(JSON.parse(remote().save.data).town.name).not.toBe('Alt');
  });
  it('ohne Absicht lädt eine leere Welt nie über eine bespielte – auch auf dem eigenen Gerät nicht', async () => {
    play(50000, 'Alt');
    await login();
    game("state = newState(); state.tiles.set('1,1', { b: 'rathaus', lvl: 1 }); cloudTouched()");
    expect(await game('cloudUpload()')).toBe(false);
    expect(JSON.parse(remote().save.data).town.name).toBe('Alt');
  });
  it('Fenster: angemeldet mit früheren Ständen, Zurückholen sichert vorher den jetzigen', async () => {
    play(50000, 'Hier');
    await putRemote('Dort');
    await login();
    await game("cloudResolve('cloud', cloudKnown)");                                          // „Hier“ liegt jetzt in den Sicherungen
    await game('openCloud()');
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Angemeldet als a@b\.de/);
    const id = game("document.querySelector('[data-cback]').dataset.cback");
    await game(`cloudRestore('${id}')`);
    expect(game('state.town.name')).toBe('Hier');
    expect(Object.values(remote().idx).map(x => x.sum.town)).toContain('Dort');
    expect(JSON.parse(remote().save.data).town.name).toBe('Hier');
  });
  it('live: lädt ein anderes Gerät hoch, übernimmt dieses Gerät sofort (wenn es selbst nichts geändert hat)', async () => {
    play(50000, 'Hier');
    await login();
    await putRemote('Neu von drüben', 150000);
    for (let i = 0; i < 20 && game('state.town.name') !== 'Neu von drüben'; i++) await new Promise(r => setTimeout(r, 5));
    expect(game('state.town.name')).toBe('Neu von drüben');
  });
  it('hochladen: ein paar Sekunden nach der letzten Aktion, bei Dauerbauen spätestens nach CLOUD_EVERY', async () => {
    play();
    await login();
    const t0 = game('Date.now()');
    game(`cloudLastUp = ${t0} - CLOUD_GAP - 1; cloudTouched(); cloudActAt = ${t0}`);
    expect(game(`cloudDue(${t0} + 1000)`)).toBe(false);                                   // gerade noch gebaut
    expect(game(`cloudDue(${t0} + CLOUD_QUIET + 100)`)).toBe(true);                       // Pause → hoch
    game(`cloudLastUp = ${t0}; cloudActAt = ${t0} + CLOUD_EVERY`);
    expect(game(`cloudDue(${t0} + CLOUD_EVERY + 500)`)).toBe(true);                       // baut ständig → trotzdem regelmäßig
    expect(game(`cloudDue(${t0} + 2000)`)).toBe(false);                                   // nie öfter als CLOUD_GAP
  });
  it('höchstens 10 Sicherungen', async () => {
    play();
    await login();
    for (let i = 0; i < 13; i++) await game(`cloudBackup(serialize(), 'Test ${i}')`);
    expect(Object.keys(remote().idx).length).toBe(10);
  });
  it('ohne Anmeldung ändert sich nichts: keine Aktion zählt, nichts wird geladen', () => {
    game("undoable(() => { state.tiles.set('15,15', { b: 'feld', lvl: 1 }); })");
    expect(game('cloudMeta().acts')).toBe(undefined);
    expect(game("document.querySelectorAll('script[src*=\"gstatic\"]').length")).toBe(0);
  });
});
