// All sound is synthesised with the Web Audio API. No samples, no downloads.
export class Sfx {
  constructor() { this.ctx = null; this.volume = 0.6; this.muted = false; this.combo = 0; this.comboT = 0; }

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

  tick(dt) { if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; } }

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
      case 'heal': this.tone({ f: 523, f2: 784, t: 0.2, type: 'triangle', v: 0.12 }); break;
      case 'hurt': this.tone({ f: 330, f2: 95, t: 0.24, type: 'sawtooth', v: 0.14 });
        this.noise({ t: 0.14, v: 0.16, f: 800, f2: 200, type: 'lowpass' }); break;
      case 'die': [392, 311, 233, 155].forEach((f, i) => this.tone({ f, t: 0.3, type: 'triangle', v: 0.13, at: 0.13 * i })); break;
    }
  }
}
