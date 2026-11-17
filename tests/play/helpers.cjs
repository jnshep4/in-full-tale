// Shared harness for scripted playthroughs. Uses the pre-installed Playwright and Chromium.
// The page runs with ?test=1, so the simulation advances only when a script steps it: runs are
// deterministic and faster than real time.
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const SHOTS = path.join(__dirname, '..', 'shots');

// Helpers injected into the page as window.bot.
function installBot() {
  const ift = window.__ift, g = () => ift.game;
  const AIR = 0, SPIKE = 3;
  window.bot = {
    // Walk until David's left edge is within 3px of x. Jumps steps, gaps, and stake pits.
    walkTo(x, max = 1500) {
      for (let i = 0; i < max; i++) {
        const p = g().player, room = g().room, d = x - p.x;
        if (Math.abs(d) < 3 || p.dead) break;
        const dir = d > 0 ? 1 : -1, keys = [dir > 0 ? 'right' : 'left'];
        const ahead = p.cx + dir * 12, feet = p.y + p.h + 4;
        let gap = room.tileAt(ahead, feet) === AIR && room.tileAt(ahead, feet + 16) !== 1;
        for (let k = 1; k <= 2; k++) if (room.tileAt(p.cx + dir * 14 * k, feet) === SPIKE || room.tileAt(p.cx + dir * 14 * k, feet + 16) === SPIKE) gap = true;
        const blocked = p.onGround && Math.abs(p.vx) < 5 && i > 4;
        if (p.onGround ? (blocked || gap) && !g().input.held.jump : p.vy < 0) keys.push('jump');
        ift.step(1, keys);
      }
      return ift.step(1, []);
    },
    // Hold fire for n frames with extra keys, then release. Returns the state after release.
    shoot(n, extra = []) { ift.step(n, ['fire', ...extra]); return ift.step(1, extra); },
    // Fight one soldier with the sling until he falls. Keeps some distance, hops over thrusts.
    fight(id, max = 3000) {
      const find = () => g().soldiers.find((s) => (id ? s.id === id : !s.marked));
      const log = { frames: 0, hits: 0, startHp: g().player.hp };
      for (let i = 0; i < max; i++) {
        const s = find(), p = g().player;
        if (!s || s.state === 'dying' || p.dead) break;
        const dx = s.cx - p.cx, adx = Math.abs(dx), dir = dx > 0 ? 1 : -1, keys = [];
        const flee = dir > 0 ? 'left' : 'right';
        if (p.face !== dir) { ift.step(1, [dir > 0 ? 'right' : 'left']); log.frames++; continue; }   // release and turn to face him
        const behind = g().room.tileAt(p.cx - dir * 22, p.y + p.h + 4);
        if (adx < 74 && behind !== AIR) keys.push(flee);         // back away while there is ground; facing stays locked
        if ((s.state === 'windup' || s.state === 'thrust') && adx < 70 && p.onGround && !g().input.held.jump) keys.push('jump');
        else if (!p.onGround && p.vy < 0) keys.push('jump');
        const loose = p.face === dir && ((p.charge >= 1 && adx < 170) || (p.charge >= 0.55 && adx < 60));
        if (!loose) keys.push('fire');
        ift.step(1, keys);
        log.frames++;
      }
      log.endHp = g().player.hp; log.fell = !find() || find().state === 'dying';
      return log;
    },
  };
}

async function launch({ query = 'test=1', scale = 2, fresh = true } = {}) {
  const { serve } = await import('../serve.mjs');
  const { server, port } = await serve(0);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 480 * scale, height: 270 * scale } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  const url = `http://127.0.0.1:${port}/index.html?${query}`;
  const open = async () => { await page.goto(url); await page.waitForFunction(() => window.__ift); await page.evaluate(installBot); };
  await page.goto(url);
  if (fresh) await page.evaluate(() => localStorage.clear());
  await open();
  fs.mkdirSync(SHOTS, { recursive: true });
  return {
    page, errors, requests, port, reload: open,
    ev: (fn, arg) => page.evaluate(fn, arg),
    shot: (name) => page.screenshot({ path: path.join(SHOTS, name + '.png') }),
    close: async () => { await browser.close(); server.close(); },
  };
}

// Minimal assertion collector: keeps going after a failure so one run reports everything.
function checker(title) {
  let failed = 0, passed = 0;
  return {
    ok(cond, msg, detail) { if (cond) { passed++; console.log('  ok   ' + msg); } else { failed++; console.error('  FAIL ' + msg + (detail !== undefined ? '  -> ' + JSON.stringify(detail) : '')); } },
    done() { console.log(`${title}: ${passed} passed, ${failed} failed`); return failed; },
  };
}

module.exports = { launch, checker, SHOTS };
