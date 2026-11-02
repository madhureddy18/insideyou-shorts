/* @just.money.things — "Earn ₹1 every second. How long until you're as rich as Ambani?"
   Format: AI character cutouts (Maddie + Bittu the penguin) over code-drawn motion graphics.
   Facts: Ambani ≈ $80B ≈ ₹7 lakh crore (Forbes index, Nov 2026). 1 yr = 31,557,600 s.
   4,500 yrs × ₹1/s = ₹14,200 crore. ₹7 lakh crore / ₹1/s ≈ 2.2 lakh yrs. Farming began ~12,000 yrs ago. */
window.SCENE = {
  setup: { width: 1080, height: 1920, bg: 0x0b1026, fog: null, fov: 30, bloom: false },
  images: ['assets/cutouts/maddie_shock.png', 'assets/cutouts/bittu_shock.png'],
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
    { who: 'maddie', text: 'TWO LAKH YEARS?!', say: 'Two lakh years?!', gap: 0.12, speed: 1.15 },
    { who: 'bittu', text: "Humans hadn't even invented farming yet.", say: "Humans hadn't even invented farming yet." },
    { who: 'maddie', text: 'Okay, ₹2 a second then.', say: 'Okay, two rupees a second then.', speed: 1.2 },
    { who: 'bittu', text: 'Still a lakh years. Follow, while you count.', say: 'Still a lakh years. Follow, while you count.' },
  ],

  build(K, T) {
    const L = T.lines, B = i => L[i].t, E = i => L[i].end;
    const D = E(16) + 1.9;
    const W = 1080, H = 1920;
    const FONT = (s, w = 900) => `${w} ${s}px "Inter Display", "Inter", "DejaVu Sans"`;
    const C = { bg0: '#0b1026', bg1: '#18215a', orange: '#ff8a1f', gold: '#ffc53d', teal: '#2ec4b6', red: '#ff4d5e', white: '#ffffff', mute: '#9aa3c7' };

    // full-screen canvas plane (the whole reel is drawn in 2D on this)
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const vh = 2 * 10 * Math.tan(15 * Math.PI / 180);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(vh * W / H, vh), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    K.scene.add(plane);
    const IM = window.IMAGES, mad = IM['assets/cutouts/maddie_shock.png'], bit = IM['assets/cutouts/bittu_shock.png'];

    // ---------- helpers
    const cl = K.clamp, eo = K.easeOut, pr = K.prog;
    const back = k => { k = cl(k); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
    const pop = (t, t0, d = 0.32) => back(pr(t, t0, t0 + d));
    const fmt = n => { const s = String(Math.round(n)); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3); };
    const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    const txt = (s, X, Y, size, color = C.white, { w = 900, align = 'center', stroke = 0, sc = '#000', alpha = 1, base = 'middle' } = {}) => {
      x.save(); x.globalAlpha *= alpha; x.font = FONT(size, w); x.textAlign = align; x.textBaseline = base;
      if (stroke) { x.lineJoin = 'round'; x.lineWidth = stroke; x.strokeStyle = sc; x.strokeText(s, X, Y); }
      x.fillStyle = color; x.fillText(s, X, Y); x.restore();
    };
    const fit = (s, size, maxW, w = 900) => { x.font = FONT(size, w); const m = x.measureText(s).width; return m > maxW ? size * maxW / m : size; };
    const scaled = (cx, cy, s, fn) => { if (s <= 0.001) return; x.save(); x.translate(cx, cy); x.scale(s, s); x.translate(-cx, -cy); fn(); x.restore(); };
    const chip = (s, cx, cy, bg, fg = '#0b1026', size = 40) => { x.font = FONT(size); const w = x.measureText(s).width + 56; rr(cx - w / 2, cy - size * 0.85, w, size * 1.7, size * 0.85); x.fillStyle = bg; x.fill(); txt(s, cx, cy + 2, size, fg); };
    const card = (X, Y, w, h, { fill = 'rgba(255,255,255,0.08)', line = 'rgba(255,255,255,0.18)', r = 36 } = {}) => { rr(X, Y, w, h, r); x.fillStyle = fill; x.fill(); x.lineWidth = 3; x.strokeStyle = line; x.stroke(); };
    const vis = (t, a, b, f = 0.18) => cl(Math.min(pr(t, a, a + f), 1 - pr(t, b - f, b)));     // fade window
    const speaking = (who, t) => L.some(l => l.who === who && t >= l.t && t < l.end - 0.04);

    // shakes / punches
    const shakes = [[B(10), 0.45, 14], [B(13), 0.7, 26], [B(13) + 0.35, 0.4, 12]];
    const punches = [[B(8), 0.5, 0.05], [B(12) + 1.0, 0.5, 0.05], [B(13), 0.6, 0.08]];

    // ---------- background
    const rnd = K.rng(7), dots = Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * H, r: 1 + rnd() * 2.5, s: 0.2 + rnd() * 0.8 }));
    const bg = (t, flash) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1026'); g.addColorStop(0.55, '#141b4a'); g.addColorStop(1, '#0d1333');
      x.fillStyle = g; x.fillRect(-60, -60, W + 120, H + 120);
      const glow = x.createRadialGradient(W / 2, 720, 40, W / 2, 720, 700); glow.addColorStop(0, 'rgba(255,138,31,0.20)'); glow.addColorStop(1, 'rgba(255,138,31,0)');
      x.fillStyle = glow; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(255,255,255,0.045)'; x.lineWidth = 2;                      // drifting grid
      const off = (t * 40) % 90;
      for (let gx = -90 + off; gx < W + 90; gx += 90) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
      for (let gy = -90 + off; gy < H + 90; gy += 90) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
      dots.forEach(d => { const yy = (d.y - t * 30 * d.s + H) % H; x.fillStyle = `rgba(255,255,255,${0.15 + 0.25 * d.s})`; x.beginPath(); x.arc(d.x, yy, d.r, 0, 7); x.fill(); });
      if (flash > 0) { x.fillStyle = `rgba(255,60,80,${0.35 * flash})`; x.fillRect(-60, -60, W + 120, H + 120); }
    };

    // ---------- characters
    const drawChar = (img, cx, bottom, h, t, who, enterT, fromX) => {
      const k = eo(pr(t, enterT, enterT + 0.45)); if (k <= 0) return;
      const talk = speaking(who, t), act = talk ? 1 : 0;
      const bounce = talk ? Math.abs(Math.sin(t * 13.5)) * 16 : 0;
      const breathe = 1 + Math.sin(t * 2.2 + (who === 'bittu' ? 1.5 : 0)) * 0.012;
      const s = (0.9 + 0.1 * act) * breathe, hh = h * s, ww = hh * img.width / img.height;
      const X = K.lerp(fromX, cx, k) - ww / 2, Y = bottom - hh - bounce;
      x.save(); x.globalAlpha = 0.45 + 0.55 * Math.max(act, 0.35);
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.beginPath(); x.ellipse(K.lerp(fromX, cx, k), bottom - 6, ww * 0.42, 18, 0, 0, 7); x.fill();
      x.translate(X + ww / 2, Y + hh); x.rotate(talk ? Math.sin(t * 6.8) * 0.025 : 0); x.drawImage(img, -ww / 2, -hh, ww, hh); x.restore();
    };

    // ---------- the beats
    const yearSec = 31557600;
    const drawBeats = t => {
      // HOOK (0 → B2): challenge chip, YOU vs AMBANI
      { const a = vis(t, 0, B(3) - 0.05);
        if (a > 0) { x.save(); x.globalAlpha = a;
          const cdown = t >= E(1) && t < B(2);
          scaled(W / 2, 250, pop(t, 0.05), () => chip(cdown ? 'GUESS FIRST' : 'THE ₹1 PER SECOND CHALLENGE', W / 2, 250, cdown ? C.gold : C.orange, '#0b1026', 40));
          const dim = cdown ? 0.25 : 1; x.globalAlpha = a * dim;
          scaled(290, 640, pop(t, 0.35), () => { card(80, 400, 420, 480, { fill: 'rgba(46,196,182,0.14)', line: 'rgba(46,196,182,0.6)' });
            txt('YOU', 290, 470, 50, C.teal); txt('₹1 / sec', 290, 545, 44, C.white, { w: 700 });
            const n = Math.floor(Math.max(0, t)) + 1;
            txt('₹' + fmt(n), 290, 690, fit('₹' + fmt(n), 110, 360), C.white); txt('earned so far', 290, 800, 30, C.mute, { w: 600 }); });
          scaled(W / 2, 640, pop(t, 0.6), () => txt('VS', W / 2, 640, 70, C.orange, { stroke: 10, sc: '#0b1026' }));
          scaled(790, 640, pop(t, 0.85), () => { card(580, 400, 420, 480, { fill: 'rgba(255,197,61,0.12)', line: 'rgba(255,197,61,0.65)' });
            // crown
            x.fillStyle = C.gold; x.beginPath(); x.moveTo(720, 520); x.lineTo(735, 455); x.lineTo(765, 495); x.lineTo(790, 445); x.lineTo(815, 495); x.lineTo(845, 455); x.lineTo(860, 520); x.closePath(); x.fill();
            txt('AMBANI', 790, 580, 50, C.gold); txt('???', 790, 700, 120, C.white); txt('richest in India', 790, 800, 30, C.mute, { w: 600 }); });
          x.restore();
          // countdown 3-2-1
          if (cdown) { const c = t - E(1), n = 3 - Math.floor(c / 1.0), f = (c % 1.0);
            if (n >= 1) { const cx = W / 2, cy = 650;
              x.save(); x.fillStyle = 'rgba(11,16,38,0.75)'; x.beginPath(); x.arc(cx, cy, 230, 0, 7); x.fill();
              x.lineWidth = 22; x.strokeStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(cx, cy, 200, 0, 7); x.stroke();
              x.strokeStyle = C.gold; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, 200, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); x.stroke(); x.restore();
              scaled(cx, cy, back(cl(f / 0.25)) * (1 - 0.15 * f), () => txt(String(n), cx, cy + 8, 260, C.white));
              txt('comment your guess', W / 2, 960, 40, C.gold, { w: 800 }); } } } }

      // MADDIE'S GUESS (B2 → B3)
      { const a = vis(t, B(2), B(3)); if (a > 0) { x.save(); x.globalAlpha = a;
        scaled(W / 2, 1020, pop(t, B(2) + 0.25), () => { x.save(); x.translate(W / 2, 1020); x.rotate(-0.05); rr(-260, -90, 520, 180, 50); x.fillStyle = C.white; x.fill(); txt('10 YEARS?', 0, 6, 84, '#0b1026'); x.restore(); });
        x.restore(); } }

      // ₹86,400 a day, ₹3 crore a year (B3 → B5)
      { const a = vis(t, B(3) - 0.05, B(5) + 0.1); if (a > 0) { x.save(); x.globalAlpha = a;
        scaled(W / 2, 250, pop(t, B(3)), () => chip('₹1 a second × 86,400 seconds', W / 2, 250, C.teal, '#0b1026', 38));
        // spinning clock
        const cx = W / 2, cy = 470; x.lineWidth = 12; x.strokeStyle = C.white; x.beginPath(); x.arc(cx, cy, 95, 0, 7); x.stroke();
        const sp = (t - B(3)) * 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.sin(sp) * 75, cy - Math.cos(sp) * 75); x.stroke();
        x.lineWidth = 9; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.sin(sp / 12) * 50, cy - Math.cos(sp / 12) * 50); x.stroke();
        const d = 86400 * eo(pr(t, B(3) + 0.3, B(3) + 1.3));
        scaled(W / 2, 720, pop(t, B(3) + 0.25), () => { txt('₹' + fmt(d), W / 2, 720, 150, C.gold, { stroke: 12, sc: '#0b1026' }); txt('EVERY DAY', W / 2, 830, 44, C.white, { w: 800 }); });
        if (t > B(4) - 0.1) { const y = yearSec * eo(pr(t, B(4) + 0.1, B(4) + 1.0));
          scaled(W / 2, 1000, pop(t, B(4)), () => { card(110, 910, 860, 220, { fill: 'rgba(255,138,31,0.14)', line: 'rgba(255,138,31,0.7)' }); txt('₹' + fmt(y), W / 2, 990, fit('₹' + fmt(y), 120, 780), C.white); txt('EVERY YEAR  ·  just over ₹3 crore', W / 2, 1075, 34, C.orange, { w: 800 }); }); }
        x.restore(); } }

      // "basically rich" sparkle (B5 → B6)
      { const a = vis(t, B(5), B(6)); if (a > 0) { x.save(); x.globalAlpha = a; const r2 = K.rng(3);
        for (let i = 0; i < 26; i++) { const px = r2() * W, py = 300 + r2() * 850, ph = r2() * 6, s = 10 + r2() * 22, tw = 0.5 + 0.5 * Math.sin(t * 8 + ph);
          x.fillStyle = i % 2 ? C.gold : C.white; x.globalAlpha = a * tw; x.beginPath(); for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, rad = k % 2 ? s * 0.3 : s; x.lineTo(px + Math.cos(ang) * rad, py + Math.sin(ang) * rad); } x.fill(); }
        x.globalAlpha = a; scaled(W / 2, 640, pop(t, B(5) + 0.15), () => { x.save(); x.translate(W / 2, 640); x.rotate(-0.08); txt('RICH?', 0, 0, 210, C.gold, { stroke: 16, sc: '#0b1026' }); x.restore(); });
        x.restore(); } }

      // PYRAMIDS + ₹14,200 crore (B6 → B9)
      { const a = vis(t, B(6) - 0.05, B(9) + 0.05); if (a > 0) { x.save(); x.globalAlpha = a;
        scaled(W / 2, 250, pop(t, B(6)), () => chip('START: 4,500 YEARS AGO', W / 2, 250, C.orange, '#0b1026', 42));
        const k = back(pr(t, B(6) + 0.2, B(6) + 0.8)), base = 800, cx = W / 2;
        x.fillStyle = '#e8b56a'; x.beginPath(); x.ellipse(cx, base + 20, 470, 50, 0, 0, 7); x.fill();
        if (k > 0) { const hgt = 330 * k, half = 300 * Math.min(1, k);
          x.fillStyle = '#f2c27a'; x.beginPath(); x.moveTo(cx - half, base); x.lineTo(cx, base - hgt); x.lineTo(cx + half * 0.15, base); x.closePath(); x.fill();
          x.fillStyle = '#c98f45'; x.beginPath(); x.moveTo(cx + half * 0.15, base); x.lineTo(cx, base - hgt); x.lineTo(cx + half, base); x.closePath(); x.fill();
          x.strokeStyle = 'rgba(120,70,20,0.35)'; x.lineWidth = 3; for (let r = 1; r < 6; r++) { const yy = base - hgt * r / 6, w2 = half * (1 - r / 6); x.beginPath(); x.moveTo(cx - w2, yy); x.lineTo(cx + w2 * 0.15, yy); x.stroke(); } }
        // timeline
        const ty = 960, lx = 130, rx = 950; x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(lx, ty); x.lineTo(rx, ty); x.stroke();
        const p = eo(pr(t, B(7), B(7) + 1.4)); x.strokeStyle = C.orange; x.beginPath(); x.moveTo(lx, ty); x.lineTo(K.lerp(lx, rx, p), ty); x.stroke();
        x.fillStyle = C.white; x.beginPath(); x.arc(K.lerp(lx, rx, p), ty, 18, 0, 7); x.fill();
        txt('4,500 yrs ago', lx, ty + 55, 32, C.mute, { w: 700, align: 'left' }); txt('TODAY', rx, ty + 55, 32, C.white, { w: 800, align: 'right' });
        if (t > B(7)) { const v = 14200 * eo(pr(t, B(7) + 0.1, B(7) + 1.4));
          scaled(W / 2, 1100, pop(t, B(7)), () => txt('₹' + fmt(v) + ' CRORE', W / 2, 1100, fit('₹14,200 CRORE', 116, 900), C.gold, { stroke: 12, sc: '#0b1026' })); }
        x.restore(); } }

      // BAR CHART: you vs Ambani, ~50× (B9 → B11)
      { const a = vis(t, B(9) - 0.05, B(11) + 0.05); if (a > 0) { x.save(); x.globalAlpha = a;
        const baseY = 1150, maxH = 780, g = eo(pr(t, B(9) + 0.15, B(9) + 1.3));
        const youH = Math.max(14, maxH / 49.3), amH = maxH * g;
        x.fillStyle = C.teal; rr(170, baseY - youH, 260, youH, 10); x.fill();
        txt('YOU', 300, baseY + 50, 40, C.teal); txt('₹14,200 Cr', 300, baseY - youH - 40, 40, C.white, { w: 800 });
        const gr = x.createLinearGradient(0, baseY - amH, 0, baseY); gr.addColorStop(0, C.gold); gr.addColorStop(1, C.orange);
        x.fillStyle = gr; rr(650, baseY - amH, 260, amH, 14); x.fill();
        txt('AMBANI', 780, baseY + 50, 40, C.gold);
        if (g > 0.05) txt('₹7,00,000 Cr', 780, baseY - amH - 42, 46, C.white, { w: 800, stroke: 8, sc: '#0b1026' });
        if (t > B(10)) scaled(470, 640, pop(t, B(10), 0.3), () => { x.save(); x.translate(470, 640); x.rotate(-0.12); rr(-190, -105, 380, 210, 40); x.fillStyle = C.red; x.fill(); txt('≈50×', 0, 8, 130, C.white); x.restore(); });
        x.restore(); } }

      // "how long?" question marks (B11 → B12)
      { const a = vis(t, B(11), B(12)); if (a > 0) { x.save(); x.globalAlpha = a;
        [[260, 520, -0.3], [540, 430, 0.1], [820, 560, 0.35], [400, 800, 0.2], [700, 830, -0.2]].forEach(([qx, qy, r], i) => scaled(qx, qy, pop(t, B(11) + i * 0.08), () => { x.save(); x.translate(qx, qy + Math.sin(t * 5 + i) * 10); x.rotate(r); txt('?', 0, 0, 170 + i * 10, i % 2 ? C.gold : C.white, { stroke: 10, sc: '#0b1026' }); x.restore(); }));
        x.restore(); } }

      // YEARS counter (B12 → B14)
      { const a = vis(t, B(12) - 0.05, B(14) + 0.05); if (a > 0) { x.save(); x.globalAlpha = a;
        const r3 = K.rng(11);
        for (let i = 0; i < 18; i++) { const sx = r3() * W, sp = 600 + r3() * 900, ph = r3(), yy = 1250 - ((t - B(12)) * sp + ph * 1400) % 1500, rot = (r3() - 0.5) * 0.8 + (t - B(12)) * (r3() - 0.5) * 2;   // calendar pages flying up
          x.save(); x.translate(sx, yy); x.rotate(rot); x.globalAlpha = a * 0.55; rr(-55, -65, 110, 130, 12); x.fillStyle = C.white; x.fill(); x.fillStyle = C.red; x.fillRect(-55, -65, 110, 30); x.restore(); }
        x.globalAlpha = a;
        const shock = t >= B(13), yrs = 200000 * Math.pow(eo(pr(t, B(12) + 0.1, B(12) + 1.0)), 1.5);
        scaled(W / 2, 640, pop(t, B(12)) * (shock ? 1.08 + 0.04 * Math.sin(t * 30) : 1), () => {
          txt(fmt(yrs) + (yrs >= 199999 ? '+' : ''), W / 2, 620, fit('2,00,000+', 200, 860), shock ? C.red : C.gold, { stroke: 16, sc: '#0b1026' });
          txt('YEARS', W / 2, 790, 90, C.white, { stroke: 10, sc: '#0b1026' }); });
        if (shock) scaled(W / 2, 1000, pop(t, B(13) + 0.05), () => chip('2 LAKH YEARS?!', W / 2, 1000, C.red, C.white, 60));
        x.restore(); } }

      // TIMELINE zoom-out: farming / pyramids / you start here (B14 → B15)
      { const a = vis(t, B(14) - 0.05, B(15) + 0.05); if (a > 0) { x.save(); x.globalAlpha = a;
        scaled(W / 2, 250, pop(t, B(14)), () => chip('ZOOM OUT', W / 2, 250, C.teal, '#0b1026', 42));
        const lx = 110, rx = 970, ty = 720, span = 220000, X = yrs => rx - (rx - lx) * yrs / span;
        const draw = eo(pr(t, B(14), B(14) + 0.7));
        x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(rx, ty); x.lineTo(K.lerp(rx, lx, draw), ty); x.stroke();
        const mark = (yrs, label, sub, color, hh, t0) => { const k = pop(t, t0); if (k <= 0) return; const mx = X(yrs), up = hh > 0, len = Math.abs(hh);
          x.fillStyle = color; x.beginPath(); x.arc(mx, ty, 16 * k, 0, 7); x.fill();
          x.strokeStyle = color; x.lineWidth = 4; x.beginPath(); x.moveTo(mx, ty); x.lineTo(mx, ty + (up ? -len : len) * k); x.stroke();
          const al = mx > 800 ? 'right' : mx < 280 ? 'left' : 'center';
          txt(label, mx + (al === 'right' ? 14 : al === 'left' ? -14 : 0), ty + (up ? -len - 50 : len + 45), 38, color, { align: al, alpha: k });
          txt(sub, mx + (al === 'right' ? 14 : al === 'left' ? -14 : 0), ty + (up ? -len - 8 : len + 87), 28, C.mute, { w: 700, align: al, alpha: k }); };
        mark(0, 'TODAY', 'now', C.white, 260, B(14) + 0.1);
        mark(4500, 'PYRAMIDS', '4,500 yrs', '#f2c27a', 120, B(14) + 0.35);
        mark(12000, 'FARMING', '~12,000 yrs', C.teal, -120, B(14) + 0.6);
        mark(220000, 'YOU START', '2,00,000+ yrs ago', C.red, 120, B(14) + 0.9);
        if (t > B(14) + 1.2) scaled(W / 2, 1040, pop(t, B(14) + 1.2), () => { card(120, 960, 840, 160, { fill: 'rgba(255,77,94,0.16)', line: 'rgba(255,77,94,0.7)' }); txt('No farming. No cities. Nothing.', W / 2, 1040, fit('No farming. No cities. Nothing.', 52, 780), C.white); });
        x.restore(); } }

      // ₹2 a second (B15 → B16)
      { const a = vis(t, B(15) - 0.05, B(16) + 0.05); if (a > 0) { x.save(); x.globalAlpha = a;
        scaled(W / 2, 560, pop(t, B(15) + 0.1), () => { card(190, 420, 700, 280, { fill: 'rgba(46,196,182,0.15)', line: 'rgba(46,196,182,0.7)' }); txt('₹2 / sec', W / 2, 560, 150, C.teal, { stroke: 10, sc: '#0b1026' }); });
        x.restore(); } }

      // STILL 1 LAKH+ YEARS + follow card (B16 → end)
      { const a = vis(t, B(16) - 0.05, D + 1); if (a > 0) { x.save(); x.globalAlpha = a;
        scaled(W / 2, 560, pop(t, B(16)), () => { txt('STILL', W / 2, 430, 70, C.white); txt('1,00,000+', W / 2, 580, fit('1,00,000+', 190, 940), C.gold, { stroke: 14, sc: '#0b1026' }); txt('YEARS', W / 2, 730, 80, C.white); });
        const ft = E(16) - 0.9;
        if (t > ft) scaled(W / 2, 1000, pop(t, ft, 0.35) * (1 + 0.03 * Math.sin(t * 7)), () => { rr(110, 900, 860, 200, 100); x.fillStyle = C.orange; x.fill(); txt('FOLLOW', W / 2, 965, 64, '#0b1026'); txt('@just.money.things', W / 2, 1040, 44, '#0b1026', { w: 800 }); });
        x.restore(); } }
    };

    const update = t => {
      let sx = 0, sy = 0, flash = 0, zoom = 1;
      shakes.forEach(([s, d, amp]) => { if (t >= s && t < s + d) { const k = 1 - (t - s) / d; sx += Math.sin(t * 71) * amp * k; sy += Math.cos(t * 59) * amp * k; } });
      punches.forEach(([s, d, z]) => { if (t >= s && t < s + d) zoom += z * Math.sin((t - s) / d * Math.PI); });
      if (t >= B(13) && t < B(13) + 0.5) flash = 1 - (t - B(13)) / 0.5;
      x.save(); x.translate(W / 2 + sx, H / 2 + sy); x.scale(zoom, zoom); x.translate(-W / 2, -H / 2);
      bg(t, flash);
      drawBeats(t);
      drawChar(mad, 250, 1895, 600, t, 'maddie', 0.0, -300);
      drawChar(bit, 820, 1895, 500, t, 'bittu', B(1) - 0.35, W + 300);
      x.restore();
      tex.needsUpdate = true;
    };

    const sfx = [
      { t: 0.05, name: 'pop' }, { t: 0.35, name: 'pop' }, { t: 0.85, name: 'pop' },
      { t: E(1) + 0.02, name: 'tick' }, { t: E(1) + 1.02, name: 'tick' }, { t: E(1) + 2.02, name: 'tick' },
      { t: B(2) + 0.25, name: 'pop' },
      { t: B(3), name: 'whoosh' }, { t: B(3) + 1.3, name: 'coin' }, { t: B(4) + 1.0, name: 'coin' },
      { t: B(5) + 0.15, name: 'ding' },
      { t: B(6), name: 'whoosh' }, { t: B(7) + 1.4, name: 'kaching' },
      { t: B(8), name: 'pop' },
      { t: B(9), name: 'whoosh' }, { t: B(10), name: 'bass' },
      { t: Math.max(0, B(12) - 1.6), name: 'riser' }, { t: B(12) + 1.0, name: 'ding' },
      { t: B(13), name: 'bass' }, { t: B(13), name: 'thud' },
      { t: B(14), name: 'whoosh' }, { t: B(15) + 0.1, name: 'pop' },
      { t: B(16), name: 'whoosh' }, { t: E(16) - 0.9, name: 'ding' },
    ];
    return { duration: D, update, shots: [{ t: [0, D + 5], from: { pos: [0, 0, 10], look: [0, 0, 0] } }], sfx,
      watermark: '@just.money.things', endCard: false, music: {}, capFont: 'Inter Display', capMarginV: 640 };
  },
};
