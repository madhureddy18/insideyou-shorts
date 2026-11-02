/* Maddie V4 look test: full body (t=0.5) and bust (t=1.5) on orange */
window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0xff8a1f, fog: null, fov: 28, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  assets: ['assets/chars/worker.glb'],
  build(K) {
    K.scene.background = new THREE.Color(0xff8a1f);
    K.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x8a4a1a, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-2.5, 3.5, 4); key.castShadow = true; K.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffd2a6, 0.9); fill.position.set(3, 1.5, 3); K.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(1.5, 3, -4); K.scene.add(rim);
    const M = K.makeMaddieV4(); M.g.rotation.y = -0.3;
    const update = t => { M.play('Man_Idle', 0.6); M.head.update(1, { face: 'neutral' }); M.head.rotation.set(-0.04, 0.22, 0); };
    return { duration: 2, update, shots: [
      { t: [0, 1], from: { pos: [-0.5, 1.4, 6.4], look: [0, 1.25, 0] } },
      { t: [1, 2], from: { pos: [-0.3, 2.0, 2.3], look: [0.02, 1.85, 0] } },
    ], watermark: '', endCard: false };
  },
};
