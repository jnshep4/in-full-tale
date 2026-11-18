// Milestone 2 playthrough: the hub, region 1's rooms and gates, Shalmek, the verse card, Fleet Foot.
// Run: node tests/play/m2.cjs
const { launch, checker } = require('./helpers.cjs');

(async () => {
  const t = checker('m2 playthrough');
  const h = await launch({ query: 'test=1' });
  const { ev } = h;
  const state = () => ev(() => __ift.state());
  const step = (n, keys = []) => ev(([n, keys]) => __ift.step(n, keys), [n, keys]);
  const place = (cx, cy) => ev(([cx, cy]) => { const p = __ift.game.player; p.x = cx * 16 + 3; p.y = (cy + 1) * 16 - 22; p.vx = p.vy = 0; __ift.game.snapCamera(); return __ift.step(2, []); }, [cx, cy]);

  console.log('the hub');
  let s = await step(30);
  t.ok(s.region === 0 && s.room === 'camp', "a new game starts in Saul's camp", [s.region, s.room]);
  await h.shot('m2-hub-start');
  const doors = await ev(() => { const g = __ift.game; return g.room.links.map((l) => [l.id, g.doorState(l), l.needs || null]); });
  t.ok(doors.filter((d) => d[0].startsWith('d')).length === 10, 'the camp has ten gateways', doors.length);
  t.ok(doors.find((d) => d[0] === 'd1')[1] === 'open', 'gateway 1 stands open');
  t.ok(doors.filter((d) => /^d([2-9]|10)$/.test(d[0])).every((d) => d[1] !== 'open' && d[2]), 'gateways 2-10 are shut, each keyed to a power', doors);
  await ev(() => bot.walkTo(22 * 16 + 3));
  s = await step(2);
  t.ok(s.door === 'tent', "David can stand at Saul's tent", s.door);
  await step(1, ['up']); s = await step(2);
  const tent = await ev(() => document.querySelector('#card') && document.querySelector('#card').textContent);
  t.ok(s.card === 'saul' && /hundred/.test(tent || ''), "Saul's tent states the bride price", tent);
  await h.shot('m2-saul-tent');
  await step(40); await step(1, ['confirm']); s = await step(2);
  t.ok(s.card === null, 'the card is dismissed with Enter');
  await ev(() => bot.walkTo(47 * 16 + 3)); await step(1, ['up']); s = await step(3);
  t.ok(s.region === 0, 'a sealed gateway does not open', s.region);
  await h.shot('m2-hub-sealed');
  await ev(() => bot.walkTo(36 * 16 + 3)); await h.shot('m2-hub-gate1');
  await step(1, ['up']); s = await step(20);
  t.ok(s.region === 1 && s.room === 'outskirts', 'gateway 1 leads to the Valley of Elah', [s.region, s.room]);
  await h.shot('m2-elah-arrival');

  console.log('room exits');
  await place(96, 23); await step(40, ['right']); s = await step(10);
  t.ok(s.room === 'brook', "walking off the valley's east edge enters the Brook", s.room);
  t.ok(s.player.x < 60, 'David arrives at its west edge', s.player.x);
  await step(30, ['left']); s = await step(10);
  t.ok(s.room === 'outskirts' && s.player.x > 1500, 'and walking back west returns him', [s.room, s.player.x]);
  await ev(() => __ift.game.loadRoom(1, 'brook', 'west')); await step(20);

  console.log('gates hold without their powers');
  await place(14, 25); await step(50, ['right']);
  s = await state();
  await h.shot('m2-brook-pool');
  const hp0 = s.player.hp;
  await step(60, ['right']); s = await step(30);
  t.ok(s.player.hp === hp0 - 1 && s.player.x < 18 * 16, 'deep water carries David back to the bank and costs one health', s.player);
  await place(73, 25); await step(60, ['right']); s = await state();
  t.ok(s.player.x < 76 * 16 - 9, 'the reed screen blocks the way without Fleet Foot', s.player.x);
  await h.shot('m2-reed-screen');
  await step(1, ['dash']); await step(30, ['right']); s = await state();
  t.ok(s.player.x < 76 * 16 - 9, 'pressing dash does nothing before the power is earned', s.player.x);
  await ev(() => __ift.game.loadRoom(1, 'picket', 'west')); await step(10);
  await place(50, 27); await step(60, ['right']); s = await state();
  t.ok(s.player.x < 52 * 16 - 9, 'the bound door is shut', s.player.x);
  await h.shot('m2-bound-door');
  await place(79, 22); await step(40, ['right']); s = await state();
  t.ok(s.player.x < 80 * 16 - 9, 'the spear hedge is shut', s.player.x);
  await h.shot('m2-spear-hedge');
  await place(26, 24); await h.shot('m2-watch-rock');
  await place(72, 27); await h.shot('m2-mesa');

  console.log('soldiers on gated ledges (feedback of 2026-11-18)');
  await ev(() => __ift.game.loadRoom(1, 'picket', 'west')); await step(5);
  const ledge = await ev(() => {
    const g = __ift.game, p = g.player, sol = g.soldiers.find((x) => x.marked && Math.abs(x.x - 34 * 16) < 40 && x.y < 20 * 16);
    g.soldiers = [sol]; sol.update = () => {}; sol.x = 31 * 16 + 1; const hp0 = sol.hp;       // hold him at the very edge of the watch rock
    // From the ground beside the rock, at every height of a jump, loose a full-charge stone at him.
    for (let k = 0; k < 14; k++) {
      p.x = 26 * 16; p.y = 28 * 16 - 22; p.vx = p.vy = 0; p.face = 1; __ift.step(2, ['right']); __ift.step(44, ['fire']);
      __ift.step(1, ['fire', 'jump']); __ift.step(2 + k * 2, ['fire', 'jump']); __ift.step(1, ['jump']); __ift.step(50, []);
    }
    const untouched = sol.hp === hp0;
    // Now fell him where he stands and knock the ring off the rock: it must stay on the ground to be taken.
    sol.die(g, -1); const tr = g.trophies[0]; tr.vx = -120; tr.vy = -200; p.x = 10 * 16; __ift.step(360, []);
    const low = { rest: tr.rest, y: Math.round(tr.cy), home: Math.round(tr.home.y) };
    for (let k = 0; k < 4 && g.trophies.length; k++) { bot.walkTo(tr.cx - 5); __ift.step(30, []); }
    return { untouched, low, tally: g.save.tally };
  });
  t.ok(ledge.untouched, 'the soldier on the watch rock cannot be hit from the ground below, at any height of a jump', ledge);
  t.ok(ledge.low.rest && ledge.low.y > ledge.low.home + 60, 'a ring that drops from a ledge stays where it lands for six seconds and more', ledge.low);
  t.ok(ledge.tally === 1, 'and can be picked up there', ledge.tally);
  await ev(() => { const g = __ift.game; g.save.tally = 0; g.save.soldiers = {}; g.persist(); });

  console.log('Shalmek');
  await place(99, 27); await step(20, ['right']); await ev(() => bot.walkTo(100 * 16 + 3)); s = await step(2);
  t.ok(s.door === 'arena', "David stands at the gate of Shalmek's ground", s.door);
  await h.shot('m2-arena-gate');
  await step(1, ['up']); s = await step(5);
  t.ok(s.room === 'arena' && s.boss && s.boss.name === 'Shalmek' && s.boss.state === 'intro', 'entering wakes the captain', s.boss);
  await step(40); await h.shot('m2-boss-intro');
  await step(1, ['left']); await step(1, ['up']); s = await step(3);
  t.ok(s.room === 'arena', 'the way out is barred while he stands');
  let fight = null, attempts = 0;
  for (; attempts < 6; attempts++) {
    await ev((k) => { let sd = (1000 + k * 7919 + 12345) >>> 0; __ift.game.rand = () => { sd = (sd + 0x6D2B79F5) | 0; let x = Math.imul(sd ^ (sd >>> 15), 1 | sd); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }, attempts);
    await step(60);
    if (attempts === 0) { await ev(() => bot.fightBoss(260)); await h.shot('m2-boss-fight-1'); await ev(() => bot.fightBoss(240)); await h.shot('m2-boss-fight-2'); }
    fight = await ev(() => bot.fightBoss(12000));
    if (fight.won) break;
    console.log('  (David fell; trying again)', JSON.stringify(fight));
    await step(120);
  }
  t.ok(fight.won, `the scripted fight beats Shalmek on foot, unassisted (attempt ${attempts + 1})`, fight);
  console.log('  fight log: ' + JSON.stringify(fight));
  await step(20); await h.shot('m2-boss-falls');
  s = await step(100);
  t.ok(s.boss === null || s.boss.state === 'dying', 'he collapses and dissolves in light');
  for (let i = 0; i < 40 && s.card !== 'verse'; i++) s = await step(10);
  t.ok(s.card === 'verse', 'a verse card appears', s.card);
  const card = await ev(async () => {
    const m = await import('/src/data/verses.js'), el = document.querySelector('#card');
    return { text: el.querySelector('.verse-text').textContent, ref: el.querySelector('.verse-ref .ref').textContent, tag: el.querySelector('.verse-ref .tag').textContent, want: m.REGION_VERSES.find((v) => v.region === 1), wantTag: m.VERSION_TAG };
  });
  t.ok(card.text === card.want.text, 'the card shows 1 Samuel 16:12 word for word', card.text);
  t.ok(card.ref === '1 Samuel 16:12' && card.tag === '(KJV)', 'then the reference and "(KJV)"', [card.ref, card.tag]);
  await h.shot('m2-verse-card');
  s = await step(120);
  t.ok(s.card === 'verse' && s.relic === null, 'the card waits for the player; the power has not dropped yet');
  await step(1, ['confirm']); s = await step(5);
  t.ok(s.card === null && s.relic && s.relic.power === 'dash', 'dismissing it drops the power-up', s.relic);
  t.ok(s.flags.boss1 === 1 && s.maxHp === 6, 'the victory is saved and David gains a health pip', [s.flags, s.maxHp]);
  await step(30); await h.shot('m2-relic');
  await ev(() => bot.walkTo(__ift.game.relic.x - 5)); s = await step(3);
  t.ok(s.card === 'power' && s.powers.includes('dash'), 'taking it grants Fleet Foot', [s.card, s.powers]);
  await h.shot('m2-power-card');
  await step(40); await step(1, ['confirm']); s = await step(5);

  console.log('Fleet Foot');
  await ev(() => bot.walkTo(200)); await step(20);
  const x0 = (await state()).player.x;
  await step(1, ['right', 'dash']); s = await step(9, ['right']);
  t.ok(s.player.x - x0 > 40, 'dash covers about three tiles in a sixth of a second', s.player.x - x0);
  await h.shot('m2-dash');
  const doorsNow = await ev(() => { const g = __ift.game; return g.room.links.map((l) => [l.id, g.doorState(l)]); });
  t.ok(doorsNow.find((d) => d[0] === 'out')[1] === 'open', 'a way back to camp opens in the arena', doorsNow);
  await ev(() => __ift.game.loadRoom(1, 'brook', 'west')); await place(72, 25);
  await step(6, ['right']); await step(1, ['right', 'dash']); s = await step(20, ['right']);
  t.ok(s.player.x > 77 * 16, 'dashing bursts through the reed screen', s.player.x);
  await h.shot('m2-reeds-broken');
  const nook = await ev(() => { const g = __ift.game, sol = g.soldiers.find((x) => x.marked && Math.abs(x.x - 82 * 16) < 60 && x.y > 23 * 16); if (!sol) return null; sol.die(g, 1); __ift.step(90, []); const tr = g.trophies.find((x) => x.id === sol.id); bot.walkTo(tr.cx - 5); __ift.step(3, []); return { id: sol.id, tally: g.save.tally }; });
  t.ok(nook && nook.tally === 1, 'the marked soldier behind it can now be reached and his trophy taken', nook);
  await h.reload();
  s = await step(10);
  const open = await ev(() => { const g = __ift.game; if (g.room.id !== 'brook') g.loadRoom(1, 'brook', 'west'); return g.room.tile(76, 24); });
  t.ok(open === 0 && s.powers.includes('dash') && s.flags.boss1 === 1, 'after a reload the screen stays open and the power and victory are kept', [open, s.powers]);
  await ev(() => __ift.game.loadRoom(1, 'arena', 'in')); s = await step(10);
  t.ok(s.boss === null, 'Shalmek does not return');
  await ev(() => bot.walkTo(29 * 16 + 3)); await step(1, ['up']); s = await step(10);
  t.ok(s.region === 0 && Math.abs(s.player.x - 36 * 16) < 20, "the arena's far door leads back to camp, at gateway 1", [s.region, s.player.x]);
  await h.shot('m2-hub-after');
  await ev(() => bot.walkTo(47 * 16 + 3)); s = await step(2);
  const d2 = await ev(() => __ift.game.doorState(__ift.game.room.link('d2')));
  t.ok(d2 === 'sealed' || d2 === 'open', 'gateway 2 is no longer locked for want of a power (sealed only until region 2 is built)', d2);

  console.log('hygiene');
  t.ok(h.errors.length === 0, 'no page errors', h.errors);
  const external = h.requests.filter((u) => !u.startsWith(`http://127.0.0.1:${h.port}/`) && !u.startsWith('data:'));
  t.ok(external.length === 0, 'no network requests beyond the site itself', external);
  await h.close();
  process.exit(t.done() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
