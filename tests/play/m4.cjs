// Milestone 4 playthrough: powers 6-10 at their gates, captains 6-10 with their verse cards, Ending B.
// Run: node tests/play/m4.cjs [only]   (only = powers | bosses | story)
const { launch, checker } = require('./helpers.cjs');
const ORDER = ['dash', 'double', 'climb', 'pound', 'sword', 'shield', 'grapple', 'swim', 'heavy', 'valor'];

(async () => {
  const only = process.argv[2] || '';
  const t = checker('m4 playthrough');
  const h = await launch({ query: 'test=1' });
  const { ev } = h;
  const state = () => ev(() => __ift.state());
  const step = (n, keys = []) => ev(([n, keys]) => __ift.step(n, keys), [n, keys]);
  const setup = (n, region, room, link) => ev(([powers, n, region, room, link]) => {
    const g = __ift.game; while (g.ui.cur) g.ui.close('ok'); g.resetSave(); g.save.powers = powers; g.godmode = false;
    for (let i = 1; i <= n; i++) g.save.flags['boss' + i] = 1;
    g.loadRoom(region, room, link); __ift.step(5, []);
  }, [ORDER.slice(0, n), n, region, room, link || null]);
  const place = (cx, cy) => ev(([cx, cy]) => { const p = __ift.game.player; p.x = cx * 16 + 3; p.y = (cy + 1) * 16 - 22; p.vx = p.vy = 0; __ift.game.snapCamera(); for (const s of __ift.game.soldiers) if (Math.abs(s.x - p.x) < 200 && !s.marked) s.gone = true; return __ift.step(2, []); }, [cx, cy]);
  const feetRow = (s) => Math.round((s.player.y + 22) / 16) - 1;

  if (!only || only === 'powers') {
    console.log('Bronze Buckler at the spear hedge and against arrows');
    await setup(6, 1, 'picket'); await place(79, 22); await step(60, ['right']);
    let s = await state();
    t.ok(s.player.x > 81 * 16, 'with the buckler David walks through the spear hedge', s.player.x);
    await h.shot('m4-hedge');
    const refl = await ev(() => {
      const g = __ift.game; g.loadRoom(7, 'quarter'); __ift.step(3, []);
      const arch = g.soldiers.filter((x) => x.kind === 'archer').sort((a, b) => b.y - a.y || a.x - b.x)[0], p = g.player; g.soldiers = [arch];
      p.x = arch.x - 120; p.y = arch.y + arch.h - 22; p.face = 1; arch.face = -1; const hp0 = arch.hp, php = p.hp; let turned = 0;
      for (let i = 0; i < 600 && arch.state !== 'dying' && arch.hp === hp0; i++) { __ift.step(1, []); if (g.shots.some((x) => x.turned)) turned++; }
      return { hp0, hp: arch.hp, state: arch.state, turned, php, phpNow: p.hp };
    });
    t.ok(refl.turned > 0 && (refl.hp < refl.hp0 || refl.state === 'dying') && refl.phpNow === refl.php, 'facing an archer with the sling at rest, his arrow is turned back and strikes him; David is unhurt', refl);
    await h.shot('m4-reflect');

    console.log("Shepherd's Cord at the Socoh perch");
    const cordTry = async () => { await place(31, 27); await step(1, ['cord']); await step(30); const a = await ev(() => !!__ift.game.player.hang); await step(1, ['cord']); await step(30); const b = await ev(() => !!__ift.game.player.hang); await step(1, ['jump', 'right']); await step(24, ['jump', 'right']); const end = await step(40); return { a, b, end }; };
    await setup(6, 2, 'presses');
    let c = await cordTry();
    t.ok(!c.a && feetRow(c.end) === 27, 'without the cord the rings are out of reach', [c.a, feetRow(c.end)]);
    await setup(7, 2, 'presses');
    await place(31, 27); await step(1, ['cord']); await step(8); await h.shot('m4-cord-zip'); await step(22);
    const hang1 = await ev(() => { const p = __ift.game.player; return p.hang && [p.hang.x, p.hang.y]; });
    t.ok(hang1 && hang1[0] === 31 * 16 + 8 && hang1[1] === 21 * 16 + 8, 'the cord carries David up to the first ring, where he hangs', hang1);
    await step(30, ['fire']); await step(1);
    const tags = await ev(() => { const st = __ift.game.stones[__ift.game.stones.length - 1]; return st ? st.tags : null; });
    t.ok(tags && tags.includes('hang'), 'a stone loosed while hanging is marked as such (for Banith)', tags);
    await step(1, ['cord']); await step(30);
    const hang2 = await ev(() => { const p = __ift.game.player; return p.hang && [p.hang.x, p.hang.y]; });
    t.ok(hang2 && hang2[0] === 33 * 16 + 8 && hang2[1] === 17 * 16 + 8, 'and from there to the second', hang2);
    await h.shot('m4-cord-hang');
    await step(1, ['jump', 'right']); await step(24, ['jump', 'right']); s = await step(40);
    t.ok(feetRow(s) === 16 && s.player.onGround, 'a jump from the ring lands him on the perch', [feetRow(s), s.player]);

    console.log('Deep Breath at the grotto under the Brook');
    await setup(8, 1, 'brook');
    const dive = await ev(() => {
      const g = __ift.game, p = g.player; p.x = 17 * 16; p.y = 26 * 16 - 22; __ift.step(2, []);
      let tags = null, wet = false;
      for (let i = 0; i < 900; i++) {
        const cx = p.cx / 16, cy = (p.y + 11) / 16; let keys;
        if (p.inWater) wet = true;
        if (cx < 26.6) keys = cy < 29.2 ? ['right', 'down'] : ['right'];
        else if (cx < 31) keys = cy < 28.6 ? ['right', 'down'] : cy > 29.6 ? ['right', 'up'] : ['right'];
        else if (p.inWater) { keys = ['up']; if (g.room.tileAt(p.cx, p.cy - 14) !== 9) keys = ['up', 'right', 'jump']; }
        else keys = p.onGround ? [] : ['right', 'jump'];
        if (wet && !tags && cx > 22 && cx < 23) { __ift.step(46, ['fire']); __ift.step(1, []); const st = g.stones[g.stones.length - 1]; tags = st ? st.tags : []; }
        __ift.step(1, keys);
        if (p.onGround && cx > 33 && !p.inWater) break;
      }
      return { x: p.x, row: Math.round((p.y + 22) / 16) - 1, hp: p.hp, max: p.maxHp, tags, wet };
    });
    t.ok(dive.wet && dive.hp === dive.max, 'with it, deep water no longer sweeps David back', dive);
    t.ok(dive.tags && dive.tags.includes('swim'), 'a stone loosed in the water is marked as such (for Yishvar)', dive.tags);
    t.ok(dive.row === 25 && dive.x > 33 * 16, 'he dives under the rock wall and climbs out on the grotto bank', dive);
    await h.shot('m4-grotto');

    console.log('Smooth Stone at the bound door');
    const doorTry = async () => { await ev(() => { __ift.game.soldiers = []; }); await place(45, 27); await step(2, ['right']); await step(50, ['fire']); await step(1); await step(40); return ev(() => __ift.game.room.tile(52, 26)); };
    await setup(8, 1, 'picket');
    let door = await doorTry();
    t.ok(door === 8, 'a full-charge stone does not open it before the power is earned', door);
    await setup(9, 1, 'picket'); await ev(() => { __ift.game.soldiers = []; });
    await place(45, 27); await step(2, ['right']); await step(50, ['fire']); await step(1); await step(4); await h.shot('m4-smooth-stone');
    await step(40); door = await ev(() => __ift.game.room.tile(52, 26));
    t.ok(door === 0, 'the Smooth Stone shatters the bound door', door);
    await step(60, ['right']); s = await state();
    t.ok(s.player.x > 52 * 16, 'and David walks in', s.player.x);

    console.log('Mighty Man');
    const frames = async (n) => { await setup(n, 1, 'outskirts'); return ev(() => { let i = 0; while (__ift.game.player.charge < 1 && i < 200) { __ift.step(1, ['fire']); i++; } return i; }); };
    const f9 = await frames(9), f10 = await frames(10);
    t.ok(f10 <= f9 / 2 + 1 && f10 >= f9 / 2 - 2, 'the sling reaches full charge in half the time', [f9, f10]);
  }

  if (!only || only === 'bosses') {
    for (const n of [6, 7, 8, 9, 10].filter((k) => !process.argv[3] || +process.argv[3] === k)) {
      const info = await ev(async (n) => { const b = await import('/src/data/bosses.js'), v = await import('/src/data/verses.js'), p = await import('/src/data/powers.js'); return { name: b.BOSSES[n].name, verse: v.REGION_VERSES.find((x) => x.region === n), tag: v.VERSION_TAG, power: p.POWERS[n - 1] }; }, n);
      console.log(`${info.name} (region ${n})`);
      await setup(n - 1, n, 'arena', 'in');
      let s = await step(30);
      t.ok(s.boss && s.boss.name === info.name && s.maxHp === 5 + n - 1, `${info.name} stands in his ground; David has ${5 + n - 1} health`, [s.boss, s.maxHp]);
      await step(70); await h.shot(`m4-boss${n}-intro`);
      let fight = null, attempts = 0, assisted = false;
      const opts = n === 9 ? { pool: [16, 23] } : n === 6 ? { sword: true } : {};
      for (; attempts < 7; attempts++) {
        // Each attempt runs on its own fixed random seed, so the fights are the same from run to run.
        await ev(([n, k]) => { let sd = (n * 1000 + k * 7919 + 12345) >>> 0; __ift.game.rand = () => { sd = (sd + 0x6D2B79F5) | 0; let x = Math.imul(sd ^ (sd >>> 15), 1 | sd); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }, [n, attempts]);
        if (attempts === 0) { await ev((o) => bot.fightBoss(300, o), opts); await h.shot(`m4-boss${n}-fight-1`); await ev((o) => bot.fightBoss(300, o), opts); await h.shot(`m4-boss${n}-fight-2`); }
        if (attempts === 6) { assisted = true; await ev(() => { __ift.game.godmode = true; }); }
        fight = await ev((o) => bot.fightBoss(12000, o), opts);
        if (fight.won) break;
        console.log('  (David fell; trying again) ' + JSON.stringify(fight));
        await step(130);
      }
      t.ok(fight.won && !assisted, `the scripted fight beats ${info.name} unassisted (attempt ${attempts + 1})`, fight);
      if (assisted) console.log('  NOTE: the bot needed the no-damage switch to finish this fight.');
      console.log('  fight log: ' + JSON.stringify(fight));
      await ev(() => { __ift.game.godmode = false; });
      await step(30); await h.shot(`m4-boss${n}-falls`);
      s = await state();
      for (let i = 0; i < 60 && s.card !== 'verse'; i++) s = await step(10);
      const card = await ev(() => { const el = document.querySelector('#card'); return el && el.querySelector('.verse-text') && { text: el.querySelector('.verse-text').textContent, ref: el.querySelector('.verse-ref .ref').textContent, tag: el.querySelector('.verse-ref .tag').textContent }; });
      t.ok(card && card.text === info.verse.text && card.ref === info.verse.ref && card.tag === info.tag, `his verse card reads ${info.verse.ref} word for word, then the reference and (KJV)`, card);
      await h.shot(`m4-boss${n}-verse`);
      await step(40); await step(1, ['confirm']); s = await step(20);
      // If David is standing where the captain first stood, he takes the relic the moment it drops.
      t.ok((s.relic && s.relic.power === info.power.id) || s.card === 'power', `he drops ${info.power.name}`, s.relic);
      if (!s.relic && s.card !== 'power') { console.log('  (skipping the rest of this captain)'); continue; }
      // If he is still in the cistern: swim up and jump out toward the relic first.
      await ev(() => { const g = __ift.game, p = g.player; for (let i = 0; i < 400 && p.inWater && g.relic; i++) { const d = g.relic.x > p.cx ? 'right' : 'left'; __ift.step(1, i % 12 < 6 ? ['up', d, 'jump'] : ['up', d]); } });
      s = await ev(() => { const g = __ift.game; for (let k = 0; k < 4 && g.relic; k++) { bot.walkTo(g.relic.x - 5, 600); if (g.relic) { __ift.step(1, ['down']); __ift.step(1, ['down', 'jump']); __ift.step(50, []); } } return __ift.step(3, []); });
      const pc = await ev(() => { const el = document.querySelector('#card'); return el && { kind: el.dataset.kind, title: el.querySelector('h2').textContent }; });
      t.ok(pc && pc.kind === 'power' && pc.title === info.power.name && s.powers.includes(info.power.id), `taking it grants ${info.power.name}`, pc);
      await h.shot(`m4-boss${n}-power`);
      await step(40); await step(1, ['confirm']); s = await step(5);
      t.ok(s.card === null && s.flags['boss' + n] === 1 && s.maxHp === 5 + n, 'the victory is saved and a health pip added', [s.flags, s.maxHp]);
    }
    if (!process.argv[3]) {
    console.log('weakness chain, captains 6-10');
    const weak = await ev(async () => {
      const g = __ift.game, out = {}, ORDER = ['dash', 'double', 'climb', 'pound', 'sword', 'shield', 'grapple', 'swim', 'heavy'];
      for (const [n, tag] of [[6, 'sword'], [7, 'reflect'], [8, 'hang'], [9, 'swim'], [10, 'heavy']]) {
        while (g.ui.cur) g.ui.close('ok'); g.resetSave(); g.save.powers = ORDER.slice(0, n - 1); g.loadRoom(n, 'arena', 'in'); __ift.step(120, []);
        const b = g.boss; b.state = 'recover'; b.t = 5; const hp = b.hp;
        b.hit(g, 3, 1, { charge: 1, tags: ['plain'] }); const plain = hp - b.hp; b.state = 'recover'; b.t = 5; const hp2 = b.hp;
        b.hit(g, 3, 1, { charge: 1, tags: [tag] }); out[b.name] = [plain, hp2 - b.hp];
      }
      return out;
    });
    t.ok(Object.values(weak).length === 5 && Object.values(weak).every((v) => v[0] === 3 && v[1] === 6), 'captains 6-10 each take double from the earlier power they are weak to', weak);
    }
  }

  if (!only || only === 'story') {
    console.log('Ending B');
    await setup(10, 0, 'camp');
    await ev(() => { const g = __ift.game; g.save.tally = 199; g.save.flags.hundred = 1; g.save.flags.scene100 = 1; g.loadRoom(0, 'camp'); __ift.step(5, []); bot.walkTo(22 * 16 + 3); __ift.step(1, ['up']); __ift.step(3, []); });
    let choice = await ev(() => [...document.querySelectorAll('#card button')].map((b) => b.textContent));
    t.ok(choice.length === 2 && /Claim Michal/.test(choice[0]), 'at 199 the tent offers only Ending A', choice);
    await step(40); await step(1, ['right']); await step(1); await step(1, ['confirm']); await step(3);
    await ev(() => { const g = __ift.game; g.save.tally = 200; delete g.save.flags.boss10; __ift.step(1, ['up']); __ift.step(3, []); });
    choice = await ev(() => [...document.querySelectorAll('#card button')].map((b) => b.textContent));
    t.ok(choice.length === 2 && /Claim Michal/.test(choice[0]), 'at 200 with the Seren of Gath still standing, it still offers only Ending A', choice);
    await step(40); await step(1, ['right']); await step(1); await step(1, ['confirm']); await step(3);
    await ev(() => { const g = __ift.game; g.save.flags.boss10 = 1; __ift.step(1, ['up']); __ift.step(3, []); });
    choice = await ev(() => [...document.querySelectorAll('#card button')].map((b) => b.textContent));
    t.ok(choice.length === 2 && /full tale/i.test(choice[0]), 'with all 200 and the last captain fallen, the tent offers Ending B', choice);
    await h.shot('m4-saul-full');
    await step(40); await step(1, ['confirm']); let s = await step(5);
    t.ok(s.card === 'endingB', 'choosing it plays Ending B', s.card);
    await h.shot('m4-ending-b-1');
    await step(40); await step(1, ['confirm']); s = await step(5);
    const last = await ev(async () => { const m = await import('/src/data/verses.js'), el = document.querySelector('#card'); return { kind: el.dataset.kind, title: el.querySelector('h2').textContent, text: el.querySelector('.verse-text').textContent, ref: el.querySelector('.verse-ref .ref').textContent, tag: el.querySelector('.verse-ref .tag').textContent, want: m.ENDING_B_VERSE, buttons: el.querySelectorAll('button').length, lastP: [...el.querySelectorAll('.card-in > p:not(.card-hint)')].pop().className }; });
    t.ok(last.kind === 'endingB' && last.text === last.want.text && last.ref === '1 Samuel 18:27' && last.tag === '(KJV)', 'it closes on 1 Samuel 18:27 (KJV), word for word', last);
    t.ok(last.lastP === 'verse-ref' && last.buttons === 1, 'the verse and its reference are the last words on the last card', last);
    await h.shot('m4-ending-b-2');
    await step(40); await step(1, ['confirm']); s = await step(5);
    t.ok(s.card === null && s.flags.endingB === 1 && s.region === 0, 'the ending is recorded and play can go on', s.flags);
  }

  console.log('hygiene');
  t.ok(h.errors.length === 0, 'no page errors', h.errors);
  await h.close();
  process.exit(t.done() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
