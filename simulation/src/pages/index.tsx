import Head from "next/head";
import { useEffect, useState } from "react";
import { AIMoveResult } from "../components/AIMoveResult";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { GameBoard } from "../components/GameBoard";
import { PromptViewer } from "../components/PromptViewer";
import { GameState, rollMultipleD3 } from "../lib/gameState";
import { Claude } from "../lib/llm";
import { templateProcessor } from "../lib/templateProcessor";

// Simple spinner for other loading states
const Spinner = ({ size = 20 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid #f3f3f3`,
      borderTop: `2px solid #3498db`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
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

  // API Key modal state
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // Debug mode for revealing all tiles
  const [debugMode, setDebugMode] = useState<boolean>(false);

  // Prompt tracking
  const [lastSystemPrompt, setLastSystemPrompt] = useState<string>("");
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [showPrompts, setShowPrompts] = useState<boolean>(false);

  // Chat history for tool calling
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);

  // Initialize game state only on client side
  useEffect(() => {
    setGameState(new GameState());
    setMounted(true);
  }, []);

  const handleAIMove = async () => {
    if (!gameState) return;

    if (!apiKey.trim()) {
      setError("Please enter your Anthropic API key");
      return;
    }

    setLoading(true);
    setError("");
    setAiResponse("");
    setChatHistory([]);
    setToolCalls([]);

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

      // Use client-side Claude instance with tool calling
      const claude = new Claude(apiKey);
      const result = await claude.useLLMWithTools(systemPrompt, userMessage);

      setAiResponse(result.response);
      setChatHistory(result.messages);
      setToolCalls(result.toolCalls);
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
          }}
        >
          <Spinner size={50} />
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
          fontFamily: "Arial, sans-serif",
          padding: "20px",
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
          <button
            onClick={() => setShowApiKeyModal(true)}
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: apiKey ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            🔑 {apiKey ? "API Key Set" : "Set API Key"}
          </button>

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
            disabled={loading || !apiKey.trim()}
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: loading || !apiKey.trim() ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: loading || !apiKey.trim() ? "not-allowed" : "pointer",
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

          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: showChatHistory ? "#ffc107" : "#6c757d",
              color: showChatHistory ? "#000" : "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            {showChatHistory ? "💭 Chat: ON" : "💭 Chat: OFF"}
          </button>
        </div>

        {/* AI Move Results Component */}
        <AIMoveResult
          loading={loading}
          lastDiceRolls={lastDiceRolls}
          aiResponse={aiResponse}
          error={error}
        />

        {/* Tool Calls Display */}
        {toolCalls.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "rgba(40, 167, 69, 0.1)",
              border: "2px solid #28a745",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#28a745" }}>
              🔧 Tool Calls Executed
            </h3>
            {toolCalls.map((call, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  backgroundColor: "white",
                  borderRadius: "4px",
                  border: "1px solid #28a745",
                }}
              >
                <strong>{call.name}</strong>
                <pre
                  style={{
                    margin: "5px 0",
                    fontSize: "12px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(call.input, null, 2)}
                </pre>
                <div style={{ color: "#28a745", fontSize: "12px" }}>
                  ✓ Action succeeded
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat History Display */}
        {showChatHistory && chatHistory.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "rgba(255, 193, 7, 0.1)",
              border: "2px solid #ffc107",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#856404" }}>💭 Chat History</h3>
            {chatHistory.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor:
                    message.role === "user" ? "#e3f2fd" : "#f3e5f5",
                  borderRadius: "8px",
                  border: `1px solid ${
                    message.role === "user" ? "#2196f3" : "#9c27b0"
                  }`,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "5px",
                    color: message.role === "user" ? "#1976d2" : "#7b1fa2",
                  }}
                >
                  {message.role === "user" ? "👤 User" : "🤖 Assistant"}
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
                  {typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompts Display Component */}
        <PromptViewer
          showPrompts={showPrompts}
          lastSystemPrompt={lastSystemPrompt}
          lastUserMessage={lastUserMessage}
        />

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
        />

        {/* Rest of the component remains the same */}
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
              backgroundColor: "rgba(220, 53, 69, 0.1)",
              border: "2px solid #dc3545",
              borderRadius: "8px",
              textAlign: "center",
              color: "#721c24",
            }}
          >
            <strong>🔍 DEBUG MODE ACTIVE</strong> - All tiles are revealed
          </div>
        )}

        <GameBoard gameState={gameState} debugMode={debugMode} />
      </div>
    </>
  );
}
