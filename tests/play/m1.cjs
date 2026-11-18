// Milestone 1 playthrough: movement, sling, marked soldier, trophy pop and pickup, HUD tally, save.
// Run: node tests/play/m1.cjs
const { launch, checker } = require('./helpers.cjs');

(async () => {
  const t = checker('m1 playthrough');
  const h = await launch();
  const { ev } = h;
  const state = () => ev(() => __ift.state());
  const step = (n, keys = []) => ev(([n, keys]) => __ift.step(n, keys), [n, keys]);

  console.log('movement');
  let s0 = await step(30);
  t.ok(s0.player.onGround, 'David starts on the ground', s0.player);
  let s1 = await step(60, ['right']);
  t.ok(s1.player.x - s0.player.x > 100, 'holding right runs right', [s0.player.x, s1.player.x]);
  let s2 = await step(40, ['left']);
  t.ok(s2.player.x < s1.player.x && s2.player.face === -1, 'holding left turns and runs left');
  await step(20);
  const ground = (await state()).player.y;
  let top = ground;
  await step(1, ['jump']);
  for (let i = 0; i < 30; i++) { const s = await step(1, ['jump']); top = Math.min(top, s.player.y); }
  const full = ground - top;
  let s3 = await step(40);
  t.ok(full > 48 && full < 72, 'held jump rises about 3.7 tiles', full);
  t.ok(s3.player.onGround && Math.abs(s3.player.y - ground) < 0.5, 'and lands back on the ground');
  top = ground; await step(1, ['jump']);
  for (let i = 0; i < 40; i++) { const s = await step(1); top = Math.min(top, s.player.y); }
  t.ok(ground - top < full - 15, 'a tapped jump is shorter than a held one', [ground - top, full]);

  console.log('sling');
  await step(2, ['right']);
  let c = await step(20, ['fire']);
  t.ok(c.player.charge > 0.3 && c.player.charge < 1, 'holding fire charges the sling', c.player.charge);
  c = await step(40, ['fire']);
  t.ok(c.player.charge === 1, 'charge tops out at full');
  await h.shot('m1-charging');
  c = await step(1);
  t.ok(c.stones === 1, 'releasing looses one stone', c.stones);
  const flat = await ev(() => { const st = __ift.game.stones[0], x0 = st.x, y0 = st.y; while (__ift.game.stones.length) __ift.step(1, []); return { dx: st.x - x0, dy: st.y - y0 }; });
  t.ok(flat.dx > 125 && flat.dx < 190 && flat.dy > 10, 'a full-charge stone flies level for about eight tiles, then drops', flat);
  await step(45, ['fire', 'up', 'right']); await step(1, ['up', 'right']);
  const lvl = await ev(() => { const st = __ift.game.stones[0], ys = []; for (let i = 0; i < 12 && __ift.game.stones.length; i++) { ys.push(st.y); __ift.step(1, []); } return ys; });
  t.ok(Math.max(...lvl) - Math.min(...lvl) < 0.5, 'on his feet David cannot aim: holding up changes nothing, the stone still flies level', lvl.slice(0, 4));
  await step(30);

  console.log('marked soldier and trophy');
  const id = '1.outskirts.2';                                   // the first marked soldier, on the rise
  await ev(() => bot.walkTo(390));
  let s = await state();
  t.ok(s.player.y < ground - 20, 'climbed the two-tile rise', s.player);
  const before = s.soldiers.find((x) => x.id === id);
  t.ok(before && before.marked && before.hp === 4, 'marked soldier is posted there', before);
  await h.shot('m1-marked-soldier');
  // A light stone from the front glances off the shield.
  const blocked = await ev((id) => {
    const g = __ift.game, sol = g.soldiers.find((x) => x.id === id), p = g.player;
    const seen = []; const orig = sol.hit.bind(sol);
    sol.hit = (...a) => { seen.push({ state: sol.state, face: sol.face, dir: a[2], charge: a[3], gap: Math.round(Math.abs(sol.cx - p.cx)) }); return orig(...a); };
    const gap = () => Math.abs(sol.cx - p.cx);
    for (let i = 0; i < 900 && !(sol.state === 'chase' && gap() > 54 && gap() < 76 && sol.face === -p.face); i++) {
      const toward = sol.cx > p.cx ? 'right' : 'left', away = sol.cx > p.cx ? 'left' : 'right';
      __ift.step(1, p.face !== Math.sign(sol.cx - p.cx) ? [toward] : gap() <= 54 ? [away, 'fire'] : []);
    }
    __ift.step(1, []);                                          // let go of any held charge first
    for (let i = 0; i < 60 && g.stones.length; i++) __ift.step(1, []);
    seen.length = 0;
    const hp = sol.hp; bot.shoot(2); for (let i = 0; i < 30 && g.stones.length; i++) __ift.step(1, []);
    delete sol.hit;
    return { hp, after: sol.hp, seen };
  }, id);
  t.ok(blocked.after === blocked.hp, 'an uncharged stone from the front is turned by the shield', blocked);
  const fight = await ev((id) => bot.fight(id), id);
  t.ok(fight.fell, 'charged stones bring the marked soldier down', fight);
  s = await state();
  const tr0 = s.trophies.find((x) => x.id === id);
  t.ok(!!tr0 && !tr0.rest && tr0.vy < 0, 'his trophy bursts out, moving upward', tr0);
  t.ok(s.tally === 0, 'tally does not move until the trophy is collected');
  await step(4); await h.shot('m1-trophy-pop');
  // Back away and watch it bounce and settle.
  const flight = await ev((id) => {
    const g = __ift.game, tr = g.trophies.find((x) => x.id === id);
    g.godmode = true;                                         // this watches the trophy for 15 seconds; other soldiers must not end the watch
    let bounces = 0, prev = tr.vy, blinks = 0, frames = 0;
    const away = g.player.cx < tr.cx ? 'left' : 'right';
    for (; frames < 900; frames++) {
      __ift.step(1, Math.abs(g.player.cx - tr.cx) < 90 ? [away] : []);
      if (prev > 0 && tr.vy < 0) bounces++;
      prev = tr.vy; if (tr.blink(g.time)) blinks++;
      if (tr.taken) return { taken: true };
    }
    g.godmode = false;
    return { bounces, blinks, rest: tr.rest, still: g.trophies.includes(tr), secs: frames / 60 };
  }, id);
  t.ok(flight.bounces >= 2, 'the trophy bounces before settling', flight);
  t.ok(flight.rest && flight.still, 'after 15 seconds it is still there, at rest (never disappears)', flight);
  t.ok(flight.blinks > 0, 'it blinks while it waits');
  await h.shot('m1-trophy-resting');
  const hpBefore = (await state()).player.hp;
  const got = await ev((id) => { const tr = __ift.game.trophies.find((x) => x.id === id); bot.walkTo(tr.cx - 5); return __ift.step(2, []); }, id);
  t.ok(got.tally === 1 && !got.trophies.find((x) => x.id === id), 'walking over it collects it: tally 1 of 200', got.tally);
  await step(10); await h.shot('m1-collected');
  const saved = await ev(() => JSON.parse(localStorage.getItem('inFullTale.save.v1')));
  t.ok(saved && saved.tally === 1 && saved.soldiers[id] === 'c', 'the pickup is written to localStorage', saved && saved.soldiers);

  console.log('damage does not cost trophies');
  const hurt = await ev(() => {
    __ift.game.loadRoom(1, 'outskirts');                     // re-enter the room: unmarked soldiers are back at their posts
    const g = __ift.game, p = g.player; let n = 0;
    const sol = g.soldiers.find((x) => !x.marked);           // the unmarked soldier on the plateau
    bot.walkTo(sol.x - 60);
    while (p.hp === p.maxHp && n++ < 1500 && !p.dead) __ift.step(1, sol.cx > p.cx + 30 ? ['right'] : sol.cx < p.cx - 30 ? ['left'] : []);
    return { hp: p.hp, max: p.maxHp, tally: g.save.tally, frames: n };
  });
  t.ok(hurt.hp < hurt.max, 'a spear thrust costs health', hurt);
  t.ok(hurt.tally === 1, 'and the tally is untouched');
  await h.shot('m1-hurt');

  console.log('unmarked soldiers and respawn rules');
  const plain = await ev(() => { const g = __ift.game; const n0 = g.trophies.length; const r = bot.fight(null); __ift.step(60, []); return { fell: r.fell, newTrophies: g.trophies.length - n0, tally: g.save.tally, hp: g.player.hp }; });
  t.ok(plain.fell && plain.newTrophies === 0 && plain.tally === 1, 'an unmarked soldier drops no trophy', plain);

  console.log('an uncollected trophy survives a reload');
  const id2 = '1.outskirts.0';
  const left = await ev((id) => {
    const g = __ift.game, sol = g.soldiers.find((x) => x.id === id);
    sol.die(g, 1);                                            // fell him directly; the fight itself is covered above
    __ift.step(120, []);
    return { waiting: g.trophies.some((x) => x.id === id), save: JSON.parse(localStorage.getItem('inFullTale.save.v1')).soldiers[id] };
  }, id2);
  t.ok(left.waiting && Array.isArray(left.save), 'fallen soldier with an uncollected trophy is saved as pending', left);
  await h.reload();
  s = await step(30);
  t.ok(s.tally === 1, 'tally survives a reload', s.tally);
  t.ok(!s.soldiers.find((x) => x.id === id) && !s.soldiers.find((x) => x.id === id2), 'fallen marked soldiers do not respawn');
  t.ok(s.soldiers.filter((x) => !x.marked).length === 2, 'unmarked soldiers do respawn');
  t.ok(s.trophies.some((x) => x.id === id2) && !s.trophies.some((x) => x.id === id), 'the uncollected trophy is waiting; the collected one is gone', s.trophies);
  t.ok(s.soldiers.filter((x) => x.marked).length === 4, 'four marked soldiers remain of six');

  console.log('debug menu');
  const dbg = await ev(() => {
    __ift.step(1, ['debug']); __ift.step(1, []);
    const open = !document.getElementById('debug').hidden;
    document.getElementById('dbg-tally').value = 57; document.getElementById('dbg-set').click();
    document.querySelector('[data-power="dash"]').click();
    const r = { open, tally: __ift.game.save.tally, powers: [...__ift.game.save.powers], warps: document.getElementById('dbg-warp').options.length };
    document.getElementById('dbg-set').previousElementSibling.querySelector('input').value = 1; document.getElementById('dbg-set').click();
    document.querySelector('[data-power="dash"]').click();
    __ift.step(1, ['debug']); __ift.step(1, []);
    r.closed = document.getElementById('debug').hidden; r.tallyBack = __ift.game.save.tally;
    return r;
  });
  t.ok(dbg.open && dbg.closed, 'backquote opens and closes the hidden debug menu', dbg);
  t.ok(dbg.tally === 57 && dbg.tallyBack === 1, 'debug menu sets the tally', dbg);
  t.ok(dbg.powers.includes('dash') && dbg.warps >= 1, 'debug menu grants powers and lists warps', dbg);

  console.log('hygiene');
  t.ok(h.errors.length === 0, 'no page errors', h.errors);
  const external = h.requests.filter((u) => !u.startsWith(`http://127.0.0.1:${h.port}/`) && !u.startsWith('data:'));
  t.ok(external.length === 0, 'no network requests beyond the site itself', external);
  await h.close();

  // Real-time pass: real keyboard events through the normal loop, plus a frame-rate reading.
  console.log('real-time input and frame rate');
  const r = await launch({ query: 'nosave=1&at=1/outskirts' });
  await r.page.waitForTimeout(700);
  const x0 = (await r.ev(() => __ift.state())).player.x;
  await r.page.keyboard.down('ArrowRight'); await r.page.waitForTimeout(600); await r.page.keyboard.up('ArrowRight');
  await r.page.keyboard.down('KeyX'); await r.page.waitForTimeout(900); await r.page.keyboard.up('KeyX');
  await r.page.waitForTimeout(1500);
  const rt = await r.ev(() => ({ s: __ift.state(), fps: __ift.fps() }));
  t.ok(rt.s.player.x - x0 > 40, 'keyboard input moves David in the live loop', [x0, rt.s.player.x]);
  t.ok(rt.fps >= 50, 'frame rate holds near 60 in headless Chromium (software rendering)', rt.fps);
  t.ok(r.errors.length === 0, 'no page errors in the live loop', r.errors);
  await r.shot('m1-live');
  await r.close();

  process.exit(t.done() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
