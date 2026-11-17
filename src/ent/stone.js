// A sling stone: a small arcing projectile. Charge sets speed, damage, and whether it breaks a guard.
import { overlap } from '../core.js';
import { SLING } from './player.js';

export class Stone {
  constructor(x, y, vx, vy, charge) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.charge = charge;
    this.dmg = charge >= 1 ? 3 : charge >= 0.5 ? 2 : 1;
    this.life = 3; this.dead = false; this.px = x; this.py = y;
  }
  update(g, dt) {
    this.px = this.x; this.py = this.y;
    this.vy += SLING.gravity * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.y > g.room.h * 16 + 40) { this.dead = true; return; }
    if (g.room.solid(Math.floor(this.x / 16), Math.floor(this.y / 16))) {
      this.dead = true; g.sfx.play('stoneHit');
      g.puff(this.px, this.py, 5, '#cfc6d8', 70, { life: 0.25 });
      return;
    }
    const box = { x: this.x - 3, y: this.y - 3, w: 6, h: 6 };
    for (const s of g.soldiers) {
      if (s.state === 'dying' || !overlap(box, s)) continue;
      s.hit(g, this.dmg, Math.sign(this.vx) || 1, this.charge);
      this.dead = true; return;
    }
  }
  draw(ctx, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    ctx.fillStyle = this.charge >= 0.5 ? '#9a94aa' : '#6f6a7c';
    ctx.fillRect(Math.round(this.px - cx), Math.round(this.py - cy), 1, 1);
    ctx.fillStyle = '#0e0a12'; ctx.fillRect(x - 2, y - 1, 4, 2); ctx.fillRect(x - 1, y - 2, 2, 4);
    ctx.fillStyle = this.charge >= 1 ? '#ffffff' : '#e4e4ee'; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}
