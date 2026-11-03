/* @ai.jugaadd "Tell me about yourself" — calm, aesthetic. Night room, warm lamp, lo-fi, slow drifts, soft fades.
   Maddie bold & confident (even when wrong). Claude cold: flat, slow, few words; no glow, only head tilt / nod.
   CTA: comment INTRO for the prompt. */
window.SCENE = {
  setup: { width: 1080, height: 1920, bg: 0x0d1020, fog: null, fov: 34, bloom: { strength: 0.25, radius: 0.5, threshold: 0.93 } },
  lines: [
    { who: 'maddie', text: "Tell me about yourself? Easy. I've got this.", say: "Tell me about yourself? Easy. I've got this." },
    { who: 'maddie', text: 'So… my name is Maddie. I was born in Hyderabad.', say: 'So... my name is Maddie. I was born in Hyderabad.', gap: 0.8 },
    { who: 'maddie', text: 'My father is a businessman, my mother is a homemaker.', say: 'My father is a businessman, my mother is a homemaker.', gap: 0.3 },
    { who: 'maddie', text: "My hobbies are cricket and… sleeping. And my strength is, I'm a hard worker.", say: "My hobbies are cricket, and... sleeping. And my strength is, I'm a hard worker.", gap: 0.3 },
    { who: 'claude', text: 'That was your biodata. Not you.', say: 'That was your biodata. Not you.', gap: 1.0 },
    { who: 'maddie', text: 'Bro, everyone says it like this.', say: 'Bro, everyone says it like this.' },
    { who: 'claude', text: "That's why everyone gets rejected.", say: "That's why everyone gets rejected." },
    { who: 'claude', text: 'Three parts. Sixty seconds.', say: 'Three parts. Sixty seconds.', gap: 0.8 },
    { who: 'claude', text: 'Now. Who you are today.', say: 'Now. Who you are today.' },
    { who: 'claude', text: 'Proof. One thing you built. With a number.', say: 'Proof. One thing you built. With a number.' },
    { who: 'claude', text: 'Next. Why this role.', say: 'Next. Why this role.' },
    { who: 'claude', text: "Paste your resume and the job post. I'll write it for you.", say: "Paste your resume and the job post. I'll write it for you." },
    { who: 'maddie', text: "I'm a computer science fresher who builds data tools.", say: "I'm a computer science fresher who builds data tools.", gap: 0.8 },
    { who: 'maddie', text: 'In my final year, I built an app that cut report time from 2 hours to 10 minutes.', say: 'In my final year, I built an app that cut report time from two hours to ten minutes.' },
    { who: 'maddie', text: "I want to do that at scale. That's why this role.", say: "I want to do that at scale. That's why this role." },
    { who: 'claude', text: '…Hired.', say: 'Hired.', gap: 1.0 },
    { who: 'claude', text: "Comment INTRO. I'll send you the prompt.", say: "Comment intro. I'll send you the prompt.", gap: 0.8 },
  ].map(l => ({ gap: 0.35, ...l, speed: l.who === 'claude' ? 0.95 : 1.08 })),

  build(K, T) {
    const L = T.lines, B = i => L[i].t, E = i => L[i].end, N = L.length, D = E(N - 1) + 2.6;
    const cl = K.clamp, eo = K.easeOut, pr = K.prog, ease = K.ease;
    const S = K.scene, SM = (c, r = 0.7, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: 0 }, o));
    const RB = window.RoundedBoxGeometry;
    const rbox = (w, h, d, m, x, y, z, rad = 0.02, parent = S) => { const o = new THREE.Mesh(new RB(w, h, d, 3, Math.min(rad, w / 2, h / 2, d / 2)), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; };
    // ================= ROOM (night bedroom, Hyderabad lights outside) =================
    const wallM = SM(0x2b3550, 0.95), floorM = SM(0x4a3527, 0.85);
    rbox(8, 0.1, 6, floorM, 0, -0.05, 0, 0.01).castShadow = false;
    rbox(8, 4, 0.1, wallM, 0, 2, -1.45, 0.01);
    rbox(0.1, 4, 6, wallM, -2.2, 2, 0, 0.01); rbox(0.1, 4, 6, wallM, 2.2, 2, 0, 0.01);
    const sky = K.canvasTex(1024, 768, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b0f2a'); g.addColorStop(0.7, '#2a2260'); g.addColorStop(1, '#5b3a78'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const r = K.rng(9); for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.5})`; x.fillRect(r() * w, r() * h * 0.45, 2, 2); }
      x.fillStyle = '#f6f1d0'; x.beginPath(); x.arc(780, 150, 46, 0, 7); x.fill();
      for (let layer = 0; layer < 2; layer++) for (let bx = -20; bx < w; bx += 26 + r() * 46) {
        const bw = 40 + r() * 70, bh = (layer ? 200 : 120) + r() * (layer ? 280 : 160), top = h - bh;
        x.fillStyle = layer ? '#10122a' : '#231f48'; x.fillRect(bx, top, bw, bh);
        if (layer) for (let wy = top + 12; wy < h - 10; wy += 18) for (let wx = bx + 8; wx < bx + bw - 8; wx += 14) if (r() < 0.4) { x.fillStyle = r() < 0.8 ? '#ffd27a' : '#9fd8ff'; x.fillRect(wx, wy, 7, 9); }
      }
    });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })); win.position.set(-0.85, 1.75, -1.39); S.add(win);
    const frM = SM(0xe8dcc6, 0.6);
    rbox(1.62, 0.07, 0.08, frM, -0.85, 2.32, -1.37); rbox(1.62, 0.09, 0.12, frM, -0.85, 1.18, -1.35); rbox(0.07, 1.2, 0.08, frM, -1.64, 1.75, -1.37); rbox(0.07, 1.2, 0.08, frM, -0.06, 1.75, -1.37); rbox(0.04, 1.1, 0.05, frM, -0.85, 1.75, -1.37);
    // pinboard with sticky notes + a "SHIP IT" poster
    const board = K.canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = '#b98a5a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#6e4e30'; x.lineWidth = 18; x.strokeRect(0, 0, w, h);
      const note = (X, Y, c, s, r) => { x.save(); x.translate(X, Y); x.rotate(r); x.fillStyle = c; x.fillRect(-70, -70, 140, 140); x.fillStyle = '#2b2b2b'; x.font = '900 30px "Inter Display", sans-serif'; x.textAlign = 'center'; s.split('\n').forEach((l, i) => x.fillText(l, 0, -10 + i * 36)); x.restore(); };
      note(140, 140, '#ffd34d', 'DSA\n50/150', -0.08); note(370, 130, '#7fe0c8', 'APPLY\n10/day', 0.06); note(150, 370, '#ff9eb0', 'SLEEP?', 0.05); note(370, 370, '#a8c8ff', 'SQL\nPRACTICE', -0.05);
    });
    const pb = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), SM(0xffffff, 0.9, { map: board })); pb.position.set(0.75, 1.8, -1.39); S.add(pb);
    // shelf + plant + books
    rbox(0.9, 0.04, 0.22, SM(0xe8dcc6, 0.6), 0.75, 1.3, -1.3);
    [[0.42, 0x3b6ea8], [0.47, 0xd9663a], [0.52, 0x2e9c87], [0.57, 0xf0b544]].forEach(([bx, c], i) => rbox(0.045, 0.2 - i * 0.015, 0.16, SM(c, 0.7), bx, 1.42 - i * 0.008, -1.3, 0.01));
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 20), SM(0xc96a3f, 0.6)); pot.position.set(1.05, 1.38, -1.3); S.add(pot);
    for (let i = 0; i < 6; i++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), SM(i % 2 ? 0x3f8f4e : 0x2f7a42, 0.8)); lf.position.set(1.05 + Math.sin(i * 2.1) * 0.05, 1.5 + (i % 3) * 0.04, -1.3 + Math.cos(i * 2.1) * 0.04); lf.scale.set(0.7, 1.4, 0.6); lf.rotation.z = Math.sin(i * 2.1) * 0.5; S.add(lf); }
    // string lights along the top of the wall
    const bulbs = []; for (let i = 0; i < 18; i++) { const bx = -1.9 + i * 0.22, by = 2.62 - Math.sin((i / 17) * Math.PI) * 0.12;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffd27a : 0xffb06a, toneMapped: false })); b.position.set(bx, by, -1.37); S.add(b); bulbs.push(b); }

    // desk (front panel hides legs), chair
    const deskM = SM(0xd8b98e, 0.55), deskD = SM(0xb8976c, 0.6);
    const DY = 0.74;
    rbox(1.9, 0.05, 0.8, deskM, 0, DY - 0.025, -0.45, 0.02);
    rbox(1.86, 0.62, 0.04, deskD, 0, DY - 0.36, -0.07, 0.015);
    rbox(0.04, 0.7, 0.76, deskD, -0.92, DY - 0.37, -0.45, 0.015); rbox(0.04, 0.7, 0.76, deskD, 0.92, DY - 0.37, -0.45, 0.015);
    const chairM = SM(0x30323d, 0.6);
    rbox(0.5, 0.07, 0.46, chairM, -0.2, 0.53, -0.95, 0.03); rbox(0.5, 0.62, 0.07, chairM, -0.2, 0.92, -1.2, 0.04);
    // laptop: base on the desk, screen faces Maddie (back of the lid faces camera)
    const lap = new THREE.Group(); lap.position.set(-0.2, DY, -0.5); S.add(lap);
    const alu = SM(0x9aa0aa, 0.35, { metalness: 0.5 });
    rbox(0.5, 0.025, 0.34, alu, 0, 0.012, 0, 0.01, lap);
    const lid = new THREE.Group(); lid.position.set(0, 0.025, 0.16); lid.rotation.x = 0.28; lap.add(lid);
    rbox(0.44, 0.27, 0.018, alu, 0, 0.135, 0, 0.01, lid);
    const stk = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), SM(0xe0663a, 0.5)); stk.position.set(0.09, 0.16, 0.011); lid.add(stk);
    const stk2 = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), SM(0x2ec4b6, 0.5)); stk2.position.set(-0.1, 0.09, 0.011); stk2.rotation.z = 0.2; lid.add(stk2);
    // screen (faces Maddie, -z): chat UI
    const SW = 800, SH = 520, sc2 = document.createElement('canvas'); sc2.width = SW; sc2.height = SH; const sx = sc2.getContext('2d');
    const scrTex = new THREE.CanvasTexture(sc2); scrTex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.245), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })); scr.rotation.y = Math.PI; scr.position.set(0, 0.135, -0.0095); lid.add(scr);
    const scrL = new THREE.PointLight(0x9fc4ff, 0.18, 1.2, 1.8); scrL.position.set(-0.2, DY + 0.2, -0.62); S.add(scrL);
    // mug + phone + notebook
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 18), SM(0xf2ece0, 0.5)); mug.position.set(-0.68, DY + 0.045, -0.4); mug.castShadow = true; S.add(mug);
    rbox(0.08, 0.008, 0.16, SM(0x1a1a1f, 0.3), -0.55, DY + 0.004, -0.2, 0.004);
    rbox(0.22, 0.02, 0.28, SM(0x3b6ea8, 0.7), 0.62, DY + 0.01, -0.62, 0.008);
    // desk lamp
    const lampM = SM(0xffffff, 0.4);
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 20), lampM); lb.position.set(0.75, DY + 0.01, -0.68); S.add(lb);
    const la = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 8), lampM); la.position.set(0.72, DY + 0.18, -0.66); la.rotation.z = 0.25; S.add(la);
    const lh = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.1, 20, 1, true), SM(0xffffff, 0.4, { emissive: 0xffd9a0, emissiveIntensity: 0.06, side: THREE.DoubleSide })); lh.position.set(0.66, DY + 0.38, -0.6); lh.rotation.z = 0.7; S.add(lh);

    // ================= CHARACTERS =================
    const M = K.makeToyMaddie({ seatY: 0.56 }); M.g.position.set(-0.2, 0, -0.95); S.add(M.g);
    const R = K.makeRobo({ height: 0.42 }); R.g.position.set(0.32, DY, -0.42); R.g.rotation.y = -0.75; S.add(R.g);

    // ================= LIGHT =================
    S.add(new THREE.HemisphereLight(0x9fb0ff, 0x3a2a20, 0.75));
    const key = new THREE.DirectionalLight(0xffe2c0, 1.6); key.position.set(1.2, 2.8, 2.2); key.target.position.set(0, 0.9, -0.6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; S.add(key); S.add(key.target);
    const front = new THREE.DirectionalLight(0xfff0e0, 0.9); front.position.set(-0.3, 1.4, 3); front.target.position.set(0, 1, -0.8); S.add(front); S.add(front.target);
    const lampL = new THREE.PointLight(0xffc27a, 2.2, 2.5, 1.6); lampL.position.set(0.62, DY + 0.32, -0.55); S.add(lampL);
    const rim = new THREE.DirectionalLight(0x8fa8ff, 1.0); rim.position.set(-1.5, 2.5, -2.5); S.add(rim);
    const warm = new THREE.PointLight(0xffb070, 1.6, 4, 1.6); warm.position.set(0, 2.5, -1.1); S.add(warm);

    // ================= ACTING =================
    const speaking = (who, t) => L.some(l => l.who === who && t >= l.t && t < l.end - 0.03);
    const S5 = B(12) - 0.6, S6 = B(16) - 0.5;
    let mYaw = 0.1, rYaw = -0.2, last = -1; const sm = (a, b, k) => a + (b - a) * k;
    const acting = t => {
      const mT = K.voice('maddie', t), rT = K.voice('claude', t) * 0.6;
      const k = last < 0 ? 1 : cl((t - last) * 1.6); last = t;                    // slow, smooth turns
      const practising = t < E(3) + 0.3 || (t >= S5 && t < E(14) + 0.2);       // talking to his laptop camera
      mYaw = sm(mYaw, practising ? 0.05 : 0.5, k);
      // Claude: still, facing forward; slowly turns to Maddie after the biodata answer, stays on him while talking
      const towardM = t > E(3) + 0.2 && t < S6;
      rYaw = sm(rYaw, towardM ? -0.62 : -0.2, k * 0.55);
      const face = (t >= B(5) && t < E(6) + 0.6) ? 'worried' : (t >= B(7) && t < B(12)) ? 'neutral' : (t >= B(15) - 0.3 && t < S6 + 0.5) ? 'smile' : speaking('maddie', t) ? 'neutral' : (t < E(3)) ? 'smile' : 'neutral';
      const lean = t < E(4) ? 0.35 : (t >= E(6) && t < B(7) + 1.5) ? 0.55 : (t >= S5 && t < S6) ? -0.08 : 0.15;   // chest out → sigh, lean back → sit straight
      M.update(t, { talk: mT * 0.9, face, look: [mYaw, practising ? 0.06 : -0.02], type: 0, lean });
      R.update(t, { talk: rT, look: [rYaw, 0.04], mood: 'calm', glow: false });
      // tilt on "Not you", slow nod on "Hired"
      R.head.rotation.z += 0.12 * K.pulse(t, B(4) - 0.4, 2.2);
      const nod = K.pulse(t, B(15) - 1.0, 0.9); R.head.rotation.x += 0.16 * nod;
    };

    // ================= LAPTOP SCREEN (camera practice) =================
    const drawScreen = t => {
      const g = sx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#2b2a33'); g.addColorStop(1, '#17161c'); sx.fillStyle = g; sx.fillRect(0, 0, SW, SH);
      sx.fillStyle = '#3a3640'; sx.beginPath(); sx.arc(SW / 2, SH * 0.48, 90, 0, 7); sx.fill(); sx.beginPath(); sx.ellipse(SW / 2, SH * 0.98, 210, 150, 0, 0, 7); sx.fill();
      sx.fillStyle = (Math.floor(t * 1.5) % 2) ? '#e5484d' : '#7a2a2c'; sx.beginPath(); sx.arc(40, 40, 11, 0, 7); sx.fill();
      sx.fillStyle = '#ddd'; sx.font = '600 22px "Inter", sans-serif'; sx.textAlign = 'left'; sx.textBaseline = 'middle'; sx.fillText('REC  ·  interview practice', 62, 41);
      const s = Math.floor(t), mm = String(Math.floor(s / 60)).padStart(2, '0'), ss = String(s % 60).padStart(2, '0'); sx.textAlign = 'right'; sx.fillText(mm + ':' + ss, SW - 30, 41);
      scrTex.needsUpdate = true;
    };

    // ================= CAMERA (slow drifts) =================
    const P = (pos, look, fov) => ({ pos, look, fov });
    const WIDE = [P([0.1, 1.48, 1.95], [0.0, 1.05, -0.6], 40), P([-0.02, 1.46, 1.8], [0.0, 1.05, -0.6], 40)];
    const PUSH = [P([-0.02, 1.42, 1.45], [-0.2, 1.24, -0.94], 36), P([-0.04, 1.45, 0.85], [-0.2, 1.29, -0.94], 34)];
    const TURN = [P([0.25, 1.33, 1.15], [0.05, 1.1, -0.7], 38), P([0.2, 1.31, 1.03], [0.05, 1.1, -0.7], 38)];
    const MAD = [P([-0.04, 1.45, 0.88], [-0.2, 1.29, -0.94], 34), P([-0.05, 1.45, 0.82], [-0.2, 1.29, -0.94], 34)];
    const ROB = [P([-0.12, 1.15, 0.6], [0.3, 0.98, -0.42], 32), P([-0.1, 1.14, 0.55], [0.3, 0.98, -0.42], 32)];
    const BACK = [P([0.15, 1.5, 1.4], [0.0, 1.12, -0.7], 38), P([0.1, 1.5, 1.32], [0.0, 1.12, -0.7], 38)];
    const CARD = [P([-0.4, 1.2, 0.62], [0.3, 1.16, -0.42], 38), P([-0.36, 1.2, 0.55], [0.3, 1.16, -0.42], 38)];
    const NOD = [P([-0.1, 1.15, 0.5], [0.3, 0.98, -0.42], 30), P([-0.09, 1.14, 0.44], [0.3, 0.98, -0.42], 30)];
    const OUT = [P([0.05, 1.42, 1.2], [0.0, 1.05, -0.6], 38), P([0.12, 1.55, 2.3], [0.0, 1.08, -0.6], 42)];
    const plan = [
      [0, B(1) - 0.3, WIDE], [B(1) - 0.3, E(3) + 0.35, PUSH], [E(3) + 0.35, B(5) - 0.1, TURN],
      [B(5) - 0.1, B(6) - 0.1, MAD], [B(6) - 0.1, E(6) + 0.15, ROB], [E(6) + 0.15, B(7) - 0.2, BACK],
      [B(7) - 0.2, S5, CARD], [S5, B(15) - 1.2, MAD], [B(15) - 1.2, S6, NOD], [S6, D + 5, OUT],
    ];
    const smooth = k => k * k * (3 - 2 * k);
    const shots = plan.map(([a, b, s]) => ({ t: [a, b], from: s[0], to: s[1], fov: s[0].fov, ease: smooth }));
    const fadeAt = [0, B(7) - 0.2, S5, S6];           // soft fade-through-black on scene changes
    const fade = t => { let a = 0; fadeAt.forEach(c => { const d = Math.abs(t - c); if (d < 0.32) a = Math.max(a, 1 - d / 0.32); }); return t < 0.4 ? Math.max(a, 1 - t / 0.4) : a; };

    // warmer lamp in Scene 5
    const warmth = t => eo(pr(t, S5, S5 + 1.2)) * (1 - pr(t, D - 1, D));

    // ================= HUD (minimal) =================
    S.add(K.cam);
    const HW = 1080, HH = 1920, hc = document.createElement('canvas'); hc.width = HW; hc.height = HH; const h = hc.getContext('2d');
    const hTex = new THREE.CanvasTexture(hc); hTex.colorSpace = THREE.SRGBColorSpace;
    const hud = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    hud.renderOrder = 1000; K.cam.add(hud);
    const thin = (s, w = 300) => `${w} ${s}px "Inter", "DejaVu Sans"`;
    const txt = (s, x, y, size, col, w = 300, align = 'left', a = 1) => { h.save(); h.globalAlpha = a; h.font = thin(size, w); h.fillStyle = col; h.textAlign = align; h.textBaseline = 'middle'; h.fillText(s, x, y); h.restore(); };
    const fin = (t, t0, d = 0.6) => eo(pr(t, t0, t0 + d));
    const hudDraw = t => {
      h.clearRect(0, 0, HW, HH);
      h.fillStyle = 'rgba(255,255,255,0.12)'; h.fillRect(0, 0, HW, 4); h.fillStyle = 'rgba(255,214,170,0.7)'; h.fillRect(0, 0, HW * cl(t / D), 4);
      // the 3-part card (beside Claude, left/top area)
      const ca = Math.min(fin(t, B(7) + 0.1, 0.8), 1 - pr(t, S5 - 0.5, S5));
      if (ca > 0) {
        h.save(); h.globalAlpha = ca;
        const x = 70, y = 170, w = 940, hh = 700;
        h.fillStyle = 'rgba(14,13,20,0.9)'; h.beginPath(); h.roundRect(x, y, w, hh, 28); h.fill();
        h.strokeStyle = 'rgba(255,220,180,0.35)'; h.lineWidth = 1.5; h.stroke();
        txt('60-second answer', x + 54, y + 78, 40, 'rgba(255,230,200,0.75)', 300);
        h.fillStyle = 'rgba(255,230,200,0.25)'; h.fillRect(x + 54, y + 128, w - 108, 2);
        [['NOW', 'Who you are today', 8], ['PROOF', 'One thing you built. With a number.', 9], ['NEXT', 'Why this role', 10]].forEach(([a, b, li], i) => {
          const k = fin(t, B(li) - 0.1, 0.7); if (k <= 0) return; const yy = y + 210 + i * 165 + (1 - k) * 14;
          txt('→ ' + a, x + 54, yy, 58, '#ffd6a8', 400, 'left', k);
          const words = b.split(' '); let line = '', ly = yy + 62; h.font = thin(42, 300);
          words.forEach(wd => { const tt = (line + ' ' + wd).trim(); if (h.measureText(tt).width > w - 140) { txt(line, x + 100, ly, 42, '#f2ece4', 300, 'left', k); line = wd; ly += 48; } else line = tt; });
          txt(line, x + 100, ly, 42, '#f2ece4', 300, 'left', k);
        });
        h.restore();
      }
      // end text
      const ea = fin(t, B(16) + 0.2, 0.9);
      if (ea > 0) {
        h.save(); h.globalAlpha = ea; h.fillStyle = 'rgba(14,13,20,0.82)'; h.beginPath(); h.roundRect(190, 150, 700, 420, 30); h.fill(); h.restore();
        txt('Comment', HW / 2, 230, 44, 'rgba(255,240,225,0.85)', 300, 'center', ea);
        txt('INTRO', HW / 2, 330, 110, '#ffd6a8', 600, 'center', ea);
        txt('for the prompt', HW / 2, 430, 40, 'rgba(255,240,225,0.85)', 300, 'center', ea);
        txt('@ai.jugaadd', HW / 2, 510, 36, 'rgba(255,240,225,0.7)', 400, 'center', fin(t, B(16) + 1.2, 0.9));
      }
      const f = fade(t); if (f > 0) { h.fillStyle = `rgba(0,0,0,${f})`; h.fillRect(0, 0, HW, HH); }
      hTex.needsUpdate = true;
    };
    const curFov = t => { const p = plan.find(([a, b]) => t >= a && t < b) || plan[plan.length - 1]; const k = smooth(cl((t - p[0]) / (p[1] - p[0]))); return K.lerp(p[2][0].fov, p[2][1].fov, k); };
    const placeHud = t => { const visH = 2 * Math.tan(curFov(t) * Math.PI / 360); hud.scale.set(visH * HW / HH, visH, 1); hud.position.set(0, 0, -1); };
    const update = t => {
      acting(t); drawScreen(t); placeHud(t); hudDraw(t);
      const w = warmth(t); lampL.intensity = 2.2 + 1.4 * w; lampL.color.setHSL(0.09 - 0.02 * w, 1, 0.66 - 0.06 * w); warm.intensity = 1.6 + 0.9 * w; scrL.intensity = 0.18;
      bulbs.forEach((b, i) => b.scale.setScalar(1 + 0.08 * Math.sin(t * 1.5 + i)));
    };
    const sfx = [['chime', B(15) + 0.05, 0.12]];
    return { duration: D, update, shots, sfx, watermark: '@ai.jugaadd', endCard: false, music: {}, capFont: 'Inter Display', capMarginV: 330, capSize: 54 };
  },
};
