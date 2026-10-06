const { loadGame, game } = require('./helpers/load-game');

// Block 111: Freunde sehen den gewählten Namen, Freundescode ohne FNYMI- tippen, Neues präsenter (Zahl am 🌐, Karte beim Öffnen)
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

describe('Freunde: Name, Code, Neues (Block 111)', () => {
  it('Freunde sehen den Namen auf dem Schild – ohne ihn den Vornamen aus dem Konto', async () => {
    expect(game('myNick()')).toBe('Anna');
    game("setMe({ name: 'Fny' })");
    expect(game('myNick()')).toBe('Fny');
    expect(game('frMyName()')).toBe('Fny · ' + game('state.town.name'));
    game("frList = { f1: { st: 'freund', name: 'Ben' } }; frPushFlag()");
    await tick();
    expect(tree().fr.f1.u1.name).toBe('Fny · ' + game('state.town.name'));                  // umbenennen: Freunde sehen es gleich
    await tick();
    expect(tree().users.u1.profile.name).toBe('Fny');                                       // fürs Besuchen
    game("state.res.bretter = 50"); await game("mailSend('f1', 'Ben', { bretter: 5 })"); await tick();
    const mail = Object.values((tree().mail || {}).f1 || {})[0];
    expect(mail.n).toBe('Fny');                                                              // Päckchen: auch der gewählte Name
  });
  it('beim Besuch: Name aus dem eigenen Profil', () => {
    game("visitUser = { uid: 'u9', display: 'Max Muster' }");
    expect(game('visitName()')).toBe('Max');
    game("visitUser.nick = 'Kapitän'");
    expect(game('visitName()')).toBe('Kapitän');
  });
  it('Freundescode: FNYMI- steht fest davor, man tippt nur die 5 Zeichen; ein eingefügter ganzer Code wird gekürzt', () => {
    game("openNet('freunde')");
    return tick(20).then(() => {
      expect(game("!!document.querySelector('.fr-pre span') && document.querySelector('.fr-pre span').textContent")).toBe('FNYMI-');
      const typed = v => game(`(() => { const el = $('fr-in'); el.value = ${JSON.stringify(v)}; el.oninput(); return el.value; })()`);
      expect(typed('7f3q')).toBe('7F3Q');
      expect(typed('FNYMI-7F3QK')).toBe('7F3QK');
      expect(typed('fnymi 7f3qk')).toBe('7F3QK');
      expect(typed('7F3QKX')).toBe('7F3QK');
      expect(game("frCodeNorm('7F3QK')")).toBe('7F3QK');
    });
  });
  it('Zahl am 🌐-Knopf: Päckchen + neue Einträge, nach dem Nachsehen weg; Konflikt zeigt „!“', () => {
    game("bookAll = { a: { k: 'g', from: 'f1', n: 'Ben', at: Date.now() - 1000, t: 0 }, b: { k: 'h', from: 'f1', n: 'Ben', at: Date.now() - 500 } }; mailAll = { m: { from: 'f1', n: 'Ben', items: { bretter: 5 }, at: Date.now() } }; netDotShow()");
    expect(game("[$('net-dot').hidden, $('net-dot').textContent]")).toEqual([false, '3']);
    game("frLS('seen_u1', Date.now() + 5000); mailAll = {}; netDotShow()");
    expect(game("$('net-dot').hidden")).toBe(true);
    game("cloudState = 'konflikt'; netDotShow()");
    expect(game("$('net-dot').textContent")).toBe('!');
    game("cloudState = 'ok'");
  });
  it('„Während du weg warst“: einmal beim Öffnen, mit allem Neuen; nicht nochmal nach dem Neuladen', () => {
    game("bookAll = { a: { k: 'g', from: 'f1', n: 'Ben', a: 1, at: Date.now() - 1000, t: 0 }, b: { k: 'v', from: 'f2', n: 'Mia', at: Date.now() - 500 } }; mailAll = { m: { from: 'f1', n: 'Ben', items: { bretter: 5 }, at: Date.now() } }");
    game("closeModal(); welcomeDone = false; bookLoaded = mailLoaded = true; welcomeBack()");
    const txt = game("$('modal').hidden ? '' : $('modal-card').textContent");
    expect(txt).toContain('Während du weg warst');
    expect(txt).toContain('Ben hat dir ein Päckchen geschickt');
    expect(txt).toContain('Ben hat ins Gästebuch geschrieben');
    expect(txt).toContain('Mia war zu Besuch');
    game("$('wb-go').click()");
    expect(game("youTab")).toBe('freunde');
    game("closeModal(); welcomeDone = false; welcomeBack()");                                 // wie nach dem Neuladen
    expect(game("$('modal').hidden")).toBe(true);
    game("welcomeDone = false; frLS('wb_u1', 0); frLS('seen_u1', 0); openModal('<p>anderes</p>'); welcomeBack()");   // anderes Fenster offen: wartet
    expect(game("$('modal-card').textContent")).toContain('anderes');
    expect(game('welcomeDone')).toBe(false);
  });
  it('Block 112: Prüfung – eingefügte Nachricht, „!“ zuerst, erstes Mal nur die letzten Tage, Serverzeit, lange Namen', () => {
    expect(game("frCodeNorm('Mein Kachelhausen-Freundescode: FNYMI-7F3QK')")).toBe('7F3QK');
    expect(game("(() => { const el = $('fr-in') || document.createElement('input'); return frCodeNorm('7F' + 'FNYMI-7F3QK'); })()")).toBe('7F3QK');
    game("bookAll = { a: { k: 'h', from: 'f1', n: 'Ben', at: Date.now() - 1000 } }; mailAll = {}; cloudState = 'konflikt'; netDotShow()");
    expect(game("$('net-dot').textContent")).toBe('!');                                      // Konflikt geht vor der Zahl
    game("cloudState = 'ok'");
    const old = Date.now() - 10 * 864e5, recent = Date.now() - 864e5;
    game(`frLS('wb_u1', 0); frLS('seen_u1', 0); bookAll = { a: { k: 'v', from: 'f1', n: 'Alt', at: ${old} }, b: { k: 'v', from: 'f2', n: 'Neu', at: ${recent} } }; mailAll = {}`);
    const lines = game('welcomeBackLines()').join(' ');
    expect(lines).toContain('Neu'); expect(lines).not.toContain('Alt');                        // erstes Mal: nicht die ganze Vergangenheit
    game("closeModal(); welcomeDone = false; bookLoaded = mailLoaded = true; welcomeBack()");
    expect(game("frLS('wb_u1')")).toBe(recent);                                              // gemerkt nach Serverzeit
    game("closeModal(); welcomeDone = false; cloudState = 'laden'; welcomeBack()");
    expect(game('welcomeDone')).toBe(false);                                                 // während des Abgleichs: später
    game("cloudState = 'ok'; cloudUser.display = 'Maximilian-Alexander-Friedrich von Irgendwo'");
    expect(game('myNick().length')).toBeLessThanOrEqual(20);
  });
});
