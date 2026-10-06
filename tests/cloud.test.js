const { loadGame, game } = require('./helpers/load-game');

// Block 93: Online-Speicher (Stufe 1) – mit einer Cloud-Attrappe (gleiche Regeln wie der Firebase-Adapter in cloud.js)
beforeAll(() => {
  loadGame();
  game(`window.makeFakeCloud = () => {
    const db = {};
    const u = uid => db[uid] || (db[uid] = { meta: null, save: null, idx: {}, bak: {}, n: 0 });
    return { db,
      watchers: [], watchMeta(uid, cb) { this.watchers.push([uid, cb]); return () => {}; },
      leadW: [], watchLead(uid, cb) { this.leadW.push([uid, cb]); setTimeout(() => cb(u(uid).lead || null), 0); return () => { this.leadW = this.leadW.filter(w => w[1] !== cb); }; },
      async leadTx(uid, fn) { const cur = u(uid).lead || null, n = fn(cur && JSON.parse(JSON.stringify(cur))); if (n === undefined) return { ok: false, cur };
        u(uid).lead = n && n.at === true ? { ...n, at: this.now() } : n; const v = u(uid).lead;
        setTimeout(() => { for (const [w, cb] of this.leadW) if (w === uid) cb(v && JSON.parse(JSON.stringify(v))); }, 0); return { ok: true, cur: v }; },
      clock: 0, now() { return Date.now() + this.clock; },
      onUser: () => {}, signInGoogle: async () => {}, signOut: async () => {},
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
  game("if (cloudWatchOff) cloudWatchOff(); cloudWatchOff = null; cloudApi = makeFakeCloud(); cloudUser = null; cloudState = 'aus'; cloudKnown = null; cloudBusy = false; cloudFreshOk = false; cloudLastUp = 0; cloudLeadInfo = null; cloudLeadWant = 0; LEAD_WAIT = 20; cloudLeadUi()");
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
  // --- Prüfung vor dem Veröffentlichen (Block 93c): Lücken, die beim Durchgehen auffielen ---
  it('zwei Uploads gleichzeitig: nacheinander, keine Rückfrage gegen das eigene Gerät', async () => {
    play();
    await login();
    game("undoable(() => { state.tiles.set('15,15', { b: 'feld', lvl: 1 }); })");
    const a = game('cloudUpload()'), b = game('cloudUpload(true)');
    await a; await b; await settle();
    expect(game('cloudState')).toBe('ok');
    expect(remote().meta.rev).toBe(game('cloudMeta().rev'));
  });
  it('Änderungen ohne ↶ (Farbe, Forschung …) werden erkannt und hochgeladen', async () => {
    play();
    await login();
    const rev = remote().meta.rev;
    game("state.town.color = (state.town.color || 0) + 1; state.techs.add('testforschung')");
    game('cloudWatchLocal(Date.now() + 60000)');
    expect(game('cloudMeta().acts')).toBeGreaterThan(0);
    expect(await game('cloudUpload()')).toBe(true);
    expect(remote().meta.rev).toBe(rev + 1);
  });
  it('was während des Hochladens gebaut wird, bleibt zum nächsten Hochladen vorgemerkt', async () => {
    play();
    await login();
    game("cloudTouched(); (o => { cloudApi.putSave = async (u, s) => { cloudTouched(); return o(u, s); }; })(cloudApi.putSave)");
    await game('cloudUpload()');
    expect(game('cloudMeta().acts')).toBe(1);
  });
  it('Upload unterbrochen (Version beansprucht, Stand nicht geschrieben): nach dem Neuladen still nachholen, keine Rückfrage', async () => {
    play();
    await login();
    game("cloudTouched(); (o => { let n = 0; cloudApi.putSave = async (u, s) => { if (!n++) throw new Error('Netz weg'); return o(u, s); }; })(cloudApi.putSave)");
    await game('cloudUpload()').catch(() => {});
    expect(remote().meta.rev).toBe(remote().save.rev + 1);                                   // Version beansprucht, Stand fehlt
    game("cloudKnown = null; cloudState = 'ok'");                                           // wie nach dem Neuladen
    await game("cloudSync('Start')"); await settle();
    expect(game('cloudState')).toBe('ok');
    expect(remote().save.rev).toBe(remote().meta.rev);
  });
  it('anderes Gerät mittendrin weg (Version beansprucht, nie geschrieben): kein Endlos-Warten, der letzte ganze Stand gilt', async () => {
    play(50000, 'Hier');
    await login();
    await game("cloudApi.claim('u1', cloudApi.db.u1.meta.rev, { by: 'tot', sum: cloudApi.db.u1.meta.sum })");
    game('cloudTakeTries = 3');
    await game("cloudSync('anderes Gerät')"); await settle();
    expect(game('cloudMeta().rev')).toBe(remote().meta.rev);
    expect(game('cloudState')).toBe('ok');
  });
  it('live übernehmen legt keine Sicherungen an (sonst verdrängen sie die echten)', async () => {
    play(50000, 'Hier');
    await login();
    for (let i = 0; i < 3; i++) { await putRemote('Hier', 60000 + i); await new Promise(r => setTimeout(r, 5)); await settle(); }
    expect(Object.keys(remote().idx).length).toBe(0);
  });
  it('Testwelt: kein Online-Speicher (die Testwelt darf nie die echte Insel ersetzen)', async () => {
    await putRemote('Echt');
    game('window._off = cloudOff; cloudOff = () => true');                                  // wie mit ?welt=…
    try {
      game("cloudOnUser({ uid: 'u1', email: 'a@b.de' })");
      expect(game('cloudUser')).toBe(null);
      game('cloudTouched()');
      expect(JSON.parse(remote().save.data).town.name).toBe('Echt');
    } finally { game('cloudOff = window._off'); }
  });
  it('zweites Fenster mit dem Spiel: ein nicht führendes lädt nichts mehr hoch, das führende lässt sich nicht aufhalten', async () => {
    play();
    await login(); await new Promise(r => setTimeout(r, 5)); await settle();
    game("window.dispatchEvent(new StorageEvent('storage', { key: SAVE_KEY }))");
    expect(game('cloudState')).toBe('ok');                                                   // führt: weiter wie bisher
    game('cloudLeadInfo = null');
    game("window.dispatchEvent(new StorageEvent('storage', { key: SAVE_KEY }))");
    expect(game('cloudState')).toBe('zweites');
    game('cloudTouched()');
    expect(game('cloudDue(Date.now() + 999999)')).toBe(false);
  });
  it('höchstens 3 Sicherungen – die neuesten bleiben (Block 104)', async () => {
    play();
    await login();
    for (let i = 0; i < 6; i++) { await game(`cloudBackup(serialize(), 'Test ${i}')`); await new Promise(r => setTimeout(r, 2)); }
    expect(Object.keys(remote().idx).length).toBe(3);
    expect(Object.values(remote().idx).map(b => b.why).sort()).toEqual(['Test 3', 'Test 4', 'Test 5']);
  });
  it('alte Sicherungen von früher (mehr als 3): das Online-Fenster räumt die ältesten weg', async () => {
    play();
    await login();
    for (let i = 0; i < 5; i++) await game(`cloudApi.addBackup(cloudUser.uid, { at: ${1000 + i}, sum: {}, why: 'alt ${i}' }, '{}')`);
    await game('openCloud()'); await new Promise(r => setTimeout(r, 10));
    expect(Object.values(remote().idx).map(b => b.why).sort()).toEqual(['alt 2', 'alt 3', 'alt 4']);
  });
  it('ohne Anmeldung ändert sich nichts: keine Aktion zählt, nichts wird geladen', () => {
    game("undoable(() => { state.tiles.set('15,15', { b: 'feld', lvl: 1 }); })");
    expect(game('cloudMeta().acts')).toBe(undefined);
    expect(game("document.querySelectorAll('script[src*=\"gstatic\"]').length")).toBe(0);
  });
});

const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));
const otherLeads = (name = 'iPad', ago = 0) => game(`cloudApi.db.u1 = cloudApi.db.u1 || { meta: null, save: null, idx: {}, bak: {}, n: 0 }; cloudApi.db.u1.lead = { dev: 'ipad', name: '${name}', at: Date.now() - ${ago} }`);
describe('Ein Gerät führt (Block 94)', () => {
  it('frei: wer sich anmeldet, führt', async () => {
    play();
    await login(); await tick(); await settle();
    expect(remote().lead.dev).toBe(game('cloudDevice()'));
    expect(game('cloudIsLeader()')).toBe(true);
    expect(game('cloudWatching()')).toBe(false);
  });
  it('ein anderes Gerät führt: hier nur zuschauen – Band mit Gerätename, Bauen gesperrt, nichts hochladen', async () => {
    await putRemote('Dort');
    otherLeads('iPad');
    await login(); await tick(); await settle();
    expect(game('cloudWatching()')).toBe(true);
    expect(game("document.getElementById('lead-band').textContent")).toMatch(/iPad/);
    game("setTool('feld')");
    expect(game('tool')).toBe('look');
    const n = game('state.tiles.size');
    game("undoable(() => { state.tiles.set('15,15', { b: 'feld', lvl: 1 }); })");
    expect(game('state.tiles.size')).toBe(n);
    expect(await game('cloudUpload(true)')).toBe(false);
  });
  it('zuschauen: Änderungen des führenden Geräts kommen immer an, eigene (ohne ↶) werden zurückgesetzt', async () => {
    await putRemote('Dort');
    otherLeads('iPad');
    await login(); await tick(); await settle();
    game("state.town.name = 'Verbastelt'");
    await game("cloudSync('zuschauen')"); await settle();
    expect(game('state.town.name')).toBe('Dort');
    await putRemote('Dort neu', 200000);
    for (let i = 0; i < 20 && game('state.town.name') !== 'Dort neu'; i++) { await tick(); await settle(); }
    expect(game('state.town.name')).toBe('Dort neu');
  });
  it('„Hier weiterspielen“: antwortet das führende Gerät nicht, übernimmt dieses nach der Wartezeit', async () => {
    await putRemote('Dort');
    otherLeads('iPad');
    await login(); await tick(); await settle();
    await game('cloudTakeLead()'); await tick(); await settle();
    expect(remote().lead.dev).toBe(game('cloudDevice()'));
    expect(game('cloudWatching()')).toBe(false);
    expect(game("!!document.getElementById('lead-band')")).toBe(false);
  });
  it('führend und ein anderes Gerät bittet: erst sichern, dann übergeben – danach zuschauen', async () => {
    play(50000, 'Hier');
    await login(); await tick(); await settle();
    game("undoable(() => { state.tiles.set('15,15', { b: 'feld', lvl: 1 }); })");     // noch nicht hochgeladen
    await game("cloudApi.leadTx('u1', cur => ({ ...cur, req: { dev: 'ipad', name: 'iPad' } }))");
    for (let i = 0; i < 20 && remote().lead.dev !== 'ipad'; i++) { await tick(); await settle(); }
    expect(remote().lead.dev).toBe('ipad');
    expect(JSON.parse(remote().save.data).tiles.some(([k]) => k === '15,15')).toBe(true);   // Letztes kam noch mit
    await tick(); await settle();
    expect(game('cloudWatching()')).toBe(true);
  });
  it('Hintergrund: sichert und gibt frei', async () => {
    play(50000, 'Hier');
    await login(); await tick(); await settle();
    game("undoable(() => { state.tiles.set('15,16', { b: 'feld', lvl: 1 }); })");
    game("Object.defineProperty(document, 'hidden', { value: true, configurable: true })");   // wie gesperrt
    try {
      game('cloudLeaveLead()'); await tick(); await settle(); await tick();
      expect(remote().lead).toBe(null);
    } finally { game("delete document.hidden"); }
    expect(JSON.parse(remote().save.data).tiles.some(([k]) => k === '15,16')).toBe(true);
  });
  it('verwaiste Führung (meldet sich über 45 s nicht): wird übernommen, kein Zuschauen', async () => {
    await putRemote('Dort');
    otherLeads('iPad', 120000);
    await login(); await tick(); await settle();
    expect(game('cloudWatching()')).toBe(false);
    expect(remote().lead.dev).toBe(game('cloudDevice()'));
  });
  it('war offline führend und wurde abgelöst: Rückfrage statt überschreiben; „dieses Gerät“ übernimmt auch die Führung', async () => {
    play(50000, 'Hier');
    await login(); await tick(); await settle();
    game("undoable(() => { state.tiles.set('15,17', { b: 'feld', lvl: 1 }); })");       // offline gebaut, nicht hochgeladen
    await putRemote('Dort', 200000);
    otherLeads('iPad');
    game("cloudLeadInfo = { ...cloudApi.db.u1.lead }");
    await game("cloudSync('zurück')"); await settle();
    expect(game('cloudState')).toBe('konflikt');
    await game("cloudResolve('local', cloudKnown)"); await settle();
    expect(remote().lead.dev).toBe(game('cloudDevice()'));
    expect(JSON.parse(remote().save.data).town.name).toBe('Hier');
  });
  // --- Prüfung von Stufe 2 (Block 94b) ---
  it('„führen wenn frei“ des führenden Geräts löscht keine offene Bitte eines anderen', async () => {
    play();
    await login(); await tick(); await settle();
    game('cloudApi.leadW = []');                                                             // Übergabe hier nicht auslösen
    game("cloudApi.db.u1.lead.req = { dev: 'ipad', name: 'iPad' }");
    await game('cloudClaimLead()');
    expect(remote().lead.dev).toBe(game('cloudDevice()'));
    expect(remote().lead.req).toEqual({ dev: 'ipad', name: 'iPad' });
  });
  it('frei gewordene Führung: ein unbeachtet daneben stehendes Gerät übernimmt nicht von selbst, erst beim Anfassen', async () => {
    await putRemote('Dort');
    otherLeads('iPad');
    await login(); await tick(); await settle();
    game('window._li = lastInput; lastInput = performance.now() - 120000');                // seit 2 Minuten nicht angefasst
    try {
      await game("cloudApi.leadTx('u1', () => null)"); await tick(); await settle();
      expect(remote().lead).toBe(null);
      game("document.dispatchEvent(new window.Event('pointerdown', { bubbles: true }))"); await tick(); await settle();
      expect(remote().lead.dev).toBe(game('cloudDevice()'));
    } finally { game('lastInput = window._li'); }
  });
  it('zuschauen: auch ↶ ist gesperrt', async () => {
    await putRemote('Dort');
    otherLeads('iPad');
    await login(); await tick(); await settle();
    expect(game('undo()')).toBe(false);
  });
});

