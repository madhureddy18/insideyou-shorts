/* @just.money.things — "Earn ₹1 every second. How long until you're as rich as Ambani?"
   Method: AI-generated scene stills (assets/shots/room) animated in code — slow camera push-ins, mouths synced to
   the voice, blinks, numbers on the wall TV, film-style cuts, captions.
   Facts: Ambani ≈ $80B ≈ ₹7 lakh crore (Forbes index, Nov 2026). 1 yr = 31,557,600 s.
   4,500 yrs × ₹1/s = ₹14,200 crore. ₹7 lakh crore at ₹1/s ≈ 2.2 lakh yrs. Farming began ~12,000 yrs ago. */
const SH = 'assets/shots/room/';
window.SCENE = {
  setup: { width: 1080, height: 1920, bg: 0x000000, fog: null, fov: 30, bloom: false },
  images: ['1-wide', '2-maddie-calm', '3-maddie-shock', '4-maddie-smile', '5-bittu-calm', '6-bittu-smug', '7-bittu-up', '8-behind'].map(n => SH + n + '.png'),
  lines: [
    { who: 'maddie', text: 'Bittu, if I earn ₹1 every second, when do I become as rich as Ambani?', say: 'Bittu, if I earn one rupee every second, when do I become as rich as Ambani?', speed: 1.2 },
    { who: 'bittu', text: 'Guess first.', say: 'Guess first.' },
    { who: 'maddie', text: 'Easy, maybe 10 years?', say: 'Easy, maybe ten years?', gap: 3.25, speed: 1.2 },
    { who: 'bittu', text: "That's ₹86,400 a day.", say: "That's eighty six thousand, four hundred a day." },
    { who: 'bittu', text: 'Just over ₹3 crore a year.', say: 'Just over three crore a year.' },
    { who: 'maddie', text: "So I'm basically rich already!", say: "So I'm basically rich already!", speed: 1.2 },
    { who: 'bittu', text: 'Start when the pyramids were built, 4,500 years ago.', say: 'Start when the pyramids were built, forty five hundred years ago.' },
    { who: 'bittu', text: "Today, you'd have ₹14,200 crore.", say: "Today, you'd have fourteen thousand, two hundred crore." },
    { who: 'maddie', text: "That's insane!", say: "That's insane!", speed: 1.2 },
    { who: 'bittu', text: 'Ambani has about ₹7 lakh crore.', say: 'Ambani has about seven lakh crore.' },
    { who: 'bittu', text: 'Almost fifty times more.', say: 'Almost fifty times more.' },
    { who: 'maddie', text: 'Then how long would I need?', say: 'Then how long would I need?', speed: 1.2 },
    { who: 'bittu', text: 'More than 2 lakh years.', say: 'More than two lakh years.' },
    { who: 'maddie', text: 'TWO LAKH YEARS?!', say: 'Two lakh years?!', gap: 0.15, speed: 1.15 },
    { who: 'bittu', text: "Humans hadn't even invented farming yet.", say: "Humans hadn't even invented farming yet." },
    { who: 'maddie', text: 'Okay, ₹2 a second then.', say: 'Okay, two rupees a second then.', speed: 1.2 },
    { who: 'bittu', text: 'Still a lakh years. Follow, while you count.', say: 'Still a lakh years. Follow, while you count.' },
  ],

  build(K, T) {
    const L = T.lines, B = i => L[i].t, E = i => L[i].end, D = E(16) + 2.4;
    const W = 1080, H = 1920, cl = K.clamp, eo = K.easeOut, pr = K.prog;
    const IM = n => window.IMAGES[SH + n + '.png'];

    // ---------- the shot library: faces in image fractions (x, y of image width/height; sizes in image-width units)
    const SHOTS = {
      W:  { img: '1-wide', focus: [0.5, 0.55], z: [1.0, 1.07],
            face: { maddie: { eyes: [[0.378, 0.509], [0.426, 0.509]], er: 0.0042, mouth: [0.404, 0.531], mw: 0.02 },
                    bittu: { eyes: [[0.595, 0.581], [0.636, 0.583]], er: 0.0045, beak: [0.609, 0.589], bw: 0.013 } } },
      MC: { img: '2-maddie-calm', focus: [0.53, 0.57], z: [1.02, 1.1],
            face: { maddie: { eyes: [[0.48, 0.548], [0.58, 0.548]], er: 0.0125, mouth: [0.532, 0.592], mw: 0.06 } } },
      MS: { img: '3-maddie-shock', focus: [0.33, 0.67], z: [1.04, 1.14],
            face: { maddie: { eyes: [[0.28, 0.656], [0.364, 0.656]], er: 0.016, mouth: [0.33, 0.688], mw: 0.045 } } },
      MH: { img: '4-maddie-smile', focus: [0.32, 0.68], z: [1.03, 1.11],
            face: { maddie: { eyes: [[0.28, 0.655], [0.35, 0.655]], er: 0.011, mouth: [0.322, 0.701], mw: 0.05, smile: true } } },
      BC: { img: '5-bittu-calm', focus: [0.59, 0.76], z: [1.04, 1.12],
            face: { bittu: { eyes: [[0.531, 0.727], [0.648, 0.727]], er: 0.022, beak: [0.578, 0.743], bw: 0.042 } } },
      BS: { img: '6-bittu-smug', focus: [0.59, 0.76], z: [1.06, 1.16],
            face: { bittu: { eyes: [[0.533, 0.723], [0.652, 0.723]], er: 0.022, beak: [0.58, 0.738], bw: 0.042, noBlink: true } } },
      BU: { img: '7-bittu-up', focus: [0.59, 0.76], z: [1.03, 1.11],
            face: { bittu: { eyes: [[0.531, 0.722], [0.643, 0.722]], er: 0.022, beak: [0.574, 0.736], bw: 0.042 } } },
      TV: { img: '8-behind', focus: [0.723, 0.45], z: [1.02, 1.32],
            tv: [[0.48, 0.3645], [0.967, 0.3376], [0.967, 0.56], [0.48, 0.543]] },   // TL, TR, BR, BL of the screen
    };
    // lid colours sampled from the stills (skin above Maddie's eyes, cream face patch around Bittu's)
    const sampleC = (img, fx, fy) => { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d');
      g.drawImage(img, Math.round(fx * img.width) - 1, Math.round(fy * img.height) - 1, 3, 3, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
    for (const s of Object.values(SHOTS)) { s.im = IM(s.img); if (!s.face) continue;
      for (const f of Object.values(s.face)) f.lid = f.eyes.map(([ex, ey]) => sampleC(s.im, ex, ey - f.er * 2.6 * s.im.width / s.im.height)); }

    // ---------- cut list (shot, start, end)
    const plan = [
      ['W', 0, 1.6], ['MC', 1.6, B(1) - 0.05], ['BS', B(1) - 0.05, E(1) + 0.03], ['TV', E(1) + 0.03, B(2) - 0.05],
      ['MH', B(2) - 0.05, B(3) - 0.05], ['TV', B(3) - 0.05, B(5) - 0.05], ['MH', B(5) - 0.05, B(6) - 0.05], ['TV', B(6) - 0.05, B(8) - 0.05],
      ['MS', B(8) - 0.05, B(9) - 0.05], ['TV', B(9) - 0.05, B(10) - 0.05], ['BU', B(10) - 0.05, B(11) - 0.05], ['MC', B(11) - 0.05, B(12) - 0.05],
      ['BS', B(12) - 0.05, B(13) - 0.05], ['MS', B(13) - 0.05, B(14) - 0.05], ['TV', B(14) - 0.05, B(15) - 0.05], ['MH', B(15) - 0.05, B(16) - 0.05],
      ['BC', B(16) - 0.05, E(16) + 0.35], ['W', E(16) + 0.35, D + 5],
    ];
    const shotAt = t => plan.find(([, a, b]) => t >= a && t < b) || plan[plan.length - 1];

    // ---------- canvas plane the whole reel is drawn on
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const vh = 2 * 10 * Math.tan(15 * Math.PI / 180);
    K.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(vh * W / H, vh), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })));

    // film grain tile
    const grain = document.createElement('canvas'); grain.width = grain.height = 256; { const g = grain.getContext('2d'), d = g.createImageData(256, 256), r = K.rng(9);
      for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 70; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 14; } g.putImageData(d, 0, 0); }
    const motes = Array.from({ length: 26 }, (_, i) => { const r = K.rng(30 + i); return { x: r(), y: r(), s: 1 + r() * 2.2, v: 0.004 + r() * 0.01, ph: r() * 6 }; });

    // ---------- TV graphics (1280×720), drawn onto the screen in shot 8
    const TVW = 1280, TVH = 720, tvc = document.createElement('canvas'); tvc.width = TVW; tvc.height = TVH; const g = tvc.getContext('2d');
    const FONT = (s, w = 900) => `${w} ${s}px "Inter Display", "Inter", "DejaVu Sans"`;
    const C = { orange: '#ff8a1f', gold: '#ffc53d', teal: '#2ec4b6', red: '#ff4d5e', white: '#ffffff', mute: '#9aa3c7' };
    const backE = k => { k = cl(k); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
    const pop = (t, t0, d = 0.3) => backE(pr(t, t0, t0 + d));
    const fmt = n => { const s = String(Math.round(n)); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3); };
    const rr = (c, X, Y, w, h, r) => { c.beginPath(); c.moveTo(X + r, Y); c.arcTo(X + w, Y, X + w, Y + h, r); c.arcTo(X + w, Y + h, X, Y + h, r); c.arcTo(X, Y + h, X, Y, r); c.arcTo(X, Y, X + w, Y, r); c.closePath(); };
    const txt = (s, X, Y, size, color = C.white, { w = 900, align = 'center', stroke = 0 } = {}) => { g.font = FONT(size, w); g.textAlign = align; g.textBaseline = 'middle'; if (stroke) { g.lineJoin = 'round'; g.lineWidth = stroke; g.strokeStyle = '#0b1026'; g.strokeText(s, X, Y); } g.fillStyle = color; g.fillText(s, X, Y); };
    const sc = (cx, cy, s, fn) => { if (s <= 0.001) return; g.save(); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy); fn(); g.restore(); };
    const chip = (s, cx, cy, bg, fg = '#0b1026', size = 40) => { g.font = FONT(size); const w = g.measureText(s).width + 56; rr(g, cx - w / 2, cy - size * 0.85, w, size * 1.7, size * 0.85); g.fillStyle = bg; g.fill(); txt(s, cx, cy + 2, size, fg); };
    const tvDraw = t => {
      const bg = g.createLinearGradient(0, 0, 0, TVH); bg.addColorStop(0, '#0d1433'); bg.addColorStop(1, '#1b2560'); g.fillStyle = bg; g.fillRect(0, 0, TVW, TVH);
      g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2; for (let gx = (t * 30) % 80; gx < TVW; gx += 80) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, TVH); g.stroke(); }
      if (t < B(2)) {                                                      // countdown
        const c = t - E(1), n = 3 - Math.floor(Math.max(0, c)), f = Math.max(0, c) % 1;
        chip('GUESS FIRST', 640, 95, C.gold, '#0b1026', 46);
        if (n >= 1 && n <= 3) { g.lineWidth = 26; g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(640, 400, 205, 0, 7); g.stroke();
          g.strokeStyle = C.gold; g.lineCap = 'round'; g.beginPath(); g.arc(640, 400, 205, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); g.stroke();
          sc(640, 400, backE(cl(f / 0.25)), () => txt(String(n), 640, 410, 260, C.white)); }
        txt('comment your guess 👇'.replace(' 👇', ''), 640, 665, 42, C.gold, { w: 800 });
      } else if (t < B(6)) {                                               // per day / per year
        chip('₹1 a second × 86,400 seconds', 640, 85, C.teal, '#0b1026', 38);
        const d = 86400 * eo(pr(t, B(3) + 0.3, B(3) + 1.3));
        sc(640, 260, pop(t, B(3) + 0.15), () => { txt('₹' + fmt(d), 640, 255, 150, C.gold, { stroke: 10 }); txt('EVERY DAY', 640, 360, 44, C.white, { w: 800 }); });
        if (t > B(4) - 0.1) { const y = 31557600 * eo(pr(t, B(4) + 0.1, B(4) + 1.0));
          sc(640, 540, pop(t, B(4)), () => { rr(g, 180, 445, 920, 200, 32); g.fillStyle = 'rgba(255,138,31,0.16)'; g.fill(); g.lineWidth = 4; g.strokeStyle = C.orange; g.stroke();
            txt('₹' + fmt(y), 640, 522, 110, C.white); txt('EVERY YEAR · just over ₹3 crore', 640, 605, 34, C.orange, { w: 800 }); }); }
      } else if (t < B(9)) {                                               // pyramids → ₹14,200 crore
        chip('START: 4,500 YEARS AGO', 640, 85, C.orange, '#0b1026', 40);
        const k = backE(pr(t, B(6) + 0.2, B(6) + 0.8)), base = 400, cx = 640;
        g.fillStyle = '#e8b56a'; g.beginPath(); g.ellipse(cx, base + 14, 380, 34, 0, 0, 7); g.fill();
        if (k > 0) { const hh = 230 * k, half = 220 * Math.min(1, k);
          g.fillStyle = '#f2c27a'; g.beginPath(); g.moveTo(cx - half, base); g.lineTo(cx, base - hh); g.lineTo(cx + half * 0.15, base); g.closePath(); g.fill();
          g.fillStyle = '#c98f45'; g.beginPath(); g.moveTo(cx + half * 0.15, base); g.lineTo(cx, base - hh); g.lineTo(cx + half, base); g.closePath(); g.fill(); }
        const ty = 500, lx = 200, rx = 1080, p = eo(pr(t, B(7), B(7) + 1.4));
        g.lineCap = 'round'; g.lineWidth = 9; g.strokeStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(lx, ty); g.lineTo(rx, ty); g.stroke();
        g.strokeStyle = C.orange; g.beginPath(); g.moveTo(lx, ty); g.lineTo(K.lerp(lx, rx, p), ty); g.stroke();
        g.fillStyle = C.white; g.beginPath(); g.arc(K.lerp(lx, rx, p), ty, 16, 0, 7); g.fill();
        txt('4,500 yrs ago', lx, ty + 44, 30, C.mute, { w: 700, align: 'left' }); txt('TODAY', rx, ty + 44, 30, C.white, { w: 800, align: 'right' });
        if (t > B(7)) sc(640, 630, pop(t, B(7)), () => txt('₹' + fmt(14200 * eo(pr(t, B(7) + 0.1, B(7) + 1.4))) + ' CRORE', 640, 630, 100, C.gold, { stroke: 10 }));
      } else if (t < B(12)) {                                              // bar chart, ~50×
        const baseY = 640, maxH = 500, g2 = eo(pr(t, B(9) + 0.15, B(9) + 1.2)), youH = Math.max(10, maxH / 49.3), amH = maxH * g2;
        g.fillStyle = C.teal; rr(g, 250, baseY - youH, 230, youH, 8); g.fill(); txt('YOU', 365, baseY + 36, 38, C.teal); txt('₹14,200 Cr', 365, baseY - youH - 32, 36, C.white, { w: 800 });
        const gr = g.createLinearGradient(0, baseY - amH, 0, baseY); gr.addColorStop(0, C.gold); gr.addColorStop(1, C.orange); g.fillStyle = gr; rr(g, 800, baseY - amH, 230, amH, 10); g.fill();
        txt('AMBANI', 915, baseY + 36, 38, C.gold); if (g2 > 0.05) txt('₹7,00,000 Cr', 915, baseY - amH - 32, 40, C.white, { w: 800 });
        if (t > B(10) - 0.6) sc(600, 320, pop(t, B(10) - 0.6), () => { g.save(); g.translate(600, 320); g.rotate(-0.1); rr(g, -150, -80, 300, 160, 34); g.fillStyle = C.red; g.fill(); txt('≈50×', 0, 6, 104, C.white); g.restore(); });
      } else if (t < B(14)) {                                              // years counter
        const yrs = 200000 * Math.pow(eo(pr(t, B(12) + 0.1, B(12) + 1.0)), 1.5);
        txt(fmt(yrs) + (yrs >= 199999 ? '+' : ''), 640, 320, 200, C.red, { stroke: 12 }); txt('YEARS', 640, 480, 84, C.white);
      } else if (t < B(15)) {                                              // zoom-out timeline
        chip('ZOOM OUT', 640, 85, C.teal, '#0b1026', 40);
        const lx = 110, rx = 1170, ty = 390, X = yrs => rx - (rx - lx) * yrs / 220000, dr = eo(pr(t, B(14), B(14) + 0.6));
        g.lineCap = 'round'; g.lineWidth = 9; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.moveTo(rx, ty); g.lineTo(K.lerp(rx, lx, dr), ty); g.stroke();
        const mark = (yrs, label, color, hh, t0, al) => { const k2 = pop(t, t0); if (k2 <= 0) return; const mx = X(yrs);
          g.fillStyle = color; g.beginPath(); g.arc(mx, ty, 15 * k2, 0, 7); g.fill(); g.strokeStyle = color; g.lineWidth = 4; g.beginPath(); g.moveTo(mx, ty); g.lineTo(mx, ty - hh * k2); g.stroke();
          g.globalAlpha = Math.min(1, k2); txt(label, mx + (al === 'right' ? 12 : al === 'left' ? -12 : 0), ty - hh - (hh > 0 ? 30 : -30), 34, color, { align: al }); g.globalAlpha = 1; };
        mark(0, 'TODAY', C.white, 210, B(14) + 0.1, 'right'); mark(4500, 'PYRAMIDS 4,500', '#f2c27a', 115, B(14) + 0.3, 'right');
        mark(12000, 'FARMING ~12,000', C.teal, -115, B(14) + 0.5, 'right'); mark(220000, 'YOU START: 2,00,000+ yrs ago', C.red, 115, B(14) + 0.8, 'left');
        if (t > B(14) + 1.1) sc(640, 620, pop(t, B(14) + 1.1), () => txt('No farming. No cities. Nothing.', 640, 620, 52, C.white));
      }
      txt('just.money.things', TVW - 30, TVH - 30, 24, 'rgba(255,255,255,0.45)', { w: 700, align: 'right' });
    };
    // draw an image onto a quad with two affine triangles (enough for a gently angled TV)
    const tri = (img, s0, s1, s2, d0, d1, d2) => {
      x.save(); x.beginPath(); x.moveTo(...d0); x.lineTo(...d1); x.lineTo(...d2); x.closePath(); x.clip();
      const [x0, y0] = s0, [x1, y1] = s1, [x2, y2] = s2, den = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      const a = ((d1[0] - d0[0]) * (y2 - y0) - (d2[0] - d0[0]) * (y1 - y0)) / den, b = ((d2[0] - d0[0]) * (x1 - x0) - (d1[0] - d0[0]) * (x2 - x0)) / den;
      const c = ((d1[1] - d0[1]) * (y2 - y0) - (d2[1] - d0[1]) * (y1 - y0)) / den, d = ((d2[1] - d0[1]) * (x1 - x0) - (d1[1] - d0[1]) * (x2 - x0)) / den;
      x.transform(a, c, b, d, d0[0] - a * x0 - b * y0, d0[1] - c * x0 - d * y0); x.drawImage(img, 0, 0); x.restore(); };

    // ---------- faces: blink + talking mouth / beak
    const blinkAt = (t, seed) => { const p = (t + seed) % 3.8; return p < 0.13 ? Math.sin(p / 0.13 * Math.PI) : 0; };
    const drawFace = (who, f, P, S, t, shotT0) => {
      // blink: lids slide over the eyes
      const bl = f.noBlink ? 0 : blinkAt(t, who === 'bittu' ? 1.7 : 0.4);
      if (bl > 0.02) f.eyes.forEach(([ex, ey], i) => { const [sx, sy] = P(ex, ey), r = f.er * S * 1.45;
        x.save(); x.beginPath(); x.ellipse(sx, sy, r, r * 1.15, 0, 0, 7); x.clip();
        x.fillStyle = f.lid[i]; x.fillRect(sx - r, sy - r * 1.2, r * 2, r * 2.4 * bl); x.restore(); });
      const a = K.voice(who, t); if (a < 0.03) return;
      if (who === 'maddie') {
        const [mx, my] = P(f.mouth[0], f.mouth[1]), w = f.mw * S, open = a;
        x.save(); x.translate(mx, my + w * 0.04);
        x.fillStyle = '#2a0f0b'; x.beginPath(); x.ellipse(0, w * 0.06, w * (f.smile ? 0.42 : 0.34) * (0.85 + 0.2 * open), w * 0.3 * open + w * 0.03, 0, 0, 7); x.fill();
        if (open > 0.25) { x.fillStyle = '#efe6dc'; x.beginPath(); x.ellipse(0, w * 0.06 - w * 0.3 * open * 0.7, w * 0.26, w * 0.05, 0, 0, 7); x.fill(); }
        if (open > 0.45) { x.fillStyle = '#8a3a32'; x.beginPath(); x.ellipse(0, w * 0.06 + w * 0.3 * open * 0.55, w * 0.18, w * 0.07 * open, 0, 0, 7); x.fill(); }
        x.restore();
      } else {
        const [bx, by] = P(f.beak[0], f.beak[1]), w = f.bw * S;   // beak tip: lower beak drops, dark mouth shows behind it
        x.save(); x.translate(bx, by + w * 0.12);
        x.fillStyle = '#3d1410'; x.beginPath(); x.ellipse(0, w * 0.12 * a, w * 0.3, w * 0.22 * a + w * 0.02, 0, 0, 7); x.fill();
        x.fillStyle = '#4b4340'; x.beginPath(); x.moveTo(-w * 0.3, w * 0.02 + w * 0.12 * a); x.lineTo(w * 0.3, w * 0.02 + w * 0.12 * a); x.lineTo(0, w * 0.2 + w * 0.32 * a); x.closePath(); x.fill();
        x.restore();
      }
    };

    // ---------- render one frame
    const shakes = [[B(13), 0.8, 18], [B(8), 0.35, 8], [B(10), 0.3, 6]];
    const update = t => {
      const [name, a, b] = shotAt(t), s = SHOTS[name], im = s.im;
      const k = pr(t, a, Math.max(a + 0.1, b)), z = K.lerp(s.z[0], s.z[1], k * (2 - k) * 0.5 + k * 0.5);   // gentle push-in
      const s0 = Math.max(W / im.width, H / im.height), iw = im.width * s0, ih = im.height * s0, ox = (W - iw) / 2, oy = (H - ih) / 2;
      const Fx = ox + s.focus[0] * iw, Fy = oy + s.focus[1] * ih;
      let sx = 0, sy = 0; shakes.forEach(([s1, d, amp]) => { if (t >= s1 && t < s1 + d) { const q = 1 - (t - s1) / d; sx += Math.sin(t * 73) * amp * q; sy += Math.cos(t * 61) * amp * q; } });
      const drift = Math.sin(t * 0.6) * 4;
      const P = (fx, fy) => [Fx + (ox + fx * iw - Fx) * z + sx + drift, Fy + (oy + fy * ih - Fy) * z + sy];
      const S = iw * z;                                                 // pixels per image-width unit
      x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      const [px0, py0] = P(0, 0); x.drawImage(im, px0, py0, iw * z, ih * z);
      if (s.tv) {                                                       // numbers on the TV, with a soft glow on the wall
        tvDraw(t); const q = s.tv.map(([fx, fy]) => P(fx, fy));
        x.save(); x.shadowColor = 'rgba(120,170,255,0.55)'; x.shadowBlur = 60; x.fillStyle = '#10183f'; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.closePath(); x.fill(); x.restore();
        tri(tvc, [0, 0], [TVW, 0], [0, TVH], q[0], q[1], q[3]); tri(tvc, [TVW, 0], [TVW, TVH], [0, TVH], q[1], q[2], q[3]);
        const sheen = x.createLinearGradient(q[0][0], q[0][1], q[2][0], q[2][1]); sheen.addColorStop(0, 'rgba(255,255,255,0.07)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
        x.fillStyle = sheen; x.beginPath(); q.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.closePath(); x.fill();
      }
      if (s.face) for (const [who, f] of Object.entries(s.face)) drawFace(who, f, P, S, t, a);
      // floating dust in the lamp light + grain + vignette
      x.save(); motes.forEach(m => { const yy = ((m.y - t * m.v) % 1 + 1) % 1, xx = m.x + Math.sin(t * 0.7 + m.ph) * 0.01; x.fillStyle = `rgba(255,220,170,${0.12 + 0.1 * Math.sin(t * 2 + m.ph)})`; x.beginPath(); x.arc(xx * W, yy * H, m.s, 0, 7); x.fill(); }); x.restore();
      x.save(); x.globalCompositeOperation = 'overlay'; const gx = Math.floor(K.rng(Math.floor(t * 24) + 1)() * 256), gy = Math.floor(K.rng(Math.floor(t * 24) + 7)() * 256);
      x.translate(-gx, -gy); x.fillStyle = x.createPattern(grain, 'repeat'); x.fillRect(0, 0, W + 256, H + 256); x.restore();
      const vg = x.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      if (t < 0.35) { x.fillStyle = `rgba(0,0,0,${1 - t / 0.35})`; x.fillRect(0, 0, W, H); }   // fade in
      tex.needsUpdate = true;
    };

    const sfx = [
      ['tick', E(1) + 0.05, 0.8], ['tick', E(1) + 1.05, 0.8], ['tick', E(1) + 2.05, 0.8],
      ['whoosh', B(3) - 0.05, 0.4], ['coin', B(3) + 1.3, 0.55], ['coin', B(4) + 1.0, 0.55],
      ['ding', B(5) + 0.1, 0.45], ['whoosh', B(6) - 0.05, 0.4], ['kaching', B(7) + 1.4, 0.55], ['pop', B(8), 0.45],
      ['whoosh', B(9) - 0.05, 0.4], ['bass', B(10) - 0.6, 0.6], ['riser', Math.max(0, B(12) - 1.6), 0.4], ['ding', B(12) + 1.0, 0.55],
      ['bass', B(13), 0.9], ['thud', B(13), 0.7], ['whoosh', B(14) - 0.05, 0.4], ['pop', B(15) + 0.1, 0.4],
    ];
    return { duration: D, update, shots: [{ t: [0, D + 5], from: { pos: [0, 0, 10], look: [0, 0, 0] } }], sfx,
      watermark: '@just.money.things', endCard: 'FOLLOW @just.money.things', music: {}, capFont: 'Inter Display', capMarginV: 1500 };
  },
};
