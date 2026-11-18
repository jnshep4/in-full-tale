// Region 7: Ashdod, the temple quarter. Captain: Zeruk. Power: Shepherd's Cord (grapple).
// Entered with the Bronze Buckler, so spear hedges stand on the main path and archers are everywhere.
import { room, seg, arena } from './pieces.js';

export const region7 = {
  id: 7, name: 'Ashdod', theme: 'ashdod', complete: true, start: 'quarter',
  rooms: [
    room('quarter', 'The Temple Quarter', 44, [
      seg(20, 32, { door: ['camp', 4, '0/camp/d7', { look: 'path', label: "TO SAUL'S CAMP" }], t: [8], a: [13] }),
      seg(24, 32, { wall: [3, '6'], A: [10], M: [17], t: [13] }),
      seg(24, 28, { hut: [6, '6'], A: [20] }),
      seg(30, 32, { sunk: [4], M: [20], H: [26], t: [23] }),
      seg(22, 27, { M: [5], A: [12], t: [9] }),
      seg(20, 32, { M: [6], s: [12] }),
    ], { R: ['east', 'temple/west'] }),
    room('temple', 'The House of Dagon', 44, [
      seg(22, 32, { t: [6], s: [10], A: [16] }),
      seg(36, 32, { perch: [16], M: [6], H: [28], t: [31] }),
      seg(26, 32, { hut: [10, '9'], t: [23] }),
      seg(24, 27, { M: [5], A: [12], H: [18], t: [9] }),
      seg(22, 32, { s: [6], t: [10], wall: [18, '6'] }),
    ], { L: ['west', 'quarter/east'], R: ['east', 'court/west'] }),
    room('court', 'The Outer Court', 44, [
      seg(24, 32, { t: [6], A: [10], M: [18] }),
      seg(20, 32, { door: ['arena', 10, 'arena/in', { look: 'arena', label: "ZERUK'S GROUND" }], t: [6, 14] }),
    ], { L: ['west', 'temple/east'] }),
    arena(7, "Zeruk's Ground", 'court/arena', { w: 40 }),
  ],
};
