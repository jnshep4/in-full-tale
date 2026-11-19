// All sound is synthesised with the Web Audio API. No samples, no downloads.
export class Sfx {
  constructor() {
    this.ctx = null; this.volume = 0.6; this.muted = false; this.combo = 0; this.comboT = 0;
    this.musicVol = 0.5; this.mode = null; this.key = 0; this.nextT = 0; this.stepN = 0; this.seq = null;
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  setMusicVolume(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v * 0.5; }

  // ---- Music. Generated, not recorded: a plucked lyre line over a drone in a seven-note mode with
  // a raised third (D, E flat, F sharp, G, A, B flat, C), a frame drum under the captains.
  // mode: 'camp' | 'field' | 'boss' | null. key: the region id, which shifts the root and the tune.
  setMusic(mode, key = 0) {
    if (mode === this.mode && key === this.key) return;
    this.mode = mode; this.key = key; this.stepN = 0; this.seq = null;
    if (this.ctx) this.nextT = this.ctx.currentTime + 0.15;
  }
  buildSeq() {
    // A deterministic 32-step line per (mode, key): steps along the scale, with rests.
    let s = (this.key * 7919 + (this.mode === 'boss' ? 17 : this.mode === 'camp' ? 5 : 11)) >>> 0;
    const r = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    const seq = []; let deg = 0;
    for (let i = 0; i < 32; i++) {
      const strong = i % 4 === 0, rest = !strong && r() < (this.mode === 'boss' ? 0.25 : 0.45);
      deg += Math.round((r() - 0.5) * (strong ? 5 : 3)); deg = Math.max(-3, Math.min(8, deg));
      if (i % 16 === 0) deg = 0; if (i % 16 === 14) deg = 1;
      seq.push(rest ? null : deg);
    }
    return seq;
  }
  music() {
    const c = this.ctx; if (!c || !this.mode || this.musicVol <= 0) return;
    if (!this.seq) this.seq = this.buildSeq();
    const SCALE = [0, 1, 4, 5, 7, 8, 10], ROOTS = [0, 0, 2, -2, 3, -3, 5, 0, 2, -2, -4];
    const root = 146.83 * Math.pow(2, (ROOTS[this.key] || 0) / 12);
    const stepLen = this.mode === 'boss' ? 0.15 : this.mode === 'camp' ? 0.42 : 0.3;
    const freq = (deg) => root * Math.pow(2, Math.floor(deg / 7) + SCALE[((deg % 7) + 7) % 7] / 12);
    if (this.nextT < c.currentTime) this.nextT = c.currentTime + 0.05;
    // Four bars of 16 steps. The bass walks a slow progression (first, fourth, second, first degree);
    // the tune is the 32-step line played twice, the second time answered a third above by a second
    // voice; a soft reed holds the chord. Regions take the lead on a lyre, a reed pipe or a flute.
    const PROG = [0, 3, 1, 0], voice = ['lyre', 'lyre', 'lyre', 'pipe', 'flute', 'lyre', 'pipe', 'flute', 'lyre', 'pipe', 'flute'][this.key] || 'lyre';
    while (this.nextT < c.currentTime + 0.25) {
      const n = this.stepN % 64, i = n % 32, bar = Math.floor(n / 16), t0 = this.nextT, deg = this.seq[i], ch = PROG[bar];
      const boss = this.mode === 'boss';
      const lead = (f, len, v) => (boss ? (this.wind(f / 2, t0, 0.26, v * 0.8, true), this.pluck(f, t0, len, v * 0.6)) : voice === 'lyre' ? this.pluck(f, t0, len, v) : this.wind(f, t0, len * 0.9, v * 0.7, voice === 'pipe'));
      if (deg !== null) lead(freq(deg) * 2, this.mode === 'boss' ? 0.3 : 0.7, i % 4 === 0 ? 0.11 : 0.075);
      if (n >= 32 && deg !== null && i % 2 === 0) this.pluck(freq(deg + 2) * 2, t0, 0.5, 0.04);        // the answering voice
      // A captain's ground: a driving bass on every other step that leans on the flat second, a low
      // string tolling each bar, a reed holding the flat second under it, and the drum on every step.
      if (boss) {
        if (i % 2 === 0) this.pluck(freq(i % 8 === 6 ? ch + 1 : ch) / 2, t0, 0.3, 0.09);
        if (n % 16 === 0) this.pluck(freq(ch) / 4, t0, 2.4, 0.15);
        if (n % 16 === 8) this.wind(freq(ch + 1) / 2, t0, stepLen * 7, 0.03, true);
      } else if (i % 8 === 0) this.pluck(freq(ch) / 2, t0, 1.6, 0.1);                                 // bass string
      else if (i % 8 === 4 && this.mode !== 'camp') this.pluck(freq(ch + 4) / 2, t0, 0.8, 0.05);
      if (n % 16 === 0) { this.drone(freq(ch) / 2, t0, stepLen * 16); if (this.mode !== 'boss') this.wind(freq(ch + 2), t0, stepLen * 15, 0.018, true); }
      if (boss) { this.drum(t0, i % 4 === 0 ? 0.55 : i % 8 >= 6 ? 0.32 : i % 2 ? 0.1 : 0.2); if (i % 8 === 4) this.rattle(t0); }
      else if (this.mode === 'field') { if (i % 8 === 4) this.drum(t0, 0.12); if (i % 16 === 14) this.drum(t0, 0.07); if (i % 8 === 0) this.rattle(t0, 0.02); }
      this.nextT += stepLen; this.stepN++;
    }
  }
  // A sustained wind voice: a reed pipe (filtered saw) or a flute (sine with a slow tremble).
  wind(f, t0, len, v, reed) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain();
    o.type = reed ? 'sawtooth' : 'sine'; o.frequency.value = f; lfo.frequency.value = 5.2; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency);
    fl.type = 'lowpass'; fl.frequency.value = reed ? f * 3 : f * 6; fl.Q.value = 1;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + Math.min(0.06, len * 0.3)); g.gain.setValueAtTime(v, t0 + len * 0.7); g.gain.linearRampToValueAtTime(0.0001, t0 + len);
    o.connect(fl); fl.connect(g); g.connect(this.musicGain); o.start(t0); lfo.start(t0); o.stop(t0 + len + 0.05); lfo.stop(t0 + len + 0.05);
  }
  rattle(t0, v = 0.05) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; fl.type = 'highpass'; fl.frequency.value = 5000;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    s.connect(fl); fl.connect(g); g.connect(this.musicGain); s.start(t0, Math.random() * 0.5); s.stop(t0 + 0.12);
  }
  pluck(f, t0, len, v) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2.005;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
    o.connect(g); o2.connect(g); g.connect(this.musicGain); o.start(t0); o2.start(t0); o.stop(t0 + len + 0.05); o2.stop(t0 + len + 0.05);
  }
  drone(f, t0, len) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 1.5;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(0.06, t0 + len * 0.3); g.gain.linearRampToValueAtTime(0.0001, t0 + len + 0.2);
    o.connect(g); o2.connect(g); g.connect(this.musicGain); o.start(t0); o2.start(t0); o.stop(t0 + len + 0.3); o2.stop(t0 + len + 0.3);
  }
  drum(t0, v) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; fl.type = 'lowpass'; fl.frequency.setValueAtTime(380, t0); fl.frequency.exponentialRampToValueAtTime(70, t0 + 0.16);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    s.connect(fl); fl.connect(g); g.connect(this.musicGain); s.start(t0, Math.random() * 0.5); s.stop(t0 + 0.25);
  }

  // Browsers require a user gesture before audio can start.
  unlock() {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume;
        const comp = this.ctx.createDynamicsCompressor();
        this.master.connect(comp); comp.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicVol * 0.5; this.musicGain.connect(this.master);
        const n = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, n, n);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.ctx = null; }
  }

  tone({ f, f2 = f, t = 0.1, type = 'sine', v = 0.2, a = 0.004, at = 0 }) {
    const c = this.ctx; if (!c) return;
    const t0 = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + t);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + t + 0.02);
  }

  noise({ t = 0.1, v = 0.2, f = 1000, f2 = f, q = 1, type = 'bandpass', a = 0.003, at = 0 }) {
    const c = this.ctx; if (!c) return;
    const t0 = c.currentTime + at, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true;
    fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f, t0);
    fl.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + t);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
    s.connect(fl); fl.connect(g); g.connect(this.master);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + t + 0.02);
  }

  tick(dt) { if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; } this.music(); }

  play(name, p = 0) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'jump': this.tone({ f: 260, f2: 430, t: 0.11, type: 'triangle', v: 0.12 }); break;
      case 'land': this.noise({ t: 0.08, v: 0.16, f: 320, f2: 90, type: 'lowpass' }); break;
      case 'step': this.noise({ t: 0.035, v: 0.045, f: 900, f2: 400, q: 2 }); break;
      case 'ready': this.tone({ f: 1320, f2: 1980, t: 0.09, v: 0.07 }); break;                       // sling at full charge
      case 'sling': this.noise({ t: 0.13, v: 0.18 + 0.12 * p, f: 700 + 900 * p, f2: 3200, q: 3 });   // p = charge
        this.tone({ f: 500 + 300 * p, f2: 180, t: 0.09, type: 'triangle', v: 0.07 }); break;
      case 'stoneHit': this.noise({ t: 0.06, v: 0.14, f: 2400, f2: 700, q: 1.5 }); break;
      case 'tink': this.tone({ f: 2350, f2: 2100, t: 0.12, type: 'square', v: 0.05 });               // stone off a shield
        this.tone({ f: 3530, f2: 3300, t: 0.09, type: 'triangle', v: 0.05 }); break;
      case 'hit': this.noise({ t: 0.09, v: 0.26, f: 520, f2: 140, type: 'lowpass' });
        this.tone({ f: 190, f2: 70, t: 0.1, type: 'square', v: 0.09 }); break;
      case 'windup': this.tone({ f: 620, f2: 930, t: 0.16, type: 'triangle', v: 0.05 }); break;
      case 'thrust': this.noise({ t: 0.12, v: 0.16, f: 1500, f2: 400, q: 2 }); break;
      case 'fall': this.noise({ t: 0.5, v: 0.14, f: 500, f2: 4200, q: 1.2, a: 0.1 });                // soldier dissolves in light
        [660, 880, 1175].forEach((f, i) => this.tone({ f, t: 0.3, v: 0.05, at: 0.05 * i })); break;
      case 'pop': this.tone({ f: 320, f2: 1250, t: 0.13, type: 'triangle', v: 0.16 }); break;        // trophy bursts out
      case 'bounce': this.tone({ f: 1500 + 500 * p, f2: 1900, t: 0.035, v: 0.045 }); break;
      case 'collect': {                                                                              // rising two-note chime
        this.combo = Math.min(this.combo + 1, 8); this.comboT = 2.5;
        const base = 988 * Math.pow(2, (this.combo - 1) / 12);
        this.tone({ f: base, t: 0.16, type: 'triangle', v: 0.16 });
        this.tone({ f: base * 1.5, t: 0.34, type: 'sine', v: 0.17, at: 0.07 });
        this.tone({ f: base * 3, t: 0.22, type: 'sine', v: 0.04, at: 0.07 });
        this.noise({ t: 0.18, v: 0.03, f: 7000, f2: 9000, q: 4, at: 0.05 });
        break;
      }
      case 'dash': this.noise({ t: 0.18, v: 0.2, f: 900, f2: 3800, q: 1.2 }); this.tone({ f: 300, f2: 700, t: 0.12, type: 'triangle', v: 0.06 }); break;
      case 'break': this.noise({ t: 0.25, v: 0.3, f: 1800, f2: 300, q: 0.8 }); this.tone({ f: 160, f2: 60, t: 0.18, type: 'square', v: 0.1 }); break;
      case 'door': this.tone({ f: 196, f2: 262, t: 0.25, type: 'triangle', v: 0.1 }); this.noise({ t: 0.2, v: 0.08, f: 400, f2: 200, type: 'lowpass' }); break;
      case 'locked': this.tone({ f: 150, f2: 120, t: 0.12, type: 'square', v: 0.08 }); this.tone({ f: 120, f2: 100, t: 0.14, type: 'square', v: 0.08, at: 0.13 }); break;
      case 'splash': this.noise({ t: 0.35, v: 0.25, f: 1200, f2: 300, q: 0.7 }); break;
      case 'roar': this.tone({ f: 110, f2: 70, t: 0.7, type: 'sawtooth', v: 0.16 }); this.tone({ f: 165, f2: 98, t: 0.7, type: 'square', v: 0.07 }); this.noise({ t: 0.6, v: 0.12, f: 300, f2: 120, type: 'lowpass' }); break;
      case 'slam': this.noise({ t: 0.4, v: 0.4, f: 220, f2: 50, type: 'lowpass' }); this.tone({ f: 80, f2: 35, t: 0.35, type: 'sine', v: 0.3 }); break;
      case 'throw': this.noise({ t: 0.16, v: 0.14, f: 500, f2: 2400, q: 2 }); break;
      case 'swing': this.noise({ t: 0.14, v: 0.2, f: 2600, f2: 600, q: 1.5 }); break;
      case 'card': [392, 494, 587, 784].forEach((f, i) => this.tone({ f, t: 0.9, type: 'sine', v: 0.07, at: 0.12 * i, a: 0.05 })); break;
      case 'power': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ f, t: 0.5, type: 'triangle', v: 0.1, at: 0.09 * i })); this.noise({ t: 0.8, v: 0.04, f: 6000, f2: 9000, q: 3, at: 0.3 }); break;
      case 'bossfall': [220, 185, 147, 110, 82].forEach((f, i) => this.tone({ f, t: 0.5, type: 'sawtooth', v: 0.1, at: 0.16 * i })); this.noise({ t: 1.2, v: 0.14, f: 500, f2: 5000, q: 1 }); break;
      case 'select': this.tone({ f: 880, t: 0.05, type: 'square', v: 0.05 }); break;
      case 'heal': this.tone({ f: 523, f2: 784, t: 0.2, type: 'triangle', v: 0.12 }); break;
      case 'hurt': this.tone({ f: 330, f2: 95, t: 0.24, type: 'sawtooth', v: 0.14 });
        this.noise({ t: 0.14, v: 0.16, f: 800, f2: 200, type: 'lowpass' }); break;
      case 'die': [392, 311, 233, 155].forEach((f, i) => this.tone({ f, t: 0.3, type: 'triangle', v: 0.13, at: 0.13 * i })); break;
    }
  }
}
