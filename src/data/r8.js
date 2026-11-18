// Region 8: Ashkelon harbor. Captain: Banith. Power: Deep Breath (swim).
// Entered with the Shepherd's Cord: bronze rings carry David up to the high ledges.
import { room, seg, arena } from './pieces.js';

export const region8 = {
  id: 8, name: 'Ashkelon', theme: 'ashkelon', complete: true, start: 'harbor',
  rooms: [
    room('harbor', 'Ashkelon Harbor', 44, [
      seg(20, 32, { door: ['camp', 4, '0/camp/d8', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], s: [13] }),
      seg(34, 32, { perch: [16], M: [6], A: [26], t: [29] }),
      seg(22, 28, { M: [5], t: [9], deck: [8, 16], at: ['H', 12, 5] }),
      seg(30, 32, { sunk: [4], M: [20], A: [26], t: [23] }),
      seg(24, 32, { hut: [8, '9'], t: [20] }),
    ], { R: ['east', 'quay/west'] }),
    room('quay', 'The Long Quay', 44, [
      seg(22, 32, { t: [6], s: [10], M: [17] }),
      seg(24, 29, { M: [4], H: [18], t: [8], deck: [8, 16], at: ['A', 12, 5] }),
      seg(36, 32, { perch: [16], M: [6], A: [28], t: [31] }),
      seg(26, 32, { hut: [10, '9'], t: [23] }),
      seg(22, 32, { s: [6], H: [14], t: [10] }),
    ], { L: ['west', 'harbor/east'], R: ['east', 'mole/west'] }),
    room('mole', 'The Sea Wall', 44, [
      seg(24, 32, { t: [6], A: [10], deck: [14, 20], at: ['M', 18, 5] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: "BANITH'S GROUND" }], t: [6, 14] }),
    ], { L: ['west', 'quay/east'] }),
    arena(8, "Banith's Ground", 'mole/arena', { w: 40, planks: [], rings: [[10, 6], [20, 6], [30, 6]] }),
  ],
};
