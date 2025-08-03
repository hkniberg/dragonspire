// Base Goal interface for GoalPlayer system
// Each goal implements PlayerAgent and focuses on a specific objective

import { PlayerAgent } from "../PlayerAgent";

export interface Goal extends PlayerAgent {
  // Goals inherit all PlayerAgent methods
  // Each goal should focus on its specific objective while making reasonable decisions for other aspects
}