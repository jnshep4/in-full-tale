// Philistine soldiers, and the lions of Timnah. Marked soldiers (crimson crest, glowing ring
// overhead) each carry one of the 200 trophies and never respawn. Unmarked ones respawn and can only
// drop a fig. Kinds: spear (shield turns light stones), archer (looses arrows from range), heavy
// (tower shield turns everything short of a full-charge stone), lion (pounces; never marked),
// runner (no shield, fast, strikes and springs back), pike (slow, long reach), slinger (lobs stones).
import { T, approach, overlap, clamp } from '../core.js';
import { moveBody, touches, SPIKE, SOLID, ONEWAY, WATER, isBarrier } from '../world/room.js';
import { drawSoldier, drawSoldierLight, drawLion } from '../gfx/chars.js';
import { Shot } from './boss.js';

const KIND = {
  spear: { w: 12, h: 24, hp: [3, 4], walk: 28, chase: 90, sight: 140, reach: 36, guard: 0.5, wind: 0.42 },
  archer: { w: 12, h: 24, hp: [2, 3], walk: 18, chase: 0, sight: 232, reach: 232, guard: 0, wind: 0.65, ranged: true },
  heavy: { w: 14, h: 26, hp: [7, 8], walk: 20, chase: 46, sight: 120, reach: 36, guard: 1, wind: 0.55 },
  runner: { w: 12, h: 24, hp: [2, 3], walk: 40, chase: 128, sight: 150, reach: 30, guard: 0, wind: 0.3 },
  pike: { w: 12, h: 24, hp: [4, 5], walk: 22, chase: 58, sight: 140, reach: 60, guard: 0.5, wind: 0.62 },
  slinger: { w: 12, h: 24, hp: [2, 3], walk: 24, chase: 0, sight: 180, reach: 180, guard: 0, wind: 0.5, ranged: true },
  lion: { w: 22, h: 14, hp: [4, 4], walk: 36, chase: 118, sight: 150, reach: 74, guard: 0, wind: 0.32 },
};

export class Soldier {
  constructor(sp, marked, regionId = 1) {
    this.sp = sp; this.id = sp.id || null; this.marked = marked; this.kind = sp.kind || 'spear';
    // Deeper into Philistia the troops are quicker: shorter wind-ups and rests, faster on their feet.
    const deep = Math.max(0, regionId - 1), quick = this.quick = Math.max(0.65, 1 - 0.035 * deep);
    const K = this.K = { ...KIND[this.kind] }; K.wind *= quick; K.chase *= 1 + 0.03 * deep;
    this.w = K.w; this.h = K.h;
    this.home = { x: sp.cx * T + 8 - K.w / 2, y: (sp.cy + 1) * T - this.h };
    this.x = this.home.x; this.y = this.home.y; this.vx = 0; this.vy = 0;
    this.face = sp.cx % 2 ? 1 : -1;
    this.hp = K.hp[marked ? 1 : 0] + Math.floor((regionId - 1) / 2);
    this.state = 'patrol'; this.t = 0; this.lost = 0; this.flash = 0; this.walk = 0; this.struck = false; this.wall = false;
    this.moving = false; this.gone = false; this.onGround = false;
  }
  get cx() { return this.x + this.w / 2; }

  floorAhead(room, dir) {
    const fx = dir > 0 ? this.x + this.w + 3 : this.x - 3;
    if (fx < 20 || fx > room.w * T - 20) return false;          // soldiers do not leave by the room's edge exits
    const below = room.tileAt(fx, this.y + this.h + 3), at = room.tileAt(fx, this.y + this.h - 3);
    return (below === SOLID || below === ONEWAY || isBarrier(below)) && at !== SPIKE && at !== WATER;
  }

