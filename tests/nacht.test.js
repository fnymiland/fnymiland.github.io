const { loadGame, game } = require('./helpers/load-game');

// Nachtlicht: Fenster und Lampen dürfen nicht durch das scheinen, was davor steht
beforeAll(() => loadGame());
beforeEach(() => { game('startNew()'); game('closeModal(); closePanel(); state.tutorial = -1; state.tipsOff = true'); });
afterEach(() => {
  game('night = 0; glows.length = 0');
  game('delete ctx.fill; delete ctx.fillRect; delete ctx.drawImage');
});

// merkt sich, mit welcher Mischart gezeichnet wurde
const record = () => game(`(() => {
  const ops = [];
  ctx.fill = () => ops.push(['fill', ctx.globalCompositeOperation, ctx.fillStyle]);
  ctx.fillRect = () => ops.push(['fillRect', ctx.globalCompositeOperation, ctx.fillStyle]);
  ctx.drawImage = () => ops.push(['drawImage', ctx.globalCompositeOperation]);
  return ops;
})()`);

describe('Nachtlicht', () => {
  it('ein Licht stanzt beim Zeichnen ein Loch – was danach davor kommt, deckt es wieder zu', () => {
    const ops = record();
    game('g = ctx; night = 0.45; glows.length = 0');
    game('glowQuad([[0, 0], [4, 0], [4, 4], [0, 4]], 10)');
    const punched = ops.filter(o => o[1] === 'destination-out').map(o => o[0]);
    expect(punched).toContain('drawImage');                      // weicher Schein
    expect(punched).toContain('fill');                           // das Fenster selbst
    expect(game('ctx.globalCompositeOperation')).toBe('source-over');
    expect(game('glows.length')).toBe(1);
  });

  it('große Gebäude (in Streifen gezeichnet) tragen ein Licht mehrfach ein – hinterlegt wird es nur einmal', () => {
    game('g = ctx; night = 0.45; glows.length = 0');
    for (let i = 0; i < 3; i++) game('glowQuad([[0, 0], [4, 0], [4, 4], [0, 4]], 10)');
    game("glowQuad([[20, 0], [24, 0], [24, 4], [20, 4]], 10, 'blue')");
    expect(game('glows.length')).toBe(4);
    expect(game('drawNight()')).toBe(2);
  });

  it('blaues Licht: hinter dem Schein liegt ein weicher runder Fleck, kein Quadrat, und er liegt vor den warmen Flächen (AUFGABEN 6e2)', () => {
    // Vorher: blaues Farbquadrat hinter dem weichen Loch – im warmen Schein einer Nachbarlaterne sah man seine geraden Kanten
    for (const warm of [false, true]) {
      const seq = game(`(() => {
        const q = (x, y) => [[x, y], [x + 4, y], [x + 4, y - 6], [x, y - 6]];
        const lights = [{ q: q(22, 50), r: 12 }, { q: q(40, 50), r: 12, tint: 'blue' }, { q: q(58, 50), r: 12 }, { q: q(200, 50), r: 12 }];
        const seq = [];
        nightLights(lights, [], [], ${warm}, { win: () => seq.push('win'), pre: () => seq.push('pre'), square: (x, y, s, f) => seq.push('sq ' + f),
          disc: (x, y, rr, f) => seq.push('disc ' + f), soft: (x, y, rr, f) => seq.push('soft ' + f), pic: () => seq.push('pic') });
        return seq;
      })()`);
      expect(seq.filter(s => s.includes('140,215,255') && !s.startsWith('soft'))).toEqual([]);
      expect(seq.indexOf('soft rgb(140,215,255)')).toBeGreaterThan(-1);
      expect(seq.indexOf('soft rgb(140,215,255)')).toBeLessThan(seq.findIndex(x => x.includes('255,205,100')));
      expect(seq.filter(x => x === 'soft rgb(255,205,100)').length).toBe(2);           // die warmen Nachbarn (18 Punkte daneben) ebenfalls weich,
      expect(seq.filter(x => x === 'sq rgb(255,205,100)').length).toBe(1);             // das ferne Licht bleibt ein Quadrat wie bisher
    }
  });

  it('tagsüber und in Vorschaubildern passiert nichts', () => {
    const ops = record();
    game('g = ctx; night = 0; glows.length = 0');
    game('glowQuad([[0, 0], [4, 0], [4, 4], [0, 4]], 10)');
    expect(ops).toEqual([]);
    expect(game('glows.length')).toBe(0);
  });

  it('am Ende wird nur das übrige Bild dunkel, die Löcher bekommen Licht dahinter', () => {
    game("state.tiles.set('4,4', { b: 'reihenhaus', lvl: 3, rot: 0 }); recalc()");
    game('resize(); const c = iso(4, 4); cam.x = c.x; cam.y = c.y; cam.z = 2');
    const ops = record();
    game('const _nightAt = nightAt; nightAt = () => 0.45; try { render(1000) } finally { nightAt = _nightAt }');
    const i = ops.findIndex(o => o[0] === 'fillRect' && String(o[2]).startsWith('rgba(25,35,85'));
    expect(ops[i][1]).toBe('source-atop');
    const after = ops.slice(i + 1).filter(o => o[2] === '#ffd873');       // die Fenster, nach der Nacht
    expect(after.length).toBeGreaterThan(0);
    expect(after.every(o => o[1] === 'destination-over')).toBe(true);
    expect(game('ctx.globalCompositeOperation')).toBe('source-over');
  });
});

describe('Reihenhaus', () => {
  it('keine Fenster übereinander – in keiner Stufe und Richtung', () => {
    const bad = game(`(() => {
      const orig = windowOn, out = [];
      try {
        for (let lvl = 1; lvl <= 3; lvl++) for (let rot = 0; rot < 4; rot++) {
          const wins = [];
          windowOn = (P, Q, t0, t1, h0, h1) => wins.push({ face: P.join() + '|' + Q.join(), t0, t1, h0, h1 });
          drawObject('reihenhaus', 300, 300, 1, 1000, 5, 5, lvl, { b: 'reihenhaus', lvl, rot });
          for (let i = 0; i < wins.length; i++) for (let j = i + 1; j < wins.length; j++) {
            const a = wins[i], b = wins[j];
            if (a.face === b.face && a.t0 < b.t1 && b.t0 < a.t1 && a.h0 < b.h1 && b.h0 < a.h1) out.push(lvl + '/' + rot);
          }
        }
      } finally { windowOn = orig; }
      return [...new Set(out)];
    })()`);
    expect(bad).toEqual([]);
  });
});
