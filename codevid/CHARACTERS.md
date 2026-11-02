# Maddie & Chotu - official characters (locked 2026-10-30)

## Maddie
**Current look (2026-11-02): `K.makeMaddieV6()`** - built from Maddy's own photos: one smooth body (no shells/patches) riding the worker.glb rig, medium-brown skin, thick wavy black hair with short sides, short beard + moustache, thick brows, toothy smile; black collared shirt with sleeves rolled below the elbow, cream/beige trousers, brown shoes. Same play()/head.update API (default face 'smile').

Previous, `K.makeMaddieV4()` - bigger round head, warm skin, dark wavy hair, no glasses, black collared shirt with buttons, beige trousers, dark brown shoes. Same body, animations and `head.update` as V3 below.

Older look, V3:
`K.makeMaddieV3()` - add `K.MADDIE_ASSET` ('assets/chars/worker.glb') to `SCENE.assets`.
- Body: Quaternius CC0 rigged man (assets/chars/worker.glb), 12% bulkier, height 2.15
- Head: round low-poly face (dot eyes, nose, ears) + textured side-swept blond hair (`K.guyHead`)
- Outfit: navy blue hoodie (0x1f2a44) with long sleeves, hood collar, pocket, white drawstrings; beige trousers (0xcdb894)
- Animations: `m.play(name, t)` - Man_Idle, Man_Walk, Man_Run, Man_Sitting, Man_Standing, Man_Clapping, Man_Jump, Man_RunningJump, Man_Punch, Man_Death, Man_SwordSlash
- Face: `m.head.update(t, { talking: K.speaking('maddie', t), face: 'neutral'|'happy'|'shock'|'worried' })`
- Voice: Kokoro am_puck (sid 18), speed 1.08

## Chotu
`K.makeChotu()` - round golden buddy, ₹ belly badge, big eyes. Voice: Kokoro am_michael (sid 16).

## just.money.things reel rules (from Maddy's feedback, 2026-11-02)
- Captions small and low: capSize ~54, capMarginV ~150 — never over faces.
- No arm gestures on Maddie; head turns stay small (max ~0.25 rad) and slow. Calm, natural acting only.
- Template: scenes/jmt_ambani_final.js (3D room, original Maddie V3 + halo Bittu, motion-graphics HUD layer, cards).

## Robot sidekick (LOCKED 2026-11-03)
- `K.makeRobo({ height: 0.9 })` — orange boxy robot, amber ear pads, antenna bulb, grey ring eyes, yellow mouth bar, small body + feet. **No halo, no gears.**
- Talking: `robo.update(t, { talk: K.voice(who, t), mood: 'calm'|'smile'|'shock', look: [yaw, pitch] })`.
- Never use the real Claude logo or the name "Claude" for the character; the tool can be named in scripts.
