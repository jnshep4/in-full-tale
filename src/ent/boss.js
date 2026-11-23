// Philistine captains. One class, driven by a per-captain config (src/data/bosses.js): which
// attacks he knows, how fast he is, and which of David's powers he is weak to.
import { T, approach, overlap, clamp } from '../core.js';
import { moveBody, WATER } from '../world/room.js';
import { drawCaptain, drawCaptainLight, drawGoliath } from '../gfx/chars.js';

// A hostile missile or ground wave. kind: 'javelin' | 'arrow' | 'wave' | 'rock'
export class Shot {
  constructor(kind, x, y, vx, vy, o = {}) {
    this.kind = kind; this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.grav = o.grav ?? (kind === 'wave' ? 0 : 300); this.life = o.life ?? 3; this.dmg = o.dmg ?? 1;
    this.dead = false; this.stuck = 0; this.turned = false; this.owner = o.owner || null; this.t = 0; this.back = o.back || 0;
  }
  box() { return this.kind === 'beam' ? { x: this.x - 12, y: this.y - 3, w: 24, h: 6 } : this.kind === 'wave' ? { x: this.x - 6, y: this.y - 12, w: 12, h: 12 } : { x: this.x - 3, y: this.y - 3, w: 6, h: 6 }; }
  update(g, dt) {
    this.t += dt; this.life -= dt;
    if (this.back) this.vx += this.back * dt;                       // a thrown axe comes back
    if (this.life <= 0) { this.dead = true; return; }
    if (this.stuck > 0) { this.stuck -= dt; if (this.stuck <= 0) this.dead = true; return; }
    this.vy += this.grav * dt; this.x += this.vx * dt; this.y += this.vy * dt;
    const room = g.room, p = g.player;
    if (this.kind === 'wave') {
      if (room.solid(Math.floor((this.x + Math.sign(this.vx) * 6) / T), Math.floor((this.y - 4) / T)) || !room.solid(Math.floor(this.x / T), Math.floor((this.y + 4) / T))) { this.dead = true; return; }
      if (g.frame % 3 === 0) g.parts.push({ x: this.x, y: this.y - 2, vx: (g.rand() - 0.5) * 40, vy: -60 - g.rand() * 60, g: 300, life: 0.3, max: 0.3, col: '#ffd680', size: 1, glow: true });
    } else if (room.solid(Math.floor(this.x / T), Math.floor(this.y / T))) {
      if (this.kind === 'pot') {                         // a fire pot bursts into two running flames
        const fy = Math.floor(this.y / T) * T; this.dead = true; g.sfx.play('slam'); g.puff(this.x, fy, 10, '#ff8650', 120, { glow: true, life: 0.3 });
        for (const d of [-1, 1]) g.shots.push(new Shot('wave', this.x + d * 8, fy, d * 120, 0, { life: 0.8, owner: this.owner }));
        return;
      }
      this.stuck = 0.6; g.sfx.play('stoneHit'); return;
    }
    if (this.turned) {                                   // turned back by the buckler: now it is David's
      if (this.owner && !this.owner.gone && overlap(this.box(), this.owner)) { this.owner.hit(g, 3, Math.sign(this.vx) || 1, { tag: 'reflect', charge: 1 }); this.dead = true; }
      for (const s of g.soldiers) if (s.state !== 'dying' && overlap(this.box(), s)) { s.hit(g, 3, Math.sign(this.vx) || 1, 1); this.dead = true; break; }
      return;
    }
    if (!p.dead && overlap(this.box(), p)) {
      if (g.guards(this)) { this.turned = true; this.vx = -this.vx * 1.2; this.vy = Math.min(this.vy, -60); g.sfx.play('tink'); g.puff(this.x, this.y, 6, '#ffd680', 90, { glow: true, life: 0.2 }); return; }
      if (p.hurt(g, this.dmg, Math.sign(this.vx) || 1) && this.kind !== 'wave') this.dead = true;
    }
  }
  draw(ctx, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    if (this.kind === 'wave') {
      const hgt = 8 + Math.round(Math.sin(this.t * 30) * 2);
      ctx.fillStyle = '#ffd680'; ctx.fillRect(x - 1, y - hgt, 3, hgt); ctx.fillStyle = '#c98b3f'; ctx.fillRect(x - 3, y - hgt + 4, 2, hgt - 4); ctx.fillRect(x + 2, y - hgt + 4, 2, hgt - 4);
      ctx.fillStyle = '#fff3c8'; ctx.fillRect(x, y - hgt - 2, 1, 3);
      return;
    }
    if (this.kind === 'axe') { const c = Math.cos(this.t * 22), s = Math.sin(this.t * 22); ctx.fillStyle = '#6a4a34'; for (let i = -4; i <= 4; i++) ctx.fillRect(Math.round(x + c * i), Math.round(y + s * i), 1, 1); ctx.fillStyle = '#d9dbe6'; ctx.fillRect(Math.round(x + c * 4) - 1, Math.round(y + s * 4) - 1, 3, 3); return; }
    if (this.kind === 'pot') { ctx.fillStyle = '#86522a'; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = '#ff8650'; ctx.fillRect(x - 1, y - 4, 3, 2); ctx.fillStyle = '#ffd680'; ctx.fillRect(x, y - 5, 1, 2); return; }
    const a = Math.atan2(this.vy, this.vx), len = this.kind === 'beam' ? 26 : this.kind === 'javelin' ? 9 : this.kind === 'rock' ? 0 : 6;
    if (this.kind === 'rock') { ctx.fillStyle = '#0e0a12'; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = '#8a7f96'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = '#b9afc4'; ctx.fillRect(x - 2, y - 2, 2, 1); return; }
    for (let i = -len; i <= len; i++) {
      ctx.fillStyle = i > len - 3 ? (this.turned ? '#ffffff' : '#ffd680') : '#6a4a34';
      const th = this.kind === 'beam' ? 2 : 1;
      ctx.fillRect(Math.round(x + Math.cos(a) * i * 0.5), Math.round(y + Math.sin(a) * i * 0.5), th, th);
    }
  }
}

