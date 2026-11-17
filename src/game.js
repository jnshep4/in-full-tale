// The play state: owns the room, entities, camera, lighting, and HUD.
import { W, H, T, TALLY_GOAL, clamp, rng } from './core.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { loadSave, writeSave, freshSave, clearSave } from './save.js';
import { REGIONS, regionById } from './data/regions.js';
import { parseRoom, moveBody } from './world/room.js';
import { renderRoom } from './gfx/tiles.js';
import { makeBackdrop, drawBackdrop } from './gfx/bg.js';
import { drawRing, drawTorchPost, drawFlame, drawFig, drawPip } from './gfx/chars.js';
import { drawText, textWidth } from './font.js';
import { Player, SLING } from './ent/player.js';
import { Soldier } from './ent/soldier.js';
import { Trophy } from './ent/trophy.js';

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }

export class Game {
  constructor(canvas, { storage = null, seed = 20261117 } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    [this.world, this.wctx] = mk(W, H);       // tiles and bodies, before lighting
    [this.lightC, this.lctx] = mk(W, H);      // light map
    [this.litC, this.litctx] = mk(W, H);      // light map masked to the world's pixels
    this.vignette = this.makeVignette();
    this.input = new Input(); this.sfx = new Sfx();
    this.input.onAny = () => this.sfx.unlock();
    this.storage = storage; this.save = loadSave(storage);
    this.rand = rng(seed);
    this.time = 0; this.frame = 0; this.hitstop = 0; this.shake = 0; this.cam = { x: 0, y: 0 };
    this.res = { hx: 0, hy: 0 };
    this.backdrops = {}; this.banner = { text: '', t: 0 }; this.tallyPulse = 0; this.fade = 0;
    this.paused = false; this.modal = false; this.onDebug = null;
    this.loadRoom(this.save.at.region || 1, this.save.at.room);
  }

  makeVignette() {
    const [c, g] = mk(W, H);
    const gr = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.62);
    gr.addColorStop(0, 'rgba(8,5,14,0)'); gr.addColorStop(1, 'rgba(8,5,14,0.6)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return c;
  }

  // ------------------------------------------------------------ rooms
  loadRoom(regionId, roomId) {
    const region = regionById(regionId) || REGIONS[0];
    const def = region.rooms.find((r) => r.id === roomId) || region.rooms.find((r) => r.id === region.start) || region.rooms[0];
    this.region = region;
    this.room = parseRoom(def, region.id);
    this.tileCanvas = renderRoom(this.room, region.theme);
    this.backdrop = this.backdrops[region.theme] || (this.backdrops[region.theme] = makeBackdrop(region.theme));
    this.soldiers = []; this.stones = []; this.trophies = []; this.pickups = []; this.parts = []; this.torches = [];
    for (const sp of this.room.spawns) {
      if (sp.type === 'torch') this.torches.push({ x: sp.cx * T + 8, y: (sp.cy + 1) * T, seed: sp.cx * 1.3 });
      else if (sp.type === 'marked') {
        const st = this.save.soldiers[sp.id];
        if (st === 'c') continue;                                              // trophy already collected
        if (Array.isArray(st)) this.trophies.push(new Trophy(sp.id, st[0], st[1], this.homeOf(sp), null, this.rand));
        else this.soldiers.push(new Soldier(sp, true));
      } else if (sp.type === 'soldier') this.soldiers.push(new Soldier(sp, false));
    }
    const s = this.room.start || { cx: 2, cy: 2 };
    this.player = new Player(s.cx * T + 3, (s.cy + 1) * T - 22);
    this.save.at = { region: region.id, room: def.id };
    this.maxCamX = Math.max(0, this.room.w * T - W); this.maxCamY = Math.max(0, this.room.h * T - H);
    this.snapCamera();
    this.banner = { text: this.room.name || region.name, t: 4 };
    this.fade = 1;
    this.persist();
  }
  homeOf(sp) { return { x: sp.cx * T + 8, y: (sp.cy + 1) * T - 6 }; }

  // After David falls: back to the room's start, full health. Marked soldiers that are still
  // standing return to their posts; unmarked ones respawn. The tally is untouched.
  respawn() {
    const s = this.room.start;
    this.player.reset(s.cx * T + 3, (s.cy + 1) * T - 22);
    this.stones.length = 0; this.pickups.length = 0;
    this.soldiers = this.soldiers.filter((x) => x.marked && x.state !== 'dying').map((x) => new Soldier(x.sp, true));
    for (const sp of this.room.spawns) if (sp.type === 'soldier') this.soldiers.push(new Soldier(sp, false));
    this.snapCamera(); this.fade = 1; this.persist();
  }
  persist() { writeSave(this.storage, this.save); }
  resetSave() { clearSave(this.storage); this.save = freshSave(); this.loadRoom(1, null); }
  chargeScale() { return this.save.powers.includes('valor') ? 0.5 : 1; }