  update(g, dt) {
    const p = g.player, room = g.room, K = this.K;
    if (this.flash > 0) this.flash -= dt;
    if (this.state === 'dying') {
      this.t += dt;
      if (g.rand() < 0.6) g.parts.push({ x: this.cx + (g.rand() - 0.5) * 12, y: this.y + g.rand() * this.h, vx: (g.rand() - 0.5) * 14, vy: -20 - g.rand() * 40, g: -30, life: 0.7, max: 0.7, col: '#ffe9b8', size: 1, glow: true });
      if (this.t > 0.75) this.gone = true;
      return;
    }
    const dx = p.cx - this.cx, dy = (p.y + p.h) - (this.y + this.h), adx = Math.abs(dx);
    let sees = !p.dead && adx < K.sight && Math.abs(dy) < (K.ranged ? 72 : 40) && (Math.sign(dx) === this.face || adx < 44);
    // Walls, doors and hedges block both his sight and his weapon.
    if (sees || this.state !== 'patrol') { this.wall = false; for (let x = Math.min(p.cx, this.cx); x <= Math.max(p.cx, this.cx); x += 8) if (room.solid(Math.floor(x / T), Math.floor((this.y + 8) / T))) { this.wall = true; break; } }
    if (this.wall) { sees = false; if (this.state === 'chase' || this.state === 'alert' || this.state === 'windup') { this.state = 'patrol'; this.lost = 0; } }
    switch (this.state) {
      case 'patrol':
        this.vx = this.face * K.walk;
        if (this.onGround && !this.floorAhead(room, this.face)) { this.face = -this.face; this.vx = 0; }
        if (sees) {
          this.state = 'alert'; this.t = 0.28; this.vx = 0; this.face = Math.sign(dx) || this.face; g.sfx.play('windup');
          // He calls out: comrades close by turn on David too, whichever way they were facing.
          for (const o of g.soldiers) if (o !== this && o.state === 'patrol' && o.kind !== 'lion' && Math.abs(o.cx - this.cx) < 130 && Math.abs(o.y - this.y) < 40) { o.state = 'alert'; o.t = 0.45; o.vx = 0; o.face = Math.sign(p.cx - o.cx) || o.face; }
        }
        break;
      case 'alert':
        this.vx = 0; this.t -= dt; if (this.t <= 0) this.state = 'chase';
        break;
      case 'chase':
        if (adx > 3) this.face = Math.sign(dx);
        if (K.ranged) this.vx = adx < 60 && this.floorAhead(room, -this.face) ? -this.face * 40 : 0;       // keeps his distance
        else this.vx = adx > K.reach - 6 && this.floorAhead(room, this.face) ? this.face * K.chase : 0;
        if (adx <= K.reach && Math.abs(dy) < (K.ranged ? 72 : 28) && !p.dead && (!K.ranged || adx > 30)) { this.state = 'windup'; this.t = K.wind; this.vx = 0; g.sfx.play('windup'); }
        this.lost = (adx > K.sight + 66 || Math.abs(dy) > 80 || p.dead) ? this.lost + dt : 0;
        if (this.lost > 1.6) { this.state = 'patrol'; this.lost = 0; }
        break;
      case 'windup':
        this.vx = 0; this.t -= dt;
        if (K.ranged && adx > 3) this.face = Math.sign(dx);
        if (this.t <= 0) {
          this.state = 'thrust'; this.struck = false;
          if (K.ranged) {
            this.t = 0.15;
            const ox = this.cx + this.face * 7, oy = this.y + 8, fl = clamp(adx / 250, 0.25, 1);
            if (this.kind === 'slinger') { const ft = clamp(adx / 170, 0.55, 1.05); g.shots.push(new Shot('rock', ox, oy - 6, (p.cx - ox) / ft, (p.cy - oy + 6) / ft - 150 * ft, { grav: 300 })); }
            else g.shots.push(new Shot('arrow', ox, oy, (p.cx - ox) / fl, (p.cy - oy) / fl - 60 * fl, { grav: 120 }));
            g.sfx.play('throw');
          } else if (this.kind === 'lion') { this.t = 0.6; this.vx = this.face * 235; this.vy = -215; this.onGround = false; g.sfx.play('roar'); }
          else { this.t = 0.2; this.vx = this.face * (this.kind === 'heavy' ? 110 : this.kind === 'pike' ? 70 : this.kind === 'runner' ? 190 : 150); g.sfx.play(this.kind === 'heavy' ? 'swing' : 'thrust'); }
        }
        break;
      case 'thrust': {
        if (this.kind === 'lion') {
          if (!this.struck && overlap(this, p)) this.struck = p.hurt(g, 1, this.face) || this.struck;
          this.t -= dt; if (this.t <= 0 || (this.onGround && this.t < 0.45)) { this.state = 'recover'; this.t = 0.6; }
          break;
        }
        this.vx = approach(this.vx, 0, 700 * dt);
        if (!this.floorAhead(room, this.face)) this.vx = 0;
        if (!K.ranged) {
          const rch = this.kind === 'heavy' ? 24 : this.kind === 'pike' ? 46 : 20;
          const tip = { x: this.face > 0 ? this.x + this.w : this.x - rch, y: this.y + (this.kind === 'heavy' ? 0 : 5), w: rch, h: this.kind === 'heavy' ? 22 : 8 };
          if (!this.struck && !this.wall && overlap(tip, p)) {
            if (g.blocks(this.face)) { this.struck = true; this.state = 'stagger'; this.t = 0.5; this.vx = -this.face * 90; g.sfx.play('tink'); g.puff(p.cx + p.face * 6, p.cy, 6, '#ffd680', 90, { glow: true, life: 0.2 }); break; }
            this.struck = p.hurt(g, 1, this.face) || this.struck;
          }
        }
        this.t -= dt; if (this.t <= 0) { this.state = 'recover'; this.t = this.kind === 'archer' ? 1.0 : this.kind === 'slinger' ? 0.7 : (this.kind === 'heavy' || this.kind === 'pike' ? 0.8 : 0.45) * this.quick; if (this.kind === 'runner' && this.floorAhead(room, -this.face)) { this.vx = -this.face * 240; this.t = 0.6; } }
        break;
      }
      case 'recover':
        this.vx = approach(this.vx, 0, (this.kind === 'runner' ? 380 : 600) * dt); this.t -= dt; if (this.t <= 0) this.state = 'chase';
        break;
      case 'stagger':
        this.vx = approach(this.vx, 0, 500 * dt);
        this.t -= dt; if (this.t <= 0) this.state = 'chase';
        break;
    }
    this.vy = Math.min(this.vy + 1300 * dt, 430);
    moveBody(room, this, dt, g.res);
    if (g.res.hx) { this.vx = 0; if (this.state === 'patrol') this.face = -this.face; }
    if (g.res.hy) this.vy = 0;
    this.onGround = g.res.hy === 1;
    this.moving = Math.abs(this.vx) > 8 && this.onGround && this.state !== 'thrust' && this.state !== 'stagger';
    if (this.moving) this.walk += dt * (this.state === 'chase' ? 13 : 8);
    if (touches(room, this, SPIKE) || this.y > room.h * T + 40) this.die(g, 0);
  }

