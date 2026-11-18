// Region 6: Ekron, city of olive presses. Captain: Akhtal. Power: Bronze Buckler (shield).
// Entered with Goliath's sword. All 20 marked soldiers here need only the powers of regions 1-5,
// which is what puts the 100th trophy within reach before any later power (NOTES.md, placement rule).
import { room, seg, arena } from './pieces.js';

export const region6 = {
  id: 6, name: 'Ekron', theme: 'ekron', complete: true, start: 'gate',
  rooms: [
    room('gate', 'The Gate of Ekron', 44, [
      seg(20, 32, { door: ['camp', 4, '0/camp/d6', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], s: [13] }),
      seg(24, 32, { wall: [3, '5'], M: [10], H: [17], t: [13] }),
      seg(22, 28, { M: [5], A: [10], cellar: [13] }),
      seg(26, 32, { hut: [6, '5'], t: [21] }),
      seg(24, 26, { tower: [10, 5, 10, 'climb'], M: [4], A: [20] }),
      seg(20, 32, { M: [6], s: [12], t: [9] }),
    ], { R: ['east', 'presses/west'] }),
    room('presses', 'The Olive Presses', 44, [
      seg(22, 32, { t: [6], s: [10], H: [16] }),
      seg(24, 29, { M: [4], hut: [8, '1'] }),
      seg(26, 32, { pit: [4, 3], M: [10], cellar: [14], A: [23] }),
      seg(24, 27, { M: [6], H: [14], t: [10] }),
      seg(24, 32, { tower: [8, 5, 5, 'double'], s: [18], t: [20] }),
    ], { L: ['west', 'gate/east'], R: ['east', 'wall/west'] }),
    room('wall', 'Under the Wall', 44, [
      seg(22, 32, { t: [6], s: [12] }),
      seg(24, 32, { H: [8], a: [16], t: [12] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: "AKHTAL'S GROUND" }], t: [6, 14] }),
    ], { L: ['west', 'presses/east'] }),
    arena(6, "Akhtal's Ground", 'wall/arena', { w: 36 }),
  ],
};
