const { loadGame, game } = require('./helpers/load-game');

// Block 155 (Nutzer: „können wir auswählen und löschen nicht zusammenlegen … löschen aus dem Schnellzugriff entfernen“):
// 🧹 nicht mehr in der Leiste; ✋ Auswählen → 🗑️ Abreißen (Wald/Fels bleiben), Aufgenommenes → 🗑️ Wegwerfen, 👆 auf Wald/Fels →
// Roden/Sprengen, 👁 zeigt Tunnel, Entf/Rücktaste/E löschen Auswahl, Aufgenommenes oder das Ding im offenen Fenster
beforeAll(() => loadGame());
beforeEach(() => {
  game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true; plan = null; if (moving) cancelMove(); setTool("look"); setSeeThrough(false)');
  game('state.money = 1e6; for (const d of DESIGN) state.design.add(d.id); for (const r of Object.keys(RES)) state.res[r] = 999; for (let y = 3; y <= 24; y++) for (let x = 3; x <= 24; x++) { state.terra.set(x + "," + y, "grass"); state.tiles.delete(x + "," + y); state.decos.delete(x + "," + y); state.claimed.add(x + "," + y); } state.edges.clear(); undoStack.length = 0; recalc()');
});
const canvas = () => document.getElementById('world');
const scr = (x, y) => game(`(() => { const p = toScreen(${x}, ${y}); return [p.x, p.y]; })()`);
function ev(type, [x, y], { buttons = 0 } = {}) {
  const e = new window.MouseEvent(type, { clientX: x, clientY: y, button: 0, buttons, bubbles: true });
  Object.defineProperty(e, 'pointerId', { value: 7 }); Object.defineProperty(e, 'pointerType', { value: 'mouse' });
  canvas().dispatchEvent(e);
}
function select(a, b) {                                                   // mit ✋ ein Rechteck aufziehen
  game("setTool('verschieben')");
  const p = scr(...a), q = scr(...b);
  ev('pointerdown', p, { buttons: 1 });
  for (let i = 1; i <= 8; i++) ev('pointermove', [p[0] + (q[0] - p[0]) * i / 8, p[1] + (q[1] - p[1]) * i / 8], { buttons: 1 });
  ev('pointerup', q);
  game('syncSelBar()');
}
const key = k => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k }));
const at = (x, y) => game(`(state.tiles.get('${x},${y}') || {}).b`);
const town = () => game(`state.tiles.set('4,4', { b: 'haus', lvl: 1 }); state.tiles.set('5,4', { b: 'weg', lvl: 1 });
  state.decos.set('5,5', [null, { b: 'blumentopf', rot: 0 }, null, null]); state.terra.set('4,5', 'forest'); recalc()`);