export class Boss {
  constructor(cfg, sp, regionId) {
    this.cfg = cfg; this.look = cfg.look; this.regionId = regionId; this.name = cfg.name;
    this.w = cfg.w || 16; this.h = cfg.h || 34;
    this.home = { x: sp.cx * T + 8 - this.w / 2, y: (sp.cy + 1) * T - this.h };
    this.x = this.home.x; this.y = this.home.y; this.vx = 0; this.vy = 0; this.face = -1;
    this.maxHp = cfg.hp; this.hp = cfg.hp;
    this.state = 'intro'; this.t = 1.4; this.attack = null; this.cool = 1; this.n = 0; this.last = null;
    this.flash = 0; this.walk = 0; this.moving = false; this.onGround = true; this.gone = false; this.struck = false; this.weakT = 0;
    this.roared = false; this.marked = false; this.stunCool = 0;
    this.drop = 1;                  // captains are too heavy for planks: they fall through them
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get phase() { return this.hp <= this.maxHp / 2 ? 2 : 1; }
  speed() { return (this.cfg.speed || 1) * (this.phase === 2 ? 1.25 : 1); }

  // Is there ground to walk on just ahead? Captains do not wade into cisterns or step off ledges.
  floorAhead(room, dir) {
    const fx = dir > 0 ? this.x + this.w + 4 : this.x - 4;
    return room.solid(Math.floor(fx / T), Math.floor((this.y + this.h + 3) / T)) && room.tileAt(fx, this.y + this.h - 3) !== WATER;
  }

  choose(g, adx) {
    const ok = (a) => (!a.phase || a.phase <= this.phase) && !(a.id === 'summon' && g.soldiers.filter((s) => s.summoned && s.state !== 'dying').length >= (a.limit || 2));
    const list = this.cfg.attacks.filter((a) => ok(a) && (a.min || 0) <= adx && adx <= (a.max || 999) && a.id !== this.last);
    let pool = list.length ? list : this.cfg.attacks.filter(ok);
    // David overhead and out of reach: use what can reach him.
    const p = g.player;
    if (this.y - (p.y + p.h) > 20) { const up = this.cfg.attacks.filter((a) => ok(a) && ['volley', 'rain', 'leap', 'summon', 'stomp', 'fan', 'rockfall', 'pots'].includes(a.id) && a.id !== this.last); if (up.length) pool = up; }
    let tot = 0; for (const a of pool) tot += a.w || 1;
    let r = g.rand() * tot;
    for (const a of pool) { r -= a.w || 1; if (r <= 0) return a; }
    return pool[0];
  }

  update(g, dt) {
    const p = g.player, room = g.room, sp = this.speed();
    if (this.flash > 0) this.flash -= dt;
    if (this.weakT > 0) this.weakT -= dt;
    if (this.stunCool > 0) this.stunCool -= dt;
    if (this.shakeCool > 0) this.shakeCool -= dt;
    if (this.state === 'dying') {
      this.t += dt; this.vx = 0;
      for (let i = 0; i < 2; i++) g.parts.push({ x: this.cx + (g.rand() - 0.5) * 18, y: this.y + g.rand() * this.h, vx: (g.rand() - 0.5) * 30, vy: -30 - g.rand() * 70, g: -40, life: 0.9, max: 0.9, col: g.rand() < 0.3 ? '#ffffff' : '#ffe9b8', size: g.rand() < 0.3 ? 2 : 1, glow: true });
      if (this.t > 1.8) { this.gone = true; g.onBossFell(this); }
      return;
    }
    if (!this.raged && this.phase === 2) { this.raged = true; g.sfx.play('roar'); g.shake = Math.max(g.shake, 6); g.banner2('HE RAGES', 1.2); g.puff(this.cx, this.cy, 14, '#ff8650', 150, { glow: true, life: 0.35 }); }
    const dx = p.cx - this.cx, adx = Math.abs(dx);
    const A = this.attack;
    switch (this.state) {
      case 'intro':
        this.vx = 0; this.face = Math.sign(dx) || -1; this.t -= dt;
        if (!this.roared && this.t < 0.9) { this.roared = true; g.sfx.play('roar'); g.shake = 4; }
        if (this.t <= 0) { this.state = 'idle'; this.cool = 0.6; }
        break;
      case 'idle':
        if (adx > 4) this.face = Math.sign(dx);
        this.vx = adx > (this.cfg.keep || 60) ? this.face * 42 * sp : 0;
        // David out of reach overhead (on a wall, a ring, a high plank): stand off rather than wait beneath him.
        if (this.y - (p.y + p.h) > 20 && !this.cfg.giant) this.vx = adx < 96 ? -this.face * 50 * sp : adx > 124 ? this.face * 42 * sp : 0;
        this.cool -= dt;
        if (this.cool <= 0 && !p.dead) { this.attack = this.choose(g, adx); this.last = this.attack.id; this.state = 'tele'; this.t = (this.attack.tele || 0.5) / sp; this.vx = 0; this.n = 0; g.sfx.play('windup'); }
        break;
      case 'tele':
        this.vx = 0; this.t -= dt;
        if (adx > 4 && A.id !== 'charge') this.face = Math.sign(dx);
        if (this.t <= 0) this.begin(g, p, dx);
        break;
      case 'act': this.act(g, p, dt, dx); break;
      case 'recover':
        this.vx = approach(this.vx, 0, 600 * dt); this.t -= dt;
        if (this.t <= 0) { this.state = 'idle'; this.cool = (this.cfg.gap || 0.9) / sp * (0.7 + g.rand() * 0.6); }
        break;
      case 'stagger':
        this.vx = approach(this.vx, 0, 400 * dt); this.t -= dt;
        if (this.t <= 0) { this.state = 'idle'; this.cool = 0.35; }
        break;
    }
    if (this.onGround && this.vx !== 0 && !this.floorAhead(room, Math.sign(this.vx))) {
      if (this.state === 'act' && A && A.id === 'charge') { this.state = 'recover'; this.t = 0.9; this.weakT = 0.9; }
      this.vx = 0;
    }
    this.vy = Math.min(this.vy + 1200 * dt, 460);
    const vy0 = this.vy;
    moveBody(room, this, dt, g.res);
    const hitWall = g.res.hx;
    if (g.res.hx) this.vx = 0;
    if (g.res.hy) this.vy = 0;
    const landed = g.res.hy === 1 && !this.onGround && vy0 > 200;
    this.onGround = g.res.hy === 1;
    if (this.state === 'act' && A.id === 'leap' && (landed || (this.onGround && this.t < 2.8))) this.land(g);
    if (this.state === 'act' && A.id === 'charge' && hitWall) { g.shake = 7; g.sfx.play('slam'); this.state = 'recover'; this.t = 1.3; this.weakT = 1.3; g.puff(this.cx + this.face * 8, this.cy, 10, '#b9a685', 120); }
    this.moving = Math.abs(this.vx) > 8 && this.onGround && this.state === 'idle';
    if (this.moving) this.walk += dt * 9 * sp;
    // Walking into a captain hurts, except while he is down.
    if (this.state !== 'stagger' && this.state !== 'recover' && this.state !== 'intro' && !p.dead && overlap(this, p)) p.hurt(g, 1, Math.sign(p.cx - this.cx) || 1);
  }

  begin(g, p, dx) {
    const A = this.attack, sp = this.speed();
    this.state = 'act'; this.struck = false;
    switch (A.id) {
      case 'thrust': this.t = 0.34; this.vx = this.face * (A.v || 270); g.sfx.play('thrust'); break;
      case 'sweep': this.t = 0.3; this.vx = this.face * 90; g.sfx.play('swing'); break;
      case 'charge': this.t = 2.2; this.vx = this.face * (A.v || 250) * sp; g.sfx.play('roar'); break;
      case 'leap': {
        this.t = 3; let reach = clamp(dx, -190, 190);
        while (Math.abs(reach) > 16 && !g.room.solid(Math.floor((this.cx + reach) / T), Math.floor((this.y + this.h + 3) / T))) reach -= Math.sign(reach) * 16;   // never into the water
        const jv = Math.max(A.vy || 400, Math.min(450, Math.sqrt(2400 * Math.max(0, this.y + this.h - p.y - this.h + 24))));     // high enough to reach him
        this.vy = -jv; this.vx = reach / (2 * jv / 1200); this.onGround = false; g.sfx.play('jump'); break;
      }
      case 'volley': this.t = 0.2; this.n = A.n || 3; break;
      case 'stomp': this.t = 0.25; g.shake = 9; g.sfx.play('slam'); g.puff(this.cx + this.face * 10, this.y + this.h, 16, '#b9a685', 150);
        for (const d of [-1, 1]) g.shots.push(new Shot('wave', this.cx + d * 14, this.y + this.h, d * 170, 0, { life: 1.1, owner: this })); break;
      case 'summon': this.t = 0.5; g.summon(this, A.n || 2, A.kind || 'spear'); g.sfx.play('roar'); break;
      case 'rain': this.t = 0.3; this.n = A.n || 5; break;
      // ---- one attack of his own for each captain
      case 'advance': this.t = 1.6; g.sfx.play('tink'); break;                       // Shalmek: walks in behind his shield, then thrusts
      case 'axe': this.t = 0.3; g.sfx.play('throw');                                 // Ittur: the axe flies out and comes back
        g.shots.push(new Shot('axe', this.cx + this.face * 10, this.y + 14, this.face * 270, 0, { grav: 0, life: 2, owner: this, back: -this.face * 300 })); break;
      case 'fan': {                                                                  // Pashdu: three javelins, falling one after another
        this.t = 0.3; g.sfx.play('throw'); const ox = this.cx + this.face * 8, oy = this.y + 6;
        [0.5, 0.8, 1.15].forEach((fl, i) => { const tx = p.cx + (i - 1) * 36; g.shots.push(new Shot('javelin', ox, oy, (tx - ox) / fl, (p.cy - oy) / fl - 150 * fl, { owner: this })); }); break;
      }
      case 'rockfall': {                                                             // Maroz, Goliath: the blow brings stones down
        this.t = 0.5; g.shake = 9; g.sfx.play('slam'); g.puff(this.cx + this.face * 10, this.y + this.h, 14, '#b9a685', 140); const n = A.n || 4;
        for (let i = 0; i < n; i++) g.shots.push(new Shot('rock', clamp(p.cx + (i - Math.floor(n / 2)) * 40 + (g.rand() - 0.5) * 12, 24, g.room.w * T - 24), g.cam.y - 10 - i * 36, 0, 30, { grav: 240, life: 4, owner: this })); break;
      }
      case 'whirl': this.t = 1.3; g.sfx.play('swing'); break;                        // Akhtal: spins the axe and comes on
      case 'pots': this.t = 0.2; this.n = A.n || 3; break;                           // Zeruk: fire pots that burst along the ground
      case 'tide': this.t = 0.6; g.shake = 7; g.sfx.play('slam');                    // Banith: a wave runs in from each wall
        for (const d of [-1, 1]) g.shots.push(new Shot('wave', d > 0 ? 26 : g.room.w * T - 26, this.y + this.h, d * 150, 0, { life: 7, owner: this })); break;
      case 'bolts': this.t = 0.1; this.n = 2; this.flip = g.rand() < 0.5; break;     // Yishvar: two bolts, one low, one high
      case 'step': {                                                                 // Orphaz: gone in the dust, and behind him
        this.t = 0.45; const tx = clamp(p.cx - p.face * 44 - this.w / 2, 24, g.room.w * T - 24 - this.w);
        if (g.room.solid(Math.floor((tx + this.w / 2) / T), Math.floor((this.y + this.h + 3) / T))) { g.puff(this.cx, this.cy, 14, '#3a3440', 120); this.x = tx; g.puff(this.cx, this.cy, 14, '#3a3440', 120); }
        this.face = Math.sign(p.cx - this.cx) || this.face; g.sfx.play('swing'); break;
      }
      default: this.t = 0.3;
    }
  }

  act(g, p, dt, dx) {
    const A = this.attack;
    this.t -= dt;
    switch (A.id) {
      case 'thrust': {
        this.vx = approach(this.vx, 0, 500 * dt);
        const tip = { x: this.face > 0 ? this.x + this.w : this.x - 30, y: this.y + 8, w: 30, h: 10 };
        if (!this.struck && overlap(tip, p)) this.struck = p.hurt(g, A.dmg || 1, this.face) || this.struck;
        break;
      }
      case 'sweep': {
        this.vx = approach(this.vx, 0, 300 * dt);
        const rch = A.reach || 30, arc = { x: this.face > 0 ? this.x + this.w - 4 : this.x - rch, y: this.y + (this.cfg.giant ? 18 : -6), w: rch + 4, h: this.h + 6 - (this.cfg.giant ? 18 : 0) };
        if (!this.struck && this.t < 0.22 && overlap(arc, p)) this.struck = p.hurt(g, A.dmg || 1, this.face) || this.struck;
        break;
      }
      case 'charge':
        this.vx = this.face * (A.v || 250) * this.speed();
        if (g.frame % 4 === 0) g.puff(this.cx - this.face * 8, this.y + this.h, 2, '#b9a685', 40);
        if (overlap(this, p)) p.hurt(g, A.dmg || 1, this.face);
        break;
      case 'leap': if (!this.onGround && overlap(this, p)) p.hurt(g, 1, Math.sign(p.cx - this.cx) || 1); break;
      case 'advance': {
        this.vx = this.t > 0.3 ? this.face * 62 * this.speed() : approach(this.vx, 0, 500 * dt);
        if (this.t <= 0.3 && !this.lunged) { this.lunged = true; this.vx = this.face * 260; g.sfx.play('thrust'); }
        const tip = { x: this.face > 0 ? this.x + this.w : this.x - 30, y: this.y + 8, w: 30, h: 10 };
        if (this.t <= 0.3 && !this.struck && overlap(tip, p)) this.struck = p.hurt(g, 1, this.face) || this.struck;
        if (this.t <= 0) this.lunged = false;
        break;
      }
      case 'whirl': {
        if (Math.abs(dx) > 24) this.face = Math.sign(dx);
        this.vx = this.face * 118 * this.speed();
        if (g.frame % 3 === 0) g.puff(this.cx + Math.cos(this.t * 20) * 20, this.y + 14, 1, '#d9dbe6', 30, { glow: true, life: 0.15 });
        if (overlap({ x: this.x - 20, y: this.y + 4, w: this.w + 40, h: this.h - 4 }, p)) p.hurt(g, 1, Math.sign(p.cx - this.cx) || 1);
        break;
      }
      case 'step': {
        const arc = { x: this.face > 0 ? this.x + this.w - 4 : this.x - 30, y: this.y - 6, w: 34, h: this.h + 6 };
        if (!this.struck && this.t < 0.2 && overlap(arc, p)) this.struck = p.hurt(g, 1, this.face) || this.struck;
        break;
      }
      case 'bolts':
        this.vx = 0;
        if (this.t <= 0 && this.n > 0) {
          this.n--; this.t = this.n > 0 ? 0.5 : 0.15; const low = (this.n === 1) === this.flip;
          g.shots.push(new Shot('beam', this.cx + this.face * 16, this.y + this.h - (low ? 7 : 36), this.face * 250, 0, { grav: 0, owner: this })); g.sfx.play('throw');
        }
        break;
      case 'pots':
      case 'volley':
        this.vx = 0;
        if (this.t <= 0 && this.n > 0) {
          this.n--; this.t = this.n > 0 ? (A.every || 0.28) / this.speed() : 0;
          if (A.shot === 'beam') {                       // Goliath's spear, like a weaver's beam: flat and fast
            g.shots.push(new Shot('beam', this.cx + this.face * 16, this.y + 26, this.face * 300, -20, { grav: 60, dmg: 2, owner: this })); g.sfx.play('throw'); this.t = 0.2; break;
          }
          const pot = A.id === 'pots', ox = this.cx + this.face * 8, oy = this.y + 6, tx = p.cx + (g.rand() - 0.5) * (pot ? 130 : 30), flight = clamp(Math.abs(tx - ox) / 230, 0.45, 1.1);
          g.shots.push(new Shot(pot ? 'pot' : A.shot || 'javelin', ox, oy, (tx - ox) / flight, (p.cy - oy) / flight - 150 * flight, { owner: this }));
          g.sfx.play('throw');
          if (this.n === 0) this.t = 0.15;
        }
        break;
      case 'rain':
        this.vx = 0;
        if (this.t <= 0 && this.n > 0) {
          this.n--; this.t = 0.16;
          const tx = clamp(p.cx + (g.rand() - 0.5) * 150, 40, g.room.w * T - 40);
          g.shots.push(new Shot('arrow', tx - 40, g.cam.y - 10, 60, 190, { grav: 120, owner: this }));
          g.sfx.play('throw');
        }
        break;
    }
    if (this.t <= 0 && A.id !== 'leap' && !(this.n > 0)) { this.state = 'recover'; this.t = A.rest ?? 0.8; this.weakT = this.t; }
  }

  land(g) {
    g.shake = 8; g.hitstop = 0.05; g.sfx.play('slam'); this.vx = 0;
    g.puff(this.cx, this.y + this.h, 14, '#b9a685', 130);
    for (const d of [-1, 1]) g.shots.push(new Shot('wave', this.cx + d * 10, this.y + this.h, d * 150, 0, { life: 0.75, owner: this }));
    this.state = 'recover'; this.t = this.attack.rest ?? 0.9; this.weakT = this.t;
    // The ground jumps: anyone clinging to a wall nearby loses his hold.
    const p = g.player;
    if (p.cling && Math.abs(p.cx - this.cx) < 150 && !(this.shakeCool > 0)) { this.shakeCool = 7; p.cling = 0; p.wallT = 0.45; p.charging = false; p.charge = 0; g.banner2('THE WALL SHAKES HIM LOOSE', 1.2); }
  }

  // info: { charge, tag } — tag names the power behind the blow ('full', 'dash', 'air2', 'wall', 'sword', ...)
  hit(g, dmg, dir, info = {}) {
    if (this.state === 'dying' || this.state === 'intro') return false;
    const charge = typeof info === 'number' ? info : (info.charge ?? 1), tags = (info && info.tags) || (info && info.tag ? [info.tag] : []);
    if (tags.includes('dash') && this.cfg.weak !== 'dash') return false;          // a dash only tells against Ittur
    if (this.cfg.giant) {
      // Goliath: bronze from the neck down. Lion's Fall drops him to one knee; a stone to the brow wounds him.
      if (tags.includes('pound')) {
        if (this.state !== 'stagger' && this.stunCool <= 0) { this.state = 'stagger'; this.t = 2.4; this.stunCool = 7; this.vx = 0; g.banner2('HE IS DOWN: THE BROW', 1.4); g.sfx.play('slam'); }
        return true;
      }
      const down = this.state === 'stagger', brow = down || (info.y !== undefined && info.y < this.y + 15);
      if (!brow || tags.includes('sword')) { g.sfx.play('tink'); g.puff(this.cx + Math.sign(-dir) * 8, info.y !== undefined ? info.y : this.cy, 5, '#ffd680', 90, { glow: true, life: 0.2 }); return false; }
      if (down) dmg *= 2;
      this.hp -= dmg; this.flash = 0.1; g.hitstop = Math.max(g.hitstop, 0.08); g.shake = Math.max(g.shake, 5); g.sfx.play('hit');
      g.puff(this.cx, this.y + 8, 8 + dmg, '#ffffff', 150, { glow: true, life: 0.25 });
      if (this.hp <= 0) { this.hp = 0; this.state = 'dying'; this.t = 0; this.vx = 0; g.sfx.play('bossfall'); g.hitstop = 0.3; g.shake = 12; g.onBossDying(this); }
      return true;
    }
    const weak = tags.includes(this.cfg.weak);
    const open = this.state === 'recover' || this.state === 'stagger' || (this.state === 'act' && !['charge', 'whirl', 'advance'].includes(this.attack.id));
    if (this.state === 'act' && this.attack.id === 'advance' && dir === -this.face && !weak) { g.sfx.play('tink'); g.puff(this.cx + this.face * 9, this.y + 14, 5, '#ffd680', 90, { glow: true, life: 0.2 }); return false; }
    if (this.cfg.guard && !weak && !open && dir === -this.face && charge < (this.cfg.guard === 2 ? 1 : 0.5)) {
      g.sfx.play('tink'); g.puff(this.cx + this.face * 9, this.y + 14, 5, '#ffd680', 90, { glow: true, life: 0.2 });
      return false;
    }
    if (weak) dmg *= 2;
    this.hp -= dmg; this.flash = 0.1;
    g.hitstop = Math.max(g.hitstop, weak ? 0.1 : 0.05); g.shake = Math.max(g.shake, weak ? 6 : 3);
    g.puff(this.cx, this.y + 12, 6 + dmg, weak ? '#ffffff' : '#fff3c8', 140, { glow: true, life: 0.25 });
    g.sfx.play('hit');
    if (weak) g.banner2('A TELLING BLOW', 0.9);
    if (this.hp <= 0) { this.hp = 0; this.state = 'dying'; this.t = 0; this.vx = 0; g.sfx.play('bossfall'); g.hitstop = 0.25; g.shake = 10; g.onBossDying(this); return true; }
    // A telling blow staggers him, but not again until he has found his feet.
    if (weak && this.stunCool <= 0 && (this.state === 'idle' || this.state === 'tele' || this.state === 'recover')) { this.state = 'stagger'; this.t = 0.7; this.vx = dir * 60; this.stunCool = this.cfg.stun || 4; }
    return true;
  }

  draw(ctx, cx, cy) { if (this.state !== 'dying') (this.cfg.giant ? drawGoliath : drawCaptain)(ctx, this.cx - cx, this.y + this.h - cy, this, this.flash > 0); }
  drawGlow(ctx, cx, cy) {
    if (this.state !== 'dying') return;
    const k = Math.min(1, this.t / 1.8);
    if (this.cfg.giant) drawGoliath(ctx, this.cx - cx, this.y + this.h - cy, this, false, [1 - 0.6 * k * k, 1 - k]);
    else drawCaptainLight(ctx, this.cx - cx, this.y + this.h - cy, this, 1 - 0.6 * k * k, 1 - k);
  }
}
