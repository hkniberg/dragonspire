import Head from "next/head";
import { useState } from "react";
import { BoardComponent } from "../components/BoardComponent";
import { GameState, rollMultipleD3 } from "../lib/gameState";

// Spinner component
const Spinner = ({ size = 20 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid #f3f3f3`,
      borderTop: `2px solid #3498db`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      display: "inline-block",
      marginRight: "8px",
    }}
  />
);

// Add keyframes for spinner animation
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function Home() {
  // AI Move functionality
  const [gameState] = useState<GameState>(new GameState());
  const [aiResponse, setAiResponse] = useState<string>("");
  const [lastDiceRolls, setLastDiceRolls] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleAIMove = async () => {
    setLoading(true);
    setError("");
    setAiResponse("");

    try {
      // Roll 2 D3 dice for the current player
      const diceRolls = rollMultipleD3(2);
      setLastDiceRolls(diceRolls);

      // Get current game state
      const currentPlayer = gameState.getCurrentPlayer();
      const validActions = gameState.getValidActions(diceRolls);
      const boardState = JSON.stringify(gameState.toJSON(), null, 2);

      // Create game rules summary
      const gameRules = `
LORDS OF DRAGONSPIRE - Game Rules Summary:

OBJECTIVE: Defeat the dragon at Doomspire, reach 10 Fame and travel to Doomspire, or control all starred resource tiles and travel to Doomspire.

BOARD: 8x8 grid with Tier 1 (outer, explored), Tier 2 (middle, unexplored), and Tier 3 (center, most dangerous) tiles.

RESOURCES: Food, Wood, Ore, Gold. You start with 1 Food and 1 Wood.

ACTIONS (each die = one action):
1. Move & Act: Move champion up to die value in tiles, then perform tile action (explore, claim resource, fight monster)
2. Harvest: Collect resources equal to die value from tiles you've claimed with flags
3. Build: Construct buildings in your castle (costs resources)
4. Boat Travel: Move boat between water zones and transport champion

MOVEMENT: Horizontal/vertical only, can pass through other champions, cannot end on occupied tile.

COMBAT: Roll D3 + your Might vs Monster Strength. Victory = gain rewards/Fame. Defeat = return to castle, lose Gold or Fame.

FAME & MIGHT: Fame tracks victory progress. Might helps in combat. Both gained through exploration and defeating monsters.

CLAIMING TILES: Place flag on resource tile to claim it. Can challenge other players' claims through combat.
      `;

      // Create AI prompt
      const systemPrompt = `You are Player ${currentPlayer.id} in Lords of Dragonspire, a strategic board game. You are an experienced strategist focused on winning efficiently.`;

      const userMessage = `This is round ${gameState.currentRound}. 

CURRENT SITUATION:
- You have rolled: ${diceRolls.join(" and ")}
- Your Fame: ${currentPlayer.fame}
- Your Might: ${currentPlayer.might}
- Your Resources: ${JSON.stringify(currentPlayer.resources)}
- Your Champion Position: Row ${currentPlayer.champions[0].position.row}, Col ${
        currentPlayer.champions[0].position.col
      }

GAME RULES:
${gameRules}

CURRENT BOARD STATE:
${boardState}

VALID ACTIONS:
${validActions.join("\n")}

What do you want to do with your dice rolls of ${diceRolls.join(" and ")}? 

Please analyze the board state and explain your strategic reasoning. Consider:
1. Your current position and nearby opportunities
2. Resource tiles you could claim
3. Unexplored tiles that might have valuable rewards
4. Your path toward victory (combat, diplomatic, or economic)
5. How to use each die effectively

Provide a detailed plan for your turn.`;

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt,
          userMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      setAiResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Lords of Dragonspire Board Game Simulator</title>
        <meta
          name="description"
          content="Lords of Dragonspire Board Game AI Simulation"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{ __html: spinnerStyles }} />
      </Head>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f0f8ff",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "20px",
            color: "#2c3e50",
            fontFamily: "serif",
          }}
        >
          Lords of Dragonspire Board Game Simulator
        </h1>

        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <a
            href="/ai-test"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: "#0070f3",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "14px",
              marginRight: "10px",
            }}
          >
            🤖 Test AI Integration
          </a>

          <button
            onClick={handleAIMove}
            disabled={loading}
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: loading ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Spinner />
                AI Thinking...
              </>
            ) : (
              "🎲 AI Move"
            )}
          </button>
        </div>

        {/* AI Move Results */}
        {(loading || lastDiceRolls.length > 0 || aiResponse || error) && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "8px",
              maxWidth: "800px",
              width: "100%",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
              🎯 AI Move Analysis
            </h3>

            {loading && (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "#2c3e50",
                  fontSize: "16px",
                }}
              >
                <Spinner size={24} />
                <strong>
                  Claude Sonnet 4.0 is analyzing the board state...
                </strong>
                <div
                  style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}
                >
                  Rolling dice and evaluating strategic options
                </div>
              </div>
            )}

            {!loading && lastDiceRolls.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Dice Rolled:</strong> {lastDiceRolls.join(", ")} (D3
                dice showing values 1-3)
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#fee",
                  border: "1px solid #f00",
                  borderRadius: "4px",
                  color: "#d00",
                  marginBottom: "10px",
                }}
              >
                <strong>Error:</strong> {error}
              </div>
            )}

            {!loading && aiResponse && (
              <div
                style={{
                  padding: "15px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  lineHeight: "1.4",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                <strong style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
                  AI Strategic Analysis:
                </strong>
                <br />
                <br />
                {aiResponse}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p>
            <strong>Legend:</strong>
          </p>
          <div
            style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span>🌾 Plains</span>
            <span>⛰️ Mountains</span>
            <span>🌲 Woodlands</span>
            <span>🌊 Ocean</span>
            <span>🐉 Dragon's Den</span>
            <span style={{ color: "#8B4513" }}>? Unexplored</span>
          </div>
        </div>

        {/* Board layout with ocean tiles in 2x2 grid behind island */}
        <BoardComponent />

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            maxWidth: "600px",
            textAlign: "center",
          }}
        >
          <h3>Board Layout</h3>
          <p>
            <strong style={{ color: "#1E90FF" }}>
              Ocean Tiles (A, B, C, D)
            </strong>
            : Large ocean areas surrounding the main island
          </p>
          <p>
            <strong style={{ color: "#4CAF50" }}>Tier 1 (T1)</strong>: Outer
            layer - explored terrain (Plains, Mountains, Woodlands)
          </p>
          <p>
            <strong style={{ color: "#FF9800" }}>Tier 2 (T2)</strong>: Middle
            layer - unexplored tiles with higher risk/reward
          </p>
          <p>
            <strong style={{ color: "#F44336" }}>Tier 3 (T3)</strong>: Center -
            most dangerous areas including Dragon's Den
          </p>
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            This is a placeholder visualization. Champions, resources, and game
            state will be added in future steps.
          </p>
        </div>
      </div>
    </>
  );
}
