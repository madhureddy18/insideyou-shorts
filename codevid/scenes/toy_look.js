window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0xf3ece2, fog: null, fov: 28, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  build(K) {
    K.scene.background = new THREE.Color(0xf3ece2);
    K.scene.add(new THREE.HemisphereLight(0xfff4e6, 0xd9b48a, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(-2, 3.5, 4); key.castShadow = true; K.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe0c0, 0.8); fill.position.set(3, 1, 3); K.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(1, 3, -4); K.scene.add(rim);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshStandardMaterial({ color: 0xead9c4, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; K.scene.add(fl);
    const M = K.makeToyMaddie({ seatY: 0.56 }); K.scene.add(M.g);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.45), new THREE.MeshStandardMaterial({ color: 0x3a3a44 })); seat.position.set(0, 0.5, 0.0); K.scene.add(seat);
    const update = t => { const i = Math.floor(t);
      M.g.rotation.y = [0, -0.7, 0, 0.6][i];
      M.update(1, { face: ['smile', 'neutral', 'neutral', 'neutral'][i], talk: [0, 0, 0.5, 1][i] }); };
    return { duration: 4, update, shots: [{ t: [0, 9], from: { pos: [0.4, 1.0, 4.2], look: [0, 0.75, 0] } }], watermark: '', endCard: false };
  },
};
