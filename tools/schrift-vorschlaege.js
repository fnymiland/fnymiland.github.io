// Entwurf (Nutzer 26.10.2026: „jetzt müssen wir noch an die Schriftart ran – mach Vorschläge“). Im Spiel laden, dann
// await SF_APPLY('A'…'L'); SF_APPLY(null) nimmt es zurück. Lädt die Schriften von Google Fonts (wie index.html) und legt sie vorübergehend
// über die Oberfläche: Überschriften (heute Alegreya), Knöpfe/Leisten/Zahlen (heute Alegreya Sans) und Fließtext (heute Nunito).
// Die Schilder auf der Karte (Canvas) bleiben in der Vorschau unverändert.
(() => {
  const OPT = {
    A: { name: 'Märchenbuch', fam: 'Alegreya:wght@700;800&family=Alegreya+Sans:wght@500;700;800', head: "Alegreya, Georgia, serif", ui: "'Alegreya Sans', sans-serif", body: "'Alegreya Sans', sans-serif", bodyW: 700 },
    B: { name: 'Rund & freundlich', fam: 'Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800', head: "Fredoka, sans-serif", ui: "Fredoka, sans-serif", body: "Nunito, sans-serif", bodyW: 700, headW: 600, uiW: 600 },
    C: { name: 'Holzschild', fam: 'Bree+Serif&family=Signika:wght@400;500;600;700', head: "'Bree Serif', Georgia, serif", ui: "Signika, sans-serif", body: "Signika, sans-serif", bodyW: 500, headW: 400, uiW: 600 },
    D: { name: 'Kräftig & verspielt', fam: 'Baloo+2:wght@500;600;700;800', head: "'Baloo 2', sans-serif", ui: "'Baloo 2', sans-serif", body: "'Baloo 2', sans-serif", bodyW: 600, headW: 800, uiW: 700 },
    E: { name: 'Bilderbuch', fam: 'Grandstander:wght@600;700;800&family=Signika:wght@400;500;600;700', head: "Grandstander, sans-serif", ui: "Grandstander, sans-serif", body: "Signika, sans-serif", bodyW: 500, headW: 800, uiW: 700 },
    // rund & verspielt (Nutzer 26.10.2026: „irgendwas in Richtung rund und verspielt, gib mir da noch mehr“)
    F: { name: 'Knuffig', fam: 'Sniglet:wght@400;800&family=M+PLUS+Rounded+1c:wght@500;700;800', head: "Sniglet, sans-serif", ui: "Sniglet, sans-serif", body: "'M PLUS Rounded 1c', sans-serif", bodyW: 500, headW: 800, uiW: 800 },
    G: { name: 'Bonbon', fam: 'Lilita+One&family=Fredoka:wght@500;600;700', head: "'Lilita One', sans-serif", ui: "Fredoka, sans-serif", body: "Fredoka, sans-serif", bodyW: 500, headW: 400, uiW: 600 },
    H: { name: 'Seifenblase', fam: 'Comfortaa:wght@500;600;700', head: "Comfortaa, sans-serif", ui: "Comfortaa, sans-serif", body: "Comfortaa, sans-serif", bodyW: 600, headW: 700, uiW: 700 },
    I: { name: 'Schulheft', fam: 'Mali:wght@500;600;700', head: "Mali, sans-serif", ui: "Mali, sans-serif", body: "Mali, sans-serif", bodyW: 500, headW: 700, uiW: 700 },
    J: { name: 'Comic', fam: 'Chewy&family=Delius', head: "Chewy, sans-serif", ui: "Delius, sans-serif", body: "Delius, sans-serif", bodyW: 400, headW: 400, uiW: 400 },
    K: { name: 'Kieselrund', fam: 'Quicksand:wght@600;700&family=Varela+Round', head: "Quicksand, sans-serif", ui: "Quicksand, sans-serif", body: "'Varela Round', sans-serif", bodyW: 400, headW: 700, uiW: 700 },
    L: { name: 'Dicker Pinsel', fam: 'Paytone+One&family=M+PLUS+Rounded+1c:wght@500;700;800', head: "'Paytone One', sans-serif", ui: "'M PLUS Rounded 1c', sans-serif", body: "'M PLUS Rounded 1c', sans-serif", bodyW: 500, headW: 400, uiW: 800 },
  };
  // Überschriften: alles, was heute Alegreya (Serife) trägt; UI: Leisten, Knöpfe, Zahlen; Fließtext: der Rest
  const HEAD = 'h1, h2, h3, h4, #town-name, #goal h4, #panel h3, #modal-card h2, .card h2, #loading.big .ld-text';
  const UI = '#hud, #hud .pill, #hud b, #toolbar, #toolbar *, #toast, .btn, .look, .set-btn, .style-chip, .chip, .t-go, .sub, .wopt small, #panel h3 .lvl, .label, .sheet-h';
  window.SF_APPLY = async opt => {
    let st = document.getElementById('sf-style');
    if (!opt) { if (st) st.textContent = ''; return 'aus'; }
    const o = OPT[opt];
    let ln = document.getElementById('sf-link-' + opt);
    if (!ln) { ln = document.createElement('link'); ln.id = 'sf-link-' + opt; ln.rel = 'stylesheet'; ln.href = `https://fonts.googleapis.com/css2?family=${o.fam}&display=swap`; document.head.append(ln); await new Promise(r => { ln.onload = r; ln.onerror = r; setTimeout(r, 4000); }); }
    if (!st) { st = document.createElement('style'); st.id = 'sf-style'; document.head.append(st); }
    st.textContent = `
      body, button, input, textarea, select { font-family: ${o.body} !important; }
      #modal-card p, #modal-card li, #panel p, #goal .t-sub, .muted { font-weight: ${o.bodyW} !important; }
      ${UI} { font-family: ${o.ui} !important; }
      ${o.uiW ? `.btn, .look, .set-btn, .style-chip, .chip, .t-go, #hud b, #toolbar #cats .tx { font-weight: ${o.uiW} !important; }` : ''}
      ${HEAD} { font-family: ${o.head} !important; ${o.headW ? `font-weight: ${o.headW} !important;` : ''} }`;
    await document.fonts.ready;
    return `${opt} ${o.name}`;
  };
  window.SF_OPTS = OPT;
})();
