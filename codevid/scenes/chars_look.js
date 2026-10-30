/* compare CC0 Quaternius characters */
const NAMES = ['worker', 'adventurer', 'rogue', 'pirate', 'soldier', 'monarch'];
window.SCENE = {
  setup: { width: 1600, height: 900, bg: 0x0b1020, fog: null, fov: 30, bloom: false },
  lines: [{ who: 'maddie', text: 'hi', say: 'Hi.' }],
  assets: NAMES.map(n => `assets/chars/${n}.glb`),
  build(K) {
    K.gradientBg('#0a1024', '#1b2b3a', 'rgba(255,200,120,0.18)');
    K.lights('studio');
    const ms = NAMES.map((n, i) => { const m = K.model(`assets/chars/${n}.glb`, { height: 2 }); m.g.position.set((i - 2.5) * 1.6, 0, 0);
      const b = new THREE.Box3().setFromObject(m.g); return m; });
    const update = t => ms.forEach(m => m.play('Idle', t));
    return { duration: 2, update, shots: [{ t: [0, 9], from: { pos: [0, 1.6, 11], look: [0, 1.1, 0] } }], watermark: '', endCard: false };
  },
};
