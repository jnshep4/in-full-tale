// Phone playthrough: an emulated iPhone in landscape (Chromium with touch, not Safari itself).
// Touch controls, screen fit, the portrait prompt, sound unlock on touch, the demo's end card.
// Run: node tests/play/m6.cjs
const { chromium, devices } = require('playwright');
const path = require('node:path');
const { checker, SHOTS } = require('./helpers.cjs');

(async () => {
  const t = checker('m6 phone playthrough');
  const { serve } = await import('../serve.mjs');
  const { server, port } = await serve(0);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13 landscape'] });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const shot = (n) => page.screenshot({ path: path.join(SHOTS, n + '.png') });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  // Synthetic pointer events on the touch controls: down, optional moves, up.
  const ptr = (sel, type, dx = 0, dy = 0, id = 1) => ev(([sel, type, dx, dy, id]) => { const el = document.querySelector(sel), r = el.getBoundingClientRect(); const x = sel === '#t-stick' ? 120 + dx : r.left + r.width / 2, y = sel === '#t-stick' ? 250 + dy : r.top + r.height / 2; el.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch' })); }, [sel, type, dx, dy, id]);
  await page.goto(`http://127.0.0.1:${port}/index.html?demo=1`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`http://127.0.0.1:${port}/index.html?demo=1`);
  await page.waitForFunction(() => window.__ift); await page.waitForTimeout(600);

  console.log('fit and title');
  const fit = await ev(() => { const c = document.getElementById('game').getBoundingClientRect(); return { w: Math.round(c.width), h: Math.round(c.height), vw: innerWidth, vh: innerHeight, touch: document.documentElement.classList.contains('touch'), card: document.querySelector('#card') && document.querySelector('#card').textContent, turn: getComputedStyle(document.getElementById('turn')).display }; });
  t.ok(fit.touch && fit.h <= fit.vh && fit.h >= fit.vh - 2 && fit.w <= fit.vw && Math.abs(fit.w / fit.h - 16 / 9) < 0.02, 'the picture fills the height of the phone screen at 16:9', fit);
  t.ok(/Demo/.test(fit.card) && /Left thumb/.test(fit.card) && !/WASD/.test(fit.card), 'the title says Demo and explains the touch controls, not the keyboard', fit.card);
  t.ok(fit.turn === 'none', 'no "turn your phone" prompt in landscape');
  await shot('m6-title');
  await page.tap('#card button'); await page.waitForTimeout(400);
  let s = await ev(() => __ift.state());
  t.ok(s.card === null, 'tapping Begin starts the game', s.card);
  const audio = await ev(() => __ift.game.sfx.ctx && __ift.game.sfx.ctx.state);
  t.ok(audio === 'running', 'the first touch starts the sound', audio);

  console.log('touch controls');
  const vis = await ev(() => [...document.querySelectorAll('.tbtn')].filter((b) => !b.hidden).map((b) => b.dataset.act));
  t.ok(vis.join(',') === 'jump,fire,pause', 'jump, sling and pause are shown; power buttons wait until earned', vis);
  const x0 = s.player.x;
  await ptr('#t-stick', 'pointerdown'); await ptr('#t-stick', 'pointermove', 40, 0); await page.waitForTimeout(700);
  await shot('m6-stick');
  await ptr('#t-stick', 'pointerup', 40, 0); await page.waitForTimeout(150);
  s = await ev(() => __ift.state());
  t.ok(s.player.x - x0 > 50, 'pushing the stick right runs David right', s.player.x - x0);
  const y0 = s.player.y;
  await ptr('.tbtn[data-act=jump]', 'pointerdown', 0, 0, 2); await page.waitForTimeout(180);
  const up = await ev(() => __ift.state().player.y);
  await ptr('.tbtn[data-act=jump]', 'pointerup', 0, 0, 2); await page.waitForTimeout(700);
  t.ok(up < y0 - 20, 'JUMP jumps', [y0, up]);
  await ptr('.tbtn[data-act=fire]', 'pointerdown', 0, 0, 3); await page.waitForTimeout(900);
  const ch = await ev(() => __ift.state().player.charge);
  await ptr('.tbtn[data-act=fire]', 'pointerup', 0, 0, 3); await page.waitForTimeout(60);
  s = await ev(() => __ift.state());
  t.ok(ch === 1 && s.stones === 1, 'holding SLING charges it and letting go looses a stone', [ch, s.stones]);
  // Two thumbs at once: run and jump.
  const x1 = s.player.x;
  await ptr('#t-stick', 'pointerdown'); await ptr('#t-stick', 'pointermove', 40, 0); await ptr('.tbtn[data-act=jump]', 'pointerdown', 0, 0, 2); await page.waitForTimeout(250);
  const mid = await ev(() => __ift.state().player);
  await ptr('.tbtn[data-act=jump]', 'pointerup', 0, 0, 2); await ptr('#t-stick', 'pointerup', 40, 0); await page.waitForTimeout(600);
  t.ok(mid.x > x1 + 15 && !mid.onGround, 'stick and button work together', mid);
  // Gateway: walk to it and push up.
  await ev(() => { const g = __ift.game; g.player.x = 36 * 16 + 3; });
  await page.waitForTimeout(100); await ptr('#t-stick', 'pointerdown'); await ptr('#t-stick', 'pointermove', 0, -50); await page.waitForTimeout(300); await ptr('#t-stick', 'pointerup', 0, -50); await page.waitForTimeout(500);
  s = await ev(() => __ift.state());
  t.ok(s.region === 1, 'pushing up at gateway 1 enters the Valley of Elah', s.region);
  await page.waitForTimeout(700); await shot('m6-elah');
  await ptr('.tbtn[data-act=pause]', 'pointerdown', 0, 0, 4); await ptr('.tbtn[data-act=pause]', 'pointerup', 0, 0, 4); await page.waitForTimeout(300);
  const pz = await ev(() => ({ kind: document.querySelector('#card') && document.querySelector('#card').dataset.kind, hidden: document.getElementById('touch').hidden }));
  t.ok(pz.kind === 'pause' && pz.hidden, 'the II button opens the tally sheet, and the controls step aside for it', pz);
  await shot('m6-pause');
  await page.tap('#card button'); await page.waitForTimeout(300);

  console.log('the demo');
  const d = await ev(() => { const g = __ift.game; g.loadRoom(0, 'camp'); return [g.doorState(g.room.link('d1')), g.doorState(g.room.link('d2')), g.demo]; });
  t.ok(d[0] === 'open' && d[1] === 'sealed' && d[2] === 1, 'the demo opens gateway 1 only', d);
  await ev(() => { const g = __ift.game; g.save.flags.boss1 = 1; g.save.tally = 9; g.loadRoom(1, 'arena', 'in'); });
  await page.waitForTimeout(300);
  await ev(() => { const g = __ift.game; g.player.x = g.relic.x - 5; }); await page.waitForTimeout(900);
  let kind = await ev(() => document.querySelector('#card') && document.querySelector('#card').dataset.kind);
  t.ok(kind === 'power', 'taking Fleet Foot shows its card', kind);
  await page.tap('#card button'); await page.waitForTimeout(400);
  const end = await ev(() => document.querySelector('#card') && [document.querySelector('#card').dataset.kind, document.querySelector('#card').textContent]);
  t.ok(end && end[0] === 'demoEnd' && /9 of the 20/.test(end[1]) && /Thank you/.test(end[1]), 'then the end-of-demo card, with the count and thanks', end);
  await shot('m6-demo-end');
  await page.tap('#card button'); await page.waitForTimeout(300);
  const dash = await ev(() => [...document.querySelectorAll('.tbtn')].filter((b) => !b.hidden).map((b) => b.dataset.act));
  t.ok(dash.includes('dash'), 'and the DASH button appears now that the power is held', dash);
  await ev(() => { __ift.game.settings.light = true; }); await page.waitForTimeout(1500);
  const fps = await ev(() => __ift.fps());
  t.ok(fps >= 45, 'frame rate at phone size in headless Chromium', fps);
  await page.reload(); await page.waitForFunction(() => window.__ift); await page.waitForTimeout(300);
  const kept = await ev(() => [__ift.game.demo, location.search]);
  t.ok(kept[0] === 1, 'the demo setting is remembered on the device', kept);

  console.log('portrait');
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  const turn = await ev(() => getComputedStyle(document.getElementById('turn')).display);
  t.ok(turn === 'flex', 'held upright, the phone is asked to turn sideways', turn);
  await shot('m6-portrait');
  t.ok(errors.length === 0, 'no page errors', errors);
  await browser.close(); server.close();
  process.exit(t.done() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
