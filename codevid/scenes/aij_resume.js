/* @ai.jugaadd — EP 1 "300 applications on Naukri. Zero calls."
   Maddie (toy 3D) at his desk at night; Claude (orange robot) stands on the desk and fixes his resume approach.
   CTA: comment RESUME for the prompt. */
window.SCENE = {
  setup: { width: 1080, height: 1920, bg: 0x0d1020, fog: null, fov: 34, bloom: { strength: 0.3, radius: 0.5, threshold: 0.92 } },
  lines: [
    { who: 'maddie', text: 'Claude, 300 applications on Naukri. Zero calls.', say: 'Claude, three hundred applications on Naukri. Zero calls.' },
    { who: 'claude', text: 'Because you sent the same resume 300 times.', say: 'Because you sent the same resume three hundred times.' },
    { who: 'maddie', text: "But it's a good resume!", say: "But it's a good resume!" },
    { who: 'claude', text: 'A software reads it before any human does.', say: 'A software reads it before any human does.' },
    { who: 'claude', text: 'It looks for words from the job post. Yours has none.', say: 'It looks for words from the job post. Yours has none.' },
    { who: 'maddie', text: 'So what do I do?', say: 'So what do I do?' },
    { who: 'claude', text: "Paste the job post and your resume. Ask me what's missing.", say: "Paste the job post and your resume. Ask me what's missing." },
    { who: 'claude', text: 'Then I rewrite your points with real numbers.', say: 'Then I rewrite your points with real numbers.' },
    { who: 'claude', text: '"Worked on Python" becomes "Built a Python script that cut report time from 2 hours to 10 minutes."', say: 'Worked on Python becomes: built a Python script that cut report time from two hours to ten minutes.' },
    { who: 'maddie', text: "Wait… that's actually what I did!", say: "Wait. That's actually what I did!" },
    { who: 'claude', text: 'Exactly. Only true things. Never fake skills.', say: 'Exactly. Only true things. Never fake skills.' },
    { who: 'maddie', text: 'One resume for every job?', say: 'One resume for every job?' },
    { who: 'claude', text: 'Two minutes each. 20 good ones beat 300 copies.', say: 'Two minutes each. Twenty good ones beat three hundred copies.' },
    { who: 'claude', text: "Follow, and comment RESUME. I'll send you the exact prompt.", say: "Follow, and comment resume. I'll send you the exact prompt." },
  ].map(l => ({ gap: 0.45, ...l })),

  build(K, T) {
    const L = T.lines, B = i => L[i].t, E = i => L[i].end, N = L.length, D = E(N - 1) + 2.6;
    const cl = K.clamp, eo = K.easeOut, pr = K.prog;
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
    const lh = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.1, 20, 1, true), SM(0xffffff, 0.4, { emissive: 0xffd9a0, emissiveIntensity: 0.6, side: THREE.DoubleSide })); lh.position.set(0.66, DY + 0.38, -0.6); lh.rotation.z = 0.7; S.add(lh);

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
    let mYaw = 0, rYaw = 0, last = -1; const sm = (a, b, k) => a + (b - a) * k;
    const acting = t => {
      const mT = K.voice('maddie', t), rT = K.voice('claude', t);
      const k = last < 0 ? 1 : cl((t - last) * 3); last = t;
      const onScreen = (t >= B(6) && t < B(9));
      mYaw = sm(mYaw, onScreen ? 0 : speaking('claude', t) || t > B(1) ? 0.55 : 0.4, k);
      rYaw = sm(rYaw, speaking('claude', t) && !(t >= B(N - 1)) ? -0.55 : t >= B(N - 1) ? 0.75 : -0.6, k);
      const face = (t >= B(0) && t < E(0)) ? 'worried' : (t >= B(2) && t < E(2)) ? 'neutral' : (t >= B(4) + 1.2 && t < B(6)) ? 'shock' : (t >= B(9) && t < E(9) + 0.3) ? 'shock'
        : (t >= B(11) && t < E(11)) ? 'neutral' : (t >= B(12)) ? 'smile' : speaking('maddie', t) ? 'neutral' : (t > E(9) + 0.3 && t < B(11)) ? 'smile' : 'neutral';
      M.update(t, { talk: mT, face, look: [mYaw, onScreen ? 0.12 : -0.02], type: (t < B(0) - 0.05 || (t >= B(6) && t < B(9) && !speaking('maddie', t))) ? 1 : 0, lean: (t >= B(2) && t < E(2)) ? -0.3 : 0 });
      R.update(t, { talk: rT, look: [rYaw, 0.05], mood: (t >= B(2) && t < E(2) + 0.2) ? 'shock' : (t >= B(12)) ? 'smile' : 'calm' });
      R.body.position.y += (t >= B(N - 1) + 0.2 && t < B(N - 1) + 1.0) ? Math.abs(Math.sin((t - B(N - 1)) * 8)) * 0.04 : 0;   // little hop on CTA
    };

    // ================= LAPTOP SCREEN (chat UI) =================
    const SF = (s, w = 700) => `${w} ${s}px "Inter", "DejaVu Sans"`;
    const srr = (X, Y, w, h, r) => { sx.beginPath(); sx.moveTo(X + r, Y); sx.arcTo(X + w, Y, X + w, Y + h, r); sx.arcTo(X + w, Y + h, X, Y + h, r); sx.arcTo(X, Y + h, X, Y, r); sx.arcTo(X, Y, X + w, Y, r); sx.closePath(); };
    const drawScreen = t => {
      sx.fillStyle = '#f7f3ee'; sx.fillRect(0, 0, SW, SH);
      sx.fillStyle = '#ece5dc'; sx.fillRect(0, 0, SW, 46); sx.fillStyle = '#d97757'; sx.beginPath(); sx.arc(30, 23, 10, 0, 7); sx.fill(); sx.fillStyle = '#333'; sx.font = SF(20, 800); sx.textAlign = 'left'; sx.textBaseline = 'middle'; sx.fillText('AI chat', 50, 24);
      if (t < B(6)) { sx.fillStyle = '#4a5a8a'; sx.font = SF(22, 800); sx.fillText('Naukri · Applied (300)', 30, 90);
        for (let i = 0; i < 6; i++) { srr(30, 120 + i * 62, 740, 50, 10); sx.fillStyle = '#fff'; sx.fill(); sx.fillStyle = '#333'; sx.font = SF(18, 600); sx.fillText(['Data Analyst · TCS', 'Python Dev · Infosys', 'Analyst · Deloitte', 'Jr Data Eng · Wipro', 'BI Analyst · Accenture', 'SDE-1 · Startup'][i], 46, 145 + i * 62); sx.fillStyle = '#c0392b'; sx.textAlign = 'right'; sx.fillText('No response', 754, 145 + i * 62); sx.textAlign = 'left'; }
      } else {
        const p1 = pr(t, B(6) + 0.3, B(6) + 1.2), p2 = pr(t, B(6) + 2.2, B(6) + 3.0), p3 = pr(t, B(8) - 0.3, B(8) + 0.6);
        if (p1 > 0) { srr(300, 70, 470, 110, 16); sx.fillStyle = '#e8ddd0'; sx.fill(); sx.fillStyle = '#222'; sx.font = SF(19, 600); sx.fillText('📄 job_post.txt   📄 my_resume.pdf', 320, 105); sx.fillText("What's missing for this job?", 320, 145); }
        if (p2 > 0) { srr(30, 200, 520, 150, 16); sx.fillStyle = '#fff'; sx.fill(); sx.fillStyle = '#222'; sx.font = SF(19, 700); sx.fillText('Missing keywords:', 50, 235);
          ['SQL', 'Power BI', 'Dashboards', 'Excel'].forEach((w, i) => { const a = cl((p2 * 4) - i); if (a <= 0) return; sx.globalAlpha = a; srr(50 + i * 122, 260, 112, 40, 20); sx.fillStyle = '#ffe0dc'; sx.fill(); sx.fillStyle = '#c0392b'; sx.font = SF(17, 800); sx.fillText(w, 62 + i * 122, 281); sx.globalAlpha = 1; });
          sx.fillStyle = '#666'; sx.font = SF(16, 600); sx.fillText('Add these only if you really used them.', 50, 328); }
        if (p3 > 0) { srr(30, 370, 740, 120, 16); sx.fillStyle = '#fff'; sx.fill(); sx.fillStyle = '#999'; sx.font = SF(17, 600); sx.fillText('Before: Worked on Python', 50, 405); sx.fillStyle = '#1e8f5a'; sx.font = SF(18, 800); sx.fillText('After: Built a Python script that cut report', 50, 440); sx.fillText('time from 2 hours to 10 minutes', 50, 468); }
      }
      scrTex.needsUpdate = true;
    };

    // ================= CAMERA =================
    const P = (pos, look, fov) => ({ pos, look, fov });
    const WIDE = [P([0.05, 1.5, 1.95], [0.0, 1.05, -0.6], 40), P([0.05, 1.46, 1.75], [0.0, 1.05, -0.6], 40)];
    const TWO = [P([0.15, 1.5, 1.3], [0.05, 1.12, -0.7], 38), P([0.14, 1.48, 1.18], [0.05, 1.12, -0.7], 38)];
    const MAD = [P([-0.02, 1.46, 0.95], [-0.2, 1.3, -0.94], 34), P([-0.03, 1.45, 0.82], [-0.2, 1.3, -0.94], 34)];
    const ROB = [P([-0.1, 1.16, 0.62], [0.3, 0.98, -0.42], 32), P([-0.08, 1.15, 0.52], [0.3, 0.98, -0.42], 32)];
    const SCR = [P([0.38, 1.3, -1.02], [-0.2, 0.89, -0.36], 32), P([0.34, 1.26, -0.95], [-0.2, 0.89, -0.36], 32)];
    const OTS = [P([-0.95, 1.32, -0.1], [-0.2, 1.28, -0.94], 34), P([-0.9, 1.31, -0.16], [-0.2, 1.28, -0.94], 34)];
    const GFX = [P([0.05, 1.3, 1.7], [0.0, 1.15, -0.6], 42), P([0.05, 1.3, 1.55], [0.0, 1.15, -0.6], 42)];
    const plan = [
      [0, B(0) + 1.4, WIDE], [B(0) + 1.4, B(1) - 0.05, MAD],
      [B(1) - 0.05, B(2) - 0.05, ROB], [B(2) - 0.05, B(3) - 0.05, MAD], [B(3) - 0.05, B(5) - 0.05, GFX],
      [B(5) - 0.05, B(6) - 0.05, MAD], [B(6) - 0.05, B(7) - 0.05, SCR], [B(7) - 0.05, B(9) - 0.05, GFX],
      [B(9) - 0.05, B(10) - 0.05, MAD], [B(10) - 0.05, B(11) - 0.05, ROB], [B(11) - 0.05, B(12) - 0.05, TWO],
      [B(12) - 0.05, B(13) - 0.05, GFX], [B(13) - 0.05, D + 5, TWO],
    ];
    const shots = plan.map(([a, b, s]) => ({ t: [a, b], from: s[0], to: s[1], fov: s[0].fov, ease: k => k }));
    const shakeAt = [[B(0) + 1.4, 0.3, 0.012], [B(4) + 1.2, 0.4, 0.02], [B(9), 0.4, 0.015]];
    shots.forEach(s => { s.shake = t => { let a = 0; shakeAt.forEach(([s0, d, amp]) => { if (t >= s0 && t < s0 + d) a += amp * (1 - (t - s0) / d); }); return a; }; });

    // ================= MOTION GRAPHICS (full screen HUD) =================
    S.add(K.cam);
    const HW = 1080, HH = 1920, hc = document.createElement('canvas'); hc.width = HW; hc.height = HH; const h = hc.getContext('2d');
    const hTex = new THREE.CanvasTexture(hc); hTex.colorSpace = THREE.SRGBColorSpace;
    const hud = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: hTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    hud.renderOrder = 1000; K.cam.add(hud);
    const C = { orange: '#ff7a3d', gold: '#ffc53d', teal: '#2ec4b6', red: '#ff4d5e', green: '#33d17a', ink: '#0b1026', white: '#ffffff' };
    const HF = (s, w = 900) => `${w} ${s}px "Inter Display", "Inter", "DejaVu Sans"`;
    const backE = k => { k = cl(k); const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
    const ht = (str, X, Y, size, color = '#fff', { w = 900, align = 'center', stroke = 0, sc = C.ink, alpha = 1, rot = 0 } = {}) => { h.save(); h.globalAlpha *= alpha; h.translate(X, Y); h.rotate(rot); h.font = HF(size, w); h.textAlign = align; h.textBaseline = 'middle';
      if (stroke) { h.lineJoin = 'round'; h.lineWidth = stroke; h.strokeStyle = sc; h.strokeText(str, 0, 0); } h.fillStyle = color; h.fillText(str, 0, 0); h.restore(); };
    const hsc = (cx, cy, k, fn) => { if (k <= 0.001) return; h.save(); h.translate(cx, cy); h.scale(k, k); h.translate(-cx, -cy); fn(); h.restore(); };
    const hrr = (X, Y, w, hh, r) => { h.beginPath(); h.moveTo(X + r, Y); h.arcTo(X + w, Y, X + w, Y + hh, r); h.arcTo(X + w, Y + hh, X, Y + hh, r); h.arcTo(X, Y + hh, X, Y, r); h.arcTo(X, Y, X + w, Y, r); h.closePath(); };
    const hchip = (str, cx, cy, bg, fg = C.ink, size = 46, rot = 0) => { h.save(); h.translate(cx, cy); h.rotate(rot); h.font = HF(size); const w = h.measureText(str).width + 64; hrr(-w / 2, -size * 0.9, w, size * 1.8, size * 0.9); h.fillStyle = bg; h.fill(); h.textAlign = 'center'; h.textBaseline = 'middle'; h.fillStyle = fg; h.fillText(str, 0, 3); h.restore(); };
    const popH = (t, t0, d = 0.32) => backE(pr(t, t0, t0 + d));
    const winH = (t, a, b, f = 0.15) => cl(Math.min(pr(t, a, a + f), 1 - pr(t, b - f, b)));
    const panel = (X, Y, w, hh, fill = 'rgba(11,16,38,0.86)', stroke = C.orange) => { hrr(X, Y, w, hh, 36); h.fillStyle = fill; h.fill(); if (stroke) { h.lineWidth = 5; h.strokeStyle = stroke; h.stroke(); } };
    const doc = (X, Y, w, hh, rot, lines = 6, tint = '#ffffff') => { h.save(); h.translate(X, Y); h.rotate(rot); hrr(-w / 2, -hh / 2, w, hh, 18); h.fillStyle = tint; h.fill(); h.lineWidth = 3; h.strokeStyle = 'rgba(0,0,0,0.15)'; h.stroke();
      h.fillStyle = '#d9dde8'; h.beginPath(); h.arc(-w / 2 + 50, -hh / 2 + 55, 26, 0, 7); h.fill(); h.fillStyle = '#9aa3c7'; h.fillRect(-w / 2 + 90, -hh / 2 + 38, w * 0.45, 14); h.fillStyle = '#c5cbe0'; h.fillRect(-w / 2 + 90, -hh / 2 + 62, w * 0.3, 10);
      for (let i = 0; i < lines; i++) { h.fillStyle = '#e1e5ef'; h.fillRect(-w / 2 + 30, -hh / 2 + 110 + i * 30, (w - 60) * (0.6 + 0.4 * ((i * 37) % 10) / 10), 12); } h.restore(); };
    const sparks = (cx, cy, t0, t, color = C.gold) => { const u = t - t0; if (u < 0 || u > 0.6) return; h.save(); h.strokeStyle = color; h.lineCap = 'round'; h.lineWidth = 8; h.globalAlpha = 1 - u / 0.6;
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r0 = 60 + u * 260, r1 = r0 + 50; h.beginPath(); h.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); h.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); h.stroke(); } h.restore(); };
    const fmt = n => String(Math.round(n));
    const hudDraw = t => {
      h.clearRect(0, 0, HW, HH);
      h.fillStyle = 'rgba(255,255,255,0.18)'; h.fillRect(0, 0, HW, 10); h.fillStyle = C.orange; h.fillRect(0, 0, HW * cl(t / D), 10);
      // series tag
      { const a = winH(t, 0.0, E(1)); if (a > 0) hsc(HW / 2, 120, popH(t, 0.05) * a, () => hchip('AI JUGAAD · EP 1', HW / 2, 120, C.orange, '#fff', 38)); }
      // HOOK: 300 applications → 0 calls
      { const a = winH(t, 0.05, B(1) + 0.2); if (a > 0) { h.save(); h.globalAlpha = a;
        hsc(HW / 2, 330, popH(t, 0.15), () => { panel(110, 220, 860, 230);
          const n = 300 * eo(pr(t, 0.3, 1.8)); ht(fmt(n), 330, 320, 120, C.gold); ht('APPLICATIONS', 330, 400, 36, '#fff', { w: 800 });
          ht('→', 560, 330, 90, '#fff'); });
        if (t > 1.9) hsc(780, 330, popH(t, 1.9, 0.25), () => { ht('0', 780, 320, 140, C.red, { stroke: 10 }); ht('CALLS', 780, 400, 36, C.red, { w: 900 }); });
        h.restore(); sparks(780, 330, 1.9, t, C.red); } }
      // same resume ×300 — copies fanning out
      { const a = winH(t, B(1), B(2) + 0.1); if (a > 0) { h.save(); h.globalAlpha = a; const k = eo(pr(t, B(1) + 0.1, B(1) + 1.2));
        for (let i = 7; i >= 0; i--) doc(HW / 2 + (i - 3.5) * 70 * k, 420 + Math.abs(i - 3.5) * 14 * k, 300, 380, (i - 3.5) * 0.09 * k, 6);
        hsc(HW / 2, 680, popH(t, B(1) + 1.0), () => hchip('SAME RESUME ×300', HW / 2, 680, C.red, '#fff', 52, -0.04)); h.restore(); } }
      // ATS scanner: robot reads first, job keywords vs resume
      { const a = winH(t, B(3), B(5) + 0.1); if (a > 0) { h.save(); h.globalAlpha = a;
        hsc(HW / 2, 160, popH(t, B(3)), () => hchip('🤖 ATS SOFTWARE READS FIRST', HW / 2, 160, C.teal, C.ink, 40));
        hsc(HW / 2, 560, popH(t, B(3) + 0.15), () => { doc(HW / 2, 560, 420, 540, 0, 10);
          const sy = 330 + ((t - B(3)) * 420) % 460; h.fillStyle = 'rgba(46,196,182,0.35)'; h.fillRect(HW / 2 - 230, sy - 18, 460, 36); h.fillStyle = C.teal; h.fillRect(HW / 2 - 230, sy - 3, 460, 6); });
        if (t > B(4)) { const words = ['SQL', 'POWER BI', 'EXCEL', 'DASHBOARDS'];
          words.forEach((w, i) => { const t0 = B(4) + 0.25 + i * 0.28; if (t < t0) return; const left = i % 2 === 0, cx = left ? 190 : 890, cy = 400 + i * 140;
            hsc(cx, cy, popH(t, t0), () => { hchip(w, cx, cy, '#fff', C.ink, 34, left ? -0.05 : 0.05); }); if (t > B(4) + 1.6) hsc(cx + (left ? 150 : -150), cy - 30, popH(t, B(4) + 1.6 + i * 0.08), () => ht('✗', cx + (left ? 150 : -150), cy - 30, 70, C.red, { stroke: 8, sc: '#fff' })); });
          if (t > B(4) + 1.9) hsc(HW / 2, 900, popH(t, B(4) + 1.9), () => hchip('MATCH: LOW ❌', HW / 2, 900, C.red, '#fff', 54, -0.03)); }
        h.restore(); } }
      // "So what do I do?"
      { const a = winH(t, B(5), B(6)); if (a > 0) [[250, 360, -0.3], [540, 280, 0.1], [830, 380, 0.3]].forEach(([qx, qy, r], i) => hsc(qx, qy, popH(t, B(5) + i * 0.1) * a, () => ht('?', qx, qy + Math.sin(t * 5 + i) * 12, 180, i % 2 ? C.gold : '#fff', { stroke: 14, rot: r }))); }
      // step 1 label on the screen shot
      { const a = winH(t, B(6), B(7)); if (a > 0) hsc(HW / 2, 200, popH(t, B(6) + 0.1) * a, () => hchip('STEP 1: JOB POST + RESUME → "WHAT\'S MISSING?"', HW / 2, 200, C.gold, C.ink, 32)); }
      // step 2: before → after
      { const a = winH(t, B(7), B(9) + 0.1); if (a > 0) { h.save(); h.globalAlpha = a;
        hsc(HW / 2, 160, popH(t, B(7)), () => hchip('STEP 2: REWRITE WITH REAL NUMBERS', HW / 2, 160, C.gold, C.ink, 36));
        hsc(HW / 2, 360, popH(t, B(8) - 0.1), () => { panel(90, 270, 900, 180, 'rgba(255,255,255,0.95)', null); ht('BEFORE', 140, 310, 30, '#999', { align: 'left' }); ht('"Worked on Python"', HW / 2, 385, 56, '#777', { w: 800 });
          const s = eo(pr(t, B(8) + 1.0, B(8) + 1.5)); if (s > 0) { h.strokeStyle = C.red; h.lineWidth = 9; h.lineCap = 'round'; h.beginPath(); h.moveTo(250, 385); h.lineTo(250 + 580 * s, 385); h.stroke(); } });
        if (t > B(8) + 1.3) hsc(HW / 2, 640, popH(t, B(8) + 1.3), () => { panel(70, 500, 940, 280, 'rgba(20,60,40,0.95)', C.green); ht('AFTER ✓', 120, 545, 32, C.green, { align: 'left' });
          ht('"Built a Python script that cut', HW / 2, 625, 50, '#fff', { w: 800 }); ht('report time from 2 hrs to 10 min"', HW / 2, 695, 50, '#fff', { w: 800 }); });
        if (t > B(8) + 1.3) { const u = eo(pr(t, B(8) + 1.6, B(8) + 2.6)); hsc(HW / 2, 880, popH(t, B(8) + 1.6), () => { ht('2 hrs', 330, 880, 70, C.red, { stroke: 8 }); ht('→', HW / 2, 880, 70, '#fff', { stroke: 8 }); ht(fmt(K.lerp(120, 10, u)) + ' min', 760, 880, 70, C.green, { stroke: 8 }); }); }
        h.restore(); sparks(HW / 2, 640, B(8) + 1.3, t, C.green); } }
      // "that's actually what I did" / never fake
      { const a = winH(t, B(9), E(9) + 0.2); if (a > 0) hsc(HW / 2, 360, popH(t, B(9)) * a, () => ht('WAIT… THAT\'S ME?!', HW / 2, 360, 96, C.gold, { stroke: 14, rot: -0.05 })); }
      { const a = winH(t, B(10), B(11)); if (a > 0) { hsc(HW / 2, 300, popH(t, B(10) + 0.1) * a, () => hchip('✓ ONLY TRUE THINGS', HW / 2, 300, C.green, C.ink, 54, -0.03));
        if (t > B(10) + 1.2) hsc(HW / 2, 440, popH(t, B(10) + 1.2) * a, () => hchip('✗ NO FAKE SKILLS', HW / 2, 440, C.red, '#fff', 54, 0.03)); } }
      // 300 copies vs 20 tailored
      { const a = winH(t, B(11), B(13) + 0.1); if (a > 0) { h.save(); h.globalAlpha = a;
        if (t < B(12)) hsc(HW / 2, 300, popH(t, B(11) + 0.1), () => hchip('1 JOB = 1 RESUME?', HW / 2, 300, '#fff', C.ink, 64, -0.04));
        else {
          hsc(HW / 2, 160, popH(t, B(12)), () => hchip('⏱ 2 MINUTES EACH', HW / 2, 160, C.teal, C.ink, 44));
          hsc(290, 520, popH(t, B(12) + 0.6), () => { panel(80, 300, 420, 440, 'rgba(60,20,30,0.9)', C.red); ht('300', 290, 440, 130, C.red); ht('COPIES', 290, 540, 44, '#fff'); ht('0 calls', 290, 640, 40, '#ffb3bb', { w: 700 });
            const s = eo(pr(t, B(12) + 2.0, B(12) + 2.4)); if (s > 0) { h.strokeStyle = C.red; h.lineWidth = 14; h.lineCap = 'round'; h.beginPath(); h.moveTo(110, 330); h.lineTo(110 + 360 * s, 330 + 380 * s); h.stroke(); } });
          hsc(790, 520, popH(t, B(12) + 1.2), () => { panel(580, 300, 420, 440, 'rgba(20,60,40,0.92)', C.green); ht('20', 790, 440, 130, C.green); ht('TAILORED', 790, 540, 44, '#fff');
            const u = eo(pr(t, B(12) + 1.5, B(12) + 2.6)); hrr(640, 610, 300, 34, 17); h.fillStyle = 'rgba(255,255,255,0.2)'; h.fill(); hrr(640, 610, 300 * (0.2 + 0.7 * u), 34, 17); h.fillStyle = C.green; h.fill(); ht('MATCH ↑', 790, 690, 36, C.green); });
          if (t > B(12) + 1.0) hsc(HW / 2, 520, popH(t, B(12) + 1.0), () => ht('VS', HW / 2, 520, 64, '#fff', { stroke: 10 }));
          sparks(790, 520, B(12) + 1.2, t, C.green);
        }
        h.restore(); } }
      // CTA: comment RESUME + follow
      { const a = winH(t, B(13), D + 1); if (a > 0) { h.save(); h.globalAlpha = a;
        hsc(HW / 2, 1130, popH(t, B(13) + 0.1), () => { panel(90, 1000, 900, 270, 'rgba(11,16,38,0.9)', C.orange); ht('COMMENT', HW / 2, 1070, 52, '#fff', { w: 800 });
          ht('"RESUME"', HW / 2, 1170, 120, C.gold, { stroke: 10 }); });
        hsc(HW / 2, 1340, popH(t, B(13) + 0.6), () => ht('& get the exact prompt 📩', HW / 2, 1340, 50, '#fff', { stroke: 10, w: 800 }));
        const fy = 1460 + Math.sin(t * 6) * 8; hsc(HW / 2, fy, popH(t, B(13) + 1.0), () => hchip('+ FOLLOW @ai.jugaadd', HW / 2, fy, C.orange, '#fff', 50));
        h.restore(); } }
      hTex.needsUpdate = true;
    };
    const curFov = t => { const p = plan.find(([a, b]) => t >= a && t < b) || plan[plan.length - 1]; return p[2][0].fov; };
    const placeHud = t => { const visH = 2 * Math.tan(curFov(t) * Math.PI / 360); hud.scale.set(visH * HW / HH, visH, 1); hud.position.set(0, 0, -1); };
    const update = t => { acting(t); drawScreen(t); placeHud(t); hudDraw(t); bulbs.forEach((b, i) => b.scale.setScalar(1 + 0.15 * Math.sin(t * 3 + i))); scrL.intensity = 0.18 + 0.03 * Math.sin(t * 7); };
    const sfx = [
      ['whoosh', 0.05, 0.4], ['pop', 0.15, 0.5], ['riser', 0.3, 0.3], ['thud', 1.9, 0.8], ['bass', 1.9, 0.6],
      ['whoosh', B(1), 0.5], ['pop', B(1) + 1.0, 0.5], ['pop', B(3), 0.5], ['ding', B(4) + 0.25, 0.3], ['ding', B(4) + 0.53, 0.3], ['ding', B(4) + 0.81, 0.3], ['ding', B(4) + 1.09, 0.3],
      ['thud', B(4) + 1.6, 0.6], ['bass', B(4) + 1.9, 0.6], ['pop', B(5), 0.5], ['whoosh', B(6) - 0.05, 0.5], ['pop', B(6) + 0.3, 0.4], ['ding', B(6) + 2.2, 0.4],
      ['whoosh', B(7), 0.5], ['pop', B(8) - 0.1, 0.4], ['whoosh', B(8) + 1.0, 0.4], ['kaching', B(8) + 1.3, 0.6], ['pop', B(9), 0.5], ['ding', B(10) + 0.1, 0.5], ['thud', B(10) + 1.2, 0.5],
      ['pop', B(11) + 0.1, 0.5], ['whoosh', B(12), 0.5], ['pop', B(12) + 0.6, 0.4], ['kaching', B(12) + 1.2, 0.6], ['thud', B(12) + 2.0, 0.5], ['whoosh', B(13), 0.5], ['ding', B(13) + 0.1, 0.6], ['pop', B(13) + 1.0, 0.5],
    ];
    return { duration: D, update, shots, sfx, watermark: '@ai.jugaadd', endCard: 'FOLLOW @ai.jugaadd', music: {}, capFont: 'Inter Display', capMarginV: 150, capSize: 54 };
  },
};
