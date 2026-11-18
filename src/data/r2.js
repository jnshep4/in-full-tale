// Region 2: the terraces of Socoh. Captain: Ittur. Power: Hind's Feet (double jump).
// Entered with Fleet Foot, so reed screens stand on the main path.
// Hand-built (2026-11-18). 20 marked: 14 open; one each behind a high rock (double jump), a cracked
// slab (pound), a tall tower (climb), a ring perch (cord), a bound door (heavy), a spear hedge (buckler).
import { RB } from '../world/build.js';
import { hut, tower, cellar, perch, wall, arena } from './pieces.js';

function vineyard() {
  const r = new RB('vineyard', 'Socoh Terraces', 120, 40);
  r.land(0, 119, 30).land(20, 119, 28).land(40, 99, 26).land(60, 79, 24).walls();   // terraces up to the crest and down again
  r.door('camp', 4, 29, '0/camp/d2', { look: 'path', label: "TO SAUL'S CAMP" });
  r.puts('t', [8, 29]).puts('s', [12, 29]);
  r.fill(22, 23, 29, 23).plank(31, 32, 25);                    // a trellis walk over the first terrace
  r.puts('M', [25, 22]).puts('A', [34, 27]).puts('t', [37, 27]);
  hut(r, 44, 26, '1');
  r.puts('s', [57, 25]);
  r.puts('M', [63, 23]).puts('s', [68, 23]);
  tower(r, 73, 5, 24, 5, 'double');
  cellar(r, 84, 26);
  r.puts('A', [95, 25]).puts('t', [97, 25]);
  r.clear(104, 28, 111, 29).back(104, 28, 111, 29).plank(106, 109, 28);   // a treading vat, two deep
  r.puts('a', [107, 29]).puts('t', [114, 27]);
  r.exit('R', 'east', 27, 'presses/west');
  return r.done();
}

function presses() {
  const r = new RB('presses', 'The Wine Presses', 120, 40);
  r.land(0, 119, 28).land(76, 95, 25).walls();
  r.exit('L', 'west', 27, 'vineyard/east');
  r.puts('t', [6, 27]).puts('s', [10, 27]).puts('M', [18, 27]);
  perch(r, 35, 28);
  r.puts('t', [45, 27]);
  r.clear(52, 28, 60, 30).back(52, 28, 60, 30).plank(55, 57, 28);   // the great vat, three deep
  r.puts('M', [54, 30]).puts('t', [59, 30]).puts('H', [69, 27]).puts('t', [72, 27]);
  hut(r, 81, 25, '9');
  r.puts('A', [93, 24]);
  r.fill(100, 23, 107, 23).plank(109, 110, 25);                // a loft over the last press
  r.puts('M', [103, 22]).puts('s', [106, 27]).puts('A', [113, 27]).puts('t', [111, 27]);
  wall(r, 116, 28, '1');
  r.exit('R', 'east', 27, 'watch/west');
  return r.done();
}

function watch() {
  const r = new RB('watch', 'The Watchtower', 120, 40);
  r.land(0, 119, 30).land(20, 39, 27).land(60, 79, 27).walls();
  r.exit('L', 'west', 29, 'presses/east');
  r.puts('t', [6, 29]).puts('s', [12, 29]);
  r.puts('M', [24, 26]).puts('A', [34, 26]).puts('t', [29, 26]);
  tower(r, 43, 7, 30, 16, 'climb');
  r.puts('s', [55, 29]);
  hut(r, 65, 27, '6');
  r.puts('M', [86, 29]).puts('t', [89, 29]);
  r.land(92, 95, 29).land(93, 94, 28);                         // a fallen wall
  r.puts('s', [98, 29]).puts('t', [104, 29], [116, 29]);
  r.door('arena', 110, 29, 'arena/in', { look: 'arena', label: "ITTUR'S GROUND" });
  return r.done();
}

export const region2 = {
  id: 2, name: 'Socoh Terraces', theme: 'terraces', complete: true, start: 'vineyard',
  rooms: [vineyard(), presses(), watch(), arena(2, "Ittur's Ground", 'watch/arena')],
};
