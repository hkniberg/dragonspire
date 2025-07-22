import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { ActionLog } from "../components/ActionLog";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { ControlPanel } from "../components/ControlPanel";
import { GameBoard } from "../components/GameBoard";
import { GameStatus } from "../components/GameStatus";
import { GameSession, GameSessionConfig } from "../engine/GameSession";
import { GameState } from "../game/GameState";
import { Claude } from "../llm/claude";
import { ClaudePlayer } from "../players/ClaudePlayer";
import { RandomPlayer } from "../players/RandomPlayer";

// Simple spinner for loading states (used only in main component now)
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

type SimulationState = "setup" | "playing" | "finished";
type PlayerType = "random" | "claude";

interface PlayerConfig {
  name: string;
  type: PlayerType;
}

export default function GameSimulation() {
  // Client-side rendering state
  const [mounted, setMounted] = useState(false);

  // Game simulation state
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [simulationState, setSimulationState] =
    useState<SimulationState>("setup");
  const [actionLog, setActionLog] = useState<any[]>([]);

  // Player configuration state
  const [playerConfigs, setPlayerConfigs] = useState<PlayerConfig[]>([
    { name: "Alice", type: "random" },
    { name: "Bob", type: "random" },
    { name: "Charlie", type: "random" },
    { name: "Diana", type: "random" },
  ]);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // UI state
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1000); // ms between turns
  const [showActionLog, setShowActionLog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Ref to hold the autoplay interval
  const autoPlayInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize component only on client side
  useEffect(() => {
    setMounted(true);
    // Load API key from localStorage if available
    const storedKey = localStorage.getItem("anthropic-api-key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  // Simple autoplay effect
  useEffect(() => {
    // Clear any existing interval
    if (autoPlayInterval.current) {
      clearInterval(autoPlayInterval.current);
      autoPlayInterval.current = null;
    }

    // Start new interval if autoplay is enabled
    if (autoPlay && simulationState === "playing") {
      autoPlayInterval.current = setInterval(() => {
        executeNextTurn();
      }, autoPlaySpeed);
    }

    // Cleanup function
    return () => {
      if (autoPlayInterval.current) {
        clearInterval(autoPlayInterval.current);
        autoPlayInterval.current = null;
      }
    };
  }, [autoPlay, simulationState, autoPlaySpeed]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (autoPlayInterval.current) {
        clearInterval(autoPlayInterval.current);
        autoPlayInterval.current = null;
      }
    };
  }, []);

  const executeNextTurn = async () => {
    if (!gameSession || simulationState !== "playing" || isExecutingTurn) {
      return;
    }

    setIsExecutingTurn(true);

    try {
      await gameSession.executeTurn();

      const updatedGameState = gameSession.getGameState();
      const updatedActionLog = gameSession.getActionLog();

      setGameState(updatedGameState);
      setActionLog(updatedActionLog);

      // Check if game ended
      if (gameSession.getSessionState() === "finished") {
        setSimulationState("finished");
        setAutoPlay(false);
        console.log("Game finished!");
      }
    } catch (error) {
      console.error("Error executing turn:", error);
      setAutoPlay(false);
    } finally {
      setIsExecutingTurn(false);
    }
  };

  const createPlayer = (config: PlayerConfig) => {
    switch (config.type) {
      case "random":
        return new RandomPlayer(config.name);
      case "claude":
        if (!apiKey.trim()) {
          throw new Error("API key is required for Claude players");
        }
        const claude = new Claude(apiKey.trim());
        return new ClaudePlayer(config.name, claude);
      default:
        throw new Error(`Unknown player type: ${config.type}`);
    }
  };

  const startNewGame = () => {
    try {
      // Check if Claude players need API key
      const hasClaudePlayers = playerConfigs.some(
        (config) => config.type === "claude"
      );
      if (hasClaudePlayers && !apiKey.trim()) {
        setShowApiKeyModal(true);
        return;
      }

      // Create players based on configuration
      const players = playerConfigs.map((config) => createPlayer(config));

      // Create game session
      const sessionConfig: GameSessionConfig = {
        players: players,
        maxRounds: 20, // Reasonable limit for web interface
      };

      const session = new GameSession(sessionConfig);
      session.start();

      setGameSession(session);
      setGameState(session.getGameState());
      setSimulationState("playing");
      setActionLog([]);
      setAutoPlay(false);

      console.log(
        "New game started with players:",
        players.map((p) => `${p.getName()} (${p.getType()})`)
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Failed to start game: ${errorMessage}`);
    }
  };

  const updatePlayerConfig = (
    index: number,
    field: keyof PlayerConfig,
    value: string
  ) => {
    setPlayerConfigs((prev) =>
      prev.map((config, i) =>
        i === index ? { ...config, [field]: value } : config
      )
    );
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const resetGame = () => {
    setGameSession(null);
    setGameState(null);
    setSimulationState("setup");
    setActionLog([]);
    setAutoPlay(false);
  };

  const hasClaudePlayers = playerConfigs.some(
    (config) => config.type === "claude"
  );

  // Show loading state until client-side rendering is ready
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Lords of Doomspire - Game Simulation</title>
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
        <title>Lords of Doomspire - Game Simulation</title>
        <meta
          name="description"
          content="Lords of Doomspire Board Game Simulation"
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
          Lords of Doomspire - Game Simulation
        </h1>

        {/* Player Configuration Panel */}
        {simulationState === "setup" && (
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #ddd",
            }}
          >
            <h2 style={{ marginBottom: "15px", color: "#2c3e50" }}>
              Player Configuration
            </h2>

            {/* API Key Status */}
            {hasClaudePlayers && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px",
                    backgroundColor: apiKey ? "#d4edda" : "#f8d7da",
                    border: `1px solid ${apiKey ? "#c3e6cb" : "#f5c6cb"}`,
                    borderRadius: "4px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>
                    {apiKey ? "🔑" : "⚠️"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: apiKey ? "#155724" : "#721c24" }}>
                      {apiKey ? "API Key Configured" : "API Key Required"}
                    </strong>
                    <div
                      style={{
                        fontSize: "14px",
                        color: apiKey ? "#155724" : "#721c24",
                      }}
                    >
                      {apiKey
                        ? "Claude AI players are ready to play"
                        : "Configure your Anthropic API key to use Claude players"}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {apiKey ? "Change Key" : "Set API Key"}
                  </button>
                </div>
              </div>
            )}

            {/* Player Type Selectors */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "15px",
              }}
            >
              {playerConfigs.map((config, index) => (
                <div
                  key={index}
                  style={{
                    padding: "15px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <h4 style={{ marginBottom: "10px", color: "#2c3e50" }}>
                    Player {index + 1}
                  </h4>

                  <div style={{ marginBottom: "10px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      Name:
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) =>
                        updatePlayerConfig(index, "name", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      Type:
                    </label>
                    <select
                      value={config.type}
                      onChange={(e) =>
                        updatePlayerConfig(
                          index,
                          "type",
                          e.target.value as PlayerType
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    >
                      <option value="random">Random AI</option>
                      <option value="claude">Claude AI</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={startNewGame}
                style={{
                  padding: "12px 24px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#0056b3";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#007bff";
                }}
              >
                Start New Game
              </button>
            </div>
          </div>
        )}

        {/* Control Panel */}
        {simulationState !== "setup" && (
          <ControlPanel
            simulationState={simulationState}
            isExecutingTurn={isExecutingTurn}
            autoPlay={autoPlay}
            autoPlaySpeed={autoPlaySpeed}
            showActionLog={showActionLog}
            debugMode={debugMode}
            onStartNewGame={resetGame} // Reset to setup instead of starting directly
            onExecuteNextTurn={executeNextTurn}
            onToggleAutoPlay={toggleAutoPlay}
            onSetAutoPlaySpeed={setAutoPlaySpeed}
            onResetGame={resetGame}
            onToggleActionLog={() => setShowActionLog(!showActionLog)}
            onToggleDebugMode={toggleDebugMode}
          />
        )}

        {/* Game Status */}
        {gameState && (
          <GameStatus
            gameState={gameState}
            simulationState={simulationState}
            actionLogLength={actionLog.length}
          />
        )}

        {/* Action Log */}
        <ActionLog actionLog={actionLog} isVisible={showActionLog} />

        {/* Game Board */}
        {gameState ? (
          <GameBoard gameState={gameState} debugMode={debugMode} />
        ) : simulationState === "setup" ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderRadius: "8px",
              border: "2px dashed #ddd",
            }}
          >
            <h2 style={{ color: "#6c757d", marginBottom: "20px" }}>
              Welcome to Lords of Doomspire!
            </h2>
            <p
              style={{
                color: "#6c757d",
                fontSize: "18px",
                marginBottom: "30px",
              }}
            >
              Configure your players above and click "Start New Game" to begin.
            </p>
            <p style={{ color: "#6c757d", fontSize: "14px" }}>
              Choose between Random AI and Claude AI players for strategic
              gameplay!
            </p>
          </div>
        ) : null}

        {/* Legend */}
        <div
          style={{
            marginTop: "20px",
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

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
        />
      </div>
    </>
  );
}
