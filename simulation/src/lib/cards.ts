import { ENCOUNTERS } from "../content/encounterCards";
import { EVENT_CARDS } from "../content/eventCards";
import { MONSTER_CARDS } from "../content/monsterCards";
import { TRADER_ITEMS } from "../content/traderItems";
import { TREASURE_CARDS } from "../content/treasureCards";
import { BiomeType, TileTier } from "./types";

/**
 * Deck Rigging:
 *
 * Set ONLY_INCLUDE_CARDS to an array of card IDs to only include those cards in the deck.
 * Set to undefined to include all cards as usual.
 *
 * Example: const ONLY_INCLUDE_CARDS = ['wolf', 'bear', 'landslide'];
 *
 * This is useful for testing specific cards or gameplay situations.
 */
let ONLY_INCLUDE_CARDS: string[] | undefined = undefined; // ["rusty-sword"];

export type CardType = "monster" | "event" | "treasure" | "encounter" | "follower";

export interface Card {
  type: CardType;
  tier: TileTier;
  biome: BiomeType;
  id: string;
}

export interface TraderCard {
  type: "trader";
  id: string;
}

class CardDeck {
  private cards: Card[] = [];

  // Deck order: index 0 = bottom, index [length-1] = top
  // Cards are drawn from the top (end of array)

  addCard(quantity: number, card: Card): void {
    for (let i = 0; i < quantity; i++) {
      this.cards.push({ ...card }); // Add to top of deck
    }
  }

  addToTop(card: Card): void {
    this.cards.push({ ...card });
  }

  addToBottom(card: Card): void {
    this.cards.unshift({ ...card });
  }

  drawFromTop(): Card | undefined {
    return this.cards.pop(); // Remove and return top card
  }

