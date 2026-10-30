/* @maddieandchotu - "Where does your ₹20 go when you pay by UPI?"
 * Facts: payer app -> NPCI (UPI switch) -> payer's bank verifies PIN + balance, debits -> NPCI -> payee's bank credits -> confirmation.
 * UPI PIN is encrypted on the phone (NPCI common library) and checked by the payer's bank, not by the app.
 * Volume: 24.07 billion UPI payments in Sep 2026 (NPCI) = ~80 crore a day = ~9,300 a second.
 */
window.SCENE = {
  setup: { bg: 0x1d1b4b, fog: null, fov: 40, bloom: { strength: 0.55, radius: 0.5, threshold: 0.9 } },
  lines: [
    { who: 'maddie', text: 'Chotu, I just paid ₹20 for chai. Where did that money actually go?', say: 'Chotu, I just paid twenty rupees for chai. Where did that money actually go?' },
    { who: 'chotu', text: 'In about 2 seconds, it went on a trip across India. Watch!', say: 'In about two seconds, it went on a trip across India. Watch!', gap: 0.25 },
    { who: 'chotu', text: "First, your UPI PIN. It's locked so tight, even your app can't read it.", say: "First, your U P I pin. It's locked so tight, even your app can't read it.", gap: 0.7 },
    { who: 'chotu', text: 'Your app sends the request to NPCI, the big switch that connects every bank.', say: 'Your app sends the request to N P C I, the big switch that connects every bank.', gap: 0.35 },
    { who: 'chotu', text: 'NPCI asks your bank: does Maddie have ₹20?', say: 'N P C I asks your bank. Does Maddie have twenty rupees?', gap: 0.3 },
    { who: 'maddie', text: 'I do! ...Barely.', say: 'I do! Barely.', gap: 0.2 },
    { who: 'chotu', text: 'Your bank checks your PIN, and takes out ₹20.', say: 'Your bank checks your pin, and takes out twenty rupees.', gap: 0.3 },
    { who: 'chotu', text: "Then NPCI tells the chai wala's bank: add ₹20!", say: "Then N P C I tells the chai wala's bank. Add twenty rupees!", gap: 0.3 },
    { who: 'maddie', text: 'And then his speaker goes...', say: 'And then his speaker goes...', gap: 0.3 },
    { who: 'speaker', text: '₹20 received.', say: 'Twenty rupees received.', gap: 0.15 },
    { who: 'chotu', text: 'All of that, in about 2 seconds.', say: 'All of that, in about two seconds.', gap: 0.4 },
    { who: 'chotu', text: 'And India does this over 9,000 times... every single second.', say: 'And India does this over nine thousand times. Every single second.', gap: 0.3 },
    { who: 'maddie', text: 'So my chai money travelled more than me today.', say: 'So my chai money travelled more than me today.', gap: 0.5 },
  ],

  build(K, T) {
    const L = T.lines, D = L[12].end + 1.8;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const WB = V(0, 0, -60);                                  // origin of the "inside the network" world
    const W = (x, y, z) => [WB.x + x, WB.y + y, WB.z + z];
    const inNet = t => (t >= L[2].t - 0.12 && t < L[5].t) || (t >= L[6].t && t < L[9].t) || (t >= L[10].t && t < L[12].t);

    // ---------------------------------------------------------------- backgrounds (swapped per world)
    const mkBg = (top, bottom, glow) => K.canvasTex(64, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); x.fillStyle = g; x.fillRect(0, 0, w, h);
      const r = x.createRadialGradient(w / 2, h * 0.62, 0, w / 2, h * 0.62, h * 0.5); r.addColorStop(0, glow); r.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h);
    });
    const bgStall = mkBg('#16133f', '#ff8f5a', 'rgba(255,190,110,0.35)');
    const bgNet = mkBg('#03061a', '#0a2f52', 'rgba(60,220,255,0.22)');
    K.lights('studio');

    // ---------------------------------------------------------------- WORLD A: chai stall at dusk
    const street = new THREE.Mesh(new THREE.CircleGeometry(30, 64), K.M(0x2b2235, { roughness: 0.85 })); street.rotation.x = -Math.PI / 2; street.receiveShadow = true; K.add(street);
    const wood = K.M(0x8a5a2e, { roughness: 0.8 }), woodD = K.M(0x5e3b1c), steel = K.M(0xc9ccd6, { metalness: 0.85, roughness: 0.25 });
    const stall = K.group();
    stall.add(K.at(K.box(2.2, 1.0, 0.85, wood), 1.3, 0.5, -0.45));
    const panelTex = K.canvasTex(512, 230, (x, w, h) => { x.fillStyle = '#0f766e'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffd166'; for (let i = 0; i < 9; i++) x.fillRect(i * 60 - 10, 0, 26, h); x.fillStyle = '#ffffff'; x.font = 'bold 120px DejaVu Sans'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#0f3d3a'; x.fillRect(110, 50, 292, 130); x.fillStyle = '#ffd166'; x.fillText('CHAI', w / 2, 118); });
    stall.add(K.at(new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.92), new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.7 })), 1.3, 0.5, -0.02));
    stall.add(K.at(K.box(2.35, 0.08, 0.95, woodD), 1.3, 1.04, -0.45));
    for (const px of [0.2, 2.4]) stall.add(K.at(K.box(0.08, 2.7, 0.08, woodD), px, 1.35, -0.05));
    for (const px of [0.2, 2.4]) stall.add(K.at(K.box(0.08, 2.7, 0.08, woodD), px, 1.35, -1.6));
    const awnTex = K.canvasTex(512, 64, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#e2412f'; x.fillRect(i * 32, 0, 32, h); } });
    const awn = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.9), [K.M(0xe2412f), K.M(0xe2412f), new THREE.MeshStandardMaterial({ map: awnTex }), K.M(0xffffff), K.M(0xe2412f), K.M(0xe2412f)]);
    awn.position.set(1.3, 2.72, -0.75); awn.rotation.x = 0.16; awn.castShadow = true; stall.add(awn);
    for (let i = 0; i < 13; i++) { const fl = K.box(0.2, 0.16, 0.02, i % 2 ? K.M(0xffffff) : K.M(0xe2412f), false); fl.position.set(0.1 + i * 0.2, 2.6, 0.2); stall.add(fl); }
    const signTex = K.canvasTex(512, 160, (x, w, h) => { x.fillStyle = '#ffd166'; K.rrect(x, 6, 6, w - 12, h - 12, 26); x.fill(); x.fillStyle = '#7a2e12'; x.font = 'bold 74px DejaVu Sans'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MASALA CHAI', w / 2, h * 0.42); x.font = 'bold 40px DejaVu Sans'; x.fillText('₹20 only', w / 2, h * 0.8); });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.6), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, color: 0xeeeeee })); sign.position.set(1.3, 3.2, 0.05); stall.add(sign);
    // fairy lights
    const bulbs = [];
    for (let i = 0; i < 15; i++) { const k = i / 14, b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), K.glow(i % 3 ? 0xffd27a : 0xff7a5c, 3)); b.position.set(-0.6 + k * 3.4, 3.62 - Math.sin(k * Math.PI) * 0.28, 0.25); stall.add(b); bulbs.push(b); }
    // kettle + steam, glasses, QR standee, soundbox
    const kettle = K.group(stall); kettle.position.set(1.85, 1.08, -0.6);
    kettle.add(K.at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.34, 24), steel), 0, 0.17, 0));
    kettle.add(K.at(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), steel), 0, 0.37, 0));
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.28, 10), steel); spout.position.set(0.24, 0.24, 0); spout.rotation.z = -0.9; kettle.add(spout);
    const steam = []; for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false })); kettle.add(s); steam.push(s); }
    const chaiMat = K.M(0xc07a3a, { roughness: 0.3 }), glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.05 });
    const mkGlass = () => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.18, 16), glassMat)); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.14, 16), chaiMat); c.position.y = -0.015; g.add(c); return g; };
    const glassC = mkGlass(); glassC.position.set(0.95, 1.17, -0.15); stall.add(glassC);
    const g2 = mkGlass(); g2.position.set(1.15, 1.17, -0.3); stall.add(g2);
    const qrTex = K.canvasTex(256, 330, (x, w, h) => {
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.fillStyle = '#0f766e'; x.fillRect(0, 0, w, 54); x.fillStyle = '#fff'; x.font = 'bold 32px DejaVu Sans'; x.textAlign = 'center'; x.fillText('SCAN & PAY', w / 2, 38);
      const r = K.rng(5), n = 21, cs = 9, ox = (w - n * cs) / 2, oy = 70; x.fillStyle = '#111';
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (r() > 0.52) x.fillRect(ox + i * cs, oy + j * cs, cs, cs);
      for (const [fx, fy] of [[0, 0], [14, 0], [0, 14]]) { x.fillStyle = '#111'; x.fillRect(ox + fx * cs, oy + fy * cs, 7 * cs, 7 * cs); x.fillStyle = '#fff'; x.fillRect(ox + (fx + 1) * cs, oy + (fy + 1) * cs, 5 * cs, 5 * cs); x.fillStyle = '#111'; x.fillRect(ox + (fx + 2) * cs, oy + (fy + 2) * cs, 3 * cs, 3 * cs); }
      x.fillStyle = '#0f766e'; x.font = 'bold 30px DejaVu Sans'; x.fillText('UPI', w / 2, h - 28);
    });
    const qr = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.03), [K.M(0xdddddd), K.M(0xdddddd), K.M(0xdddddd), K.M(0xdddddd), new THREE.MeshBasicMaterial({ map: qrTex, color: 0xe8e8e8 }), K.M(0xdddddd)]);
    qr.position.set(0.45, 1.36, -0.2); qr.rotation.set(-0.15, 0.45, 0); qr.castShadow = true; stall.add(qr);
    const grille = K.canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#1b1e2b'; x.fillRect(0, 0, w, h); x.fillStyle = '#3d4257'; for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { x.beginPath(); x.arc(16 + i * 16, 16 + j * 16, 4.5, 0, 7); x.fill(); } });
    const ledMat = K.glow(0x2bd96b, 0.6);
    const mkSoundbox = (s) => {
      const g = new THREE.Group();
      g.add(K.box(0.36 * s, 0.4 * s, 0.3 * s, K.M(0x23263a, { roughness: 0.4 })));
      g.add(K.at(new THREE.Mesh(new THREE.PlaneGeometry(0.28 * s, 0.24 * s), new THREE.MeshBasicMaterial({ map: grille })), 0, -0.03 * s, 0.152 * s));
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.035 * s, 0.01 * s), ledMat); led.position.set(0, 0.14 * s, 0.153 * s); g.add(led);
      return g;
    };
    const boxA = mkSoundbox(1); boxA.position.set(0.82, 1.28, -0.25); boxA.rotation.y = 0.25; stall.add(boxA);

    // characters (world A)
    const maddie = K.makePerson({ skin: 0xb5764e, hair: 0x140d09, top: 0xff7a2f, accent: 0xffffff, pants: 0x27408b, shoes: 0xffffff });
    maddie.root.position.set(-0.6, 0, 0.55); maddie.root.rotation.y = 0.55;
    const wala = K.makePerson({ skin: 0x9c6239, hair: 0x1b1b1b, top: 0xf3efe2, accent: 0xd94f30, pants: 0x4a3a2a, shoes: 0x3a2a1a });
    wala.root.position.set(1.45, 0, -1.25); wala.root.rotation.y = -0.35;
    wala.head.add(K.at(K.box(0.42, 0.07, 0.04, K.M(0x1b1b1b), false), 0, -0.12, 0.42));       // moustache
    const chotuA = K.makeChotu(); chotuA.g.position.set(-1.55, 0, 1.05); chotuA.g.rotation.y = 0.35;

    // phone (shared screen texture between Maddie's hand and the network node)
    const scr = K.canvasTex(300, 570, () => {});
    const drawScreen = (state, n, a) => scr.redraw((x, w, h) => {
      x.fillStyle = '#f6f7fb'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#0f766e'; x.fillRect(0, 0, w, 92); K.text(x, 'UPI Pay', w / 2, 52, { size: 38, color: '#ffffff' });
      if (state === 'pin') {
        K.text(x, 'ENTER UPI PIN', w / 2, 170, { size: 30, color: '#33384d' });
        for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(w / 2 - 75 + i * 50, 250, 15, 0, 7); x.fillStyle = i < n ? '#0f766e' : '#d4d7e2'; x.fill(); }
        x.fillStyle = '#e7f6f3'; K.rrect(x, 40, 320, w - 80, 70, 16); x.fill();
        // padlock
        x.fillStyle = '#0f766e'; x.fillRect(w / 2 - 22, 345, 44, 34); x.strokeStyle = '#0f766e'; x.lineWidth = 7; x.beginPath(); x.arc(w / 2, 345, 14, Math.PI, 0); x.stroke();
        K.text(x, 'encrypted', w / 2, 430, { size: 28, color: '#0f766e' });
      } else if (state === 'send') {
        K.text(x, 'Paying ₹20', w / 2, 190, { size: 46, color: '#1b1e2b' });
        x.strokeStyle = '#0f766e'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.arc(w / 2, 320, 46, a, a + 4.2); x.stroke();
        K.text(x, 'processing...', w / 2, 430, { size: 28, color: '#6b7089' });
      } else {
        x.fillStyle = '#16a34a'; x.beginPath(); x.arc(w / 2, 240, 74, 0, 7); x.fill();
        x.strokeStyle = '#fff'; x.lineWidth = 16; x.lineCap = 'round'; x.beginPath(); x.moveTo(w / 2 - 32, 242); x.lineTo(w / 2 - 6, 268); x.lineTo(w / 2 + 36, 214); x.stroke();
        K.text(x, '₹20 Paid', w / 2, 375, { size: 54, color: '#1b1e2b' });
        K.text(x, 'to Chai Stall', w / 2, 430, { size: 30, color: '#6b7089' });
      }
    });
    const mkPhone = (s) => {
      const g = new THREE.Group();
      g.add(K.box(0.3 * s, 0.56 * s, 0.035 * s, K.M(0x111318, { roughness: 0.3, metalness: 0.4 })));
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.27 * s, 0.513 * s), new THREE.MeshBasicMaterial({ map: scr, color: 0xe6e6e6 })); sc.position.z = 0.0185 * s; g.add(sc);
      return g;
    };
    const phoneA = mkPhone(1); K.add(phoneA);

    // pose once so we can place the phone in Maddie's hand and aim shots at it
    const holdPhone = () => { maddie.arms[1].rotation.set(-1.2, 0, 0.05); };
    maddie.pose(0, {}); holdPhone(); maddie.root.updateMatrixWorld(true);
    const handPos = () => maddie.arms[1].localToWorld(V(0, -0.92, 0.08));
    const PH = handPos();
    // ---------------------------------------------------------------- WORLD B: inside the network
    const net = K.group(); net.position.copy(WB);
    const nfloor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), K.M(0x050b22, { roughness: 0.4, metalness: 0.5 })); nfloor.rotation.x = -Math.PI / 2; net.add(nfloor);
    const grid = new THREE.GridHelper(40, 40, 0x1f6fff, 0x123a7a); grid.material.transparent = true; grid.material.opacity = 0.35; grid.position.y = 0.01; net.add(grid);
    const wall = new THREE.GridHelper(40, 40, 0x1f6fff, 0x0e2d63); wall.rotation.x = Math.PI / 2; wall.position.set(0, 8, -14); wall.material.transparent = true; wall.material.opacity = 0.25; net.add(wall);
    const nl1 = new THREE.PointLight(0x39d0ff, 25, 14); nl1.position.set(0, 6, 3); net.add(nl1);
    const nl2 = new THREE.PointLight(0xffb347, 12, 10); nl2.position.set(0, 2, 2); net.add(nl2);
    const P = V(-1.05, 5.4, 0), N = V(0, 3.9, 0), BM = V(-1.05, 2.2, 0), BC = V(1.05, 2.2, 0), S = V(1.05, 5.4, 0);
    const phoneN = mkPhone(2.1); phoneN.position.copy(P); net.add(phoneN);
    const npci = K.group(net); npci.position.copy(N);
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.22, 6), K.glow(0x18c7d6, 1.2)); hex.rotation.x = Math.PI / 2; npci.add(hex);
    const npciTex = K.canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#063a44'; x.beginPath(); x.arc(w / 2, h / 2, 120, 0, 7); x.fill(); K.text(x, 'NPCI', w / 2, h / 2 + 4, { size: 78, color: '#ffffff' }); });
    const npFace = new THREE.Mesh(new THREE.CircleGeometry(0.38, 40), new THREE.MeshBasicMaterial({ map: npciTex })); npFace.position.z = 0.115; npci.add(npFace);
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.02, 8, 64), K.glow(0x5ff2ff, 3)); npci.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.012, 8, 64), K.glow(0x2f7bff, 3)); npci.add(ring2);
    const mkBank = (accent) => {
      const g = new THREE.Group(), stone = K.M(0xe8eaf2, { roughness: 0.5 });
      g.add(K.at(K.box(1.0, 0.1, 0.55, stone), 0, -0.36, 0)); g.add(K.at(K.box(0.92, 0.08, 0.5, stone), 0, 0.22, 0));
      for (let i = 0; i < 4; i++) g.add(K.at(K.box(0.09, 0.5, 0.09, stone), -0.33 + i * 0.22, -0.06, 0.12));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.3, 4), stone); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.55); roof.position.y = 0.41; g.add(roof);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.04, 0.02), K.glow(accent, 2.5)); strip.position.set(0, 0.17, 0.27); g.add(strip);
      g.userData.strip = strip; return g;
    };
    const bankM = mkBank(0xff7a2f); bankM.position.copy(BM); net.add(bankM);
    const bankC = mkBank(0x3d8bff); bankC.position.copy(BC); net.add(bankC);
    const boxN = mkSoundbox(2.2); boxN.position.copy(S); net.add(boxN);
    // glowing links between nodes
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0x3fd6ff, transparent: true, opacity: 0 });
    const links = [[P, N], [N, BM], [N, BC], [BC, S]].map(([a, b]) => {
      const d = b.clone().sub(a), m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, d.length(), 8), tubeMat);
      m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.position.z = -0.12; m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); net.add(m); return m;
    });
    // labels
    const label = (txt, sub, pos, bg = '#0b1838', fg = '#ffffff', w = 1.25) => {
      const c = K.card({ w, h: sub ? 0.36 : 0.26, bg, radius: 0.08, shadow: false });
      c.draw((x, W2, H2) => { K.text(x, txt, W2 / 2, sub ? H2 * 0.36 : H2 * 0.55, { size: 30, color: fg }); if (sub) K.text(x, sub, W2 / 2, H2 * 0.76, { size: 18, color: '#9fb4d8', weight: 'normal' }); }, 1);
      c.g.position.copy(pos); net.add(c.g); return c;
    };
    const lbP = label("Maddie's phone", '', V(-1.05, 4.62, 0.3));
    const lbN = label('NPCI', 'the UPI switch', V(0, 3.12, 0.3), '#063a44', '#5ff2ff', 1.1);
    const lbBM = label("Maddie's bank", '', V(-1.05, 1.62, 0.35));
    const lbBC = label("Chai wala's bank", '', V(1.05, 1.62, 0.35));
    const lbS = label("Chai wala's speaker", '', V(1.05, 4.72, 0.35), '#0b1838', '#ffffff', 1.35);
    const nodeLabels = [lbP, lbN, lbBM, lbBC, lbS];
    // the request packet: glowing core + trail + riding label
    const pkt = K.group(net);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), K.glow(0xffffff, 4)); pkt.add(core);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), new THREE.MeshBasicMaterial({ color: 0x5ff2ff, transparent: true, opacity: 0.35, depthWrite: false })); pkt.add(halo);
    const trail = []; for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.07 * (1 - i / 8), 12, 8), new THREE.MeshBasicMaterial({ color: 0x5ff2ff, transparent: true, opacity: 0.55 * (1 - i / 7), depthWrite: false })); net.add(s); trail.push(s); }
    const pktCard = K.card({ w: 1.25, h: 0.3, bg: '#ffffff', radius: 0.15, shadow: false }); net.add(pktCard.g);
    const pkt2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), K.glow(0x7dff9a, 4)); net.add(pkt2);
    const hops = [
      { a: P, b: N, t0: L[3].t + 0.15, t1: L[3].t + 1.45, txt: 'Pay ₹20 + PIN', col: '#0f766e' },
      { a: N, b: BM, t0: L[4].t + 0.1, t1: L[4].t + 1.2, txt: 'Maddie has ₹20?', col: '#c2410c' },
      { a: BM, b: N, t0: L[6].t + 1.35, t1: Math.max(L[6].t + 2.2, L[6].end), txt: 'OK, debited ✓', col: '#15803d' },
      { a: N, b: BC, t0: L[7].t + 0.35, t1: L[7].t + 1.5, txt: 'Add ₹20', col: '#1d4ed8' },
      { a: BC, b: S, t0: L[8].t + 0.05, t1: L[8].t + 0.95, txt: '₹20 received', col: '#15803d' },
    ];
    const pathAt = (h, k) => h.a.clone().lerp(h.b, k).add(V(0, 0, 0.25 + Math.sin(k * Math.PI) * 0.45));
    const arrivals = hops.map(h => h.t1);
    // info cards in the network
    const balCard = K.card({ w: 1.0, h: 0.62, bg: '#ffffff', radius: 0.1 }); balCard.g.position.set(-1.3, 3.05, 0.6); net.add(balCard.g);
    const plusCard = K.card({ w: 1.0, h: 0.42, bg: '#16a34a', radius: 0.1 }); plusCard.g.position.set(1.05, 3.0, 0.6); net.add(plusCard.g);
    plusCard.draw((x, W2, H2) => K.text(x, '+ ₹20', W2 / 2, H2 * 0.55, { size: 64, color: '#ffffff' }), 1);
    const recvN = K.card({ w: 1.4, h: 0.38, bg: '#16a34a', radius: 0.19 }); recvN.g.position.set(1.05, 6.25, 0.6); net.add(recvN.g);
    recvN.draw((x, W2, H2) => K.text(x, '₹20 RECEIVED', W2 / 2, H2 * 0.55, { size: 44, color: '#ffffff' }), 1);
    const lockCard = K.card({ w: 0.5, h: 0.5, bg: '#0f766e', radius: 0.25, shadow: false }); lockCard.g.position.set(-1.05, 6.4, 0.6); net.add(lockCard.g);
    lockCard.draw((x, W2, H2) => { x.fillStyle = '#fff'; x.fillRect(W2 / 2 - 24, H2 / 2 - 4, 48, 38); x.strokeStyle = '#fff'; x.lineWidth = 8; x.beginPath(); x.arc(W2 / 2, H2 / 2 - 4, 16, Math.PI, 0); x.stroke(); }, 1);
    // Chotu inside the network, as the guide
    const chotuB = K.makeChotu(); chotuB.g.position.set(0, 0, 0.9); net.add(chotuB.g);
    // the big reveal: a whole country of banks and phones pinging each other
    const mega = K.group(net); mega.visible = false;
    const r = K.rng(31), nodes = [];
    const nm = [K.glow(0x3fd6ff, 2), K.glow(0xff9f43, 2), K.glow(0x7dff9a, 2)];
    for (let i = 0; i < 90; i++) {
      const p = V((r() - 0.5) * 22, 0.5 + r() * 15, -4 - r() * 8);
      if (Math.abs(p.x) < 2.2 && p.y < 7.5 && p.z > -6) p.z -= 4;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), nm[i % 3]); m.position.copy(p); mega.add(m); nodes.push(p);
    }
    const lp = [];
    nodes.forEach((p, i) => { for (let k = 0; k < 2; k++) { const q = nodes[Math.floor(r() * nodes.length)]; lp.push(p.x, p.y, p.z, q.x, q.y, q.z); } });
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    mega.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2f8cff, transparent: true, opacity: 0.3 })));
    const zips = []; const zm = new THREE.MeshBasicMaterial({ color: 0xe8fbff });
    for (let i = 0; i < 160; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), zm); mega.add(s); const li = Math.floor(r() * (lp.length / 6)); zips.push({ s, a: V(lp[li * 6], lp[li * 6 + 1], lp[li * 6 + 2]), b: V(lp[li * 6 + 3], lp[li * 6 + 4], lp[li * 6 + 5]), per: 0.5 + r() * 0.9, ph: r() }); }
    const bigCard = K.card({ w: 6.2, h: 2.4, bg: '#ffffff', radius: 0.3 }); bigCard.g.position.set(0, 10.2, 2.0); net.add(bigCard.g);
    bigCard.draw((x, W2, H2) => {
      x.fillStyle = '#0f766e'; x.fillRect(0, 0, W2, 16);
      K.text(x, '9,000+', W2 / 2, H2 * 0.36, { size: 200, color: '#0b1838' });
      K.text(x, 'UPI payments every second', W2 / 2, H2 * 0.66, { size: 66, color: '#0f766e' });
      K.text(x, '≈ 80 crore a day  ·  NPCI, Sep 2026', W2 / 2, H2 * 0.87, { size: 40, color: '#6b7089', weight: 'normal' });
    }, 1);

    // stall-world cards
    const recvA = K.card({ w: 1.0, h: 0.3, bg: '#16a34a', radius: 0.17 }); recvA.g.position.set(0.82, 1.82, -0.05); K.add(recvA.g);
    recvA.draw((x, W2, H2) => K.text(x, '₹20 RECEIVED', W2 / 2, H2 * 0.55, { size: 44, color: '#ffffff' }), 1);
    const barely = K.card({ w: 1.05, h: 0.36, bg: '#ffffff', radius: 0.12 }); barely.g.position.set(-0.5, 3.1, 0.6); K.add(barely.g);
    barely.draw((x, W2, H2) => { K.text(x, 'Balance: ₹47', W2 / 2, H2 * 0.55, { size: 40, color: '#c2410c' }); }, 1);
    // white flash for the dive into the phone (rides on the camera)
    K.scene.add(K.cam);
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    flash.position.z = -0.5; flash.renderOrder = 999; K.cam.add(flash);

    const glassH = mkGlass(); K.add(glassH); glassH.visible = false;

    // ---------------------------------------------------------------- poses
    const mKeys = [
      [0, { pose: 'idle', look: [0, 0.3], face: 'happy' }], [L[0].t + 1.2, { pose: 'idle', look: [-0.7, 0.05], face: 'worried', talking: 0 }],
      [L[1].t, { pose: 'idle', look: [-0.7, 0.1], face: 'neutral' }], [L[5].t, { pose: 'idle', look: [-0.6, 0], face: 'worried', shrug: 0.6 }],
      [L[5].end + 0.3, { pose: 'idle', look: [-0.5, 0.1] }], [L[8].t, { pose: 'idle', look: [0.6, 0.15], face: 'happy' }],
      [L[12].t, { pose: 'idle', look: [-0.6, 0], face: 'happy' }],
    ];
    const cAKeys = [
      [0, { face: 'open' }], [L[0].end - 0.4, { face: 'happy', jump: 0 }], [L[1].t, { face: 'open', point: 0.6 }], [L[1].end - 0.6, { face: 'happy', wave: 1 }],
      [L[5].t, { face: 'happy', wiggle: 1 }], [L[9].t, { face: 'happy', armsUp: 0.6 }], [L[12].t, { face: 'happy', hopLoop: 1, wiggle: 1 }],
    ];
    const cBKeys = [
      [0, { face: 'open' }], [L[2].t, { face: 'open', point: 1, turn: -0.4 }], [L[3].t, { face: 'open', point: 1, turn: 0 }], [L[4].t, { face: 'open', turn: -0.35 }],
      [L[6].t, { face: 'open', point: 1, turn: -0.4 }], [L[7].t, { face: 'happy', point: 1, turn: 0.4 }], [L[10].t, { face: 'happy', armsUp: 0.5 }], [L[11].t, { face: 'shock', armsUp: 1 }],
    ];
    const wKeys = [[0, { pose: 'idle', look: [0.3, 0.1] }], [L[9].t, { pose: 'wave', look: [0.4, 0] }], [L[10].t, { pose: 'idle' }], [L[12].t, { pose: 'wave', face: 'happy' }]];

    const update = t => {
      const net_ = inNet(t);
      K.scene.background = net_ ? bgNet : bgStall; net.visible = net_;
      // flash on world switches
      flash.material.opacity = Math.max(K.pulse(t, L[2].t - 0.3, 0.42) * 1.0, K.pulse(t, L[10].t - 0.12, 0.3) * 0.6, K.pulse(t, L[5].t - 0.1, 0.22) * 0.5, K.pulse(t, L[6].t - 0.1, 0.22) * 0.5, K.pulse(t, L[9].t - 0.1, 0.22) * 0.5, K.pulse(t, L[12].t - 0.1, 0.22) * 0.5);
      // stall life
      bulbs.forEach((b, i) => b.material.emissiveIntensity = 2.2 + Math.sin(t * 3 + i * 1.7) * 0.8);
      steam.forEach((s, i) => { const k = (t * 0.45 + i / steam.length) % 1; s.position.set(0.3 + Math.sin(k * 6 + i) * 0.05, 0.42 + k * 0.7, 0); s.scale.setScalar(0.6 + k * 1.4); s.material.opacity = 0.35 * (1 - k); });
      // phone screen state
      const pinN = Math.floor(K.clamp((t - (L[2].t + 0.6)) / 1.6) * 4.999);
      const state = t < L[2].t - 0.3 ? 'done' : t < L[3].t + 0.15 ? 'pin' : t < L[8].t + 0.3 ? 'send' : 'done';
      drawScreen(state, pinN, t * 7);
      // characters A
      maddie.pose(t, Object.assign({ talking: K.speaking('maddie', t) }, K.track(t, mKeys)));
      const sip = t >= L[12].t;
      if (!sip) holdPhone(); else { maddie.arms[1].rotation.set(-0.2, 0, 0.1); maddie.arms[0].rotation.set(-2.15 + Math.sin(t * 2) * 0.05, 0, -0.55); }
      maddie.root.updateMatrixWorld(true);
      phoneA.position.copy(handPos()); phoneA.lookAt(K.cam.position); phoneA.visible = !sip && !(t >= L[9].t - 0.15 && t < L[10].t);
      glassH.visible = sip; glassC.visible = !sip;
      if (sip) glassH.position.copy(maddie.arms[0].localToWorld(V(0, -0.95, 0.12)));
      chotuA.pose(t, Object.assign({ talking: K.speaking('chotu', t) && !net_ }, K.track(t, cAKeys)));
      wala.pose(t, Object.assign({ talking: false }, K.track(t, wKeys)));
      ledMat.emissiveIntensity = 0.6 + K.pulse(t, L[9].t - 0.05, 1.2) * 6;
      boxA.scale.setScalar(1 + K.pulse(t, L[9].t - 0.05, 0.3) * 0.12);
      recvA.show(t, L[9].t, L[10].t - 0.15);
      barely.show(t, L[5].t + 0.5, L[5].end + 0.25);
      // network world
      tubeMat.opacity = 0.75 * K.prog(t, L[2].t, L[3].t);
      ring1.rotation.z = t * 1.4; ring2.rotation.z = -t * 0.9; ring1.rotation.x = Math.sin(t) * 0.3; ring2.rotation.y = Math.cos(t * 0.8) * 0.4;
      const hit = arrivals.reduce((m, a) => Math.max(m, K.pulse(t, a, 0.4)), 0);
      npci.scale.setScalar(1 + (K.pulse(t, hops[0].t1, 0.4) + K.pulse(t, hops[2].t1, 0.4)) * 0.18);
      hex.material.emissiveIntensity = 1.2 + hit * 2;
      bankM.scale.setScalar(1 + K.pulse(t, hops[1].t1, 0.4) * 0.18); bankC.scale.setScalar(1 + K.pulse(t, hops[3].t1, 0.4) * 0.18); boxN.scale.setScalar(1 + K.pulse(t, hops[4].t1, 0.4) * 0.2);
      nodeLabels.forEach((c, i) => c.show(t, L[2].t + 0.2 + i * 0.12));
      lockCard.show(t, L[2].t + 2.0, L[3].t + 0.2);
      let active = null; for (const h of hops) if (t >= h.t0 && t < h.t1) active = h;
      pkt.visible = !!active; pktCard.g.visible = false; trail.forEach(s => s.visible = !!active);
      if (active) {
        const k = K.ease((t - active.t0) / (active.t1 - active.t0));
        pkt.position.copy(pathAt(active, k)); halo.scale.setScalar(1 + Math.sin(t * 20) * 0.15);
        trail.forEach((s, i) => s.position.copy(pathAt(active, Math.max(0, k - (i + 1) * 0.035))));
        pktCard.g.visible = true; pktCard.g.scale.setScalar(K.easeBack(K.prog(t, active.t0, active.t0 + 0.25)));
        pktCard.g.position.copy(pkt.position).add(V(0, 0.32, 0.1)); pktCard.mat.opacity = 1;
        pktCard.draw((x, W2, H2) => { x.fillStyle = active.col; x.fillRect(0, 0, W2, H2); K.text(x, active.txt, W2 / 2, H2 * 0.55, { size: 34, color: '#ffffff' }); }, active.txt);
      }
      // success ping back to the phone, alongside the last hop
      const sp = K.prog(t, L[8].t + 0.05, L[8].t + 0.95); pkt2.visible = sp > 0 && sp < 1;
      if (pkt2.visible) pkt2.position.copy(N.clone().lerp(P, K.ease(sp)).add(V(0, 0, 0.25 + Math.sin(sp * Math.PI) * 0.4)));
      // balance card
      balCard.show(t, L[4].t + 1.1, L[7].t);
      if (balCard.g.visible) { const deb = t >= L[6].t + 0.9;
        balCard.draw((x, W2, H2) => { x.fillStyle = deb ? '#16a34a' : '#c2410c'; x.fillRect(0, 0, W2, 12);
          K.text(x, deb ? 'BALANCE  −₹20' : 'BALANCE', W2 / 2, H2 * 0.27, { size: 26, color: deb ? '#dc2626' : '#6b7089' });
          K.text(x, deb ? '₹27' : '₹47', W2 / 2, H2 * 0.66, { size: 72, color: '#0b1838' }); }, deb ? 2 : 1);
        bankM.userData.strip.material.emissiveIntensity = 2.5 + K.pulse(t, L[6].t + 0.9, 0.5) * 5; }
      plusCard.show(t, hops[3].t1 - 0.05, L[9].t);
      recvN.show(t, hops[4].t1 - 0.05, L[9].t);
      chotuB.pose(t, Object.assign({ talking: K.speaking('chotu', t) && net_ }, K.track(t, cBKeys)));
      // mega reveal
      mega.visible = t >= L[11].t - 0.15;
      if (mega.visible) zips.forEach(z => { const k = ((t / z.per) + z.ph) % 1; z.s.position.copy(z.a).lerp(z.b, k); });
      bigCard.show(t, L[11].t + 1.1);
    };

    // ---------------------------------------------------------------- camera
    const PHf = PH.toArray();
    const stallWide = { pos: [0.2, 2.35, 10.6], look: [0.2, 1.75, 0] };
    const wideN = { pos: W(0, 3.65, 10.0), look: W(0, 3.45, 0) };
    const shots = [
      { t: [0, L[0].t + 1.3], from: { pos: [PH.x - 0.15, PH.y + 0.15, PH.z + 0.95], look: PHf }, to: { pos: [PH.x + 0.05, PH.y + 0.45, PH.z + 2.4], look: [PH.x - 0.2, PH.y + 0.35, PH.z] } },
      { t: [L[0].t + 1.3, L[1].t], from: stallWide, to: { pos: [0.35, 2.3, 9.8], look: [0.35, 1.75, 0] } },
      { t: [L[1].t, L[1].end - 0.75], from: { pos: [-1.1, 1.45, 4.6], look: [-1.3, 1.1, 1.0] }, to: { pos: [-1.05, 1.4, 4.2], look: [-1.25, 1.1, 1.0] } },
      { t: [L[1].end - 0.75, L[2].t - 0.12], from: { pos: [PH.x + 0.1, PH.y + 0.4, PH.z + 2.2], look: PHf }, to: { pos: [PH.x, PH.y + 0.02, PH.z + 0.12], look: PHf }, ease: K.easeIn },
      { t: [L[2].t - 0.12, L[3].t], from: { pos: W(-1.05, 5.4, 4.2), look: W(-1.05, 5.3, 0) }, to: { pos: W(-0.9, 5.3, 3.3), look: W(-0.95, 5.25, 0) } },
      { t: [L[3].t, L[4].t], from: { pos: W(-0.7, 5.0, 6.0), look: W(-0.6, 4.7, 0) }, to: { pos: W(-0.2, 4.3, 5.4), look: W(-0.1, 4.0, 0) } },
      { t: [L[4].t, L[5].t], from: { pos: W(-0.3, 3.5, 5.6), look: W(-0.4, 3.2, 0) }, to: { pos: W(-1.0, 3.0, 5.0), look: W(-1.05, 2.75, 0) } },
      { t: [L[5].t, L[6].t], from: { pos: [-0.15, 2.55, 4.3], look: [-0.45, 2.45, 0.55] }, to: { pos: [-0.2, 2.5, 3.9], look: [-0.45, 2.45, 0.55] } },
      { t: [L[6].t, L[7].t], from: { pos: W(-1.0, 2.9, 4.6), look: W(-1.05, 2.6, 0) }, to: { pos: W(-0.95, 2.85, 3.9), look: W(-1.0, 2.6, 0) } },
      { t: [L[7].t, L[8].t], from: wideN, to: { pos: W(0.25, 3.6, 9.2), look: W(0.2, 3.4, 0) } },
      { t: [L[8].t, L[9].t], from: { pos: W(0.6, 4.6, 6.4), look: W(0.9, 4.4, 0) }, to: { pos: W(0.9, 5.3, 4.6), look: W(1.0, 5.4, 0) } },
      { t: [L[9].t, L[10].t], from: { pos: [0.65, 2.1, 4.2], look: [0.85, 1.6, -0.2] }, to: { pos: [0.7, 2.05, 3.7], look: [0.85, 1.6, -0.2] }, shake: t => 0.02 * Math.exp(-(t - L[9].t) * 5) },
      { t: [L[10].t, L[11].t], from: wideN, to: { pos: W(0, 3.65, 9.4), look: W(0, 3.45, 0) } },
      { t: [L[11].t, L[12].t], from: { pos: W(0, 3.65, 9.4), look: W(0, 3.6, 0) }, to: { pos: W(0, 6.2, 26), look: W(0, 6.2, 0) }, ease: K.easeOut, shake: t => 0.04 * Math.exp(-(t - L[11].t) * 3) },
      { t: [L[12].t, D + 1], from: stallWide, to: { pos: [0.35, 2.25, 9.6], look: [0.35, 1.75, 0] } },
    ];

    // ---------------------------------------------------------------- sound
    const sfx = [['chime', 0.12, 0.8], ['whoosh', L[1].end - 0.75, 0.6], ['riser', L[2].t - 1.0, 0.25], ['bass', L[2].t - 0.1, 0.55], ['whoosh', L[2].t - 0.05, 0.5]];
    for (let i = 0; i < 4; i++) sfx.push(['beep', L[2].t + 0.6 + (i + 0.5) * 0.4, 0.8]);
    sfx.push(['pop', L[2].t + 2.0, 0.5]);
    hops.forEach(h => { sfx.push(['zap', h.t0, 0.7]); sfx.push(['ding', h.t1, 0.35]); });
    sfx.push(['pop', L[4].t + 1.1, 0.5], ['coin', L[6].t + 0.9, 0.6], ['pop', hops[3].t1, 0.5], ['whoosh', L[5].t - 0.1, 0.3], ['whoosh', L[6].t - 0.1, 0.3], ['whoosh', L[9].t - 0.12, 0.35]);
    sfx.push(['chime', L[8].t + 0.95, 0.6], ['kaching', L[9].t - 0.05, 0.5]);
    sfx.push(['riser', L[11].t - 2.4, 0.3], ['bass', L[11].t - 0.05, 0.9], ['pop', L[11].t + 1.1, 0.6], ['whoosh', L[12].t - 0.1, 0.4], ['boing', L[12].t + 0.6, 0.4]);
    // slow-mo stopwatch overlay: 0.00 s -> 2.00 s across the network trip
    const counter = t => {
      if (t < L[2].t || t >= L[11].t) return '';
      const v = 2 * K.clamp((t - L[2].t) / (L[10].t - L[2].t));
      return (v >= 2 ? 'DONE  ' : 'SLOW-MO  ') + v.toFixed(2) + ' s';
    };
    return { duration: D, update, shots, sfx, counter, watermark: '@maddieandchotu', endCard: false, music: { muteFrom: L[11].t - 0.1, muteTo: L[11].t + 1.0 } };
  },
};
