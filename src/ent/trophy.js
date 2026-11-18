// The trophy: a pale curled ring. Bursts out of a fallen marked soldier, bounces, then rests and
// blinks until David collects it. It never expires. If it lands somewhere it could be lost (stakes,
// a pit) it hops back to where its soldier was posted, which the reachability test covers.
import { T, overlap } from '../core.js';
import { moveBody, touches, SPIKE, WATER } from '../world/room.js';
import { drawRing } from '../gfx/chars.js';

export class Trophy {
  constructor(id, x, y, home, burst, rand) {
    this.id = id; this.w = 6; this.h = 6;
    this.x = x - 3; this.y = y - 3; this.home = home;
    this.vx = burst ? burst.vx : 0; this.vy = burst ? burst.vy : 0;
    this.rest = !burst; this.age = burst ? 0 : 1; this.spin = 0; this.seed = rand() * 10; this.taken = false;
  }
  get cx() { return this.x + 3; }
  get cy() { return this.y + 3; }
  update(g, dt) {
    const p = g.player;
    this.age += dt;
    const dx = p.cx - this.cx, dy = p.cy - this.cy, dist = Math.hypot(dx, dy);
    const ready = this.age > 0.4 && !p.dead;
    if (ready && dist < 30) {                      // drawn to David when he is close
      this.rest = false;
      this.vx += (dx / (dist || 1)) * 900 * dt; this.vy += (dy / (dist || 1)) * 900 * dt - 700 * dt;
    }
    if (!this.rest) {
      this.vy = Math.min(this.vy + 700 * dt, 420);
      const vy0 = this.vy;
      moveBody(g.room, this, dt, g.res);
      if (g.res.hx) this.vx = -this.vx * 0.6;
      if (g.res.hy === -1) this.vy = 0;
      if (g.res.hy === 1) {
        if (vy0 > 70) { this.vy = -vy0 * 0.58; this.vx *= 0.82; g.sfx.play('bounce', Math.min(1, vy0 / 300)); }
        else { this.vy = 0; this.vx = 0; this.rest = true; }
      }
      this.spin += dt * (4 + Math.abs(this.vx) * 0.08);
    }
    // Lost places: stakes, pits, deep water David cannot yet enter. From them the ring hops back to the post.
    // A ring that has dropped to lower ground stays there to be picked up. Only one that has bounced up
    // onto something well above where its soldier stood is brought back.
    const strayed = this.rest && this.cy < this.home.y - 40;
    if (this.age > 0.3 && (strayed || touches(g.room, this, SPIKE) || (touches(g.room, this, WATER) && !g.has('swim')) || this.y > g.room.h * T + 30)) {
      g.puff(this.cx, this.cy, 6, '#fff3c8', 60, { glow: true, life: 0.3 });
      this.x = this.home.x - 3; this.y = this.home.y - 3; this.vx = 0; this.vy = -150; this.rest = false;
      g.puff(this.cx, this.cy, 6, '#fff3c8', 60, { glow: true, life: 0.3 });
    }
    if (ready && overlap({ x: this.x - 4, y: this.y - 4, w: 14, h: 14 }, p)) g.collect(this);
  }
  blink(t) { return Math.sin(t * 5 + this.seed) > 0.86; }
  draw(ctx, cx, cy, t) {
    const bob = this.rest ? Math.round(Math.sin(t * 3 + this.seed) * 1.2) - 2 : 0;
    drawRing(ctx, this.cx - cx, this.cy - cy + bob, this.rest ? 0 : Math.floor(this.spin), this.blink(t));
  }
}
