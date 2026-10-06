const { loadGame, game } = require('./helpers/load-game');

// Block 95: Live-Spiegel, Besuchen, Freundescodes – mit einer Datenbank-Attrappe (Pfade wie in Firebase)
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
  game("liveFollowStop(); cloudApi = makeTree(); cloudUser = { uid: 'u1', name: 'a@b.de', display: 'Anna Beispiel' }; cloudState = 'ok'; liveWid = null; liveOpen = false; liveSent = null; liveGV = -1; frMine = null; frList = {}; frOff = null");
});
const lead = (dev = null) => game(`cloudLeadInfo = { dev: ${dev ? `'${dev}'` : 'cloudDevice()'}, name: 'iPad', at: Date.now() }`);
const tree = () => game('cloudApi.tree');

describe('Live-Spiegel (Block 95)', () => {
  it('Spiegel und zurück ergibt denselben Stand', () => {
    game("for (let i = 0; i < 5; i++) state.tiles.set((10 + i) + ',10', { b: 'feld', lvl: 2 }); state.town.name = 'Spiegelstadt'; state.money = 1234");
    const r = game(`(() => { const S = serialize(), sp = liveSplit(S), d = liveJoin({ ...sp.maps, rest: sp.rest }, { eco: sp.eco, priv: sp.priv }); const p = parseSave(d);
      return [p.tiles.size === state.tiles.size, p.town.name, p.money, p.decos.size === state.decos.size, p.terra.size === state.terra.size]; })()`);
    expect(r).toEqual([true, 'Spiegelstadt', 1234, true, true]);
  });
  it('führend: einmal alles, danach nur die Änderung (ein Feld ≈ ein paar hundert Bytes)', async () => {
    lead();
    expect(await game('livePush(true)')).toBe(true);
    const wid = game('liveWid');
    expect(Object.keys(tree().worlds[wid].tiles).length).toBe(game('state.tiles.size'));
    expect(tree().worlds[wid].owner).toBe('u1');
    expect(JSON.parse(tree().users.u1.live.eco).money).toBe(game('state.money'));
    game("state.tiles.set('12,12', { b: 'feld', lvl: 1 }); recalc()");
    expect(await game(`livePush(false, Date.now() + 10000)`)).toBe(true);
    const upd = game('cloudApi.updates[cloudApi.updates.length - 1]');
    expect(Object.keys(upd)).toContain(`worlds/${wid}/tiles/12,12`);
    expect(JSON.stringify(upd).length).toBeLessThan(600);
    expect(await game(`livePush(false, Date.now() + 1)`)).toBe(false);                     // nichts Neues: nichts senden
  });
  it('zuschauen: Änderungen kommen Feld für Feld an, ohne alles neu aufzubauen; Taler laufen mit', async () => {
    // Insel des anderen Geräts in die Datenbank legen
    game("state.town.name = 'Drüben'; state.money = 500; for (let i = 0; i < 4; i++) state.tiles.set((20 + i) + ',20', { b: 'feld', lvl: 1 }); recalc()");
    game("(sp => { cloudApi.tree = { users: { u1: { pub: { wid: 'w1', open: false }, live: { eco: sp.eco, priv: sp.priv } } }, worlds: { w1: { ...sp.maps, rest: sp.rest, owner: 'u1', open: false, rev: 3 } } }; })(liveSplit(serialize()))");
    game("startNew(); state.tutorial = -1");                                                 // dieses Gerät hat noch etwas anderes
    lead('ipad');
    await game('liveTick()'); await tick(); await tick();
    expect(game('state.town.name')).toBe('Drüben');
    expect(game('cloudMeta().rev')).toBe(3);                                                 // Version kam mit dem Spiegel
    game("walkers.push({ probe: true })");
    await game("cloudApi.update({ 'worlds/w1/tiles/30,30': JSON.stringify({ b: 'feld', lvl: 3 }), 'worlds/w1/tiles/20,20': null })"); await tick();
    expect(game("state.tiles.get('30,30').lvl")).toBe(3);
    expect(game("state.tiles.has('20,20')")).toBe(false);
    expect(game('walkers.some(w => w.probe)')).toBe(true);                                   // nicht neu aufgebaut
    await game(`cloudApi.update({ 'users/u1/live/eco': JSON.stringify({ money: 999, res: newRes(), science: 7, stats: { earned: 1 } }) })`); await tick();
    expect(game('state.money')).toBe(999);
    expect(game('cloudDirty(serialize())')).toBe(false);                                     // gilt nicht als eigene Änderung
  });
  it('Besuch (ohne Privates): Insel ja, Taler/Lager/Tagebuch nein', async () => {
    game("state.town.name = 'Besuchsheim'; state.money = 777777; state.res.holz = 50");
    game("(sp => { cloudApi.tree = { worlds: { w2: { ...sp.maps, rest: sp.rest, owner: 'u9', open: true } } }; })(liveSplit(serialize()))");
    game("startNew(); cloudUser = null");
    game("liveFollowStart('w2', false)"); await tick(); await tick();
    expect(game('state.town.name')).toBe('Besuchsheim');
    expect(game('state.money')).toBe(0);
    expect(game('state.res.holz')).toBe(0);
    expect(JSON.stringify(tree().worlds.w2)).not.toMatch(/777777/);                          // Taler liegen gar nicht im öffentlichen Teil
  });
  it('wer wieder führt, schreibt einmal alles neu', async () => {
    lead();
    await game('livePush(true)');
    lead('ipad');
    await game('liveTick()');
    expect(game('liveSent')).toBe(null);
  });
});

