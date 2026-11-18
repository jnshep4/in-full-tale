// David. Run, variable jump with coyote time and jump buffering, an aimed chargeable sling, and the
// ten powers won from the captains (src/data/powers.js). Each power is checked with g.has(id).
import { T, approach, clamp, lerp, overlap } from '../core.js';
import { moveBody, touches, SPIKE, ONEWAY, SOLID, WATER, REED, CRACK, THORN, RING } from '../world/room.js';
import { drawDavid } from '../gfx/chars.js';
import { Stone } from './stone.js';

export const PHYS = { run: 132, accel: 1500, airAccel: 1000, jump: 330, gravUp: 900, gravDown: 1300, maxFall: 430, cutVy: -110, jump2: 300, climb: 72, pound: 540 };
export const DASH = { speed: 310, time: 0.16, cool: 0.42 };
export const SLING = { chargeTime: 0.7, minSpeed: 250, maxSpeed: 470, gravity: 430, cooldown: 0.16, rangeMin: 84, rangeMax: 132, drop: 1500 };
export const SWORD = { time: 0.18, cool: 0.34, reach: 26, dmg: 3 };
export const CORD = { range: 112, speed: 460 };
export const AIM = { level: 0.14, high: 0.78, lob: 1.36, low: -0.55, min: -1.3, max: 1.45, rate: 2.2 };   // radians above the horizon; rate in radians per second

export class Player {
  constructor(x, y) {
    this.w = 10; this.h = 22;
    this.maxHp = 5;
    this.face = 1;
    this.reset(x, y);
  }
  reset(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.dashT = 0; this.dashCool = 0; this.dashDir = 1; this.airDash = true;
    this.jumps = 0; this.air2 = false; this.cling = 0; this.pounding = false; this.wallT = 0;
    this.swordT = 0; this.swordCool = 0; this.hang = null; this.zip = null; this.inWater = false;
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
    for (const k of ['inv', 'cool', 'throwT', 'landT', 'drop', 'dashCool', 'swordT', 'swordCool', 'wallT']) if (this[k] > 0) this[k] -= dt;
    if (this.dead) {
      this.deadT += dt; this.vx = approach(this.vx, 0, 600 * dt);
      this.vy = Math.min(this.vy + PHYS.gravDown * dt, PHYS.maxFall);
      moveBody(room, this, dt, g.res); if (g.res.hy) this.vy = 0;
      if (this.deadT > 1.3) g.respawn();
      return;
    }
    const control = this.hurtT <= 0;
    if (this.hurtT > 0) this.hurtT -= dt;
    const ax = control && this.wallT <= 0 ? inp.x : 0;
    if (inp.pressed.jump) this.jumpBuf = 0.12;
    if (this.jumpBuf > 0) this.jumpBuf -= dt;

    // ---- Shepherd's Cord: swing up to a bronze ring and hang beneath it.
    if (control && inp.pressed.cord && g.has('grapple') && !this.zip) {
      let best = null, bd = CORD.range;
      for (const r of g.rings) {
        const d = Math.hypot(r.x - this.cx, r.y - this.cy);
        if (d < bd && (!this.hang || r !== this.hang) && this.clearTo(room, r.x, r.y + 12)) { best = r; bd = d; }
      }
      if (best) { this.zip = best; this.hang = null; this.cling = 0; this.pounding = false; this.dashT = 0; g.sfx.play('throw'); }
    }
    if (this.zip) {
      const tx = this.zip.x - this.w / 2, ty = this.zip.y + 8, dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), stepLen = CORD.speed * dt;
      if (d <= stepLen) { this.x = tx; this.y = ty; this.hang = this.zip; this.zip = null; this.vx = this.vy = 0; g.sfx.play('tink'); }
      else { this.x += dx / d * stepLen; this.y += dy / d * stepLen; this.vx = dx / d * CORD.speed; this.vy = 0; if (Math.abs(dx) > 4) this.face = Math.sign(dx); }
      this.onGround = false; this.sling(g, dt, control, false);
      return;
    }
    if (this.hang) {
      this.vx = this.vy = 0; this.onGround = false; this.airDash = true; this.jumps = g.has('double') ? 1 : 0; this.air2 = false;
      if (inp.x !== 0 && !inp.held.fire) this.face = inp.x;
      if (control && this.jumpBuf > 0) {
        this.jumpBuf = 0; const down = inp.held.down;
        this.hang = null; this.vy = down ? 0 : -PHYS.jump; this.vx = inp.x * PHYS.run; this.cut = false;
        if (!down) g.sfx.play('jump');
      } else { this.sling(g, dt, control, false); return; }
    }

