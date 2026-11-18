// The hub: Saul's camp in the Valley of Elah. One gateway per region; gateway N opens with the
// power won in region N-1. Saul's tent holds the endings.
import { RB } from '../world/build.js';
import { POWERS } from './powers.js';

// Start room of each built region, and the link inside it that leads back to camp.
export const REGION_ENTRY = { 1: 'outskirts/camp' };
export const GATE_X = (n) => 36 + 11 * (n - 1);
const standAt = (x) => (x < 56 ? 17 : x < 101 ? 16 : 15);

function camp() {
  const b = new RB('camp', "Saul's Camp", 150, 24);
  b.land(0, 149, 18).land(56, 149, 17).land(101, 149, 16).walls();
  b.put(14, 17, 'P');
  b.door('tent', 22, 17, null, { look: 'saul', act: 'saul', label: "SAUL'S TENT" });
  for (let n = 1; n <= 10; n++) {
    const x = GATE_X(n), to = REGION_ENTRY[n] ? `${n}/${REGION_ENTRY[n]}` : null;
    b.door('d' + n, x, standAt(x), to, { look: 'gateway', n, needs: n > 1 ? POWERS[n - 2].id : null });
    b.put(x - 3, standAt(x), 't');
  }
  for (const x of [6, 29, 42, 64, 75, 97, 108, 119, 141]) b.prop('tent', x, standAt(x), { v: x % 3 });
  for (const x of [10, 52, 86, 130]) b.prop('fire', x, standAt(x));
  for (const x of [17, 27, 58, 92, 114]) b.prop('banner', x, standAt(x));
  for (const [x, f] of [[8, 1], [19, 1], [25, -1], [50, -1], [70, 1], [88, -1], [104, 1], [128, -1]]) b.prop('guard', x, standAt(x), { face: f });
  return b.done();
}

export const hub = { id: 0, name: "Saul's Camp", theme: 'camp', start: 'camp', rooms: [camp()] };
