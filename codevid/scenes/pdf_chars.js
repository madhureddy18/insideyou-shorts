window.SCENE = {
  setup: { width: 1200, height: 900, bg: 0xfdf3e7, fog: null, fov: 26, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  build(K) {
    K.scene.background = new THREE.Color(0xfdf3e7);
    K.scene.add(new THREE.HemisphereLight(0xfff4e6, 0xd9b48a, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2, 3.5, 4); K.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe0c0, 0.9); fill.position.set(3, 1, 3); K.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(1, 3, -4); K.scene.add(rim);
    const M = K.makeToyMaddie(); M.g.position.set(-0.22, 0, 0); M.g.rotation.y = 0.25; K.scene.add(M.g);
    const R = K.makeRobo({ height: 0.55 }); R.g.position.set(0.42, 0.62, 0.15); R.g.rotation.y = -0.35; K.scene.add(R.g);
    const update = t => { M.update(1.3, { face: 'smile', look: [0.2, 0] }); R.update(1.3, { mood: 'smile', look: [-0.15, 0] }); };
    return { duration: 1, update, shots: [{ t: [0, 9], from: { pos: [0.05, 1.05, 3.2], look: [0.05, 0.98, 0] } }], watermark: '', endCard: false };
  },
};
