export interface TraderItem {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in gold to purchase from trader
}

export function getTraderItemById(id: string): TraderItem | undefined {
  return TRADER_ITEMS.find((item) => item.id === id);
}

// All trader items available for purchase
export const TRADER_ITEMS: TraderItem[] = [
  {
    id: "spear",
    name: "Spear",
    description: "Gain `+1 might` when fighting **beasts**.",
    cost: 1,
  },
  {
    id: "backpack",
    name: "Backpack",
    description: "When you lose a battle, you don't lose any resources.",
    cost: 1,
  },
]; 