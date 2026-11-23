// Milestone 5 playthrough: title screen, pause sheet with the per-region tally, settings, music,
// and a frame-rate reading in the last region. Run: node tests/play/m5.cjs
const { launch, checker } = require('./helpers.cjs');

(async () => {
  const t = checker('m5 playthrough');
  const h = await launch({ query: 'test=1&title=1' });
  const { ev } = h;
  const state = () => ev(() => __ift.state());
  const step = (n, keys = []) => ev(([n, keys]) => __ift.step(n, keys), [n, keys]);
  const card = () => ev(() => { const el = document.querySelector('#card'); return el && { kind: el.dataset.kind, h1: el.querySelector('h1') ? el.querySelector('h1').textContent : null, h2: el.querySelector('h2') ? el.querySelector('h2').textContent : null, buttons: [...el.querySelectorAll('button')].map((b) => b.textContent), sel: [...el.querySelectorAll('button')].findIndex((b) => b.classList.contains('sel')), text: el.textContent }; });

  console.log('title screen');
  let s = await step(30), c = await card();
  t.ok(c && c.kind === 'title' && c.h1 === 'In Full Tale', 'the game opens on a title card', c);
  t.ok(c.buttons.join('|') === 'Begin|Settings', 'a fresh save offers Begin and Settings', c.buttons);
  await h.shot('m5-title');
  const f0 = s.frame; s = await step(30, ['dash']);
  t.ok(s.frame === f0, 'the world waits behind it');
  await step(1, ['confirm']); s = await step(5);
  const intro = [];
  for (let i = 0; i < 3 && s.card === 'intro'; i++) { intro.push(await ev(() => { const el = document.querySelector('#card'); return [el.querySelector('.verse-text').textContent, el.querySelector('.verse-ref').textContent]; })); if (i === 2) await h.shot('m5-intro'); await step(40); await step(1, ['confirm']); s = await step(5); }
  const dowry = s.card === 'intro' ? await ev(() => { const el = document.querySelector('#card'); return [el.querySelector('.verse-text').textContent, !!el.querySelector('.verse-ref')]; }) : null;
  await h.shot('m5-intro-dowry'); await step(40); await step(1, ['confirm']); s = await step(5);
  t.ok(dowry && /collect your dowry/.test(dowry[0]) && !dowry[1], 'a fourth card, with no verse reference, sends him to collect his dowry', dowry);
  const want = await ev(async () => (await import('/src/data/verses.js')).INTRO_VERSES);
  t.ok(intro.length === 3 && intro.every((p, i) => p[0] === want[i].text && p[1] === want[i].ref + ' (KJV)') && /an hundred foreskins of the Philistines/.test(intro[2][0]), 'a new game opens on three cards of 1 Samuel 18 (KJV): Michal, David\'s answer, the price', intro.map((p) => p[1]));
  const guide = await ev(() => { const g = __ift.game; let called = 0; const o = g.drawGuide.bind(g); g.drawGuide = (...a) => { called++; return o(...a); }; g.render(); delete g.drawGuide; return { called, seen: !!g.save.seen['1/outskirts'], note: g.note.text }; });
  t.ok(guide.called === 1 && !guide.seen && /FIRST GATEWAY/.test(guide.note), 'then a line of advice and an arrow point the way to the first gateway', guide);
  await step(30); await h.shot('m5-guide-arrow'); await ev(() => { const g = __ift.game; g.player.x = 34 * 16; g.snapCamera(); }); await step(5); await h.shot('m5-guide-gate');
  await ev(() => { const g = __ift.game; g.player.x = 14 * 16 + 3; g.snapCamera(); }); await step(2);
  t.ok(s.card === null && s.region === 0, "Begin starts in Saul's camp", [s.card, s.region]);
  {
    const tips = await ev(() => { const g = __ift.game, was = [g.region.id, g.room.id, g.player.x]; g.loadRoom(1, 'outskirts'); const out = [];
      for (const c of [5, 13, 28, 45, 70]) { g.player.x = c * 16; out.push(g.tip()); } g.touch = true; g.player.x = 13 * 16; out.push(g.tip()); g.touch = false;
      g.player.x = 13 * 16; g.snapCamera(); g.render(); return out; });
    await step(40);
    await h.shot('m5-tip');
    t.ok(/JUMP: Z/.test(tips[0]) && /HOLD DOWN AND PRESS JUMP/.test(tips[1]) && /MORE POWER/.test(tips[2]) && /LEVEL/.test(tips[3]) && tips[4] === null && /STICK DOWN AND TAP JUMP/.test(tips[5]), 'the first field shows tips: moving, dropping through a platform, sling power, sling range', tips);
    const bars = await ev(() => { const g = __ift.game; g.loadRoom(1, 'arena'); g.snapCamera(); g.render(); const p = g.player, x0 = p.x; p.x = -40; g.checkLinks(); return { boss: g.bossActive(), room: g.room.id, music: g.sfx.mode, moved: p.x !== x0 }; });
    await step(40);
    await h.shot('m5-arena-bars');
    t.ok(bars.boss && bars.room === 'arena' && bars.music === 'boss', "a captain's ground bars its doors and plays the captain's music", bars);
    await ev(() => { const g = __ift.game; g.loadRoom(0, 'camp'); g.player.x = 14 * 16 + 3; g.snapCamera(); });
  }
  {
    const st = await ev(() => { const g = __ift.game, l = g.room.links.find((x) => x.id === 'stores'); g.player.x = l.cx * 16; g.snapCamera(); g.useDoor(l); return { card: g.ui.cur && document.querySelector('#card').dataset.kind, buttons: [...document.querySelectorAll('#card button')].map((b) => b.textContent) }; });
    await step(5); await h.shot('m5-stores');
    t.ok(st.card === 'stores' && st.buttons.length === 4, 'the stores in camp offer three things to carry, and Leave', st);
    const use = await ev(() => { const g = __ift.game, out = {}; let p = g.player; g.ui.close('fig'); out.took = g.save.item; p.hp = 1; g.useItem(); out.hp = p.hp; out.left = g.save.item;
      g.save.item = 'oil'; const c0 = g.chargeScale(); g.useItem(); out.swift = [c0, g.chargeScale()];
      g.loadRoom(1, 'outskirts'); p = g.player; g.save.item = 'horn'; const near = g.soldiers.filter((x) => Math.abs(x.cx - p.cx) < 260); p.x = near.length ? p.x : g.soldiers[0].x - 60; g.useItem(); out.horn = g.soldiers.filter((x) => x.state === 'stagger').length; out.has = g.has('item');
      g.loadRoom(0, 'camp'); p = g.player; const q = g.room.props.find((x) => x.type === 'guard'); p.x = q.cx * 16; out.talk0 = g.campTalk(q); g.save.flags.boss1 = 1; out.talk1 = g.campTalk(q); p.x += 200; out.far = g.campTalk(q); delete g.save.flags.boss1; g.swift = 0; p.x = q.cx * 16; g.snapCamera(); return out; });
    await step(5); await h.shot('m5-camp-talk');
    t.ok(use.took === 'fig' && use.hp === 4 && use.left === null, 'a cake of figs restores three hearts and is spent', use);
    t.ok(use.swift[0] === 1 && use.swift[1] === 0.25, 'sling oil quickens the sling', use.swift);
    t.ok(use.horn >= 1 && use.has === false, "a ram's horn staggers the soldiers near", use.horn);
    t.ok(use.talk0 && use.talk1 && use.talk0 !== use.talk1 && use.far === null, 'the men of the camp speak to David, and speak differently once a captain has fallen', [use.talk0, use.talk1]);
    await ev(() => { const g = __ift.game; g.player.x = 14 * 16 + 3; g.player.hp = g.player.maxHp; g.snapCamera(); });
  }

  console.log('pause sheet');
  await step(90, ['right']);
  await ev(() => { const g = __ift.game; g.tracker(); for (const id of g.markedIds[1].slice(0, 3)) g.save.soldiers[id] = 'c'; g.save.tally = 3; g.save.flags.boss1 = 1; g.save.powers = ['dash']; g.persist(); });
  await step(1, ['pause']); await step(2); c = await card();
  t.ok(c && c.kind === 'pause' && /3 of 200/.test(c.h2), 'Esc opens the tally sheet', c && c.h2);
  const rows = await ev(() => [...document.querySelectorAll('#card table.sheet tr')].map((r) => [...r.children].map((d) => d.textContent)));
  t.ok(rows.length === 10 && rows[0][1] === '3 / 20' && /fallen/.test(rows[0][2]) && rows[9][1] === '0 / 20', 'it lists all ten regions with trophies taken and captains fallen', rows);
  t.ok(/Fleet Foot/.test(c.text) && /Shift/.test(c.text), 'and the controls of each power earned');
  await h.shot('m5-pause');
  await step(20); await step(1, ['pause']); s = await step(3);
  t.ok(s.card === null, 'Esc again resumes');

  console.log('settings');
  await step(1, ['pause']); await step(30); await step(1, ['right']); await step(2); await step(1, ['right']); await step(2); await step(1, ['confirm']); await step(3); c = await card();
  t.ok(c && c.kind === 'settings' && /Sound 60%/.test(c.text), 'the pause sheet leads to settings', c && c.text);
  await step(30); await step(1, ['confirm']); await step(3); c = await card();
  const saved = await ev(() => JSON.parse(localStorage.getItem('inFullTale.settings.v1')));
  t.ok(/Sound 50%/.test(c.text) && saved.sound === 0.5 && c.sel === 0, 'Sound - lowers the volume, keeps its place, and is saved', [c.text, saved, c.sel]);
  await h.shot('m5-settings');
  for (let i = 0; i < 4; i++) { await step(1, ['right']); await step(2); }
  await step(30); await step(1, ['confirm']); await step(3);
  const shake = await ev(() => __ift.game.settings.shake);
  t.ok(shake === false, 'screen shake can be turned off', shake);
  await step(30); await step(1, ['pause']); await step(3); c = await card();
  t.ok(c && c.kind === 'pause', 'Esc in settings goes back to the sheet', c && c.kind);
  await step(30); await step(1, ['pause']); await step(3);

  console.log('map');
  const map = await ev(() => {
    const g = __ift.game; g.loadRoom(1, 'outskirts'); g.loadRoom(1, 'brook', 'west'); __ift.step(10, []);
    __ift.step(1, ['pause']); __ift.step(30, []); __ift.step(1, ['right']); __ift.step(2, []); __ift.step(1, ['confirm']); __ift.step(3, []);
    const el = document.querySelector('#card'), img = el.querySelector('img.map');
    return { kind: el.dataset.kind, left: +el.dataset.left, title: el.querySelector('h2').textContent, img: !!img && img.src.startsWith('data:image/png'), seen: Object.keys(g.save.seen) };
  });
  t.ok(map.kind === 'map' && map.img && /Valley of Elah/.test(map.title), 'the pause sheet leads to a map of the region David is in', map);
  t.ok(map.left === 17 && map.seen.includes('1/brook') && !map.seen.includes('1/picket'), 'it counts the 17 marked soldiers still to find there, and knows which rooms have been entered', map);
  await h.shot('m5-map');
  await step(30); await step(1, ['pause']); await step(3); c = await card();
  t.ok(c && c.kind === 'pause', 'Esc on the map goes back to the sheet', c && c.kind);
  await step(30); await step(1, ['pause']); await step(3);
  await ev(() => __ift.game.loadRoom(0, 'camp')); await step(5);

  console.log('gateway label and music modes');
  const label = await ev(() => { const g = __ift.game; g.player.x = 36 * 16 + 3; __ift.step(2, []); return g.nearDoor && g.tracker()[0]; });
  t.ok(label && label.got === 3 && label.of === 20, 'the gateway to Elah knows 3 of 20 are taken', label);
  await step(2); await h.shot('m5-gateway-count');
  const modes = await ev(() => { const g = __ift.game, out = [g.sfx.mode]; g.loadRoom(1, 'outskirts'); out.push(g.sfx.mode); g.save.flags = {}; g.loadRoom(1, 'arena', 'in'); out.push(g.sfx.mode); return out; });
  t.ok(modes.join('|') === 'camp|field|boss', 'music follows the place: camp, field, captain', modes);

  console.log('continuing a saved game');
  await ev(() => { const g = __ift.game; g.save.flags = { boss1: 1 }; g.save.played = 120; g.loadRoom(0, 'camp'); });
  await h.reload(); await step(10); c = await card();
  t.ok(c && c.kind === 'title' && c.buttons.join('|') === 'Continue|New game|Settings', 'with a save, the title offers Continue and New game', c && c.buttons);
  await step(30); await step(1, ['right']); await step(2); await step(1, ['confirm']); await step(3); c = await card();
  t.ok(c && /erased/.test(c.text) && c.buttons[0] === 'Back', 'New game asks before erasing, with Back first', c && c.buttons);
  await step(30); await step(1, ['confirm']); await step(3); c = await card();
  t.ok(c && c.buttons[0] === 'Continue', 'Back returns to the title');
  await step(30); await step(1, ['confirm']); s = await step(3);
  t.ok(s.card === null && s.tally === 3 && s.powers.includes('dash'), 'Continue resumes the saved tale', [s.tally, s.powers]);
  await h.reload(); await step(40); await step(1, ['right']); await step(2); await step(1, ['confirm']); await step(40); await step(1, ['right']); await step(2); await step(1, ['confirm']); s = await step(5);
  for (let i = 0; i < 4 && s.card === 'intro'; i++) { await step(40); await step(1, ['confirm']); s = await step(5); }
  t.ok(s.card === null && s.tally === 0 && s.powers.length === 0, 'Erase and begin starts a fresh tale', [s.card, s.tally, s.powers]);
  t.ok(h.errors.length === 0, 'no page errors', h.errors);
  await h.close();

  console.log('real time: audio and frame rate');
  const r = await launch({ query: 'nosave=1' });
  await r.page.waitForTimeout(500);
  c = await r.ev(() => document.querySelector('#card') && document.querySelector('#card').dataset.kind);
  t.ok(c === 'title', 'a plain visit (no test switches) opens on the title', c);
  await r.page.waitForTimeout(600); await r.page.keyboard.press('Enter'); await r.page.waitForTimeout(1500);
  const audio = await r.ev(() => { const s = __ift.game.sfx; return { state: s.ctx && s.ctx.state, steps: s.stepN, mode: s.mode }; });
  t.ok(audio.state === 'running' && audio.steps > 0 && audio.mode === 'camp', 'after the first key press the audio runs and the camp music is being played', audio);
  await r.ev(() => { const g = __ift.game; g.save.powers = ['dash', 'double', 'climb', 'pound', 'sword', 'shield', 'grapple', 'swim', 'heavy']; g.godmode = true; g.loadRoom(10, 'citadel'); });
  await r.page.keyboard.down('ArrowRight'); await r.page.waitForTimeout(2500); await r.page.keyboard.up('ArrowRight');
  const fps = await r.ev(() => __ift.fps());
  t.ok(fps >= 50, 'frame rate holds near 60 in the citadel of Gath (headless Chromium, software rendering)', fps);
  await r.shot('m5-live-gath');
  t.ok(r.errors.length === 0, 'no page errors in the live loop', r.errors);
  const external = r.requests.filter((u) => !u.startsWith(`http://127.0.0.1:${r.port}/`) && !u.startsWith('data:'));
  t.ok(external.length === 0, 'no network requests beyond the site itself', external);
  await r.close();
  process.exit(t.done() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