    // ---- Run
    // While fire is held David keeps facing his target, so he can back away and still aim.
    if (ax !== 0 && (!inp.held.fire || inp.pressed.fire) && !this.cling) this.face = ax;
    const pace = (this.charging && ax === -this.face ? 0.75 : 1) * (this.inWater ? 0.6 : 1);
    this.vx = approach(this.vx, ax * PHYS.run * pace, (this.onGround ? PHYS.accel : PHYS.airAccel) * dt);
    this.moving = Math.abs(this.vx) > 12;

    // ---- Fleet Foot: a short level burst. One per airborne stretch. Bursts through reed screens.
    if (this.onGround) { this.airDash = true; this.jumps = g.has('double') ? 1 : 0; this.air2 = false; }
    if (control && inp.pressed.dash && g.has('dash') && this.dashCool <= 0 && this.dashT <= 0 && (this.onGround || this.airDash) && !this.pounding) {
      this.dashT = DASH.time; this.dashCool = DASH.cool; this.dashDir = this.cling ? -this.cling : (ax || this.face); this.face = this.dashDir;
      if (!this.onGround) this.airDash = false;
      this.cling = 0; this.charging = false; this.charge = 0; this.wasFull = false; this.dashHit = false;
      g.sfx.play('dash');
    }
    const dashing = this.dashT > 0;
    if (dashing) {
      this.dashT -= dt; this.vx = this.dashDir * DASH.speed; this.vy = 0; this.cut = true;
      if (g.frame % 2 === 0) g.parts.push({ x: this.cx - this.dashDir * 4, y: this.y + 4 + g.rand() * 14, vx: -this.dashDir * 30, vy: 0, g: 0, life: 0.22, max: 0.22, col: g.rand() < 0.5 ? '#9fc2ff' : '#f1e2c0', size: 2, glow: true });
      const ahead = this.dashDir > 0 ? this.x + this.w + 2 : this.x - 2;
      for (let yy = this.y + 1; yy < this.y + this.h; yy += 7) if (room.tileAt(ahead, yy) === REED) g.breakGate(Math.floor(ahead / T), Math.floor(yy / T));
      if (g.boss && !this.dashHit && overlap(this, g.boss)) this.dashHit = g.boss.hit(g, 3, this.dashDir, { tag: 'dash', charge: 1 });
      if (this.dashT <= 0) this.vx = this.dashDir * PHYS.run;
    }

    // ---- Water (Deep Breath)
    const wasWet = this.inWater;
    this.inWater = g.has('swim') && room.tileAt(this.cx, this.cy) === WATER;
    if (this.inWater !== wasWet) { g.sfx.play('splash'); g.puff(this.cx, this.cy, 8, '#bfe0ff', 90, { glow: true, life: 0.3 }); }
    if (this.inWater) { this.airDash = true; this.jumps = g.has('double') ? 1 : 0; this.pounding = false; this.cling = 0; }

