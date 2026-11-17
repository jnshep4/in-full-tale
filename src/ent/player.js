// David. Run, variable jump with coyote time and jump buffering, and an aimed, chargeable sling.
import { T, approach, clamp, lerp } from '../core.js';
import { moveBody, touches, SPIKE, ONEWAY, SOLID } from '../world/room.js';
import { drawDavid } from '../gfx/chars.js';
import { Stone } from './stone.js';

export const PHYS = { run: 132, accel: 1500, airAccel: 1000, jump: 330, gravUp: 900, gravDown: 1300, maxFall: 430, cutVy: -110 };
export const SLING = { chargeTime: 0.7, minSpeed: 250, maxSpeed: 470, gravity: 430, cooldown: 0.16 };
const AIM = { level: 0.14, high: 0.78, lob: 1.36, low: -0.55 };   // radians above the horizon

export class Player {
  constructor(x, y) {
    this.w = 10; this.h = 22;
    this.maxHp = 5;
    this.reset(x, y);
  }
  reset(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.face = 1;
    this.onGround = false; this.coyote = 0; this.jumpBuf = 0; this.drop = 0; this.cut = false;
    this.hp = this.maxHp; this.inv = 0; this.hurtT = 0; this.dead = false; this.deadT = 0;
    this.charging = false; this.charge = 0; this.wasFull = false; this.cool = 0; this.aim = AIM.level; this.slingA = 0; this.throwT = 0;
    this.run = 0; this.landT = 0; this.t = 0; this.stepT = 0; this.moving = false;
    this.safe = { x, y }; this.safeT = 0;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  // Where a stone leaves the sling.
  muzzle() { return { x: this.cx + this.face * 4, y: this.y + 5 }; }
  shotSpeed() { return lerp(SLING.minSpeed, SLING.maxSpeed, this.charge); }

  update(g, dt) {
    const inp = g.input, room = g.room;
    this.t += dt;
    if (this.inv > 0) this.inv -= dt;
    if (this.cool > 0) this.cool -= dt;
    if (this.throwT > 0) this.throwT -= dt;
    if (this.landT > 0) this.landT -= dt;
    if (this.drop > 0) this.drop -= dt;
    if (this.dead) {
      this.deadT += dt; this.vx = approach(this.vx, 0, 600 * dt);
      this.vy = Math.min(this.vy + PHYS.gravDown * dt, PHYS.maxFall);
      moveBody(room, this, dt, g.res); if (g.res.hy) this.vy = 0;
      if (this.deadT > 1.3) g.respawn();
      return;
    }
    const control = this.hurtT <= 0;
    if (this.hurtT > 0) this.hurtT -= dt;
    const ax = control ? inp.x : 0;
    // While fire is held David keeps facing his target, so he can back away and still aim.
    if (ax !== 0 && (!inp.held.fire || inp.pressed.fire)) this.face = ax;
    const pace = this.charging && ax === -this.face ? 0.75 : 1;
    this.vx = approach(this.vx, ax * PHYS.run * pace, (this.onGround ? PHYS.accel : PHYS.airAccel) * dt);
    this.moving = Math.abs(this.vx) > 12;

    // Jump: buffered press, coyote time, release to cut short. Down + jump drops through planks.
    if (inp.pressed.jump) this.jumpBuf = 0.12;
    if (this.jumpBuf > 0) this.jumpBuf -= dt;
    this.coyote = this.onGround ? 0.1 : this.coyote - dt;
    if (control && this.jumpBuf > 0 && this.coyote > 0) {
      const below = room.tileAt(this.cx, this.y + this.h + 2);
      if (inp.held.down && below === ONEWAY) { this.drop = 0.18; }
      else { this.vy = -PHYS.jump; this.cut = false; g.sfx.play('jump'); g.puff(this.cx, this.y + this.h, 4, '#b9a685', 30); }
      this.jumpBuf = 0; this.coyote = 0; this.onGround = false;
    }
    if (!inp.held.jump && !this.cut && this.vy < PHYS.cutVy) { this.vy = PHYS.cutVy; this.cut = true; }
    this.vy = Math.min(this.vy + (this.vy < 0 ? PHYS.gravUp : PHYS.gravDown) * dt, PHYS.maxFall);

    const wasGround = this.onGround, fallV = this.vy;
    moveBody(room, this, dt, g.res);
    if (g.res.hx) this.vx = 0;
    if (g.res.hy) this.vy = 0;
    this.onGround = g.res.hy === 1;
    if (this.onGround && !wasGround && fallV > 150) { this.landT = 0.09; g.sfx.play('land'); g.puff(this.cx, this.y + this.h, 5, '#b9a685', 40); }
    if (this.onGround && this.moving) {
      this.run += dt * 15;
      this.stepT -= dt; if (this.stepT <= 0) { this.stepT = 0.21; g.sfx.play('step'); }
    } else if (!this.moving) this.run = 0;

    // Last safe footing, for recovery from pits.
    if (this.onGround && room.tileAt(this.cx, this.y + this.h + 2) === SOLID) {
      this.safeT += dt;
      if (this.safeT > 0.4) { this.safe.x = this.x; this.safe.y = this.y; this.safeT = 0; }
    }
    if (touches(room, this, SPIKE)) {
      if (this.vy >= 0) { this.vy = -270; this.cut = true; }
      this.hurt(g, 1, 0);
    }
    if (this.y > room.h * T + 48) { this.x = this.safe.x; this.y = this.safe.y; this.vx = this.vy = 0; this.inv = 0; this.hurt(g, 1, 0); }

    // Sling: hold to charge, release to loose. Aim with up/down, or the right stick.
    let want = AIM.level;
    if (inp.aimStick) want = Math.atan2(-inp.aimY, Math.abs(inp.aimX) < 0.15 ? 0.15 : Math.abs(inp.aimX));
    else if (inp.held.up) want = inp.x !== 0 ? AIM.high : AIM.lob;
    else if (inp.held.down) want = AIM.low;
    if (inp.aimStick && Math.abs(inp.aimX) > 0.3) this.face = Math.sign(inp.aimX);
    this.aim = lerp(this.aim, want, clamp(dt * 16, 0, 1));
    if (control && inp.held.fire && this.cool <= 0) {
      this.charging = true;
      this.charge = Math.min(1, this.charge + dt / (SLING.chargeTime * g.chargeScale()));
      this.slingA += (11 + 20 * this.charge) * dt;
      if (this.charge >= 1 && !this.wasFull) { this.wasFull = true; g.sfx.play('ready'); g.puff(this.cx + this.face * 3, this.y - 4, 6, '#fff3c8', 60, { glow: true, life: 0.25 }); }
    } else if (this.charging) {
      if (control) this.loose(g);
      this.charging = false; this.charge = 0; this.wasFull = false;
    }
  }

  loose(g) {
    const m = this.muzzle(), sp = this.shotSpeed();
    g.stones.push(new Stone(m.x, m.y, Math.cos(this.aim) * sp * this.face + this.vx * 0.35, -Math.sin(this.aim) * sp, this.charge));
    g.sfx.play('sling', this.charge);
    this.cool = SLING.cooldown; this.throwT = 0.14;
  }

  hurt(g, dmg, dir) {
    if (this.inv > 0 || this.dead) return false;
    this.hp -= dmg; this.inv = 1.1; this.hurtT = 0.24;
    if (dir) { this.vx = dir * 170; this.vy = -190; this.cut = true; }
    this.charging = false; this.charge = 0; this.wasFull = false;
    g.sfx.play('hurt'); g.shake = 5; g.hitstop = 0.07;
    g.puff(this.cx, this.cy, 8, '#fff3c8', 110, { glow: true, life: 0.3 });
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deadT = 0; g.sfx.play('die'); }
    return true;
  }

  draw(ctx, cx, cy) {
    if (this.dead && this.deadT > 0.25 && Math.floor(this.deadT * 20) % 2) return;
    if (this.inv > 0 && !this.dead && this.hurtT <= 0 && Math.floor(this.inv * 18) % 2) return;
    drawDavid(ctx, this.cx - cx, this.y + this.h - cy, this, this.hurtT > 0.16);
  }
}
