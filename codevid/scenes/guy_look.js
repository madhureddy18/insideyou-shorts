/* Maddie in the reel's smooth low-poly style, blue tee: 1 = exact reference look, 2 = same style with the creator's features */
window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0x0b1020, fog: null, fov: 32, bloom: { strength: 0.35, radius: 0.4, threshold: 0.95 } },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  build(K) {
    K.gradientBg('#0a1024', '#1b2b3a', 'rgba(255,200,120,0.18)');
    K.lights('night');
    const lamp = new THREE.PointLight(0xffd59a, 14, 9); lamp.position.set(1.6, 3.2, 2.2); K.add(lamp);
    const fill = new THREE.DirectionalLight(0xc9d6ff, 1.2); fill.position.set(-3, 4, 5); K.add(fill);
    const grass = new THREE.Mesh(new THREE.CircleGeometry(20, 48), K.M(0x1d3324, { roughness: 1, flatShading: true })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; K.add(grass);
    const A = K.makeGuy({}); A.root.position.set(-0.75, 0, 0); A.root.rotation.y = 0.15;
    const B = K.makeGuy({ skin: 0xa86a42, hair: 0x15100c, beard: 0x120c08 }); B.root.position.set(0.75, 0, 0); B.root.rotation.y = -0.15;
    const lab = (t, x) => { const c = K.card({ w: 0.42, h: 0.42, bg: '#ffc53d', radius: 0.21, shadow: false }); c.draw((g, W, H) => K.text(g, t, W / 2, H * 0.56, { size: 60, color: '#0b1020' }), 1); c.g.position.set(x, 2.85, 0.3); };
    lab('1', -0.75); lab('2', 0.75);
    const update = t => { A.pose(t, { face: 'happy', look: [0.15, 0] }); B.pose(t, { face: 'happy', look: [-0.15, 0], wave: t > 1.2 ? 1 : 0 }); };
    const shots = [
      { t: [0, 1], from: { pos: [0, 2.2, 4.2], look: [0, 2.05, 0] } },
      { t: [1, 2], from: { pos: [0, 1.55, 6.6], look: [0, 1.35, 0] } },
    ];
    return { duration: 2, update, shots, watermark: '', endCard: false };
  },
};
