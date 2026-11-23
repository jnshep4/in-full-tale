// Variety playthrough: each captain's own attack, and the runner, pikeman and slinger.
// Run: node tests/play/m7.cjs
const { launch, checker } = require('./helpers.cjs');

(async () => {
  const t = checker('m7 variety');
  const h = await launch({ query: 'test=1&nosave=1' });
  const { ev } = h;
  const SIG = { 1: 'advance', 2: 'axe', 3: 'fan', 4: 'rockfall', 5: 'rockfall', 6: 'whirl', 7: 'pots', 8: 'tide', 9: 'bolts', 10: 'step' };

  console.log('captains');
  for (let n = 1; n <= 10; n++) {
    // David stands 110 px in front of the captain, unhurt at first; the captain is made to use his own attack.
    const r = await ev(([n, id]) => {
      const g = __ift.game; g.save.powers = []; g.loadRoom(n, 'arena'); while (g.ui.cur) g.ui.close('ok');
      const b = g.boss, p = g.player, A = b.cfg.attacks.find((a) => a.id === id);
      if (!A) return { missing: true };
      __ift.step(100, []); while (g.ui.cur) g.ui.close('ok');
      p.x = b.x - 110; p.y = b.y + b.h - p.h; p.vx = 0; b.face = -1; g.snapCamera();
      b.state = 'tele'; b.attack = A; b.t = 0.2; b.cool = 9; b.last = id;
      const out = { hp0: p.hp, shots: 0, kinds: {}, moved: 0, x0: b.x, guarded: null };
      for (let i = 0; i < 150; i++) {
        __ift.step(1, []);
        out.shots = Math.max(out.shots, g.shots.length); for (const s of g.shots) out.kinds[s.kind] = 1;
        if (id === 'advance' && b.state === 'act' && out.guarded === null) out.guarded = b.hit(g, 1, 1, { charge: 1 }) === false;
        if (b.state === 'act') out.moved = Math.max(out.moved, Math.abs(b.x - out.x0));
        if (i === 40) g.render();
      }
      out.hp = p.hp; out.state = b.state; out.kinds = Object.keys(out.kinds); out.weak = b.cfg.weak;
      return out;
    }, [n, SIG[n]]);
    await h.shot('m7-boss' + n);
    const want = { advance: r.guarded && r.moved > 20, axe: r.kinds.includes('axe'), fan: r.shots >= 3, rockfall: r.kinds.includes('rock') && r.shots >= 4, whirl: r.moved > 60, pots: r.kinds.includes('pot') && r.kinds.includes('wave'), tide: r.shots >= 2 && r.kinds.includes('wave'), bolts: r.kinds.includes('beam'), step: r.moved > 60 }[SIG[n]];
    t.ok(!r.missing && want && r.hp < r.hp0, `captain ${n} uses ${SIG[n]}, and it hurts a David who stands still`, r);
  }
  const rage = await ev(() => { const g = __ift.game; g.loadRoom(1, 'arena'); while (g.ui.cur) g.ui.close('ok'); __ift.step(100, []); g.godmode = true; const b = g.boss; b.hp = b.maxHp / 2; __ift.step(2, []); const r = { raged: b.raged, note: g.note && g.note.text }; g.godmode = false; return r; });
  t.ok(rage.raged && /RAGES/.test(rage.note), 'at half health a captain rages', rage);

  console.log('soldiers');
  const mix = await ev(async () => { const { REGIONS } = await import('/src/data/regions.js'); const { parseRoom } = await import('/src/world/room.js'); const out = {};
    for (const r of REGIONS) if (r.id > 0) { const c = {}; for (const d of r.rooms) for (const sp of parseRoom(d, r.id).spawns) if (sp.kind) c[sp.kind] = (c[sp.kind] || 0) + 1; out[r.id] = c; } return out; });
  console.log('   kinds by region:', JSON.stringify(mix));
  t.ok(!mix[1].runner && !mix[2].runner && !mix[1].pike && !mix[2].slinger && mix[3].runner && mix[4].pike && Object.keys(mix).some((k) => mix[k].slinger), 'regions 1 and 2 keep their first troops; runners, pikemen and slingers join later', mix);
  for (const kind of ['runner', 'pike', 'slinger']) {
    const r = await ev(async (kind) => {
      const { Soldier } = await import('/src/ent/soldier.js');
      const g = __ift.game; g.godmode = false; g.loadRoom(1, 'outskirts'); while (g.ui.cur) g.ui.close('ok');
      const p = g.player; p.x = 8 * 16; __ift.step(5, []);
      const s = new Soldier({ type: 'soldier', kind, cx: kind === 'slinger' ? 16 : 13, cy: 23 }, false, 5); s.face = -1; g.soldiers = [s]; g.snapCamera();
      const out = { hp0: p.hp, shots: {}, far: 0, states: {} };
      for (let i = 0; i < 260 && p.hp === out.hp0; i++) { __ift.step(1, []); out.states[s.state] = 1; for (const q of g.shots) out.shots[q.kind] = 1; if (s.state === 'thrust') out.far = Math.max(out.far, Math.abs(s.cx - p.cx)); if (s.state === 'windup' && s.t < 0.1) g.render(); }
      out.hp = p.hp; out.vx = s.vx; const sx = s.x; let far = 0; for (let i = 0; i < 50; i++) { __ift.step(1, []); far = Math.max(far, (s.x - sx) * -s.face); } out.back = far > 12; out.far2 = far; g.render(); out.shots = Object.keys(out.shots); out.states = Object.keys(out.states);
      return out;
    }, kind);
    await h.shot('m7-' + kind);
    const want = kind === 'runner' ? r.back : kind === 'pike' ? r.far > 30 : r.shots.includes('rock');
    t.ok(r.hp < r.hp0 && want, { runner: 'a runner strikes and springs back', pike: 'a pikeman strikes from beyond a spear\'s reach', slinger: 'a slinger lobs a stone that finds a David who stands still' }[kind], r);
  }
  t.ok(h.errors.length === 0, 'no page errors', h.errors);
  await h.close();
  process.exit(t.done() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
