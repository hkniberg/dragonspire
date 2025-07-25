// Lords of Doomspire Game Settings
// Contains all configurable game balance parameters

export class GameSettings {
  // Dragon Combat Settings
  static readonly DRAGON_BASE_MIGHT = 6; // Base might before adding D3
  static readonly DRAGON_DICE_SIDES = 3; // D3 die for dragon might (so final might is 6 + 1-3 = 7-9)

  // Player Limits
  static readonly MAX_MIGHT = 10; // Maximum might a player can have

  // Victory Condition Settings
  static readonly VICTORY_FAME_THRESHOLD = 10; // Fame needed to win by visiting dragon
  static readonly VICTORY_GOLD_THRESHOLD = 10; // Gold needed to win by visiting dragon
  static readonly VICTORY_STARRED_TILES_THRESHOLD = 3; // Number of starred resource tiles needed to win

  // Legacy settings for reference (unused with new victory conditions)
  static readonly OLD_DIPLOMATIC_VICTORY_FAME = 20; // Previous fame requirement

  static readonly FAME_AWARD_FOR_EXPLORATION = 1; // Fame awarded for exploring a tile group
}
