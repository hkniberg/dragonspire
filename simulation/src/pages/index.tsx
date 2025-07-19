import Head from "next/head";
import { useEffect, useState } from "react";
import { GameBoard } from "../components/GameBoard";
import { GameState, rollMultipleD3 } from "../lib/gameState";
import { templateProcessor } from "../lib/templateProcessor";

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
  // Client-side rendering state
  const [mounted, setMounted] = useState(false);

  // AI Move functionality
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [lastDiceRolls, setLastDiceRolls] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Debug mode for revealing all tiles
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Prompt tracking and display
  const [lastSystemPrompt, setLastSystemPrompt] = useState<string>("");
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [showPrompts, setShowPrompts] = useState<boolean>(false);

  // Initialize game state only on client side
  useEffect(() => {
    setGameState(new GameState());
    setMounted(true);
  }, []);

  const handleAIMove = async () => {
    if (!gameState) return;

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
      const boardState = JSON.stringify(gameState.toAIJSON(), null, 2);

      // Process system prompt template (includes game rules dynamically)
      const systemPrompt = await templateProcessor.processTemplate(
        "SystemPrompt",
        {
          playerId: currentPlayer.id,
        }
      );

      // Process user message template
      const userMessage = await templateProcessor.processTemplate("makeMove", {
        currentRound: gameState.currentRound,
        diceRolls: diceRolls.join(" and "),
        fame: currentPlayer.fame,
        might: currentPlayer.might,
        resources: JSON.stringify(currentPlayer.resources),
        championRow: currentPlayer.champions[0].position.row,
        championCol: currentPlayer.champions[0].position.col,
        boardState: boardState,
        validActions: validActions.join("\n"),
      });

      setLastSystemPrompt(systemPrompt);
      setLastUserMessage(userMessage);

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

  // Show loading state until client-side rendering is ready
  if (!mounted || !gameState) {
    return (
      <>
        <Head>
          <title>Lords of Doomspire Board Game Simulator</title>
          <meta
            name="description"
            content="Lords of Doomspire Board Game AI Simulation"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          <style dangerouslySetInnerHTML={{ __html: spinnerStyles }} />
        </Head>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#f0f8ff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <Spinner size={40} />
          <p style={{ marginTop: "20px", fontSize: "18px", color: "#2c3e50" }}>
            Initializing Lords of Doomspire...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Lords of Doomspire Board Game Simulator</title>
        <meta
          name="description"
          content="Lords of Doomspire Board Game AI Simulation"
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
          Lords of Doomspire Board Game Simulator
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
              marginRight: "10px",
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

          <button
            onClick={() => setDebugMode(!debugMode)}
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: debugMode ? "#dc3545" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {debugMode ? "🔍 Debug: ON" : "🔍 Debug: OFF"}
          </button>

          <button
            onClick={() => setShowPrompts(!showPrompts)}
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: showPrompts ? "#17a2b8" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            {showPrompts ? "💬 Prompts: ON" : "💬 Prompts: OFF"}
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

        {/* Prompts Display */}
        {showPrompts && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "8px",
              maxWidth: "800px",
              width: "100%",
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: "1.4",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
              💬 Latest AI Prompts
            </h3>

            <div style={{ marginBottom: "20px" }}>
              <strong
                style={{
                  fontFamily: "sans-serif",
                  color: "#2c3e50",
                  fontSize: "16px",
                }}
              >
                System Prompt:
              </strong>
              <div
                style={{
                  marginTop: "8px",
                  padding: "12px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #dee2e6",
                  borderRadius: "6px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {lastSystemPrompt || "No system prompt available"}
              </div>
            </div>

            <div>
              <strong
                style={{
                  fontFamily: "sans-serif",
                  color: "#2c3e50",
                  fontSize: "16px",
                }}
              >
                User Message:
              </strong>
              <div
                style={{
                  marginTop: "8px",
                  padding: "12px",
                  backgroundColor: "#f0f8ff",
                  border: "1px solid #b8daff",
                  borderRadius: "6px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {lastUserMessage || "No user message available"}
              </div>
            </div>
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
            <span>🐉 Doomspire</span>
            <span style={{ color: "#8B4513" }}>? Unexplored</span>
          </div>
        </div>

        {/* Debug mode indicator */}
        {debugMode && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "8px",
              textAlign: "center",
              color: "#856404",
              fontWeight: "bold",
            }}
          >
            🔍 DEBUG MODE ACTIVE - All tiles revealed
          </div>
        )}

        {/* Board layout with ocean tiles in 2x2 grid behind island */}
        <GameBoard gameState={gameState} debugMode={debugMode} />

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
            most dangerous areas including Doomspire
          </p>
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            The board displays live game state including champion positions,
            resource tiles, claimed territories, and boat positions.
          </p>
        </div>
      </div>
    </>
  );
}