describe('Schnellwerkzeuge entrümpelt (Block 155)', () => {
  it('Leiste: kein 🧹 mehr, ✋ heißt Auswählen; „Abreißen“ kommt nie in „Zuletzt gebaut“', () => {
    game('buildToolbar()');
    expect(game("[...document.querySelectorAll('#cats .quick[data-quick]')].map(b => b.dataset.quick)")).toEqual(['look', 'weg', 'verschieben']);
    expect(game("document.querySelector('.quick[data-quick=\"verschieben\"]').title")).toMatch(/^Auswählen/);
    game("noteRecent('abriss')");
    expect(game('recentList()')).not.toContain('abriss');
  });

  it('✋ Auswahl → 🗑️ Abreißen: alles Gebaute weg (Erstattung im Knopf), Wald bleibt; ↶ holt alles zurück', () => {
    town();
    select([4, 4], [5, 5]);
    expect(game("!document.getElementById('sel-bar').hidden")).toBe(true);
    const gain = game("planInfo(selDemolishPlan(plan)).gain");
    expect(gain).toBeGreaterThan(0);
    expect(game("document.getElementById('sel-del').textContent")).toContain(game(`fmt(${gain})`));
    const m0 = game('state.money');
    game("document.getElementById('sel-del').click()");
    expect([at(4, 4), at(5, 4), game("!!decosAt('5,5')")]).toEqual([undefined, undefined, false]);
    expect(game("terrainAt(4, 5)")).toBe('forest');                       // Wald bleibt stehen
    expect(game('state.money')).toBe(m0 + gain);
    expect(game('plan')).toBe(null);
    expect(game("document.getElementById('sel-bar').hidden")).toBe(true);
    game('undo()');
    expect([at(4, 4), at(5, 4), game("decosAt('5,5')[1].b")]).toEqual(['haus', 'weg', 'blumentopf']);
    expect(game('state.money')).toBe(m0);
  });

  it('Entf mit Auswahl reißt ab; Rathaus bleibt stehen', () => {
    town();
    const th = game("[...state.tiles].find(([, t]) => t.b === 'rathaus')[0]");
    const [rx, ry] = th.split(',').map(Number);
    game(`state.tiles.set('${rx + 4},${ry}', { b: 'haus', lvl: 1 }); recalc()`);
    select([rx - 1, ry - 1], [rx + 4, ry + 1]);
    key('Delete');
    expect(at(rx + 4, ry)).toBe(undefined);
    expect(at(rx, ry)).toBe('rathaus');
  });

  it('Aufgenommenes → 🗑️ Wegwerfen (Haus zur Hälfte zurück, wie Abreißen); Taste E bei Deko; Kopie am Finger hat kein Wegwerfen', () => {
    town();
    game("setTool('verschieben'); pickUp(4, 4, 0); syncSelBar()");
    expect(game("moving && moving.kind")).toBe('tile');
    expect(game("document.getElementById('sel-del').textContent")).toContain('Wegwerfen');
    game("cancelMove()"); const refund = game('demolishInfo(4, 4).refund'); game("pickUp(4, 4, 0); syncSelBar()");
    const m0 = game('state.money');
    game("document.getElementById('sel-del').click()");
    expect(game('moving')).toBe(null);
    expect(at(4, 4)).toBe(undefined);
    expect(game('state.money')).toBe(m0 + refund);
    game('undo()');
    expect(at(4, 4)).toBe('haus');
    expect(game('state.money')).toBe(m0);
    // Deko aufgenommen, Taste E
    game("pickUp(5, 5, 1)");
    key('e');
    expect(game("[moving, !!decosAt('5,5')]")).toEqual([null, false]);
    // Kopie: nichts wegzuwerfen
    game("startCopy(4, 4, 4, 4); syncSelBar()");
    expect(game('moving && moving.copy')).toBe(true);
    expect(game("document.getElementById('sel-bar').hidden")).toBe(true);
    key('Delete');
    expect(at(4, 4)).toBe('haus');
  });

  it('Gruppe am Finger wegwerfen: Gebäude, Deko und Zaun weg, Wald bleibt', () => {
    town();
    game("state.edges.set(edgeKeyOf({ x: 4, y: 4 }, { x: 5, y: 4 }), { b: 'zaun' }); recalc()");
    select([4, 4], [5, 5]);
    game("document.getElementById('sel-move').click()");
    expect(game("moving && moving.kind")).toBe('group');
    game("document.getElementById('sel-del').click()");
    expect([at(4, 4), at(5, 4), game("!!decosAt('5,5')"), game('state.edges.size'), game('terrainAt(4, 5)')]).toEqual([undefined, undefined, false, 0, 'forest']);
  });

  it('👆 auf Wald: Fenster mit 🪓 Roden samt Preis; Fels: 🧨 Sprengen; Entf im offenen Fenster entfernt das Ding', () => {
    town();
    game("state.terra.set('8,8', 'rock'); recalc()");
    let s = scr(4, 5);
    game(`tap(${s[0]}, ${s[1]}, false)`);
    expect(game("!document.getElementById('panel').hidden")).toBe(true);
    expect(game("document.getElementById('p-del').textContent")).toContain('Roden');
    const m0 = game('state.money');
    game("document.getElementById('p-del').click()");
    expect(game('terrainAt(4, 5)')).toBe('grass');
    expect(game('state.money')).toBe(m0 - 10);
    s = scr(8, 8);
    game(`tap(${s[0]}, ${s[1]}, false)`);
    expect(game("document.getElementById('p-del').textContent")).toContain('Sprengen');
    key('Backspace');
    expect(game('terrainAt(8, 8)')).toBe('grass');
    // Deko-Fenster offen → Entf entfernt sie
    game("openDecoInfo(5, 5, 1)");
    key('Delete');
    expect(game("!!decosAt('5,5')")).toBe(false);
  });

  it('👁 Durchsicht zeigt die Tunnel (bisher nur mit 🧹 in der Hand)', () => {
    game("state.tunnels.set('10,10', {}); state.tunnels.set('11,10', {}); recalc(); setTool('look')");
    const dashes = () => game('(() => { let n = 0; const o = g.setLineDash; g.setLineDash = function (...a) { n++; return o.apply(this, a); }; try { drawTunnelView(1); } finally { g.setLineDash = o; } return n; })()');
    expect(dashes()).toBe(0);
    game('setSeeThrough(true)');
    expect(dashes()).toBeGreaterThan(0);
    game('setSeeThrough(false)');
  });
});
