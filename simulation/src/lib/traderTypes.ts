import { TraderCard } from "./cards";
import { ResourceType } from "./types";

// Trader-related types
export interface TraderContext {
  availableItems: TraderCard[]; // Items available for purchase in the trader deck
  playerResources: Record<ResourceType, number>; // Player's current resources
  description: string; // Human-readable description of trader options
}

export interface TraderAction {
  type: "buyItem" | "sellResources";
  itemId?: string; // For buyItem - the ID of the item to purchase
  resourcesSold?: Record<ResourceType, number>; // For sellResources - resources to give
  resourceRequested?: ResourceType; // For sellResources - resource type to receive
}

export interface TraderDecision {
  actions: TraderAction[]; // Array of actions to perform at the trader
  reasoning?: string; // Optional reasoning for debugging
}