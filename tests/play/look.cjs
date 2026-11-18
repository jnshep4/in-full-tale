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
      await h.ev(([i, n]) => { const g = __ift.game; g.cam.x = Math.min(g.maxCamX, (g.maxCamX) * (n === 1 ? 0 : i / (n - 1))); g.cam.y = g.maxCamY; g.camTarget = () => ({ x: g.cam.x, y: g.cam.y }); g.fade = 0; g.banner.t = 0; g.render(); }, [i, n]);
      await h.shot(`look-${rid}-${id}-${i}`);
    }
    await h.ev(() => { delete __ift.game.camTarget; });
  }
  console.log(h.errors.length ? h.errors : 'no page errors');
  await h.close();
})().catch((e) => { console.error(e); process.exit(1); });
