// The play state: owns the room, entities, camera, lighting, and HUD.
import { W, H, T, TALLY_GOAL, clamp, rng } from './core.js';
import { Input } from './input.js';
import { Sfx } from './audio.js';
import { loadSave, writeSave, freshSave, clearSave, loadSettings, writeSettings, hasSave } from './save.js';
import { REGIONS, regionById } from './data/regions.js';
import { parseRoom, moveBody, AIR, REED, WATER, RING, GATE_POWER } from './world/room.js';
import { parseTo } from './world/build.js';
import { BOSSES } from './data/bosses.js';
import { POWERS } from './data/powers.js';
import { ENDING_B_VERSE, VERSION_TAG, INTRO_VERSES } from './data/verses.js';
import { Boss } from './ent/boss.js';
import { UI } from './ui.js';
import { drawGate, drawWater, drawDoor, drawProp, drawRelic } from './gfx/props.js';
import { renderRoom } from './gfx/tiles.js';
import { makeBackdrop, drawBackdrop } from './gfx/bg.js';
import { drawRing, drawTorchPost, drawFlame, drawFig, drawPip, drawIsraelite } from './gfx/chars.js';
import { drawText, textWidth } from './font.js';
import { Player, SLING } from './ent/player.js';
import { Soldier } from './ent/soldier.js';
import { Trophy } from './ent/trophy.js';

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }

export class Game {
  constructor(canvas, { storage = null, seed = 20261117, ui = null, at = null, title = false, demo = 0, touch = false } = {}) {
    this.demo = demo; this.touch = touch; this.slow = 0;
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    [this.world, this.wctx] = mk(W, H);       // tiles and bodies, before lighting
    [this.lightC, this.lctx] = mk(W, H);      // light map
    [this.litC, this.litctx] = mk(W, H);      // light map masked to the world's pixels
    this.vignette = this.makeVignette();
    this.input = new Input(); this.sfx = new Sfx();
    this.input.onAny = () => this.sfx.unlock();
    this.storage = storage; this.hadSave = hasSave(storage); this.save = loadSave(storage);
    this.settings = loadSettings(storage); this.sfx.setVolume(this.settings.sound); this.sfx.setMusicVolume(this.settings.music);
    this.rand = rng(seed);
    this.time = 0; this.frame = 0; this.hitstop = 0; this.shake = 0; this.cam = { x: 0, y: 0 };
    this.res = { hx: 0, hy: 0 };
    this.backdrops = {}; this.banner = { text: '', t: 0 }; this.tallyPulse = 0; this.fade = 0;
    this.paused = false; this.modal = false; this.onDebug = null; this.godmode = false;
    this.note = { text: '', t: 0 }; this.timers = []; this.shots = []; this.boss = null; this.relic = null; this.nearDoor = null;
    this.ui = new UI(ui || document.createElement('div'), this);
    if (at) { const [r, m] = at.split('/'); this.save.at = { region: +r, room: m || null, link: null }; }
    this.loadRoom(this.save.at.region || 0, this.save.at.room, this.save.at.link);
    if (title) this.title();
  }

