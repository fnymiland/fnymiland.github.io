// Entwurf (Nutzer 25.10.2026: „gib mir Vorschläge für Button-Designs, die gefallen mir alle nicht“).
// Im Spiel ausführen (Konsole/Vorschau): öffnet ein Fenster mit sechs Knopf-Richtungen A–F, je eine Zeile, in den Farben des Aussehens.
// Ändert nichts am Spiel; der Stil hängt nur am Fenster (#kv-…).
(() => {
  const wolke = document.body.classList.contains('look-wolke');
  const C = wolke
    ? { p: '#6b95d8', pd: '#46699f', s: '#e3ecf8', sd: '#9fb3d6', on: '#3f6fbf', ond: '#2c4f8c', tx: '#3b4763', wood: '#dfe7f2', woodd: '#a9b9d4' }
    : { p: '#c9673f', pd: '#8f4127', s: '#e8cf9f', sd: '#b08a55', on: '#5c9c43', ond: '#3b6c2a', tx: '#5a3d24', wood: '#d7a868', woodd: '#8a5a34' };
  const wobble = (fill, stroke) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40' preserveAspectRatio='none'><filter id='f'><feTurbulence baseFrequency='0.06' numOctaves='2' seed='4'/><feDisplacementMap in='SourceGraphic' scale='3'/></filter><g filter='url(#f)'><rect x='3' y='3' width='94' height='34' rx='7' fill='${fill}' fill-opacity='.85'/><rect x='3' y='3' width='94' height='34' rx='7' fill='none' stroke='${stroke}' stroke-width='1.6'/><path d='M8 31 Q30 34 60 32 T93 30' stroke='${stroke}' stroke-width='.8' fill='none' opacity='.5'/></g></svg>`)}")`;
  const css = `
  #kv { font-family: 'Alegreya Sans', Nunito, sans-serif; }
  #kv .opt { padding: 9px 0 11px; border-top: 1.5px dotted rgba(120,100,70,.3); }
  #kv .ot { font: 800 13px/1.2 'Alegreya Sans', sans-serif; letter-spacing: .08em; text-transform: uppercase; color: ${C.tx}; opacity: .8; margin-bottom: 7px; }
  #kv .ot b { font-family: Alegreya, serif; font-size: 17px; letter-spacing: 0; text-transform: none; opacity: 1; margin-right: 6px; }
  #kv .r { display: flex; flex-wrap: wrap; gap: 8px 7px; align-items: center; }
  #kv button { all: unset; cursor: pointer; font: 800 14px/1 'Alegreya Sans', Nunito, sans-serif; padding: 9px 15px 10px; color: ${C.tx}; position: relative; }
  #kv button.c { font-size: 13px; padding: 6px 11px 7px; }
  #kv button.s { font-size: 12.5px; padding: 5px 10px 6px; }
  #kv .sep { width: 6px; }
  /* A Holzbrett: Maserung, Nagelköpfe, gemalte Schrift */
  #kv .A button { border-radius: 4px; border: 2px solid ${C.woodd}; box-shadow: 0 3px 0 ${C.woodd};
    background: radial-gradient(circle at 7px 50%, ${C.woodd} 1.6px, transparent 2.2px), radial-gradient(circle at calc(100% - 7px) 50%, ${C.woodd} 1.6px, transparent 2.2px),
      repeating-linear-gradient(178deg, rgba(0,0,0,.05) 0 2px, transparent 2px 6px, rgba(255,255,255,.06) 6px 7px), ${C.wood}; padding-left: 18px; padding-right: 18px; }
  #kv .A .b1 { background: radial-gradient(circle at 7px 50%, ${C.pd} 1.6px, transparent 2.2px), radial-gradient(circle at calc(100% - 7px) 50%, ${C.pd} 1.6px, transparent 2.2px), repeating-linear-gradient(178deg, rgba(0,0,0,.07) 0 2px, transparent 2px 6px), ${C.p}; border-color: ${C.pd}; box-shadow: 0 3px 0 ${C.pd}; color: #fff7e8; }
  #kv .A .c, #kv .A .s { padding-left: 12px; padding-right: 12px; background: repeating-linear-gradient(178deg, rgba(0,0,0,.05) 0 2px, transparent 2px 6px), ${C.wood}; }
  #kv .A .on { background: repeating-linear-gradient(178deg, rgba(0,0,0,.07) 0 2px, transparent 2px 6px), ${C.on}; border-color: ${C.ond}; box-shadow: 0 3px 0 ${C.ond}; color: #fff7e8; }
  /* B Kieselstein: weich unregelmäßig, gesprenkelt */
  #kv .B button { border-radius: 46% 54% 42% 58% / 58% 46% 54% 42%; background: radial-gradient(circle at 20% 30%, rgba(0,0,0,.08) 1px, transparent 1.6px) 0 0 / 9px 7px, ${C.s};
    box-shadow: inset -3px -4px 0 rgba(0,0,0,.08), inset 3px 3px 0 rgba(255,255,255,.35), 0 3px 4px rgba(40,30,20,.2); padding-left: 18px; padding-right: 18px; }
  #kv .B .b1 { background: radial-gradient(circle at 20% 30%, rgba(0,0,0,.1) 1px, transparent 1.6px) 0 0 / 9px 7px, ${C.p}; color: #fff7e8; }
  #kv .B .on { background: radial-gradient(circle at 20% 30%, rgba(0,0,0,.1) 1px, transparent 1.6px) 0 0 / 9px 7px, ${C.on}; color: #fff7e8; }
  /* C Filz mit Naht */
  #kv .C button { border-radius: 10px; background: ${C.s}; box-shadow: 0 2px 0 ${C.sd}, 0 3px 5px rgba(40,30,20,.15); outline: 1.6px dashed rgba(255,255,255,.75); outline-offset: -5px; }
  #kv .C .b1 { background: ${C.p}; box-shadow: 0 2px 0 ${C.pd}, 0 3px 5px rgba(40,30,20,.2); color: #fff7e8; }
  #kv .C .on { background: ${C.on}; box-shadow: 0 2px 0 ${C.ond}, 0 3px 5px rgba(40,30,20,.2); color: #fff7e8; }
  #kv .C .c, #kv .C .s { outline-offset: -4px; }
  /* D Glasierte Kachel: Glanz oben, Kante unten */
  #kv .D button { border-radius: 7px; background: linear-gradient(180deg, rgba(255,255,255,.55) 0 38%, rgba(255,255,255,0) 40%), ${C.s};
    box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.45), inset 0 -3px 0 rgba(0,0,0,.08), 0 4px 0 ${C.sd}; }
  #kv .D .b1 { background: linear-gradient(180deg, rgba(255,255,255,.35) 0 38%, rgba(255,255,255,0) 40%), ${C.p}; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.35), 0 4px 0 ${C.pd}; color: #fff7e8; }
  #kv .D .on { background: linear-gradient(180deg, rgba(255,255,255,.35) 0 38%, rgba(255,255,255,0) 40%), ${C.on}; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.35), 0 4px 0 ${C.ond}; color: #fff7e8; }
  /* E Spielklötzchen: wie die Blöcke der Insel – Oberseite hell, Vorderseite dunkel, schräge Seitenkante */
  #kv .E button { border-radius: 3px; background: ${C.s}; box-shadow: 0 7px 0 ${C.sd}, 0 7px 0 1px rgba(0,0,0,.08), 0 10px 8px rgba(40,30,20,.18); margin-bottom: 7px; border-top: 2px solid rgba(255,255,255,.55); }
  #kv .E .b1 { background: ${C.p}; box-shadow: 0 7px 0 ${C.pd}, 0 10px 8px rgba(40,30,20,.2); color: #fff7e8; }
  #kv .E .on { background: ${C.on}; box-shadow: 0 7px 0 ${C.ond}, 0 10px 8px rgba(40,30,20,.2); color: #fff7e8; }
  /* F Gezeichnet (Märchenbuch): Buntstift-Rand, Wasserfarbe innen, leicht wackelig */
  #kv .F button { background: ${wobble(C.s, C.tx)} center / 100% 100% no-repeat; padding-left: 17px; padding-right: 17px; }
  #kv .F .b1 { background: ${wobble(C.p, C.pd)} center / 100% 100% no-repeat; color: #fff7e8; text-shadow: 0 1px 0 rgba(0,0,0,.2); }
  #kv .F .on { background: ${wobble(C.on, C.ond)} center / 100% 100% no-repeat; color: #fff7e8; }
  `;
  const row = (k, name, note) => `<div class="opt ${k}"><div class="ot"><b>${k}</b>${name} <span style="text-transform:none;letter-spacing:0;font-weight:600">– ${note}</span></div>
    <div class="r"><button class="b1">Ausbauen</button><button class="b2">Tragen</button><span class="sep"></span>
    <button class="c on">Übersicht</button><button class="c">Zu tun</button><button class="c">Inseln</button><span class="sep"></span><button class="s">Los!</button></div></div>`;
  let st = document.getElementById('kv-style');
  if (!st) { st = document.createElement('style'); st.id = 'kv-style'; document.head.append(st); }
  st.textContent = css;
  openModal(`<h2>Knöpfe – sechs Richtungen</h2><div id="kv">
    ${row('A', 'Holzbrett', 'Maserung, Nagelköpfe, gemalte Schrift')}
    ${row('B', 'Kieselstein', 'rund, unregelmäßig, gesprenkelt')}
    ${row('C', 'Filz mit Naht', 'Stoff, weiße Stiche innen')}
    ${row('D', 'Glasierte Kachel', 'Glanz oben, Kante unten')}
    ${row('E', 'Spielklötzchen', 'wie die Blöcke der Insel, dick')}
    ${row('F', 'Gezeichnet', 'Buntstift-Rand, Wasserfarbe')}</div>`);
  document.getElementById('modal-card').style.width = 'min(640px, 100%)';
})();
