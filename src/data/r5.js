// Region 5: Ephes-dammim, the battle lines. Captain: Goliath of Gath (1 Samuel 17). He drops his sword.
// Entered with dash, double jump, wall climb and ground pound.
import { room, seg, arena } from './pieces.js';

export const region5 = {
  id: 5, name: 'Ephes-dammim', theme: 'battle', complete: true, start: 'lines',
  rooms: [
    room('lines', 'Ephes-dammim', 44, [
      seg(20, 32, { door: ['camp', 4, '0/camp/d5', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], s: [13] }),
      seg(24, 32, { pit: [4, 3], M: [10], A: [21], t: [13], deck: [12, 20], at: ['H', 16, 5] }),
      seg(24, 29, { hut: [6, '5'], t: [21] }),
      seg(26, 32, { pit: [[3, 3], [22, 3]], M: [9], A: [14], s: [19] }),
      seg(26, 32, { M: [5], t: [9], s: [20], deck: [8, 16], at: ['H', 12, 5] }),
    ], { R: ['east', 'trench/west'] }),
    room('trench', 'The Trench', 44, [
      seg(22, 32, { t: [6], s: [10], M: [17] }),
      seg(36, 32, { perch: [16], A: [6], H: [28], t: [31] }),
      seg(26, 32, { hut: [10, '9'], t: [23] }),
      seg(24, 26, { M: [5], A: [12], t: [9] }),
      seg(22, 32, { hut: [6, '6'] }),
    ], { L: ['west', 'lines/east'], R: ['east', 'valley/west'] }),
    room('valley', 'The Valley Floor', 44, [
      seg(24, 32, { t: [6], H: [12], deck: [15, 20], at: ['M', 19, 5] }),
      seg(24, 32, { hut: [6, '5'] }),
      seg(24, 32, { hut: [6, '5', 'H'] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: 'THE CHAMPION' }], t: [6, 14] }),
    ], { L: ['west', 'trench/east'] }),
    arena(5, 'The Champion of Gath', 'valley/arena', { w: 44, planks: [[5, 9, 3], [13, 17, 6], [26, 30, 6], [34, 38, 3]] }),
  ],
};
