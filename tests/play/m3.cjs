// Milestone 3 playthrough: powers 2-5 at their gates, the new soldiers, captains 2-5 with their
// verse cards, Goliath's sword, the scene at 100, and Ending A.
// Run: node tests/play/m3.cjs [only]   (only = powers | soldiers | bosses | story)
const { launch, checker } = require('./helpers.cjs');
const ORDER = ['dash', 'double', 'climb', 'pound', 'sword', 'shield', 'grapple', 'swim', 'heavy', 'valor'];

(async () => {
  const only = process.argv[2] || '';
  const t = checker('m3 playthrough');
  const h = await launch({ query: 'test=1' });
  const { ev } = h;
  const state = () => ev(() => __ift.state());
  const step = (n, keys = []) => ev(([n, keys]) => __ift.step(n, keys), [n, keys]);
  // Fresh save with the first n powers and the first n captains beaten, standing in a room.
  const setup = (n, region, room, link, extra = []) => ev(([powers, n, region, room, link]) => {
    const g = __ift.game; while (g.ui.cur) g.ui.close('ok'); g.resetSave(); g.save.powers = powers; g.godmode = false;
    for (let i = 1; i <= n; i++) g.save.flags['boss' + i] = 1;
    g.loadRoom(region, room, link); __ift.step(5, []);
  }, [[...ORDER.slice(0, n), ...extra], n, region, room, link || null]);
  const place = (cx, cy) => ev(([cx, cy]) => { const p = __ift.game.player; p.x = cx * 16 + 3; p.y = (cy + 1) * 16 - 22; p.vx = p.vy = 0; __ift.game.snapCamera(); for (const s of __ift.game.soldiers) if (Math.abs(s.x - p.x) < 200 && !s.marked) s.gone = true; return __ift.step(2, []); }, [cx, cy]);
  const feetRow = (s) => Math.round((s.player.y + 22) / 16) - 1;      // standing row

  if (!only || only === 'powers') {
    console.log("Hind's Feet (double jump) at the Socoh tower");
    const tryTower = async () => { await place(71, 23); await step(1, ['jump', 'right']); await step(19, ['jump', 'right']); await step(1, ['right']); await step(1, ['jump', 'right']); await step(40, ['jump', 'right']); return step(30); };
    await setup(1, 2, 'vineyard');
    let s = await tryTower();
    t.ok(feetRow(s) === 23, 'without it, the five-tile tower is out of reach', feetRow(s));
    await setup(2, 2, 'vineyard');
    s = await tryTower();
    t.ok(feetRow(s) === 18 && s.player.onGround, 'a second jump in the air lands David on top', [feetRow(s), s.player]);
    await h.shot('m3-double-jump');

    console.log('Rock Hold (wall climb) at the Socoh watchtower');
    const tryClimb = async () => { await place(41, 29); await step(1, ['jump', 'right']); await step(24, ['jump', 'right']); const mid = await step(20, ['right', 'up']); await step(200, ['right', 'up']); const end = await step(40, ['right']); return { mid, end }; };
    await setup(2, 2, 'watch');
    let c = await tryClimb();
    t.ok(feetRow(c.end) === 29, 'without it, David slides back to the ground', feetRow(c.end));
    await setup(3, 2, 'watch');
    await place(41, 29); await step(1, ['jump', 'right']); await step(24, ['jump', 'right']); s = await step(10, ['right', 'up']);
    const cling = await ev(() => __ift.game.player.cling);
    t.ok(cling === 1 && s.player.vy < 0, 'pressing toward the wall he clings, and climbs with up', [cling, s.player.vy]);
    await h.shot('m3-wall-climb');
    await step(30, ['right', 'fire']); await step(1, ['right']);
    const tags = await ev(() => { const st = __ift.game.stones[__ift.game.stones.length - 1]; return st ? st.tags : null; });
    t.ok(tags && tags.includes('wall'), 'a stone loosed from the wall is marked as such (for Maroz)', tags);
    s = await ev(() => { const p = __ift.game.player; for (let i = 0; i < 500 && !(p.onGround && p.y < 16 * 16); i++) __ift.step(1, ['right', 'up']); return __ift.step(5, []); });
    t.ok(feetRow(s) === 13 && s.player.onGround, 'he tops out sixteen tiles up', [feetRow(s), s.player]);
    await h.shot('m3-tower-top');

    console.log("Lion's Fall (ground pound) at the Socoh cellar");
    const tryPound = async () => { await place(84, 25); await step(1, ['jump']); await step(12, ['jump']); await step(1, ['down']); await step(1, ['down', 'jump']); return step(50, []); };
    await setup(3, 2, 'vineyard');
    s = await tryPound();
    t.ok(feetRow(s) === 25, 'without it, the cracked slab holds', feetRow(s));
    await setup(4, 2, 'vineyard');
    s = await tryPound();
    const slab = await ev(() => [__ift.game.room.tile(84, 26), __ift.game.room.tile(85, 26)]);
    t.ok(slab[0] === 0 && slab[1] === 0 && feetRow(s) > 26, 'the pound breaks it and drops David into the cellar', [slab, feetRow(s)]);
    await h.shot('m3-cellar');
    const cellarSol = await ev(() => __ift.game.soldiers.filter((x) => x.marked && x.y > 26 * 16 && Math.abs(x.x - 88 * 16) < 80).length);
    t.ok(cellarSol === 1, 'a marked soldier waits below', cellarSol);
    await ev(() => { const g = __ift.game, p = g.player; p.x = 84 * 16 + 3; p.y = 29 * 16 - 22; p.vx = p.vy = 0; __ift.step(3, []); });
    await step(1, ['jump']); await step(22, ['jump']); s = await step(40, ['left']);
    t.ok(feetRow(s) === 25, 'the plank under the hole is the way back out', feetRow(s));

    console.log("Goliath's sword at the Sorek thorn hedge");
    await setup(4, 3, 'descent'); await place(43, 31); await step(2, ['right']);
    await step(1, ['melee']); await step(40, ['right']); s = await state();
    t.ok(s.player.x < 45 * 16 - 9, 'without the sword, the thorns hold', s.player.x);
    await setup(5, 3, 'descent'); await place(43, 31); await step(2, ['right']);
    await step(1, ['melee']); await step(3); await h.shot('m3-sword-swing');
    await step(40, ['right']); s = await state();
    t.ok(s.player.x > 45 * 16, 'a stroke cuts them and David walks in', s.player.x);
    const hit = await ev(() => { const g = __ift.game, sol = g.soldiers.find((x) => x.marked && Math.abs(x.x - 50 * 16) < 60 && x.y > 28 * 16), hp = sol.hp; const p = g.player; p.x = sol.x - 16; p.face = 1; __ift.step(1, ['melee']); __ift.step(5, []); return [hp, sol.hp]; });
    t.ok(hit[1] === hit[0] - 3, 'the sword strikes a soldier for 3', hit);
  }

  if (!only || only === 'soldiers') {
    console.log('archers, heavy infantry, lions');
    await setup(1, 2, 'vineyard');
    await ev(() => { const g = __ift.game, p = g.player; p.x = 27 * 16; p.y = 28 * 16 - 22; g.soldiers = g.soldiers.filter((x) => x.kind === 'archer' && Math.abs(x.x - 34 * 16) < 40); __ift.step(2, []); });
    let got = await ev(() => { const g = __ift.game; let n = 0, seen = 0; for (let i = 0; i < 400 && g.player.hp === g.player.maxHp; i++) { __ift.step(1, []); seen = Math.max(seen, g.shots.length); n++; } return { n, seen, hp: g.player.hp, max: g.player.maxHp }; });
    t.ok(got.seen > 0 && got.hp < got.max, 'an archer looses arrows from range, and they wound', got);
    await h.shot('m3-archer');
    await setup(1, 2, 'presses');
    got = await ev(() => {
      const g = __ift.game, p = g.player, sol = g.soldiers.find((x) => x.kind === 'heavy'); g.soldiers = [sol]; g.godmode = true;
      p.x = sol.x - 90; p.y = sol.y + sol.h - 22; p.face = 1; sol.face = -1; sol.update = () => {};
      const hp0 = sol.hp; __ift.step(28, ['fire']); __ift.step(40, []); const half = sol.hp;
      __ift.step(50, ['fire']); __ift.step(40, []);
      return { hp0, half, full: sol.hp };
    });
    t.ok(got.half === got.hp0 && got.full === got.hp0 - 3, "a heavy's tower shield turns a half-charged stone; a full charge gets through", got);
    await h.shot('m3-heavy');
    await setup(3, 4, 'thicket');
    got = await ev(() => {
      const g = __ift.game, p = g.player; let leapt = false, marked = false;
      // Try each lion from each side until one has a clear run at David (mounds and ditches can lie between).
      const lions = g.soldiers.filter((x) => x.kind === 'lion'); marked = lions.some((l) => l.marked);
      for (const lion of lions) for (const side of [-1, 1]) {
        if (leapt || p.hp < p.maxHp) break;
        g.soldiers = [lion]; lion.x = lion.home.x; lion.y = lion.home.y; lion.state = 'patrol'; p.x = lion.x + side * 60; p.y = lion.y + lion.h - 22; p.vx = p.vy = 0;
        for (let i = 0; i < 220 && p.hp === p.maxHp; i++) { __ift.step(1, []); if (lion.state === 'thrust' && !lion.onGround) leapt = true; }
      }
      return { leapt, hp: p.hp, max: p.maxHp, marked };
    });
    t.ok(got.leapt && got.hp < got.max && !got.marked, 'a lion of Timnah pounces; lions are never marked', got);
    await h.shot('m3-lion');
  }

  if (!only || only === 'bosses') {
    for (const n of [2, 3, 4, 5].filter((k) => !process.argv[3] || +process.argv[3] === k)) {
      const info = await ev(async (n) => { const b = await import('/src/data/bosses.js'), v = await import('/src/data/verses.js'), p = await import('/src/data/powers.js'); return { name: b.BOSSES[n].name, verse: v.REGION_VERSES.find((x) => x.region === n), tag: v.VERSION_TAG, power: p.POWERS[n - 1], sword: v.SWORD_VERSE }; }, n);
      console.log(`${info.name} (region ${n})`);
      await setup(n - 1, n, 'arena', 'in');
      let s = await step(30);
      t.ok(s.boss && s.boss.name === info.name && s.maxHp === 5 + n - 1, `${info.name} stands in his ground; David has ${5 + n - 1} health`, [s.boss, s.maxHp]);
      await step(70); await h.shot(`m3-boss${n}-intro`);
      let fight = null, attempts = 0, assisted = false;
      for (; attempts < 7; attempts++) {
        // Each attempt runs on its own fixed random seed, so the fights are the same from run to run.
        await ev(([n, k]) => { let sd = (n * 1000 + k * 7919 + 12345) >>> 0; __ift.game.rand = () => { sd = (sd + 0x6D2B79F5) | 0; let x = Math.imul(sd ^ (sd >>> 15), 1 | sd); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }, [n, attempts]);
        if (attempts === 0) { await ev((n) => bot.fightBoss(300, { pound: n === 5, wall: n === 4 }), n); await h.shot(`m3-boss${n}-fight-1`); await ev((n) => bot.fightBoss(300, { pound: n === 5, wall: n === 4 }), n); await h.shot(`m3-boss${n}-fight-2`); }
        if (attempts === 6) { assisted = true; await ev(() => { __ift.game.godmode = true; }); }
        fight = await ev((n) => bot.fightBoss(9000, { pound: n === 5, wall: n === 4 }), n);
        if (fight.won) break;
        console.log('  (David fell; trying again) ' + JSON.stringify(fight));
        await step(130);
      }
      t.ok(fight.won && !assisted, `the scripted fight beats ${info.name} unassisted (attempt ${attempts + 1})`, fight);
      if (assisted) console.log('  NOTE: the bot needed the no-damage switch to finish this fight.');
      console.log('  fight log: ' + JSON.stringify(fight));
      await ev(() => { __ift.game.godmode = false; });
      await step(30); await h.shot(`m3-boss${n}-falls`);
      s = await state();
      for (let i = 0; i < 60 && s.card !== 'verse'; i++) s = await step(10);
      const card = await ev(() => { const el = document.querySelector('#card'); return el && el.querySelector('.verse-text') && { text: el.querySelector('.verse-text').textContent, ref: el.querySelector('.verse-ref .ref').textContent, tag: el.querySelector('.verse-ref .tag').textContent }; });
      t.ok(card && card.text === info.verse.text && card.ref === info.verse.ref && card.tag === info.tag, `his verse card reads ${info.verse.ref} word for word, then the reference and (KJV)`, card);
      await h.shot(`m3-boss${n}-verse`);
      await step(40); await step(1, ['confirm']); s = await step(20);
      t.ok(s.relic && s.relic.power === info.power.id, `he drops ${info.power.name}`, s.relic);
      await h.shot(`m3-boss${n}-relic`);
      if (!s.relic) { console.log('  (skipping the rest of this captain)'); continue; }
      // He may be standing on a plank above it: drop through, then walk to it.
      s = await ev(() => { const g = __ift.game; for (let k = 0; k < 4 && g.relic; k++) { bot.walkTo(g.relic.x - 5, 600); if (g.relic) { __ift.step(1, ['down']); __ift.step(1, ['down', 'jump']); __ift.step(50, []); } } return __ift.step(3, []); });
      const pc = await ev(() => { const el = document.querySelector('#card'); return el && { kind: el.dataset.kind, title: el.querySelector('h2').textContent, verse: el.querySelector('.verse-text') ? el.querySelector('.verse-text').textContent : null, ref: el.querySelector('.verse-ref .ref') ? el.querySelector('.verse-ref .ref').textContent : null, tag: el.querySelector('.verse-ref .tag') ? el.querySelector('.verse-ref .tag').textContent : null }; });
      t.ok(pc && pc.kind === 'power' && pc.title === info.power.name && s.powers.includes(info.power.id), `taking it grants ${info.power.name}`, pc);
      if (n === 5) t.ok(pc.verse === info.sword.text && pc.ref === '1 Samuel 21:9' && pc.tag === '(KJV)', 'the sword card shows 1 Samuel 21:9: "There is none like that; give it me."', pc);
      await h.shot(`m3-boss${n}-power`);
      await step(40); await step(1, ['confirm']); s = await step(5);
      t.ok(s.card === null && s.flags['boss' + n] === 1 && s.maxHp === 5 + n, 'the victory is saved and a health pip added', [s.flags, s.maxHp]);
    }
    if (!process.argv[3]) {
    console.log('weakness chain');
    const weak = await ev(async () => {
      const g = __ift.game, out = {};
      const ORDER = ['dash', 'double', 'climb', 'pound', 'sword'];
      for (const [n, tag] of [[1, 'full'], [2, 'dash'], [3, 'air2'], [4, 'wall']]) {
        g.resetSave(); g.save.powers = ORDER.slice(0, n - 1); g.loadRoom(n, 'arena', 'in'); __ift.step(120, []);
        const b = g.boss; b.state = 'recover'; b.t = 5; const hp = b.hp;
        b.hit(g, 3, 1, { charge: 1, tags: ['plain'] }); const plain = hp - b.hp; b.state = 'recover'; b.t = 5; const hp2 = b.hp;
        b.hit(g, 3, 1, { charge: 1, tags: [tag] }); out[b.name] = [plain, hp2 - b.hp];
      }
      g.resetSave(); g.save.powers = ORDER.slice(0, 4); g.loadRoom(5, 'arena', 'in'); __ift.step(120, []);
      const b = g.boss, hp = b.hp; b.state = 'idle';
      b.hit(g, 3, 1, { charge: 1, tags: ['full'], y: b.y + 30 }); const body = hp - b.hp;
      b.hit(g, 3, 1, { charge: 1, tags: ['full'], y: b.y + 6 }); const brow = hp - body - b.hp;
      b.hit(g, 2, 1, { charge: 1, tags: ['pound'] }); const st = b.state, hp3 = b.hp;
      b.hit(g, 3, 1, { charge: 1, tags: ['full'], y: b.y + 30 }); out.Goliath = { body, brow, afterPound: st, kneeling: hp3 - b.hp };
      return out;
    });
    t.ok(['Shalmek', 'Ittur', 'Pashdu', 'Maroz'].every((k) => weak[k][0] === 3 && weak[k][1] === 6), 'captains 1-4 each take double from the earlier power they are weak to', weak);
    t.ok(weak.Goliath.body === 0 && weak.Goliath.brow === 3 && weak.Goliath.afterPound === 'stagger' && weak.Goliath.kneeling === 6, "Goliath: bronze turns a body shot, the brow is wounded, Lion's Fall drops him to a knee and doubles the next stone", weak.Goliath);
    }
  }

  if (!only || only === 'story') {
    console.log('the scene at one hundred');
    await setup(5, 1, 'outskirts');
    let s = await ev(() => {
      const g = __ift.game; g.save.tally = 99;
      const sol = g.soldiers.filter((x) => x.marked).sort((a, b) => b.y - a.y || a.x - b.x)[0]; g.soldiers = [sol]; g.player.x = sol.x - 30; g.player.y = sol.y + sol.h - 22; sol.die(g, 1); __ift.step(80, []);
      const tr = g.trophies[0]; for (let k = 0; k < 5 && g.trophies.length; k++) { bot.walkTo(tr.cx - 5); __ift.step(40, []); } return __ift.state();
    });
    t.ok(s.tally === 100 && s.flags.hundred === 1 && !s.flags.scene100, 'the hundredth trophy sets the messenger waiting', [s.tally, s.flags]);
    await h.shot('m3-hundred-banner');
    await ev(() => __ift.game.loadRoom(0, 'camp', 'd1')); s = await step(90);
    const pages = [];
    for (let i = 0; i < 3; i++) { pages.push(await ev(() => document.querySelector('#card') && [document.querySelector('#card').dataset.kind, document.querySelector('#card').textContent])); if (i === 0) await h.shot('m3-hundred-scene'); await step(40); await step(1, ['confirm']); await step(3); }
    t.ok(pages.every((p) => p && p[0] === 'hundred') && /price is met/.test(pages[1][1]) && /Michal/.test(pages[2][1]), "at the camp a messenger from Saul says the price is met and David may claim Michal or press on", pages);
    s = await state();
    t.ok(s.flags.scene100 === 1 && s.card === null, 'the scene plays once and is recorded', s.flags);
    console.log('Ending A');
    await ev(() => bot.walkTo(22 * 16 + 3)); await step(1, ['up']); s = await step(3);
    const choice = await ev(() => [...document.querySelectorAll('#card button')].map((b) => b.textContent));
    t.ok(s.card === 'saul' && choice.length === 2 && /Claim Michal/.test(choice[0]) && /Press on/.test(choice[1]), "Saul's tent now offers the choice", choice);
    await h.shot('m3-saul-choice');
    await step(40); await step(1, ['right']); await step(2); await step(1, ['confirm']); s = await step(5);
    t.ok(s.card === null && !s.flags.endingA, '"Press on" closes the tent with nothing changed');
    await step(1, ['up']); await step(40); await step(1, ['confirm']); s = await step(5);
    const endText = [];
    for (let i = 0; i < 3 && s.card === 'endingA'; i++) { endText.push(await ev(() => document.querySelector('#card').textContent)); if (i === 2) await h.shot('m3-ending-a'); await step(40); await step(1, ['confirm']); s = await step(5); }
    t.ok(endText.length === 3 && /Michal/.test(endText[0]) && /Ending A/.test(endText[2]), '"Claim Michal now" plays Ending A', endText);
    t.ok(s.flags.endingA === 1 && s.region === 0 && s.card === null, 'afterwards play goes on from the camp', s.flags);
    await step(1, ['up']); s = await step(3);
    t.ok(s.card === 'saul', 'and the tent still offers the ending whenever the player chooses');
    await step(40); await step(1, ['right']); await step(1, ['confirm']); await step(3);
    await ev(() => { const g = __ift.game; g.resetSave(); g.save.tally = 100; g.loadRoom(0, 'camp'); __ift.step(2, []); __ift.step(1, ['debug']); __ift.step(1, []); __ift.step(1, ['debug']); __ift.step(60, []); });
    s = await state();
    t.ok(s.card === 'hundred', 'setting the tally to 100 from the debug menu also brings the messenger', s.card);
  }

  console.log('hygiene');
  t.ok(h.errors.length === 0, 'no page errors', h.errors);
  await h.close();
  process.exit(t.done() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
