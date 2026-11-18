// The ten powers, one per captain, in the order they are earned. Gates and behaviours are wired
// up region by region (milestone 2 on); the ids are stable and used by the save file and debug menu.
export const POWERS = [
  { id: 'dash', region: 1, name: 'Fleet Foot', blurb: 'A short burst of speed across wide gaps.', how: 'Press Shift (or L) to dash. Reed screens give way before it.' },
  { id: 'double', region: 2, name: "Hind's Feet", blurb: 'A second jump in the air.', how: 'Press jump again in the air.' },
  { id: 'climb', region: 3, name: 'Rock Hold', blurb: 'Cling to and climb sheer walls.', how: 'Press toward a wall in the air to cling. Up and down to climb, jump to spring away. From the wall the sling can be aimed: hold X, then up and down.' },
  { id: 'pound', region: 4, name: "Lion's Fall", blurb: 'Drop hard to break cracked floors.', how: 'In the air, hold down and press jump.' },
  { id: 'sword', region: 5, name: "Goliath's Sword", blurb: 'A blade for close work. It cuts thorn hedges.', how: 'Press C (or K) to strike.' },
  { id: 'shield', region: 6, name: 'Bronze Buckler', blurb: 'Turns arrows and spear points aside.', how: 'It is always on his arm: face a missile, sling at rest, and it is turned back. Spear hedges part before it.' },
  { id: 'grapple', region: 7, name: "Shepherd's Cord", blurb: 'Swing from bronze rings.', how: 'Near a bronze ring, press V (or I) to swing up to it. Jump to let go. Hanging there, the sling can be aimed with up and down.' },
  { id: 'swim', region: 8, name: 'Deep Breath', blurb: 'Pass through flooded passages.', how: 'Deep water no longer carries him off. Move freely in it; jump at the surface to leap out. Afloat, the sling can be aimed with up and down.' },
  { id: 'heavy', region: 9, name: 'Smooth Stone', blurb: 'A full-charge shot that shatters bound doors.', how: 'A full-charge shot now flies as a smooth stone: it shatters bound doors.' },
  { id: 'valor', region: 10, name: 'Mighty Man', blurb: 'The sling charges in half the time.', how: 'The sling reaches full charge in half the time.' },
];