    // ---- Rock Hold: cling to a wall, climb it, spring away. He catches hold only once he has stopped
    // rising, so a jump up a low step is never interrupted.
    const wallAt = (dir, yy) => room.solid(Math.floor((dir > 0 ? this.x + this.w + 1 : this.x - 2) / T), Math.floor(yy / T));
    if (g.has('climb') && !this.onGround && !dashing && !this.pounding && !this.inWater && control) {
      if (!this.cling && this.wallT <= 0 && inp.x !== 0 && this.vy >= 0 && this.y > 4 && wallAt(inp.x, this.y + this.h - 3) && wallAt(inp.x, this.y + 6)) { this.cling = inp.x; this.face = inp.x; g.sfx.play('land'); }
    }
    if (this.cling) {
      const c = this.cling;
      if (this.onGround || inp.x === -c || !wallAt(c, this.y + this.h - 3)) {
        // Topping out: the wall ends at his feet, so he pulls himself over the edge.
        if (!this.onGround && inp.x !== -c && inp.held.up) { this.vy = -210; this.vx = c * 80; this.wallT = 0.12; }
        this.cling = 0;
      } else {
        // While the sling is whirling, up and down aim it instead of climbing.
        this.vx = 0; this.vy = inp.held.fire ? 0 : inp.held.up ? -PHYS.climb : inp.held.down ? PHYS.climb * 1.4 : 0;
        if (this.y < 4) this.vy = Math.max(this.vy, this.y < 0 ? 60 : 0);     // no climbing out over the top of the room
        this.airDash = true; this.jumps = g.has('double') ? 1 : 0; this.air2 = false;
      }
    }

    // ---- Jump: buffered press, coyote time, release to cut short. Down + jump drops through planks.
    this.coyote = this.onGround ? 0.1 : this.coyote - dt;
    if (control && this.jumpBuf > 0) {
      if (this.cling) {
        const c = this.cling; this.cling = 0; this.vy = -PHYS.jump * 0.92; this.vx = -c * 150; this.face = -c; this.wallT = 0.16; this.cut = false; this.jumpBuf = 0;
        g.sfx.play('jump'); g.puff(this.cx + c * 5, this.cy, 4, '#b9a685', 30);
      } else if (this.inWater) {
        if (room.tileAt(this.cx, this.cy - 14) !== WATER) { this.vy = -PHYS.jump * 0.9; this.cut = false; this.jumpBuf = 0; g.sfx.play('jump'); }
      } else if (this.coyote > 0) {
        const below = room.tileAt(this.cx, this.y + this.h + 2);
        if (inp.held.down && below === ONEWAY) { this.drop = 0.18; }
        else { this.vy = -PHYS.jump; this.cut = false; g.sfx.play('jump'); g.puff(this.cx, this.y + this.h, 4, '#b9a685', 30); }
        this.jumpBuf = 0; this.coyote = 0; this.onGround = false;
      } else if (inp.held.down && g.has('pound') && !this.pounding) {
        this.pounding = true; this.vx = 0; this.vy = PHYS.pound; this.dashT = 0; this.jumpBuf = 0; g.sfx.play('dash');   // Lion's Fall
      } else if (this.jumps > 0 && !this.pounding) {
        this.jumps--; this.air2 = true; this.vy = -PHYS.jump2; this.cut = false; this.jumpBuf = 0;                       // Hind's Feet
        g.sfx.play('jump'); g.puff(this.cx, this.y + this.h, 6, '#bfe0ff', 50, { glow: true, life: 0.25 });
      }
    }
    if (!inp.held.jump && !this.cut && this.vy < PHYS.cutVy) { this.vy = PHYS.cutVy; this.cut = true; }
    if (this.pounding) { this.vx = 0; this.vy = PHYS.pound; }
    else if (this.inWater) this.vy = approach(this.vy, inp.held.up ? -85 : inp.held.down ? 95 : 14, 900 * dt);
    else if (!dashing && !this.cling) this.vy = Math.min(this.vy + (this.vy < 0 ? PHYS.gravUp : PHYS.gravDown) * dt, PHYS.maxFall);

