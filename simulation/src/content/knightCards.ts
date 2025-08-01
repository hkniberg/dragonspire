export interface KnightCard {
  id: string;
  name: string;
  description: string;
}

export function getKnightCardById(id: string): KnightCard | undefined {
  return KNIGHT_CARDS.find((knight) => knight.id === id);
}

// All knight cards in the game
export const KNIGHT_CARDS: KnightCard[] = [
  {
    id: "ser-nickathing",
    name: "Ser Nickathing",
    description: "Nickathing is a well known cleptomaniac, once known to having stolen a renowned round table from some faraway king. Whenever Nickathing blockades a claimed resource, you may immediately take +1 of that resource to your stockpile.",
  },
  {
    id: "big-bob",
    name: "Big Bob",
    description: "\"Bob want meat!\", \"Bob ANGRY!\" are the two things no knight wants to hear echoing across the battlefield, as it's most likely followed by a dualwielding half giant by the name of Big Bob. Not quite a knight, but who dare say otherwise. Can never move more than 2 squares, but has +2 item slots, and a +1 might whenever facing trolls or golems.",
  },
  {
    id: "ser-maylise-thorn",
    name: "Ser Maylise Thorn",
    description: "This nimble warrior blends well with the surroundings wherever woodland flow across the landscape. Whenever Maylise stands on or moves into a forest tile, she has +1 might.",
  },
  {
    id: "ser-nothatrole",
    name: "Ser Nothatrole",
    description: "Big Bob's sworn nemesis. Onesided as the rivalry is, Nothatrole once got his face stomped in and swore to return the favor. He stole the gear off of a few lowly knights and stitched it all together, untill he had himself a splendid armour. He now uhh...\"blends in\" among the other knights. Notathrole has 0 follower slots, but has +1 when fighting on a hills tile, and +3 might on any mountain tile (including the doomspire).",
  },
  {
    id: "roderick-the-grand",
    name: "Roderick the grand",
    description: "You'd think Roderick was a Lord the way he carries himself, goldplated helmet and all. Is it a carefully constructed ruse, or does he live up to the hype? Who knows. For every 4 fame you have on the fametracker, Roderick has +1 might.",
  },
  {
    id: "cyrina-the-blessed",
    name: "Cyrina the blessed",
    description: "Blessed be Cyrina, said to be the second coming of the prophecised warrior priestess Athlanta. No monstrum may breathe her air without becometh smitten through great violence. May donate 3 of any material whenever visiting the temple to gain either +1 fame or +1 might. (Instead of 3 fame. Limited to once per turn)",
  },
  {
    id: "paul",
    name: "Paul",
    description: "Paul is but a squire, but sees himself as the lord and saviour, the great conqurer and slayer of beasts. Which could have been true, had he not been a coward through and through. Unfortunately he seems to have been blessed with an absurd luck, the sole source of his arrogance. He has -1 to might in all encounters, but whenever he rolls a 3 he may roll an extra D3. (Limited to once per battle)",
  },
  {
    id: "ser-karen-earfull",
    name: "Ser Karen Earfull",
    description: "Whenever Karen claims tribute from another knight, the resource she gained was obviously faulty. Not only does she endlessly harass the already beaten knight, but she also turns to any divine or spiritual being unfortunate enough to lend an ear. She gets an extra resource conjured up by the \"makers\", please Karen stop with the noise!",
  },
  {
    id: "ser-bastian-the-foul",
    name: "Ser Bastian the foul",
    description: "Bastian has a pungent aroma around him, possibly caused by the fact that not even his squire has ever seen him without his armour. Unexpectedly, he also has a serious fear of water. One might ponder there being a connection. He can move +1 step to any D3 roll, but is not allowed to move by ship. He also has -1 might if fighting on an oasis tile.",
  },
  {
    id: "ser-selena-the-silent",
    name: "Ser Selena the silent",
    description: "You'd be struggling to get more than a whisper from this strange, empty-eyed knight. While as deadly as any if confronted, she has a natural talent for not drawing attention. Selena may move through Monster- or player guarded tiles without consequence.",
  },
  {
    id: "the-lone-knight",
    name: "The Lone knight",
    description: "Not much is known about this solemn warrior, but few dare stand in his way, none by his side. The Lone knight is unable to support or be supported by other knights. He may blockade or conquer a claimed tile, even when it is being guarded from an adjacent tile.",
  },
  {
    id: "igor-the-undead",
    name: "Igor the undead",
    description: "Igor talks alot to himself, strange jibbering and gurgling noises. You'd think he'd be a bit on the slow side given his twitchy maners but you'd be dead wrong. Whenever Igor lands on a tile adjacent to an enemy knight, he may choose to move through the phantasmal underworld and attack them, moving into the tile if he wins the battle.",
  },
  {
    id: "athlanta-the-true",
    name: "Athlanta the True",
    description: "Almost drowned and left for dead by one of her many apprentices, an ambitious youngster named Cyrina, some decade ago. This warrior priestess lives and breathes the true faith. She gains no benefit from neither sword nor club, and instead bases her power on the words of the people. Athlanta can not cary treasures other than jewelry. And in battle counts fame instead of might at a 2:1 ratio.",
  },
  {
    id: "farindin-of-the-farowind",
    name: "Farindin of the Farowind",
    description: "If knights could grow masts, oares and sails, Farindin would have sprouted them long ago. The man is a menace at sea, feared for his artfull skills in shallows and deep waters alike. When other's ride white stallions across a grass sea, Farindin rides the waves on his wooden steed. Whenever adjacant to water with a friendly ship within, Farindin has +1 might. (+2 for warships)",
  },
]; 