describe('Freunde und Besuchs-Link (Block 95)', () => {
  const as = (uid, display, town) => game(`cloudUser = { uid: '${uid}', name: '${uid}@x.de', display: '${display}' }; state.town.name = '${town}'; frMine = null; liveWid = null; frList = (cloudApi.tree.fr || {})['${uid}'] || {}`);
  it('Freundescode im Muster FNYMI-XXXXX, eindeutig, ohne verwechselbare Zeichen', async () => {
    const c = await game('frCode()');
    expect(game(`frCodeText('${c}')`)).toMatch(/^FNYMI-[A-HJ-KM-NP-Z2-9]{5}$/);
    expect(tree().codes[c]).toBe('u1');
    expect(await game('frCode()')).toBe(c);                                                  // bleibt
    expect(game("frCodeNorm(' fnymi-7f3qk ')")).toBe('7F3QK');
  });
  it('Anfrage → annehmen → befreundet (mit Besuchs-Kennung); entfernen auf beiden Seiten', async () => {
    as('A', 'Anna', 'Annastadt');
    const codeA = await game('frCode()');
    as('B', 'Ben', 'Benhausen');
    expect(await game(`frAdd('FNYMI-${codeA}')`)).toBe(null);
    expect(tree().fr.B.A.st).toBe('gesendet');
    expect(tree().fr.A.B.st).toBe('anfrage');
    expect(tree().fr.A.B.name).toMatch(/Ben · Benhausen/);
    as('A', 'Anna', 'Annastadt');
    await game("frAccept('B')");
    expect(tree().fr.A.B.st).toBe('freund');
    expect(tree().fr.B.A.st).toBe('freund');
    expect(tree().fr.B.A.wid).toBe(tree().users.A.pub.wid);                                 // Ben kann Anna besuchen
    expect(tree().fr.A.B.wid).toBe(tree().users.B.pub.wid);
    game('frList = cloudApi.tree.fr.A');
    await game("frRemove('B')");
    expect((tree().fr.A || {}).B).toBe(undefined);
    expect((tree().fr.B || {}).A).toBe(undefined);
  });
  it('falsche, eigene und doppelte Codes werden freundlich abgelehnt', async () => {
    const mine = await game('frCode()');
    expect(await game("frAdd('FNYMI-ZZZZZ')")).toMatch(/gibt es nicht/);
    expect(await game(`frAdd('${mine}')`)).toMatch(/eigener/);
    expect(await game("frAdd('abc')")).toMatch(/FNYMI-/);
  });
  it('neuer Link: alte Insel-Kennung geht nicht mehr, Freunde bekommen die neue', async () => {
    lead();
    await game('livePush(true)');
    const old = game('liveWid');
    game("frList = { F1: { st: 'freund', name: 'Fritz', wid: 'x' } }; cloudApi.tree.fr = { F1: { u1: { st: 'freund', wid: liveWid } } }");
    await game('liveNewLink()');
    const neu = game('liveWid');
    expect(neu).not.toBe(old);
    expect(tree().worlds[old]).toBe(undefined);
    expect(tree().worlds[neu].owner).toBe('u1');
    expect(tree().fr.F1.u1.wid).toBe(neu);
  });
  it('Besuche an/aus steht in der Insel (die Datenbank-Regel liest es dort)', async () => {
    lead();
    await game('livePush(true)');
    await game('liveSetOpen(true)');
    expect(tree().worlds[game('liveWid')].open).toBe(true);
    await game('liveSetOpen(false)');
    expect(tree().worlds[game('liveWid')].open).toBe(false);
  });
  it('Fenster „Freunde & Besuch“: Code, Eingabe, Liste; ohne Anmeldung Hinweis', async () => {
    await game('openFriends()');
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/FNYMI-/);
    game('cloudUser = null');
    await game('openFriends()');
    expect(game("document.getElementById('modal-card').textContent")).toMatch(/Melde dich/);
  });
});

