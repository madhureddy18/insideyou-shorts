/* @maddieandchotu - introduction video */
window.SCENE = {
  setup: { bg: 0x0c4a42, fog: null, fov: 40, bloom: { strength: 0.35, radius: 0.45, threshold: 0.97 } },
  lines: [
    { who: 'maddie', text: "Hi! I'm Maddie.", say: "Hi! I'm Maddie." },
    { who: 'maddie', text: 'And I have a LOT of money questions.', say: 'And I have a lot of money questions.' },
    { who: 'chotu', text: "And I'm Chotu! I answer them... with real maths.", say: "And I'm Chotu! I answer them, with real maths.", gap: 0.3 },
    { who: 'maddie', text: 'Like... what if I double ₹1 every day?', say: 'Like... what if I double one rupee, every day?', gap: 0.3 },
    { who: 'maddie', text: 'How tall is ₹1 crore in ₹500 notes?', say: 'How tall is one crore, in five hundred rupee notes?' },
    { who: 'chotu', text: 'Or how small savings quietly grow into lakhs.', say: 'Or how small savings, quietly grow into lakhs.' },
    { who: 'chotu', text: 'One money question. Every day. Under a minute.', say: 'One money question. Every day. Under a minute.' },
    { who: 'maddie', text: 'So follow Maddie and Chotu...', say: 'So follow Maddie and Chotu...', gap: 0.35 },
    { who: 'chotu', text: '...and never look at money the same way again!', say: 'and never look at money the same way again!' },
  ],

  build(K, T) {
    const L = T.lines;
    const D = L[8].end + 2.2;
    K.gradientBg('#0a3d37', '#178a6e', 'rgba(255,214,102,0.22)');
    K.lights('studio');
    // stage: dark teal disc + gold ring + soft grid
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.25, 64), K.M(0x0d4f45, { roughness: 0.35, metalness: 0.25 }));
    stage.position.y = -0.125; stage.receiveShadow = true; K.add(stage);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.05, 8, 96), K.glow(0xffc53d, 2.2)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.01; K.add(ring);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), K.M(0x0b3a33, { roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.25; floor.receiveShadow = true; K.add(floor);
    const rays = K.sunburst({ r: 7.5, rays: 20, a: 'rgba(255,214,102,0.16)' }); rays.position.set(0, 2.2, -3.5);
    // floating background coins
    const bgCoins = []; const rr = K.rng(8);
    for (let i = 0; i < 16; i++) { const c = K.makeCoin({ r: 0.16 + rr() * 0.1 }); c.userData = { x: (rr() - 0.5) * 7, y: rr() * 6, z: -2.5 - rr() * 2, s: 0.25 + rr() * 0.3, ph: rr() * 6 }; bgCoins.push(c); }

    // ---------- characters
    const maddie = K.makePerson({ skin: 0xb5764e, hair: 0x140d09, top: 0xff7a2f, accent: 0xffffff, pants: 0x27408b, shoes: 0xffffff });
    maddie.root.position.set(-0.75, 0, 0.6); maddie.root.rotation.y = 0.12;
    const chotu = K.makeChotu();
    chotu.g.position.set(0.85, 0, 0.75); chotu.g.rotation.y = -0.18;

    // ---------- cards
    const title = K.card({ w: 3.0, h: 1.05, bg: '#ffffff' }); title.g.position.set(0, 4.3, 0.4);
    title.draw((x, W, H) => { x.fillStyle = '#ffc53d'; x.fillRect(0, 0, W, 14); K.text(x, 'MADDIE & CHOTU', W / 2, H * 0.43, { size: 64, color: '#0a3d37' }); K.text(x, 'money, explained in 3D', W / 2, H * 0.78, { size: 30, color: '#178a6e', weight: 'bold' }); }, 1);
    const tagM = K.card({ w: 1.75, h: 0.52, bg: '#ff7a2f' }); tagM.g.position.set(-0.75, 3.55, 0.9); tagM.g.userData.x0 = -0.75;
    tagM.draw((x, W, H) => { K.text(x, 'MADDIE', W / 2, H * 0.36, { size: 34, color: '#ffffff' }); K.text(x, 'asks the questions', W / 2, H * 0.74, { size: 20, color: '#ffe6d6' }); }, 1);
    const tagC = K.card({ w: 1.75, h: 0.52, bg: '#ffc53d' }); tagC.g.position.set(0.75, 2.6, 0.9); tagC.g.userData.x0 = 0.75;
    tagC.draw((x, W, H) => { K.text(x, 'CHOTU', W / 2, H * 0.36, { size: 34, color: '#3a2500' }); K.text(x, 'does the maths', W / 2, H * 0.74, { size: 20, color: '#6b4a00' }); }, 1);
    const q = []; for (let i = 0; i < 3; i++) { const c = K.card({ w: 0.42, h: 0.42, bg: '#ffffff', radius: 0.21, shadow: false }); c.draw((x, W, H) => K.text(x, '?', W / 2, H * 0.55, { size: 52, color: '#ff7a2f' }), 1); q.push(c); }
    const maths = []; ['+', '×', '%', '₹'].forEach((s, i) => { const c = K.card({ w: 0.42, h: 0.42, bg: '#ffffff', radius: 0.21, shadow: false }); c.draw((x, W, H) => K.text(x, s, W / 2, H * 0.55, { size: 44, color: '#178a6e' }), 1); maths.push(c); });
    const c1 = K.card({ w: 2.7, h: 1.35 }); c1.g.position.set(0, 3.85, 0.6); c1.g.userData.x0 = 0;
    const c2 = K.card({ w: 2.7, h: 1.35 }); c2.g.position.set(0, 3.85, 0.6); c2.g.userData.x0 = 0;
    const c3 = K.card({ w: 2.7, h: 1.35 }); c3.g.position.set(0, 3.85, 0.6); c3.g.userData.x0 = 0;
    const c4 = K.card({ w: 2.7, h: 1.0, bg: '#0a3d37' }); c4.g.position.set(0, 3.85, 0.6);
    c4.draw((x, W, H) => { K.text(x, '1 QUESTION / DAY', W / 2, H * 0.36, { size: 50, color: '#ffc53d' }); K.text(x, 'explained in under 60 seconds', W / 2, H * 0.72, { size: 26, color: '#d8fff1' }); }, 1);
    const follow = K.card({ w: 2.5, h: 0.78, bg: '#ff2f6d', radius: 0.39 }); follow.g.position.set(0, 3.65, 0.8);
    const handle = K.card({ w: 2.6, h: 0.5, bg: '#ffffff', radius: 0.25 }); handle.g.position.set(0, 4.5, 0.8);
    handle.draw((x, W, H) => K.text(x, '@maddieandchotu', W / 2, H * 0.55, { size: 40, color: '#0a3d37' }), 1);
    // mini cash stack for the "₹1 crore" teaser
    const mats = K.bundleMaterials(500);
    const stack = []; for (let i = 0; i < 14; i++) { const b = K.makeBundle({ mats }); b.position.set(0.12, 0.07 + i * 0.145, -0.6); b.rotation.y = 0.3; b.visible = false; stack.push(b); }
    const inr = n => { const s = String(Math.round(n)); if (s.length <= 3) return s; return s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3); };

    const conf1 = K.confetti({ at: [0, 3.9, 0.3], t0: 0.25, n: 90, seed: 4 });
    const confEnd = K.confetti({ at: [0, 3.65, 0.8], t0: L[8].t + 0.15, n: 160, seed: 9 });

    const mKeys = [
      [0, { pose: 'wave', face: 'happy' }], [L[1].t, { pose: 'think', face: 'worried' }], [L[2].t, { pose: 'idle', look: [0.6, 0], face: 'happy' }],
      [L[3].t, { pose: 'talk', look: [0.3, -0.25] }], [L[4].t, { pose: 'talk', face: 'shock', look: [0.25, -0.3] }], [L[5].t, { pose: 'idle', look: [0.55, 0] }],
      [L[7].t, { pose: 'point', face: 'happy' }], [L[8].t, { pose: 'celebrate' }],
    ];
    const cKeys = [
      [0, { face: 'open' }], [L[2].t, { wave: 1, face: 'open' }], [L[2].t + 1.2, { face: 'happy' }], [L[3].t, { face: 'open', turn: -0.3 }],
      [L[5].t, { point: 1, face: 'open' }], [L[6].t, { face: 'happy' }], [L[7].t, { face: 'open' }], [L[8].t, { hopLoop: 1, armsUp: 1, face: 'happy' }],
    ];
    const chotuIn = L[2].t - 0.5;

    const update = t => {
      rays.rotation.z = t * 0.12;
      bgCoins.forEach(c => { const u = c.userData; c.position.set(u.x + Math.sin(t * 0.5 + u.ph) * 0.2, ((u.y + t * u.s) % 6.5) - 0.3, u.z); c.rotation.set(Math.PI / 2 + Math.sin(t + u.ph) * 0.4, 0, t * 1.5 + u.ph); });
      // title + confetti
      title.show(t, 0.15, L[1].t + 0.6);
      title.g.rotation.z = Math.sin(t * 2) * 0.02;
      conf1.update(t); confEnd.update(t);
      // Maddie pops in
      const mi = K.easeBack(K.prog(t, 0.2, 0.65)); maddie.root.scale.setScalar(Math.max(0.001, mi));
      maddie.pose(t, Object.assign({ talking: K.speaking('maddie', t) }, K.track(t, mKeys)));
      tagM.show(t, L[0].t + 0.35, L[1].end, 'left');
      q.forEach((c, i) => { const k = c.show(t, L[1].t + 0.2 + i * 0.25, L[1].end + 0.1); c.g.position.set(-0.15 + i * 0.4, 2.55 + i * 0.22 + Math.sin(t * 3 + i) * 0.06, 1.0); c.g.rotation.z = Math.sin(t * 2 + i) * 0.15; });
      // Chotu jumps in from the right with a squash on landing
      const ja = K.prog(t, chotuIn, chotuIn + 0.55);
      chotu.g.position.set(K.lerp(3.2, 0.85, ja), ja < 1 ? Math.sin(ja * Math.PI) * 1.6 : 0, 0.75);
      chotu.g.visible = t >= chotuIn;
      const land = K.pulse(t, chotuIn + 0.55, 0.3);
      chotu.pose(t, Object.assign({ talking: K.speaking('chotu', t), squash: land }, K.track(t, cKeys)));
      tagC.show(t, L[2].t + 0.4, L[2].end + 0.2, 'right');
      maths.forEach((c, i) => { c.show(t, L[2].t + 1.0 + i * 0.18, L[2].end + 0.3); const a = t * 1.2 + i * Math.PI / 2; c.g.position.set(0.85 + Math.cos(a) * 0.95, 1.0 + Math.sin(a) * 0.5 + 0.35, 1.0); });
      // teaser 1: ₹1 doubling ticker
      const d1 = K.prog(t, L[3].t + 0.5, L[3].end + 0.2), day = 1 + Math.floor(d1 * 29);
      c1.show(t, L[3].t, L[4].t, 'scale');
      if (c1.g.visible) c1.draw((x, W, H) => { x.fillStyle = '#ff7a2f'; x.fillRect(0, 0, W, 12); K.text(x, '₹1 × 2 every day', W / 2, H * 0.24, { size: 40, color: '#5b6577' }); K.text(x, '₹' + inr(Math.pow(2, day - 1)), W / 2, H * 0.56, { size: day >= 30 ? 76 : 70, color: day >= 30 ? '#178a6e' : '#0a3d37' }); K.text(x, 'DAY ' + day, W / 2, H * 0.85, { size: 30, color: '#ff7a2f' }); }, day);
      // teaser 2: ₹1 crore in ₹500 notes
      c2.show(t, L[4].t, L[5].t, 'right');
      if (c2.g.visible) c2.draw((x, W, H) => { x.fillStyle = '#ffc53d'; x.fillRect(0, 0, W, 12); K.text(x, '₹1 CRORE', W / 2, H * 0.3, { size: 66, color: '#0a3d37' }); K.text(x, 'in ₹500 notes = how tall?', W / 2, H * 0.68, { size: 34, color: '#5b6577' }); }, 1);
      const sk = K.prog(t, L[4].t + 0.3, L[4].end);
      stack.forEach((b, i) => { b.visible = t >= L[4].t && t < L[5].t + 0.2 && i < Math.floor(sk * stack.length); });
      // teaser 3: savings bar chart growing
      c3.show(t, L[5].t, L[6].t, 'right');
      if (c3.g.visible) { const gk = K.easeOut(K.prog(t, L[5].t + 0.3, L[5].end)); const key = Math.round(gk * 40);
        c3.draw((x, W, H) => { x.fillStyle = '#3ddc97'; x.fillRect(0, 0, W, 12); K.text(x, 'small savings → lakhs', W / 2, H * 0.17, { size: 34, color: '#5b6577' });
          const n = 8; for (let i = 0; i < n; i++) { const h = (H * 0.6) * Math.pow(1.38, i) / Math.pow(1.38, n - 1) * Math.min(1, gk * n / (i + 1)); x.fillStyle = i === n - 1 ? '#178a6e' : '#8fdcbf'; K.rrect(x, 40 + i * ((W - 80) / n), H * 0.9 - h, (W - 80) / n - 14, h, 8); x.fill(); }
        }, key); }
      c4.show(t, L[6].t, L[7].t);
      // follow button + tap
      const tap = L[8].t + 0.05, tapped = t >= tap;
      follow.show(t, L[7].t + 0.1);
      handle.show(t, L[7].t + 0.25);
      if (follow.g.visible) { follow.draw((x, W, H) => { if (tapped) { x.fillStyle = '#2bbf7b'; x.fillRect(0, 0, W, H); } K.text(x, tapped ? 'FOLLOWING ✓' : 'FOLLOW', W / 2, H * 0.55, { size: 58, color: '#ffffff' }); }, tapped ? 2 : 1);
        follow.g.scale.multiplyScalar(1 - K.pulse(t, tap - 0.08, 0.22) * 0.12); }
    };

    const wide = { pos: [0, 2.5, 9.8], look: [0, 2.3, 0] };
    const shots = [
      { t: [0, L[1].t], from: { pos: [0, 2.7, 10.6], look: [0, 2.4, 0] }, to: { pos: [-0.15, 2.5, 9.4], look: [-0.15, 2.35, 0] } },
      { t: [L[1].t, chotuIn], from: { pos: [-0.5, 2.3, 7.9], look: [-0.45, 2.35, 0.6] }, to: { pos: [-0.45, 2.35, 7.4], look: [-0.45, 2.4, 0.6] } },
      { t: [chotuIn, L[3].t], from: { pos: [0.55, 1.8, 7.4], look: [0.75, 1.65, 0.6] }, to: { pos: [0.65, 1.75, 6.8], look: [0.8, 1.65, 0.6] } },
      { t: [L[3].t, L[6].t], from: wide, to: { pos: [0, 2.45, 9.2], look: [0, 2.3, 0] } },
      { t: [L[6].t, L[7].t], from: { pos: [0.3, 2.4, 9.0], look: [0.1, 2.45, 0] }, to: { pos: [0.2, 2.4, 8.5], look: [0.05, 2.5, 0] } },
      { t: [L[7].t, D + 1], from: { pos: [0, 2.7, 10.4], look: [0, 2.5, 0] }, to: { pos: [0, 2.6, 9.6], look: [0, 2.45, 0] }, shake: t => (t > L[8].t ? 0.05 * Math.exp(-(t - L[8].t) * 4) : 0) },
    ];
    const sfx = [['pop', 0.15, 0.7], ['kaching', 0.25, 0.5], ['pop', 0.3, 0.6], ['whoosh', L[0].t + 0.3, 0.5],
      ['pop', L[1].t + 0.2, 0.5], ['pop', L[1].t + 0.45, 0.5], ['pop', L[1].t + 0.7, 0.5],
      ['whoosh', chotuIn, 0.6], ['boing', chotuIn + 0.5, 0.8], ['whoosh', L[2].t + 0.4, 0.5],
      ['pop', L[3].t, 0.6], ['ding', L[3].end + 0.15, 0.5], ['whoosh', L[4].t, 0.6], ['whoosh', L[5].t, 0.6], ['pop', L[6].t, 0.6],
      ['pop', L[7].t + 0.1, 0.7], ['tick', L[8].t + 0.05, 1.0], ['kaching', L[8].t + 0.1, 0.7], ['rustle', L[8].t + 0.15, 0.4]];
    for (let k = 0; k < 12; k++) sfx.push(['tick', L[3].t + 0.5 + k * ((L[3].end - L[3].t - 0.3) / 12), 0.35]);
    return { duration: D, update, shots, sfx, watermark: '@maddieandchotu', endCard: false, music: {} };
  },
};
