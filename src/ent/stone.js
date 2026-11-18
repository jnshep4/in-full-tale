// A sling stone: a small arcing projectile. Charge sets speed, damage, and whether it breaks a guard.
import { overlap } from '../core.js';
import { SLING } from './player.js';

export class Stone {
  // range: for a level shot from the ground, how far it flies flat before it drops. Omitted for an aimed arc.
  constructor(x, y, vx, vy, charge, tags = [], range = 0) {
    this.tags = tags; this.range = range;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.charge = charge;
    this.dmg = tags.includes('heavy') ? 5 : charge >= 1 ? 3 : charge >= 0.5 ? 2 : 1;
    this.life = 3; this.dead = false; this.px = x; this.py = y;
  }
  update(g, dt) {
    this.px = this.x; this.py = this.y;
    if (this.range > 0) { this.range -= Math.abs(this.vx) * dt; if (this.range <= 0) { this.range = -1; this.vx *= 0.45; } }
    else this.vy += (this.range < 0 ? SLING.drop : SLING.gravity) * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.y > g.room.h * 16 + 40) { this.dead = true; return; }
    if (this.tags.includes('heavy') && g.room.tile(Math.floor(this.x / 16), Math.floor(this.y / 16)) === 8) g.breakGate(Math.floor(this.x / 16), Math.floor(this.y / 16));   // Smooth Stone shatters a bound door
    if (g.room.solid(Math.floor(this.x / 16), Math.floor(this.y / 16))) {
      this.dead = true; g.sfx.play('stoneHit');
      g.puff(this.px, this.py, 5, '#cfc6d8', 70, { life: 0.25 });
      return;
    }
    const box = { x: this.x - 3, y: this.y - 3, w: 6, h: 6 };
    if (g.boss && g.boss.state !== 'dying' && overlap(box, g.boss)) {
      g.boss.hit(g, this.dmg, Math.sign(this.vx) || 1, { charge: this.charge, tags: this.tags, y: this.y });
      this.dead = true; return;
    }
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
    if (this.tags.includes('heavy')) { ctx.fillStyle = '#0e0a12'; ctx.fillRect(x - 3, y - 2, 6, 4); ctx.fillRect(x - 2, y - 3, 4, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#9fc2ff'; ctx.fillRect(x - 2, y + 1, 4, 1); }
  }
}
