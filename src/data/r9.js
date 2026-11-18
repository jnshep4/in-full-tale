// Region 9: Gaza, the gates and the desert edge. Captain: Yishvar. Power: Smooth Stone (heavy shot).
// Entered with Deep Breath: the main path dives under two walls.
import { room, seg, arena } from './pieces.js';

export const region9 = {
  id: 9, name: 'Gaza', theme: 'gaza', complete: true, start: 'gates',
  rooms: [
    room('gates', 'The Gates of Gaza', 44, [
      seg(20, 32, { door: ['camp', 4, '0/camp/d9', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], s: [13] }),
      seg(26, 32, { moat: [6], M: [18], A: [22], t: [15] }),
      seg(24, 28, { hut: [6, '9'], H: [20] }),
      seg(30, 32, { sunk: [4], M: [20], A: [26], t: [23] }),
      seg(22, 32, { M: [6], H: [14], t: [10] }),
    ], { R: ['east', 'cisterns/west'] }),
    room('cisterns', 'The Cisterns', 44, [
      seg(22, 32, { t: [6], s: [10], M: [17] }),
      seg(30, 32, { sunk: [4], M: [20], H: [26], t: [23] }),
      seg(26, 29, { hut: [8, '9'], A: [22] }),
      seg(34, 32, { perch: [16], M: [6], A: [28], t: [31] }),
      seg(22, 32, { moat: [5], M: [16], t: [14] }),
    ], { L: ['west', 'gates/east'], R: ['east', 'sands/west'] }),
    room('sands', 'The Desert Edge', 44, [
      seg(26, 32, { t: [6], hut: [10, '9'] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: "YISHVAR'S GROUND" }], t: [6, 14] }),
    ], { L: ['west', 'cisterns/east'] }),
    arena(9, "Yishvar's Ground", 'sands/arena', { w: 40, planks: [[5, 8, 3], [31, 34, 3]], pool: [16, 23, 3] }),
  ],
};
