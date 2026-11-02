/* @just.money.things — "Earn ₹1 every second. How long until you're as rich as Ambani?"  (v3)
   AI scene stills (assets/shots/room2) animated in code:
   - REAL lip sync: each talking shot has an AI-drawn "mouth open" twin; only the mouth area of the twin is blended in,
     following the voice loudness, so there is never a second pair of lips.
   - blinks, golden halo on Bittu, slow push-ins, numbers on the wall TV (with Maddy's hair kept in front),
     motion-graphics layer (hook banner, cards, slams, coin bursts, red flash), small captions at the bottom.
   Facts: Ambani ≈ $80B ≈ ₹7 lakh crore (Forbes index, Nov 2026). 1 yr = 31,557,600 s.
   4,500 yrs × ₹1/s = ₹14,200 crore. ₹7 lakh crore at ₹1/s ≈ 2.2 lakh yrs. Farming began ~12,000 yrs ago. */
const R2 = 'assets/shots/room2/';
const SHOT_FILES = ['wide', 'maddie-calm', 'maddie-shock', 'maddie-smile', 'bittu-calm', 'bittu-smug', 'bittu-up', 'behind-tv', 'behind-tv-fg',
  'maddie-calm-talk', 'maddie-shock-talk', 'maddie-smile-talk', 'bittu-calm-talk', 'bittu-smug-talk', 'bittu-up-talk'];