  // dir: travel direction of the blow (+1 right). tag: 'sword' or 'pound' pass any guard.
  // Returns true if the hit landed.
  hit(g, dmg, dir, charge, tag) {
    if (this.state === 'dying') return false;
    const frontal = dir === -this.face, guarding = this.state === 'patrol' || this.state === 'chase' || this.state === 'alert' || (this.kind === 'heavy' && this.state === 'windup');
    if (frontal && guarding && !tag && charge < this.K.guard) {              // the stone glances off the shield
      g.sfx.play('tink');
      g.puff(this.cx + this.face * 8, this.y + 9, 5, '#ffd680', 90, { glow: true, life: 0.2 });
      if (this.state === 'patrol') { this.state = 'alert'; this.t = 0.2; }
      return false;
    }
    this.hp -= dmg; this.flash = 0.1;
    g.hitstop = Math.max(g.hitstop, 0.045 + 0.02 * Math.min(dmg, 3)); g.shake = Math.max(g.shake, 1.5 + Math.min(dmg, 3));
    g.puff(this.cx, this.y + 9, 4 + dmg * 2, '#fff3c8', 120, { glow: true, life: 0.22 });
    if (this.hp <= 0) { this.die(g, dir); return true; }
    g.sfx.play('hit');
    this.state = 'stagger'; this.t = this.kind === 'heavy' ? 0.16 : 0.24; this.vx = dir * (70 + 25 * Math.min(dmg, 3)) * (this.kind === 'heavy' ? 0.5 : 1); this.face = -dir || this.face;
    return true;
  }

  die(g, dir) {
    if (this.state === 'dying') return;
    this.state = 'dying'; this.t = 0; this.vx = 0; this.moving = false;
    g.sfx.play('hit'); g.sfx.play('fall');
    g.onSoldierFell(this, dir);
  }

  draw(ctx, cx, cy) {
    if (this.state === 'dying') return;
    if (this.kind === 'lion') drawLion(ctx, this.cx - cx, this.y + this.h - cy, this, this.flash > 0, false);
    else drawSoldier(ctx, this.cx - cx, this.y + this.h - cy, this, this.flash > 0);
  }
  // Additive pass: the dissolve.
  drawGlow(ctx, cx, cy) {
    if (this.state !== 'dying') return;
    const k = Math.min(1, this.t / 0.75);
    if (this.kind === 'lion') drawLion(ctx, this.cx - cx, this.y + this.h - cy, this, false, [1 - 0.55 * k * k, 1 - k]);
    else drawSoldierLight(ctx, this.cx - cx, this.y + this.h - cy, this, 1 - 0.55 * k * k, 1 - k);
  }
}
