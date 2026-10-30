/* Video #1 - "₹1 doubled every day for 30 days"
 * Maths (day n holds 2^(n-1) rupees): day 10 = ₹512, day 21 = ₹10,48,576, day 30 = ₹53,68,70,912.
 */
window.SCENE = {
  lines: [
    { who: 'raju', text: 'Bloc! Would you take ₹10 lakh right now...', say: 'Bloc! Would you take ten lakh rupees right now...' },
    { who: 'raju', text: '...or ₹1 that doubles every day for 30 days?', say: 'or one rupee, that doubles every day, for thirty days?' },
    { who: 'bloc', text: "Easy. I'd take the one rupee.", say: "Easy. I'd take the one rupee." },
    { who: 'raju', text: 'One rupee?! Are you crazy?', say: 'One rupee?! Are you crazy?' },
    { who: 'bloc', text: 'Watch. Day 1: ₹1. Day 2: ₹2. Day 3: ₹4.', say: 'Watch. Day one, one rupee. Day two, two. Day three, four.' },
    { who: 'raju', text: 'Day 10... ₹512. Told you!', say: 'Day ten... five hundred and twelve rupees. Told you!' },
    { who: 'bloc', text: 'Day 21: ₹10,48,576.', say: 'Day twenty one. Ten lakh, forty eight thousand.' },
    { who: 'raju', text: 'Wait... it already beat ₹10 lakh?', say: 'Wait... it already beat ten lakh?' },
    { who: 'bloc', text: 'And on day 30...', say: 'And on day thirty...', gap: 0.5 },
    { who: 'bloc', text: '₹53 crore.', say: 'fifty three crore rupees.', gap: 1.1 },
    { who: 'raju', text: 'FIFTY-THREE CRORE?!', say: 'Fifty three CRORE?!', gap: 0.35 },
    { who: 'bloc', text: "Real money grows slower, but compounding works the same way. Start early.", say: 'Real money grows slower. But compounding works the same way. Start early.', gap: 0.9 },
  ],

  build(K, T) {
    const L = T.lines, S = K.scene;
    K.lights('studio');
    K.sets.studio();

    // ---------- characters
    const raju = K.makePerson({ top: 0x2f6fe4, accent: 0xf2b630 });
    raju.root.position.set(-0.95, 0, 0.8); raju.root.rotation.y = 0.2;
    const bloc = K.makeBloc();
    bloc.g.position.set(1.0, 0, 0.8); bloc.g.rotation.y = -0.22;

    // ---------- the two offers on pedestals
    const pedMat = K.M(0x1d2466, { metalness: 0.4, roughness: 0.35 });
    const lakhPed = K.add(K.box(2.1, 2.5, 1.4, pedMat)); lakhPed.position.set(-1.9, 1.25, -4.2);
    const lakh = K.group(); lakh.position.set(-1.9, 2.5, -4.2);
    const bmats = K.bundleMaterials(500);
    for (let i = 0; i < 20; i++) { const b = K.makeBundle({ mats: bmats }); lakh.add(b); b.position.set(((i % 5) - 2) * 0.36, 0.07 + Math.floor(i / 5) * 0.145, 0); b.rotation.y = Math.PI / 2 + (i * 0.37 % 0.12); }
    const lakhSign = K.makeSign({ w: 2.0, h: 0.75 }); lakhSign.g.position.set(-1.9, 4.05, -4.2); lakhSign.set('₹10 LAKH', 'right now');
    const coinPed = K.add(K.box(2.1, 2.5, 1.4, pedMat)); coinPed.position.set(1.9, 1.25, -4.2);
    const offerCoin = K.makeCoin({ r: 0.32 }); offerCoin.rotation.x = Math.PI / 2;
    const coinSign = K.makeSign({ w: 2.0, h: 0.75 }); coinSign.g.position.set(1.9, 4.05, -4.2); coinSign.set('₹1', 'x2 every day');
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 8, 48), K.glow(0xffc24a, 3)); K.add(halo);

    // ---------- the doubling: coin pile (days 1-7), then a tower of ₹500 bundles
    const pileCoins = [], rnd = K.rng(11);
    for (let i = 0; i < 64; i++) {
      const c = K.makeCoin({ r: 0.2 });
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.6;
      c.userData = { x: Math.cos(a) * r, z: -1.5 + Math.sin(a) * r * 0.6, y: 0.03 + Math.floor(i / 16) * 0.05, rx: (rnd() - 0.5) * 0.3 };
      pileCoins.push(c);
    }
    const tower = K.makeCashTower({ cols: 3, rows: 3, maxLayers: 1000 });
    tower.mesh.position.set(0, 0, -2.7);
    // money rain when Raju falls
    const noteMat = new THREE.MeshStandardMaterial({ map: K.noteTex(500), side: THREE.DoubleSide, roughness: 0.8 });
    const noteGeo = new THREE.PlaneGeometry(0.5, 0.25);
    const r2 = K.rng(23), rainT = L[10].t + 0.2;
    const rain = K.particles({ n: 150, gravity: 2.4, floorY: 0.02, make: () => { const m = new THREE.Mesh(noteGeo, noteMat); m.castShadow = true; return m; },
      spawn: () => ({ pos: [-0.9 + (r2() - 0.5) * 5, 7 + r2() * 5, 0 + (r2() - 0.5) * 4], vel: [(r2() - 0.5) * 0.8, -1.5 - r2(), (r2() - 0.5) * 0.6], t0: rainT + r2() * 2.4, life: 7, spin: [r2() * 5, r2() * 4, r2() * 6] }) });

    // ---------- story clock: which day are we on? (float)
    const l4 = L[4], l5 = L[5], l6 = L[6], l8 = L[8], l9 = L[9];
    const dayF = t => {
      if (t < l4.t + 0.55) return 0;
      if (t < l5.t) return K.key(t, [[l4.t + 0.55, 1], [l4.t + (l4.end - l4.t) * 0.48, 2], [l4.t + (l4.end - l4.t) * 0.78, 3], [l5.t, 3]], x => x > 0.92 ? 1 : 0);
      if (t < l6.t) return K.key(t, [[l5.t, 3], [l5.t + (l5.end - l5.t) * 0.45, 10]], K.easeOut);
      if (t < l8.t) return K.key(t, [[l6.t, 10], [l6.t + (l6.end - l6.t) * 0.55, 21]], K.easeOut);
      if (t < l9.t) return K.key(t, [[l8.t, 21], [l9.t - 0.05, 29]], x => x);
      return K.key(t, [[l9.t, 29], [l9.t + 0.25, 30]], K.easeOut);
    };
    const day = t => Math.floor(dayF(t) + 1e-6);
    const inr = n => { const s = String(Math.round(n)); if (s.length <= 3) return s; const last3 = s.slice(-3), rest = s.slice(0, -3); return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3; };
    const towerH = d => d < 7.5 ? 0 : 0.045 * Math.pow(1.3, d) * K.clamp((d - 7.5) / 0.6);

    // ---------- poses (each holds until the next key)
    const rajuKeys = [
      [0, { pose: 'talk', look: [-0.45, 0] }], [L[1].t, { pose: 'talk', look: [0.55, 0] }],
      [L[2].t, { pose: 'idle', look: [0.65, 0.05], face: 'neutral' }],
      [L[3].t, { pose: 'shock', look: [0.6, 0] }], [L[3].t + (L[3].end - L[3].t) * 0.55, { pose: 'facepalm' }],
      [l4.t, { pose: 'idle', look: [0.45, 0.1], face: 'worried' }],
      [l5.t, { pose: 'smug', look: [0.5, 0] }], [l5.end - 0.4, { pose: 'point', face: 'smug', look: [0.5, 0] }],
      [l6.t, { pose: 'idle', look: [0.4, -0.25], face: 'worried' }],
      [L[7].t, { pose: 'shock', look: [0.35, -0.45] }],
      [l8.t, { pose: 'idle', face: 'worried', look: [0.6, 0] }],
      [l9.t, { pose: 'shock', look: [0.25, -0.7], lean: -0.15 }],
      [L[10].t + 0.35, { pose: 'fall', flail: 1, look: [0, -0.4] }], [L[10].t + 1.4, { pose: 'sit', face: 'shock', look: [0, -0.3] }],
      [L[11].t + 1.2, { pose: 'sit', face: 'happy', look: [0.5, 0] }],
    ];
    const blocKeys = [
      [0, { pose: 'idle', face: 'dots' }], [L[2].t, { pose: 'talk', face: 'happy', point: 1 }], [L[2].end, { pose: 'idle', face: 'dots' }],
      [l4.t, { pose: 'talk', face: 'happy' }], [l5.t, { pose: 'idle', face: 'dots' }], [l6.t, { pose: 'talk', face: 'happy' }],
      [L[7].t, { pose: 'idle', face: 'dots' }], [l8.t, { pose: 'talk', face: 'dots', lean: 0.1 }], [l9.t, { pose: 'talk', face: 'happy', armsUp: 1 }],
      [L[10].t, { pose: 'celebrate', face: 'happy' }], [L[11].t, { pose: 'talk', face: 'happy' }], [L[11].end, { pose: 'wave', face: 'happy' }],
    ];

    const update = t => {
      // offers slide away once the counting starts
      const away = K.easeIn(K.prog(t, l4.t - 0.2, l4.t + 0.6));
      lakhPed.position.x = -1.9 - away * 6; lakh.position.x = lakhPed.position.x; lakhSign.g.position.x = lakhPed.position.x;
      coinPed.position.x = 1.9 + away * 6; coinSign.g.position.x = coinPed.position.x;
      offerCoin.position.set(coinPed.position.x, 3.05 + Math.sin(t * 2) * 0.08, -4.2); offerCoin.rotation.z = t * 1.6;
      halo.position.copy(offerCoin.position); halo.rotation.x = Math.PI / 2 + Math.sin(t) * 0.2; halo.scale.setScalar(1 + Math.sin(t * 3) * 0.05);
      halo.visible = away < 0.99;
      // coins, tower, day sign
      const d = dayF(t), n = day(t);
      const coins = n >= 1 && d < 8 ? Math.min(64, Math.pow(2, n - 1)) : 0;
      pileCoins.forEach((c, i) => {
        c.visible = i < coins;
        if (!c.visible) return;
        const u = c.userData, born = i === 0 ? 0 : Math.floor(Math.log2(i)) + 1;   // which day this coin arrived
        c.position.set(u.x, u.y + Math.max(0, 0.6 - (d - born) * 3), u.z); c.rotation.set(u.rx, i, 0);
      });
      tower.setHeight(towerH(d));
      // characters
      raju.pose(t, Object.assign({ talking: K.speaking('raju', t) }, K.track(t, rajuKeys)));
      bloc.pose(t, Object.assign({ talking: K.speaking('bloc', t) }, K.track(t, blocKeys)));
      rain.update(t);
    };

    const D = L[11].end + 2.6;
    const wide = { pos: [0, 3.6, 11.2], look: [0, 2.2, -2.0] };
    const shots = [
      { t: [0, L[2].t], from: wide, to: { pos: [0, 3.4, 10.4], look: [0, 2.15, -2.0] } },
      { t: [L[2].t, L[3].t], from: { pos: [1.7, 1.7, 4.5], look: [1.0, 1.25, 0.8] }, to: { pos: [1.55, 1.6, 4.1], look: [1.0, 1.2, 0.8] } },
      { t: [L[3].t, l4.t], from: { pos: [-1.6, 1.95, 5.0], look: [-0.95, 1.55, 0.8] }, to: { pos: [-1.5, 1.9, 4.6], look: [-0.95, 1.5, 0.8] }, shake: t => 0.04 * Math.exp(-(t - L[3].t) * 4) },
      { t: [l4.t, l6.t], from: { pos: [0, 1.9, 7.4], look: [0, 0.85, -1.4] }, to: { pos: [0, 2.1, 7.0], look: [0, 0.95, -1.6] } },
      { t: [l6.t, L[7].t], from: { pos: [0, 2.4, 8.2], look: [0, 1.6, -2.0] }, to: { pos: [0, 3.8, 12.5], look: [0, 4.6, -2.6] } },
      { t: [L[7].t, l8.t], from: { pos: [-1.6, 1.45, 3.9], look: [-0.95, 1.85, 0.6] }, to: { pos: [-1.7, 1.3, 3.6], look: [-0.9, 2.1, 0.4] } },
      { t: [l8.t, l9.t], from: { pos: [1.75, 1.55, 4.5], look: [1.0, 1.1, 0.8] }, to: { pos: [1.35, 1.35, 3.2], look: [1.0, 1.08, 0.8] }, ease: x => x },
      { t: [l9.t, L[10].t], from: { pos: [0, 1.4, 9.5], look: [0, 2.2, -2.7] }, to: { pos: [0, 5.0, 19], look: [0, 40, -2.7] }, ease: K.easeOut, shake: t => 0.12 * Math.exp(-(t - l9.t) * 1.6) },
      { t: [L[10].t, L[11].t], from: { pos: [0.5, 2.0, 5.6], look: [-0.95, 0.9, 0.8] }, to: { pos: [0.3, 1.8, 5.0], look: [-0.95, 0.75, 0.8] }, shake: t => (t > L[10].t + 1.2 ? 0.06 * Math.exp(-(t - L[10].t - 1.2) * 5) : 0) },
      { t: [L[11].t, D + 1], from: { pos: [0, 2.6, 9.4], look: [0, 1.6, -0.8] }, to: { pos: [0, 2.4, 8.6], look: [0, 1.5, -0.8] } },
    ];

    // sound effects: a tick/clink each time the day changes, plus story hits
    const sfx = [['pop', 0.15, 0.6], ['ding', L[1].t + 0.6, 0.6], ['whoosh', L[2].t - 0.1, 0.5], ['whoosh', L[3].t - 0.1, 0.5],
      ['whoosh', l4.t - 0.15, 0.6], ['riser', l8.t, 0.9], ['bass', l9.t, 1.0], ['kaching', l9.t + 0.05, 0.9],
      ['whoosh', L[10].t + 0.3, 0.7], ['thud', L[10].t + 1.25, 1.0], ['rustle', rainT + 0.3, 0.6], ['pop', D - 2.4, 0.6]];
    let prev = 0;
    for (let t = l4.t; t < l9.t + 0.4; t += 1 / 30) { const n = day(t); if (n !== prev) { sfx.push([n <= 7 ? 'coin' : 'tick', t, n <= 7 ? 0.8 : 0.45]); prev = n; } }

    return {
      duration: D, update, shots, sfx,
      music: { muteFrom: l8.t, muteTo: l9.t },
      badges: [{ t: 0.1, end: L[2].t, text: 'WOULD YOU RATHER?' }],
      big: [{ t: l9.t + 0.15, end: L[10].t + 0.6, text: '₹53,68,70,912', color: '&H36C8FF&' }],
      counter: t => (t >= l4.t + 0.55 && t < l9.t + 0.1 && day(t) >= 1) ? `DAY ${day(t)}   ₹${inr(Math.pow(2, day(t) - 1))}` : null,
    };
  },
};
