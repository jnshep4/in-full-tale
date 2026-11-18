// Region 10: the citadel of Gath. Captain: Seren Orphaz. Power: Mighty Man.
// Entered with every other power; bound doors stand on the main path. All 20 soldiers are open.
import { room, seg, arena } from './pieces.js';

export const region10 = {
  id: 10, name: 'Gath', theme: 'gath', complete: true, start: 'approach',
  rooms: [
    room('approach', 'The Road to Gath', 44, [
      seg(20, 32, { door: ['camp', 4, '0/camp/d10', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], h: [13] }),
      seg(26, 32, { wall: [3, '9'], M: [10], H: [17], A: [22], t: [13] }),
      seg(24, 28, { hut: [6, '9'], A: [20] }),
      seg(30, 32, { sunk: [4], M: [20], H: [26], t: [23] }),
      seg(34, 32, { perch: [16], M: [6], A: [28], t: [31] }),
    ], { R: ['east', 'citadel/west'] }),
    room('citadel', 'The Citadel', 44, [
      seg(22, 32, { t: [6], H: [10], M: [17] }),
      seg(26, 32, { moat: [8], H: [18], A: [22], t: [16] }),
      seg(24, 22, { M: [5], A: [12], H: [18], t: [9] }),
      seg(26, 32, { hut: [8, '6'], M: [22] }),
      seg(22, 32, { cellar: [4], A: [14], wall: [18, '9'] }),
    ], { L: ['west', 'approach/east'], R: ['east', 'keep/west'] }),
    room('keep', 'The Keep', 44, [
      seg(24, 32, { t: [6], h: [10], a: [18] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: 'THE SEREN OF GATH' }], t: [6, 14] }),
    ], { L: ['west', 'citadel/east'] }),
    arena(10, 'The Seren of Gath', 'keep/arena', { w: 44, planks: [[5, 9, 3], [34, 38, 3]], rings: [[22, 7]] }),
  ],
};
