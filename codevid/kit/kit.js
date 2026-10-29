/* Verse Films code-video kit - browser side (needs THREE as a global).
 * Everything is a pure function of time t, so any frame can be drawn in any order.
 * A scene file sets window.SCENE = { duration, meta, build(K) -> update(t), shots: [...] }.
 */
(function () {
  const K = {};
  window.K = K;

  // ------------------------------------------------------------------ math + timeline helpers
  K.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  K.ease = x => { x = K.clamp(x); return x * x * (3 - 2 * x); };
  K.easeOut = x => { x = K.clamp(x); return 1 - (1 - x) * (1 - x); };
  K.easeIn = x => { x = K.clamp(x); return x * x; };
  K.lerp = (a, b, k) => a + (b - a) * k;
  K.prog = (t, a, b) => K.clamp((t - a) / (b - a));          // 0..1 between a and b
  K.win = (t, a, b) => t >= a && t < b;
  K.pulse = (t, a, d) => (t >= a && t < a + d) ? Math.sin((t - a) / d * Math.PI) : 0;   // 0->1->0 bump
  K.bounce = (t, a, amp = 1, freq = 14, decay = 5) => t < a ? 0 : Math.sin((t - a) * freq) * amp * Math.exp(-(t - a) * decay);
  K.rng = (seed = 1) => { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  // keyframes: K.key(t, [[0, 0], [1.5, 2], [3, 2]]) -> eased value between keys
  K.key = (t, keys, easeFn = K.ease) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
        const k = easeFn((t - t0) / (t1 - t0));
        return Array.isArray(v0) ? v0.map((v, j) => K.lerp(v, v1[j], k)) : K.lerp(v0, v1, k);
      }
    }
    return keys[keys.length - 1][1];
  };

  // ------------------------------------------------------------------ renderer + scene
  K.setup = ({ width = 1080, height = 1920, bg = 0x0b1033, fog = [45, 140], fov = 42 } = {}) => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height); renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);
    if (fog) scene.fog = new THREE.Fog(bg, fog[0], fog[1]);
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 500);
    Object.assign(K, { renderer, scene, cam: camera, width, height });
    return K;
  };

  K.M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75, metalness: 0.05 }, o));
  K.basic = (c, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
  K.box = (w, h, d, mat, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.castShadow = shadow; m.receiveShadow = true; return m;
  };
  K.add = (o, parent) => ((parent || K.scene).add(o), o);
  K.at = (o, x, y, z) => (o.position.set(x, y, z), o);

  // ------------------------------------------------------------------ lighting presets
  K.lights = (preset = 'night') => {
    const S = K.scene, L = {};
    if (preset === 'night') {
      S.add(new THREE.HemisphereLight(0xa9b8ff, 0x2a2440, 1.7));
      S.add(new THREE.AmbientLight(0xffffff, 0.35));
      L.fill = new THREE.DirectionalLight(0xffe2c0, 1.1); L.fill.position.set(6, 10, -14); S.add(L.fill);
      L.key = new THREE.DirectionalLight(0xbfd0ff, 2.0); L.key.position.set(-20, 40, -10);
    } else if (preset === 'day') {
      S.add(new THREE.HemisphereLight(0xcfe8ff, 0x6b8f4a, 1.6));
      S.add(new THREE.AmbientLight(0xffffff, 0.3));
      L.key = new THREE.DirectionalLight(0xfff1d6, 2.6); L.key.position.set(15, 35, -12);
      L.fill = new THREE.DirectionalLight(0xbcd6ff, 0.8); L.fill.position.set(-10, 8, 12); S.add(L.fill);
    } else {                                                     // 'studio': dark navy stage, soft key + rim
      S.add(new THREE.HemisphereLight(0xb8c4ff, 0x1a1840, 1.4));
      S.add(new THREE.AmbientLight(0xffffff, 0.35));
      L.key = new THREE.DirectionalLight(0xffffff, 2.2); L.key.position.set(6, 12, -10);
      L.rim = new THREE.DirectionalLight(0x6f8cff, 1.5); L.rim.position.set(-8, 6, 10); S.add(L.rim);
    }
    L.key.castShadow = true; L.key.shadow.mapSize.set(2048, 2048);
    Object.assign(L.key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
    S.add(L.key);
    return L;
  };

  K.stars = (n = 900, r = 180) => {
    const rnd = K.rng(99), g = new THREE.BufferGeometry(), p = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, e = 0.12 + rnd() * 1.25;
      p.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return K.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 0.9, fog: false })));
  };

  // ------------------------------------------------------------------ sets
  K.sets = {};
  // night city street along the x axis: road z -4..4, sidewalks, lit buildings both sides
  K.sets.city = ({ seed = 7, day = false } = {}) => {
    const rnd = K.rng(seed), g = new THREE.Group(); K.add(g);
    const road = K.box(400, 0.1, 8, K.M(day ? 0x3a3d4a : 0x1c1f33, { roughness: 0.95 }), false); road.position.y = -0.05; g.add(road);
    for (const z of [-4.9, 4.9]) {
      g.add(K.at(K.box(400, 0.3, 1.8, K.M(day ? 0xb9b4a8 : 0x3a3f63), false), 0, 0, z));
      g.add(K.at(K.box(400, 0.32, 0.18, K.M(0xf2c14e, { emissive: 0x3a2a00 }), false), 0, 0.01, z > 0 ? 4.02 : -4.02));
    }
    for (let x = -200; x < 200; x += 4) g.add(K.at(K.box(2, 0.02, 0.18, K.M(0xf2c14e, { emissive: 0x6a5000 }), false), x, 0.01, 0));
    g.add(K.at(K.box(400, 0.1, 400, K.M(day ? 0x56607a : 0x141833), false), 0, -0.12, 0));
    const tex = () => {
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
      x.fillStyle = '#000'; x.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const on = rnd() < (day ? 0.15 : 0.55);
        x.fillStyle = on ? (rnd() < 0.7 ? '#ffd27a' : '#9fd8ff') : (day ? '#7f9cc8' : '#151a3a');
        x.fillRect(i * 16 + 4, j * 16 + 4, 9, 10);
      }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter;
      t.colorSpace = THREE.SRGBColorSpace; return t;
    };
    const texes = [tex(), tex(), tex(), tex()];
    for (const side of [-1, 1]) for (let x = -90; x < 90;) {
      const w = 5 + rnd() * 6, h = 7 + rnd() * 22, d = 8 + rnd() * 6;
      const t = texes[Math.floor(rnd() * 4)].clone(); t.needsUpdate = true; t.repeat.set(Math.round(w / 2.2), Math.round(h / 2.6));
      const col = (day ? [0x9aa7c7, 0xc9b79c, 0xa4b9a0, 0xd6c3b4] : [0x252b57, 0x2c2f66, 0x1f2a52, 0x33306a])[Math.floor(rnd() * 4)];
      const b = K.box(w, h, d, K.M(col, day ? { map: t } : { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.9 }));
      b.position.set(x + w / 2, h / 2, side * (5.8 + d / 2)); g.add(b); x += w + 0.6;
    }
    return g;
  };
  // dark navy studio with a glowing grid floor (like the reference reels)
  K.sets.studio = ({ grid = 0x3b4cff } = {}) => {
    const g = new THREE.Group(); K.add(g);
    g.add(K.at(K.box(200, 0.1, 200, K.M(0x0e1440, { roughness: 0.9 }), false), 0, -0.05, 0));
    const gh = new THREE.GridHelper(200, 100, grid, grid); gh.material.opacity = 0.35; gh.material.transparent = true; gh.position.y = 0.01; g.add(gh);
    return g;
  };
  // sunny suburban backyard: grass, a house, fence, trees
  K.sets.yard = ({ seed = 3 } = {}) => {
    const rnd = K.rng(seed), g = new THREE.Group(); K.add(g);
    K.scene.background = new THREE.Color(0x7cc7ff); if (K.scene.fog) K.scene.fog.color = new THREE.Color(0x7cc7ff);
    g.add(K.at(K.box(200, 0.1, 200, K.M(0x5fae4a, { roughness: 1 }), false), 0, -0.05, 0));
    const house = new THREE.Group(); g.add(house); house.position.set(0, 0, 14);
    house.add(K.at(K.box(12, 5, 7, K.M(0xe9e4da)), 0, 2.5, 0));
    const roof = K.box(13, 0.4, 8.2, K.M(0x7a3b2e)); roof.position.set(0, 5.6, 0); house.add(roof);
    const roof2 = K.box(13, 1.6, 6, K.M(0x8a4434)); roof2.position.set(0, 6.4, 0); house.add(roof2);
    for (const x of [-3.5, 3.5]) house.add(K.at(K.box(2, 1.6, 0.1, K.M(0x9fd8ff, { emissive: 0x203040 })), x, 3, -3.55));
    house.add(K.at(K.box(1.4, 2.6, 0.1, K.M(0x6b4a2b)), 0, 1.3, -3.55));
    for (let x = -30; x <= 30; x += 1.2) g.add(K.at(K.box(0.2, 1.4, 0.15, K.M(0xb08a5a)), x, 0.7, 20));
    for (let i = 0; i < 9; i++) {
      const tx = -26 + rnd() * 52, tz = 8 + rnd() * 10; if (Math.abs(tx) < 8) continue;
      g.add(K.at(K.box(0.6, 2.5, 0.6, K.M(0x6b4a2b)), tx, 1.25, tz));
      g.add(K.at(K.box(2.6, 2.6, 2.6, K.M(0x3f8f3a)), tx, 3.4, tz));
    }
    return g;
  };

  // ------------------------------------------------------------------ props
  // car driving along x; tires can vanish (rims stay). update via car.set(x, z, dir, opts)
  K.makeCar = ({ color = 0xe8574a, tireR = 0.45, rimR = 0.28 } = {}) => {
    const g = new THREE.Group(); K.add(g);
    g.add(K.at(K.box(2.6, 0.7, 1.25, K.M(color, { roughness: 0.4, metalness: 0.3 })), 0, 0.55, 0));
    g.add(K.at(K.box(1.4, 0.55, 1.1, K.M(0x1b2240, { roughness: 0.2, metalness: 0.6 })), -0.15, 1.15, 0));
    g.add(K.at(K.box(0.06, 0.16, 0.9, K.M(0xffffff, { emissive: 0xfff3c0, emissiveIntensity: 2 })), 1.31, 0.6, 0));
    g.add(K.at(K.box(0.06, 0.16, 0.9, K.M(0xff2222, { emissive: 0xff2222, emissiveIntensity: 2 })), -1.31, 0.6, 0));
    const tg = new THREE.CylinderGeometry(tireR, tireR, 0.32, 20); tg.rotateX(Math.PI / 2);
    const rg = new THREE.CylinderGeometry(rimR, rimR, 0.36, 16); rg.rotateX(Math.PI / 2);
    const wheels = [];
    for (const [wx, wz] of [[0.85, 0.62], [0.85, -0.62], [-0.85, 0.62], [-0.85, -0.62]]) {
      const tire = new THREE.Mesh(tg, K.M(0x111111, { roughness: 0.9 })); tire.castShadow = true;
      const rim = new THREE.Mesh(rg, K.M(0xc9ced8, { metalness: 0.9, roughness: 0.3 })); rim.castShadow = true;
      tire.position.set(wx, 0, wz); rim.position.set(wx, 0, wz); g.add(tire); g.add(rim);
      wheels.push({ tire, rim, wx, wz });
    }
    return {
      g, wheels, tireR, rimR,
      // tires: 1 = normal, 0 = gone. spin: wheel rotation angle.
      set({ x = 0, z = 0, yaw = 0, tires = 1, spin = 0, lift = 0, roll = 0 }) {
        g.position.set(x, K.lerp(rimR, tireR, tires) + lift, z); g.rotation.set(0, yaw, roll);
        for (const w of wheels) { w.tire.scale.setScalar(Math.max(0.001, tires)); w.tire.visible = tires > 0.01; w.tire.rotation.z = spin; w.rim.rotation.z = spin; }
      },
      wheelWorld(i) { const o = wheels[i]; return new THREE.Vector3(o.wx, 0, o.wz).applyEuler(g.rotation).add(g.position); },
    };
  };

  // deterministic particle bursts. spawn: () => {pos:[x,y,z], vel:[vx,vy,vz], t0, life}
  K.particles = ({ n = 200, size = 0.08, color = 0xffb347, gravity = 9.8, opacity = 1, spawn, floorY = 0.03, grow = 0 }) => {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
    const geo = new THREE.BoxGeometry(size, size, size);
    const items = [];
    for (let i = 0; i < n; i++) { const m = new THREE.Mesh(geo, mat); m.visible = false; K.add(m); items.push({ m, p: spawn(i) }); }
    return {
      update(t, origin) {
        for (const it of items) {
          const p = it.p, age = t - p.t0;
          if (age < 0 || age > p.life) { it.m.visible = false; continue; }
          const o = (typeof origin === 'function' ? origin(p) : null) || p.pos;
          it.m.visible = true; it.m.scale.setScalar(1 + grow * age);
          it.m.position.set(o[0] + p.vel[0] * age, Math.max(floorY, o[1] + p.vel[1] * age - 0.5 * gravity * age * age), o[2] + p.vel[2] * age);
        }
      },
    };
  };

  // ------------------------------------------------------------------ characters
  // voxel person. pose(t, {...}) sets the whole body every frame.
  K.makeHero = ({ skin = 0xc98b5e, hair = 0x2a1a10, top = 0xf2b630, pants = 0x1d2340, shoes = 0xffffff, sole = 0x2b2b2b, strings = true } = {}) => {
    const mat = { skin: K.M(skin), hair: K.M(hair), top: K.M(top), pants: K.M(pants), white: K.M(0xffffff), black: K.M(0x111111), shoes: K.M(shoes), sole: K.M(sole, { roughness: 0.95 }), mouth: K.M(0x5a2a1a) };
    const root = new THREE.Group(); K.add(root);
    const hip = new THREE.Group(); hip.position.y = 1.0; root.add(hip);
    const torso = K.box(0.9, 0.95, 0.5, mat.top); torso.position.y = 0.48; hip.add(torso);
    if (strings) for (const sx of [-0.12, 0.12]) hip.add(K.at(K.box(0.04, 0.3, 0.02, mat.white), sx, 0.62, 0.26));
    const neck = new THREE.Group(); neck.position.y = 0.95; hip.add(neck);
    const head = new THREE.Group(); head.position.y = 0.37; neck.add(head);
    head.add(K.box(0.8, 0.8, 0.8, mat.skin));
    for (let i = 0; i < 9; i++) head.add(K.at(K.box(0.28, 0.22, 0.28, mat.hair), -0.3 + (i % 3) * 0.3, 0.42 + (i % 2) * 0.06, -0.3 + Math.floor(i / 3) * 0.3));
    head.add(K.at(K.box(0.84, 0.18, 0.2, mat.hair), 0, 0.33, 0.33));
    const eyes = [], pupils = [], brows = [];
    for (const ex of [-0.18, 0.18]) {
      const e = K.at(K.box(0.2, 0.2, 0.02, mat.white, false), ex, 0.05, 0.41); head.add(e); eyes.push(e);
      const p = K.at(K.box(0.09, 0.11, 0.02, mat.black, false), ex + 0.03, 0.04, 0.425); head.add(p); pupils.push(p);
      const b = K.at(K.box(0.24, 0.05, 0.02, mat.hair, false), ex, 0.22, 0.41); head.add(b); brows.push(b);
    }
    const mouth = K.at(K.box(0.22, 0.05, 0.02, mat.mouth, false), 0, -0.2, 0.41); head.add(mouth);
    const arms = [], legs = [], soles = [], ghosts = [];
    for (const sx of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(sx * 0.58, 0.85, 0); hip.add(sh);
      sh.add(K.at(K.box(0.26, 0.8, 0.3, mat.top), 0, -0.36, 0));
      sh.add(K.at(K.box(0.22, 0.2, 0.22, mat.skin), 0, -0.82, 0));
      arms.push(sh);
      const lg = new THREE.Group(); lg.position.set(sx * 0.22, 0, 0); hip.add(lg);
      lg.add(K.at(K.box(0.34, 0.75, 0.38, mat.pants), 0, -0.4, 0));
      lg.add(K.at(K.box(0.38, 0.17, 0.52, mat.shoes), 0, -0.82, 0.06));
      const so = K.at(K.box(0.4, 0.1, 0.56, mat.sole), 0, -0.94, 0.06); lg.add(so); soles.push(so);
      const gh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.58), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.55 }));
      gh.position.copy(so.position); gh.visible = false; lg.add(gh); ghosts.push(gh);
      legs.push(lg);
    }
    const H = { root, hip, head, neck, arms, legs, soles, ghosts, eyes, pupils, brows, mouth, mat };

    // pose: all optional, everything blends with weights 0..1
    //   face: 'neutral' | 'shock' | 'happy' | 'worried' | 'angry'; talk: true opens/closes the mouth
    //   walk: speed (cycle), sit: 0..1, fall: 0..1 (slip backwards to sitting), shrug, point, wave, armsUp, jump
    //   look: [yaw, pitch] of head, lean, solesGone (0..1), blink (auto)
    H.pose = (t, o = {}) => {
      const sit = Math.max(o.sit || 0, o.fall || 0);
      const wk = o.walk || 0, ph = t * 7.5 * (o.walkSpeed || 1);
      const bob = wk ? Math.abs(Math.sin(ph)) * 0.06 * wk : Math.sin(t * 2.2) * 0.012;
      const jump = o.jump || 0;
      const soleDrop = (o.solesGone || 0) * 0.09;
      hip.position.y = 1.0 + bob - sit * 0.62 - soleDrop * (1 - sit) + jump * 0.8;
      hip.rotation.x = -(o.fall || 0) * 0.35 + (o.lean || 0);
      for (let i = 0; i < 2; i++) {
        const s = i ? -1 : 1;
        legs[i].rotation.x = Math.sin(ph + i * Math.PI) * 0.6 * wk * (1 - sit) - sit * (1.35 + i * 0.1) - jump * 0.3;
        let az = s * (0.1 + (o.shrug || 0) * 0.5 + (o.armsUp || 0) * 2.6 + (o.fall || 0) * 0.9);
        let ax = -Math.sin(ph + i * Math.PI) * 0.55 * wk - (o.fall || 0) * 0.4;
        if (o.point && i === 1) { ax = K.lerp(ax, -1.45, o.point); az = K.lerp(az, -0.15, o.point); }
        if (o.wave && i === 1) { az = K.lerp(az, -2.6 + Math.sin(t * 9) * 0.35, o.wave); }
        if (o.flail) { az += s * Math.abs(Math.sin(t * 14 + i)) * 0.7 * o.flail; ax += Math.sin(t * 11 + i * 2) * 0.4 * o.flail; }
        arms[i].rotation.set(ax, 0, az);
        soles[i].scale.set(1, Math.max(0.001, 1 - (o.solesGone || 0)), 1); soles[i].visible = (o.solesGone || 0) < 0.99;
        ghosts[i].visible = !!o.ghostSoles && (Math.floor(t * 4) % 2 === 0);
      }
      const look = o.look || [0, 0];
      head.rotation.set(look[1] + (o.shrug || 0) * 0.08, look[0] + (wk ? Math.sin(ph) * 0.04 : 0), (o.shrug || 0) * 0.12);
      // face
      const f = o.face || 'neutral';
      const blink = (o.blink !== false) && ((t % 3.7) < 0.12) ? 0.15 : 1;
      const eyeH = (f === 'shock' ? 1.35 : f === 'happy' ? 0.55 : f === 'angry' ? 0.75 : 1) * blink;
      for (const e of eyes) e.scale.set(1, eyeH, 1);
      for (const p of pupils) p.scale.set(f === 'shock' ? 0.8 : 1, (f === 'happy' ? 0.5 : 1) * blink, 1);
      brows.forEach((b, i) => {
        const s = i ? -1 : 1;
        b.position.y = f === 'shock' ? 0.28 : f === 'worried' ? 0.25 : 0.22;
        b.rotation.z = f === 'angry' ? s * 0.35 : f === 'worried' ? -s * 0.3 : 0;
      });
      let mw = 1, mh = 1;
      if (f === 'shock') { mw = 0.6; mh = 3.2; } else if (f === 'happy') { mw = 1.3; mh = 1.6; } else if (f === 'worried') { mw = 0.8; mh = 1; }
      if (o.talk) mh *= 1 + Math.abs(Math.sin(t * 17)) * 2.2;
      mouth.scale.set(mw, mh, 1);
      root.updateMatrixWorld();
    };
    H.pose(0);
    return H;
  };

  // the orange box buddy with ^ ^ eyes
  K.makePal = ({ color = 0xd9653b, legColor = 0x8a3a20 } = {}) => {
    const g = new THREE.Group(); K.add(g);
    const body = new THREE.Group(); g.add(body);
    body.add(K.at(K.box(1.1, 0.85, 0.85, K.M(color, { roughness: 0.6 })), 0, 0.75, 0));
    const black = K.M(0x111111), faces = { happy: new THREE.Group(), shock: new THREE.Group(), flat: new THREE.Group() };
    for (const [, grp] of Object.entries(faces)) body.add(grp);
    for (const ex of [-0.22, 0.22]) {
      for (const s of [-1, 1]) { const b = K.at(K.box(0.16, 0.05, 0.02, black, false), ex + s * 0.055, 0.86, 0.43); b.rotation.z = -s * 0.7; faces.happy.add(b); }
      faces.shock.add(K.at(K.box(0.13, 0.17, 0.02, black, false), ex, 0.86, 0.43));
      faces.flat.add(K.at(K.box(0.16, 0.05, 0.02, black, false), ex, 0.86, 0.43));
    }
    const legs = [];
    for (const [lx, lz] of [[-0.35, 0.25], [0.35, 0.25], [-0.35, -0.25], [0.35, -0.25]]) {
      const l = K.at(K.box(0.12, 0.35, 0.12, K.M(legColor)), lx, 0.17, lz); g.add(l); legs.push(l);
    }
    const P = { g, body, faces, legs };
    P.pose = (t, o = {}) => {
      const f = o.face || 'happy';
      for (const [k, grp] of Object.entries(faces)) grp.visible = k === f;
      body.position.y = (o.hop || 0) * 0.5 + Math.sin(t * 2.5) * 0.015;
      body.rotation.z = (o.wiggle || 0) * Math.sin(t * 6) * 0.1;
      body.scale.set(1 + (o.squash || 0) * 0.12, 1 - (o.squash || 0) * 0.15, 1);
      legs.forEach((l, i) => { l.position.y = 0.17 + (o.walk ? Math.max(0, Math.sin(t * 12 + i * Math.PI / 2)) * 0.08 : 0); });
    };
    P.pose(0);
    return P;
  };

  // ------------------------------------------------------------------ camera shots
  // shots: [{ t: [a, b], from: {pos, look}, to: {pos, look}, ease, shake(t) }]
  K.shoot = (t, shots) => {
    let s = shots[shots.length - 1];
    for (const x of shots) if (t >= x.t[0] && t < x.t[1]) { s = x; break; }
    const k = (s.ease || K.ease)((t - s.t[0]) / (s.t[1] - s.t[0]));
    const to = s.to || s.from;
    const p = s.from.pos.map((v, i) => K.lerp(v, to.pos[i], k)), l = s.from.look.map((v, i) => K.lerp(v, to.look[i], k));
    const sh = s.shake ? s.shake(t) : 0;
    K.cam.position.set(p[0] + Math.sin(t * 53) * sh, p[1] + Math.cos(t * 47) * sh, p[2]);
    K.cam.lookAt(l[0], l[1], l[2]);
  };

  // ------------------------------------------------------------------ boot: build the scene file, expose render(t)
  K.boot = () => {
    const S = window.SCENE;
    K.setup(S.setup || {});
    const update = S.build(K);
    window.render = t => { update(t); K.shoot(t, S.shots); K.renderer.render(K.scene, K.cam); return true; };
    window.meta = () => S.meta || {};
    window.ready = true;
  };
})();
