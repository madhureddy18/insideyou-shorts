/* Robo look test: front, 3/4, talking, with halo */
window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0xf3ece2, fog: null, fov: 28, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  build(K) {
    K.scene.background = new THREE.Color(0xf3ece2);
    K.scene.add(new THREE.HemisphereLight(0xfff4e6, 0xd9b48a, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-2, 3.5, 4); key.castShadow = true; K.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe0c0, 0.8); fill.position.set(3, 1, 3); K.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(1, 3, -4); K.scene.add(rim);
    const fl = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.MeshStandardMaterial({ color: 0xead9c4, roughness: 1 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; K.scene.add(fl);
    const R = K.makeRobo({ height: 1, halo: false }), H = K.makeRobo({ height: 1, halo: true });
    K.scene.add(R.g); K.scene.add(H.g); H.g.visible = false;
    const update = t => {
      const i = Math.floor(t);
      R.g.visible = i < 3; H.g.visible = i >= 3;
      R.g.rotation.y = i === 1 ? -0.55 : 0; H.g.rotation.y = -0.3;
      R.update(1.0, { talk: i === 2 ? 0.9 : 0, mood: i === 2 ? 'calm' : 'smile' });
      H.update(1.0, { talk: 0.4 });
    };
    return { duration: 4, update, shots: [{ t: [0, 9], from: { pos: [0, 0.75, 3.4], look: [0, 0.55, 0] } }], watermark: '', endCard: false };
  },
};
