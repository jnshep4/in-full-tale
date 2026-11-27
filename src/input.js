// Keyboard and gamepad -> named actions. Polled once per fixed step.
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', KeyX: 'fire', KeyJ: 'fire',
  KeyQ: 'item', KeyO: 'item', KeyE: 'swap', KeyU: 'swap', KeyC: 'melee', KeyK: 'melee', KeyV: 'cord', KeyI: 'cord', ShiftLeft: 'dash', ShiftRight: 'dash', KeyL: 'dash',
  Enter: 'confirm', Escape: 'pause', KeyP: 'pause', Backquote: 'debug',
};
export const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'fire', 'melee', 'dash', 'cord', 'item', 'swap', 'confirm', 'pause', 'debug'];
// Standard-mapping gamepad buttons.
const PAD = { jump: [0], fire: [2, 7], melee: [1, 3], dash: [5], cord: [4], item: [6], swap: [8], confirm: [0, 9], pause: [9], up: [12], down: [13], left: [14], right: [15] };

export class Input {
  constructor(target = window) {
    this.keys = new Set();      // actions held by the keyboard
    this.latched = new Set();   // taps shorter than one step still register
    this.virtual = new Set();   // actions held by a test script
    this.touch = new Set();     // actions held on the touch controls
    this.held = {}; this.pressed = {}; this.released = {};
    for (const a of ACTIONS) { this.held[a] = false; this.pressed[a] = false; this.released[a] = false; }
    this.x = 0; this.y = 0;     // movement axes, -1..1
    this.aimX = 0; this.aimY = 0; this.aimStick = false;
    this.onAny = null;          // called on the first key or button press (audio unlock)
    target.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (this.onAny) this.onAny();
      if (!a) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && a !== 'debug') return;
      e.preventDefault();
      if (!e.repeat) { this.keys.add(e.code); this.latched.add(a); }
    });
    target.addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    target.addEventListener('blur', () => this.keys.clear());
  }

  poll() {
    const now = {};
    for (const a of ACTIONS) now[a] = this.latched.has(a) || this.virtual.has(a) || this.touch.has(a);
    for (const code of this.keys) now[KEYMAP[code]] = true;
    this.latched.clear();
    let ax = 0, ay = 0;
    this.aimStick = false;
    const pads = (typeof navigator !== 'undefined' && navigator.getGamepads) ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      for (const a in PAD) for (const b of PAD[a]) if (gp.buttons[b] && gp.buttons[b].pressed) { now[a] = true; if (this.onAny) this.onAny(); }
      const dz = (v) => (Math.abs(v) < 0.3 ? 0 : v);
      ax += dz(gp.axes[0] || 0); ay += dz(gp.axes[1] || 0);
      const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
      if (rx * rx + ry * ry > 0.2) { this.aimStick = true; this.aimX = rx; this.aimY = ry; }
    }
    if (ax < -0.4) now.left = true; if (ax > 0.4) now.right = true;
    if (ay < -0.5) now.up = true; if (ay > 0.5) now.down = true;
    for (const a of ACTIONS) {
      this.pressed[a] = now[a] && !this.held[a];
      this.released[a] = !now[a] && this.held[a];
      this.held[a] = !!now[a];
    }
    this.x = (this.held.right ? 1 : 0) - (this.held.left ? 1 : 0);
    this.y = (this.held.down ? 1 : 0) - (this.held.up ? 1 : 0);
  }
}
