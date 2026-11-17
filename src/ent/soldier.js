// Philistine spearman. Marked soldiers (crimson crest, glowing ring overhead) each carry one of
// the 200 trophies and never respawn. Unmarked soldiers respawn and can only drop a fig.
import { T, approach, overlap } from '../core.js';
import { moveBody, touches, SPIKE, AIR } from '../world/room.js';
import { drawSoldier, drawSoldierLight } from '../gfx/chars.js';

const WALK = 28, CHASE = 64, SIGHT = 124, REACH = 36;

export class Soldier {
  constructor(sp, marked) {
    this.sp = sp; this.id = sp.id || null; this.marked = marked;
    this.w = 12; this.h = 24;
    this.home = { x: sp.cx * T + 2, y: (sp.cy + 1) * T - this.h };
    this.x = this.home.x; this.y = this.home.y; this.vx = 0; this.vy = 0;
    this.face = sp.cx % 2 ? 1 : -1;
    this.hp = marked ? 4 : 3;
    this.state = 'patrol'; this.t = 0; this.lost = 0; this.flash = 0; this.walk = 0; this.struck = false;
    this.moving = false; this.gone = false; this.onGround = false;
  }
  get cx() { return this.x + this.w / 2; }

  floorAhead(room, dir) {
    const fx = dir > 0 ? this.x + this.w + 3 : this.x - 3;
    return room.tileAt(fx, this.y + this.h + 3) !== AIR && room.tileAt(fx, this.y + this.h - 3) !== SPIKE;
  }

  update(g, dt) {
    const p = g.player, room = g.room;
    if (this.flash > 0) this.flash -= dt;
    if (this.state === 'dying') {
      this.t += dt;
      if (g.rand() < 0.6) g.parts.push({ x: this.cx + (g.rand() - 0.5) * 12, y: this.y + g.rand() * this.h, vx: (g.rand() - 0.5) * 14, vy: -20 - g.rand() * 40, g: -30, life: 0.7, max: 0.7, col: '#ffe9b8', size: 1, glow: true });
      if (this.t > 0.75) this.gone = true;
      return;
    }
    const dx = p.cx - this.cx, dy = (p.y + p.h) - (this.y + this.h), adx = Math.abs(dx);
    const sees = !p.dead && adx < SIGHT && Math.abs(dy) < 40 && (Math.sign(dx) === this.face || adx < 44);
    switch (this.state) {
      case 'patrol':
        this.vx = this.face * WALK;
        if (this.onGround && !this.floorAhead(room, this.face)) { this.face = -this.face; this.vx = 0; }
        if (sees) { this.state = 'alert'; this.t = 0.28; this.vx = 0; this.face = Math.sign(dx) || this.face; g.sfx.play('windup'); }
        break;
      case 'alert':
        this.vx = 0; this.t -= dt; if (this.t <= 0) this.state = 'chase';
        break;
      case 'chase':
        if (adx > 3) this.face = Math.sign(dx);
        this.vx = adx > REACH - 6 && this.floorAhead(room, this.face) ? this.face * CHASE : 0;
        if (adx <= REACH && Math.abs(dy) < 28 && !p.dead) { this.state = 'windup'; this.t = 0.42; this.vx = 0; g.sfx.play('windup'); }
        this.lost = (adx > 190 || Math.abs(dy) > 70 || p.dead) ? this.lost + dt : 0;
        if (this.lost > 1.6) { this.state = 'patrol'; this.lost = 0; }
        break;
      case 'windup':
        this.vx = 0; this.t -= dt;
        if (this.t <= 0) { this.state = 'thrust'; this.t = 0.2; this.vx = this.face * 150; this.struck = false; g.sfx.play('thrust'); }
        break;
      case 'thrust': {
        this.vx = approach(this.vx, 0, 700 * dt);
        if (!this.floorAhead(room, this.face)) this.vx = 0;
        const tip = { x: this.face > 0 ? this.x + this.w : this.x - 20, y: this.y + 5, w: 20, h: 8 };
        if (!this.struck && overlap(tip, p)) { this.struck = p.hurt(g, 1, this.face) || this.struck; }
        this.t -= dt; if (this.t <= 0) { this.state = 'recover'; this.t = 0.55; }
        break;
      }
      case 'recover':
        this.vx = 0; this.t -= dt; if (this.t <= 0) this.state = 'chase';
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

  // dir: travel direction of the stone (+1 right). Returns true if the hit landed.
  hit(g, dmg, dir, charge) {
    if (this.state === 'dying') return false;
    const frontal = dir === -this.face, guarding = this.state === 'patrol' || this.state === 'chase' || this.state === 'alert';
    if (frontal && guarding && charge < 0.5) {                 // a light stone glances off the shield
      g.sfx.play('tink');
      g.puff(this.cx + this.face * 8, this.y + 9, 5, '#ffd680', 90, { glow: true, life: 0.2 });
      if (this.state === 'patrol') { this.state = 'alert'; this.t = 0.2; }
      return false;
    }
    this.hp -= dmg; this.flash = 0.1;
    g.hitstop = Math.max(g.hitstop, 0.045 + 0.02 * dmg); g.shake = Math.max(g.shake, 1.5 + dmg);
    g.puff(this.cx, this.y + 9, 4 + dmg * 2, '#fff3c8', 120, { glow: true, life: 0.22 });
    if (this.hp <= 0) { this.die(g, dir); return true; }
    g.sfx.play('hit');
    this.state = 'stagger'; this.t = 0.24; this.vx = dir * (70 + 25 * dmg); this.face = -dir || this.face;
    return true;
  }

  die(g, dir) {
    if (this.state === 'dying') return;
    this.state = 'dying'; this.t = 0; this.vx = 0; this.moving = false;
    g.sfx.play('hit'); g.sfx.play('fall');
    g.onSoldierFell(this, dir);
  }

  pose() { return this; }
  draw(ctx, cx, cy) {
    if (this.state === 'dying') return;
    drawSoldier(ctx, this.cx - cx, this.y + this.h - cy, this, this.flash > 0);
  }
  // Additive pass: the dissolve, and the alert mark.
  drawGlow(ctx, cx, cy) {
    if (this.state !== 'dying') return;
    const k = Math.min(1, this.t / 0.75);
    drawSoldierLight(ctx, this.cx - cx, this.y + this.h - cy, this, 1 - 0.55 * k * k, 1 - k);
  }
}
