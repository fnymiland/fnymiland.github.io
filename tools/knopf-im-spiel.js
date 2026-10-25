// Entwurf (Nutzer 25.10.2026: „ich kann es nicht sagen, wenn ich es nicht zusammen mit den beiden Designs sehe“).
// Im Spiel ausführen: KV_APPLY('A'…'F') legt eine Knopf-Richtung vorübergehend auf alle echten Knöpfe (Haupt, Neben, Wahl-Chips, Los),
// in den Farben des aktuellen Aussehens. KV_APPLY(null) nimmt sie wieder weg. Ändert nichts Gespeichertes.
window.KV_APPLY = opt => {
  let st = document.getElementById('kv-live');
  if (!st) { st = document.createElement('style'); st.id = 'kv-live'; document.head.append(st); }
  document.body.classList.toggle('kv', !!opt);
  if (!opt) { st.textContent = ''; return; }
  const wolke = document.body.classList.contains('look-wolke');
  const C = wolke
    ? { p: '#6b95d8', pd: '#46699f', s: '#e3ecf8', sd: '#9fb3d6', on: '#3f6fbf', ond: '#2c4f8c', tx: '#3b4763', wood: '#dfe7f2', woodd: '#a9b9d4' }
    : { p: '#c9673f', pd: '#8f4127', s: '#e8cf9f', sd: '#b08a55', on: '#5c9c43', ond: '#3b6c2a', tx: '#5a3d24', wood: '#d7a868', woodd: '#8a5a34' };
  const P = 'body.kv .btn:not(.ghost):not(.danger):not(:disabled), body.kv #goal .task.ready .t-go';
  const S = 'body.kv .btn.ghost';
  const CH = 'body.kv .look:not(.on), body.kv .set-btn, body.kv .arrange-btn, body.kv .style-chip:not(.on), body.kv #goal .task-chips .chip';
  const ON = 'body.kv .look.on, body.kv .style-chip.on';
  const ALL = [P, S, CH, ON].join(', ');
  const wob = (fill, stroke) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'><filter id='f'><feTurbulence baseFrequency='0.06' numOctaves='2' seed='4'/><feDisplacementMap in='SourceGraphic' scale='3'/></filter><g filter='url(#f)'><rect x='3' y='3' width='94' height='34' rx='7' fill='${fill}' fill-opacity='.85'/><rect x='3' y='3' width='94' height='34' rx='7' fill='none' stroke='${stroke}' stroke-width='1.6'/></g></svg>`)}")`;
  const grain = a => `repeating-linear-gradient(178deg, rgba(0,0,0,${a}) 0 2px, transparent 2px 6px, rgba(255,255,255,.06) 6px 7px)`;
  const nails = c => `radial-gradient(circle at 7px 50%, ${c} 1.6px, transparent 2.2px), radial-gradient(circle at calc(100% - 7px) 50%, ${c} 1.6px, transparent 2.2px)`;
  const speck = 'radial-gradient(circle at 20% 30%, rgba(0,0,0,.09) 1px, transparent 1.6px) 0 0 / 9px 7px';
  const gloss = a => `linear-gradient(180deg, rgba(255,255,255,${a}) 0 38%, rgba(255,255,255,0) 40%)`;
  const R = {
    A: `${ALL} { border-radius: 4px !important; outline: none !important; }
      ${P} { background: ${nails(C.pd)}, ${grain(.07)}, ${C.p} !important; border: 2px solid ${C.pd} !important; box-shadow: 0 3px 0 ${C.pd} !important; color: #fff7e8 !important; padding-left: 18px; padding-right: 18px; }
      ${S} { background: ${nails(C.woodd)}, ${grain(.05)}, ${C.wood} !important; border: 2px solid ${C.woodd} !important; box-shadow: 0 3px 0 ${C.woodd} !important; color: ${C.tx} !important; }
      ${CH} { background: ${grain(.05)}, ${C.wood} !important; border: 1.5px solid ${C.woodd} !important; box-shadow: 0 2px 0 ${C.woodd} !important; color: ${C.tx} !important; }
      ${ON} { background: ${grain(.07)}, ${C.on} !important; border: 1.5px solid ${C.ond} !important; box-shadow: 0 2px 0 ${C.ond} !important; color: #fff7e8 !important; }`,
    B: `${ALL} { border-radius: 46% 54% 42% 58% / 58% 46% 54% 42% !important; border: 0 !important; outline: none !important; }
      ${P} { background: ${speck}, ${C.p} !important; box-shadow: inset -3px -4px 0 rgba(0,0,0,.1), inset 3px 3px 0 rgba(255,255,255,.3), 0 3px 4px rgba(40,30,20,.22) !important; color: #fff7e8 !important; }
      ${S}, ${CH} { background: ${speck}, ${C.s} !important; box-shadow: inset -3px -4px 0 rgba(0,0,0,.07), inset 3px 3px 0 rgba(255,255,255,.4), 0 3px 4px rgba(40,30,20,.18) !important; color: ${C.tx} !important; }
      ${ON} { background: ${speck}, ${C.on} !important; box-shadow: inset -3px -4px 0 rgba(0,0,0,.1), inset 3px 3px 0 rgba(255,255,255,.3), 0 3px 4px rgba(40,30,20,.22) !important; color: #fff7e8 !important; }`,
    C: `${ALL} { border-radius: 10px !important; border: 0 !important; outline: 1.6px dashed rgba(255,255,255,.75) !important; outline-offset: -5px !important; }
      ${P} { background: ${C.p} !important; box-shadow: 0 2px 0 ${C.pd}, 0 3px 5px rgba(40,30,20,.2) !important; color: #fff7e8 !important; }
      ${S}, ${CH} { background: ${C.s} !important; box-shadow: 0 2px 0 ${C.sd}, 0 3px 5px rgba(40,30,20,.15) !important; color: ${C.tx} !important; }
      ${ON} { background: ${C.on} !important; box-shadow: 0 2px 0 ${C.ond}, 0 3px 5px rgba(40,30,20,.2) !important; color: #fff7e8 !important; }
      body.kv .look, body.kv .style-chip, body.kv #goal .t-go { outline-offset: -4px !important; }`,
    D: `${ALL} { border-radius: 7px !important; border: 0 !important; outline: none !important; }
      ${P} { background: ${gloss(.35)}, ${C.p} !important; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.35), 0 4px 0 ${C.pd} !important; color: #fff7e8 !important; }
      ${S}, ${CH} { background: ${gloss(.55)}, ${C.s} !important; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.45), inset 0 -3px 0 rgba(0,0,0,.08), 0 4px 0 ${C.sd} !important; color: ${C.tx} !important; }
      ${ON} { background: ${gloss(.35)}, ${C.on} !important; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.35), 0 4px 0 ${C.ond} !important; color: #fff7e8 !important; }`,
    E: `${ALL} { border-radius: 3px !important; border: 0 !important; outline: none !important; border-top: 2px solid rgba(255,255,255,.5) !important; margin-bottom: 4px; }
      ${P} { background: ${C.p} !important; box-shadow: 0 6px 0 ${C.pd}, 0 9px 7px rgba(40,30,20,.2) !important; color: #fff7e8 !important; }
      ${S}, ${CH} { background: ${C.s} !important; box-shadow: 0 6px 0 ${C.sd}, 0 9px 7px rgba(40,30,20,.16) !important; color: ${C.tx} !important; }
      ${ON} { background: ${C.on} !important; box-shadow: 0 6px 0 ${C.ond}, 0 9px 7px rgba(40,30,20,.2) !important; color: #fff7e8 !important; }`,
    F: `${ALL} { border-radius: 0 !important; border: 0 !important; outline: none !important; box-shadow: none !important; }
      ${P} { background: ${wob(C.p, C.pd)} center / 100% 100% no-repeat !important; color: #fff7e8 !important; }
      ${S}, ${CH} { background: ${wob(C.s, C.tx)} center / 100% 100% no-repeat !important; color: ${C.tx} !important; }
      ${ON} { background: ${wob(C.on, C.ond)} center / 100% 100% no-repeat !important; color: #fff7e8 !important; }`,
  };
  st.textContent = R[opt] || '';
};
