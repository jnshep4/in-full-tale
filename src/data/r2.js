// Region 2: the terraces of Socoh. Captain: Ittur. Power: Hind's Feet (double jump).
// Entered with Fleet Foot, so reed screens stand on the main path.
import { room, seg, arena } from './pieces.js';
const campDoor = (n) => ['camp', 4, `0/camp/d${n}`, { look: 'path', label: "TO SAUL'S CAMP" }];

export const region2 = {
  id: 2, name: 'Socoh Terraces', theme: 'terraces', complete: true, start: 'vineyard',
  rooms: [
    room('vineyard', 'Socoh Terraces', 40, [
      seg(20, 30, { door: campDoor(2), t: [8], s: [12] }),
      seg(20, 28, { A: [14], t: [10], deck: [3, 10], at: ['M', 6, 5] }),
      seg(20, 26, { hut: [4, '1'], s: [17] }),
      seg(20, 24, { M: [4], s: [9], tower: [13, 5, 5, 'double'] }),
      seg(20, 26, { cellar: [4], A: [15], t: [17] }),
      seg(20, 28, { t: [8], deck: [8, 15], at: ['a', 12, 5] }),
    ], { R: ['east', 'presses/west'] }),
    room('presses', 'The Wine Presses', 40, [
      seg(26, 28, { t: [6], s: [10], M: [18] }),
      seg(22, 28, { perch: [9], t: [19] }),
      seg(28, 28, { pit: [6, 3], M: [14], H: [21], t: [17] }),
      seg(20, 25, { hut: [5, '9'], A: [17] }),
      seg(24, 28, { t: [10], s: [14], A: [17], wall: [20, '1'], deck: [3, 10], at: ['M', 6, 5] }),
    ], { L: ['west', 'vineyard/east'], R: ['east', 'watch/west'] }),
    room('watch', 'The Watchtower', 40, [
      seg(20, 30, { t: [6], s: [12] }),
      seg(20, 27, { M: [4], A: [14] }),
      seg(20, 30, { tower: [3, 7, 16, 'climb'], s: [15] }),
      seg(20, 27, { hut: [5, '6'] }),
      seg(20, 30, { t: [9], s: [12], deck: [3, 10], at: ['M', 6, 5] }),
      seg(20, 30, { door: ['arena', 10, 'arena/in', { look: 'arena', label: "ITTUR'S GROUND" }], t: [6, 14] }),
    ], { L: ['west', 'presses/east'] }),
    arena(2, "Ittur's Ground", 'watch/arena'),
  ],
};