window.SCENE = {
  setup: { width: 1080, height: 1920, bg: 0x000000, fog: null, fov: 30, bloom: false },
  images: SHOT_FILES.map(n => R2 + n + '.png'),
  lines: [
    { who: 'maddie', text: 'Bittu, if I earn ₹1 every second, when do I become as rich as Ambani?', say: 'Bittu, if I earn one rupee every second, when do I become as rich as Ambani?' },
    { who: 'maddie', text: 'Hmm. Maybe 10 years?', say: 'Hmm. Maybe ten years?', gap: 0.7 },
    { who: 'bittu', text: "That's ₹86,400 a day.", say: "That's eighty six thousand, four hundred a day." },
    { who: 'bittu', text: 'Just over ₹3 crore a year.', say: 'Just over three crore a year.' },
    { who: 'maddie', text: "So I'm basically rich already!", say: "So I'm basically rich already!" },
    { who: 'bittu', text: 'Start when the pyramids were built, 4,500 years ago.', say: 'Start when the pyramids were built, forty five hundred years ago.' },
    { who: 'bittu', text: "Today, you'd have ₹14,200 crore.", say: "Today, you'd have fourteen thousand, two hundred crore." },
    { who: 'maddie', text: "That's insane!", say: "That's insane!" },
    { who: 'bittu', text: 'Ambani has about ₹7 lakh crore.', say: 'Ambani has about seven lakh crore.' },
    { who: 'bittu', text: 'Almost fifty times more.', say: 'Almost fifty times more.' },
    { who: 'maddie', text: 'Then how long would I need?', say: 'Then how long would I need?' },
    { who: 'bittu', text: 'More than 2 lakh years.', say: 'More than two lakh years.' },
    { who: 'maddie', text: 'TWO LAKH YEARS?!', say: 'Two lakh years?!', gap: 0.3 },
    { who: 'bittu', text: "Humans hadn't even invented farming yet.", say: "Humans hadn't even invented farming yet." },
    { who: 'maddie', text: 'Okay, ₹2 a second then.', say: 'Okay, two rupees a second then.' },
    { who: 'bittu', text: 'Still a lakh years. Follow, while you count.', say: 'Still a lakh years. Follow, while you count.' },
  ].map(l => ({ gap: 0.45, ...l })),

  build(K, T) {
    const L = T.lines, B = i => L[i].t, E = i => L[i].end, D = E(15) + 2.6;
    const W = 1080, H = 1920, cl = K.clamp, eo = K.easeOut, pr = K.prog;
    const IMG = n => window.IMAGES[R2 + n + '.png'];

    // ---------- shot library (all positions are fractions of the image width/height)
    const halo = (x, y, w) => ({ x, y, w });
    const SH = {
      WIDE: { img: 'wide', focus: [0.5, 0.55], z: [1.0, 1.06], halo: halo(0.63, 0.548, 0.11) },
      MC: { img: 'maddie-calm', talk: 'maddie-calm-talk', who: 'maddie', mouth: [0.3704, 0.6196, 0.0478, 0.0359], focus: [0.4, 0.6], z: [1.0, 1.06],
            eyes: [[0.3403, 0.575], [0.394, 0.5727]], er: 0.0088, ey: 1.6, halo: halo(0.837, 0.645, 0.2) },
      MS: { img: 'maddie-shock', talk: 'maddie-shock-talk', who: 'maddie', mouth: [0.3209, 0.6295, 0.042, 0.022], focus: [0.36, 0.62], z: [1.0, 1.07],
            eyes: [[0.2859, 0.5958], [0.333, 0.593]], er: 0.0135, ey: 1.15, halo: halo(0.847, 0.661, 0.19) },
      MH: { img: 'maddie-smile', talk: 'maddie-smile-talk', who: 'maddie', mouth: [0.3162, 0.6304, 0.0563, 0.0227], focus: [0.36, 0.62], z: [1.0, 1.06],
            eyes: [[0.2904, 0.6003], [0.341, 0.5943]], er: 0.0095, ey: 1.4, halo: halo(0.836, 0.656, 0.19) },
      BC: { img: 'bittu-calm', talk: 'bittu-calm-talk', who: 'bittu', mouth: [0.5441, 0.6633, 0.068, 0.0431], focus: [0.62, 0.68], z: [1.0, 1.07],
            eyes: [[0.4942, 0.6395], [0.6498, 0.6377]], er: 0.026, ey: 1.1, halo: halo(0.653, 0.527, 0.33) },
      BS: { img: 'bittu-smug', talk: 'bittu-smug-talk', who: 'bittu', mouth: [0.5733, 0.675, 0.0648, 0.0407], focus: [0.62, 0.68], z: [1.0, 1.07],
            halo: halo(0.66, 0.538, 0.33) },
      BU: { img: 'bittu-up', talk: 'bittu-up-talk', who: 'bittu', mouth: [0.5749, 0.687, 0.0808, 0.0323], focus: [0.62, 0.68], z: [1.0, 1.07],
            eyes: [[0.5125, 0.655], [0.6657, 0.6565]], er: 0.026, ey: 1.1, halo: halo(0.66, 0.541, 0.33) },
      TV: { img: 'behind-tv', fg: 'behind-tv-fg', focus: [0.93, 0.46], z: [1.04, 1.24],
            tv: [[0.3716, 0.3665], [0.978, 0.334], [0.978, 0.5796], [0.3716, 0.5696]], halo: halo(0.14, 0.632, 0.17) },
    };
    // lid colours for blinks (sampled just above each eye) + feathered mouth patches from the talking twins
    const sample = (img, fx, fy) => { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d');
      g.drawImage(img, Math.round(fx * img.width) - 1, Math.round(fy * img.height) - 1, 3, 3, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
    for (const s of Object.values(SH)) {
      s.im = IMG(s.img); const iw = s.im.width, ih = s.im.height;
      if (s.eyes) s.lid = s.eyes.map(([ex, ey]) => sample(s.im, ex, ey - s.er * s.ey * 2.4 * iw / ih));
      if (s.talk) {                                    // talking twin, cut to a soft oval around the mouth
        const tw = IMG(s.talk), [mx, my, mw, mh] = s.mouth;
        const pw = Math.round(Math.max(mw * 2.4, 0.08) * iw), ph = Math.round(Math.max(mh * 3.0, 0.045) * ih);
        const px = Math.round(mx * iw - pw / 2), py = Math.round(my * ih - ph / 2);
        const c = document.createElement('canvas'); c.width = pw; c.height = ph; const g = c.getContext('2d');
        g.drawImage(tw, px * tw.width / iw, py * tw.height / ih, pw * tw.width / iw, ph * tw.height / ih, 0, 0, pw, ph);
        g.globalCompositeOperation = 'destination-in';
        const rg = g.createRadialGradient(pw / 2, ph / 2, 0, pw / 2, ph / 2, Math.max(pw, ph) / 2); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.55, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.save(); g.translate(pw / 2, ph / 2); g.scale(1, ph / Math.max(pw, ph) * (pw > ph ? 1 : 1)); g.translate(-pw / 2, -ph / 2);
        g.fillStyle = rg; g.fillRect(0, -ph, pw, ph * 3); g.restore();
        s.patch = { c, fx: px / iw, fy: py / ih, fw: pw / iw, fh: ph / ih };
      }
    }

    // ---------- cut list
    const plan = [
      ['WIDE', 0, 2.3], ['MC', 2.3, B(1) - 0.05], ['MH', B(1) - 0.05, B(2) - 0.05],
      ['BS', B(2) - 0.05, B(3) - 0.05], ['TV', B(3) - 0.05, B(4) - 0.05], ['MH', B(4) - 0.05, B(5) - 0.05],
      ['BC', B(5) - 0.05, B(6) - 0.05], ['TV', B(6) - 0.05, B(7) - 0.05], ['MS', B(7) - 0.05, B(8) - 0.05],
      ['TV', B(8) - 0.05, B(9) - 0.05], ['BU', B(9) - 0.05, B(10) - 0.05], ['MC', B(10) - 0.05, B(11) - 0.05],
      ['BS', B(11) - 0.05, B(12) - 0.05], ['MS', B(12) - 0.05, B(13) - 0.05], ['TV', B(13) - 0.05, B(14) - 0.05],
      ['MH', B(14) - 0.05, B(15) - 0.05], ['BC', B(15) - 0.05, E(15) + 0.3], ['WIDE', E(15) + 0.3, D + 5],
    ];
    const shotAt = t => plan.find(([, a, b]) => t >= a && t < b) || plan[plan.length - 1];

    // ---------- one canvas for the whole frame
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const vh = 2 * 10 * Math.tan(15 * Math.PI / 180);
    K.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(vh * W / H, vh), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })));
    const grain = document.createElement('canvas'); grain.width = grain.height = 256; { const g = grain.getContext('2d'), d = g.createImageData(256, 256), r = K.rng(9);
      for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 60; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 12; } g.putImageData(d, 0, 0); }
    const motes = Array.from({ length: 24 }, (_, i) => { const r = K.rng(30 + i); return { x: r(), y: r(), s: 1 + r() * 2.2, v: 0.004 + r() * 0.01, ph: r() * 6 }; });

    // ---------- text / shape helpers (used for both the TV picture and the overlay graphics)
    const FONT = (s, w = 900) => `${w} ${s}px "Inter Display", "Inter", "DejaVu Sans"`;
    const C = { orange: '#ff8a1f', gold: '#ffc53d', teal: '#2ec4b6', red: '#ff4d5e', white: '#ffffff', mute: '#9aa3c7', ink: '#0b1026' };
    const backE = k => { k = cl(k); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
    const pop = (t, t0, d = 0.32) => backE(pr(t, t0, t0 + d));
    const winA = (t, a, b, f = 0.15) => cl(Math.min(pr(t, a, a + f), 1 - pr(t, b - f, b)));
    const fmt = n => { const s = String(Math.round(n)); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3); };
    const rr = (g, X, Y, w, h, r) => { g.beginPath(); g.moveTo(X + r, Y); g.arcTo(X + w, Y, X + w, Y + h, r); g.arcTo(X + w, Y + h, X, Y + h, r); g.arcTo(X, Y + h, X, Y, r); g.arcTo(X, Y, X + w, Y, r); g.closePath(); };
    const tx = (g, s, X, Y, size, color = C.white, { w = 900, align = 'center', stroke = 0, sc = C.ink, rot = 0 } = {}) => { g.save(); g.translate(X, Y); g.rotate(rot); g.font = FONT(size, w); g.textAlign = align; g.textBaseline = 'middle';
      if (stroke) { g.lineJoin = 'round'; g.lineWidth = stroke; g.strokeStyle = sc; g.strokeText(s, 0, 0); } g.fillStyle = color; g.fillText(s, 0, 0); g.restore(); };
    const zoomAt = (g, cx, cy, k, fn) => { if (k <= 0.001) return; g.save(); g.translate(cx, cy); g.scale(k, k); g.translate(-cx, -cy); fn(); g.restore(); };
    const chip = (g, s, cx, cy, bg, fg = C.ink, size = 44, rot = 0) => { g.save(); g.translate(cx, cy); g.rotate(rot); g.font = FONT(size); const w = g.measureText(s).width + 60; rr(g, -w / 2, -size * 0.9, w, size * 1.8, size * 0.9); g.fillStyle = bg; g.fill(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(s, 0, 3); g.restore(); };

    // ---------- TV picture (1280×720)
    const TVW = 1280, TVH = 720, tvc = document.createElement('canvas'); tvc.width = TVW; tvc.height = TVH; const g = tvc.getContext('2d');
    const tvDraw = t => {
      const bg = g.createLinearGradient(0, 0, 0, TVH); bg.addColorStop(0, '#0d1433'); bg.addColorStop(1, '#1b2560'); g.fillStyle = bg; g.fillRect(0, 0, TVW, TVH);
      g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2; for (let gx = (t * 30) % 80; gx < TVW; gx += 80) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, TVH); g.stroke(); }
      if (t < B(6) - 0.1) {                                                   // ₹86,400 a day → ₹3 crore a year
        chip(g, '₹1 a second × 86,400 seconds', 640, 80, C.teal, C.ink, 38);
        tx(g, '₹86,400', 640, 240, 150, C.gold, { stroke: 10 }); tx(g, 'EVERY DAY', 640, 345, 44, C.white, { w: 800 });
        const y = 31557600 * eo(pr(t, B(3) + 0.1, B(3) + 1.1));
        zoomAt(g, 640, 530, pop(t, B(3)), () => { rr(g, 170, 438, 940, 200, 32); g.fillStyle = 'rgba(255,138,31,0.16)'; g.fill(); g.lineWidth = 4; g.strokeStyle = C.orange; g.stroke();
          tx(g, '₹' + fmt(y), 640, 515, 112, C.white); tx(g, 'EVERY YEAR · just over ₹3 crore', 640, 598, 34, C.orange, { w: 800 }); });
      } else if (t < B(8) - 0.1) {                                            // pyramids → ₹14,200 crore
        chip(g, 'START: 4,500 YEARS AGO', 640, 80, C.orange, C.ink, 40);
        const base = 390, cx = 640; g.fillStyle = '#e8b56a'; g.beginPath(); g.ellipse(cx, base + 14, 380, 34, 0, 0, 7); g.fill();
        g.fillStyle = '#f2c27a'; g.beginPath(); g.moveTo(cx - 220, base); g.lineTo(cx, base - 230); g.lineTo(cx + 33, base); g.closePath(); g.fill();
        g.fillStyle = '#c98f45'; g.beginPath(); g.moveTo(cx + 33, base); g.lineTo(cx, base - 230); g.lineTo(cx + 220, base); g.closePath(); g.fill();
        const ty = 492, lx = 200, rx = 1080, p = eo(pr(t, B(6), B(6) + 1.6));
        g.lineCap = 'round'; g.lineWidth = 9; g.strokeStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(lx, ty); g.lineTo(rx, ty); g.stroke();
        g.strokeStyle = C.orange; g.beginPath(); g.moveTo(lx, ty); g.lineTo(K.lerp(lx, rx, p), ty); g.stroke(); g.fillStyle = C.white; g.beginPath(); g.arc(K.lerp(lx, rx, p), ty, 16, 0, 7); g.fill();
        tx(g, '4,500 yrs ago', lx, ty + 44, 30, C.mute, { w: 700, align: 'left' }); tx(g, 'TODAY', rx, ty + 44, 30, C.white, { w: 800, align: 'right' });
        zoomAt(g, 640, 630, pop(t, B(6)), () => tx(g, '₹' + fmt(14200 * eo(pr(t, B(6) + 0.1, B(6) + 1.6))) + ' CRORE', 640, 630, 100, C.gold, { stroke: 10 }));
      } else if (t < B(13) - 0.1) {                                           // bar chart
        const baseY = 640, maxH = 500, g2 = eo(pr(t, B(8) + 0.15, B(8) + 1.3)), youH = Math.max(10, maxH / 49.3), amH = maxH * g2;
        g.fillStyle = C.teal; rr(g, 380, baseY - youH, 230, youH, 8); g.fill(); tx(g, 'YOU', 495, baseY + 36, 38, C.teal); tx(g, '₹14,200 Cr', 495, baseY - youH - 32, 36, C.white, { w: 800 });
        const gr = g.createLinearGradient(0, baseY - amH, 0, baseY); gr.addColorStop(0, C.gold); gr.addColorStop(1, C.orange); g.fillStyle = gr; rr(g, 800, baseY - amH, 230, amH, 10); g.fill();
        tx(g, 'AMBANI', 915, baseY + 36, 38, C.gold); if (g2 > 0.05) tx(g, '₹7,00,000 Cr', 915, baseY - amH - 32, 40, C.white, { w: 800 });
      } else {                                                                // zoom-out timeline
        chip(g, 'ZOOM OUT', 640, 80, C.teal, C.ink, 40);
        const lx = 110, rx = 1170, ty = 390, X = yrs => rx - (rx - lx) * yrs / 220000, dr = eo(pr(t, B(13), B(13) + 0.6));
        g.lineCap = 'round'; g.lineWidth = 9; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.moveTo(rx, ty); g.lineTo(K.lerp(rx, lx, dr), ty); g.stroke();
        const mark = (yrs, label, color, hh, t0, al) => { const k2 = pop(t, t0); if (k2 <= 0) return; const mx = X(yrs);
          g.fillStyle = color; g.beginPath(); g.arc(mx, ty, 15 * k2, 0, 7); g.fill(); g.strokeStyle = color; g.lineWidth = 4; g.beginPath(); g.moveTo(mx, ty); g.lineTo(mx, ty - hh * k2); g.stroke();
          g.globalAlpha = Math.min(1, k2); tx(g, label, mx + (al === 'right' ? 12 : al === 'left' ? -12 : 0), ty - hh - (hh > 0 ? 30 : -30), 36, color, { align: al }); g.globalAlpha = 1; };
        mark(0, 'TODAY', C.white, 210, B(13) + 0.1, 'right'); mark(4500, 'PYRAMIDS 4,500', '#f2c27a', 115, B(13) + 0.3, 'right');
        mark(12000, 'FARMING ~12,000', C.teal, -115, B(13) + 0.5, 'right'); mark(220000, 'YOU START: 2,00,000+ yrs ago', C.red, 115, B(13) + 0.8, 'left');
        if (t > B(13) + 1.1) zoomAt(g, 640, 620, pop(t, B(13) + 1.1), () => tx(g, 'No farming. No cities. Nothing.', 640, 620, 54, C.white));
      }
    };
    const tri = (img, s0, s1, s2, d0, d1, d2) => {               // affine triangle (for the slightly angled TV)
      x.save(); x.beginPath(); x.moveTo(...d0); x.lineTo(...d1); x.lineTo(...d2); x.closePath(); x.clip();
      const [x0, y0] = s0, [x1, y1] = s1, [x2, y2] = s2, den = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      const a = ((d1[0] - d0[0]) * (y2 - y0) - (d2[0] - d0[0]) * (y1 - y0)) / den, b = ((d2[0] - d0[0]) * (x1 - x0) - (d1[0] - d0[0]) * (x2 - x0)) / den;
      const c = ((d1[1] - d0[1]) * (y2 - y0) - (d2[1] - d0[1]) * (y1 - y0)) / den, d = ((d2[1] - d0[1]) * (x1 - x0) - (d1[1] - d0[1]) * (x2 - x0)) / den;
      x.transform(a, c, b, d, d0[0] - a * x0 - b * y0, d0[1] - c * x0 - d * y0); x.drawImage(img, 0, 0); x.restore(); };

    // ---------- overlay graphics (top third is empty ceiling in every close-up — the graphics live there)
    const coinR = K.rng(21), bursts = [[B(3) + 0.9, 540, 760, 22], [B(4) + 0.1, 540, 700, 30], [B(6) + 1.5, 540, 760, 22]].map(([t0, cx, cy, n]) =>
      ({ t0, cx, cy, ps: Array.from({ length: n }, () => ({ a: -Math.PI / 2 + (coinR() - 0.5) * 2.6, v: 900 + coinR() * 900, s: 18 + coinR() * 16, sp: (coinR() - 0.5) * 18 })) }));
    const coin = (X, Y, r, spin) => { const sx = Math.abs(Math.cos(spin)); x.save(); x.translate(X, Y); x.scale(Math.max(0.15, sx), 1);
      x.fillStyle = '#e8a91c'; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.fillStyle = '#ffd34d'; x.beginPath(); x.arc(-r * 0.08, -r * 0.08, r * 0.82, 0, 7); x.fill();
      x.fillStyle = '#c98a10'; x.font = FONT(r * 1.1); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹', -r * 0.05, r * 0.02); x.restore(); };
    const speedLines = (k, t, color) => { const r = K.rng(5); x.save(); x.globalAlpha = 0.5 * k; x.strokeStyle = color; x.lineCap = 'round';
      for (let i = 0; i < 44; i++) { const a = r() * Math.PI * 2, r0 = 560 + r() * 260 - (t * 900 % 160), len = 160 + r() * 240; x.lineWidth = 3 + r() * 6;
        x.beginPath(); x.moveTo(W / 2 + Math.cos(a) * r0, H * 0.45 + Math.sin(a) * r0); x.lineTo(W / 2 + Math.cos(a) * (r0 + len), H * 0.45 + Math.sin(a) * (r0 + len)); x.stroke(); } x.restore(); };
    const panel = (cy, h, fn, k) => zoomAt(x, W / 2, cy, k, () => { rr(x, 70, cy - h / 2, W - 140, h, 44); x.fillStyle = 'rgba(11,16,38,0.78)'; x.fill(); x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,0.16)'; x.stroke(); fn(); });
    const overlay = t => {
      x.fillStyle = 'rgba(255,255,255,0.16)'; x.fillRect(0, 0, W, 10); x.fillStyle = C.orange; x.fillRect(0, 0, W * cl(t / D), 10);   // progress bar
      // hook (from frame 1)
      { const a = winA(t, 0, B(1) - 0.1, 0.12); if (a > 0) { x.save(); x.globalAlpha = a;
        zoomAt(x, W / 2, 300, Math.min(1, pop(t, 0.0, 0.35) + 0.4), () => { rr(x, 80, 190, 920, 220, 46); x.fillStyle = 'rgba(11,16,38,0.86)'; x.fill(); x.lineWidth = 6; x.strokeStyle = C.orange; x.stroke();
          tx(x, '₹1 EVERY SECOND', W / 2, 268, 84, C.gold); tx(x, 'vs  AMBANI 👑'.replace(' 👑', ''), W / 2, 350, 56, C.white, { w: 800 }); });
        const n = Math.floor(Math.max(0, t)) + 1;
        zoomAt(x, 260, 490, pop(t, 0.5), () => chip(x, 'YOU: ₹' + n, 260, 490, C.teal, C.ink, 46, -0.05));
        zoomAt(x, 820, 490, pop(t, 0.8), () => chip(x, 'AMBANI: ???', 820, 490, C.gold, C.ink, 46, 0.05));
        x.restore(); } }
      // "10 years?"
      { const a = winA(t, B(1), B(2)); if (a > 0) zoomAt(x, W / 2, 380, pop(t, B(1) + 0.15) * a, () => { x.save(); x.translate(W / 2, 380); x.rotate(-0.05); rr(x, -290, -105, 580, 210, 64); x.fillStyle = C.white; x.fill(); tx(x, '10 YEARS?', 0, 6, 100, C.ink); x.restore(); }); }
      // ₹86,400 a day card while Bittu says it (TV takes over on the next line)
      { const a = winA(t, B(2), B(3) - 0.05); if (a > 0) { x.save(); x.globalAlpha = a; panel(400, 380, () => {
          chip(x, '₹1 × 60 × 60 × 24', W / 2, 270, C.teal, C.ink, 40);
          tx(x, '₹' + fmt(86400 * eo(pr(t, B(2) + 0.3, B(2) + 1.4))), W / 2, 420, 150, C.gold, { stroke: 12 }); tx(x, 'EVERY DAY', W / 2, 530, 46, C.white, { w: 800 }); }, pop(t, B(2))); x.restore(); } }
      // RICH?!
      { const a = winA(t, B(4), B(5)); if (a > 0) zoomAt(x, W / 2, 380, pop(t, B(4) + 0.1) * a, () => tx(x, 'RICH?!', W / 2, 380, 200, C.gold, { stroke: 20, rot: -0.07 })); }
      // pyramids teaser card
      { const a = winA(t, B(5), B(6) - 0.05); if (a > 0) { x.save(); x.globalAlpha = a; panel(400, 380, () => {
          chip(x, 'START: 4,500 YEARS AGO', W / 2, 270, C.orange, C.ink, 42);
          const k = backE(pr(t, B(5) + 0.4, B(5) + 1.0)), base = 540, cx = W / 2;
          if (k > 0) { const hh = 200 * k, half = 190 * Math.min(1, k);
            x.fillStyle = '#f2c27a'; x.beginPath(); x.moveTo(cx - half, base); x.lineTo(cx, base - hh); x.lineTo(cx + half * 0.15, base); x.closePath(); x.fill();
            x.fillStyle = '#c98f45'; x.beginPath(); x.moveTo(cx + half * 0.15, base); x.lineTo(cx, base - hh); x.lineTo(cx + half, base); x.closePath(); x.fill(); } }, pop(t, B(5))); x.restore(); } }
      // INSANE!
      { const a = winA(t, B(7), B(8)); if (a > 0) { speedLines(a, t, '#ffffff'); zoomAt(x, W / 2, 380, pop(t, B(7)) * a, () => tx(x, 'INSANE!', W / 2, 380, 180, C.white, { stroke: 20, sc: C.red, rot: 0.06 })); } }
      // ≈50×
      { const a = winA(t, B(9), B(10)); if (a > 0) zoomAt(x, W / 2, 400, pop(t, B(9) + 0.1) * a, () => { x.save(); x.translate(W / 2, 400); x.rotate(-0.08); rr(x, -240, -130, 480, 260, 56); x.fillStyle = C.red; x.fill(); tx(x, '≈50×', 0, 8, 170, C.white); x.restore(); }); }
      // ? ? ?
      { const a = winA(t, B(10), B(11)); if (a > 0) [[240, 360, -0.3], [540, 290, 0.1], [840, 380, 0.3]].forEach(([qx, qy, r], i) => zoomAt(x, qx, qy, pop(t, B(10) + i * 0.1) * a, () => tx(x, '?', qx, qy + Math.sin(t * 5 + i) * 12, 210, i % 2 ? C.gold : C.white, { stroke: 14, rot: r }))); }
      // years counter → SLAM
      { const a = winA(t, B(11), E(12) + 0.6); if (a > 0) { const shock = t >= B(12);
        if (shock) { const f = 1 - pr(t, B(12), B(12) + 0.5); x.fillStyle = `rgba(255,40,70,${0.42 * f})`; x.fillRect(0, 0, W, H); speedLines(a, t, '#ff4d5e'); }
        const yrs = 200000 * Math.pow(eo(pr(t, B(11) + 0.1, B(11) + 1.0)), 1.5);
        zoomAt(x, W / 2, 380, (shock ? pop(t, B(12), 0.25) * (1.05 + 0.03 * Math.sin(t * 40)) : pop(t, B(11))) * a, () => {
          tx(x, fmt(yrs) + (yrs >= 199999 ? '+' : ''), W / 2, 330, 190, shock ? C.red : C.gold, { stroke: 18 }); tx(x, 'YEARS', W / 2, 480, 110, C.white, { stroke: 14 }); }); } }
      // ₹2 a second
      { const a = winA(t, B(14), B(15)); if (a > 0) zoomAt(x, W / 2, 400, pop(t, B(14) + 0.1) * a, () => chip(x, '₹2 / SECOND?', W / 2, 400, C.teal, C.ink, 84, -0.04)); }
      // final answer
      { const a = winA(t, B(15), D + 1); if (a > 0) zoomAt(x, W / 2, 360, pop(t, B(15)) * a, () => { tx(x, 'STILL', W / 2, 270, 74, C.white, { stroke: 10 }); tx(x, '1,00,000+ YEARS', W / 2, 385, 112, C.gold, { stroke: 14 }); }); }
      // coin bursts
      bursts.forEach(b => { const u = t - b.t0; if (u < 0 || u > 1.6) return; b.ps.forEach(p => { x.globalAlpha = cl(1.6 - u); coin(b.cx + Math.cos(p.a) * p.v * u, b.cy + Math.sin(p.a) * p.v * u + 1400 * u * u, p.s, u * p.sp); }); x.globalAlpha = 1; });
    };

    // ---------- one frame
    const blinkAt = (t, seed) => { const p = (t + seed) % 3.9; return p < 0.13 ? Math.sin(p / 0.13 * Math.PI) : 0; };
    let mouthLvl = 0, lastT = -1;
    const shakes = [[B(12), 0.8, 18], [B(7), 0.35, 8], [B(9), 0.3, 6]];
    const update = t => {
      const [name, a, b] = shotAt(t), s = SH[name], im = s.im;
      const k = pr(t, a, Math.max(a + 0.1, b)), z = K.lerp(s.z[0], s.z[1], k);
      const s0 = Math.max(W / im.width, H / im.height), iw = im.width * s0, ih = im.height * s0, ox = (W - iw) / 2, oy = (H - ih) / 2;
      const Fx = ox + s.focus[0] * iw, Fy = oy + s.focus[1] * ih;
      let sx = 0, sy = 0; shakes.forEach(([s1, d, amp]) => { if (t >= s1 && t < s1 + d) { const q = 1 - (t - s1) / d; sx += Math.sin(t * 73) * amp * q; sy += Math.cos(t * 61) * amp * q; } });
      const P = (fx, fy) => [Fx + (ox + fx * iw - Fx) * z + sx, Fy + (oy + fy * ih - Fy) * z + sy];
      const S = iw * z;
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      const [p0x, p0y] = P(0, 0); x.drawImage(im, p0x, p0y, iw * z, ih * z);
      // lip sync: blend the AI-drawn open mouth in, following the voice
      if (s.patch) { const v = K.voice(s.who, t), target = cl((v - 0.06) * 2.4);
        mouthLvl = (lastT < 0 || Math.abs(t - lastT) > 0.2) ? target : mouthLvl + (target - mouthLvl) * 0.6; lastT = t;
        if (mouthLvl > 0.02) { const [qx, qy] = P(s.patch.fx, s.patch.fy); x.save(); x.globalAlpha = cl(mouthLvl); x.drawImage(s.patch.c, qx, qy, s.patch.fw * S, s.patch.fh * ih * z / (ih * z) * (ih * z)); x.restore(); } }
      // blinks
      if (s.eyes) { const bl = blinkAt(t, s.who === 'bittu' ? 1.7 : 0.4);
        if (bl > 0.02) s.eyes.forEach(([ex, ey], i) => { const [cx, cy] = P(ex, ey), r = s.er * S * 1.35, ry = r * s.ey;
          x.save(); x.beginPath(); x.ellipse(cx, cy, r, ry * 1.05, 0, 0, 7); x.clip(); x.fillStyle = s.lid[i]; x.fillRect(cx - r, cy - ry * 1.1, r * 2, ry * 2.2 * bl); x.restore(); }); }
      // TV picture + hair kept in front of it
      if (s.tv) { tvDraw(t); const q = s.tv.map(([fx, fy]) => P(fx, fy));
        x.save(); x.shadowColor = 'rgba(120,170,255,0.5)'; x.shadowBlur = 70; x.fillStyle = '#10183f'; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.closePath(); x.fill(); x.restore();
        tri(tvc, [0, 0], [TVW, 0], [0, TVH], q[0], q[1], q[3]); tri(tvc, [TVW, 0], [TVW, TVH], [0, TVH], q[1], q[2], q[3]);
        x.drawImage(IMG(s.fg), p0x, p0y, iw * z, ih * z); }
      // Bittu's halo (glowing, bobbing)
      if (s.halo) { const [hx, hy] = P(s.halo.x, s.halo.y + Math.sin(t * 2.2) * 0.004), rx = s.halo.w * S * 0.36, ry = rx * 0.28;
        x.save(); x.globalCompositeOperation = 'lighter'; const gl = x.createRadialGradient(hx, hy, 0, hx, hy, rx * 1.5); gl.addColorStop(0, 'rgba(255,200,90,0.28)'); gl.addColorStop(1, 'rgba(255,200,90,0)');
        x.fillStyle = gl; x.fillRect(hx - rx * 1.6, hy - rx * 1.6, rx * 3.2, rx * 3.2); x.restore();
        x.save(); x.shadowColor = 'rgba(255,196,70,0.95)'; x.shadowBlur = rx * 0.5; x.strokeStyle = '#ffd56a'; x.lineWidth = Math.max(3, rx * 0.15);
        x.beginPath(); x.ellipse(hx, hy, rx, ry, Math.sin(t * 1.3) * 0.05, 0, 7); x.stroke(); x.strokeStyle = 'rgba(255,248,220,0.9)'; x.lineWidth = Math.max(1.5, rx * 0.05); x.stroke(); x.restore(); }
      // dust, grain, vignette
      motes.forEach(m => { const yy = ((m.y - t * m.v) % 1 + 1) % 1, xx = m.x + Math.sin(t * 0.7 + m.ph) * 0.01; x.fillStyle = `rgba(255,220,170,${0.1 + 0.08 * Math.sin(t * 2 + m.ph)})`; x.beginPath(); x.arc(xx * W, yy * H, m.s, 0, 7); x.fill(); });
      x.save(); x.globalCompositeOperation = 'overlay'; const gx = Math.floor(K.rng(Math.floor(t * 24) + 1)() * 256), gy = Math.floor(K.rng(Math.floor(t * 24) + 7)() * 256);
      x.translate(-gx, -gy); x.fillStyle = x.createPattern(grain, 'repeat'); x.fillRect(0, 0, W + 256, H + 256); x.restore();
      const vg = x.createRadialGradient(W / 2, H * 0.55, H * 0.32, W / 2, H * 0.55, H * 0.78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.32)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      overlay(t);
      tex.needsUpdate = true;
    };
    const sfx = [
      ['pop', 0.05, 0.5], ['pop', 0.5, 0.45], ['pop', 0.8, 0.45], ['pop', B(1) + 0.15, 0.5],
      ['whoosh', B(2) - 0.05, 0.4], ['coin', B(2) + 1.4, 0.5], ['whoosh', B(3) - 0.05, 0.4], ['coin', B(3) + 0.9, 0.55],
      ['ding', B(4) + 0.1, 0.45], ['coin', B(4) + 0.1, 0.5], ['whoosh', B(5) - 0.05, 0.4], ['whoosh', B(6) - 0.05, 0.4], ['kaching', B(6) + 1.6, 0.55],
      ['whoosh', B(7), 0.45], ['whoosh', B(8) - 0.05, 0.4], ['bass', B(9) + 0.1, 0.6], ['riser', Math.max(0, B(11) - 1.4), 0.4], ['ding', B(11) + 1.0, 0.5],
      ['bass', B(12), 0.9], ['thud', B(12), 0.7], ['whoosh', B(13) - 0.05, 0.4], ['pop', B(14) + 0.1, 0.4], ['ding', B(15), 0.4],
    ];
    return { duration: D, update, shots: [{ t: [0, D + 5], from: { pos: [0, 0, 10], look: [0, 0, 0] } }], sfx,
      watermark: '@just.money.things', endCard: 'FOLLOW @just.money.things', music: {}, capFont: 'Inter Display', capMarginV: 150, capSize: 54 };
  },
};
