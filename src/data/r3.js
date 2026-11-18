// Region 3: the gorge of Sorek. Captain: Pashdu. Power: Rock Hold (wall climb).
// Entered with dash and double jump, so the main path steps up five tiles at a time.
import { room, seg, arena } from './pieces.js';

export const region3 = {
  id: 3, name: 'Sorek Gorge', theme: 'gorge', complete: true, start: 'descent',
  rooms: [
    room('descent', 'Sorek Gorge', 44, [
      seg(20, 22, { door: ['camp', 4, '0/camp/d3', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], s: [13] }),
      seg(20, 27, { M: [5], A: [13], t: [9] }),
      seg(22, 32, { hut: [5, '5'], t: [18] }),
      seg(24, 32, { sunk: [4], s: [20] }),
      seg(20, 27, { M: [6], s: [12], H: [16] }),
      seg(20, 32, { M: [5], A: [12], t: [9] }),
    ], { R: ['east', 'caves/west'] }),
    room('caves', 'The Caves of Sorek', 44, [
      seg(24, 32, { t: [6, 14, 22], s: [10], M: [18] }),
      seg(20, 31, { pit: [6, 3], M: [12], t: [3, 15] }),
      seg(26, 32, { perch: [12], M: [20], t: [3, 22] }),
      seg(22, 32, { cellar: [4], A: [16], t: [13, 19] }),
      seg(24, 32, { M: [6], s: [12], H: [18], t: [3, 9, 15, 21] }),
    ], { L: ['west', 'descent/east'], R: ['east', 'falls/west'], roof: 6 }),
    room('falls', 'The Narrows', 44, [
      seg(20, 32, { t: [6], s: [12] }),
      seg(20, 27, { hut: [5, '6'] }),
      seg(24, 32, { tower: [8, 7, 18, 'climb'], s: [20] }),
      seg(22, 27, { M: [6], A: [14], t: [10] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: "PASHDU'S GROUND" }], t: [6, 14] }),
    ], { L: ['west', 'caves/east'] }),
    arena(3, "Pashdu's Ground", 'falls/arena', { w: 38, planks: [[5, 8, 3], [12, 15, 6], [22, 25, 6], [29, 32, 3]] }),
  ],
};
