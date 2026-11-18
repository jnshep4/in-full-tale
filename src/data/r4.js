// Region 4: the thickets of Timnah, lion country. Captain: Maroz. Power: Lion's Fall (ground pound).
// Entered with dash, double jump and wall climb, so the main path scales a cliff.
import { room, seg, arena } from './pieces.js';

export const region4 = {
  id: 4, name: 'Timnah Thickets', theme: 'thicket', complete: true, start: 'thicket',
  rooms: [
    room('thicket', 'Timnah Thickets', 44, [
      seg(20, 32, { door: ['camp', 4, '0/camp/d4', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], l: [14] }),
      seg(22, 32, { M: [4], hut: [8, '5'] }),
      seg(20, 22, { M: [6], l: [13], t: [10] }),
      seg(24, 22, { A: [5], cellar: [9], t: [20] }),
      seg(20, 32, { M: [5], s: [12], t: [9] }),
    ], { R: ['east', 'lair/west'] }),
    room('lair', "The Lions' Lair", 44, [
      seg(22, 32, { t: [6], l: [10], M: [17] }),
      seg(30, 32, { sunk: [4], M: [20], H: [25], t: [22] }),
      seg(20, 26, { M: [5], l: [12], A: [16] }),
      seg(26, 32, { hut: [6, '9'], t: [22] }),
      seg(22, 32, { A: [6], l: [12], M: [17], t: [9] }),
    ], { L: ['west', 'thicket/east'], R: ['east', 'grove/west'] }),
    room('grove', 'The Vineyard Road', 44, [
      seg(30, 32, { t: [6], l: [12], M: [20], s: [25] }),
      seg(34, 32, { perch: [13], M: [6, 24], t: [28] }),
      seg(24, 32, { hut: [8, '5'] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: "MAROZ'S GROUND" }], t: [6, 14] }),
    ], { L: ['west', 'lair/east'] }),
    arena(4, "Maroz's Ground", 'grove/arena', { w: 36, planks: [[14, 21, 4]] }),
  ],
};
