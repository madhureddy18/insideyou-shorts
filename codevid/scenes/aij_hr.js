/* @ai.jugaadd "Applied? Now message the HR." — new location: sunny co-working café, golden hour.
   Maddie warm & young, Claude dry & British (cold: no glow, tilt / nod only). Clean motion graphics on a HUD.
   No handle on the reel. Subtitles higher. CTA: comment HR. */
window.SCENE = {
  setup: { width: 1080, height: 1920, bg: 0x2a2018, fog: null, fov: 34, bloom: { strength: 0.22, radius: 0.5, threshold: 0.94 } },
  lines: [
    { who: 'maddie', text: '301 applications. Now I just wait.', say: 'Three hundred and one applications. Now I just wait.', gap: 0.5 },
    { who: 'claude', text: "That's why nobody calls.", say: "That's why nobody calls.", gap: 0.6 },
    { who: 'claude', text: 'Your application is one of two thousand.', say: 'Your application is one of two thousand.', gap: 0.6 },
    { who: 'claude', text: "Apply, yes. But then message the person who's hiring.", say: "Apply, yes. But then, message the person who's hiring." },
    { who: 'maddie', text: 'Wait… after applying, I message HR directly?', say: 'Wait... after applying, I message H R directly?', gap: 0.4 },
    { who: 'claude', text: 'Step one, apply. Step two, find who posted it.', say: 'Step one, apply. Step two, find who posted it.', gap: 0.7 },
    { who: 'claude', text: 'Their name is right there. Nobody uses it.', say: 'Their name is right there. Nobody uses it.', gap: 0.6 },
    { who: 'claude', text: '"I just applied." Their name. One proof. One ask.', say: 'I just applied. Their name. One proof. One ask.', gap: 0.8 },
    { who: 'claude', text: "Paste the job post and your resume. I'll write it.", say: "Paste the job post, and your resume. I'll write it." },
    { who: 'maddie', text: "Not 'Respected Sir, kindly consider my profile'?", say: 'Not, respected sir, kindly consider my profile?', gap: 0.5 },
    { who: 'claude', text: 'Never.', say: 'Never.', gap: 0.35 },
    { who: 'maddie', text: 'She actually opened my application.', say: 'She actually opened my application!', gap: 1.6 },
    { who: 'claude', text: '…Interview.', say: 'Interview.', gap: 0.8 },
    { who: 'claude', text: "Comment HR. I'll send you the message prompt.", say: "Comment H R. I'll send you the message prompt.", gap: 0.9 },
  ].map(l => ({ gap: 0.35, ...l, speed: l.who === 'claude' ? 0.92 : 1.0 })),

  build(K, T) {
    const L = T.lines, B = i => L[i].t, E = i => L[i].end, N = L.length, D = E(N - 1) + 2.8;
    const cl = K.clamp, eo = K.easeOut, pr = K.prog, eb = K.easeBack;
    const S = K.scene, SM = (c, r = 0.7, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, o));
    const RB = window.RoundedBoxGeometry;
    const rbox = (w, h, d, m, x, y, z, rad = 0.02, parent = S) => { const o = new THREE.Mesh(new RB(w, h, d, 3, Math.min(rad, w / 2, h / 2, d / 2)), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
    const cyl = (rt, rb, h, m, x, y, z, seg = 20, parent = S) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };

    // ================= CAFÉ (co-working, golden hour, big glass wall) =================
    const floorTex = K.canvasTex(1024, 1024, (x, w, h) => {
      for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#b98a5c' : '#c49466'; x.fillRect(0, i * 64, w, 64); }
      const r = K.rng(4); x.strokeStyle = 'rgba(70,40,20,0.25)'; x.lineWidth = 2;
      for (let i = 0; i < 16; i++) { x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); for (let k = 0; k < 3; k++) { const xx = r() * w; x.beginPath(); x.moveTo(xx, i * 64); x.lineTo(xx, i * 64 + 64); x.stroke(); } }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(2, 2);
    rbox(8, 0.1, 6, SM(0xffffff, 0.75, { map: floorTex }), 0, -0.05, 0, 0.01).castShadow = false;
    const sky = K.canvasTex(1600, 900, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6fa8e6'); g.addColorStop(0.45, '#bcd6ee'); g.addColorStop(0.8, '#ffd9a6'); g.addColorStop(1, '#ffc489'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const sun = x.createRadialGradient(1220, 560, 10, 1220, 560, 420); sun.addColorStop(0, 'rgba(255,246,214,1)'); sun.addColorStop(0.15, 'rgba(255,226,170,0.8)'); sun.addColorStop(1, 'rgba(255,200,140,0)'); x.fillStyle = sun; x.fillRect(0, 0, w, h);
      const r = K.rng(11);
      for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(r() * w, 80 + r() * 260, 120 + r() * 160, 22 + r() * 18, 0, 0, 7); x.fill(); }
      for (let layer = 0; layer < 3; layer++) for (let bx = -30; bx < w; bx += 30 + r() * 60) {
        const bw = 50 + r() * 90, bh = [150, 260, 180][layer] + r() * [120, 300, 140][layer], top = h - bh - [120, 60, 0][layer];
        x.fillStyle = ['#a9b8d0', '#7f8fac', '#5d6c86'][layer]; x.fillRect(bx, top, bw, h - top);
        if (layer === 1) for (let wy = top + 14; wy < h - 20; wy += 22) for (let wx = bx + 8; wx < bx + bw - 10; wx += 16) if (r() < 0.5) { x.fillStyle = r() < 0.5 ? 'rgba(255,230,190,0.7)' : 'rgba(200,220,255,0.5)'; x.fillRect(wx, wy, 8, 12); }
      }
      for (let i = 0; i < 26; i++) { x.fillStyle = i % 2 ? '#4c7a4a' : '#3f6b3e'; x.beginPath(); x.arc(i * 66 + r() * 30, h - 10 - r() * 20, 40 + r() * 30, 0, 7); x.fill(); }
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.2), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })); glass.position.set(0, 1.7, -1.5); S.add(glass);
    const frameM = SM(0x2b2a2e, 0.5, { metalness: 0.4 });
    [-1.95, -0.65, 0.65, 1.95].forEach(x => rbox(0.05, 3.2, 0.06, frameM, x, 1.7, -1.46));
    rbox(5.2, 0.06, 0.08, frameM, 0, 0.12, -1.45); rbox(5.2, 0.05, 0.06, frameM, 0, 2.2, -1.46);
    rbox(5.4, 0.9, 0.2, SM(0xe9dfcf, 0.9), 0, 3.4, -1.45);
    // side walls (warm brick left, painted right)
    const brick = K.canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#c9b49a'; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = -1; c < 5; c++) { x.fillStyle = ['#a8573e', '#b5634a', '#9c4f38'][(r + c + 9) % 3]; x.fillRect(c * 128 + (r % 2) * 64 + 4, r * 32 + 4, 120, 26); } });
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), SM(0xffffff, 0.95, { map: brick })); wallL.rotation.y = Math.PI / 2; wallL.position.set(-2.6, 2, 0); S.add(wallL);
    rbox(0.1, 4, 6, SM(0xe7dccb, 0.95), 2.65, 2, 0, 0.01);
    // chalkboard on brick wall
    const chalk = K.canvasTex(512, 640, (x, w, h) => {
      x.fillStyle = '#2b302c'; x.fillRect(0, 0, w, h); x.strokeStyle = '#9a7650'; x.lineWidth = 26; x.strokeRect(0, 0, w, h);
      x.fillStyle = '#f3efe4'; x.textAlign = 'center'; x.font = '900 60px "Inter Display", sans-serif'; x.fillText('MENU', w / 2, 100);
      x.font = '600 38px "Inter", sans-serif'; [['Filter coffee', '40'], ['Masala chai', '30'], ['Cold brew', '90'], ['Bun maska', '50'], ['Wi-Fi', 'free']].forEach(([a, b], i) => { x.textAlign = 'left'; x.fillText(a, 50, 190 + i * 80); x.textAlign = 'right'; x.fillText(b, w - 50, 190 + i * 80); });
    });
    const cb = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.94), SM(0xffffff, 0.9, { map: chalk })); cb.rotation.y = Math.PI / 2; cb.position.set(-2.58, 1.75, -0.6); S.add(cb);
    // coffee counter (back right) + espresso machine + cups
    const woodM = SM(0x7b5236, 0.55), topM = SM(0xf1ece4, 0.35);
    rbox(1.3, 0.95, 0.5, woodM, 1.75, 0.475, -1.0, 0.03); rbox(1.36, 0.05, 0.56, topM, 1.75, 0.975, -1.0, 0.02);
    const steel = SM(0xc9ccd2, 0.25, { metalness: 0.8 });
    rbox(0.45, 0.32, 0.3, steel, 1.65, 1.16, -1.05, 0.04); rbox(0.36, 0.06, 0.06, SM(0x1f1f22, 0.4), 1.65, 1.1, -0.89, 0.02);
    for (let i = 0; i < 4; i++) cyl(0.035, 0.03, 0.08, SM([0xf2ece0, 0x2e9c87, 0xf2ece0, 0xd9663a][i], 0.5), 2.0 + (i % 2) * 0.1, 1.04, -1.1 + Math.floor(i / 2) * 0.12, 16);
    // pendant lamps
    const pend = [];
    [[1.35, -0.95], [1.95, -0.95], [-0.2, -0.6]].forEach(([x, z], i) => {
      cyl(0.004, 0.004, 1.0, SM(0x222222), x, 2.75, z, 6);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.16, 24, 1, true), SM(0x1e3a34, 0.5, { side: THREE.DoubleSide })); shade.position.set(x, 2.2, z); S.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe0b0, toneMapped: false })); bulb.position.set(x, 2.13, z); S.add(bulb);
      if (i < 2) { const pl = new THREE.PointLight(0xffc98a, 0.6, 2.2, 1.8); pl.position.set(x, 2.05, z); S.add(pl); pend.push(pl); }
    });
    // big plants (left back) + small plant on counter
    const leafM = [SM(0x3f8f4e, 0.8), SM(0x2f7a42, 0.8), SM(0x4f9a52, 0.8)];
    cyl(0.2, 0.16, 0.42, SM(0xd8cfc2, 0.6), -1.75, 0.21, -1.0, 24);
    for (let i = 0; i < 14; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), leafM[i % 3]); const a = i * 2.4; lf.position.set(-1.75 + Math.sin(a) * 0.18, 0.62 + (i % 5) * 0.16, -1.0 + Math.cos(a) * 0.14); lf.scale.set(0.6, 1.5, 0.4); lf.rotation.z = Math.sin(a) * 0.6; S.add(lf); }
    // second café table (left, background) with stool
    cyl(0.32, 0.32, 0.04, SM(0xd8b98e, 0.5), -1.25, 0.74, -1.05, 30); cyl(0.03, 0.03, 0.72, SM(0x2b2a2e, 0.4, { metalness: 0.5 }), -1.25, 0.37, -1.05, 10); cyl(0.2, 0.22, 0.02, SM(0x2b2a2e, 0.4, { metalness: 0.5 }), -1.25, 0.01, -1.05, 20);
    cyl(0.04, 0.035, 0.09, SM(0xf2ece0, 0.5), -1.18, 0.81, -1.0, 14);

    // our table: wood top, black metal legs
    const DY = 0.74;
    const tableM = SM(0xd8b98e, 0.45), legM = SM(0x2b2a2e, 0.4, { metalness: 0.5 });
    rbox(1.6, 0.045, 0.82, tableM, 0, DY - 0.022, -0.45, 0.02);
    [[-0.74, -0.1], [0.74, -0.1], [-0.74, -0.8], [0.74, -0.8]].forEach(([x, z]) => rbox(0.035, DY - 0.04, 0.035, legM, x, (DY - 0.04) / 2, z, 0.01));
    // chair
    const chairM = SM(0x2e6b5e, 0.6);
    rbox(0.5, 0.06, 0.46, chairM, -0.2, 0.53, -0.95, 0.03); rbox(0.5, 0.5, 0.06, chairM, -0.2, 0.9, -1.2, 0.04);
    [[-0.42, -0.75], [0.02, -0.75], [-0.42, -1.15], [0.02, -1.15]].forEach(([x, z]) => rbox(0.03, 0.5, 0.03, legM, x, 0.25, z, 0.01));
    // laptop (screen faces Maddie)
    const lap = new THREE.Group(); lap.position.set(-0.2, DY, -0.5); S.add(lap);
    const alu = SM(0xb7bcc4, 0.35, { metalness: 0.5 });
    rbox(0.5, 0.025, 0.34, alu, 0, 0.012, 0, 0.01, lap);
    const lid = new THREE.Group(); lid.position.set(0, 0.025, 0.16); lid.rotation.x = 0.28; lap.add(lid);
    rbox(0.44, 0.27, 0.018, alu, 0, 0.135, 0, 0.01, lid);
    const stk = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), SM(0xe0663a, 0.5)); stk.position.set(0.1, 0.17, 0.011); lid.add(stk);
    const stk2 = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.045), SM(0xffd34d, 0.5)); stk2.position.set(-0.1, 0.08, 0.011); stk2.rotation.z = -0.2; lid.add(stk2);
    const scrM = new THREE.MeshBasicMaterial({ color: 0xdfe8f5, toneMapped: false });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.245), scrM); scr.rotation.y = Math.PI; scr.position.set(0, 0.135, -0.0095); lid.add(scr);
    // cold coffee glass + phone (screen up)
    const glassM = SM(0xffffff, 0.1, { transparent: true, opacity: 0.35 });
    cyl(0.045, 0.038, 0.13, glassM, 0.62, DY + 0.065, -0.22, 20); cyl(0.04, 0.034, 0.09, SM(0x6b4226, 0.4), 0.62, DY + 0.045, -0.22, 20);
    cyl(0.004, 0.004, 0.2, SM(0x2e9c87, 0.4), 0.64, DY + 0.15, -0.22, 6).rotation.z = 0.2;
    const phone = new THREE.Group(); phone.position.set(-0.6, DY + 0.006, -0.22); phone.rotation.y = 0.25; S.add(phone);
    rbox(0.085, 0.01, 0.17, SM(0x1a1a1f, 0.3), 0, 0, 0, 0.006, phone);
    const PW = 340, PH = 680, pc = document.createElement('canvas'); pc.width = PW; pc.height = PH; const px = pc.getContext('2d');
    const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace;
    const pScr = new THREE.Mesh(new THREE.PlaneGeometry(0.077, 0.158), new THREE.MeshBasicMaterial({ map: pTex, toneMapped: false })); pScr.rotation.x = -Math.PI / 2; pScr.position.y = 0.0055; phone.add(pScr);
    const pL = new THREE.PointLight(0xbfd8ff, 0, 0.5, 2); pL.position.set(-0.6, DY + 0.08, -0.22); S.add(pL);
    // notebook + pen
    rbox(0.2, 0.012, 0.27, SM(0xe9e2d2, 0.8), 0.25, DY + 0.006, -0.12, 0.006).rotation.y = -0.15;
    cyl(0.005, 0.005, 0.15, SM(0x2d4f8f, 0.4), 0.3, DY + 0.016, -0.12, 8).rotation.z = Math.PI / 2;

    // ================= CHARACTERS =================
    const M = K.makeToyMaddie({ seatY: 0.56, shirt: 0x24324a, pants: 0xd2bf98 }); M.g.position.set(-0.2, 0, -0.95); S.add(M.g);
    const R = K.makeRobo({ height: 0.42 }); R.g.position.set(0.32, DY, -0.42); R.g.rotation.y = -0.75; S.add(R.g);

    // ================= LIGHT (daylight from the glass behind, warm sun) =================
    S.add(new THREE.HemisphereLight(0xdbe8ff, 0x8a6a4a, 1.0));
    const sunL = new THREE.DirectionalLight(0xffd6a0, 2.2); sunL.position.set(1.6, 2.6, -3.2); sunL.target.position.set(0, 0.8, -0.4); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); sunL.shadow.bias = -0.0005; S.add(sunL); S.add(sunL.target);
    const key = new THREE.DirectionalLight(0xfff3e6, 1.25); key.position.set(-0.8, 2.2, 2.6); key.target.position.set(0, 1, -0.6); S.add(key); S.add(key.target);
    const fill = new THREE.DirectionalLight(0xcfe0ff, 0.45); fill.position.set(2, 1.2, 1.5); S.add(fill);
    const bounce = new THREE.PointLight(0xffe2c0, 0.8, 2.5, 1.6); bounce.position.set(0, 1.0, 0.3); S.add(bounce);

    // ================= TIMELINE =================
    const S2 = B(2) - 0.35, S3 = B(5) - 0.35, S4 = B(7) - 0.35, S5 = B(11) - 1.9, S6 = B(13) - 0.45;
    const NOTIF = S5 + 0.45;

    // ================= ACTING =================
    const speaking = (who, t) => L.some(l => l.who === who && t >= l.t && t < l.end - 0.03);
    let mYaw = 0.05, rYaw = -0.2, mPitch = 0.06, last = -1; const sm = (a, b, k) => a + (b - a) * k;
    const acting = t => {
      const mT = K.voice('maddie', t), rT = K.voice('claude', t) * 0.6;
      const k = last < 0 ? 1 : cl((t - last) * 1.8); last = t;
      const atLaptop = t < E(0) + 0.4 || (t >= S4 && t < B(9) - 0.3);
      const atPhone = t >= NOTIF && t < B(11) - 0.1;
      mYaw = sm(mYaw, atPhone ? -0.45 : atLaptop ? 0.05 : 0.5, k);
      mPitch = sm(mPitch, atPhone ? 0.42 : atLaptop ? 0.08 : -0.02, k);
      rYaw = sm(rYaw, (t > E(0) && t < S6) ? -0.62 : -0.2, k * 0.55);
      const face = (t >= B(4) && t < E(4) + 0.4) ? 'shock' : (t >= B(9) && t < E(10) + 0.3) ? 'worried' : (t >= B(11) && t < E(11) + 0.2) ? 'shock'
        : (t >= E(11) + 0.2 && t < S6 + 0.8) ? 'smile' : t < E(0) + 0.3 ? 'smile' : (t >= B(1) && t < E(1) + 0.4) ? 'worried' : 'neutral';
      const lean = t < B(0) + 1.5 ? 0.05 : t < E(1) + 0.3 ? 0.55 : (t >= B(4) && t < E(4)) ? -0.15 : (t >= NOTIF && t < E(11)) ? -0.2 : 0.15;
      const typing = (t < E(0) - 0.6) ? 1 : (t >= S4 && t < B(9) - 0.5) ? 0.6 : 0;
      M.update(t, { talk: mT * 0.9, face, look: [mYaw, mPitch], type: typing, lean });
      R.update(t, { talk: rT, look: [rYaw, 0.04], mood: 'calm', glow: false });
      R.head.rotation.z += 0.12 * K.pulse(t, B(1) - 0.3, 2.0) + 0.14 * K.pulse(t, B(10) - 0.35, 1.3);
      R.head.rotation.x += 0.16 * K.pulse(t, B(12) - 0.5, 0.9);
      // phone buzz
      const buzz = t >= NOTIF && t < NOTIF + 1.0 ? Math.sin(t * 90) * 0.012 * (Math.sin((t - NOTIF) * Math.PI * 2.2) > 0 ? 1 : 0) : 0;
      phone.position.x = -0.6 + buzz; phone.rotation.y = 0.25 + buzz * 2;
    };

    // ================= PHONE SCREEN =================
    const drawPhone = t => {
      const on = t >= NOTIF && t < D;
      px.fillStyle = on ? '#1b2440' : '#050507'; px.fillRect(0, 0, PW, PH);
      if (on) {
        px.fillStyle = '#ffffff'; px.font = '300 92px "Inter", sans-serif'; px.textAlign = 'center'; px.fillText('4:47', PW / 2, 170);
        const k = eo(pr(t, NOTIF, NOTIF + 0.4));
        px.globalAlpha = k; px.fillStyle = 'rgba(255,255,255,0.92)'; px.beginPath(); px.roundRect(18, 240 - (1 - k) * 30, PW - 36, 150, 24); px.fill();
        px.fillStyle = '#1f6fd1'; px.beginPath(); px.roundRect(36, 262, 40, 40, 10); px.fill();
        px.fillStyle = '#111'; px.textAlign = 'left'; px.font = '700 26px "Inter", sans-serif'; px.fillText('Priya (HR)', 88, 292);
        px.font = '400 22px "Inter", sans-serif'; px.fillText('Thanks Maddie! Found your', 36, 336); px.fillText('application. Free tomorrow…', 36, 366); px.globalAlpha = 1;
      }
      pTex.needsUpdate = true; pL.intensity = on ? 0.06 : 0;
    };

    // ================= CAMERA =================
    const P = (pos, look, fov) => ({ pos, look, fov });
    const WIDE = [P([0.15, 1.5, 2.1], [0.0, 1.2, -0.6], 40), P([0.0, 1.45, 1.55], [-0.05, 1.2, -0.6], 38)];
    const ROB = [P([-0.12, 1.15, 0.6], [0.3, 0.98, -0.42], 32), P([-0.1, 1.14, 0.53], [0.3, 0.98, -0.42], 32)];
    const LOW = [P([0.35, 1.0, 1.3], [0.0, 1.0, -0.6], 40), P([0.28, 1.02, 1.15], [0.0, 1.0, -0.6], 40)];
    const MAD = [P([-0.04, 1.45, 0.9], [-0.2, 1.29, -0.94], 34), P([-0.05, 1.44, 0.8], [-0.2, 1.29, -0.94], 34)];
    const SIDE = [P([-0.55, 1.22, 0.75], [0.25, 1.24, -0.45], 38), P([-0.5, 1.22, 0.66], [0.25, 1.24, -0.45], 38)];
    const TURN = [P([0.35, 1.32, 1.2], [0.0, 1.1, -0.7], 38), P([0.28, 1.3, 1.05], [0.0, 1.1, -0.7], 38)];
    const NOD = [P([-0.1, 1.15, 0.5], [0.3, 0.98, -0.42], 30), P([-0.09, 1.14, 0.44], [0.3, 0.98, -0.42], 30)];
    const PHONE = [P([-0.42, 1.16, 0.18], [-0.6, DY, -0.22], 34), P([-0.5, 1.02, 0.02], [-0.6, DY, -0.22], 34)];
    const OUT = [P([0.05, 1.42, 1.2], [0.0, 1.22, -0.6], 38), P([0.15, 1.6, 2.5], [0.0, 1.3, -0.6], 44)];
    const plan = [
      [0, B(1) - 0.15, WIDE], [B(1) - 0.15, S2, ROB],
      [S2, B(4) - 0.15, LOW], [B(4) - 0.15, S3, MAD],
      [S3, S4, SIDE],
      [S4, B(9) - 0.15, TURN], [B(9) - 0.15, B(10) - 0.1, MAD], [B(10) - 0.1, S5, ROB],
      [S5, B(11) - 0.1, PHONE], [B(11) - 0.1, B(12) - 0.4, MAD], [B(12) - 0.4, S6, NOD],
      [S6, D + 5, OUT],
    ];
    const smooth = k => k * k * (3 - 2 * k);
    const shots = plan.map(([a, b, s]) => ({ t: [a, b], from: s[0], to: s[1], fov: s[0].fov, ease: smooth }));
    const fadeAt = [0, S2, S3, S4, S5, S6];
    const fade = t => { let a = 0; fadeAt.forEach(c => { const d = Math.abs(t - c); if (d < 0.28) a = Math.max(a, (1 - d / 0.28) * 0.85); }); return t < 0.35 ? Math.max(a, 1 - t / 0.35) : a; };

    // ================= HUD MOTION GRAPHICS =================
    S.add(K.cam);
    const HW = 1080, HH = 1920, hc = document.createElement('canvas'); hc.width = HW; hc.height = HH; const h = hc.getContext('2d');
    const hTex = new THREE.CanvasTexture(hc); hTex.colorSpace = THREE.SRGBColorSpace;
    const hud = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    hud.renderOrder = 1000; K.cam.add(hud);
    const ACC = '#ffb86b', GRN = '#3ddc97', RED = '#ff5a5f', INK = 'rgba(16,15,22,0.95)', TXT = '#f4efe8', DIM = 'rgba(244,239,232,0.6)';
    const F = (s, w = 400, fam = '"Inter", "DejaVu Sans"') => `${w} ${s}px ${fam}`;
    const txt = (s, x, y, size, col, w = 400, align = 'left', a = 1, fam) => { h.save(); h.globalAlpha *= a; h.font = F(size, w, fam); h.fillStyle = col; h.textAlign = align; h.textBaseline = 'middle'; h.fillText(s, x, y); h.restore(); };
    const fin = (t, t0, d = 0.5) => eo(pr(t, t0, t0 + d));
    const pop = (t, t0, d = 0.45) => eb(pr(t, t0, t0 + d));
    const card = (x, y, w, hh, r = 30, fill = INK, stroke = 'rgba(255,214,170,0.28)') => { h.fillStyle = fill; h.beginPath(); h.roundRect(x, y, w, hh, r); h.fill(); if (stroke) { h.strokeStyle = stroke; h.lineWidth = 2; h.stroke(); } };
    const check = (cx, cy, s, k, col = GRN) => { if (k <= 0) return; h.save(); h.strokeStyle = col; h.lineWidth = s * 0.16; h.lineCap = h.lineJoin = 'round'; h.beginPath();
      const p = [[-0.35, 0], [-0.1, 0.25], [0.38, -0.28]].map(([a, b]) => [cx + a * s, cy + b * s]); const L1 = 0.4, k1 = Math.min(k / L1, 1), k2 = cl((k - L1) / (1 - L1));
      h.moveTo(...p[0]); h.lineTo(p[0][0] + (p[1][0] - p[0][0]) * k1, p[0][1] + (p[1][1] - p[0][1]) * k1); if (k2 > 0) h.lineTo(p[1][0] + (p[2][0] - p[1][0]) * k2, p[1][1] + (p[2][1] - p[1][1]) * k2); h.stroke(); h.restore(); };
    const chip = (s, x, y, size, bg, fg, a = 1, sc = 1, w = 600) => { h.save(); h.globalAlpha *= a; h.font = F(size, w); const tw = h.measureText(s).width + size * 1.2, th = size * 1.75;
      h.translate(x, y); h.scale(sc, sc); h.fillStyle = bg; h.beginPath(); h.roundRect(-tw / 2, -th / 2, tw, th, th / 2); h.fill(); h.fillStyle = fg; h.textAlign = 'center'; h.textBaseline = 'middle'; h.fillText(s, 0, 2); h.restore(); return tw; };
    const wrap = (s, maxW, size, w = 400) => { h.font = F(size, w); const out = []; let line = ''; s.split(' ').forEach(wd => { const tt = line ? line + ' ' + wd : wd; if (h.measureText(tt).width > maxW && line) { out.push(line); line = wd; } else line = tt; }); if (line) out.push(line); return out; };

    // S1: applications counter
    const cnt = t => Math.round(K.lerp(296, 301, cl(pr(t, 0.3, E(0) - 0.9))));
    const drawS1 = t => {
      const a = Math.min(fin(t, 0.15, 0.5), 1 - pr(t, S2 - 0.35, S2)); if (a <= 0) return;
      h.save(); h.globalAlpha = a;
      const y0 = 110 + (1 - fin(t, 0.15, 0.6)) * -40;
      card(170, y0, 740, 330);
      txt('APPLICATIONS SENT', 540, y0 + 66, 32, DIM, 600, 'center');
      const n = cnt(t), bump = 1 + 0.12 * Math.max(0, 1 - ((t * 4) % 1) * 3) * (t < E(0) - 0.8 ? 1 : 0);
      h.save(); h.translate(540, y0 + 175); h.scale(bump, bump); txt(String(n), 0, 0, 150, TXT, 800, 'center'); h.restore();
      // little "Easy Apply" stamps flying up
      for (let i = 0; i < 5; i++) { const t0 = 0.3 + i * (E(0) - 1.2) / 5, k = pr(t, t0, t0 + 0.9); if (k > 0 && k < 1) chip('Applied ✓', 300 + i * 120, y0 + 290 - k * 60, 22, 'rgba(61,220,151,0.18)', GRN, 1 - k, 1, 600); }
      // replies 0
      const r = pop(t, B(1) + 0.15);
      if (r > 0) chip('Replies: 0', 540, y0 + 400, 40, 'rgba(255,90,95,0.95)', '#fff', fin(t, B(1) + 0.15, 0.2), 0.6 + 0.4 * r, 700);
      h.restore();
    };
    // S2: 2,000+ applicants swarm, your card gets buried; then APPLY + MESSAGE HR
    const COLS = 16, ROWS = 11, cw = 50, ch = 60, gx = 540 - (COLS * cw) / 2, gy = 290;
    const rr = K.rng(21), cells = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push({ c, r, d: rr() * 1.6 });
    const you = { c: 7, r: 5 };
    const drawS2 = t => {
      const a = Math.min(fin(t, S2, 0.4), 1 - pr(t, B(4) - 0.4, B(4) - 0.05)); if (a <= 0) return;
      h.save(); h.globalAlpha = a;
      card(70, 130, 940, 900);
      const n = Math.round(K.lerp(1, 2000, eo(pr(t, B(2), B(2) + 2.2))));
      txt(n.toLocaleString('en-IN') + (n >= 2000 ? '+' : ''), 540, 210, 76, TXT, 800, 'center');
      txt('applicants for ONE job', 540, 270, 32, DIM, 400, 'center');
      const T0 = B(2) + 0.1;
      cells.forEach(({ c, r, d }) => {
        if (c === you.c && r === you.r) return;
        const k = eo(pr(t, T0 + d, T0 + d + 0.45)); if (k <= 0) return;
        const x = gx + c * cw, y = gy + 40 + r * ch - (1 - k) * 120;
        h.globalAlpha = a * k; h.fillStyle = 'rgba(244,239,232,0.22)'; h.beginPath(); h.roundRect(x + 6, y + 6, cw - 12, ch - 14, 6); h.fill();
        h.fillStyle = 'rgba(244,239,232,0.35)'; h.fillRect(x + 13, y + 16, cw - 30, 4); h.fillRect(x + 13, y + 26, cw - 24, 3); h.fillRect(x + 13, y + 34, cw - 28, 3);
      });
      h.globalAlpha = a;
      // your card: starts bright orange with label, fades into the crowd
      const lost = pr(t, B(2) + 1.3, B(2) + 2.4), x = gx + you.c * cw, y = gy + 40 + you.r * ch;
      const yc = `rgba(${Math.round(K.lerp(255, 120, lost))},${Math.round(K.lerp(184, 116, lost))},${Math.round(K.lerp(107, 112, lost))},${K.lerp(1, 0.4, lost)})`;
      const sc = 1 + 0.6 * (1 - lost);
      h.save(); h.translate(x + cw / 2, y + ch / 2); h.scale(sc, sc); h.fillStyle = yc; h.beginPath(); h.roundRect(-cw / 2 + 6, -ch / 2 + 6, cw - 12, ch - 14, 6); h.fill(); h.restore();
      if (lost < 1) chip('YOU', x + cw / 2, y - 30, 26, ACC, '#1a1208', 1 - lost, 1, 800);
      // the fix
      const f1 = pop(t, B(3) - 0.05), f2 = pop(t, B(3) + 1.2);
      if (f1 > 0 || f2 > 0) {
        h.fillStyle = `rgba(16,15,22,${0.75 * fin(t, B(3) - 0.1, 0.3)})`; h.beginPath(); h.roundRect(70, 130, 940, 900, 30); h.fill();
        if (f1 > 0) chip('1  APPLY ✓', 540, 520, 54, 'rgba(61,220,151,0.95)', '#0d1a12', fin(t, B(3) - 0.05, 0.2), 0.5 + 0.5 * f1, 800);
        if (f2 > 0) { txt('+', 540, 640, 70, DIM, 300, 'center', fin(t, B(3) + 1.0, 0.3)); chip('2  MESSAGE THE HR →', 540, 760, 54, ACC, '#1a1208', fin(t, B(3) + 1.2, 0.2), 0.5 + 0.5 * f2, 800); }
      }
      h.restore();
    };
    // S3: steps card + portal chips
    const portals = [['LinkedIn', 'Company + "Talent Acquisition"'], ['Naukri', '"Recruiter details" on the post'], ['Instahyre', 'recruiter name on the job'], ['Wellfound', 'founder / hiring lead']];
    const drawS3 = t => {
      const a = Math.min(fin(t, S3, 0.4), 1 - pr(t, S4 - 0.35, S4)); if (a <= 0) return;
      h.save(); h.globalAlpha = a;
      const x = 70, y = 150, w = 940;
      card(x, y, w, 900);
      const step = (i, label, t0, done) => { const k = fin(t, t0, 0.5); if (k <= 0) return; const yy = y + 100 + [0, 150, 700][i] + (1 - k) * 16;
        h.save(); h.globalAlpha *= k; h.fillStyle = done ? GRN : ACC; h.beginPath(); h.arc(x + 90, yy, 38, 0, 7); h.fill(); h.restore();
        txt(String(i + 1), x + 90, yy + 2, 42, '#14110c', 800, 'center', k);
        txt(label, x + 155, yy, 50, TXT, 600, 'left', k);
        if (done) check(x + w - 90, yy, 70, fin(t, t0 + 0.35, 0.5)); };
      step(0, 'Apply on the portal', B(5) - 0.05, true);
      step(1, 'Find who posted it', B(5) + 1.35, false);
      portals.forEach(([p, how], i) => { const t0 = B(5) + 1.9 + i * 0.45, k = fin(t, t0, 0.45); if (k <= 0) return; const yy = y + 360 + i * 118, xx = x + 130 + (1 - k) * 60;
        h.save(); h.globalAlpha *= k; h.fillStyle = 'rgba(255,255,255,0.07)'; h.beginPath(); h.roundRect(xx, yy - 48, w - 200, 100, 20); h.fill(); h.restore();
        txt(p, xx + 36, yy - 14, 44, ACC, 700, 'left', k); txt(how, xx + 36, yy + 30, 32, DIM, 400, 'left', k); });
      // "their name is right there" sweep highlight over the chips
      const hl = pr(t, B(6), B(6) + 1.2); if (hl > 0 && hl < 1) { h.save(); h.globalAlpha *= 0.25 * Math.sin(hl * Math.PI); h.fillStyle = ACC; h.fillRect(x + 130, y + 312 + hl * 460 - 40, w - 200, 80); h.restore(); }
      step(2, 'Send them 4 lines', B(6) + 1.0, false);
      h.restore();
    };
    // S4: chat window with message typing + tags; "Respected Sir" strike
    const MSG = ['Hi Priya,', 'I just applied for the Data Analyst role at ___.', 'I built a Python tool that cut report time from 2 hours to 10 minutes.', 'Would love 10 minutes to show you how I\'d help your team.', 'Resume attached. Thank you!'];
    const TAGS = [[1, 'I just applied'], [0, 'Their name'], [2, 'One proof'], [3, 'One ask']];
    const drawS4 = t => {
      const a = Math.min(fin(t, S4, 0.4), 1 - pr(t, S5 - 0.35, S5)); if (a <= 0) return;
      h.save(); h.globalAlpha = a;
      const x = 70, y = 140, w = 940, hh = 900, dy = (1 - fin(t, S4, 0.6)) * 40;
      card(x, y + dy, w, hh, 30, 'rgba(250,248,244,0.97)', null);
      // header
      h.fillStyle = '#e9e4dc'; h.beginPath(); h.roundRect(x, y + dy, w, 130, [30, 30, 0, 0]); h.fill();
      h.fillStyle = '#7b5ea7'; h.beginPath(); h.arc(x + 80, y + dy + 65, 38, 0, 7); h.fill(); txt('P', x + 80, y + dy + 67, 40, '#fff', 700, 'center');
      txt('Priya S.', x + 140, y + dy + 48, 40, '#1b1b1f', 700); txt('Talent Acquisition · hiring for Data Analyst', x + 140, y + dy + 92, 28, '#6c6a72', 400);
      h.fillStyle = GRN; h.beginPath(); h.arc(x + 108, y + dy + 92, 9, 0, 7); h.fill();
      // typed message
      const total = MSG.join(' ').length, typed = Math.floor(total * cl(pr(t, S4 + 0.4, B(7) + 1.2)));
      let used = 0, ly = y + dy + 200; const lineRows = [];
      MSG.forEach((m, i) => { const vis = m.slice(0, Math.max(0, typed - used)); used += m.length + 1; const rows = wrap(m, w - 330, 38); let shown = vis.length, rowsOut = [];
        rows.forEach(r => { const s = r.slice(0, Math.max(0, shown)); shown -= r.length + 1; rowsOut.push(s); });
        lineRows.push({ y: ly, rows: rows.length }); rowsOut.forEach((s, k) => { if (s) txt(s, x + 80, ly + k * 52, 38, '#1b1b1f', i === 0 ? 600 : 400); }); ly += rows.length * 52 + 18; });
      if (typed < total && Math.floor(t * 3) % 2) { h.fillStyle = '#1b1b1f'; h.fillRect(x + 80, ly - 20, 3, 40); }
      // tag highlights (left bar + label) synced to "I just applied. Their name. One proof. One ask."
      const seg = (E(7) - B(7)) / 4;
      TAGS.forEach(([li, label], i) => { const k = pop(t, B(7) + i * seg); if (k <= 0) return; const { y: yy, rows } = lineRows[li];
        h.save(); h.globalAlpha *= cl(k); h.fillStyle = ACC; h.fillRect(x + 50, yy - 26, 8, rows * 52); h.restore();
        chip(label, x + w - 120, yy + (rows - 1) * 26, 26, ACC, '#1a1208', cl(k), 0.6 + 0.4 * k, 800); });
      // job post + resume → message (line 8)
      const fk = fin(t, B(8) - 0.05, 0.4);
      if (fk > 0) { const yy = y + dy + hh - 80; h.save(); h.globalAlpha *= fk;
        chip('Job post', x + 190, yy, 32, '#1f6fd1', '#fff', 1, 1, 700); txt('+', x + 330, yy, 40, '#6c6a72', 400, 'center');
        chip('Resume', x + 460, yy, 32, '#1f6fd1', '#fff', 1, 1, 700); txt('→', x + 600, yy, 44, '#6c6a72', 400, 'center');
        chip('Your 4 lines', x + 770, yy, 32, ACC, '#1a1208', 1, 0.8 + 0.2 * pop(t, B(8) + 1.2), 800); h.restore(); }
      // Respected Sir card
      const rk = pop(t, B(9) - 0.05);
      if (rk > 0) {
        h.fillStyle = `rgba(16,15,22,${0.55 * cl(rk)})`; h.beginPath(); h.roundRect(x, y + dy, w, hh, 30); h.fill();
        h.save(); h.translate(540, 560); h.rotate(-0.03); h.scale(0.7 + 0.3 * rk, 0.7 + 0.3 * rk); h.globalAlpha *= cl(rk);
        card(-420, -130, 840, 260, 24, '#fff7ea', 'rgba(0,0,0,0.1)');
        txt('"Respected Sir, kindly', 0, -38, 52, '#3a3020', 500, 'center', 1, '"DejaVu Serif", serif'); txt('consider my profile"', 0, 34, 52, '#3a3020', 500, 'center', 1, '"DejaVu Serif", serif');
        const sk = eo(pr(t, B(10) - 0.05, B(10) + 0.3)); if (sk > 0) { h.strokeStyle = RED; h.lineWidth = 12; h.lineCap = 'round'; h.beginPath(); h.moveTo(-380, -40); h.lineTo(-380 + 760 * sk, -40 + 70 * sk); h.stroke(); }
        h.restore();
        const nk = pop(t, B(10) + 0.05, 0.35); if (nk > 0) { h.save(); h.translate(780, 780); h.rotate(-0.18); h.scale(1.6 - 0.6 * nk, 1.6 - 0.6 * nk); h.globalAlpha *= cl(nk * 1.5);
          h.strokeStyle = RED; h.lineWidth = 8; h.beginPath(); h.roundRect(-150, -55, 300, 110, 14); h.stroke(); txt('NEVER', 0, 4, 66, RED, 900, 'center'); h.restore(); }
      }
      h.restore();
    };
    // S5: notification banner
    const drawS5 = t => {
      const k = eb(pr(t, NOTIF, NOTIF + 0.6)), a = Math.min(cl(pr(t, NOTIF, NOTIF + 0.25)), 1 - pr(t, S6 - 0.35, S6)); if (a <= 0) return;
      h.save(); h.globalAlpha = a;
      const y = K.lerp(-220, 170, k), x = 60, w = 960;
      h.shadowColor = 'rgba(0,0,0,0.35)'; h.shadowBlur = 40; card(x, y, w, 230, 40, 'rgba(250,248,244,0.97)', null); h.shadowBlur = 0;
      h.fillStyle = '#1f6fd1'; h.beginPath(); h.roundRect(x + 40, y + 40, 76, 76, 18); h.fill();
      h.fillStyle = '#fff'; h.beginPath(); h.roundRect(x + 58, y + 60, 40, 30, 6); h.fill(); h.beginPath(); h.moveTo(x + 66, y + 88); h.lineTo(x + 62, y + 100); h.lineTo(x + 78, y + 89); h.fill();
      txt('Priya (HR)', x + 140, y + 62, 40, '#1b1b1f', 700); txt('now', x + w - 40, y + 62, 30, '#8a8790', 400, 'right');
      txt('Thanks Maddie! Found your application.', x + 140, y + 122, 36, '#2b2a30', 400); txt('Free tomorrow at 11?', x + 140, y + 172, 36, '#2b2a30', 600);
      // interview chip on Claude's line
      const ik = pop(t, B(12)); if (ik > 0) chip('INTERVIEW  ✓', 540, y + 330, 56, GRN, '#0d1a12', cl(ik), 0.5 + 0.5 * ik, 800);
      h.restore();
    };
    // S6: CTA (no handle)
    const drawS6 = t => {
      const a = fin(t, S6 + 0.1, 0.6); if (a <= 0) return;
      const k = pop(t, B(13) + 0.25, 0.6);
      h.save(); h.globalAlpha = a; card(190, 170, 700, 420, 34);
      txt('Comment', 540, 255, 46, 'rgba(255,240,225,0.85)', 300, 'center');
      h.save(); h.translate(540, 370); h.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); txt('HR', 0, 0, 150, ACC, 800, 'center'); h.restore();
      const ul = eo(pr(t, B(13) + 0.6, B(13) + 1.2)); h.fillStyle = ACC; h.fillRect(540 - 120 * ul, 452, 240 * ul, 6);
      txt('for the message prompt', 540, 515, 40, 'rgba(255,240,225,0.85)', 300, 'center');
      h.restore();
    };
    const hudDraw = t => {
      h.clearRect(0, 0, HW, HH); h.globalAlpha = 1;
      h.fillStyle = 'rgba(255,255,255,0.14)'; h.fillRect(0, 0, HW, 4); h.fillStyle = ACC; h.fillRect(0, 0, HW * cl(t / D), 4);
      drawS1(t); drawS2(t); drawS3(t); drawS4(t); drawS5(t); drawS6(t);
      const f = fade(t); if (f > 0) { h.fillStyle = `rgba(0,0,0,${f})`; h.fillRect(0, 0, HW, HH); }
      hTex.needsUpdate = true;
    };
    const curFov = t => { const p = plan.find(([a, b]) => t >= a && t < b) || plan[plan.length - 1]; const k = smooth(cl((t - p[0]) / (p[1] - p[0]))); return K.lerp(p[2][0].fov, p[2][1].fov, k); };
    const placeHud = t => { const visH = 2 * Math.tan(curFov(t) * Math.PI / 360); hud.scale.set(visH * HW / HH, visH, 1); hud.position.set(0, 0, -1); };
    const update = t => {
      acting(t); drawPhone(t); placeHud(t); hudDraw(t);
      scrM.color.setHSL(0.6, 0.35, 0.86 + 0.03 * Math.sin(t * 2));
      pend.forEach((p, i) => p.intensity = 0.6 + 0.04 * Math.sin(t * 1.3 + i));
    };
    const sfx = [];
    for (let i = 0; i < 5; i++) sfx.push(['tick', 0.3 + (i + 0.5) * (E(0) - 1.2) / 5, 0.5]);
    sfx.push(['pop', B(1) + 0.15, 0.4]);
    [S2, S3, S4, S5].forEach(s => sfx.push(['whoosh', s - 0.3, 0.22]));
    sfx.push(['pop', B(3) - 0.05, 0.4], ['pop', B(3) + 1.2, 0.4]);
    sfx.push(['ding', B(5) + 0.3, 0.18]); for (let i = 0; i < 4; i++) sfx.push(['pop', B(5) + 1.9 + i * 0.45, 0.25]);
    for (let i = 0; i < 4; i++) sfx.push(['pop', B(7) + i * (E(7) - B(7)) / 4, 0.3]);
    sfx.push(['thud', B(10) + 0.05, 0.55]);
    sfx.push(['buzz', NOTIF, 0.5], ['chime', NOTIF + 0.1, 0.3], ['ding', B(12) + 0.05, 0.25]);
    return { duration: D, update, shots, sfx, watermark: false, endCard: false, music: {}, capFont: 'Inter Display', capMarginV: 520, capSize: 54 };
  },
};
