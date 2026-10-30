/* Option 1 (code-built guy) vs Option 2 (CC0 Quaternius "worker" model, recoloured) */
window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0x0b1020, fog: null, fov: 30, bloom: { strength: 0.25, radius: 0.4, threshold: 0.95 } },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  assets: ['assets/chars/worker.glb'],
  build(K) {
    K.gradientBg('#0a1024', '#1b2b3a', 'rgba(255,200,120,0.18)');
    K.lights('night');
    const lamp = new THREE.PointLight(0xffd59a, 12, 9); lamp.position.set(1.4, 3.2, 2.4); K.add(lamp);
    const fill = new THREE.DirectionalLight(0xc9d6ff, 1.3); fill.position.set(-3, 4, 5); K.add(fill);
    const rim = new THREE.DirectionalLight(0xffe2b8, 1.4); rim.position.set(2, 3, -4); K.add(rim);
    const grass = new THREE.Mesh(new THREE.CircleGeometry(20, 48), K.M(0x1d3324, { roughness: 1, flatShading: true })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; K.add(grass);
    const A = K.makeGuy({}); A.root.position.set(-0.7, 0, 0); A.root.rotation.y = 0.15;
    const B = K.makeMaddieV3(); const H = B.head;
    B.g.position.set(0.7, 0, 0); B.g.rotation.y = -0.15;
    const lab = (t, x) => { const c = K.card({ w: 0.36, h: 0.36, bg: '#ffc53d', radius: 0.18, shadow: false }); c.draw((g, W, H) => K.text(g, t, W / 2, H * 0.56, { size: 56, color: '#0b1020' }), 1); c.g.position.set(x, 2.55, 0.3); };
    lab('1', -0.7); lab('2', 0.7);
    const update = t => { A.pose(t, { face: 'happy', look: [0.1, 0] }); A.arms[0].rotation.z = -0.12; A.arms[1].rotation.z = 0.12;
      B.play(t < 1 ? 'Man_Idle' : t < 2 ? 'Man_Idle' : 'Man_Walk', t); H.update(t, { face: 'happy' }); };
    const shots = [
      { t: [0, 1], from: { pos: [0.55, 1.98, 1.5], look: [0.66, 1.92, 0] } },
      { t: [3, 4], from: { pos: [1.35, 2.0, 1.0], look: [0.66, 1.92, 0] } },
      { t: [1, 3], from: { pos: [0, 1.25, 6.4], look: [0, 1.1, 0] } },
    ];
    return { duration: 4, update, shots, watermark: '', endCard: false };
  },
};