    const wasGround = this.onGround, fallV = this.vy;
    moveBody(room, this, dt, g.res);
    if (g.res.hx) this.vx = 0;
    if (g.res.hy) this.vy = 0;
    this.onGround = g.res.hy === 1;
    if (this.pounding && this.onGround) this.poundLand(g);
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
      this.pounding = false;
      this.hurt(g, 1, 0);
    }
    if (this.y > room.h * T + 48) this.sweptBack(g);
    // Deep water carries David back to the bank until he has learned to hold his breath.
    if (room.tileAt(this.cx, this.y + this.h - 4) === WATER && !g.has('swim')) {
      g.sfx.play('splash'); g.puff(this.cx, this.y + this.h - 6, 12, '#bfe0ff', 120, { glow: true, life: 0.4 });
      this.sweptBack(g);
    }

    // ---- Goliath's sword
    if (control && inp.pressed.melee && g.has('sword') && this.swordCool <= 0 && !dashing) {
      this.swordT = SWORD.time; this.swordCool = SWORD.cool; this.charging = false; this.charge = 0; this.wasFull = false;
      g.sfx.play('swing');
      const box = { x: this.face > 0 ? this.cx : this.cx - SWORD.reach - 4, y: this.y - 6, w: SWORD.reach + 4, h: this.h + 8 };
      for (const s of g.soldiers) if (s.state !== 'dying' && overlap(box, s)) s.hit(g, SWORD.dmg, this.face, 1, 'sword');
      if (g.boss && overlap(box, g.boss)) g.boss.hit(g, SWORD.dmg, this.face, { tag: 'sword', charge: 1 });
      for (const sh of g.shots) if (sh.kind !== 'wave' && overlap(box, sh.box())) { sh.dead = true; g.sfx.play('tink'); }
      for (let yy = box.y + 2; yy < box.y + box.h; yy += 8) for (let xx = box.x; xx <= box.x + box.w; xx += 8) if (room.tileAt(xx, yy) === THORN) g.breakGate(Math.floor(xx / T), Math.floor(yy / T));
    }

    this.sling(g, dt, control, dashing);
  }

  // Lion's Fall lands: cracked slabs break, nearby soldiers are thrown, a captain feels it.
  poundLand(g) {
    this.pounding = false;
    g.shake = Math.max(g.shake, 7); g.sfx.play('slam'); g.puff(this.cx, this.y + this.h, 14, '#b9a685', 150);
    const cy = Math.floor((this.y + this.h + 2) / T);
    for (let cx = Math.floor((this.x - 2) / T); cx <= Math.floor((this.x + this.w + 2) / T); cx++) if (g.room.tile(cx, cy) === CRACK) { g.breakGate(cx, cy); this.onGround = false; }
    const zone = { x: this.cx - 44, y: this.y - 4, w: 88, h: this.h + 10 };
    for (const s of g.soldiers) if (s.state !== 'dying' && overlap(zone, s)) s.hit(g, 2, Math.sign(s.cx - this.cx) || 1, 1, 'pound');
    if (g.boss && overlap({ x: this.cx - 60, y: this.y - 30, w: 120, h: this.h + 40 }, g.boss)) g.boss.hit(g, 2, Math.sign(g.boss.cx - this.cx) || 1, { tag: 'pound', charge: 1 });
  }

  // Is the straight line from David's chest to (x, y) free of solid ground?
  clearTo(room, x, y) {
    const n = Math.ceil(Math.hypot(x - this.cx, y - this.cy) / 8);
    for (let i = 1; i < n; i++) if (room.solid(Math.floor((this.cx + (x - this.cx) * i / n) / T), Math.floor((this.cy + (y - this.cy) * i / n) / T))) return false;
    return true;
  }

  // Sling: hold to charge, release to loose. Aim with up/down, or the right stick.
  sling(g, dt, control, dashing) {
    const inp = g.input;
    // On his feet or in the air David slings straight ahead, level, and the stone carries only a
    // short way (SLING.rangeMin to rangeMax), so he has to come within a spear's rush of his man and
    // jump to reach anyone above or below. From a perch (clinging to a wall, hanging from the cord,
    // afloat) he has time to pick an angle: there up and down turn the aim, and the stone flies in an arc.
    const perch = this.aimable();
    if (!perch) this.aim = 0;
    else if (inp.aimStick) {
      this.aim = lerp(this.aim, Math.atan2(-inp.aimY, Math.abs(inp.aimX) < 0.15 ? 0.15 : Math.abs(inp.aimX)), clamp(dt * 16, 0, 1));
      if (Math.abs(inp.aimX) > 0.3) this.face = Math.sign(inp.aimX);
    } else if (this.charging) {
      if (inp.held.up) this.aim = Math.min(AIM.max, this.aim + AIM.rate * dt);
      else if (inp.held.down) this.aim = Math.max(AIM.min, this.aim - AIM.rate * dt);
    } else this.aim = lerp(this.aim, AIM.level, clamp(dt * 16, 0, 1));
    if (control && inp.held.fire && this.cool <= 0 && !dashing && this.swordT <= 0) {
      if (this.cling && !this.charging) this.face = -this.cling;          // from a wall he slings outward
      this.charging = true;
      this.charge = Math.min(1, this.charge + dt / (SLING.chargeTime * g.chargeScale()));
      this.slingA += (11 + 20 * this.charge) * dt;
      if (this.charge >= 1 && !this.wasFull) { this.wasFull = true; g.sfx.play('ready'); g.puff(this.cx + this.face * 3, this.y - 4, 6, '#fff3c8', 60, { glow: true, life: 0.25 }); }
    } else if (this.charging) {
      if (control) this.loose(g);
      this.charging = false; this.charge = 0; this.wasFull = false;
    }
  }

  sweptBack(g) { this.x = this.safe.x; this.y = this.safe.y; this.vx = this.vy = 0; this.dashT = 0; this.pounding = false; this.cling = 0; this.inv = 0; this.hurt(g, 1, 0); }

  aimable() { return !!(this.cling || this.hang || this.zip || this.inWater); }
  // How far a level stone carries before it drops, in pixels.
  range() { return lerp(SLING.rangeMin, SLING.rangeMax, this.charge); }

  loose(g) {
    const m = this.muzzle(), sp = this.shotSpeed(), tags = [];
    if (this.charge >= 1) tags.push('full');
    if (this.charge >= 1 && g.has('heavy')) tags.push('heavy');
    if (this.air2 && !this.onGround) tags.push('air2');
    if (this.cling) tags.push('wall');
    if (this.hang || this.zip) tags.push('hang');
    if (this.inWater) tags.push('swim');
    if (this.aimable()) g.stones.push(new Stone(m.x, m.y, Math.cos(this.aim) * sp * this.face + this.vx * 0.35, -Math.sin(this.aim) * sp, this.charge, tags));
    else g.stones.push(new Stone(m.x, m.y, sp * this.face, 0, this.charge, tags, this.range()));
    g.sfx.play('sling', this.charge);
    this.cool = SLING.cooldown; this.throwT = 0.14;
  }

  hurt(g, dmg, dir) {
    if (this.inv > 0 || this.dead || this.dashT > 0 || g.godmode) return false;
    this.hp -= dmg; this.inv = 1.1; this.hurtT = 0.24;
    if (dir) { this.vx = dir * 170; this.vy = -190; this.cut = true; }
    this.charging = false; this.charge = 0; this.wasFull = false; this.cling = 0; this.pounding = false; this.hang = null; this.zip = null;
    g.sfx.play('hurt'); g.shake = 5; g.hitstop = 0.07;
    g.puff(this.cx, this.cy, 8, '#fff3c8', 110, { glow: true, life: 0.3 });
    if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deadT = 0; g.sfx.play('die'); }
    return true;
  }

  draw(ctx, cx, cy, g) {
    if (this.dead && this.deadT > 0.25 && Math.floor(this.deadT * 20) % 2) return;
    if (this.inv > 0 && !this.dead && this.hurtT <= 0 && Math.floor(this.inv * 18) % 2) return;
    const anchor = this.hang || this.zip;
    if (anchor) { ctx.fillStyle = '#9a6c3e'; const n = 10; for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(this.cx + this.face * 2 + (anchor.x - this.cx - this.face * 2) * i / n - cx), Math.round(this.y + (anchor.y + 4 - this.y) * i / n - cy), 1, 1); }
    this.gear = g ? { sword: g.has('sword'), shield: g.has('shield') } : null;
    drawDavid(ctx, this.cx - cx, this.y + this.h - cy, this, this.hurtT > 0.16);
    if (this.dashT > 0) for (let k = 1; k <= 2; k++) { ctx.globalAlpha = 0.3 / k; drawDavid(ctx, this.cx - cx - this.dashDir * k * 9, this.y + this.h - cy, this, true); ctx.globalAlpha = 1; }
  }
}
