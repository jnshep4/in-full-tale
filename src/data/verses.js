// Scripture text shown in the game, King James Version. BRIEF.md is the source of truth;
// tests/verses.test.mjs checks every entry here against it, character for character.
export const REGION_VERSES = [
  { region: 1, ref: '1 Samuel 16:12', text: 'And he sent, and brought him in. Now he was ruddy, and withal of a beautiful countenance, and goodly to look to. And the LORD said, Arise, anoint him: for this is he.' },
  { region: 2, ref: '1 Samuel 16:13', text: 'Then Samuel took the horn of oil, and anointed him in the midst of his brethren: and the Spirit of the LORD came upon David from that day forward. So Samuel rose up, and went to Ramah.' },
  { region: 3, ref: '1 Samuel 16:18', text: 'Then answered one of the servants, and said, Behold, I have seen a son of Jesse the Bethlehemite, that is cunning in playing, and a mighty valiant man, and a man of war, and prudent in matters, and a comely person, and the LORD is with him.' },
  { region: 4, ref: '1 Samuel 17:37', text: 'David said moreover, The LORD that delivered me out of the paw of the lion, and out of the paw of the bear, he will deliver me out of the hand of this Philistine. And Saul said unto David, Go, and the LORD be with thee.' },
  { region: 5, ref: '1 Samuel 17:50', text: 'So David prevailed over the Philistine with a sling and with a stone, and smote the Philistine, and slew him; but there was no sword in the hand of David.' },
  { region: 6, ref: '1 Samuel 18:1', text: 'And it came to pass, when he had made an end of speaking unto Saul, that the soul of Jonathan was knit with the soul of David, and Jonathan loved him as his own soul.' },
  { region: 7, ref: '1 Samuel 18:5', text: "And David went out whithersoever Saul sent him, and behaved himself wisely: and Saul set him over the men of war, and he was accepted in the sight of all the people, and also in the sight of Saul's servants." },
  { region: 8, ref: '1 Samuel 18:7', text: 'And the women answered one another as they played, and said, Saul hath slain his thousands, and David his ten thousands.' },
  { region: 9, ref: '1 Samuel 18:14', text: 'And David behaved himself wisely in all his ways; and the LORD was with him.' },
  { region: 10, ref: '1 Samuel 18:30', text: 'Then the princes of the Philistines went forth: and it came to pass, after they went forth, that David behaved himself more wisely than all the servants of Saul; so that his name was much set by.' },
];
export const VERSION_TAG = '(KJV)';
export const SWORD_VERSE = { ref: '1 Samuel 21:9', text: 'There is none like that; give it me.' };
export const ENDING_B_VERSE = { ref: '1 Samuel 18:27', text: "and they gave them in full tale to the king, that he might be the king's son in law." };

// Shown on a new game: 1 Samuel 18:20, 18:22-23 and 18:25 (KJV). Copied by script on 2026-11-19 from a
// public KJV text (github.com/aruljohn/Bible-kjv, 1Samuel.json), not typed; that file's verse 27 agrees
// with BRIEF.md's quotation of it. These verses are not in BRIEF.md, so no test can check them against it.
export const INTRO_VERSES = [
  { ref: '1 Samuel 18:20', text: 'And Michal Saul\'s daughter loved David: and they told Saul, and the thing pleased him.' },
  { ref: '1 Samuel 18:22-23', text: 'And Saul commanded his servants, saying, Commune with David secretly, and say, Behold, the king hath delight in thee, and all his servants love thee: now therefore be the king\'s son in law. And Saul\'s servants spake those words in the ears of David. And David said, Seemeth it to you a light thing to be a king\'s son in law, seeing that I am a poor man, and lightly esteemed?' },
  { ref: '1 Samuel 18:25', text: 'And Saul said, Thus shall ye say to David, The king desireth not any dowry, but an hundred foreskins of the Philistines, to be avenged of the king\'s enemies. But Saul thought to make David fall by the hand of the Philistines.' },
];
