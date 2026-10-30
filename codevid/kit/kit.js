/* Verse code-video kit v2 (browser side; THREE and POST are globals set by page.html).
 * Everything is a pure function of time t, so any frame can be drawn in any order.
 *
 * A scene file sets:
 *   window.SCENE = {
 *     lines: [{ who: 'raju'|'bloc', text, say?, gap? }],     // dialogue; voices are generated from this
 *     build(K, T) -> { duration, update(t), shots, sfx?, counter?(t), badges?, big?, music? }
 *   }
 * T.lines[i] = { who, text, t, end } - real timings from the generated voices, so animation syncs to speech.
 */
(function () {
  const K = {};
  window.K = K;

  // ------------------------------------------------------------------ math + timeline helpers
  K.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  K.ease = x => { x = K.clamp(x); return x * x * (3 - 2 * x); };
  K.easeOut = x => { x = K.clamp(x); return 1 - Math.pow(1 - x, 3); };
  K.easeIn = x => { x = K.clamp(x); return x * x * x; };
  K.easeBack = x => { x = K.clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };  // overshoot
  K.lerp = (a, b, k) => a + (b - a) * k;
  K.prog = (t, a, b) => K.clamp((t - a) / (b - a));
  K.pulse = (t, a, d) => (t >= a && t < a + d) ? Math.sin((t - a) / d * Math.PI) : 0;
  K.wobble = (t, a, amp = 1, freq = 16, decay = 5) => t < a ? 0 : Math.sin((t - a) * freq) * amp * Math.exp(-(t - a) * decay);
  K.rng = (seed = 1) => { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  K.key = (t, keys, easeFn = K.ease) => {                     // [[t, value|array], ...] eased between keys
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i], k = easeFn((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((v, j) => K.lerp(v, v1[j], k)) : K.lerp(v0, v1, k);
    }
    return keys[keys.length - 1][1];
  };
  // pose track: [[t, {pose}], ...] - each pose holds until the next; numeric fields blend over `blend` s with overshoot
  K.track = (t, keys, blend = 0.32) => {
    let i = 0;
    while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const cur = Object.assign({}, K.POSES[keys[i][1].pose] || {}, keys[i][1]);
    if (i === 0 || t - keys[i][0] >= blend) return cur;
    const prev = Object.assign({}, K.POSES[keys[i - 1][1].pose] || {}, keys[i - 1][1]);
    const k = K.easeBack((t - keys[i][0]) / blend), out = Object.assign({}, cur);
    for (const f of new Set([...Object.keys(prev), ...Object.keys(cur)])) {
      const a = prev[f], b = cur[f];
      if (typeof (b ?? a) === 'number') out[f] = K.lerp(a || 0, b || 0, k);
      else if (Array.isArray(b ?? a)) out[f] = (b || [0, 0]).map((v, j) => K.lerp((a || [0, 0])[j], v, k));
    }
    return out;
  };
  K.POSES = {
    idle: {}, talk: { gesture: 1 }, point: { point: 1 }, think: { think: 1, face: 'worried', look: [0.15, 0.08] },
    shock: { armsUp: 0.45, lean: -0.12, face: 'shock' }, facepalm: { facepalm: 1, face: 'worried', look: [0, 0.15] },
    celebrate: { armsUp: 1, hopLoop: 1, face: 'happy' }, fall: { fall: 1, face: 'shock' }, sit: { sit: 1 },
    shrug: { shrug: 1, face: 'worried' }, smug: { face: 'smug', crossArms: 1 }, wave: { wave: 1, face: 'happy' },
  };

  // ------------------------------------------------------------------ renderer, bloom, scene
  K.setup = ({ width = 1080, height = 1920, bg = 0x0a0f33, fog = [40, 160], fov = 40, bloom = { strength: 0.42, radius: 0.45, threshold: 0.96 } } = {}) => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height); renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);
    if (fog) scene.fog = new THREE.Fog(bg, fog[0], fog[1]);
    const cam = new THREE.PerspectiveCamera(fov, width / height, 0.1, 600);
    let composer = null;
    if (bloom) {
      composer = new POST.EffectComposer(renderer);
      composer.addPass(new POST.RenderPass(scene, cam));
      composer.addPass(new POST.UnrealBloomPass(new THREE.Vector2(width / 2, height / 2), bloom.strength, bloom.radius, bloom.threshold));
      composer.addPass(new POST.OutputPass());
    }
    Object.assign(K, { renderer, scene, cam, composer, width, height });
    return K;
  };
  K.draw = () => (K.composer ? K.composer.render() : K.renderer.render(K.scene, K.cam));

  K.M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0.05 }, o));
  K.glow = (c, i = 2) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 });
  K.box = (w, h, d, mat, shadow = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = shadow; m.receiveShadow = true; return m; };
  K.add = (o, parent) => ((parent || K.scene).add(o), o);
  K.at = (o, x, y, z) => (o.position.set(x, y, z), o);
  K.group = (parent) => K.add(new THREE.Group(), parent);

  // canvas texture helper: draw(ctx, w, h)
  K.canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    t.redraw = fn => { ctx.clearRect(0, 0, w, h); fn(ctx, w, h); t.needsUpdate = true; };
    return t;
  };

  // ------------------------------------------------------------------ lights + sets
  K.lights = (preset = 'studio') => {
    const S = K.scene, L = {};
    if (preset === 'studio') {
      S.add(new THREE.HemisphereLight(0xc7d0ff, 0x1b1842, 1.25));
      S.add(new THREE.AmbientLight(0xffffff, 0.25));
      L.key = new THREE.DirectionalLight(0xfff3e0, 2.1); L.key.position.set(6, 14, 10);
      L.rim = new THREE.DirectionalLight(0x7f95ff, 1.8); L.rim.position.set(-9, 7, -8); S.add(L.rim);
      L.gold = new THREE.PointLight(0xffc24a, 7, 10, 1.8); L.gold.position.set(0, 2.6, -1.2); S.add(L.gold);
    } else if (preset === 'night') {
      S.add(new THREE.HemisphereLight(0xa9b8ff, 0x2a2440, 1.7)); S.add(new THREE.AmbientLight(0xffffff, 0.35));
      L.key = new THREE.DirectionalLight(0xbfd0ff, 2.0); L.key.position.set(-20, 40, -10);
    } else {
      S.add(new THREE.HemisphereLight(0xcfe8ff, 0x6b8f4a, 1.6)); S.add(new THREE.AmbientLight(0xffffff, 0.3));
      L.key = new THREE.DirectionalLight(0xfff1d6, 2.6); L.key.position.set(15, 35, -12);
    }
    L.key.castShadow = true; L.key.shadow.mapSize.set(2048, 2048); L.key.shadow.bias = -0.0005;
    Object.assign(L.key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 });
    S.add(L.key);
    return L;
  };
  K.stars = (n = 700, r = 200) => {
    const rnd = K.rng(99), g = new THREE.BufferGeometry(), p = [];
    for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, e = -0.1 + rnd() * 1.3; p.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    return K.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.0, fog: false })));
  };
  K.sets = {};
  K.sets.studio = ({ floor = 0x0d1240, grid = 0x3d4dff, radius = 60 } = {}) => {
    const g = K.group();
    const f = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), K.M(floor, { roughness: 0.55, metalness: 0.2 }));
    f.rotation.x = -Math.PI / 2; f.receiveShadow = true; g.add(f);
    const gh = new THREE.GridHelper(radius * 2, radius, grid, grid); gh.material.transparent = true; gh.material.opacity = 0.28; gh.position.y = 0.005; g.add(gh);
    // soft glowing ring around the stage
    const ring = new THREE.Mesh(new THREE.TorusGeometry(7, 0.05, 8, 96), K.glow(0x5a6bff, 1.6)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; g.add(ring);
    K.stars();
    return g;
  };

  // ------------------------------------------------------------------ money props (stylised, not real banknote designs)
  K.noteTex = (value = 500, color = '#9a8fb0') => K.canvasTex(256, 128, (x, w, h) => {
    x.fillStyle = color; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
    x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.arc(w * 0.3, h / 2, 34, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.font = 'bold 62px DejaVu Sans, sans-serif'; x.textAlign = 'right'; x.textBaseline = 'middle';
    x.fillText('₹' + value, w - 22, h / 2 + 3);
  });
  // a bundle of notes: box with a printed top + paper-edge sides + a paper band
  K.bundleMaterials = (value = 500, color = '#9a8fb0') => {
    const top = K.M(0xffffff, { map: K.noteTex(value, color), roughness: 0.8 });
    const edge = K.M(0xffffff, { roughness: 0.9, map: K.canvasTex(64, 64, (x, w, h) => { x.fillStyle = color; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.35)'; for (let y = 2; y < h; y += 5) x.fillRect(0, y, w, 1); }) });
    return [edge, edge, top, edge, edge, edge];
  };
  K.makeBundle = ({ value = 500, color = '#9a8fb0', mats } = {}) => {
    const g = K.group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.14, 0.32), mats || K.bundleMaterials(value, color)); b.castShadow = b.receiveShadow = true; g.add(b);
    g.add(K.at(K.box(0.12, 0.145, 0.325, K.M(0xf4ead2)), 0, 0, 0));          // paper band
    return g;
  };
  // a tower of bundles: setHeight(h) shows as many layers as fit
  K.makeCashTower = ({ cols = 3, rows = 3, maxLayers = 1200, value = 500, color = '#9a8fb0' } = {}) => {
    const geo = new THREE.BoxGeometry(0.66, 0.14, 0.32), per = cols * rows;
    const mesh = new THREE.InstancedMesh(geo, K.bundleMaterials(value, color), per * maxLayers);
    mesh.castShadow = true; mesh.receiveShadow = true;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), rnd = K.rng(5);
    let k = 0;
    for (let L = 0; L < maxLayers; L++) for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (rnd() - 0.5) * 0.06);
      m.compose(new THREE.Vector3((c - (cols - 1) / 2) * 0.68, 0.07 + L * 0.145, (r - (rows - 1) / 2) * 0.34), q, s);
      mesh.setMatrixAt(k++, m);
    }
    mesh.count = 0; mesh.frustumCulled = false; K.add(mesh);
    return { mesh, per, layerH: 0.145, setHeight(h) { mesh.count = Math.min(per * maxLayers, Math.max(0, Math.round(h / 0.145)) * per); }, height() { return mesh.count / per * 0.145; } };
  };
  K.makeCoin = ({ r = 0.22 } = {}) => {
    const tex = K.canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#f5c242'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c8901c'; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 54, 0, Math.PI * 2); x.stroke(); x.fillStyle = '#a8740f'; x.font = 'bold 70px DejaVu Sans, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹', 64, 68); });
    const side = K.M(0xf2b630, { metalness: 0.85, roughness: 0.3, emissive: 0x3a2500 });
    const face = K.M(0xffffff, { map: tex, metalness: 0.7, roughness: 0.35, emissive: 0x2a1a00 });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 32), [side, face, face]); c.castShadow = true;
    return K.add(c);
  };
  // floating sign with live text (e.g. "DAY 12"): sign.set(text)
  K.makeSign = ({ w = 2.4, h = 1.0, bg = '#ffffff', fg = '#111633', accent = '#f2b630' } = {}) => {
    let last = null;
    const tex = K.canvasTex(512, 220, () => {});
    const g = K.group();
    g.add(K.box(w + 0.12, h + 0.12, 0.12, K.M(0x1a1f4a)));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: 0xd8dcec }));
    face.position.z = 0.065; g.add(face);
    return { g, set(text, sub = '') {
      const key = text + '|' + sub; if (key === last) return; last = key;
      tex.redraw((x, W, H) => {
        x.fillStyle = bg; x.fillRect(0, 0, W, H); x.fillStyle = accent; x.fillRect(0, 0, W, 16);
        x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.font = `bold ${sub ? 96 : 120}px DejaVu Sans, sans-serif`; x.fillText(text, W / 2, sub ? H * 0.42 : H * 0.55);
        if (sub) { x.font = 'bold 44px DejaVu Sans, sans-serif'; x.fillStyle = '#6b7099'; x.fillText(sub, W / 2, H * 0.8); }
      });
    } };
  };
  // deterministic particles. spawn(i) -> { pos:[x,y,z], vel:[...], t0, life, spin? }
  K.particles = ({ n = 200, make, gravity = 9.8, floorY = 0, spawn }) => {
    const items = [];
    for (let i = 0; i < n; i++) { const m = make(i); m.visible = false; K.add(m); items.push({ m, p: spawn(i) }); }
    return { update(t) {
      for (const it of items) {
        const p = it.p, age = t - p.t0;
        if (age < 0 || age > p.life) { it.m.visible = false; continue; }
        it.m.visible = true;
        const drag = p.drag || 0, vy = p.vel[1];
        const y = p.pos[1] + vy * age - 0.5 * gravity * age * age;
        it.m.position.set(p.pos[0] + p.vel[0] * age * (1 - drag * age / 2), Math.max(floorY, y), p.pos[2] + p.vel[2] * age);
        if (p.spin) it.m.rotation.set(p.spin[0] * age, p.spin[1] * age, p.spin[2] * age);
      }
    } };
  };

  // ------------------------------------------------------------------ characters
  // Raju-style voxel person. H.pose(t, pose) every frame; pose fields blend via K.track.
  K.makePerson = ({ skin = 0xc98b5e, hair = 0x23160d, top = 0x2f6fe4, pants = 0x1d2340, shoes = 0xffffff, sole = 0x2b2b2b, accent = 0xffffff } = {}) => {
    const mat = { skin: K.M(skin), hair: K.M(hair), top: K.M(top), pants: K.M(pants), white: K.M(0xffffff), black: K.M(0x0d0d0d), shoes: K.M(shoes), sole: K.M(sole), mouth: K.M(0x4a1c12), accent: K.M(accent) };
    const root = K.group();
    const hip = K.group(root); hip.position.y = 1.0;
    hip.add(K.at(K.box(0.9, 0.95, 0.52, mat.top), 0, 0.48, 0));
    hip.add(K.at(K.box(0.6, 0.18, 0.06, mat.accent), 0, 0.2, 0.27));                     // hoodie pocket stripe
    for (const sx of [-0.12, 0.12]) hip.add(K.at(K.box(0.04, 0.3, 0.02, mat.white), sx, 0.66, 0.27));
    const neck = K.group(hip); neck.position.y = 0.95;
    const head = K.group(neck); head.position.y = 0.38;
    head.add(K.box(0.82, 0.8, 0.8, mat.skin));
    for (let i = 0; i < 12; i++) head.add(K.at(K.box(0.3, 0.24, 0.3, mat.hair), -0.3 + (i % 3) * 0.3, 0.42 + ((i * 7) % 3) * 0.04, -0.33 + Math.floor(i / 3) * 0.22));
    head.add(K.at(K.box(0.86, 0.16, 0.2, mat.hair), 0, 0.34, 0.34));
    head.add(K.at(K.box(0.12, 0.3, 0.6, mat.hair), -0.43, 0.2, -0.05)); head.add(K.at(K.box(0.12, 0.3, 0.6, mat.hair), 0.43, 0.2, -0.05));
    const eyes = [], pupils = [], brows = [];
    for (const ex of [-0.18, 0.18]) {
      eyes.push(K.add(K.at(K.box(0.2, 0.21, 0.02, mat.white, false), ex, 0.05, 0.41), head));
      pupils.push(K.add(K.at(K.box(0.1, 0.12, 0.02, mat.black, false), ex + 0.03, 0.04, 0.425), head));
      brows.push(K.add(K.at(K.box(0.24, 0.05, 0.02, mat.hair, false), ex, 0.22, 0.41), head));
    }
    const mouth = K.add(K.at(K.box(0.22, 0.05, 0.02, mat.mouth, false), 0, -0.2, 0.41), head);
    const arms = [], legs = [];
    for (const sx of [-1, 1]) {
      const sh = K.group(hip); sh.position.set(sx * 0.59, 0.86, 0);
      sh.add(K.at(K.box(0.27, 0.8, 0.31, mat.top), 0, -0.36, 0)); sh.add(K.at(K.box(0.23, 0.2, 0.23, mat.skin), 0, -0.82, 0));
      arms.push(sh);
      const lg = K.group(hip); lg.position.set(sx * 0.22, 0, 0);
      lg.add(K.at(K.box(0.35, 0.76, 0.39, mat.pants), 0, -0.4, 0));
      lg.add(K.at(K.box(0.39, 0.17, 0.53, mat.shoes), 0, -0.82, 0.06)); lg.add(K.at(K.box(0.41, 0.08, 0.56, mat.sole), 0, -0.94, 0.06));
      legs.push(lg);
    }
    const H = { root, hip, head, neck, arms, legs, eyes, pupils, brows, mouth, mat };
    H.pose = (t, o = {}) => {
      const sit = Math.max(o.sit || 0, o.fall || 0), wk = o.walk || 0, ph = t * 7.5;
      const breathe = Math.sin(t * 2.1) * 0.012, bob = wk ? Math.abs(Math.sin(ph)) * 0.06 * wk : breathe;
      const hop = (o.jump || 0) + (o.hopLoop ? Math.abs(Math.sin(t * 7)) * 0.35 * o.hopLoop : 0);
      hip.position.y = 1.0 + bob - sit * 0.62 + hop * 0.8;
      hip.rotation.x = -(o.fall || 0) * 0.35 + (o.lean || 0) + (o.talking ? Math.sin(t * 5) * 0.02 : 0);
      hip.rotation.y = (o.turn || 0);
      for (let i = 0; i < 2; i++) {
        const s = i ? -1 : 1, R = i === 1;
        legs[i].rotation.x = Math.sin(ph + i * Math.PI) * 0.6 * wk * (1 - sit) - sit * (1.35 + i * 0.1) - hop * 0.25;
        let ax = -Math.sin(ph + i * Math.PI) * 0.55 * wk - (o.fall || 0) * 0.4, az = s * (0.1 + (o.shrug || 0) * 0.55 + (o.armsUp || 0) * 2.6 + (o.fall || 0) * 0.9);
        if (o.gesture && o.talking) { ax += -0.35 * o.gesture - Math.sin(t * 6 + i * 2) * 0.18 * o.gesture; az += s * 0.15 * o.gesture; }
        if (R && o.point) { ax = K.lerp(ax, -1.5, o.point); az = K.lerp(az, -0.2, o.point); }
        if (R && o.think) { ax = K.lerp(ax, -2.35, o.think); az = K.lerp(az, 0.55, o.think); }
        if (R && o.facepalm) { ax = K.lerp(ax, -2.75, o.facepalm); az = K.lerp(az, 0.3, o.facepalm); }
        if (R && o.wave) { az = K.lerp(az, -2.6 + Math.sin(t * 9) * 0.35, o.wave); }
        if (o.crossArms) { ax = K.lerp(ax, -1.25, o.crossArms); az = K.lerp(az, -s * 0.85, o.crossArms); }
        if (o.flail) { az += s * Math.abs(Math.sin(t * 14 + i)) * 0.7 * o.flail; ax += Math.sin(t * 11 + i * 2) * 0.4 * o.flail; }
        arms[i].rotation.set(ax, 0, az);
      }
      const look = o.look || [0, 0];
      head.rotation.set(look[1] + (o.shrug || 0) * 0.08 + (o.talking ? Math.sin(t * 4.3) * 0.03 : 0), look[0], (o.shrug || 0) * 0.12 + (o.tilt || 0));
      const f = o.face || 'neutral';
      const blink = ((t + (o.blinkOffset || 0)) % 3.3) < 0.11 ? 0.12 : 1;
      const eh = (f === 'shock' ? 1.35 : f === 'happy' ? 0.55 : f === 'smug' ? 0.6 : f === 'angry' ? 0.75 : 1) * blink;
      for (const e of eyes) e.scale.set(1, eh, 1);
      pupils.forEach(p => { p.scale.set(f === 'shock' ? 0.75 : 1, (f === 'happy' || f === 'smug' ? 0.5 : 1) * blink, 1); p.position.x = p.position.x; });
      brows.forEach((b, i) => { const s = i ? -1 : 1; b.position.y = f === 'shock' ? 0.29 : f === 'worried' ? 0.25 : 0.22; b.rotation.z = f === 'angry' ? s * 0.35 : f === 'worried' ? -s * 0.3 : f === 'smug' ? s * 0.12 : 0; });
      let mw = 1, mh = 1;
      if (f === 'shock') { mw = 0.65; mh = 3.4; } else if (f === 'happy') { mw = 1.35; mh = 1.6; } else if (f === 'smug') { mw = 1.2; mh = 1; } else if (f === 'worried') mw = 0.8;
      if (o.talking) mh *= 1 + Math.abs(Math.sin(t * 15.5) * Math.sin(t * 6.1 + 1)) * 2.6;
      mouth.scale.set(mw, mh, 1);
    };
    H.pose(0);
    return H;
  };

  // Bloc: golden box buddy with stubby arms and a talking mouth
  K.makeBloc = ({ color = 0xffc53d, legColor = 0x9a6a10 } = {}) => {
    const g = K.group(), body = K.group(g);
    const mat = K.M(color, { roughness: 0.32, metalness: 0.35, emissive: 0x5a3a00, emissiveIntensity: 0.9 });
    body.add(K.at(K.box(1.15, 0.9, 0.9, mat), 0, 0.82, 0));
    body.add(K.at(K.box(1.19, 0.08, 0.94, K.M(0xffe08a, { metalness: 0.6, roughness: 0.3 })), 0, 1.25, 0));   // top bevel
    const black = K.M(0x111111), faces = { happy: K.group(body), dots: K.group(body), shock: K.group(body), closed: K.group(body), sly: K.group(body) };
    for (const ex of [-0.22, 0.22]) {
      for (const s of [-1, 1]) { const b = K.at(K.box(0.16, 0.05, 0.02, black, false), ex + s * 0.055, 0.95, 0.46); b.rotation.z = -s * 0.7; faces.happy.add(b); }
      faces.dots.add(K.at(K.box(0.12, 0.14, 0.02, black, false), ex, 0.95, 0.46));
      faces.shock.add(K.at(K.box(0.15, 0.2, 0.02, black, false), ex, 0.96, 0.46));
      faces.closed.add(K.at(K.box(0.17, 0.04, 0.02, black, false), ex, 0.94, 0.46));
      const sl = K.at(K.box(0.16, 0.06, 0.02, black, false), ex, 0.95, 0.46); sl.rotation.z = ex < 0 ? -0.25 : 0.25; faces.sly.add(sl);
    }
    const mouth = K.add(K.at(K.box(0.2, 0.05, 0.02, K.M(0x5a2a06), false), 0, 0.72, 0.46), body);
    const arms = [];
    for (const sx of [-1, 1]) { const a = K.group(body); a.position.set(sx * 0.6, 0.85, 0); a.add(K.at(K.box(0.14, 0.38, 0.14, mat), 0, -0.17, 0)); arms.push(a); }
    const legs = [];
    for (const [lx, lz] of [[-0.35, 0.25], [0.35, 0.25], [-0.35, -0.25], [0.35, -0.25]]) legs.push(K.add(K.at(K.box(0.13, 0.4, 0.13, K.M(legColor)), lx, 0.2, lz), g));
    const B = { g, body, faces, mouth, arms, legs };
    B.pose = (t, o = {}) => {
      const f = o.face || 'happy';
      for (const [k, grp] of Object.entries(faces)) grp.visible = k === f && !(f !== 'closed' && ((t + 1.3) % 3.9) < 0.1);
      if (f !== 'closed' && ((t + 1.3) % 3.9) < 0.1) faces.closed.visible = true;
      const hop = (o.jump || 0) + (o.hopLoop ? Math.abs(Math.sin(t * 7)) * 0.4 * o.hopLoop : 0);
      body.position.y = hop * 0.6 + Math.sin(t * 2.4) * 0.015 + (o.talking ? Math.abs(Math.sin(t * 7.5)) * 0.03 : 0);
      body.rotation.z = (o.wiggle || 0) * Math.sin(t * 6) * 0.1 + (o.tilt || 0);
      body.rotation.y = o.turn || 0;
      body.scale.set(1 + (o.squash || 0) * 0.12, 1 - (o.squash || 0) * 0.15, 1);
      mouth.scale.set(o.talking ? 1.1 : 1, o.talking ? 1 + Math.abs(Math.sin(t * 15) * Math.sin(t * 5.3 + 2)) * 3.2 : (f === 'shock' ? 3 : 1), 1);
      arms.forEach((a, i) => {
        const s = i ? -1 : 1, R = i === 1;
        let ax = o.talking ? -0.3 - Math.sin(t * 6 + i) * 0.25 : 0, az = s * 0.15 + s * (o.armsUp || 0) * 2.4;
        if (R && o.point) { ax = K.lerp(ax, -1.5, o.point); az = K.lerp(az, -0.1, o.point); }
        if (R && o.wave) az = K.lerp(az, -2.5 + Math.sin(t * 9) * 0.4, o.wave);
        a.rotation.set(ax, 0, az);
      });
      legs.forEach((l, i) => { l.position.y = 0.2 + (o.walk ? Math.max(0, Math.sin(t * 12 + i * Math.PI / 2)) * 0.08 : 0) + hop * 0.3; });
    };
    B.pose(0);
    return B;
  };

  // ------------------------------------------------------------------ camera shots
  // shots: [{ t:[a,b], from:{pos,look}, to?:{pos,look}, ease?, shake?(t) }]
  K.shoot = (t, shots) => {
    let s = shots[shots.length - 1];
    for (const x of shots) if (t >= x.t[0] && t < x.t[1]) { s = x; break; }
    const k = (s.ease || K.ease)((t - s.t[0]) / Math.max(0.001, s.t[1] - s.t[0]));
    const to = s.to || s.from;
    const p = s.from.pos.map((v, i) => K.lerp(v, to.pos[i], k)), l = s.from.look.map((v, i) => K.lerp(v, to.look[i], k));
    const sh = s.shake ? s.shake(t) : 0;
    K.cam.position.set(p[0] + Math.sin(t * 53) * sh, p[1] + Math.cos(t * 47) * sh, p[2]);
    K.cam.lookAt(l[0], l[1], l[2]);
    if (s.fov) { K.cam.fov = s.fov; K.cam.updateProjectionMatrix(); }
  };

  // ------------------------------------------------------------------ motion-graphics toolkit
  // vertical gradient sky (CSS colours)
  K.gradientBg = (top = '#0c4a42', bottom = '#16806a', glow = 'rgba(255,214,102,0.18)') => {
    const tex = K.canvasTex(64, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      const r = x.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, h * 0.5); r.addColorStop(0, glow); r.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = r; x.fillRect(0, 0, w, h);
    });
    K.scene.background = tex; K.scene.fog = null; return tex;
  };
  // rounded-rect helper for canvas drawings
  K.rrect = (x, X, Y, W, H, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); };
  // flat motion-graphics card in 3D: card.draw(fn(ctx,w,h)) redraws; card.g is the group to animate
  K.card = ({ w = 2.6, h = 1.2, px = 160, bg = '#ffffff', radius = 0.12, shadow = true } = {}) => {
    const PW = Math.round(w * px), PH = Math.round(h * px), R = radius * px;
    const tex = K.canvasTex(PW, PH, () => {});
    const g = K.group();
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: 0xeeeeee, depthWrite: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); plane.renderOrder = 10; g.add(plane);
    if (shadow) {
      const st = K.canvasTex(PW, PH, (x, W, H) => { x.filter = 'blur(14px)'; x.fillStyle = 'rgba(0,0,0,0.35)'; K.rrect(x, 18, 26, W - 36, H - 36, R); x.fill(); });
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.04, h * 1.08), new THREE.MeshBasicMaterial({ map: st, transparent: true, depthWrite: false }));
      sp.position.set(0.03, -0.06, -0.01); sp.renderOrder = 9; g.add(sp);
    }
    let last = null;
    const card = { g, mat, tex, w, h,
      draw(fn, key) {
        if (key !== undefined && key === last) return; last = key;
        tex.redraw((x, W, H) => { x.save(); K.rrect(x, 0, 0, W, H, R); x.clip(); x.fillStyle = bg; x.fillRect(0, 0, W, H); fn(x, W, H); x.restore(); });
      },
      // pop-in / out animation: scale with overshoot, fade
      show(t, tin, tout = 1e9, from = 'scale') {
        const kin = K.easeBack(K.prog(t, tin, tin + 0.4)), kout = K.easeIn(K.prog(t, tout, tout + 0.3));
        const vis = t >= tin && t < tout + 0.3; g.visible = vis;
        if (!vis) return 0;
        const k = kin * (1 - kout);
        if (from === 'scale') g.scale.setScalar(Math.max(0.001, k));
        else { g.scale.setScalar(1); g.position.x = g.userData.x0 + (1 - kin) * (from === 'left' ? -4 : 4) + kout * (from === 'left' ? -4 : 4); }
        mat.opacity = Math.min(1, kin * 1.5) * (1 - kout);
        return k;
      } };
    return card;
  };
  // text helper for cards
  K.text = (x, str, X, Y, { size = 60, color = '#14213d', weight = 'bold', align = 'center', font = 'DejaVu Sans', max } = {}) => {
    const lim = max || x.canvas.width * 0.88;               // auto-shrink so text never spills off its card
    x.font = `${weight} ${size}px ${font}, sans-serif`;
    const w = x.measureText(str).width; if (w > lim) { size = Math.floor(size * lim / w); x.font = `${weight} ${size}px ${font}, sans-serif`; }
    x.fillStyle = color; x.textAlign = align; x.textBaseline = 'middle'; x.fillText(str, X, Y);
  };
  // rotating sunburst rays behind characters
  K.sunburst = ({ r = 9, rays = 18, a = 'rgba(255,214,102,0.13)', b = 'rgba(255,255,255,0.0)' } = {}) => {
    const tex = K.canvasTex(1024, 1024, (x, W, H) => {
      for (let i = 0; i < rays; i++) { x.beginPath(); x.moveTo(W / 2, H / 2); x.arc(W / 2, H / 2, W / 2, (i / rays) * Math.PI * 2, ((i + 0.5) / rays) * Math.PI * 2); x.closePath(); x.fillStyle = i % 2 ? b : a; x.fill(); }
      const g = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = g; x.fillRect(0, 0, W, H);
    });
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.renderOrder = -1; return K.add(m);
  };
  // confetti burst: K.confetti({at:[x,y,z], t0, n})
  K.confetti = ({ at = [0, 2, 0], t0 = 0, n = 120, colors = [0xffc53d, 0xff7a2f, 0x3ddc97, 0xffffff, 0x4da3ff], spread = 3.2, seed = 3 }) => {
    const r = K.rng(seed), geo = new THREE.PlaneGeometry(0.09, 0.05), mats = colors.map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    return K.particles({ n, gravity: 4.5, floorY: -5, make: i => new THREE.Mesh(geo, mats[i % mats.length]),
      spawn: () => { const a = r() * Math.PI * 2, s = 1 + r() * spread; return { pos: at, vel: [Math.cos(a) * s, 2.5 + r() * 4, Math.sin(a) * s * 0.4], t0: t0 + r() * 0.08, life: 2.6, spin: [r() * 14, r() * 12, r() * 16] }; } });
  };

  // Chotu: round golden buddy with big cartoon eyes, a ₹ belly badge, little arms and feet
  K.makeChotu = ({ color = 0xffc53d } = {}) => {
    const g = K.group(), body = K.group(g), R = 0.6;
    const gold = K.M(color, { roughness: 0.28, metalness: 0.35, emissive: 0x5a3a00, emissiveIntensity: 0.55 });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32), gold); ball.castShadow = true; ball.position.y = 0.78; ball.scale.set(1, 0.95, 0.92); body.add(ball);
    const onFace = (x, y, z = 0.004) => { const zz = Math.sqrt(Math.max(0, R * R * 0.92 * 0.92 - x * x - (y) * (y))) ; return [x, 0.78 + y, zz + z]; };
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff }), black = new THREE.MeshBasicMaterial({ color: 0x14110d });
    const disc = (r, m) => new THREE.Mesh(new THREE.CircleGeometry(r, 32), m);
    const eyes = [], pupils = [], shines = [];
    for (const ex of [-0.2, 0.2]) {
      const e = disc(0.13, white); e.position.set(...onFace(ex, 0.12, 0.01)); e.scale.set(1, 1.18, 1); e.lookAt(e.position.clone().multiplyScalar(2).setY(e.position.y)); body.add(e); eyes.push(e);
      const p = disc(0.075, black); p.position.set(...onFace(ex + 0.015, 0.1, 0.02)); p.lookAt(p.position.clone().multiplyScalar(2).setY(p.position.y)); body.add(p); pupils.push(p);
      const sh = disc(0.025, white); sh.position.set(...onFace(ex + 0.045, 0.15, 0.03)); sh.lookAt(sh.position.clone().multiplyScalar(2).setY(sh.position.y)); body.add(sh); shines.push(sh);
    }
    const happy = K.group(body);
    for (const ex of [-0.2, 0.2]) { const arc = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 24, Math.PI), black); arc.position.set(...onFace(ex, 0.1, 0.02)); happy.add(arc); }
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0x5a1f0a }));
    mouth.position.set(...onFace(0, -0.1, 0.02)); body.add(mouth);
    const cheek = new THREE.MeshBasicMaterial({ color: 0xff8a5c, transparent: true, opacity: 0.55 });
    for (const cx of [-0.36, 0.36]) { const c = disc(0.06, cheek); c.position.set(...onFace(cx, -0.04, 0.012)); c.lookAt(c.position.clone().multiplyScalar(2).setY(c.position.y)); body.add(c); }
    const badge = K.canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#fff3c4'; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c8901c'; x.font = 'bold 84px DejaVu Sans, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹', 64, 70); });
    const bd = new THREE.Mesh(new THREE.CircleGeometry(0.11, 32), new THREE.MeshBasicMaterial({ map: badge, transparent: true }));
    bd.position.set(...onFace(0, -0.33, 0.03)); bd.lookAt(bd.position.clone().multiplyScalar(2).setY(bd.position.y - 0.2)); body.add(bd);
    const arms = [];
    for (const sx of [-1, 1]) { const a = K.group(body); a.position.set(sx * 0.56, 0.82, 0); const cap = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.26, 6, 12), gold); cap.position.y = -0.16; cap.castShadow = true; a.add(cap); arms.push(a); }
    const feet = [];
    for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), K.M(0xe0a020, { roughness: 0.4 })); f.scale.set(1, 0.7, 1.3); f.position.set(sx * 0.24, 0.0, 0.05); f.castShadow = true; g.add(f); feet.push(f); }
    const C = { g, body, eyes, pupils, shines, happy, mouth, arms, feet };
    C.pose = (t, o = {}) => {
      const f = o.face || 'open';
      const blink = ((t + 0.7) % 3.6) < 0.1;
      const open = f !== 'happy' && !blink;
      eyes.forEach(e => { e.visible = open; e.scale.set(1, f === 'shock' ? 1.45 : 1.18, 1); });
      pupils.forEach(p => { p.visible = open; p.scale.setScalar(f === 'shock' ? 0.7 : 1); }); shines.forEach(s => s.visible = open);
      happy.visible = !open;
      const hop = (o.jump || 0) + (o.hopLoop ? Math.abs(Math.sin(t * 7)) * 0.45 * o.hopLoop : 0);
      const land = o.squash || 0;
      body.position.y = hop * 0.7 + Math.sin(t * 2.6) * 0.02 + (o.talking ? Math.abs(Math.sin(t * 8)) * 0.035 : 0);
      body.scale.set(1 + land * 0.18, 1 - land * 0.2, 1 + land * 0.18);
      body.rotation.z = (o.wiggle || 0) * Math.sin(t * 7) * 0.12 + (o.tilt || 0);
      body.rotation.y = o.turn || 0;
      const talk = o.talking ? 0.5 + Math.abs(Math.sin(t * 15) * Math.sin(t * 5.7 + 1)) * 1.7 : (f === 'shock' ? 1.6 : 0.65);
      mouth.scale.set(o.talking ? 1.15 : 1, talk, 1);
      arms.forEach((a, i) => {
        const s = i ? -1 : 1, Rt = i === 1;
        let az = s * 0.35 + s * (o.armsUp || 0) * 2.2 + (o.talking ? s * Math.abs(Math.sin(t * 6 + i)) * 0.4 : 0), ax = o.talking ? -0.25 : 0;
        if (Rt && o.point) { ax = K.lerp(ax, -1.4, o.point); az = K.lerp(az, -0.1, o.point); }
        if (Rt && o.wave) az = K.lerp(az, -2.4 + Math.sin(t * 9) * 0.4, o.wave);
        a.rotation.set(ax, 0, az);
      });
      feet.forEach((ft, i) => { ft.position.y = o.walk ? Math.max(0, Math.sin(t * 12 + i * Math.PI)) * 0.08 : 0; });
    };
    C.pose(0);
    return C;
  };

  // Maddie v2 - modelled on the creator's photo: tall textured quiff, faded sides, thick brows, full short beard,
  // dark collared shirt, sunglasses. style: 'voxel' (blocky) or 'smooth' (rounded cartoon). Same pose API as makePerson.
  K.makeMaddie = ({ style = 'voxel', sunglasses = true, skin = 0xa86a42, hair = 0x17100b, shirt = 0x1b2130, pants = 0x2c3448, shoes = 0xf2f2f2 } = {}) => {
    const P = K.makePerson({ skin, hair, top: shirt, pants, shoes, accent: shirt });
    const { head, hip, mat, brows, eyes, pupils, mouth } = P;
    const smooth = style === 'smooth';
    const hairM = K.M(hair, { roughness: 0.9 }), hairD = K.M(0x0f0a07, { roughness: 0.95 }), beardM = K.M(0x140d09, { roughness: 1 });
    const shade = new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.08, metalness: 0.85 });
    const frame = K.M(0x0b0b0e, { roughness: 0.3, metalness: 0.5 });
    // clear the old hair + hoodie details
    head.children.filter(c => c.material === mat.hair && !brows.includes(c)).forEach(c => head.remove(c));
    hip.children.filter(c => c.material === mat.white || c.material === mat.accent).forEach(c => hip.remove(c));
    const add = (m, x, y, z, parent = head) => { m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
    const B = (w, h, d, m) => K.box(w, h, d, m);
    const rr = K.rng(42);
    if (!smooth) {
      add(B(0.07, 0.24, 0.62, hairD), -0.43, 0.27, -0.06); add(B(0.07, 0.24, 0.62, hairD), 0.43, 0.27, -0.06);     // faded sides
      add(B(0.86, 0.46, 0.08, hairD), 0, 0.17, -0.42);                                                                  // back
      add(B(0.86, 0.14, 0.86, hairM), 0, 0.46, -0.01);                                                                  // top slab
      const rows = [[0.3, 0.3], [0.1, 0.25], [-0.12, 0.19], [-0.32, 0.12]];                                           // swept-back quiff, tallest at front
      rows.forEach(([z, h], r) => { for (let c = 0; c < 5; c++) {
        const hh = h + (rr() - 0.5) * 0.06, m = add(B(0.19, hh, 0.3, (r + c) % 3 ? hairM : hairD), -0.36 + c * 0.18 + (rr() - 0.5) * 0.04, 0.5 + hh / 2 - 0.03, z);
        m.rotation.set(-0.5 - rr() * 0.15, (rr() - 0.5) * 0.2, (rr() - 0.5) * 0.12); } });
      add(B(0.8, 0.09, 0.12, hairM), 0, 0.42, 0.37);                                                                    // hairline
      for (const sx of [-1, 1]) add(B(0.06, 0.18, 0.12, mat.skin), sx * 0.44, 0.0, 0.02);                              // ears
      // beard on the jaw only (cheeks stay clear), chin, sides of the mouth, moustache
      for (const sx of [-1, 1]) { add(B(0.05, 0.27, 0.42, beardM), sx * 0.41, -0.27, 0.19); add(B(0.07, 0.14, 0.04, beardM), sx * 0.18, -0.26, 0.41); }
      add(B(0.7, 0.1, 0.05, beardM), 0, -0.36, 0.405); add(B(0.62, 0.09, 0.46, beardM), 0, -0.44, 0.16);
      add(B(0.34, 0.055, 0.04, beardM), 0, -0.13, 0.42);
      brows.forEach(b => b.scale.set(1.15, 1.7, 1));
    } else {
      head.children[0].visible = false;                                                                                 // swap the box head for a rounded one
      const hs = [1, 1.08, 0.97];
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.44, 40, 28), mat.skin); ball.scale.set(...hs); add(ball, 0, 0, 0);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mat.skin); e.scale.set(0.6, 1, 0.8); add(e, sx * 0.44, 0.0, 0.0); }
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), mat.skin); nose.scale.set(1.1, 0.9, 0.9); add(nose, 0, -0.05, 0.42);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.455, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.4), hairD); cap.scale.set(...hs); cap.rotation.x = -0.12; add(cap, 0, 0.02, -0.02);
      const vol = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 20), hairM); vol.scale.set(1.18, 0.6, 1.12); vol.rotation.x = -0.28; add(vol, 0, 0.44, 0.0);
      const lift = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 20), hairM); lift.scale.set(1.45, 0.62, 0.85); lift.rotation.x = -0.45; add(lift, 0, 0.56, 0.2);
      for (let i = 0; i < 22; i++) {                                                                                    // texture bumps on top
        const x = (rr() - 0.5) * 0.66, z = -0.25 + rr() * 0.55, k = (z + 0.25) / 0.55;
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.06 + rr() * 0.04, 12, 8), rr() > 0.5 ? hairM : hairD);
        add(s, x, 0.55 + k * 0.17 - x * x * 0.6 + rr() * 0.03, z);
      }
      const beard = new THREE.Mesh(new THREE.SphereGeometry(0.452, 40, 20, 0, Math.PI, Math.PI * 0.63, Math.PI * 0.34), beardM);
      beard.scale.set(...hs); beard.rotation.y = 0; add(beard, 0, -0.01, 0.005);
      const mus = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.26, 6, 12), beardM); mus.rotation.z = Math.PI / 2; add(mus, 0, -0.14, 0.415);
      brows.forEach(b => { b.position.z = 0.385; b.scale.set(1.15, 1.7, 1); });
      mouth.position.z = 0.43;
      // round the body: boxes -> capsules of the same size
      const roundify = m => {
        const p = m.geometry.parameters; if (!p || !p.height || m.parent === head) return;
        const r = Math.min(p.width, p.depth) / 2, len = Math.max(0.001, p.height - 2 * r);
        m.geometry = new THREE.CapsuleGeometry(r, len, 8, 16); m.scale.set(p.width / (2 * r), 1, p.depth / (2 * r));
      };
      P.root.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.parent !== head) roundify(o); });
    }
    // collared shirt: collar, placket, buttons, neck V
    const collarM = K.M(0x252c3f, { roughness: 0.8 });
    for (const sx of [-1, 1]) { const c = add(B(0.24, 0.13, 0.06, collarM), sx * 0.13, 0.9, 0.27, hip); c.rotation.z = sx * 0.55; }
    add(B(0.17, 0.15, 0.02, mat.skin), 0, 0.86, 0.262, hip);
    add(B(0.05, 0.72, 0.02, collarM), 0, 0.42, 0.268, hip);
    for (let i = 0; i < 4; i++) add(B(0.04, 0.04, 0.02, K.M(0x3a4258)), 0, 0.68 - i * 0.18, 0.28, hip);
    if (sunglasses) {
      eyes.forEach(e => e.visible = false); pupils.forEach(p => p.visible = false);
      const z = smooth ? 0.425 : 0.43;
      for (const sx of [-1, 1]) {
        const lens = smooth ? new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.03, 32), shade) : B(0.29, 0.18, 0.03, shade);
        if (smooth) { lens.rotation.x = Math.PI / 2; lens.scale.set(1.12, 1, 0.78); }
        add(lens, sx * 0.18, 0.04, z);
        add(B(0.04, 0.035, 0.5, frame), sx * (smooth ? 0.41 : 0.43), 0.1, 0.16);
      }
      add(B(0.78, 0.035, 0.04, frame), 0, 0.12, z + 0.005); add(B(0.08, 0.03, 0.03, frame), 0, 0.07, z + 0.01);
    }
    return P;
  };

  // Smooth low-poly "guy": realistic proportions, small round head, dot eyes, plain tee. Same pose API as makePerson.
  K.makeGuy = ({ skin = 0xe9c4a6, hair = 0xdcc58a, tee = 0x2f6fe4, pants = 0x3a3d46, shoes = 0x24262c, beard = null, sunglasses = false } = {}) => {
    const P = K.makePerson({ skin, hair, top: tee, pants, shoes });
    const { root, hip, head, neck, arms, legs, eyes, pupils, brows, mouth } = P;
    root.traverse(o => { if (o.isMesh) o.visible = false; });                          // keep the rig, rebuild the look
    const M = (c, r = 0.75, flat = false) => K.M(c, { roughness: r, flatShading: flat });
    const skinM = M(skin, 0.6), teeM = M(tee, 0.85), pantsM = M(pants, 0.9), shoeM = M(shoes, 0.6), hairM = M(hair, 0.9, true), dark = M(0x111111, 0.4);
    const faceM = M(skin, 0.6, true);
    const mesh = (g, m, parent, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
    const cap = (r, len, seg = 7) => new THREE.CapsuleGeometry(r, len, 3, seg);
    const taper = (r1, r2, h, seg = 9) => new THREE.CylinderGeometry(r1, r2, h, seg);
    const ico = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
    // pelvis (waistband), torso tapering from chest to waist, rounded shoulders, neck
    const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
    const pelvis = mesh(lathe([[0.001, -0.14], [0.16, -0.12], [0.235, -0.04], [0.245, 0.06], [0.23, 0.16], [0.001, 0.17]]), pantsM, hip, 0, 0, 0); pelvis.scale.z = 0.68;
    const torso = mesh(lathe([[0.226, 0.1], [0.222, 0.2], [0.24, 0.34], [0.28, 0.5], [0.295, 0.6], [0.27, 0.68], [0.2, 0.735], [0.1, 0.76], [0.001, 0.765]]), teeM, hip, 0, 0, 0); torso.scale.z = 0.64;
    for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.11, 18, 12), teeM, hip, sx * 0.25, 0.64, 0).scale.set(1.1, 0.8, 0.95);
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12), M(0x1f55c4, 0.85), hip, 0, 0.73, 0.0).scale.z = 0.8;     // collar ring
    mesh(taper(0.064, 0.072, 0.12, 10), skinM, hip, 0, 0.76, 0);
    neck.position.y = 0.72;
    // head (built at makePerson's head scale, then shrunk to human proportions)
    head.scale.setScalar(0.47); head.position.y = 0.24;
    const ball = mesh(ico(0.42, 2), faceM, head, 0, 0, 0); ball.scale.set(0.9, 1.08, 0.95);
    const jaw = mesh(ico(0.3, 2), faceM, head, 0, -0.18, 0.05); jaw.scale.set(1, 0.7, 0.95);
    for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.08, 8, 6), skinM, head, sx * 0.38, 0.0, -0.02).scale.set(0.55, 1, 0.8);
    mesh(new THREE.SphereGeometry(0.06, 8, 6), skinM, head, 0, -0.05, 0.4);
    head.add(K.sweptHair(hairM));
    eyes.length = 0; pupils.length = 0; brows.length = 0;
    for (const sx of [-1, 1]) {
      eyes.push(mesh(new THREE.SphereGeometry(0.045, 8, 6), dark, head, sx * 0.14, 0.04, 0.37));
      const b = mesh(new THREE.BoxGeometry(0.13, 0.03, 0.03), M(beard || hair, 0.9), head, sx * 0.15, 0.22, 0.34); brows.push(b);
    }
    mouth.visible = true; mouth.position.set(0, -0.19, 0.37); mouth.geometry = new THREE.BoxGeometry(0.1, 0.028, 0.02); mouth.position.z = 0.385;
    if (beard) {
      const bm = M(beard, 1);
      const sh = mesh(new THREE.SphereGeometry(0.435, 14, 8, 0, Math.PI, Math.PI * 0.66, Math.PI * 0.3), bm, head, 0, -0.01, 0.005); sh.scale.set(0.93, 1.06, 0.96);
      mesh(cap(0.025, 0.2), bm, head, 0, -0.13, 0.385).rotation.z = Math.PI / 2;
      mouth.position.z = 0.41;
    }
    if (sunglasses) {
      eyes.forEach(e => e.visible = false);
      const sm = new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: 0.08, metalness: 0.85 });
      for (const sx of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), sm, head, sx * 0.15, 0.05, 0.37); l.rotation.x = Math.PI / 2; l.scale.set(1.1, 1, 0.8); }
      mesh(new THREE.BoxGeometry(0.62, 0.03, 0.03), sm, head, 0, 0.12, 0.37);
    }
    // arms: sleeve, upper arm, elbow joint (relaxed bend), forearm, hand
    const elbows = [];
    arms.forEach((a, i) => { const sx = i ? 1 : -1; a.position.set(sx * 0.3, 0.64, 0);
      mesh(new THREE.CylinderGeometry(0.102, 0.092, 0.25, 20), teeM, a, 0, -0.08, 0);
      mesh(new THREE.CylinderGeometry(0.075, 0.066, 0.2, 18), skinM, a, 0, -0.27, 0);
      const el = new THREE.Group(); el.position.y = -0.37; a.add(el); elbows.push(el);
      mesh(new THREE.SphereGeometry(0.066, 16, 12), skinM, el, 0, 0, 0);
      mesh(new THREE.CylinderGeometry(0.064, 0.05, 0.3, 18), skinM, el, 0, -0.15, 0);
      const hand = mesh(new THREE.SphereGeometry(0.058, 16, 12), skinM, el, 0, -0.34, 0.01); hand.scale.set(0.8, 1.35, 0.62);
      el.rotation.x = -0.32; });
    P.elbows = elbows;
    // legs: thigh, knee, calf, shoe
    legs.forEach((l, i) => { const sx = i ? 1 : -1; l.position.x = sx * 0.12;
      mesh(new THREE.CylinderGeometry(0.125, 0.088, 0.52, 20), pantsM, l, 0, -0.25, 0);
      mesh(new THREE.SphereGeometry(0.088, 16, 12), pantsM, l, 0, -0.5, 0);
      mesh(new THREE.CylinderGeometry(0.086, 0.066, 0.42, 20), pantsM, l, 0, -0.71, 0);
      const sh = mesh(new THREE.SphereGeometry(0.1, 18, 12), shoeM, l, 0, -0.94, 0.06); sh.scale.set(0.95, 0.6, 1.75);
      mesh(new THREE.BoxGeometry(0.17, 0.03, 0.33), M(0xdedede, 0.7), l, 0, -0.99, 0.06); });
    return P;
  };

  // Textured side-swept short haircut, built for a head of radius ~0.42 centred at the origin.
  K.sweptHair = (hairM) => {
    if (typeof hairM === 'number') hairM = K.M(hairM, { roughness: 0.9, flatShading: true });
    const g = new THREE.Group(), ico = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);
    const mesh = (geo, x, y, z) => { const o = new THREE.Mesh(geo, hairM); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const hcap = mesh(new THREE.SphereGeometry(0.445, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.44), 0, 0.03, -0.03); hcap.scale.set(0.93, 1.08, 0.98); hcap.rotation.x = -0.22;
    const topv = mesh(ico(0.3, 1), -0.02, 0.36, 0.0); topv.scale.set(1.3, 0.55, 1.25);
    [[-0.2, 0.36, 0.22, 0.15], [-0.02, 0.4, 0.27, 0.17], [0.17, 0.37, 0.25, 0.15], [0.3, 0.27, 0.18, 0.11], [-0.32, 0.25, 0.1, 0.11]].forEach(([x, y, z, r], i) => {
      const t = mesh(ico(r, 1), x, y, z); t.scale.set(1.5, 0.55, 0.9); t.rotation.set(0.35, 0.1 * i, -0.38 + i * 0.04);
    });
    for (let i = 0; i < 7; i++) { const t = mesh(ico(0.09, 0), -0.24 + i * 0.08, 0.47 + (i % 2) * 0.03, 0.04 - (i % 3) * 0.1); t.rotation.set(0.6, i, -0.5); t.scale.set(1.6, 0.6, 1); }
    for (const sx of [-1, 1]) { const sd = mesh(ico(0.16, 1), sx * 0.36, 0.2, -0.06); sd.scale.set(0.45, 0.8, 1.15); }
    return g;
  };
  // One-piece side-swept haircut: a sculpted shell (volume on top, lifted front, swept to one side), low-poly shaded.
  // Built for a head of radius ~0.42 centred at the origin.
  K.cleanHair = (color = 0xdcc58a, { sweep = 1 } = {}) => {
    const mat = K.M(color, { roughness: 0.85, flatShading: true });
    const R = 0.44, geo = new THREE.SphereGeometry(R, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const p = geo.attributes.position, v = new THREE.Vector3(), rnd = K.rng(11);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const up = v.y / R, fz = v.z / R, front = Math.max(0, fz), ang = Math.atan2(v.x, v.z);
      // hairline: low at the back and sides, raised at the forehead
      const hairline = 0.2 + front * front * 0.32;
      if (up < hairline) { v.y = hairline * R; }
      // volume: thicker on top, extra lift at the front (the quiff), brushed to one side
      const lift = Math.pow(Math.max(0, up), 1.5) * 0.11 + front * Math.pow(Math.max(0, up), 0.8) * 0.13;
      v.y += lift; v.z += front * up * 0.06;
      v.x += sweep * Math.max(0, up - 0.3) * 0.09;
      // texture: little tufts so it reads as hair, not a cap
      const n = (Math.sin(ang * 9 + up * 6) * 0.5 + 0.5) * 0.018 * up + (rnd() - 0.5) * 0.008;
      v.addScaledVector(v.clone().normalize(), n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const g = new THREE.Group(), shell = new THREE.Mesh(geo, mat);
    shell.scale.set(1.0, 1.0, 1.04); shell.castShadow = true; g.add(shell);
    // short sides / back so the head isn't bald below the shell
    const sides = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 22, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.2), mat);
    sides.rotation.x = -0.25; sides.castShadow = true; g.add(sides);
    return g;
  };
  // Restyle a model's own hair mesh (stays skinned to the head): more volume on top, lifted + swept fringe.
  K.styleModelHair = (model, { matName = 'Hair', color = null, lift = 0.3, front = 0.45, sweep = 0.16 } = {}) => {
    const list = []; model.g.traverse(o => { if (o.isMesh && [].concat(o.material).some(m => m.name === matName)) list.push(o); });
    list.forEach(o => {
      if (color != null) [].concat(o.material).forEach(m => m.color.set(color));
      if (o.userData.styled) return; o.userData.styled = true;
      const top = o.clone(); top.userData.styled = true; o.parent.add(top);     // styled layer on top; the original stays underneath so no scalp shows
      if (top.isSkinnedMesh) top.bind(o.skeleton, o.bindMatrix);
      const geo = o.geometry.clone(); top.geometry = geo;
      const p = geo.attributes.position; geo.computeBoundingBox();
      const bb = geo.boundingBox, c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      // figure out which local axis is "up" and which is "forward" from the bind pose: up = largest extent above the face
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        // Quaternius meshes are Z-up with the face towards -Y in bind space
        const u = (v.z - c.z) / (sz.z / 2), f = -(v.y - c.y) / (sz.y / 2);      // up, forward: -1..1
        if (u > -0.3) {
          const k = Math.pow((u + 0.3) / 1.3, 1.5);
          v.z += k * lift * sz.z * 0.55 + Math.max(0, f) * k * front * sz.z * 0.5;   // volume on top, quiff at the front
          v.y -= Math.max(0, f) * k * front * sz.y * 0.12;                            // fringe leans forward a touch
          v.x += k * sweep * sz.x * 0.35;                                             // brushed to one side
        }
        p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
    });
  };
  // The version-1 head on its own (round low-poly face, dot eyes, nose, ears, swept hair), for putting on any body.
  // Built for radius ~0.42 at the origin. head.update(t, {talking, face}) blinks and moves the mouth.
  K.guyHead = ({ skin = 0xe9c4a6, hair = 0xdcc58a } = {}) => {
    const g = new THREE.Group();
    const skinM = K.M(skin, { roughness: 0.6, flatShading: true }), dark = K.M(0x111111, { roughness: 0.4 });
    const mesh = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    mesh(new THREE.IcosahedronGeometry(0.42, 2), skinM, 0, 0, 0).scale.set(0.9, 1.08, 0.95);
    mesh(new THREE.IcosahedronGeometry(0.3, 2), skinM, 0, -0.18, 0.05).scale.set(1, 0.7, 0.95);
    for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.08, 8, 6), skinM, sx * 0.38, 0.0, -0.02).scale.set(0.55, 1, 0.8);
    mesh(new THREE.SphereGeometry(0.06, 8, 6), skinM, 0, -0.05, 0.4);
    const eyes = [-1, 1].map(sx => mesh(new THREE.SphereGeometry(0.042, 8, 6), dark, sx * 0.14, 0.04, 0.36));
    const brows = [-1, 1].map(sx => mesh(new THREE.BoxGeometry(0.13, 0.03, 0.03), K.M(hair, { roughness: 0.9 }), sx * 0.15, 0.2, 0.355));
    const mouth = mesh(new THREE.BoxGeometry(0.1, 0.028, 0.02), K.M(0x4a1c12), 0, -0.19, 0.385);
    g.add(K.sweptHair(hair));
    g.userData = { eyes, brows, mouth };
    g.update = (t, { talking = false, face = 'neutral' } = {}) => {
      const blink = ((t + 0.4) % 3.4) < 0.1 ? 0.15 : 1;
      eyes.forEach(e => e.scale.set(1, (face === 'happy' ? 0.6 : face === 'shock' ? 1.4 : 1) * blink, 1));
      brows.forEach((b, i) => { b.position.y = face === 'shock' ? 0.25 : 0.2; b.rotation.z = face === 'worried' ? (i ? 0.25 : -0.25) : 0; });
      let mw = face === 'happy' ? 1.35 : 1, mh = face === 'shock' ? 3 : 1;
      if (talking) mh *= 1 + Math.abs(Math.sin(t * 15.5) * Math.sin(t * 6.1 + 1)) * 3;
      mouth.scale.set(mw, mh, 1);
    };
    return g;
  };
  // Clothing that follows a bone: a tapered tube from the bone's start to its child (e.g. sleeves, trouser legs).
  K.boneTube = (model, boneName, { r1 = 0.07, r2 = 0.06, color = 0x1f2a44, from = 0, to = 1, mat = null, seg = 10 } = {}) => {
    let bone = null; model.g.traverse(o => { if (o.isBone && o.name === boneName) bone = o; });
    if (!bone) throw new Error('bone not found: ' + boneName);
    const child = bone.children.find(c => c.isBone);
    const ws = bone.getWorldScale(new THREE.Vector3()).x;
    const dir = child ? child.position.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const len = child ? child.position.length() : 0.3 / (ws || 1);
    const h = (to - from) * len;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 / ws, r1 / ws, h, seg), mat || K.M(color, { roughness: 0.85, flatShading: true }));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);       // tube runs from this joint to the next
    m.position.copy(dir).multiplyScalar((from + to) / 2 * len); m.castShadow = true; m.frustumCulled = false; bone.add(m);
    return m;
  };
  // Something stuck to a bone in the bone's own space (scaled to world units).
  K.boneThing = (model, boneName, obj, { pos = [0, 0, 0], rot = [0, 0, 0] } = {}) => {
    let bone = null; model.g.traverse(o => { if (o.isBone && o.name === boneName) bone = o; });
    const ws = bone.getWorldScale(new THREE.Vector3()).x, h = new THREE.Group();
    h.scale.setScalar(1 / ws); h.position.set(...pos.map(v => v / ws)); h.rotation.set(...rot); h.add(obj); bone.add(h);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    return h;
  };
  // Clothing shell from the model's own skin: copies the triangles driven by the given bones, puffs them out a little,
  // and skins them to the same skeleton - so sleeves / trouser legs fit and bend perfectly with every animation.
  K.shellByBones = (model, bones, mat, { inflate = 0.012, matName = 'Skin', minWeight = 0.5 } = {}) => {
    const want = new Set(bones), made = [];
    const meshes = []; model.g.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
    for (const o of meshes) {
      const geo = o.geometry, mats = [].concat(o.material);
      const names = o.skeleton.bones.map(b => b.name);
      const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight, pos = geo.attributes.position;
      if (!si) continue;
      geo.computeBoundingBox(); const size = geo.boundingBox.getSize(new THREE.Vector3()).length();
      const groups = geo.groups.length ? geo.groups : [{ start: 0, count: (geo.index ? geo.index.count : pos.count), materialIndex: 0 }];
      const idx = geo.index ? geo.index.array : null, keep = [];
      const ok = v => { let w = 0; for (let k = 0; k < 4; k++) if (want.has(names[si.getComponent(v, k)])) w += sw.getComponent(v, k); return w >= minWeight; };
      for (const g of groups) {
        if (mats[g.materialIndex || 0].name !== matName) continue;
        for (let i = g.start; i < g.start + g.count; i += 3) {
          const a = idx ? idx[i] : i, b = idx ? idx[i + 1] : i + 1, c = idx ? idx[i + 2] : i + 2;
          if (ok(a) && ok(b) && ok(c)) keep.push(a, b, c);
        }
      }
      if (!keep.length) continue;
      const ng = new THREE.BufferGeometry();
      for (const k of ['position', 'normal', 'skinIndex', 'skinWeight']) if (geo.attributes[k]) ng.setAttribute(k, geo.attributes[k].clone());
      ng.setIndex(keep);
      if (!ng.attributes.normal) ng.computeVertexNormals();
      const P = ng.attributes.position, N = ng.attributes.normal;
      // average normals of vertices that share a position (split low-poly edges) so the shell has no cracks
      const avg = new Map(), key = v => `${P.getX(v).toFixed(4)},${P.getY(v).toFixed(4)},${P.getZ(v).toFixed(4)}`;
      for (let v = 0; v < P.count; v++) { const k = key(v), a = avg.get(k) || [0, 0, 0]; a[0] += N.getX(v); a[1] += N.getY(v); a[2] += N.getZ(v); avg.set(k, a); }
      const moved = [];
      for (let v = 0; v < P.count; v++) { const a = avg.get(key(v)), l = Math.hypot(...a) || 1; moved.push([P.getX(v) + a[0] / l * inflate * size, P.getY(v) + a[1] / l * inflate * size, P.getZ(v) + a[2] / l * inflate * size]); }
      moved.forEach((m, v) => P.setXYZ(v, ...m));
      const sm = new THREE.SkinnedMesh(ng, mat); sm.castShadow = true; sm.frustumCulled = false;
      o.parent.add(sm); sm.position.copy(o.position); sm.quaternion.copy(o.quaternion); sm.scale.copy(o.scale);
      sm.bind(o.skeleton, o.bindMatrix); made.push(sm);
    }
    return made;
  };
  // Put a custom head on a rigged model: hides the model's own head (Head bone shrunk) and rides the Neck bone.
  K.swapHead = (model, headObj, { offset = [0, 0.2, 0.01], scale = 0.36, neckBone = 'Neck', headBone = 'Head' } = {}) => {
    let hb = null; model.g.traverse(o => { if (o.isBone && o.name === headBone) hb = o; });
    const holder = K.attachToBone(model, neckBone, headObj, { offset, scale });
    const play = model.play.bind(model);
    model.play = (name, t, o) => { play(name, t, o); if (hb) hb.scale.setScalar(0.001); };
    if (hb) hb.scale.setScalar(0.001);
    return holder;
  };
  // Attach an object to a model's bone so it follows the animation. offset/rot/scale are in the model's own upright frame.
  K.attachToBone = (model, boneName, obj, { offset = [0, 0, 0], scale = 1, rot = [0, 0, 0] } = {}) => {
    let bone = null; model.g.traverse(o => { if (o.isBone && o.name === boneName) bone = o; });
    if (!bone) throw new Error('bone not found: ' + boneName);
    model.g.updateMatrixWorld(true);
    const bq = new THREE.Quaternion(), bp = new THREE.Vector3(), bs = new THREE.Vector3(); bone.matrixWorld.decompose(bp, bq, bs);
    const rq = new THREE.Quaternion(); model.g.getWorldQuaternion(rq);
    const holder = new THREE.Group(); bone.add(holder);
    holder.quaternion.copy(bq.clone().invert().multiply(rq).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot))));
    holder.scale.setScalar(1 / bs.x);
    const off = new THREE.Vector3(...offset).applyQuaternion(bq.clone().invert().multiply(rq));
    holder.position.copy(off.divideScalar(bs.x));
    obj.scale.multiplyScalar(scale); holder.add(obj);
    return holder;
  };
  // Rigged 3D model from SCENE.assets (glTF). Returns { g, actions, play(name, t, {from, speed, loop}) } - deterministic: play() sets the clip time from t.
  K.model = (url, { scale = 1, height = 0, colors = {} } = {}) => {
    const src = window.ASSETS[url];
    if (!src) throw new Error('model not preloaded: ' + url + ' (add it to SCENE.assets)');
    const g = window.GLTF.SkeletonUtils.clone(src.scene); g.scale.setScalar(scale); K.add(g);
    if (height) { g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); g.scale.multiplyScalar(height / Math.max(1e-6, b.max.y - b.min.y)); }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = mats.map(m => { const c = m.clone(); if (colors[m.name] != null) c.color.set(colors[m.name]); return c; });
      if (o.material.length === 1) o.material = o.material[0]; } });
    const mixer = new THREE.AnimationMixer(g), clips = {};
    src.animations.forEach(a => clips[a.name] = a);
    let cur = null;
    return { g, mixer, clips, names: Object.keys(clips),
      materials: () => { const out = new Set(); g.traverse(o => o.isMesh && [].concat(o.material).forEach(m => out.add(m.name))); return [...out]; },
      play(name, t, { from = 0, speed = 1, loop = true } = {}) {
        const clip = clips[name] || Object.values(clips).find(c => c.name.toLowerCase().includes(String(name).toLowerCase()));
        if (!clip) return;
        if (cur !== clip) { mixer.stopAllAction(); mixer.clipAction(clip).play(); cur = clip; }
        let local = Math.max(0, (t - from) * speed);
        if (loop) local %= clip.duration; else local = Math.min(local, clip.duration - 1e-3);
        mixer.setTime(local);
      } };
  };

  // MADDIE (locked look): Quaternius CC0 body, v1 round face + swept hair, navy hoodie, beige trousers, a bit bulkier.
  // Needs 'assets/chars/worker.glb' in SCENE.assets. Returns the model with .head (blink/talk via head.update) and .play().
  K.MADDIE_ASSET = 'assets/chars/worker.glb';
  K.makeMaddieV3 = ({ height = 2.15, bulk = 1.12, hoodie = 0x1f2a44, pants = 0xcdb894, skin = 0xf0c9a8, hair = 0xdcc58a } = {}) => {
    const M = K.model(K.MADDIE_ASSET, { height, colors: { Shirt: hoodie, Pants: pants, Skin: skin, Socks: 0xf2f2f2 } });
    M.play('Man_Idle', 0); M.g.updateMatrixWorld(true);
    const hoodM = K.M(hoodie, { roughness: 0.9, flatShading: true, side: THREE.DoubleSide }), pantM = K.M(pants, { roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
    // long sleeves + full-length trousers: shells made from the model's own arm / leg skin
    K.shellByBones(M, ['UpperArmL', 'UpperArmR', 'LowerArmL', 'LowerArmR'], hoodM, { inflate: 0.008, minWeight: 0.2 });
    K.shellByBones(M, ['UpperLegL', 'UpperLegR', 'LowerLegL', 'LowerLegR'], pantM, { inflate: 0.007, minWeight: 0.2 });
    // hood (rolled behind the neck), front pocket, drawstrings
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), hoodM);
    hood.scale.set(1.15, 0.55, 0.75); hood.rotation.x = -0.5;
    const hoodG = new THREE.Group(); hoodG.add(hood); K.attachToBone(M, 'Neck', hoodG, { offset: [0, -0.03, -0.075], scale: 1 });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.034, 8, 18), K.M(0x24304d, { roughness: 0.9, flatShading: true }));
    collar.rotation.x = Math.PI / 2 - 0.25; collar.scale.set(1.08, 1, 0.9);
    const colG = new THREE.Group(); colG.add(collar); K.attachToBone(M, 'Neck', colG, { offset: [0, -0.045, -0.005], scale: 1 });
    const front = new THREE.Group();
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.02), K.M(0x1a2440, { roughness: 0.9, flatShading: true })); pocket.position.set(0, -0.2, 0.135); front.add(pocket);
    for (const sx of [-1, 1]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.13, 5), K.M(0xe8e8e8)); st.position.set(sx * 0.035, 0.12, 0.14); front.add(st); }
    K.attachToBone(M, 'Torso', front, { offset: [0, 0, 0], scale: 1 });
    // bulk: wider and deeper, same height; the head is scaled back so it stays round
    M.g.scale.x *= bulk; M.g.scale.z *= bulk * 0.97;
    const head = K.guyHead({ skin, hair });
    const holder = K.swapHead(M, head, { offset: [0, 0.19, 0.01], scale: 0.335 });
    head.scale.x /= bulk; head.scale.z /= bulk * 0.97;
    M.head = head;
    return M;
  };

  // ------------------------------------------------------------------ boot (called by render.js with real voice timings)
  K.boot = (T) => {
    const S = window.SCENE;
    K.setup(S.setup || {});
    K.T = T;
    // who is speaking at time t (drives mouths)
    K.speaking = (who, t) => T.lines.some(l => l.who === who && t >= l.t && t < l.end - 0.05);
    const R = S.build(K, T);
    window.render = t => { R.update(t); K.shoot(t, R.shots); K.draw(); return true; };
    window.sceneInfo = () => ({
      duration: R.duration, sfx: R.sfx || [], badges: R.badges || [], big: R.big || [], music: R.music || {},
      counter: R.counter ? Array.from({ length: Math.ceil(R.duration * 15) }, (_, i) => R.counter(i / 15)) : null,
      endCard: R.endCard, watermark: R.watermark,
    });
    window.ready = true;
  };
})();
