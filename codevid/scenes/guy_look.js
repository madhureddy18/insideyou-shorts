/* Maddie v3: smooth low-poly guy (reel style), blue tee - look test */
window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0x0b1020, fog: null, fov: 32, bloom: { strength: 0.3, radius: 0.4, threshold: 0.95 } },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  build(K) {
    K.gradientBg('#0a1024', '#1b2b3a', 'rgba(255,200,120,0.18)');
    K.lights('night');
    const lamp = new THREE.PointLight(0xffd59a, 12, 9); lamp.position.set(1.6, 3.2, 2.2); K.add(lamp);
    const fill = new THREE.DirectionalLight(0xc9d6ff, 1.3); fill.position.set(-3, 4, 5); K.add(fill);
    const rim = new THREE.DirectionalLight(0xffe2b8, 1.6); rim.position.set(2, 3, -4); K.add(rim);
    const grass = new THREE.Mesh(new THREE.CircleGeometry(20, 48), K.M(0x1d3324, { roughness: 1, flatShading: true })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; K.add(grass);
    const A = K.makeGuy({}); A.root.position.set(-0.55, 0, 0); A.root.rotation.y = 0.3;
    const B = K.makeGuy({}); B.root.position.set(0.6, 0, 0); B.root.rotation.y = -0.5;
    const relax = (G, t) => { G.arms[0].rotation.z = -0.12; G.arms[1].rotation.z = 0.12; G.arms.forEach(a => a.rotation.x = 0.05); };
    const update = t => { A.pose(t, { face: 'happy', look: [0.1, 0] }); relax(A, t); B.pose(t, { face: 'happy', look: [0.3, 0.05], wave: 1 }); B.elbows[1].rotation.x = -0.2; };
    const shots = [
      { t: [0, 1], from: { pos: [-0.55, 1.95, 2.0], look: [-0.55, 1.88, 0] } },
      { t: [1, 2], from: { pos: [0, 1.25, 5.6], look: [0, 1.1, 0] } },
      { t: [2, 3], from: { pos: [1.4, 1.95, 1.6], look: [-0.5, 1.9, 0] } },
    ];
    return { duration: 3, update, shots, watermark: '', endCard: false };
  },
};
