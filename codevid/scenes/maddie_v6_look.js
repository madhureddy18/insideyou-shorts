/* Maddie V6 (from Maddy's photos): full body, bust, side */
window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0xff8a1f, fog: null, fov: 28, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  assets: ['assets/chars/worker.glb'],
  build(K) {
    K.scene.background = new THREE.Color(0xff8a1f);
    K.scene.add(new THREE.HemisphereLight(0xfff4e6, 0xc77a3a, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2.5, 3.5, 4); key.castShadow = true; K.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffd2a6, 0.9); fill.position.set(3, 1.5, 3); K.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(1.5, 3, -4); K.scene.add(rim);
    const M = K.makeMaddieV6();
    const update = t => { M.play('Man_Idle', 0.6); M.head.update(1, { face: 'smile' }); M.g.rotation.y = t < 2 ? -0.3 : -1.2; };
    return { duration: 3, update, shots: [
      { t: [0, 1], from: { pos: [-0.5, 1.4, 6.4], look: [0, 1.2, 0] } },
      { t: [1, 2], from: { pos: [-0.3, 2.0, 2.4], look: [0.02, 1.85, 0] } },
      { t: [2, 3], from: { pos: [1.4, 1.6, 4.6], look: [0, 1.2, 0] } },
    ], watermark: '', endCard: false };
  },
};
