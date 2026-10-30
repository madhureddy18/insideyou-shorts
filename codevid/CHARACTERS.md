# Maddie & Chotu - official characters (locked 2026-10-30)

## Maddie
`K.makeMaddieV3()` - add `K.MADDIE_ASSET` ('assets/chars/worker.glb') to `SCENE.assets`.
- Body: Quaternius CC0 rigged man (assets/chars/worker.glb), 12% bulkier, height 2.15
- Head: round low-poly face (dot eyes, nose, ears) + textured side-swept blond hair (`K.guyHead`)
- Outfit: navy blue hoodie (0x1f2a44) with long sleeves, hood collar, pocket, white drawstrings; beige trousers (0xcdb894)
- Animations: `m.play(name, t)` - Man_Idle, Man_Walk, Man_Run, Man_Sitting, Man_Standing, Man_Clapping, Man_Jump, Man_RunningJump, Man_Punch, Man_Death, Man_SwordSlash
- Face: `m.head.update(t, { talking: K.speaking('maddie', t), face: 'neutral'|'happy'|'shock'|'worried' })`
- Voice: Kokoro am_puck (sid 18), speed 1.08

## Chotu
`K.makeChotu()` - round golden buddy, ₹ belly badge, big eyes. Voice: Kokoro am_michael (sid 16).
