/* Instagram profile picture: Maddie bust shot on flat orange (circle-safe, 1080x1080) */
window.SCENE = {
  setup: { width: 1080, height: 1080, bg: 0xff8a1f, fog: null, fov: 26, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  assets: ['assets/chars/worker.glb'],
  build(K) {
    K.scene.background = new THREE.Color(0xff8a1f);
    K.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x8a4a1a, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-2.5, 3.5, 4); K.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffd2a6, 0.9); fill.position.set(3, 1.5, 3); K.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(1.5, 3, -4); K.scene.add(rim);
    const M = K.makeMaddieV3(); M.g.rotation.y = -0.38;
    const update = t => { M.play('Man_Idle', 0.6); M.head.update(1, { face: 'smile' }); M.head.rotation.set(-0.06, 0.28, 0.04); };
    return { duration: 1, update, shots: [{ t: [0, 9], from: { pos: [-0.3, 1.93, 2.05], look: [0.02, 1.8, 0] } }], watermark: '', endCard: false };
  },
};
