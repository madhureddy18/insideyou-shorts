/* Hair check: Maddie V4 head, front 3/4 and side views */
window.SCENE = {
  setup: { width: 1080, height: 1080, bg: 0xff8a1f, fog: null, fov: 26, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  assets: ['assets/chars/worker.glb'],
  build(K) {
    K.scene.background = new THREE.Color(0xff8a1f);
    K.scene.add(new THREE.HemisphereLight(0xfff4e6, 0xc77a3a, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-2.5, 3.5, 4); K.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffd2a6, 0.9); fill.position.set(3, 1.5, 3); K.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(1.5, 3, -4); K.scene.add(rim);
    const M = K.makeMaddieV4();
    const update = t => { M.play('Man_Idle', 0.6); M.head.update(1, { face: 'smile' }); M.g.rotation.y = t < 1 ? -0.35 : t < 2 ? -1.45 : 2.8; };
    const sh = { from: { pos: [0, 2.05, 2.1], look: [0, 1.95, 0] } };
    return { duration: 3, update, shots: [{ t: [0, 1], ...sh }, { t: [1, 2], ...sh }, { t: [2, 3], ...sh }], watermark: '', endCard: false };
  },
};
