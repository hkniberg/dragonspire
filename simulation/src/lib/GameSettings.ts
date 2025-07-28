// Lords of Doomspire Game Settings
// Contains all configurable game balance parameters

export class GameSettings {
  // Dragon Combat Settings
  static readonly DRAGON_BASE_MIGHT = 8; // Base might before adding D3

  // Victory Condition Settings
  static readonly VICTORY_FAME_THRESHOLD = 12; // Fame needed to win by visiting dragon
  static readonly VICTORY_GOLD_THRESHOLD = 20; // Gold needed to win by visiting dragon
  static readonly VICTORY_STARRED_TILES_THRESHOLD = 4; // Number of starred resource tiles needed to win

  static readonly FAME_AWARD_FOR_EXPLORATION = 1; // Fame awarded for exploring a tile group
}
