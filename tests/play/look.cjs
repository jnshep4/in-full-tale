// Screenshots for eyeballing: node tests/play/look.cjs [region] — every room of the region (or of
// every region) as an overview plus in-game frames along its length. Not a test; nothing is asserted.
const { launch, overview } = require('./helpers.cjs');
(async () => {
  const only = process.argv[2] !== undefined ? +process.argv[2] : null;
  const h = await launch({ query: 'test=1&nosave=1' });
  const rooms = await h.ev(async () => { const m = await import('/src/data/regions.js'); return m.REGIONS.flatMap((r) => r.rooms.map((d) => [r.id, d.id, d.map[0].length, d.map.length])); });
  for (const [rid, id, w] of rooms) {
    if (only !== null && rid !== only) continue;
    await h.ev(([rid, id]) => { const g = __ift.game; g.godmode = true; g.save.powers = ['dash', 'double', 'climb', 'pound', 'sword', 'shield', 'grapple', 'swim', 'heavy', 'valor']; g.loadRoom(rid, id); __ift.step(30, []); }, [rid, id]);
    await overview(h, `look-${rid}-${id}-map`, w > 120 ? 0.4 : 0.5);
    const n = Math.max(1, Math.round(w / 34));
    for (let i = 0; i < n; i++) {
      await h.ev(([i, n]) => {
        const g = __ift.game, room = g.room, p = g.player;
        const cx = Math.min(room.w - 3, Math.max(2, Math.round(15 + (room.w - 30) * (n === 1 ? 0.5 : i / (n - 1)))));
        let cy = 2; while (room.solid(cx, cy)) cy++; while (cy < room.h - 1 && !room.solid(cx, cy + 1) && room.tile(cx, cy + 1) !== 2) cy++;   // first floor from the top
        p.x = cx * 16 + 3; p.y = (cy + 1) * 16 - 22; p.vx = p.vy = 0; p.inv = 0;
        for (const s of g.soldiers) s.update = () => {};                                                    // hold the scene still
        if (g.boss) g.boss.update = () => {};
        g.snapCamera(); g.fade = 0; g.banner.t = 0; __ift.step(1, []); g.snapCamera(); g.render();
      }, [i, n]);
      await h.shot(`look-${rid}-${id}-${i}`);
    }
  }
  console.log(h.errors.length ? h.errors : 'no page errors');
  await h.close();
})().catch((e) => { console.error(e); process.exit(1); });