describe('Prüfung von Stufe 3 (Block 95b)', () => {
  it('„Besuche an/aus“ wird beim Schreiben nie zurückgesetzt (anderes Gerät hat es umgestellt)', async () => {
    lead();
    await game('livePush(true)');
    const wid = game('liveWid');
    await game(`cloudApi.update({ 'worlds/${wid}/open': true, 'users/u1/pub/open': true })`);   // auf dem anderen Gerät eingeschaltet
    game('liveOpen = false; liveSent = null');                                               // dieses Gerät weiß es noch nicht
    await game('livePush(true)');
    expect(tree().worlds[wid].open).toBe(true);
  });
  it('Schreiben schlägt fehl (z. B. neuer Link von einem anderen Gerät): Kennung neu lesen, beim nächsten Mal alles neu', async () => {
    lead();
    await game('livePush(true)');
    game("cloudApi.update = (o => async u => { cloudApi.update = o; throw new Error('Permission denied'); })(cloudApi.update)");
    game("state.tiles.set('13,13', { b: 'feld', lvl: 1 }); recalc()");
    expect(await game('livePush(false, Date.now() + 10000)')).toBe(false);
    expect(game('[liveWid, liveSent]')).toEqual([null, null]);
    await game("cloudApi.set('users/u1/pub', { wid: 'neu1', open: false })");
    expect(await game('livePush()')).toBe(true);
    expect(tree().worlds.neu1.tiles['13,13']).toBeTruthy();
  });
  it('zuschauend: bekommt das Gerät den ganzen gesicherten Stand, gilt danach wieder der (neuere) Spiegel', async () => {
    game("state.town.name = 'Spiegel'; (sp => { cloudApi.tree = { users: { u1: { pub: { wid: 'w1' }, live: { eco: sp.eco, priv: sp.priv } } }, worlds: { w1: { ...sp.maps, rest: sp.rest, owner: 'u1' } } }; })(liveSplit(serialize()))");
    game('startNew(); state.tutorial = -1');
    lead('ipad');
    await game('liveTick()'); await tick(); await tick();
    expect(game('state.town.name')).toBe('Spiegel');
    game("state.town.name = 'Alter Stand'; liveRebase()");                                   // wie nach dem Laden eines älteren gesicherten Stands
    expect(game('state.town.name')).toBe('Spiegel');
  });
  it('eigenes zuschauendes Gerät: Insel unter der alten Kennung weg (neuer Link) → verbindet sich neu', async () => {
    game("(sp => { cloudApi.tree = { users: { u1: { pub: { wid: 'w1' }, live: { eco: sp.eco, priv: sp.priv } } }, worlds: { w1: { ...sp.maps, rest: sp.rest, owner: 'u1' } } }; })(liveSplit(serialize()))");
    lead('ipad');
    await game('liveTick()'); await tick(); await tick();
    expect(game('liveFollow.wid')).toBe('w1');
    await game("(async () => { const w = cloudApi.tree.worlds.w1; await cloudApi.update({ 'worlds/w2': w, 'users/u1/pub/wid': 'w2', 'worlds/w1': null }); })()"); await tick();
    expect(game('liveFollow')).toBe(null);
    await game('liveTick()'); await tick();
    expect(game('liveFollow.wid')).toBe('w2');
  });
  it('Freunde: zweite Anfrage an dieselbe Person wird freundlich abgefangen', async () => {
    game("cloudApi.tree = { codes: { ABCDE: 'X' } }; frList = { X: { st: 'gesendet' } }");
    expect(await game("frAdd('FNYMI-ABCDE')")).toMatch(/schon unterwegs/);
  });
  it('neuer Link auf einem nicht führenden Gerät: alter Link sofort weg, Hinweis, das führende Gerät schreibt dann unter dem neuen', async () => {
    lead();
    await game('livePush(true)');
    const old = game('liveWid');
    lead('ipad');                                                                             // jetzt führt ein anderes Gerät
    await game('liveNewLink()');
    expect(tree().worlds[old]).toBe(undefined);
    expect(tree().users.u1.pub.wid).not.toBe(old);
  });
});

