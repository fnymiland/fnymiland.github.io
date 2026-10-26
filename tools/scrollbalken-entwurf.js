// Entwurf (Nutzer 26.10.2026: „können wir die Scrollbalken selbst gestalten? Der Standard sieht kacke aus“). Im Spiel laden, dann SB_APPLY('A'…'F'),
// SB_APPLY(null) nimmt es zurück. Gilt für die Scrollbereiche der Fenster (großes Fenster, Infofenster, Feld der Bauleiste).
// Chrome/Safari über ::-webkit-scrollbar; Firefox kennt nur Farbe und Breite (scrollbar-color/-width), das steht jeweils als Rückfall dabei.
(() => {
  const AREAS = ':is(#modal-card, #modal-card .tab-scroll, #panel .p-scroll, #sheet .tools, #modal-card .lx-list)';
  const grip = col => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='12'><path d='M1 3h6M1 6h6M1 9h6' stroke='${encodeURIComponent(col)}' stroke-width='1.4' stroke-linecap='round'/></svg>")`;
  const V = {
    A: { name: 'A Holzstab', sub: 'Hecke: Holzleiste mit Maserung und Nägeln · Wolken: weiße Wolkenleiste',
      hecke: { w: 12, track: 'transparent', thumb: 'repeating-linear-gradient(90deg, rgba(90,58,30,.18) 0 1px, transparent 1px 3px), linear-gradient(90deg, #d9a464, #b98446)', border: '2px solid #8a5a34', radius: '6px', ff: '#b98446 transparent' },
      wolke: { w: 12, track: 'transparent', thumb: 'linear-gradient(90deg, #ffffff, #e3ecf8)', border: '2px solid #a9bde0', radius: '8px', ff: '#c7d4e8 transparent' } },
    B: { name: 'B Schmal und dezent', sub: 'dünner runder Strich in der Schriftfarbe, halb durchsichtig, keine Schiene',
      hecke: { w: 7, track: 'transparent', thumb: 'rgba(90,61,36,.38)', border: '0', radius: '99px', ff: 'rgba(90,61,36,.38) transparent' },
      wolke: { w: 7, track: 'transparent', thumb: 'rgba(59,71,99,.32)', border: '0', radius: '99px', ff: 'rgba(59,71,99,.32) transparent' } },
    C: { name: 'C Mit Schiene', sub: 'eine feine Rille, darin ein runder Griff',
      hecke: { w: 10, track: 'rgba(90,61,36,.12)', thumb: '#c99a5e', border: '2px solid #f8f0dc', radius: '99px', ff: '#c99a5e rgba(90,61,36,.12)' },
      wolke: { w: 10, track: 'rgba(59,71,99,.1)', thumb: '#8fb0e4', border: '2px solid #ffffff', radius: '99px', ff: '#8fb0e4 rgba(59,71,99,.1)' } },
    D: { name: 'D Grün wie die Hecke', sub: 'Hecke: grüner Griff · Wolken: himmelblau',
      hecke: { w: 10, track: 'transparent', thumb: 'linear-gradient(90deg, #7fb85a, #4f8a3a)', border: '2px solid #3f7430', radius: '99px', ff: '#5f9a3a transparent' },
      wolke: { w: 10, track: 'transparent', thumb: 'linear-gradient(90deg, #a9cdf5, #6b95d8)', border: '2px solid #46699f', radius: '99px', ff: '#6b95d8 transparent' } },
    E: { name: 'E Griff mit Rillen', sub: 'wie ein Schieber: in der Mitte drei kleine Rillen zum Anfassen',
      hecke: { w: 12, track: 'rgba(90,61,36,.08)', thumb: `${grip('#7a5232')} center / 8px 12px no-repeat, linear-gradient(90deg, #e6cfa3, #c99a5e)`, border: '1.5px solid #8a5a34', radius: '99px', ff: '#c99a5e rgba(90,61,36,.08)' },
      wolke: { w: 12, track: 'rgba(59,71,99,.07)', thumb: `${grip('#46699f')} center / 8px 12px no-repeat, linear-gradient(90deg, #ffffff, #dce7f6)`, border: '1.5px solid #8fa8d4', radius: '99px', ff: '#b3c3dd rgba(59,71,99,.07)' } },
    F: { name: 'F Unsichtbar bis zum Scrollen', sub: 'wie B, aber nur zu sehen, solange man scrollt (danach blendet er aus)',
      hecke: { w: 7, track: 'transparent', thumb: 'rgba(90,61,36,.42)', border: '0', radius: '99px', ff: 'rgba(90,61,36,.42) transparent', fade: true },
      wolke: { w: 7, track: 'transparent', thumb: 'rgba(59,71,99,.36)', border: '0', radius: '99px', ff: 'rgba(59,71,99,.36) transparent', fade: true } },
  };
  const css = (look, o) => {
    const b = `body.look-${look} ${AREAS}`;
    return `
      ${b}::-webkit-scrollbar { width: ${o.w}px; height: ${o.w}px; }
      ${b}::-webkit-scrollbar-track { background: ${o.track}; border-radius: 99px; margin: 6px 0; }
      ${b}::-webkit-scrollbar-thumb { background: ${o.thumb}; border: ${o.border}; border-radius: ${o.radius}; background-clip: padding-box; min-height: 36px; }
      ${b}::-webkit-scrollbar-corner { background: transparent; }
      ${o.fade ? `${b}:not(.sb-on)::-webkit-scrollbar-thumb { background: transparent; border-color: transparent; }` : ''}
      @supports not selector(::-webkit-scrollbar) { ${b} { scrollbar-width: thin; scrollbar-color: ${o.ff}; } }`;
  };
  let timer = null;
  const onScroll = e => { const el = e.target; if (!(el instanceof Element)) return; el.classList.add('sb-on'); clearTimeout(el._sbT); el._sbT = setTimeout(() => el.classList.remove('sb-on'), 900); };
  window.SB_APPLY = v => {
    let st = document.getElementById('sb-style');
    if (!st) { st = document.createElement('style'); st.id = 'sb-style'; document.head.append(st); }
    document.removeEventListener('scroll', onScroll, true);
    if (!v) { st.textContent = ''; return 'aus'; }
    const o = V[v]; st.textContent = css('hecke', o.hecke) + css('wolke', o.wolke);
    if (o.hecke.fade) document.addEventListener('scroll', onScroll, true);
    return o.name;
  };
  window.SB_VARS = V;
})();