  peekTop(): Card | undefined {
    return this.cards[this.cards.length - 1]; // Look at top card without removing
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  size(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  getCards(): Card[] {
    return [...this.cards]; // Return a copy (bottom to top order)
  }

  addCards(cards: Card[]): void {
    this.cards.push(...cards);
  }
}

class TraderDeck {
  private cards: TraderCard[] = [];

  // Deck order: index 0 = bottom, index [length-1] = top
  // Cards are drawn from the top (end of array)

  addCard(quantity: number, card: TraderCard): void {
    for (let i = 0; i < quantity; i++) {
      this.cards.push({ ...card }); // Add to top of deck
    }
  }

  addToTop(card: TraderCard): void {
    this.cards.push({ ...card });
  }

  addToBottom(card: TraderCard): void {
    this.cards.unshift({ ...card });
  }

  drawFromTop(): TraderCard | undefined {
    return this.cards.pop(); // Remove and return top card
  }

  peekTop(): TraderCard | undefined {
    return this.cards[this.cards.length - 1]; // Look at top card without removing
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  size(): number {
    return this.cards.length;
  }

  isEmpty(): boolean {
    return this.cards.length === 0;
  }

  getCards(): TraderCard[] {
    return [...this.cards]; // Return a copy (bottom to top order)
  }

  addCards(cards: TraderCard[]): void {
    this.cards.push(...cards);
  }

  removeCard(itemId: string): boolean {
    const index = this.cards.findIndex((card) => card.id === itemId);
    if (index !== -1) {
      this.cards.splice(index, 1); // Remove only the first occurrence
      return true;
    }
    return false;
  }
}

export class GameDecks {
  private decks: Record<TileTier, [CardDeck, CardDeck, CardDeck]>;
  private traderDeck: TraderDeck;

  constructor(allCards: Card[]) {
    this.decks = {
      1: [new CardDeck(), new CardDeck(), new CardDeck()],
      2: [new CardDeck(), new CardDeck(), new CardDeck()],
      3: [new CardDeck(), new CardDeck(), new CardDeck()],
    };

    this.traderDeck = new TraderDeck();

    this.initializeDecks(allCards);
    this.initializeTraderDeck();
  }

  private initializeDecks(allCards: Card[]): void {
    // For each tier, collect cards, shuffle, and distribute into 3 decks
    for (const tier of [1, 2, 3] as TileTier[]) {
      const tierCards = allCards.filter((card) => card.tier === tier);

      // Shuffle the tier cards
      this.shuffleArray(tierCards);

      // Distribute into 3 roughly even decks
      const deckSize = Math.floor(tierCards.length / 3);
      const remainder = tierCards.length % 3;

      let cardIndex = 0;
      for (let deckNum = 0; deckNum < 3; deckNum++) {
        const cardsForThisDeck = deckSize + (deckNum < remainder ? 1 : 0);
        const deckCards = tierCards.slice(cardIndex, cardIndex + cardsForThisDeck);
        this.decks[tier][deckNum].addCards(deckCards);
        cardIndex += cardsForThisDeck;
      }
    }
  }

  private initializeTraderDeck(): void {
    // Add all trader cards to the trader deck
    this.traderDeck.addCards([...TRADER_CARDS]);
    this.traderDeck.shuffle();
  }

  private shuffleArray(array: Card[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private resetTierDecks(tier: TileTier): void {
    // Collect all tier cards, shuffle, and redistribute
    const allTierCards = CARDS.filter((card) => card.tier === tier);
    this.shuffleArray(allTierCards);

    // Clear existing decks
    this.decks[tier] = [new CardDeck(), new CardDeck(), new CardDeck()];

    // Redistribute
    const deckSize = Math.floor(allTierCards.length / 3);
    const remainder = allTierCards.length % 3;

    let cardIndex = 0;
    for (let deckNum = 0; deckNum < 3; deckNum++) {
      const cardsForThisDeck = deckSize + (deckNum < remainder ? 1 : 0);
      const deckCards = allTierCards.slice(cardIndex, cardIndex + cardsForThisDeck);
      this.decks[tier][deckNum].addCards(deckCards);
      cardIndex += cardsForThisDeck;
    }
  }

  drawCard(tier: TileTier, deckNumber: 1 | 2 | 3): Card | undefined {
    const deckIndex = deckNumber - 1; // Convert 1,2,3 to 0,1,2
    return this.decks[tier][deckIndex].drawFromTop();
  }

  getTopCardBiomes(tier: TileTier): [BiomeType | null, BiomeType | null, BiomeType | null] {
    const biomes: (BiomeType | null)[] = [];
    let allEmpty = true;

    for (let i = 0; i < 3; i++) {
      const topCard = this.decks[tier][i].peekTop();
      if (topCard) {
        biomes.push(topCard.biome);
        allEmpty = false;
      } else {
        biomes.push(null);
      }
    }

    // If all decks are empty, reset them
    if (allEmpty) {
      this.resetTierDecks(tier);
      // Get the new top card biomes after reset
      return this.getTopCardBiomes(tier);
    }

    return biomes as [BiomeType | null, BiomeType | null, BiomeType | null];
  }

  peekTopCard(tier: TileTier, deckNumber: 1 | 2 | 3): Card | undefined {
    const deckIndex = deckNumber - 1; // Convert 1,2,3 to 0,1,2
    return this.decks[tier][deckIndex].peekTop();
  }

  getDeckSizes(tier: TileTier): [number, number, number] {
    return [
      this.decks[tier][0].size(),
      this.decks[tier][1].size(),
      this.decks[tier][2].size()
    ];
  }

  // Trader deck methods
  getAvailableTraderCards(): TraderCard[] {
    return this.traderDeck.getCards();
  }

  removeTraderCard(itemId: string): boolean {
    return this.traderDeck.removeCard(itemId);
  }

  getTraderDeckSize(): number {
    return this.traderDeck.size();
  }
}

// Seeded random number generator for consistent results across server/client
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Create a seeded random instance for biome assignment
const biomeRng = new SeededRandom(12345); // Fixed seed for consistency

// Helper function to deterministically assign a biome
function getRandomBiome(): BiomeType {
  const biomes: BiomeType[] = ["plains", "mountains", "woodlands"];
  return biomes[Math.floor(biomeRng.next() * biomes.length)];
}

// Build the card deck
function buildCardDeck(): Card[] {
  const deck = new CardDeck();

  // Auto-generate monster cards from MONSTERS array
  MONSTER_CARDS.forEach((monster) => {
    if (!ONLY_INCLUDE_CARDS || ONLY_INCLUDE_CARDS.includes(monster.id)) {
      deck.addCard(monster.count, {
        type: "monster",
        tier: monster.tier,
        biome: monster.biome,
        id: monster.id,
      });
    }
  });

  // Auto-generate treasure cards from TREASURES array with random biomes
  TREASURE_CARDS.forEach((treasure) => {
    if (!ONLY_INCLUDE_CARDS || ONLY_INCLUDE_CARDS.includes(treasure.id)) {
      for (let i = 0; i < treasure.count; i++) {
        deck.addToTop({
          type: "treasure",
          tier: treasure.tier,
          biome: getRandomBiome(), // Random biome assignment
          id: treasure.id,
        });
      }
    }
  });

  // Auto-generate encounter cards from ENCOUNTERS array with random biomes
  ENCOUNTERS.forEach((encounter) => {
    if (!ONLY_INCLUDE_CARDS || ONLY_INCLUDE_CARDS.includes(encounter.id)) {
      for (let i = 0; i < encounter.count; i++) {
        deck.addToTop({
          type: "encounter",
          tier: encounter.tier,
          biome: getRandomBiome(), // Random biome assignment
          id: encounter.id,
        });
      }
    }
  });

  // Auto-generate event cards from EVENTS array with random biomes
  EVENT_CARDS.forEach((event) => {
    if (!ONLY_INCLUDE_CARDS || ONLY_INCLUDE_CARDS.includes(event.id)) {
      for (let i = 0; i < event.count; i++) {
        deck.addToTop({
          type: "event",
          tier: event.tier,
          biome: getRandomBiome(), // Random biome assignment
          id: event.id,
        });
      }
    }
  });

  return deck.getCards();
}

// Build the trader deck
function buildTraderDeck(): TraderCard[] {
  const deck = new TraderDeck();

  // Add the specified count of each trader item
  TRADER_ITEMS.forEach((trader) => {
    deck.addCard(trader.count, {
      type: "trader",
      id: trader.id,
    });
  });

  return deck.getCards();
}

// Export the card deck and deck class
export const CARDS: Card[] = buildCardDeck();
export const TRADER_CARDS: TraderCard[] = buildTraderDeck();
export { CardDeck, TraderDeck };

// Essential helper functions
export function getCardsByType(type: CardType): Card[] {
  return CARDS.filter((card) => card.type === type);
}

export function getCardsByBiome(biome: BiomeType): Card[] {
  return CARDS.filter((card) => card.biome === biome);
}

export function getRandomCardFromBiome(biome: BiomeType, type?: CardType): Card {
  let filteredCards = getCardsByBiome(biome);
  if (type) {
    filteredCards = filteredCards.filter((card) => card.type === type);
  }
  const randomIndex = Math.floor(Math.random() * filteredCards.length);
  return filteredCards[randomIndex];
}

// Trader deck helper functions
export function getTraderCards(): TraderCard[] {
  return TRADER_CARDS;
}

export function getRandomTraderCard(): TraderCard {
  const randomIndex = Math.floor(Math.random() * TRADER_CARDS.length);
  return TRADER_CARDS[randomIndex];
}
