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
    // Fight a captain with the sling, on foot, no assistance: keep a gap, loose full-charge stones,
    // jump thrusts and ground waves, back away from leaps. Returns a log. opts.extra(ctx) may add keys.
    fightBoss(max = 9000, opts = {}) {
      const log = { frames: 0, startHp: g().player.hp, hurts: 0, attacks: {} };
      let lastHp = g().player.hp, lastState = '';
      for (let i = 0; i < max; i++) {
        const b = g().boss, p = g().player;
        if (!b || b.state === 'dying' || p.dead) break;
        if (p.hp < lastHp) log.hurts++; lastHp = p.hp;
        if (b.state === 'act' && lastState !== 'act') log.attacks[b.attack.id] = (log.attacks[b.attack.id] || 0) + 1;
        lastState = b.state;
        const dx = b.cx - p.cx, adx = Math.abs(dx), dir = dx > 0 ? 1 : -1, keys = [];
        const toward = dir > 0 ? 'right' : 'left', away = dir > 0 ? 'left' : 'right';
        const roomW = g().room.w * 16, wallBehind = dir > 0 ? p.x - 32 : roomW - 32 - (p.x + p.w);
        const atk = b.attack ? b.attack.id : '';
        let move = null, jump = false;
        if (adx < 96) move = away; else if (adx > 175) move = toward;
        if (b.state === 'tele' && (atk === 'thrust' || atk === 'charge' || atk === 'sweep') && adx < 180) move = away;
        if (b.state === 'act' && (atk === 'thrust' || atk === 'sweep') && adx < 120) jump = true;
        if (b.state === 'act' && atk === 'charge' && adx < 90) jump = true;
        if (b.state === 'act' && atk === 'leap') move = wallBehind > 60 ? away : toward;
        if (b.state === 'tele' && atk === 'leap') move = wallBehind > 90 ? away : toward;
        for (const sh of g().shots) {
          const sdx = sh.x - p.cx;
          if (sh.kind === 'wave') { if (Math.sign(sh.vx) === -Math.sign(sdx) && Math.abs(sdx) < 40) jump = true; }
          else if (Math.abs(sdx) < 70 && Math.abs(sh.y - p.cy) < 60 && sh.stuck <= 0) { move = wallBehind > 40 ? away : toward; if (Math.abs(sdx) < 36) jump = true; }
        }
        if (wallBehind < 14 && move === away) { move = adx < 60 ? toward : null; if (adx < 60) jump = true; }
        if (move) keys.push(move);
        if (jump && p.onGround && !g().input.held.jump) keys.push('jump'); else if (!p.onGround && p.vy < 0) keys.push('jump');
        if (opts.extra) opts.extra({ b, p, keys, dir, adx });
        if (p.face !== dir) { ift.step(1, [toward]); log.frames++; continue; }        // let go and turn to face him
        const open = b.state === 'recover' || b.state === 'stagger' || b.state === 'idle' || b.state === 'tele';
        const loose = p.charge >= 1 && adx < 230 && (open || p.charge >= 1 && i % 50 === 0);
        if (!loose) keys.push('fire');
        ift.step(1, keys); log.frames++;
      }
      log.endHp = g().player.hp; log.dead = g().player.dead; log.won = !g().boss || g().boss.state === 'dying';
      return log;
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

async function launch({ query = 'test=1&at=1/outskirts', scale = 2, fresh = true } = {}) {
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

// A whole-room picture: the tile layer scaled down, with marked soldiers (red), ordinary ones
// (orange), links (green), gate tiles (cyan) and David (white). For checking layouts by eye.
async function overview(h, name, scale = 0.5) {
  const url = await h.ev((scale) => {
    const g = __ift.game, room = g.room, c = document.createElement('canvas');
    c.width = Math.round(room.w * 16 * scale); c.height = Math.round(room.h * 16 * scale);
    const x = c.getContext('2d'); x.fillStyle = '#2a1838'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(g.tileCanvas, 0, 0, c.width, c.height);
    const dot = (cx, cy, col, w = 1, hh = 1) => { x.fillStyle = col; x.fillRect(cx * 16 * scale, (cy - hh + 1) * 16 * scale, 16 * scale * w, 16 * scale * hh); };
    for (let yy = 0; yy < room.h; yy++) for (let xx = 0; xx < room.w; xx++) { const t = room.tile(xx, yy); if (t >= 4) dot(xx, yy, t === 9 ? 'rgba(60,120,255,0.7)' : t === 10 ? '#ffd680' : '#00e5ff'); else if (t === 3) dot(xx, yy, '#ff00ff'); else if (t === 2) dot(xx, yy, '#c08a4a'); }
    for (const sp of room.spawns) dot(sp.cx, sp.cy, sp.type === 'marked' ? '#ff2020' : sp.type === 'soldier' ? '#ff9a2e' : sp.type === 'boss' ? '#ff00aa' : sp.type === 'torch' ? '#ffff80' : '#ffffff', 1, sp.type === 'torch' ? 1 : 2);
    for (const l of room.links) dot(l.cx, l.cy, '#30ff60', 1, 2);
    return c.toDataURL('image/png');
  }, scale);
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
}

module.exports = { launch, checker, overview, SHOTS };
