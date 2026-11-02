/* @just.money.things — "Earn ₹1 every second. How long until you're as rich as Ambani?"  (full 3D version)
   Maddie + Bittu sit on a sofa in an evening living room; numbers appear on the wall TV. Film-style cuts.
   Facts: Ambani ≈ $80B ≈ ₹7 lakh crore (Forbes index, Nov 2026). 1 yr = 31,557,600 s.
   4,500 yrs × ₹1/s = ₹14,200 crore. ₹7 lakh crore at ₹1/s ≈ 2.2 lakh yrs. Farming began ~12,000 yrs ago. */
window.SCENE = {
  setup: { width: 1080, height: 1920, bg: 0x10131f, fog: null, fov: 32, bloom: { strength: 0.35, radius: 0.5, threshold: 0.9 } },
  assets: ['assets/chars/worker.glb'],
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
    K.LOWPOLY = false;
    const L = T.lines, B = i => L[i].t, E = i => L[i].end, D = E(16) + 2.4;
    const cl = K.clamp, eo = K.easeOut, pr = K.prog, ease = K.ease;
    const S = K.scene, FM = (c, r = 0.85, o = {}) => K.M(c, Object.assign({ roughness: r, flatShading: true }, o));
    const box = (w, h, d, m, x, y, z, parent = S) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };

    // ================= THE ROOM (evening living room, Hyderabad skyline outside) =================
    const wallM = FM(0x24474d, 0.95), floorM = FM(0x6e4b33, 0.8), trimM = FM(0x1a3237, 0.9);
    const floor = box(9, 0.1, 8, floorM, 0, -0.05, 0.5); floor.castShadow = false;
    for (let i = -4; i <= 4; i++) box(0.012, 0.004, 8, FM(0x5a3c28, 0.9), i * 0.5, 0.002, 0.5).castShadow = false;   // floor boards
    box(9, 4, 0.1, wallM, 0, 2, -1.75);
    const right = box(0.1, 4, 8, wallM, 2.7, 2, 0.5), left = box(0.1, 4, 8, wallM, -2.7, 2, 0.5);
    box(9, 0.12, 0.06, trimM, 0, 0.06, -1.69); box(0.06, 0.12, 8, trimM, 2.64, 0.06, 0.5);
    // window with a dusk city view (canvas)
    const sky = K.canvasTex(1024, 640, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a1d5a'); g.addColorStop(0.55, '#a1456b'); g.addColorStop(0.85, '#ff8a3d'); g.addColorStop(1, '#ffb466');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      const r = K.rng(4);
      for (let layer = 0; layer < 2; layer++) for (let bx = -20; bx < w; bx += 30 + r() * 50) {
        const bw = 40 + r() * 70, bh = (layer ? 160 : 90) + r() * (layer ? 260 : 140), top = h - bh;
        x.fillStyle = layer ? '#141634' : '#2c2550'; x.fillRect(bx, top, bw, bh);
        if (layer) for (let wy = top + 12; wy < h - 10; wy += 18) for (let wx = bx + 8; wx < bx + bw - 8; wx += 14) if (r() < 0.45) { x.fillStyle = r() < 0.8 ? '#ffd27a' : '#9fd8ff'; x.fillRect(wx, wy, 7, 9); }
      }
    });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.55), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })); win.position.set(0, 2.05, -1.69); S.add(win);
    const frameM = FM(0xe9dcc5, 0.7);
    box(2.75, 0.08, 0.08, frameM, 0, 2.83, -1.66); box(2.75, 0.1, 0.12, frameM, 0, 1.27, -1.64); box(0.08, 1.6, 0.08, frameM, -1.33, 2.05, -1.66); box(0.08, 1.6, 0.08, frameM, 1.33, 2.05, -1.66); box(0.05, 1.55, 0.05, frameM, 0, 2.05, -1.66);
    // sofa
    const sofaM = FM(0xd6633a, 0.9), cushM = FM(0xe5774c, 0.95), legM = FM(0x3b2a1f, 0.7);
    box(2.7, 0.3, 0.95, sofaM, 0, 0.25, -1.05); box(2.7, 0.75, 0.28, sofaM, 0, 0.72, -1.42);
    box(0.28, 0.62, 0.95, sofaM, -1.35, 0.4, -1.05); box(0.28, 0.62, 0.95, sofaM, 1.35, 0.4, -1.05);
    box(1.22, 0.12, 0.82, cushM, -0.63, 0.44, -1.0); box(1.22, 0.12, 0.82, cushM, 0.63, 0.44, -1.0);
    for (const [sx, sz] of [[-1.3, -0.62], [1.3, -0.62], [-1.3, -1.5], [1.3, -1.5]]) box(0.08, 0.1, 0.08, legM, sx, 0.05, sz);
    const pillow = box(0.42, 0.38, 0.14, FM(0x2ec4b6, 0.95), -1.0, 0.68, -1.22); pillow.rotation.set(-0.2, 0.25, 0.1);
    // coffee table + chai + phone
    const woodM = FM(0x8a5a3a, 0.7);
    box(1.3, 0.06, 0.6, woodM, 0.1, 0.42, 0.05); for (const [sx, sz] of [[-0.5, -0.2], [0.7, -0.2], [-0.5, 0.3], [0.7, 0.3]]) box(0.05, 0.4, 0.05, woodM, sx, 0.2, sz);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 10), FM(0xf3eadb, 0.6)); cup.position.set(0.35, 0.5, 0.1); cup.castShadow = true; S.add(cup);
    box(0.09, 0.012, 0.17, FM(0x15161c, 0.3), -0.15, 0.456, 0.05).rotation.y = 0.4;
    // rug
    const rug = new THREE.Mesh(new THREE.CircleGeometry(1.5, 10), FM(0x34315e, 0.95)); rug.rotation.x = -Math.PI / 2; rug.position.set(0.1, 0.006, 0.1); rug.scale.set(1.3, 0.8, 1); rug.receiveShadow = true; S.add(rug);
    // floor lamp (warm)
    box(0.04, 1.7, 0.04, FM(0x2b2b2b, 0.5), -2.05, 0.85, -1.2); box(0.32, 0.03, 0.32, FM(0x2b2b2b, 0.5), -2.05, 0.015, -1.2);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.28, 0.32, 8, 1, true), K.M(0xffe2a8, { roughness: 0.6, side: THREE.DoubleSide, emissive: 0xffb04a, emissiveIntensity: 0.9, flatShading: true })); shade.position.set(-2.05, 1.8, -1.2); S.add(shade);
    // plants
    const plant = (px, pz, sc) => { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 8), FM(0xc96a3f, 0.8)); pot.position.set(px, 0.16, pz); pot.castShadow = true; S.add(pot);
      const r = K.rng(px * 10 + 3); for (let i = 0; i < 7; i++) { const lf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), FM(i % 2 ? 0x3f8f4e : 0x2f7a42, 0.9)); lf.position.set(px + (r() - 0.5) * 0.3, 0.45 + r() * 0.5 * sc, pz + (r() - 0.5) * 0.3); lf.scale.set(0.6, 1.4, 0.5); lf.rotation.set(r(), r() * 6, (r() - 0.5)); lf.castShadow = true; S.add(lf); } };
    plant(1.95, -1.3, 1.2); plant(-2.3, 0.6, 0.9);
    // shelf with books on the left wall
    box(0.3, 0.04, 1.1, woodM, -2.5, 1.55, 0.2); const bc = [0xff8a1f, 0x2ec4b6, 0xffc53d, 0xe9dcc5, 0x8a3b5c];
    for (let i = 0; i < 8; i++) box(0.22, 0.24 + (i % 3) * 0.04, 0.07, FM(bc[i % 5], 0.8), -2.5, 1.7 + (i % 3) * 0.02, -0.25 + i * 0.1);
    // wall TV on the right wall (numbers live here)
    const TVW = 1280, TVH = 720, tvc = document.createElement('canvas'); tvc.width = TVW; tvc.height = TVH; const x = tvc.getContext('2d');
    const tvTex = new THREE.CanvasTexture(tvc); tvTex.colorSpace = THREE.SRGBColorSpace;
    box(0.06, 1.0, 1.72, FM(0x0d0d10, 0.4), 2.62, 1.75, -0.35);
    const tv = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.91), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false })); tv.rotation.y = -Math.PI / 2; tv.position.set(2.585, 1.75, -0.35); S.add(tv);
    box(0.4, 0.5, 1.4, FM(0x3b2a1f, 0.7), 2.45, 0.25, -0.35);                            // TV cabinet

    // lights: cool window fill, warm lamp, TV glow
    S.add(new THREE.HemisphereLight(0x9fb0e0, 0x3a2a24, 1.0)); S.add(new THREE.AmbientLight(0xffffff, 0.18));
    const fill = new THREE.DirectionalLight(0xffe6c8, 1.35); fill.position.set(0.4, 1.9, 4.5); fill.target.position.set(0, 1.2, -0.9); S.add(fill); S.add(fill.target);
    const key = new THREE.DirectionalLight(0xffd9a8, 1.25); key.position.set(-1.5, 3.6, 3.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006;
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -2, near: 0.5, far: 12 }); S.add(key);
    const lamp = new THREE.PointLight(0xffb45a, 6, 6, 1.6); lamp.position.set(-2.0, 1.75, -1.1); S.add(lamp);
    const winL = new THREE.PointLight(0xff8a5a, 3, 5, 1.6); winL.position.set(0, 2.0, -1.2); S.add(winL);
    const tvL = new THREE.PointLight(0x7fb8ff, 2.2, 4.5, 1.6); tvL.position.set(2.2, 1.75, -0.35); S.add(tvL);
    const rim = new THREE.DirectionalLight(0x9fb4ff, 0.8); rim.position.set(2, 3, -3); S.add(rim);

    // ================= CHARACTERS =================
    const M = K.makeMaddieV3({ bulk: 1.0 }); M.g.position.set(-0.4, 0.04, -0.55);
    const MB = {}; M.g.traverse(o => { if (o.isBone) MB[o.name] = o; });
    const Bt = K.makeBittu({ height: 0.8, body: 0xd97757, beakC: 0x3b3431, halo: true }); Bt.g.position.set(0.52, 0.5, -0.9); Bt.g.rotation.y = -0.35; K.add(Bt.g);

    // ================= ACTING =================
    const speaking = (who, t) => L.some(l => l.who === who && t >= l.t && t < l.end - 0.03);
    const lastSpeaker = t => { let w = 'maddie'; L.forEach(l => { if (t >= l.t) w = l.who; }); return w; };
    const STAND = B(13) - 0.05;                                          // Maddie jumps up on "TWO LAKH YEARS?!"
    const tvBeat = t => (t >= E(1) && t < B(2)) || (t >= B(3) && t < B(5)) || (t >= B(6) && t < B(8)) || (t >= B(9) && t < B(11)) || (t >= B(14) && t < B(15));
    const smooth = (prev, target, k) => prev + (target - prev) * k;
    let mYaw = 0, bYaw = 0, last = -1;
    const acting = t => {
      // body clips
      if (t < STAND) M.play('Man_Sitting', 0.5);
      else { const st = t - STAND; if (st < 1.0) M.play('Man_Standing', st, { speed: 1.6, loop: false }); else M.play('Man_Idle', t); }
      const mTalk = K.voice('maddie', t), bTalk = K.voice('bittu', t);
      // where each one looks: at the speaker, or at the TV when numbers are up
      const onTV = tvBeat(t);
      const mTarget = onTV ? 0.5 : speaking('bittu', t) ? 0.55 : lastSpeaker(t) === 'bittu' ? 0.45 : 0.15;
      const bTarget = onTV ? 0.65 : speaking('maddie', t) ? -0.45 : -0.15;
      const k = last < 0 ? 1 : cl((t - last) * 6); last = t;
      mYaw = smooth(mYaw, mTarget, k); bYaw = smooth(bYaw, bTarget, k);
      // Maddie face + head motion
      const face = t >= B(13) && t < E(13) + 0.6 ? 'shock' : (t >= B(5) && t < E(5) + 0.4) || (t >= B(15) && t < E(15)) ? 'smile' : (t >= B(8) && t < E(8) + 0.3) ? 'shock' : (t >= B(12) && t < B(13)) ? 'worried' : speaking('maddie', t) ? 'neutral' : 'smile';
      M.head.update(t, { face, talk: mTalk });
      M.head.rotation.y = mYaw + Math.sin(t * 0.8) * 0.04;
      M.head.rotation.x = -0.05 + (mTalk > 0.05 ? Math.sin(t * 6.3) * 0.05 * mTalk : 0) + (speaking('bittu', t) ? Math.max(0, Math.sin(t * 2.4)) * 0.05 : 0);
      M.head.rotation.z = Math.sin(t * 0.6) * 0.03 + (mTalk > 0.05 ? Math.sin(t * 3.1) * 0.03 : 0);
      // hand gestures while talking (forearms lift and move)
      const gest = speaking('maddie', t) ? 1 : 0;
      for (const [sd, ph, amt] of [['R', 0, 1], ['L', 1.7, 0.6]]) { const lb = MB['LowerArm' + sd]; if (!lb) continue;
        lb.rotation.x += -gest * amt * (0.18 + 0.14 * Math.sin(t * 4.2 + ph)); lb.rotation.z += gest * amt * 0.08 * Math.sin(t * 3.3 + ph); }
      // Bittu
      Bt.update(t, { talk: bTalk, look: [bYaw, -0.05], mood: (t >= B(13) && t < E(13)) ? 'shock' : 'calm',
        flapL: speaking('bittu', t) ? 0.35 + 0.35 * Math.max(0, Math.sin(t * 5.1)) : (t >= B(16) + 1.2 ? 0.9 * Math.max(0, Math.sin(t * 9)) : 0.05),
        flapR: speaking('bittu', t) ? 0.15 * Math.max(0, Math.sin(t * 4.3 + 1)) : 0 });
    };

    // ================= TV GRAPHICS (1280×720) =================
    const FONT = (s, w = 900) => `${w} ${s}px "Inter Display", "Inter", "DejaVu Sans"`;
    const C = { orange: '#ff8a1f', gold: '#ffc53d', teal: '#2ec4b6', red: '#ff4d5e', white: '#ffffff', mute: '#9aa3c7' };
    const backE = k => { k = cl(k); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
    const pop = (t, t0, d = 0.3) => backE(pr(t, t0, t0 + d));
    const fmt = n => { const s = String(Math.round(n)); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3); };
    const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    const txt = (s, X, Y, size, color = C.white, { w = 900, align = 'center', stroke = 0 } = {}) => { x.font = FONT(size, w); x.textAlign = align; x.textBaseline = 'middle'; if (stroke) { x.lineJoin = 'round'; x.lineWidth = stroke; x.strokeStyle = '#0b1026'; x.strokeText(s, X, Y); } x.fillStyle = color; x.fillText(s, X, Y); };
    const sc = (cx, cy, s, fn) => { if (s <= 0.001) return; x.save(); x.translate(cx, cy); x.scale(s, s); x.translate(-cx, -cy); fn(); x.restore(); };
    const chip = (s, cx, cy, bg, fg = '#0b1026', size = 36) => { x.font = FONT(size); const w = x.measureText(s).width + 50; rr(cx - w / 2, cy - size * 0.85, w, size * 1.7, size * 0.85); x.fillStyle = bg; x.fill(); txt(s, cx, cy + 2, size, fg); };
    const tvDraw = t => {
      const g = x.createLinearGradient(0, 0, 0, TVH); g.addColorStop(0, '#0d1433'); g.addColorStop(1, '#1b2560'); x.fillStyle = g; x.fillRect(0, 0, TVW, TVH);
      x.strokeStyle = 'rgba(255,255,255,0.05)'; x.lineWidth = 2; for (let gx = (t * 30) % 80; gx < TVW; gx += 80) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, TVH); x.stroke(); }
      txt('just.money.things', TVW - 30, TVH - 30, 22, 'rgba(255,255,255,0.45)', { w: 700, align: 'right' });
      if (t < E(1)) {                                                      // hook: YOU vs AMBANI
        sc(640, 90, pop(t, 0.2), () => chip('THE ₹1 PER SECOND CHALLENGE', 640, 90, C.orange));
        sc(330, 390, pop(t, 0.5), () => { rr(110, 200, 440, 380, 34); x.fillStyle = 'rgba(46,196,182,0.15)'; x.fill(); x.lineWidth = 4; x.strokeStyle = C.teal; x.stroke();
          txt('YOU', 330, 265, 52, C.teal); txt('₹1 / second', 330, 330, 40, C.white, { w: 700 }); txt('₹' + fmt(Math.floor(t) + 1), 330, 455, 100, C.white); });
        sc(640, 390, pop(t, 0.8), () => txt('VS', 640, 390, 70, C.orange));
        sc(950, 390, pop(t, 1.1), () => { rr(730, 200, 440, 380, 34); x.fillStyle = 'rgba(255,197,61,0.13)'; x.fill(); x.lineWidth = 4; x.strokeStyle = C.gold; x.stroke();
          x.fillStyle = C.gold; x.beginPath(); x.moveTo(890, 300); x.lineTo(902, 245); x.lineTo(927, 280); x.lineTo(950, 235); x.lineTo(973, 280); x.lineTo(998, 245); x.lineTo(1010, 300); x.closePath(); x.fill();
          txt('AMBANI', 950, 345, 50, C.gold); txt('???', 950, 470, 110, C.white); });
      } else if (t < B(2)) {                                               // countdown
        const c = t - E(1), n = 3 - Math.floor(c), f = c % 1;
        chip('GUESS FIRST', 640, 90, C.gold, '#0b1026', 40);
        if (n >= 1) { x.lineWidth = 22; x.strokeStyle = 'rgba(255,255,255,0.12)'; x.beginPath(); x.arc(640, 390, 200, 0, 7); x.stroke();
          x.strokeStyle = C.gold; x.lineCap = 'round'; x.beginPath(); x.arc(640, 390, 200, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); x.stroke();
          sc(640, 390, backE(cl(f / 0.25)), () => txt(String(n), 640, 398, 240, C.white)); }
        txt('comment your guess', 640, 650, 36, C.gold, { w: 800 });
      } else if (t < B(3)) {                                               // Maddie's guess
        sc(640, 380, pop(t, B(2) + 0.2), () => { rr(370, 290, 540, 180, 50); x.fillStyle = C.white; x.fill(); txt('10 YEARS?', 640, 385, 88, '#0b1026'); });
      } else if (t < B(6)) {                                               // per day / per year
        chip('₹1 a second × 86,400 seconds', 640, 80, C.teal, '#0b1026', 34);
        const d = 86400 * eo(pr(t, B(3) + 0.3, B(3) + 1.3));
        sc(640, 250, pop(t, B(3) + 0.2), () => { txt('₹' + fmt(d), 640, 245, 140, C.gold, { stroke: 10 }); txt('EVERY DAY', 640, 345, 40, C.white, { w: 800 }); });
        if (t > B(4) - 0.1) { const y = 31557600 * eo(pr(t, B(4) + 0.1, B(4) + 1.0));
          sc(640, 530, pop(t, B(4)), () => { rr(200, 440, 880, 190, 30); x.fillStyle = 'rgba(255,138,31,0.15)'; x.fill(); x.lineWidth = 4; x.strokeStyle = C.orange; x.stroke();
            txt('₹' + fmt(y), 640, 515, 104, C.white); txt('EVERY YEAR · just over ₹3 crore', 640, 595, 32, C.orange, { w: 800 }); }); }
      } else if (t < B(9)) {                                               // pyramids → ₹14,200 crore
        chip('START: 4,500 YEARS AGO', 640, 80, C.orange, '#0b1026', 36);
        const k = backE(pr(t, B(6) + 0.2, B(6) + 0.8)), base = 400, cx = 640;
        x.fillStyle = '#e8b56a'; x.beginPath(); x.ellipse(cx, base + 14, 380, 34, 0, 0, 7); x.fill();
        if (k > 0) { const hh = 230 * k, half = 220 * Math.min(1, k);
          x.fillStyle = '#f2c27a'; x.beginPath(); x.moveTo(cx - half, base); x.lineTo(cx, base - hh); x.lineTo(cx + half * 0.15, base); x.closePath(); x.fill();
          x.fillStyle = '#c98f45'; x.beginPath(); x.moveTo(cx + half * 0.15, base); x.lineTo(cx, base - hh); x.lineTo(cx + half, base); x.closePath(); x.fill(); }
        const ty = 500, lx = 200, rx = 1080, p = eo(pr(t, B(7), B(7) + 1.4));
        x.lineCap = 'round'; x.lineWidth = 8; x.strokeStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.moveTo(lx, ty); x.lineTo(rx, ty); x.stroke();
        x.strokeStyle = C.orange; x.beginPath(); x.moveTo(lx, ty); x.lineTo(K.lerp(lx, rx, p), ty); x.stroke();
        x.fillStyle = C.white; x.beginPath(); x.arc(K.lerp(lx, rx, p), ty, 15, 0, 7); x.fill();
        txt('4,500 yrs ago', lx, ty + 42, 28, C.mute, { w: 700, align: 'left' }); txt('TODAY', rx, ty + 42, 28, C.white, { w: 800, align: 'right' });
        if (t > B(7)) sc(640, 625, pop(t, B(7)), () => txt('₹' + fmt(14200 * eo(pr(t, B(7) + 0.1, B(7) + 1.4))) + ' CRORE', 640, 625, 92, C.gold, { stroke: 10 }));
      } else if (t < B(12)) {                                              // bar chart, ~50×
        const baseY = 640, maxH = 500, g2 = eo(pr(t, B(9) + 0.15, B(9) + 1.2)), youH = Math.max(10, maxH / 49.3), amH = maxH * g2;
        x.fillStyle = C.teal; rr(260, baseY - youH, 220, youH, 8); x.fill(); txt('YOU', 370, baseY + 35, 34, C.teal); txt('₹14,200 Cr', 370, baseY - youH - 30, 32, C.white, { w: 800 });
        const gr = x.createLinearGradient(0, baseY - amH, 0, baseY); gr.addColorStop(0, C.gold); gr.addColorStop(1, C.orange); x.fillStyle = gr; rr(800, baseY - amH, 220, amH, 10); x.fill();
        txt('AMBANI', 910, baseY + 35, 34, C.gold); if (g2 > 0.05) txt('₹7,00,000 Cr', 910, baseY - amH - 30, 36, C.white, { w: 800 });
        if (t > B(10)) sc(600, 320, pop(t, B(10)), () => { x.save(); x.translate(600, 320); x.rotate(-0.1); rr(-150, -80, 300, 160, 34); x.fillStyle = C.red; x.fill(); txt('≈50×', 0, 6, 100, C.white); x.restore(); });
      } else if (t < B(14)) {                                              // years counter
        const yrs = 200000 * Math.pow(eo(pr(t, B(12) + 0.1, B(12) + 1.0)), 1.5), shock = t >= B(13);
        sc(640, 330, pop(t, B(12)) * (shock ? 1.05 + 0.03 * Math.sin(t * 30) : 1), () => { txt(fmt(yrs) + (yrs >= 199999 ? '+' : ''), 640, 310, 190, shock ? C.red : C.gold, { stroke: 12 }); txt('YEARS', 640, 470, 80, C.white); });
      } else if (t < B(15)) {                                              // zoom-out timeline
        chip('ZOOM OUT', 640, 80, C.teal, '#0b1026', 36);
        const lx = 120, rx = 1160, ty = 380, X = yrs => rx - (rx - lx) * yrs / 220000, dr = eo(pr(t, B(14), B(14) + 0.6));
        x.lineCap = 'round'; x.lineWidth = 8; x.strokeStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.moveTo(rx, ty); x.lineTo(K.lerp(rx, lx, dr), ty); x.stroke();
        const mark = (yrs, label, color, hh, t0, al) => { const k2 = pop(t, t0); if (k2 <= 0) return; const mx = X(yrs);
          x.fillStyle = color; x.beginPath(); x.arc(mx, ty, 14 * k2, 0, 7); x.fill(); x.strokeStyle = color; x.lineWidth = 4; x.beginPath(); x.moveTo(mx, ty); x.lineTo(mx, ty - hh * k2); x.stroke();
          x.globalAlpha = k2 > 1 ? 1 : k2; txt(label, mx + (al === 'right' ? 12 : al === 'left' ? -12 : 0), ty - hh - (hh > 0 ? 28 : -28), 30, color, { align: al }); x.globalAlpha = 1; };
        mark(0, 'TODAY', C.white, 200, B(14) + 0.1, 'right'); mark(4500, 'PYRAMIDS 4,500', '#f2c27a', 110, B(14) + 0.3, 'right');
        mark(12000, 'FARMING ~12,000', C.teal, -110, B(14) + 0.5, 'right'); mark(220000, 'YOU START: 2,00,000+ yrs ago', C.red, 110, B(14) + 0.8, 'left');
        if (t > B(14) + 1.1) sc(640, 610, pop(t, B(14) + 1.1), () => txt('No farming. No cities. Nothing.', 640, 610, 48, C.white));
      } else if (t < B(16)) {                                              // ₹2 a second
        sc(640, 360, pop(t, B(15) + 0.1), () => txt('₹2 / second', 640, 360, 140, C.teal, { stroke: 10 }));
      } else {                                                             // still a lakh years
        sc(640, 360, pop(t, B(16)), () => { txt('STILL', 640, 200, 60, C.white); txt('1,00,000+', 640, 340, 170, C.gold, { stroke: 12 }); txt('YEARS', 640, 480, 70, C.white); });
      }
      x.lineWidth = 10; x.strokeStyle = 'rgba(255,255,255,0.22)'; rr(5, 5, TVW - 10, TVH - 10, 36); x.stroke();
      tvTex.needsUpdate = true;
    };

    // ================= CAMERA (film-style shot list) =================
    const P = (pos, look, fov) => ({ pos, look, fov });
    const WIDE = [P([0.1, 1.55, 4.2], [0.05, 1.1, -0.9], 38), P([0.08, 1.5, 3.8], [0.05, 1.1, -0.9], 38)];
    const MAD = [P([-0.05, 1.72, 2.35], [-0.4, 1.58, -0.6], 30), P([-0.07, 1.7, 2.1], [-0.4, 1.58, -0.6], 30)];
    const MADST = [P([-0.15, 2.2, 2.4], [-0.45, 2.0, -0.6], 32), P([-0.18, 2.15, 2.15], [-0.45, 2.0, -0.6], 32)];
    const BIT = [P([0.75, 1.2, 1.45], [0.48, 1.08, -0.9], 30), P([0.72, 1.18, 1.2], [0.48, 1.08, -0.9], 30)];
    const TVS = [P([0.75, 1.65, -0.25], [2.6, 1.72, -0.35], 46), P([0.95, 1.67, -0.3], [2.6, 1.72, -0.35], 46)];
    const CARD = [P([0.06, 1.05, 3.9], [0.06, 1.8, -0.9], 40), P([0.06, 1.05, 3.6], [0.06, 1.8, -0.9], 40)];
    const CARDS = [P([0.0, 1.3, 4.9], [0.0, 2.2, -0.9], 40), P([0.0, 1.3, 4.6], [0.0, 2.2, -0.9], 40)];
    const OTS = [P([-1.1, 1.75, 0.15], [2.6, 1.6, -0.45], 40), P([-0.95, 1.73, 0.05], [2.6, 1.6, -0.45], 40)];
    const shotPlan = [
      [0, B(0) + 1.8, WIDE], [B(0) + 1.8, B(1) - 0.05, OTS], [B(1) - 0.05, E(1) + 0.02, BIT], [E(1) + 0.02, B(2) - 0.05, WIDE],
      [B(2) - 0.05, B(3) - 0.05, MAD], [B(3) - 0.05, B(4) + 1.0, CARD], [B(4) + 1.0, B(5) - 0.05, BIT], [B(5) - 0.05, B(6) - 0.05, MAD],
      [B(6) - 0.05, B(8) - 0.05, CARD], [B(8) - 0.05, B(9) - 0.05, WIDE], [B(9) - 0.05, B(10) + 0.9, CARD], [B(10) + 0.9, B(11) - 0.05, BIT],
      [B(11) - 0.05, B(12) - 0.05, MAD], [B(12) - 0.05, STAND, BIT], [STAND, E(13) + 0.25, WIDE], [E(13) + 0.25, B(15) - 0.05, CARDS],
      [B(15) - 0.05, B(16) - 0.05, MADST], [B(16) - 0.05, D + 5, WIDE],
    ];
    const shots = shotPlan.map(([a, b, s]) => ({ t: [a, b], from: s[0], to: s[1], fov: s[0].fov, ease: k => k }));
    // camera shake on the big shock + a small punch on "That's insane"
    const shakeAt = [[B(13), 0.8, 0.045], [B(10), 0.35, 0.015]];
    shots.forEach(s => { s.shake = t => { let a = 0; shakeAt.forEach(([s0, d, amp]) => { if (t >= s0 && t < s0 + d) a += amp * (1 - (t - s0) / d); }); return a; }; });

    // graphic card overlay (same picture as the wall TV), shown in the top half during CARD shots
    S.add(K.cam);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tvTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    card.renderOrder = 999; K.cam.add(card);
    const cardShot = t => shotPlan.find(([a, b, sh]) => (sh === CARD || sh === CARDS) && t >= a && t < b);
    const placeCard = t => {
      const cs = cardShot(t); card.visible = !!cs; if (!cs) return;
      const k = Math.min(backE(pr(t, cs[0], cs[0] + 0.35)), 1 + 0.06 * (1 - pr(t, cs[0] + 0.2, cs[0] + 0.5)));
      const out = 1 - eo(pr(t, cs[1] - 0.18, cs[1]));
      const visH = 2 * Math.tan(K.cam.fov * Math.PI / 360), visW = visH * 1080 / 1920, w = visW * 0.93 * k * (0.9 + 0.1 * out);
      card.scale.set(w, w * 9 / 16, 1); card.position.set(0, (0.5 - 430 / 1920) * visH, -1); card.material.opacity = out;
    };
    // ================= MOTION-GRAPHICS LAYER (full screen, on top of the 3D) =================
    const HW = 1080, HH = 1920, hc = document.createElement('canvas'); hc.width = HW; hc.height = HH; const h = hc.getContext('2d');
    const hTex = new THREE.CanvasTexture(hc); hTex.colorSpace = THREE.SRGBColorSpace;
    const hud = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    hud.renderOrder = 1000; K.cam.add(hud);
    const HF = (s, w = 900) => `${w} ${s}px "Inter Display", "Inter", "DejaVu Sans"`;
    const ht = (str, X, Y, size, color = '#fff', { w = 900, align = 'center', stroke = 0, sc = '#0b1026', alpha = 1, rot = 0 } = {}) => { h.save(); h.globalAlpha *= alpha; h.translate(X, Y); h.rotate(rot); h.font = HF(size, w); h.textAlign = align; h.textBaseline = 'middle';
      if (stroke) { h.lineJoin = 'round'; h.lineWidth = stroke; h.strokeStyle = sc; h.strokeText(str, 0, 0); } h.fillStyle = color; h.fillText(str, 0, 0); h.restore(); };
    const hsc = (cx, cy, k, fn) => { if (k <= 0.001) return; h.save(); h.translate(cx, cy); h.scale(k, k); h.translate(-cx, -cy); fn(); h.restore(); };
    const hrr = (X, Y, w, hh, r) => { h.beginPath(); h.moveTo(X + r, Y); h.arcTo(X + w, Y, X + w, Y + hh, r); h.arcTo(X + w, Y + hh, X, Y + hh, r); h.arcTo(X, Y + hh, X, Y, r); h.arcTo(X, Y, X + w, Y, r); h.closePath(); };
    const hchip = (str, cx, cy, bg, fg = '#0b1026', size = 46, rot = 0) => { h.save(); h.translate(cx, cy); h.rotate(rot); h.font = HF(size); const w = h.measureText(str).width + 64; hrr(-w / 2, -size * 0.9, w, size * 1.8, size * 0.9); h.fillStyle = bg; h.fill(); h.font = HF(size); h.textAlign = 'center'; h.textBaseline = 'middle'; h.fillStyle = fg; h.fillText(str, 0, 3); h.restore(); };
    const popH = (t, t0, d = 0.32) => backE(pr(t, t0, t0 + d));
    const winH = (t, a, b, f = 0.15) => cl(Math.min(pr(t, a, a + f), 1 - pr(t, b - f, b)));
    // coin bursts
    const coinR = K.rng(21), bursts = [[B(3) + 1.3, 540, 760, 26], [B(5) + 0.05, 540, 900, 34], [B(7) + 1.4, 540, 760, 24]].map(([t0, cx, cy, n]) =>
      ({ t0, cx, cy, ps: Array.from({ length: n }, () => ({ a: -Math.PI / 2 + (coinR() - 0.5) * 2.6, v: 900 + coinR() * 900, s: 18 + coinR() * 18, sp: (coinR() - 0.5) * 18 })) }));
    const coin = (X, Y, r, spin) => { const sx = Math.abs(Math.cos(spin)); h.save(); h.translate(X, Y); h.scale(Math.max(0.15, sx), 1);
      h.fillStyle = '#e8a91c'; h.beginPath(); h.arc(0, 0, r, 0, 7); h.fill(); h.fillStyle = '#ffd34d'; h.beginPath(); h.arc(-r * 0.08, -r * 0.08, r * 0.82, 0, 7); h.fill();
      h.fillStyle = '#c98a10'; h.font = HF(r * 1.1); h.textAlign = 'center'; h.textBaseline = 'middle'; h.fillText('₹', -r * 0.05, r * 0.02); h.restore(); };
    const speedLines = (k, t, color) => { const r = K.rng(5); h.save(); h.globalAlpha = 0.55 * k; h.strokeStyle = color; h.lineCap = 'round';
      for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, r0 = 520 + r() * 260 - (t * 900 % 160), len = 160 + r() * 260; h.lineWidth = 3 + r() * 6;
        h.beginPath(); h.moveTo(HW / 2 + Math.cos(a) * r0, HH * 0.45 + Math.sin(a) * r0); h.lineTo(HW / 2 + Math.cos(a) * (r0 + len), HH * 0.45 + Math.sin(a) * (r0 + len)); h.stroke(); } h.restore(); };
    const fmtH = n => { const s = String(Math.round(n)); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3); };
    const hudDraw = t => {
      h.clearRect(0, 0, HW, HH);
      // progress bar (keeps people watching to the end)
      h.fillStyle = 'rgba(255,255,255,0.18)'; h.fillRect(0, 0, HW, 10); h.fillStyle = '#ff8a1f'; h.fillRect(0, 0, HW * cl(t / D), 10);
      // HOOK: title banner + YOU vs AMBANI chips (0 → end of "Guess first")
      { const a = winH(t, 0.05, E(1) + 0.1); if (a > 0) { h.save(); h.globalAlpha = a;
        hsc(HW / 2, 250, popH(t, 0.1), () => { hrr(90, 160, 900, 180, 40); h.fillStyle = 'rgba(11,16,38,0.82)'; h.fill(); h.lineWidth = 5; h.strokeStyle = '#ff8a1f'; h.stroke();
          ht('₹1 EVERY SECOND', HW / 2, 222, 72, '#ffc53d'); ht('vs  AMBANI', HW / 2, 292, 50, '#fff', { w: 800 }); });
        const n = Math.floor(Math.max(0, t)) + 1;
        hsc(240, 430, popH(t, 0.6), () => hchip('YOU: ₹' + n, 240, 430, '#2ec4b6', '#0b1026', 44, -0.05));
        hsc(840, 430, popH(t, 0.9), () => hchip('AMBANI: ???', 840, 430, '#ffc53d', '#0b1026', 44, 0.05));
        h.restore(); } }
      // COUNTDOWN 3-2-1, full screen
      if (t >= E(1) && t < B(2)) { const c = t - E(1), n = 3 - Math.floor(c), f = c % 1;
        h.fillStyle = `rgba(8,10,28,${0.55 * cl(c / 0.2)})`; h.fillRect(0, 0, HW, HH);
        hchip('GUESS FIRST', HW / 2, 470, '#ffc53d', '#0b1026', 60);
        if (n >= 1) { const cx = HW / 2, cy = 860; h.lineWidth = 30; h.strokeStyle = 'rgba(255,255,255,0.15)'; h.beginPath(); h.arc(cx, cy, 250, 0, 7); h.stroke();
          h.strokeStyle = '#ffc53d'; h.lineCap = 'round'; h.beginPath(); h.arc(cx, cy, 250, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); h.stroke();
          hsc(cx, cy, backE(cl(f / 0.22)) * (1 - 0.12 * f), () => ht(String(n), cx, cy + 10, 330, '#fff', { stroke: 14 })); }
        ht('comment your guess', HW / 2, 1210, 52, '#ffc53d', { w: 800, stroke: 8 }); }
      // Maddie's guess
      { const a = winH(t, B(2), B(3)); if (a > 0) hsc(HW / 2, 420, popH(t, B(2) + 0.15) * a, () => { h.save(); h.translate(HW / 2, 420); h.rotate(-0.06); hrr(-280, -100, 560, 200, 60); h.fillStyle = '#fff'; h.fill(); ht('10 YEARS?', 0, 6, 96, '#0b1026'); h.restore(); }); }
      // coin bursts
      bursts.forEach(b => { const u = t - b.t0; if (u < 0 || u > 1.6) return; b.ps.forEach(p => { const X = b.cx + Math.cos(p.a) * p.v * u, Y = b.cy + Math.sin(p.a) * p.v * u + 1400 * u * u;
        h.globalAlpha = cl(1.6 - u); coin(X, Y, p.s, u * p.sp); }); h.globalAlpha = 1; });
      // "RICH?" stamp on "basically rich already"
      { const a = winH(t, B(5), B(6)); if (a > 0) hsc(HW / 2, 430, popH(t, B(5) + 0.1) * a, () => ht('RICH?! 🤑'.replace(' 🤑', ''), HW / 2, 430, 190, '#ffc53d', { stroke: 18, rot: -0.08 })); }
      // "That's insane!" reaction pop
      { const a = winH(t, B(8), B(9)); if (a > 0) { speedLines(a, t, '#ffffff'); hsc(HW / 2, 430, popH(t, B(8)) * a, () => ht('INSANE!', HW / 2, 430, 170, '#fff', { stroke: 18, sc: '#ff4d5e', rot: 0.06 })); } }
      // "Then how long?" question marks
      { const a = winH(t, B(11), B(12)); if (a > 0) [[230, 380, -0.3], [540, 300, 0.1], [850, 400, 0.3]].forEach(([qx, qy, r], i) => hsc(qx, qy, popH(t, B(11) + i * 0.1) * a, () => ht('?', qx, qy + Math.sin(t * 5 + i) * 12, 200, i % 2 ? '#ffc53d' : '#fff', { stroke: 14, rot: r }))); }
      // 2 LAKH YEARS — counter on Bittu's line, SLAM on Maddie's shock
      { const a = winH(t, B(12), E(13) + 0.6); if (a > 0) { const shock = t >= B(13);
        if (shock) { const f = 1 - pr(t, B(13), B(13) + 0.5); h.fillStyle = `rgba(255,40,70,${0.45 * f})`; h.fillRect(0, 0, HW, HH); speedLines(a, t, '#ff4d5e'); }
        const yrs = 200000 * Math.pow(eo(pr(t, B(12) + 0.1, B(12) + 1.0)), 1.5);
        hsc(HW / 2, 400, (shock ? popH(t, B(13), 0.25) * (1.06 + 0.03 * Math.sin(t * 40)) : popH(t, B(12))) * a, () => {
          ht(fmtH(yrs) + (yrs >= 199999 ? '+' : ''), HW / 2, 360, 190, shock ? '#ff4d5e' : '#ffc53d', { stroke: 18 });
          ht('YEARS', HW / 2, 510, 110, '#fff', { stroke: 14 }); }); } }
      // ₹2 a second
      { const a = winH(t, B(15), B(16)); if (a > 0) hsc(HW / 2, 420, popH(t, B(15) + 0.1) * a, () => hchip('₹2 / SECOND?', HW / 2, 420, '#2ec4b6', '#0b1026', 78, -0.04)); }
      // final answer + follow
      { const a = winH(t, B(16), D + 1); if (a > 0) { hsc(HW / 2, 380, popH(t, B(16)) * a, () => { ht('STILL', HW / 2, 290, 70, '#fff', { stroke: 10 }); ht('1,00,000+ YEARS', HW / 2, 400, 110, '#ffc53d', { stroke: 14 }); }); } }
      hTex.needsUpdate = true;
    };
    const placeHud = () => { const visH = 2 * Math.tan(K.cam.fov * Math.PI / 360); hud.scale.set(visH * HW / HH, visH, 1); hud.position.set(0, 0, -1); };
    const update = t => { acting(t); tvDraw(t); placeCard(t); placeHud(); hudDraw(t); tvL.intensity = 1.8 + 0.6 * Math.sin(t * 3) * 0.3; };
    const sfx = [
      ['pop', 0.2, 0.6], ['pop', 0.5, 0.5], ['pop', 1.1, 0.5],
      ['tick', E(1) + 0.02, 0.8], ['tick', E(1) + 1.02, 0.8], ['tick', E(1) + 2.02, 0.8],
      ['pop', B(2) + 0.15, 0.6], ['coin', B(5) + 0.05, 0.6], ['whoosh', B(8), 0.45], ['whoosh', B(3) - 0.05, 0.5], ['coin', B(3) + 1.3, 0.6], ['coin', B(4) + 1.0, 0.6],
      ['ding', B(5) + 0.1, 0.5], ['whoosh', B(6) - 0.05, 0.5], ['kaching', B(7) + 1.4, 0.6], ['pop', B(8), 0.5],
      ['whoosh', B(9) - 0.05, 0.5], ['bass', B(10), 0.7], ['riser', Math.max(0, B(12) - 1.6), 0.45], ['ding', B(12) + 1.0, 0.6],
      ['bass', B(13), 0.9], ['thud', B(13), 0.8], ['whoosh', B(14) - 0.05, 0.5], ['pop', B(15) + 0.1, 0.5], ['whoosh', B(16) - 0.05, 0.5],
    ];
    return { duration: D, update, shots, sfx, watermark: '@just.money.things', endCard: 'FOLLOW @just.money.things', music: {}, capFont: 'Inter Display', capMarginV: 430 };
  },
};
