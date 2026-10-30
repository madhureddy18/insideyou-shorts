/* @maddieandchotu - profile picture: Maddie & Chotu, money-gang style (1080x1080, circle-safe) */
window.SCENE = {
  setup: { width: 1080, height: 1080, bg: 0x0b0b10, fog: null, fov: 34, bloom: { strength: 0.5, radius: 0.5, threshold: 0.9 } },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],

  build(K) {
    const THREE = window.THREE;
    K.scene.background = new THREE.Color(0x000000);
    K.lights('studio');
    
    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), K.M(0x050505, { roughness: 0.3, metalness: 0.5 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; K.add(floor);
    // rim lights: gold + magenta for drama
    const rimA = new THREE.PointLight(0xffb020, 30, 12); rimA.position.set(-2.6, 3.0, -1.2); K.add(rimA);
    const rimB = new THREE.PointLight(0xff3d7f, 18, 12); rimB.position.set(2.8, 2.4, -1.0); K.add(rimB);

    const blk = K.M(0x111114, { roughness: 0.25, metalness: 0.6 });
    const goldM = K.M(0xffc53d, { roughness: 0.2, metalness: 0.9, emissive: 0x4a3000, emissiveIntensity: 0.6 });
    const shade = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.05, metalness: 0.9 });
    // voxel pistol, barrel along local -y (down the arm), grip along -z
    const pistol = () => {
      const p = new THREE.Group();
      p.add(K.at(K.box(0.13, 0.5, 0.16, blk), 0, -0.2, 0));            // slide
      p.add(K.at(K.box(0.135, 0.42, 0.04, goldM), 0, -0.18, 0.085));    // gold top rail
      p.add(K.at(K.box(0.07, 0.08, 0.07, blk), 0, -0.47, 0));           // muzzle
      p.add(K.at(K.box(0.12, 0.13, 0.26, blk), 0, 0.0, -0.17));         // grip
      p.add(K.at(K.box(0.125, 0.06, 0.06, goldM), 0, -0.12, -0.11));    // trigger guard
      return p;
    };

    // ---------- Maddie: black cap backwards, shades, gold chain, pistol tilted sideways
    const m = K.makePerson({ skin: 0xb5764e, hair: 0x140d09, top: 0xff7a2f, accent: 0x111114, pants: 0x1b1b22, shoes: 0xffffff });
    m.root.position.set(-0.72, 0, 0.3); m.root.rotation.y = 0.05;
    m.pose(0, { face: 'smug', look: [0.12, 0.05] });
    m.mouth.scale.set(1.1, 1, 1); m.mouth.position.x = 0.07; m.mouth.rotation.z = 0.18;           // smirk
    m.brows && m.brows.forEach((b, i) => { b.rotation.z = i ? -0.25 : 0.25; b.position.y -= 0.03; });
    m.pupils.forEach(p => p.visible = false); m.eyes.forEach(e => e.visible = false);
    m.head.add(K.at(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.17, 0.05), shade), 0, 0.06, 0.43));
    m.head.add(K.at(K.box(0.84, 0.035, 0.06, goldM), 0, 0.15, 0.43));
    m.head.add(K.at(K.box(0.92, 0.24, 0.9, blk), 0, 0.5, 0));                       // cap
    m.head.add(K.at(K.box(0.6, 0.06, 0.4, blk), 0, 0.42, -0.6));                      // brim, backwards
    m.head.add(K.at(K.box(0.2, 0.12, 0.02, goldM), 0, 0.52, 0.455));                  // gold cap badge
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 10, 30, Math.PI), goldM); chain.rotation.z = Math.PI; chain.position.set(0, 0.76, 0.28); 
    const pend = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 32), goldM); pend.rotation.x = Math.PI / 2; pend.position.set(0, 0.5, 0.29); 
    const rs = K.canvasTex(128, 128, (x) => { x.fillStyle = '#ffd25e'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.fillStyle = '#7a5200'; x.font = 'bold 86px DejaVu Sans, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('₹', 64, 70); });
    const pf = new THREE.Mesh(new THREE.CircleGeometry(0.125, 32), new THREE.MeshBasicMaterial({ map: rs })); pf.position.set(0, 0.5, 0.315); /* no ₹ on pendant */
    // right arm forward with pistol held sideways, left arm fanning cash
    const gunM = pistol(); gunM.position.set(0, -0.86, 0.02); gunM.rotation.y = -Math.PI / 2; gunM.scale.setScalar(1.3); m.arms[0].add(gunM);
    m.arms[0].rotation.set(-1.45, 0, -0.22);
    m.arms[1].rotation.set(0, 0, 0.12);
    const fan = new THREE.Group(); const mats = K.bundleMaterials(500);
    for (let i = 0; i < 5; i++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.008, 0.24), mats[2] || mats); n.position.set(0, 0, 0); const h = new THREE.Group(); h.add(n); n.position.x = 0.22; h.rotation.y = -0.5 + i * 0.25; fan.add(h); }
    fan.rotation.set(Math.PI / 2, 0, 0); fan.position.set(0, -0.9, 0.08); 

    // ---------- Chotu: shades, black fedora, chain, pistol
    const c = K.makeChotu();
    c.g.position.set(0.82, 0, 0.55); c.g.rotation.y = -0.05; c.g.scale.setScalar(1.12);
    c.pose(0, { face: 'open' });
    c.body.children.forEach(o => { if (o.geometry && o.geometry.parameters && o.geometry.parameters.radius === 0.11 && o.material.map) o.visible = false; });   // hide ₹ belly badge
    c.eyes.forEach(e => e.visible = false); c.pupils.forEach(e => e.visible = false); c.shines.forEach(e => e.visible = false); c.happy.visible = false;
    for (const ex of [-0.2, 0.2]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32), shade); l.rotation.x = Math.PI / 2; l.scale.set(1.15, 1, 0.8); l.position.set(ex, 0.9, 0.57); c.body.add(l); }
    c.body.add(K.at(K.box(0.14, 0.03, 0.03, goldM), 0, 0.93, 0.6));
    c.body.add(K.at(K.box(1.0, 0.03, 0.03, goldM), 0, 0.96, 0.52));
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.035, 40), blk); brim.position.set(0, 1.26, -0.04); brim.rotation.z = -0.12; c.body.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.34, 40), blk); crown.position.set(-0.02, 1.45, -0.04); crown.rotation.z = -0.12; c.body.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.362, 0.362, 0.07, 40), goldM); band.position.set(-0.01, 1.33, -0.04); band.rotation.z = -0.12; c.body.add(band);
    c.mouth.scale.set(1.0, 0.55, 1); c.mouth.rotation.z = 0.18; c.mouth.position.x += 0.05;
    const cch = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 10, 40), K.M(0xe8e8f0, { metalness: 1, roughness: 0.15 })); cch.position.set(0, 0.5, 0.2); cch.rotation.x = 1.15; 
    const gunC = pistol(); gunC.scale.setScalar(1.15); gunC.position.set(0, -0.34, 0.02); gunC.rotation.y = Math.PI / 2; c.arms[1].add(gunC);
    c.arms[1].rotation.set(-1.45, 0, 0.2);
    c.arms[0].rotation.set(0, 0, 0.6);

    const shots = [{ t: [0, 99], from: { pos: [0.05, 1.5, 7.3], look: [0.05, 1.42, 0] } }];
    return { duration: 1, update: () => {}, shots, watermark: '', endCard: false };
  },
};