  // ------------------------------------------------------------ menus
  // Marked soldiers per region, for the tally sheet in the pause menu.
  tracker() {
    if (!this.markedIds) {
      this.markedIds = {};
      for (const r of REGIONS) if (r.id > 0) this.markedIds[r.id] = r.rooms.flatMap((d) => parseRoom(d, r.id).spawns.filter((sp) => sp.type === 'marked').map((sp) => sp.id));
    }
    return REGIONS.filter((r) => r.id > 0).map((r) => ({ id: r.id, name: r.name, got: this.markedIds[r.id].filter((id) => this.save.soldiers[id] === 'c').length, of: this.markedIds[r.id].length, captain: this.flag('boss' + r.id) }));
  }
  title() {
    this.fade = 0; this.banner.t = 0;                      // the camp shows behind the title
    const cont = this.hadSave && (this.save.played > 1 || this.save.tally > 0);
    const buttons = cont ? [{ label: 'Continue', value: 'go' }, { label: 'New game', value: 'new' }, { label: 'Settings', value: 'set' }] : [{ label: 'Begin', value: 'go' }, { label: 'Settings', value: 'set' }];
    this.ui.show({ kind: 'title', buttons, sound: 'select', quick: true,
      html: `<h1>In Full Tale</h1><div class="orn"></div><p class="say">David, a sling, and the price King Saul has set.</p>${this.demo ? '<p class="kicker">Demo</p>' : ''}<p class="how">${this.touch ? 'Left thumb moves David: push up at a gateway to go in. JUMP jumps. Hold SLING and let go to loose a stone: it flies level and not far, so close in and jump to reach. The II button opens the tally sheet, map and settings.' : `Arrows or WASD to move. Z or Space to jump. Hold X to whirl the sling, release to loose: it flies level and not far, so close in and jump to reach. Up at a gateway to enter. Esc for the tally sheet and settings.`}</p>`,
      onClose: (v) => {
        if (v === 'go') this.intro();
        if (v === 'set') this.settingsMenu(() => this.title());
        else if (v === 'new') this.ui.show({ kind: 'title', quick: true, sound: 'select', html: '<h2>Begin again?</h2><p class="say">The saved tale will be erased.</p>', buttons: [{ label: 'Back', value: 'back' }, { label: 'Erase and begin', value: 'erase' }], onClose: (w) => { if (w === 'erase') { this.resetSave(); this.hadSave = false; this.intro(); } else this.title(); } });
      } });
  }
  // A new game opens on the text itself: Michal, David's answer, and the price Saul names.
  intro() {
    if (this.flag('intro')) return;
    const fresh = this.save.played < 2 && this.save.tally === 0 && !this.save.powers.length;      // not for a game already under way
    this.save.flags.intro = 1; this.persist();
    if (!fresh) return;
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    this.ui.scene('intro', INTRO_VERSES.map((v) => ({ text: [], html: `<div class="orn"></div><p class="verse-text small">${esc(v.text)}</p><p class="verse-ref"><span class="ref">${v.ref}</span> <span class="tag">${VERSION_TAG}</span></p>` })),
      [{ label: 'Begin', value: 'ok' }], () => this.banner2(this.touch ? 'GO RIGHT TO THE FIRST GATEWAY AND PUSH UP' : 'GO RIGHT TO THE FIRST GATEWAY AND PRESS UP', 6));
  }
  // Until the Valley of Elah has been entered once, an arrow shows the way to its gateway.
  drawGuide(ctx, cx, cy) {
    if (this.region.id !== 0 || this.save.seen['1/outskirts']) return;
    const l = this.room.link('d1'); if (!l) return;
    const gx = l.cx * T + 8 - cx, gy = (l.cy + 1) * T - cy - 74, bob = Math.round(Math.sin(this.time * 5) * 3), col = Math.sin(this.time * 5) > 0 ? '#ffffff' : '#ffd680';
    ctx.fillStyle = '#0e0a12';
    if (gx > W - 14) {                                           // the gateway is off to the right: point that way
      const x = W - 26 + bob, y = 150;
      for (let i = 0; i < 9; i++) ctx.fillRect(x + 8 + i - 1, y - (8 - i) - 1, 3, (8 - i) * 2 + 3);
      ctx.fillRect(x - 9, y - 4, 18, 9);
      ctx.fillStyle = col; for (let i = 0; i < 8; i++) ctx.fillRect(x + 8 + i, y - (7 - i), 1, (7 - i) * 2 + 1);
      ctx.fillRect(x - 8, y - 3, 16, 7);
      drawText(ctx, 'THIS WAY', x - 30, y + 14, col, 1);
    } else if (gx > -14) {                                       // over the gateway: point down at it
      const x = Math.round(gx), y = gy + bob;
      for (let i = 0; i < 9; i++) ctx.fillRect(x - (8 - i) - 1, y + 8 + i - 1, (8 - i) * 2 + 3, 3);
      ctx.fillRect(x - 4, y - 9, 9, 18);
      ctx.fillStyle = col; for (let i = 0; i < 8; i++) ctx.fillRect(x - (7 - i), y + 8 + i, (7 - i) * 2 + 1, 1);
      ctx.fillRect(x - 3, y - 8, 7, 16);
      const s2 = this.note.t > 0 || this.nearDoor ? '' : 'START HERE'; drawText(ctx, s2, x - Math.floor(textWidth(s2) / 2), y - 18, col, 1);
    }
  }
  pauseMenu() {
    const rows = this.tracker().map((r) => `<tr><td>${r.id}. ${r.name}</td><td>${r.got} / ${r.of}</td><td>${r.captain ? 'captain fallen' : ''}</td></tr>`).join('');
    const powers = '<div class="hows">' + POWERS.filter((q) => this.has(q.id)).map((q) => `<p class="how"><b>${q.name}.</b> ${q.how}</p>`).join('') + '</div>';
    this.ui.show({ kind: 'pause', quick: true, sound: 'select', esc: 'resume', buttons: [{ label: 'Resume', value: 'resume' }, { label: 'Map', value: 'map' }, { label: 'Settings', value: 'set' }, { label: 'Title', value: 'title' }],
      html: `<h2>The Tally: ${this.save.tally} of ${TALLY_GOAL}</h2><table class="sheet">${rows}</table>${powers}`,
      onClose: (v) => { if (v === 'set') this.settingsMenu(() => this.pauseMenu()); else if (v === 'title') this.title(); else if (v === 'map') this.mapCard(this.region.id > 0 ? this.region.id : 1); } });
  }
  // The map: one region at a time, its rooms side by side in the order they are walked. Rooms not
  // yet entered are blank. Soldiers still carrying a ring show as red marks, gates in the colour of
  // their power (dim until it is held), doors in green, David in white.
  mapCard(rid) {
    const region = regionById(rid), GATE = { 4: '#c9a75a', 5: '#8a7f96', 6: '#5f9a3a', 7: '#ffd680', 8: '#c98b3f', 9: '#3c78c8', 10: '#ffe890' };
    const rooms = region.rooms.map((d) => parseRoom(d, rid)), gap = 6, W0 = rooms.reduce((a, r) => a + r.w + gap, gap);
    // Leave out the empty sky above the highest thing in each room, and most of the rock under the lowest floor.
    for (const r of rooms) {
      r.top = r.h; r.bot = 0;
      for (let y = 0; y < r.h; y++) for (let x = 3; x < r.w - 3; x++) { const t = r.tile(x, y); if (t && y < r.top) r.top = y; if (!t && y > r.bot) r.bot = y; }
      r.top = Math.max(0, r.top - 4); r.bot = Math.min(r.h - 1, r.bot + 3);
    }
    const H0 = Math.max(...rooms.map((r) => r.bot - r.top + 1)) + 4;
    const c = document.createElement('canvas'); c.width = W0 * 2; c.height = H0 * 2; const g = c.getContext('2d');
    g.fillStyle = '#0e0a12'; g.fillRect(0, 0, c.width, c.height);
    let ox = gap, left = 0;
    for (const r of rooms) {
      const seen = this.save.seen[rid + '/' + r.id], oy = H0 - 2 - (r.bot + 1), dot = (x, y, col, w = 1, h = 1) => { if (y < r.top || y > r.bot) return; g.fillStyle = col; g.fillRect((ox + x) * 2, (oy + y - h + 1) * 2, w * 2, h * 2); };
      g.strokeStyle = '#3a2a20'; g.strokeRect(ox * 2 - 1, (oy + r.top) * 2 - 1, r.w * 2 + 2, (r.bot - r.top + 1) * 2 + 2);
      if (seen) {
        const pre = `${rid}/${r.id}/`;
        for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
          const t = this.save.gates[pre + x + ',' + y] ? 0 : r.tile(x, y);
          if (t === 1) dot(x, y, '#4a3e59'); else if (t === 2) dot(x, y, '#8c5a30'); else if (t === 3) dot(x, y, '#7a3040');
          else if (t >= 4) { g.globalAlpha = this.has(GATE_POWER[t]) ? 1 : 0.45; dot(x, y, GATE[t]); g.globalAlpha = 1; }
        }
        for (const l of r.links) if (l.kind === 'door' && this.doorStateIn(l, rid) !== 'hidden') dot(l.cx, l.cy, '#30ff60', 1, 2);
        for (const sp of r.spawns) if (sp.type === 'marked' && this.save.soldiers[sp.id] !== 'c') { dot(sp.cx, sp.cy, '#ff3028', 1, 2); left++; }
        if (rid === this.region.id && r.id === this.room.id) { const p = this.player; dot(Math.floor(p.cx / T) - 1, Math.floor((p.y + p.h - 1) / T), '#ffffff', 3, 3); }
      } else { g.fillStyle = '#2a1c24'; g.font = '16px serif'; g.textAlign = 'center'; g.fillText('?', (ox + r.w / 2) * 2, (oy + (r.top + r.bot) / 2) * 2 + 6); for (const sp of r.spawns) if (sp.type === 'marked' && this.save.soldiers[sp.id] !== 'c') left++; }
      ox += r.w + gap;
    }
    const open = REGIONS.filter((r) => r.id > 0 && Object.keys(this.save.seen).some((k) => k.startsWith(r.id + '/'))).map((r) => r.id);
    const i = open.indexOf(rid), buttons = [];
    if (open.length > 1) buttons.push({ label: 'Earlier', value: 'prev' }, { label: 'Later', value: 'next' });
    buttons.push({ label: 'Back', value: 'back' });
    this.ui.show({ kind: 'map', quick: true, sound: 'select', esc: 'back', sel: buttons.length - 1, data: { region: rid, left }, buttons,
      html: `<h2>${rid}. ${region.name}</h2><img class="map" src="${c.toDataURL()}" alt="map"><p class="how">${left} marked ${left === 1 ? 'soldier remains' : 'soldiers remain'} here. Red: a soldier still carrying a ring. Green: a door. Coloured blocks: gates, dim until their power is held.</p>`,
      onClose: (v) => { if (v === 'back') this.pauseMenu(); else if (open.length) this.mapCard(open[(Math.max(0, i) + (v === 'next' ? 1 : open.length - 1)) % open.length]); else this.pauseMenu(); } });
  }
  doorStateIn(l, rid) { return l.after && !this.flag('boss' + l.after) ? 'hidden' : 'open'; }
  settingsMenu(back, sel = 0) {
    const st = this.settings, pct = (v) => Math.round(v * 100) + '%';
    this.ui.show({ kind: 'settings', quick: true, sound: 'select', sel, esc: 'back',
      html: `<h2>Settings</h2><p class="say">Sound ${pct(st.sound)} &nbsp; Music ${pct(st.music)} &nbsp; Screen shake ${st.shake ? 'on' : 'off'} &nbsp; Lighting ${st.light ? 'full' : 'simple'}</p>`,
      buttons: [{ label: 'Sound -', value: 's-' }, { label: 'Sound +', value: 's+' }, { label: 'Music -', value: 'm-' }, { label: 'Music +', value: 'm+' }, { label: 'Shake', value: 'sh' }, { label: 'Lighting', value: 'li' }, { label: 'Back', value: 'back' }],
      onClose: (v) => {
        const step = (x, d) => Math.round(clamp(x + d, 0, 1) * 10) / 10;
        if (v === 's-') st.sound = step(st.sound, -0.1); else if (v === 's+') st.sound = step(st.sound, 0.1);
        else if (v === 'm-') st.music = step(st.music, -0.1); else if (v === 'm+') st.music = step(st.music, 0.1);
        else if (v === 'sh') st.shake = !st.shake; else if (v === 'li') st.light = !st.light;
        this.sfx.setVolume(st.sound); this.sfx.setMusicVolume(st.music); writeSettings(this.storage, st);
        if (v === 'back') back(); else this.settingsMenu(back, ['s-', 's+', 'm-', 'm+', 'sh', 'li'].indexOf(v));
      } });
  }
  has(id) { return this.save.powers.includes(id); }
  flag(k) { return !!this.save.flags[k]; }
  maxHp() { let n = 5; for (const k in this.save.flags) if (k.startsWith('boss')) n++; return n; }
  after(t, fn) { this.timers.push({ t, fn }); }
  banner2(text, t = 2.2) { this.note = { text, t, max: t }; }

  makeVignette() {
    const [c, g] = mk(W, H);
    const gr = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.62);
    gr.addColorStop(0, 'rgba(8,5,14,0)'); gr.addColorStop(1, 'rgba(8,5,14,0.6)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return c;
  }

  // ------------------------------------------------------------ rooms
  loadRoom(regionId, roomId, linkId = null, o = {}) {
    const region = regionById(regionId) || REGIONS[0];
    const def = region.rooms.find((r) => r.id === roomId) || region.rooms.find((r) => r.id === region.start) || region.rooms[0];
    const sameRegion = this.region === region;
    this.region = region;
    this.room = parseRoom(def, region.id);
    this.room.shield = this.has('shield');
    const pre = `${region.id}/${def.id}/`;
    for (const k in this.save.gates) if (k.startsWith(pre)) { const [x, y] = k.slice(pre.length).split(',').map(Number); this.room.set(x, y, AIR); }
    this.tileCanvas = renderRoom(this.room, region.theme);
    this.backdrop = this.backdrops[region.theme] || (this.backdrops[region.theme] = makeBackdrop(region.theme));
    this.soldiers = []; this.stones = []; this.trophies = []; this.pickups = []; this.parts = []; this.torches = []; this.shots = []; this.timers = [];
    this.boss = null; this.relic = null; this.nearDoor = null;
    for (const sp of this.room.spawns) {
      if (sp.type === 'torch') this.torches.push({ x: sp.cx * T + 8, y: (sp.cy + 1) * T, seed: sp.cx * 1.3 });
      else if (sp.type === 'marked') {
        const st = this.save.soldiers[sp.id];
        if (st === 'c') continue;                                              // trophy already collected
        if (Array.isArray(st)) this.trophies.push(new Trophy(sp.id, st[0], st[1], this.homeOf(sp), null, this.rand));
        else this.soldiers.push(new Soldier(sp, true, region.id));
      } else if (sp.type === 'soldier') this.soldiers.push(new Soldier(sp, false, region.id));
      else if (sp.type === 'boss' && this.room.boss) {
        const n = this.room.boss;
        this.bossSpawn = sp;
        if (!this.flag('boss' + n)) { this.boss = new Boss(BOSSES[n], sp, n); if (this.flag('fell' + n)) this.after(1.6, () => this.banner2(BOSSES[n].weakHint, 7)); }
        else if (!this.has(POWERS[n - 1].id)) this.spawnRelic(n);
      }
    }
    this.rings = [];
    for (let y = 0; y < this.room.h; y++) for (let x = 0; x < this.room.w; x++) if (this.room.tile(x, y) === RING) this.rings.push({ x: x * T + 8, y: y * T + 8 });
    this.fires = this.room.props.filter((q) => q.type === 'fire').map((q) => ({ x: q.cx * T + 8, y: (q.cy + 1) * T + 12, seed: q.cx * 0.7, fire: true }));
    this.braziers = this.room.props.filter((q) => q.type === 'brazier').map((q) => ({ x: q.cx * T + 8, y: (q.cy + 1) * T, seed: q.cx * 0.9 }));
    const link = linkId ? this.room.link(linkId) : null;
    const s = link ? { cx: link.kind === 'edge' ? (link.side === 'L' ? 1 : this.room.w - 2) : link.cx, cy: link.cy, face: link.kind === 'edge' ? (link.side === 'L' ? 1 : -1) : 1 }
      : { cx: (this.room.start || { cx: 2 }).cx, cy: (this.room.start || { cy: 2 }).cy, face: 1 };
    this.entry = s;
    const hp = o.keepHp && this.player ? this.player.hp : null;
    this.player = new Player(s.cx * T + 3, (s.cy + 1) * T - 22);
    this.player.face = s.face; this.player.maxHp = this.maxHp(); this.player.hp = hp ? Math.min(hp, this.player.maxHp) : this.player.maxHp;
    this.save.at = { region: region.id, room: def.id, link: link ? link.id : null };
    this.save.seen[region.id + '/' + def.id] = 1;
    this.maxCamX = Math.max(0, this.room.w * T - W); this.maxCamY = Math.max(0, this.room.h * T - H);
    this.snapCamera();
    this.banner = { text: (sameRegion && this.room.name === this.lastName) ? '' : (this.room.name || region.name), t: 4 };
    this.lastName = this.room.name;
    this.fade = 1;
    this.persist();
    this.sfx.setMusic(region.id === 0 ? 'camp' : this.boss ? 'boss' : 'field', region.id);
    if (region.id === 0) {
      if (this.flag('scene100')) this.room.props = [...this.room.props, { type: 'guard', cx: 25, cy: 17, face: -1 }];
      else if (this.flag('hundred')) this.after(1.0, () => this.messenger());
    }
  }
  homeOf(sp) { return { x: sp.cx * T + 8, y: (sp.cy + 1) * T - 6 }; }

  // After David falls: back to where he entered the room, full health. Marked soldiers still standing
  // return to their posts, unmarked ones respawn, a captain starts over. The tally is untouched.
  respawn() {
    if (this.room.boss && this.boss) this.save.flags['fell' + this.room.boss] = 1;      // next time, the scouts' advice is shown
    this.loadRoom(this.region.id, this.room.id, this.save.at.link);
  }
  persist() { writeSave(this.storage, this.save); }
  resetSave() { clearSave(this.storage); this.save = freshSave(); this.loadRoom(0, null); }
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

  // ------------------------------------------------------------ gates, doors, captains
  // Opens a gate tile and every tile of the same kind joined to it. Stays open for good.
  breakGate(cx, cy) {
    const kind = this.room.tile(cx, cy);
    if (!GATE_POWER[kind] || kind === WATER) return;
    const stack = [[cx, cy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= this.room.w || y >= this.room.h || this.room.tile(x, y) !== kind) continue;
      this.room.set(x, y, AIR);
      this.save.gates[`${this.region.id}/${this.room.id}/${x},${y}`] = 1;
      for (let i = 0; i < 8; i++) this.parts.push({ x: x * T + this.rand() * T, y: y * T + this.rand() * T, vx: (this.rand() - 0.5) * 220, vy: -60 - this.rand() * 160, g: 600, life: 0.7, max: 0.7, col: kind === REED ? '#c9a75a' : '#8a7f96', size: 2, bounce: true });
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    this.sfx.play('break'); this.shake = Math.max(this.shake, 4); this.persist();
  }
  bossActive() { return !!this.boss && !this.boss.gone; }
  doorState(l) {
    if (l.after && !this.flag('boss' + l.after)) return 'hidden';
    if (l.act) return 'open';
    if (!l.to || (this.demo && l.look === 'gateway' && l.n > this.demo)) return 'sealed';
    if (l.needs && !this.has(l.needs)) return 'locked';
    if (l.look === 'gateway' && this.flag('boss' + l.n)) return 'done';
    if (l.look === 'arena' && this.flag('boss' + this.region.id)) return 'done';
    return 'open';
  }
  useDoor(l) {
    const st = this.doorState(l);
    if (this.bossActive()) { this.banner2('NO WAY OUT BUT THROUGH HIM'); this.sfx.play('locked'); return; }
    if (st === 'sealed') { this.banner2(this.demo ? 'BEYOND THIS DEMO' : 'THIS GATE IS NOT YET OPEN'); this.sfx.play('locked'); return; }
    if (st === 'locked') { this.banner2('SEALED. ' + POWERS.find((q) => q.id === l.needs).name.toUpperCase() + ' OPENS IT'); this.sfx.play('locked'); return; }
    if (l.act === 'saul') { this.saul(); return; }
    this.go(l);
  }
  go(l) {
    const to = parseTo(l.to, this.region.id);
    if (!to) return;
    this.sfx.play('door');
    this.loadRoom(to.region, to.room, to.link, { keepHp: true });
  }
  // The halfway choice. When the tally first reaches 100 a messenger waits at the camp; once his
  // scene has played, Saul's tent offers Ending A whenever the player asks for it.
  checkHundred() {
    if (this.save.tally >= 100 && !this.flag('hundred')) {
      this.save.flags.hundred = 1; this.persist();
      if (this.region.id === 0) this.after(0.6, () => this.messenger());
      else this.banner2("THE KING'S PRICE IS MET. A MESSENGER WAITS AT SAUL'S CAMP", 6);
    }
  }
  messenger() {
    if (this.flag('scene100') || !this.flag('hundred')) return;
    this.ui.scene('hundred', [
      { title: 'A Messenger from Saul', text: ["A runner comes down from the king's tent, short of breath, and finds David among the fires."] },
      { text: ['"The king set his price at a hundred. A hundred are counted. The king\'s price is met."'] },
      { text: ['"Come up now and claim Michal, the king\'s daughter. Or go out again, if you will: the Philistines still hold the valley, and the king will hear you whenever you choose."'] },
    ], [{ label: 'Continue', value: 'ok' }], () => { this.save.flags.scene100 = 1; this.persist(); this.banner2("SAUL'S TENT WILL HEAR DAVID WHEN HE CHOOSES", 5); }, { tally: this.save.tally });
  }
  saul() {
    const n = this.save.tally;
    if (!this.flag('scene100')) {
      this.ui.scene('saul', [{ title: "Saul's Tent", text: [`The king asks no dowry but a hundred trophies of the Philistines. David has brought ${n}.`] }], [{ label: 'Leave', value: 'leave' }]);
      return;
    }
    const full = n >= TALLY_GOAL && this.flag('boss10');
    const buttons = full ? [{ label: 'Give them in full tale', value: 'B' }, { label: 'Not yet', value: 'leave' }] : [{ label: 'Claim Michal now', value: 'A' }, { label: 'Press on', value: 'leave' }];
    const text = full ? ['Two hundred. Every captain of the Philistines has fallen. The king waits.'] : [`The king's price is met: David has brought ${n}, and a hundred were asked.`, 'He may claim Michal now, or press on and bring the tale in full.'];
    this.ui.scene('saul', [{ title: "Saul's Tent", text }], buttons, (v) => { if (v === 'A') this.endingA(); else if (v === 'B' && this.endingB) this.endingB(); });
  }
  endingA() {
    const n = this.save.tally;
    this.save.flags.endingA = 1; this.persist();
    this.ui.scene('endingA', [
      { title: "The King's Son in Law", text: ['David goes up to the tent and the count is made before the king.', 'Saul keeps his word. Michal, the king\'s daughter, is given to David to be his wife.'] },
      { text: [`The price is paid: ${n} of two hundred. The valley is not yet quiet, and the captains beyond it still stand.`] },
      { title: 'Ending A', text: ['The price is met.'], cls: 'end', html: '<p class="say">The tale can still be told in full. David may go out again.</p>' },
    ], [{ label: 'Keep playing', value: 'ok' }], () => this.banner2('THE GATEWAYS STAND OPEN STILL', 4), { tally: n });
  }
  // Ending B: all 200 and the last captain. Closes on 1 Samuel 18:27.
  endingB() {
    this.save.flags.endingB = 1; this.persist();
    this.ui.scene('endingB', [
      { title: 'In Full Tale', text: ['David rises and goes up to the king, he and his men, and the count is made before all the camp.', 'Not a hundred. Two hundred. No captain of the Philistines is left standing between Gath and the valley.'] },
      { title: 'Ending B', text: [], html: `<p class="verse-text">${ENDING_B_VERSE.text}</p><p class="verse-ref"><span class="ref">${ENDING_B_VERSE.ref}</span> <span class="tag">${VERSION_TAG}</span></p>` },
    ], [{ label: 'Keep playing', value: 'ok' }], null, { tally: this.save.tally });
  }
  onBossDying(b) { this.sfx.setMusic(null); this.shots.length = 0; for (const s of this.soldiers) if (s.summoned) s.die(this, 0); }
  onBossFell(b) {
    const n = b.regionId;
    this.save.flags['boss' + n] = 1;
    this.player.maxHp = this.maxHp(); this.player.hp = this.player.maxHp;
    this.persist();
    this.after(0.9, () => this.ui.verse(n, () => this.spawnRelic(n)));
  }
  spawnRelic(n) {
    const sp = this.bossSpawn || this.room.start;
    this.relic = { x: sp.cx * T + 8, y: (sp.cy + 1) * T - 20, power: POWERS[n - 1].id, t: 0 };       // where the captain first stood: always solid ground
  }
  grantPower(id) {
    if (!this.has(id)) this.save.powers.push(id);
    this.room.shield = this.has('shield');
    this.relic = null; this.persist(); this.sfx.setMusic('field', this.region.id);
    const demoEnd = this.demo && POWERS[this.demo - 1] && id === POWERS[this.demo - 1].id;
    this.ui.power(id, () => {
      if (demoEnd) this.ui.scene('demoEnd', [{ title: 'The End of the Demo', text: [`David has brought ${this.save.tally} of the ${this.demo * 20} trophies in these ${this.demo === 1 ? 'hills' : 'first ' + this.demo + ' regions'}. The rest of the tale lies beyond the sealed gateways.`, 'Thank you for playing. You can keep exploring: the new power opens places you have already passed.'] }], [{ label: 'Keep playing', value: 'ok' }], null, { tally: this.save.tally });
      else this.banner2(id === 'valor' ? (this.save.tally >= TALLY_GOAL ? 'THE TALE IS FULL. RETURN TO SAUL' : `${this.save.tally} OF 200. THE TALE IS NOT YET FULL`) : 'THE WAY BACK TO CAMP IS OPEN', 4);
    });
  }
  summon(boss, n, kind) {
    for (let i = 0; i < n; i++) {
      const cx = i % 2 ? this.room.w - 4 : 3, s = new Soldier({ type: 'soldier', kind, cx, cy: Math.floor((boss.y + boss.h - 1) / T) }, false, this.region.id);
      s.summoned = true; s.state = 'chase'; this.soldiers.push(s);
    }
  }
  // Does the buckler turn a spear or blade coming from direction dir (+1 = travelling right)?
  blocks(dir) { const p = this.player; return this.has('shield') && !p.charging && p.swordT <= 0 && p.face === -dir; }
  // Does David's buckler turn this missile? (Bronze Buckler, region 6.)
  guards(shot) { const p = this.player; return this.has('shield') && !p.charging && shot.kind !== 'wave' && Math.sign(shot.vx) === -p.face; }

  collect(tr) {
    if (tr.taken) return;
    tr.taken = true;
    this.save.soldiers[tr.id] = 'c';
    this.save.tally = Math.min(TALLY_GOAL, this.save.tally + 1);
    this.tallyPulse = 0.6;
    this.sfx.play('collect');
    this.checkHundred();
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
    if (this.ui.open) { this.ui.update(this.input, dt); return; }
    if (this.input.pressed.pause) { this.pauseMenu(); return; }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.time += dt; this.frame++; this.save.played += dt;
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt * 2);
    if (this.banner.t > 0) this.banner.t -= dt;
    if (this.tallyPulse > 0) this.tallyPulse -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 22);

    if (this.note.t > 0) this.note.t -= dt;
    for (const tm of this.timers) tm.t -= dt;
    const due = this.timers.filter((tm) => tm.t <= 0);
    this.timers = this.timers.filter((tm) => tm.t > 0);
    for (const tm of due) tm.fn();

    this.player.update(this, dt);
    if (this.checkLinks()) return;
    if (this.boss) { this.boss.update(this, dt); if (this.boss && this.boss.gone) this.boss = null; }
    for (const s of this.shots) s.update(this, dt);
    this.shots = this.shots.filter((s) => !s.dead);
    if (this.relic) {
      this.relic.t += dt;
      const p0 = this.player;
      if (!p0.dead && Math.abs(p0.cx - this.relic.x) < 12 && Math.abs(p0.cy - this.relic.y) < 22) this.grantPower(this.relic.power);
    }
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

  // Room exits: walking off an open edge, or pressing up in a doorway. Returns true if the room changed.
  checkLinks() {
    const p = this.player, room = this.room;
    if (p.dead) return false;
    if (p.cx < 0 || p.cx > room.w * T) {
      const side = p.cx < 0 ? 'L' : 'R', cy = Math.floor((p.y + p.h - 1) / T);
      let best = null;
      for (const l of room.links) if (l.kind === 'edge' && l.side === side && (!best || Math.abs(l.cy - cy) < Math.abs(best.cy - cy))) best = l;
      if (best && parseTo(best.to, this.region.id)) { this.go(best); return true; }
      p.x = clamp(p.x, 0, room.w * T - p.w);
    }
    this.nearDoor = null;
    for (const l of room.links) {
      if (l.kind !== 'door' || this.doorState(l) === 'hidden') continue;
      if (Math.abs(p.cx - (l.cx * T + 8)) < 12 && Math.abs(p.y + p.h - (l.cy + 1) * T) < 6) this.nearDoor = l;
    }
    if (this.nearDoor && p.onGround && this.input.pressed.up && !p.charging) { const r0 = this.room; this.useDoor(this.nearDoor); return this.room !== r0; }
    return false;
  }

  camTarget() {
    const p = this.player;
    return {
      x: clamp(p.cx + p.face * 22 - W / 2, 0, this.maxCamX),
      y: clamp(p.cy - H * 0.56, 0, this.maxCamY),
    };
  }
  snapCamera() { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; }
  followCamera(dt) {
    const t = this.camTarget();
    this.cam.x += (t.x - this.cam.x) * Math.min(1, dt * 5);
    this.cam.y += (t.y - this.cam.y) * Math.min(1, dt * 6);
  }

  // ------------------------------------------------------------ render
  // On a phone that cannot keep up, drop the pools of light (the costly part of a frame) once, and say so.
  autoLight(fps, el) {
    if (!this.settings.light || this.ui.open) return;
    this.slow = fps < 42 ? this.slow + el : 0;
    if (this.slow > 4) { this.settings.light = false; writeSettings(this.storage, this.settings); this.banner2('LIGHTING SIMPLIFIED TO KEEP THE GAME SMOOTH (SETTINGS)', 5); }
  }
  light(x, y, r, rgb, a) {
    if (!this.settings.light) return;
    const l = this.lctx, gr = l.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.5, `rgba(${rgb},${a * 0.42})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    l.fillStyle = gr; l.fillRect(x - r, y - r, r * 2, r * 2);
  }

  render() {
    const ctx = this.ctx, w = this.wctx, t = this.time, p = this.player;
    const sh = this.shake > 0 && this.settings.shake ? this.shake : 0;
    const cx = Math.round(this.cam.x + (sh ? (this.rand() - 0.5) * sh : 0)), cy = Math.round(this.cam.y + (sh ? (this.rand() - 0.5) * sh : 0));
    const on = (x, y, m = 40) => x > cx - m && x < cx + W + m && y > cy - m && y < cy + H + m;

    drawBackdrop(ctx, this.backdrop, this.cam.x, this.cam.y, this.maxCamY);

    // World layer
    w.clearRect(0, 0, W, H);
    w.drawImage(this.tileCanvas, -cx, -cy);
    const tx0 = Math.floor(cx / T), ty0 = Math.floor(cy / T), water = [];
    for (let yy = ty0; yy <= ty0 + 17; yy++) for (let xx = tx0; xx <= tx0 + 30; xx++) {
      const k = this.room.tile(xx, yy);
      if (k < REED || xx < 0 || xx >= this.room.w) continue;
      if (k === WATER) water.push(xx, yy); else drawGate(w, k, xx * T - cx, yy * T - cy, xx, yy, t, this.room);
    }
    for (const l of this.room.links) if (l.kind === 'door') { const st = this.doorState(l); if (st !== 'hidden' && on(l.cx * T, l.cy * T, 60)) drawDoor(w, l, l.cx * T + 8 - cx, (l.cy + 1) * T - cy, st, t); }
    for (const q of this.room.props) {
      if (!on(q.cx * T, q.cy * T, 60)) continue;
      if (q.type === 'guard') drawIsraelite(w, q.cx * T + 8 - cx, (q.cy + 1) * T - cy, q.face || 1, t, q.cx);
      else drawProp(w, q, q.cx * T + 8 - cx, (q.cy + 1) * T - cy, t);
    }
    for (const o of this.torches) if (on(o.x, o.y)) drawTorchPost(w, o.x - cx, o.y - cy);
    for (const k of this.pickups) drawFig(w, Math.round(k.x + 3 - cx), Math.round(k.y + 7 - cy));
    for (const s of this.soldiers) if (on(s.x, s.y)) s.draw(w, cx, cy);
    if (this.boss) this.boss.draw(w, cx, cy);
    p.draw(w, cx, cy, this);
    if (this.relic) drawRelic(w, Math.round(this.relic.x - cx), Math.round(this.relic.y - cy), this.relic.t, this.relic.power === 'sword');
    for (const s of this.stones) s.draw(w, cx, cy);
    for (const s of this.shots) s.draw(w, cx, cy);
    for (let i = 0; i < water.length; i += 2) drawWater(w, water[i] * T - cx, water[i + 1] * T - cy, water[i], water[i + 1], t, this.room.tile(water[i], water[i + 1] - 1) !== WATER);
    for (const q of this.parts) if (!q.glow) { w.globalAlpha = clamp(q.life / q.max * 1.5, 0, 1); w.fillStyle = q.col; w.fillRect(Math.round(q.x - cx), Math.round(q.y - cy), q.size, q.size); }
    w.globalAlpha = 1;

    // Light map: dusk ambient plus warm pools of light, multiplied over the world layer only.
    const l = this.lctx;
    l.globalCompositeOperation = 'source-over'; l.fillStyle = this.backdrop.ambient; l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'lighter';
    for (const o of this.torches) if (on(o.x, o.y, 110)) this.light(o.x - cx, o.y - 20 - cy, 92 + Math.sin(t * 11 + o.seed) * 4 + Math.sin(t * 23 + o.seed) * 2, '255,176,96', 0.95);
    for (const o of this.braziers) if (on(o.x, o.y, 110)) this.light(o.x - cx, o.y - 16 - cy, 84 + Math.sin(t * 10 + o.seed) * 4, '255,170,90', 0.9);
    for (const o of this.fires) if (on(o.x, o.y, 130)) this.light(o.x - cx, o.y - 22 - cy, 110 + Math.sin(t * 9 + o.seed) * 6, '255,170,90', 1);
    for (const l of this.room.links) if (l.kind === 'door' && on(l.cx * T, l.cy * T, 80) && this.doorState(l) !== 'hidden') this.light(l.cx * T + 8 - cx, l.cy * T - 4 - cy, 44, l.look === 'saul' ? '255,190,110' : '255,200,150', l.look === 'saul' ? 0.9 : 0.45);
    if (this.relic) this.light(Math.round(this.relic.x - cx), Math.round(this.relic.y - cy), 70, '255,226,160', 1);
    if (this.boss && this.boss.state === 'dying') this.light(Math.round(this.boss.cx - cx), Math.round(this.boss.cy - cy), 90, '255,230,180', 1 - this.boss.t / 1.8);
    for (const s of this.shots) if (s.kind === 'wave') this.light(Math.round(s.x - cx), Math.round(s.y - 6 - cy), 22, '255,200,120', 0.8);
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
    for (const o of this.fires) if (on(o.x, o.y)) {
      drawFlame(ctx, o.x - cx - 2, o.y - cy, t, o.seed); drawFlame(ctx, o.x - cx + 2, o.y - cy, t * 1.1, o.seed + 3); drawFlame(ctx, o.x - cx, o.y - 3 - cy, t * 0.9, o.seed + 5);
    }
    if (this.relic) {
      const x = Math.round(this.relic.x - cx), y = Math.round(this.relic.y - cy), gr = ctx.createRadialGradient(x, y, 0, x, y, 26);
      gr.addColorStop(0, `rgba(255,226,160,${0.5 + 0.15 * Math.sin(t * 4)})`); gr.addColorStop(1, 'rgba(255,226,160,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 26, y - 26, 52, 52);
    }
    if (this.boss) this.boss.drawGlow(ctx, cx, cy);
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
    if (this.boss && (this.boss.state === 'tele')) drawText(ctx, '!', Math.round(this.boss.cx - cx) - 1, Math.round(this.boss.y - cy) - 26, '#ff6a4a', 2);
    if (this.nearDoor && !this.bossActive()) {
      const l = this.nearDoor, st = this.doorState(l), s = st === 'locked' || st === 'sealed' ? 'SEALED' : (this.touch ? 'PUSH UP: ' : 'UP: ') + (l.label || (l.look === 'gateway' ? (regionById(l.n) ? regionById(l.n).name.toUpperCase() + '  ' + this.tracker()[l.n - 1].got + '/20' : 'UNKNOWN') : 'ENTER'));
      const dx = Math.round(l.cx * T + 8 - cx - textWidth(s) / 2), dy = (l.cy + 1) * T - cy - (l.look === 'gateway' ? 60 : l.look === 'saul' ? 62 : 46);
      drawText(ctx, s, clamp(dx, 2, W - textWidth(s) - 2), dy, st === 'locked' || st === 'sealed' ? '#c98b3f' : '#ffe9a0', 1);
    }

    ctx.drawImage(this.vignette, 0, 0);
    this.drawGuide(ctx, cx, cy);
    this.drawHud(ctx);
    if (this.fade > 0) { ctx.fillStyle = `rgba(7,5,11,${this.fade})`; ctx.fillRect(0, 0, W, H); }
    if (this.paused) { ctx.fillStyle = 'rgba(7,5,11,0.6)'; ctx.fillRect(0, 0, W, H); drawText(ctx, 'PAUSED', (W - textWidth('PAUSED', 3)) / 2, 120, '#f1e2c0', 3); }
  }

  // Dotted preview of the stone's flight, so the arc can be aimed.
  drawAimArc(ctx, cx, cy) {
    const p = this.player, m = p.muzzle(), sp = p.shotSpeed(), full = p.charge >= 1;
    if (!p.aimable()) {
      // A level shot: dots out to where the stone will begin to drop.
      const n = Math.floor(p.range() / 6);
      for (let i = 1; i <= n; i++) {
        const x = m.x + p.face * i * 6;
        if (this.room.solid(Math.floor(x / T), Math.floor(m.y / T))) break;
        ctx.globalAlpha = (1 - i / (n + 4)) * (0.5 + 0.5 * p.charge);
        ctx.fillStyle = full ? '#ffffff' : '#f1e2c0';
        ctx.fillRect(Math.round(x - cx), Math.round(m.y - cy), i === n ? 2 : 1, i === n ? 2 : 1);
      }
      ctx.globalAlpha = 1;
      return;
    }
    let x = m.x, y = m.y, vx = Math.cos(p.aim) * sp * p.face + p.vx * 0.35, vy = -Math.sin(p.aim) * sp;
    const step = 1 / 120;
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
    if (this.note.t > 0) {
      const s = this.note.text; ctx.globalAlpha = clamp(Math.min(this.note.t, this.note.max - this.note.t) * 4, 0, 1);
      drawText(ctx, s, Math.round((W - textWidth(s, 1)) / 2), 82, '#ffe9a0', 1); ctx.globalAlpha = 1;
    }
    if (this.boss && this.boss.state !== 'intro') {
      const b = this.boss, bw = 200, bx = (W - bw) / 2, by = H - 22, f = Math.max(0, b.hp / b.maxHp);
      drawText(ctx, b.name.toUpperCase(), bx, by - 8, '#f1e2c0', 1);
      ctx.fillStyle = '#0e0a12'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6); ctx.fillStyle = '#3a1820'; ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = b.flash > 0 ? '#ffffff' : '#d8362e'; ctx.fillRect(bx, by, Math.round(bw * f), 4); ctx.fillStyle = '#ff9a7a'; ctx.fillRect(bx, by, Math.round(bw * f), 1);
      ctx.fillStyle = '#ffd680'; ctx.fillRect(bx + bw / 2, by - 1, 1, 6);
    }
    if (this.save.played < 30 && !this.boss && !this.touch) {
      const s = 'MOVE: ARROWS   JUMP: Z   SLING: HOLD X, RELEASE';
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
      powers: [...this.save.powers], flags: { ...this.save.flags }, card: this.ui.cur ? this.ui.cur.kind : null, shots: this.shots.length,
      boss: this.boss ? { name: this.boss.name, hp: this.boss.hp, maxHp: this.boss.maxHp, state: this.boss.state, attack: this.boss.attack ? this.boss.attack.id : null, x: r(this.boss.x), y: r(this.boss.y) } : null,
      relic: this.relic ? { x: r(this.relic.x), y: r(this.relic.y), power: this.relic.power } : null, door: this.nearDoor ? this.nearDoor.id : null, maxHp: p.maxHp,
    };
  }
}
