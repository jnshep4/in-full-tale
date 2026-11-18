// Boot: canvas sizing, fixed-step loop, and the hook scripted playthroughs drive.
import { W, H, DT } from './core.js';
import { Game } from './game.js';
import { mountDebug } from './debug.js';
import { wantsTouch, mountTouch } from './touch.js';

const params = new URLSearchParams(location.search);
const test = params.has('test');             // ?test=1: the loop only advances when a script steps it
const canvas = document.getElementById('game'), frameEl = document.getElementById('frame'), ui = document.getElementById('ui');

function fit() {
  // Whole multiples where the screen allows two or more; on a small screen (a phone) fill the height or width exactly.
  const vv = window.visualViewport, vw = vv ? vv.width : innerWidth, vh = vv ? vv.height : innerHeight;
  const raw = Math.min(vw / W, vh / H), s = raw >= 2 ? Math.floor(raw) : Math.max(0.5, raw);
  canvas.style.width = frameEl.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = frameEl.style.height = Math.floor(H * s) + 'px';
  ui.style.setProperty('--s', s);
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); if (window.visualViewport) window.visualViewport.addEventListener('resize', fit); fit();

let storage = null;
try { storage = params.has('nosave') ? null : window.localStorage; } catch (e) { storage = null; }
// ?at=region/room starts a fresh save in that room (used by the scripted playthroughs).
// ?demo=N limits play to the first N regions and ends with a thank-you card. The choice is remembered
// (so a home-screen icon made from a demo link stays a demo); ?demo=0 clears it.
let demo = 0;
try { if (params.has('demo')) { demo = +params.get('demo') || 0; if (storage) storage.setItem('inFullTale.demo', String(demo)); } else if (storage) demo = +storage.getItem('inFullTale.demo') || 0; } catch (e) { demo = +params.get('demo') || 0; }
const touch = wantsTouch(params);
const game = new Game(canvas, { storage, ui, at: params.get('at'), title: params.has('title') || (!test && !params.has('at')), demo, touch });
mountDebug(game, ui);
const touchTick = touch ? mountTouch(game, document.getElementById('stage')) : null;
// Leaving the tab or locking the phone pauses the game and silences it.
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!game.ui.open && !test) game.pauseMenu(); if (game.sfx.ctx) game.sfx.ctx.suspend(); } else if (game.sfx.ctx) game.sfx.ctx.resume(); });
addEventListener('pointerdown', () => game.sfx.unlock());

let realtime = !test, acc = 0, last = performance.now(), fps = 60;
function frame(now) {
  const el = Math.min(0.1, (now - last) / 1000); last = now;
  if (el > 0) fps += (1 / el - fps) * 0.05;
  if (realtime) {
    acc += el;
    let n = 0;
    while (acc >= DT && n < 5) { game.update(DT); acc -= DT; n++; }
    if (n === 5) acc = 0;
    game.render();
    if (touch && game.autoLight) game.autoLight(fps, el);
  }
  if (touchTick) touchTick();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test and debugging hook.
window.__ift = {
  game,
  keys(list) { game.input.virtual = new Set(list || []); },
  step(n = 1, list) { if (list) this.keys(list); for (let i = 0; i < n; i++) game.update(DT); game.render(); return game.snapshot(); },
  state() { return game.snapshot(); },
  realtime(v) { realtime = !!v; last = performance.now(); acc = 0; },
  fps() { return Math.round(fps); },
};