  // ------------------------------------------------------------ events
  onSoldierFell(s, dir) {
    if (s.marked) {
      const home = this.homeOf(s.sp);
      this.save.soldiers[s.id] = [home.x, home.y];
      this.trophies.push(new Trophy(s.id, s.cx, s.y + 8, home, { vx: (this.rand() - 0.5) * 170 + dir * 45, vy: -235 - this.rand() * 70 }, this.rand));
      this.sfx.play('pop');
      for (let i = 0; i < 9; i++) {              // a scatter of bouncing sparks around the ring
        this.parts.push({ x: s.cx, y: s.y + 8, vx: (this.rand() - 0.5) * 260, vy: -120 - this.rand() * 200, g: 620, life: 0.9 + this.rand() * 0.5, max: 1.4, col: i % 2 ? '#fff3c8' : '#ffd680', size: 1, glow: true, bounce: true });
      }
      this.persist();
    } else if (this.rand() < 0.35) {
      this.pickups.push({ x: s.cx - 3, y: s.y + 6, w: 6, h: 7, vx: 0, vy: -150, rest: false });
    }
  }

  collect(tr) {
    if (tr.taken) return;
    tr.taken = true;
    this.save.soldiers[tr.id] = 'c';
    this.save.tally = Math.min(TALLY_GOAL, this.save.tally + 1);
    this.tallyPulse = 0.6;
    this.sfx.play('collect');
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; this.parts.push({ x: tr.cx, y: tr.cy, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, g: 0, life: 0.35, max: 0.35, col: '#fff3c8', size: 1, glow: true }); }
    this.persist();
  }

  puff(x, y, n, col, speed, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * this.rand(), v = speed * (0.4 + this.rand() * 0.6);
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.8, g: o.glow ? 60 : 260, life: o.life || 0.4, max: o.life || 0.4, col, size: 1, glow: !!o.glow });
    }
  }

  // ------------------------------------------------------------ update
  update(dt) {
    this.input.poll(); this.sfx.tick(dt);
    if (this.input.pressed.debug && this.onDebug) this.onDebug();
    if (this.modal) return;
    if (this.input.pressed.pause) this.paused = !this.paused;
    if (this.paused) return;
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.time += dt; this.frame++; this.save.played += dt;
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 2);
    if (this.banner.t > 0) this.banner.t -= dt;
    if (this.tallyPulse > 0) this.tallyPulse -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 22);

    this.player.update(this, dt);
    for (const s of this.soldiers) s.update(this, dt);
    for (const s of this.stones) s.update(this, dt);
    for (const t of this.trophies) t.update(this, dt);
    const p = this.player;
    for (const k of this.pickups) {
      if (!k.rest) { k.vy = Math.min(k.vy + 700 * dt, 400); moveBody(this.room, k, dt, this.res); if (this.res.hy === 1) { k.rest = true; k.vy = 0; } }
      if (!p.dead && p.hp < p.maxHp && k.x < p.x + p.w && k.x + k.w > p.x && k.y < p.y + p.h && k.y + k.h > p.y) { k.gone = true; p.hp++; this.sfx.play('heal'); this.puff(k.x + 3, k.y, 6, '#b7f0a0', 60, { glow: true }); }
    }
    for (const q of this.parts) {
      q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.bounce && q.vy > 0 && this.room.solid(Math.floor(q.x / T), Math.floor(q.y / T))) { q.y -= q.vy * dt; q.vy *= -0.5; q.vx *= 0.7; }
    }
    this.soldiers = this.soldiers.filter((s) => !s.gone);
    this.stones = this.stones.filter((s) => !s.dead);
    this.trophies = this.trophies.filter((t) => !t.taken);
    this.pickups = this.pickups.filter((k) => !k.gone);
    this.parts = this.parts.filter((q) => q.life > 0);
    this.followCamera(dt);
  }

  camTarget() {
    const p = this.player;
    return {
      x: clamp(p.cx + p.face * 22 - W / 2, 0, this.maxCamX),
      y: clamp(p.cy - H * 0.56 - (p.charging && this.input.held.up ? 18 : 0), 0, this.maxCamY),
    };
  }
  snapCamera() { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; }
  followCamera(dt) {
    const t = this.camTarget();
    this.cam.x += (t.x - this.cam.x) * Math.min(1, dt * 5);
    this.cam.y += (t.y - this.cam.y) * Math.min(1, dt * 6);
  }

  // ------------------------------------------------------------ render
  light(x, y, r, rgb, a) {
    const l = this.lctx, gr = l.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.5, `rgba(${rgb},${a * 0.42})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    l.fillStyle = gr; l.fillRect(x - r, y - r, r * 2, r * 2);
  }

  render() {
    const ctx = this.ctx, w = this.wctx, t = this.time, p = this.player;
    const sh = this.shake > 0 ? this.shake : 0;
    const cx = Math.round(this.cam.x + (sh ? (this.rand() - 0.5) * sh : 0)), cy = Math.round(this.cam.y + (sh ? (this.rand() - 0.5) * sh : 0));
    const on = (x, y, m = 40) => x > cx - m && x < cx + W + m && y > cy - m && y < cy + H + m;

    drawBackdrop(ctx, this.backdrop, this.cam.x, this.cam.y, this.maxCamY);

    // World layer
    w.clearRect(0, 0, W, H);
    w.drawImage(this.tileCanvas, -cx, -cy);
    for (const o of this.torches) if (on(o.x, o.y)) drawTorchPost(w, o.x - cx, o.y - cy);
    for (const k of this.pickups) drawFig(w, Math.round(k.x + 3 - cx), Math.round(k.y + 7 - cy));
    for (const s of this.soldiers) if (on(s.x, s.y)) s.draw(w, cx, cy);
    p.draw(w, cx, cy);
    for (const s of this.stones) s.draw(w, cx, cy);
    for (const q of this.parts) if (!q.glow) { w.globalAlpha = clamp(q.life / q.max * 1.5, 0, 1); w.fillStyle = q.col; w.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.size, q.size); }
    w.globalAlpha = 1;

    // Light map: dusk ambient plus warm pools of light, multiplied over the world layer only.
    const l = this.lctx;
    l.globalCompositeOperation = 'source-over'; l.fillStyle = this.backdrop.ambient; l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'lighter';
    for (const o of this.torches) if (on(o.x, o.y, 110)) this.light(o.x - cx, o.y - 20 - cy, 92 + Math.sin(t * 11 + o.seed) * 4 + Math.sin(t * 23 + o.seed) * 2, '255,176,96', 0.95);
    this.light(Math.round(p.cx - cx), Math.round(p.cy - cy), 58, '190,170,200', 0.5);
    for (const tr of this.trophies) if (on(tr.x, tr.y)) this.light(Math.round(tr.cx - cx), Math.round(tr.cy - cy), 26, '255,236,190', 0.7);
    for (const s of this.soldiers) if (s.state === 'dying') this.light(Math.round(s.cx - cx), Math.round(s.y + 12 - cy), 54, '255,230,180', 1 - s.t / 0.75);
    for (const s of this.stones) if (s.charge >= 0.5) this.light(Math.round(s.x - cx), Math.round(s.y - cy), 16, '230,230,255', 0.5);
    const lit = this.litctx;
    lit.globalCompositeOperation = 'copy'; lit.drawImage(this.lightC, 0, 0);
    lit.globalCompositeOperation = 'destination-in'; lit.drawImage(this.world, 0, 0);
    w.globalCompositeOperation = 'multiply'; w.drawImage(this.litC, 0, 0); w.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.world, 0, 0);

    // Additive pass: flames, glows, motes, bodies dissolving in light.
    ctx.globalCompositeOperation = 'lighter';
    for (const o of this.torches) if (on(o.x, o.y)) {
      drawFlame(ctx, o.x - cx, o.y - cy, t, o.seed);
      const gr = ctx.createRadialGradient(o.x - cx, o.y - 20 - cy, 0, o.x - cx, o.y - 20 - cy, 26);
      gr.addColorStop(0, 'rgba(255,150,60,0.34)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
      ctx.fillStyle = gr; ctx.fillRect(o.x - cx - 26, o.y - 46 - cy, 52, 52);
    }
    for (const tr of this.trophies) if (on(tr.x, tr.y)) {
      const x = Math.round(tr.cx - cx), y = Math.round(tr.cy - cy) - (tr.rest ? 2 : 0), a = 0.3 + 0.12 * Math.sin(t * 5 + tr.seed);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, 11);
      gr.addColorStop(0, `rgba(255,238,190,${a})`); gr.addColorStop(1, 'rgba(255,238,190,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 11, y - 11, 22, 22);
    }
    for (const s of this.soldiers) s.drawGlow(ctx, cx, cy);
    for (const q of this.parts) if (q.glow) { ctx.globalAlpha = clamp(q.life / q.max * 1.6, 0, 1); ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.size, q.size); }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Unlit overlays: trophies, the mark over marked soldiers, alert marks, the aim arc.
    for (const tr of this.trophies) if (on(tr.x, tr.y)) tr.draw(ctx, cx, cy, t);
    for (const s of this.soldiers) {
      if (s.state === 'dying' || !on(s.x, s.y)) continue;
      const hx = Math.round(s.cx - cx), hy = Math.round(s.y - cy);
      if (s.marked) drawRing(ctx, hx, hy - 15 + Math.round(Math.sin(t * 3 + s.home.x) * 1.5), 0, Math.sin(t * 4 + s.home.x) > 0.8);
      if (s.state === 'alert' || s.state === 'windup') drawText(ctx, '!', hx - 1, hy - (s.marked ? 28 : 16), s.state === 'windup' ? '#ff6a4a' : '#ffd680', 2);
    }
    if (p.charging && !p.dead) this.drawAimArc(ctx, cx, cy);

    ctx.drawImage(this.vignette, 0, 0);
    this.drawHud(ctx);
    if (this.fade > 0) { ctx.fillStyle = `rgba(7,5,11,${this.fade})`; ctx.fillRect(0, 0, W, H); }
    if (this.paused) { ctx.fillStyle = 'rgba(7,5,11,0.6)'; ctx.fillRect(0, 0, W, H); drawText(ctx, 'PAUSED', (W - textWidth('PAUSED', 3)) / 2, 120, '#f1e2c0', 3); }
  }

  // Dotted preview of the stone's flight, so the arc can be aimed.
  drawAimArc(ctx, cx, cy) {
    const p = this.player, m = p.muzzle(), sp = p.shotSpeed();
    let x = m.x, y = m.y, vx = Math.cos(p.aim) * sp * p.face + p.vx * 0.35, vy = -Math.sin(p.aim) * sp;
    const step = 1 / 120, full = p.charge >= 1;
    for (let i = 1; i <= 96; i++) {
      vy += SLING.gravity * step; x += vx * step; y += vy * step;
      if (this.room.solid(Math.floor(x / T), Math.floor(y / T))) break;
      if (i % 3) continue;
      const big = full && i % 6 === 0;
      ctx.globalAlpha = (1 - i / 104) * (0.5 + 0.5 * p.charge);
      ctx.fillStyle = full ? '#ffffff' : '#f1e2c0';
      ctx.fillRect(Math.round(x - cx), Math.round(y - cy), big ? 2 : 1, big ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }

  drawHud(ctx) {
    const p = this.player;
    for (let i = 0; i < p.maxHp; i++) drawPip(ctx, 8 + i * 9, 8, i < p.hp);
    // Tally out of 200
    const pulse = this.tallyPulse > 0 ? this.tallyPulse / 0.6 : 0;
    const txt = String(this.save.tally).padStart(3, '0') + '/' + TALLY_GOAL;
    const tw = textWidth(txt, 2), x = W - 10 - tw, y = 8 - Math.round(pulse * 3);
    drawText(ctx, txt, x, y, pulse > 0.5 ? '#ffffff' : pulse > 0 ? '#ffe9a0' : '#f1e2c0', 2);
    drawRing(ctx, x - 9, y + 5, 0, pulse > 0.3);
    // Region banner
    if (this.banner.t > 0 && this.banner.text) {
      const a = clamp(Math.min(this.banner.t, 4 - this.banner.t) * 1.5, 0, 1), s = this.banner.text.toUpperCase();
      ctx.globalAlpha = a;
      const bw = textWidth(s, 2), bx = Math.round((W - bw) / 2);
      drawText(ctx, s, bx, 54, '#f1e2c0', 2);
      ctx.fillStyle = '#c98b3f'; ctx.fillRect(bx - 6, 68, bw + 12, 1);
      ctx.globalAlpha = 1;
    }
    if (this.save.played < 30) {
      const s = 'MOVE: ARROWS   JUMP: Z   SLING: HOLD X, AIM UP/DOWN';
      ctx.globalAlpha = clamp(30 - this.save.played, 0, 1) * 0.9;
      drawText(ctx, s, Math.round((W - textWidth(s)) / 2), H - 14, '#d9cba8', 1);
      ctx.globalAlpha = 1;
    }
  }

  // Compact state for scripted playthroughs.
  snapshot() {
    const p = this.player, r = (v) => Math.round(v * 10) / 10;
    return {
      frame: this.frame, time: r(this.time), region: this.region.id, room: this.room.id, tally: this.save.tally,
      player: { x: r(p.x), y: r(p.y), vx: r(p.vx), vy: r(p.vy), hp: p.hp, onGround: p.onGround, face: p.face, charge: r(p.charge), dead: p.dead, inv: r(Math.max(0, p.inv)) },
      soldiers: this.soldiers.map((s) => ({ id: s.id, marked: s.marked, x: r(s.x), y: r(s.y), hp: s.hp, state: s.state, face: s.face })),
      trophies: this.trophies.map((t) => ({ id: t.id, x: r(t.cx), y: r(t.cy), vy: r(t.vy), rest: t.rest, age: r(t.age), blink: t.blink(this.time) })),
      stones: this.stones.length, pickups: this.pickups.length, paused: this.paused, modal: this.modal,
    };
  }
}
