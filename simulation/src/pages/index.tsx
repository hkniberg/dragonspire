import { templateProcessor } from "@/lib/templateProcessor";
import { Claude } from "@/llm/claude";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { ActionLog } from "../components/ActionLog";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { ControlPanel } from "../components/ControlPanel";
import { GameBoard } from "../components/GameBoard";
import { GameStatus } from "../components/GameStatus";
import { GameMaster, GameMasterConfig } from "../engine/GameMaster";
import { GameState } from "../game/GameState";
import { ClaudePlayer } from "../players/ClaudePlayer";
import { Player } from "../players/Player";
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

interface GameConfig {
  startFame: number;
  startMight: number;
}

export default function GameSimulation() {
  // Client-side rendering state
  const [mounted, setMounted] = useState(false);

  // Game simulation state
  const [gameSession, setGameSession] = useState<GameMaster | null>(null);
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
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    startFame: 0,
    startMight: 0,
  });
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // UI state
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1000); // ms between turns
  const [showActionLog, setShowActionLog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const updatedGameLog = gameSession.getGameLog();

      setGameState(updatedGameState);
      setActionLog(Array.from(updatedGameLog)); // Now using GameMaster's game log

      // Check if game is finished
      if (gameSession.getMasterState() === "finished") {
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

  const createPlayer = async (config: PlayerConfig): Promise<Player> => {
    switch (config.type) {
      case "random":
        return new RandomPlayer(config.name);
      case "claude":
        if (!apiKey.trim()) {
          throw new Error("API key is required for Claude players");
        }
        // Get the system message for Claude
        const systemMessage = await templateProcessor.processTemplate(
          "SystemPrompt",
          {}
        );
        const claude = new Claude(apiKey.trim(), systemMessage);
        return new ClaudePlayer(config.name, claude);
      default:
        throw new Error(`Unknown player type: ${config.type}`);
    }
  };

  const startNewGame = async () => {
    try {
      // Check if Claude players need API key
      const hasClaudePlayers = playerConfigs.some(
        (config) => config.type === "claude"
      );
      if (hasClaudePlayers && !apiKey.trim()) {
        setShowApiKeyModal(true);
        return;
      }

      setIsStartingGame(true);

      // Create all players asynchronously
      const players = await Promise.all(
        playerConfigs.map((config) => createPlayer(config))
      );

      // Validate player names
      const playerNames = players.map((p) => p.getName());
      if (new Set(playerNames).size !== playerNames.length) {
        setErrorMessage("Player names must be unique");
        return;
      }

      // Validate player types
      const hasValidTypes = players.every((p) =>
        ["random", "claude", "human"].includes(p.getType())
      );
      if (!hasValidTypes) {
        setErrorMessage("Invalid player type detected");
        return;
      }

      // Create game session
      const sessionConfig: GameMasterConfig = {
        players: players,
        maxRounds: 20, // Reasonable limit for web interface
        startingValues: {
          fame: gameConfig.startFame,
          might: gameConfig.startMight,
        },
      };

      const session = new GameMaster(sessionConfig);
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
    } finally {
      setIsStartingGame(false);
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

  const handleExtraInstructionsChange = (
    playerId: number,
    instructions: string
  ) => {
    if (gameState && gameSession) {
      const updatedGameState = gameState.updatePlayerExtraInstructions(
        playerId,
        instructions
      );
      setGameState(updatedGameState);
      // Also update the game session's internal state
      gameSession.updateGameState(updatedGameState);
    }
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

            {/* Game Configuration */}
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "15px", color: "#2c3e50" }}>
                Game Configuration
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Start Fame:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={gameConfig.startFame}
                    onChange={(e) =>
                      setGameConfig({
                        ...gameConfig,
                        startFame: parseInt(e.target.value) || 0,
                      })
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
                    Start Might:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={gameConfig.startMight}
                    onChange={(e) =>
                      setGameConfig({
                        ...gameConfig,
                        startMight: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "6px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
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
          <GameBoard
            gameState={gameState}
            debugMode={debugMode}
            playerConfigs={playerConfigs}
            onExtraInstructionsChange={handleExtraInstructionsChange}
          />
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

        {/* Bestiary Link */}
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ddd",
          }}
        >
          <a
            href="/cards"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#8B0000",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#A00000";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#8B0000";
            }}
          >
            🃏 View Card Gallery
          </a>
          <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
            Explore all cards: monsters, events, treasures, and encounters
          </p>
        </div>

        {/* Print Components Link */}
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ddd",
          }}
        >
          <a
            href="/print"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#45a049";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#4CAF50";
            }}
          >
            🖨️ Print Components
          </a>
          <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "14px" }}>
            Print tiles and other game components for physical play
          </p>
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
