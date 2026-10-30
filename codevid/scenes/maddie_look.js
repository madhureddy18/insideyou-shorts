/* Maddie v2 look test: A = blocky, B = smooth */
window.SCENE = {
  setup: { width: 1080, height: 1350, bg: 0x0c4a42, fog: null, fov: 32, bloom: { strength: 0.3, radius: 0.4, threshold: 0.97 } },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  build(K) {
    K.gradientBg('#0a3d37', '#178a6e', 'rgba(255,214,102,0.22)');
    K.lights('studio');
    const floor = new THREE.Mesh(new THREE.CircleGeometry(20, 64), K.M(0x0d4f45, { roughness: 0.5 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; K.add(floor);
    const A = K.makeMaddie({ style: 'voxel' }); A.root.position.set(-0.85, 0, 0); A.root.rotation.y = 0.18;
    const Bm = K.makeMaddie({ style: 'smooth' }); Bm.root.position.set(0.85, 0, 0); Bm.root.rotation.y = -0.18;
    const lab = (t, x) => { const c = K.card({ w: 0.5, h: 0.5, bg: '#ffc53d', radius: 0.25, shadow: false }); c.draw((g, W, H) => K.text(g, t, W / 2, H * 0.56, { size: 60, color: '#0a3d37' }), 1); c.g.position.set(x, 3.25, 0.3); };
    lab('A', -0.85); lab('B', 0.85);
    const update = t => { A.pose(t, { face: 'smug', look: [0.15, 0] }); Bm.pose(t, { face: 'smug', look: [-0.15, 0] }); };
    const shots = [
      { t: [0, 1], from: { pos: [0, 2.5, 5.8], look: [0, 2.3, 0] } },
      { t: [1, 2], from: { pos: [0, 1.7, 7.4], look: [0, 1.55, 0] } },
      { t: [2, 3], from: { pos: [1.6, 2.4, 3.6], look: [0, 2.35, 0] } },
    ];
    return { duration: 3, update, shots, watermark: '', endCard: false };
  },
};
