// The ten powers, one per captain, in the order they are earned. Gates and behaviours are wired
// up region by region (milestone 2 on); the ids are stable and used by the save file and debug menu.
export const POWERS = [
  { id: 'dash', region: 1, name: 'Fleet Foot', blurb: 'A short burst of speed across wide gaps.' },
  { id: 'double', region: 2, name: "Hind's Feet", blurb: 'A second jump in the air.' },
  { id: 'climb', region: 3, name: 'Rock Hold', blurb: 'Cling to and climb sheer walls.' },
  { id: 'pound', region: 4, name: "Lion's Fall", blurb: 'Drop hard to break cracked floors.' },
  { id: 'sword', region: 5, name: "Goliath's Sword", blurb: 'A melee blade. Cuts thorn and rope barriers.' },
  { id: 'shield', region: 6, name: 'Bronze Buckler', blurb: 'Turns arrows and spear points aside.' },
  { id: 'grapple', region: 7, name: "Shepherd's Cord", blurb: 'Swing from bronze rings.' },
  { id: 'swim', region: 8, name: 'Deep Breath', blurb: 'Pass through flooded passages.' },
  { id: 'heavy', region: 9, name: 'Smooth Stone', blurb: 'A full-charge shot that shatters bound doors.' },
  { id: 'valor', region: 10, name: 'Mighty Man', blurb: 'The sling charges in half the time.' },
];
