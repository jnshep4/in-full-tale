// Boot: canvas sizing, fixed-step loop, and the hook scripted playthroughs drive.
import { W, H, DT } from './core.js';
import { Game } from './game.js';
import { mountDebug } from './debug.js';

const params = new URLSearchParams(location.search);
const test = params.has('test');             // ?test=1: the loop only advances when a script steps it
const canvas = document.getElementById('game'), frameEl = document.getElementById('frame'), ui = document.getElementById('ui');

function fit() {
  const s = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
  canvas.style.width = frameEl.style.width = W * s + 'px';
  canvas.style.height = frameEl.style.height = H * s + 'px';
}
addEventListener('resize', fit); fit();

let storage = null;
try { storage = params.has('nosave') ? null : window.localStorage; } catch (e) { storage = null; }
const game = new Game(canvas, { storage });
mountDebug(game, ui);

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
  }
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
