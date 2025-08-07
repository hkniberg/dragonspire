import { TemplateProcessor } from "@/lib/templateProcessor";
import { Claude } from "@/llm/claude";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { CardDecks } from "../components/CardDecks";
import { ControlPanel } from "../components/ControlPanel";
import { GameBoard } from "../components/GameBoard";
import { GameLog } from "../components/GameLog";
import { GameStatus } from "../components/GameStatus";
import DicePanel from "../components/DicePanel";
import { HumanPlayerModal } from "../components/HumanPlayerModal";
import MovementIndicator from "../components/MovementIndicator";
import { SettingsMenu } from "../components/SettingsMenu";
import { StatisticsView } from "../components/StatisticsView";
import { TokenUsage } from "../components/TokenUsage";
import { GameMaster, GameMasterConfig } from "../engine/GameMaster";
import { GameState } from "../game/GameState";
import { stringifyGameState } from "../game/gameStateStringifier";
import { DiceAction } from "../lib/actionTypes";
import { DecisionContext, GameLogEntry, TurnContext, TurnStatistics } from "../lib/types";
import { ClaudePlayerAgent } from "../players/ClaudePlayer";
import { HumanPlayer } from "../players/HumanPlayer";
import { PlayerAgent } from "../players/PlayerAgent";
import { RandomPlayerAgent } from "../players/RandomPlayerAgent";

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
type PlayerType = "random" | "claude" | "human";
type ViewType = "game" | "statistics";

interface PlayerConfig {
  name: string;
  type: PlayerType;
}

interface GameConfig {
  startFame: number;
  startMight: number;
  startFood: number;
  startWood: number;
  startOre: number;
  startGold: number;
  seed: number;
  maxRounds: number;
}

export default function GameSimulation() {
  // Client-side rendering state
  const [mounted, setMounted] = useState(false);

  // Game simulation state
  const [gameSession, setGameSession] = useState<GameMaster | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState>("setup");
  const [actionLog, setActionLog] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>("game");
  const [statistics, setStatistics] = useState<readonly TurnStatistics[]>([]);

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
    startFood: 0,
    startWood: 0,
    startOre: 0,
    startGold: 2,
    seed: 0,
    maxRounds: 30,
  });
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // UI state
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1000); // ms between turns
  const [showActionLog, setShowActionLog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [allowDragging, setAllowDragging] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forceRender, setForceRender] = useState(0);
  const [copyGamestateSuccess, setCopyGamestateSuccess] = useState(false);

  // Human player interaction state
  const [humanDecisionContext, setHumanDecisionContext] = useState<DecisionContext | null>(null);
  const [humanDecisionResolver, setHumanDecisionResolver] = useState<((choice: string) => void) | null>(null);
  const [humanDiceActionContext, setHumanDiceActionContext] = useState<{
    gameState: GameState;
    gameLog: readonly GameLogEntry[];
    turnContext: TurnContext;
    resolver: (action: DiceAction) => void;
  } | null>(null);
  const [selectedChampionId, setSelectedChampionId] = useState<number | null>(null);
  const [championMovementPath, setChampionMovementPath] = useState<{ row: number; col: number }[]>([]);

  // Dice state
  const [diceValues, setDiceValues] = useState<number[]>([]);
  const [usedDiceIndices, setUsedDiceIndices] = useState<number[]>([]);
  const [selectedDieIndex, setSelectedDieIndex] = useState<number | null>(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);

  // Ref to hold the autoplay timeout
  const autoPlayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to always get current autoPlay state (avoids closure issues)
  const autoPlayRef = useRef(autoPlay);

  // Keep autoPlayRef in sync with autoPlay state
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // Initialize component only on client side
  useEffect(() => {
    setMounted(true);
    // Load API key from localStorage if available
    const storedKey = localStorage.getItem("anthropic-api-key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  // Keyboard handler for WASD movement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        selectedChampionId !== null &&
        humanDiceActionContext &&
        championMovementPath.length > 0 &&
        selectedDieIndex !== null
      ) {
        const currentPos = championMovementPath[championMovementPath.length - 1];
        let newPos: { row: number; col: number } | null = null;

        switch (event.key.toLowerCase()) {
          case "w":
            newPos = { row: currentPos.row - 1, col: currentPos.col };
            break;
          case "s":
            newPos = { row: currentPos.row + 1, col: currentPos.col };
            break;
          case "a":
            newPos = { row: currentPos.row, col: currentPos.col - 1 };
            break;
          case "d":
            newPos = { row: currentPos.row, col: currentPos.col + 1 };
            break;
        }

        if (newPos && newPos.row >= 0 && newPos.row < 8 && newPos.col >= 0 && newPos.col < 8) {
          event.preventDefault();
          setChampionMovementPath([...championMovementPath, newPos]);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedChampionId, humanDiceActionContext, championMovementPath, selectedDieIndex]);

  // Autoplay effect - starts initial autoplay and cleans up on changes
  useEffect(() => {
    // Clear any existing timeout when autoplay settings change
    if (autoPlayTimeout.current) {
      clearTimeout(autoPlayTimeout.current);
      autoPlayTimeout.current = null;
    }

    // Start initial autoplay turn if enabled and ready
    if (autoPlayRef.current && simulationState === "playing" && !isExecutingTurn) {
      autoPlayTimeout.current = setTimeout(() => {
        executeNextTurn();
      }, autoPlaySpeed);
    }

    // Cleanup function
    return () => {
      if (autoPlayTimeout.current) {
        clearTimeout(autoPlayTimeout.current);
        autoPlayTimeout.current = null;
      }
    };
  }, [autoPlay, simulationState, autoPlaySpeed]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimeout.current) {
        clearTimeout(autoPlayTimeout.current);
        autoPlayTimeout.current = null;
      }
    };
  }, []);

  const executeNextTurn = async () => {
    if (!gameSession || simulationState !== "playing" || isExecutingTurn) {
      return;
    }

    setIsExecutingTurn(true);

    try {
      // Create callback for step updates during turn execution
      const onStepUpdate = () => {
        const updatedGameState = gameSession.getGameState();
        const updatedGameLog = gameSession.getGameLog();
        const updatedStatistics = gameSession.getStatistics();

        setGameState(updatedGameState);
        setActionLog(Array.from(updatedGameLog));
        setStatistics(updatedStatistics);
      };

      // Execute turn with step update callback
      await gameSession.executeTurn(onStepUpdate);

      // Final update after turn completion
      const updatedGameState = gameSession.getGameState();
      const updatedGameLog = gameSession.getGameLog();
      const updatedStatistics = gameSession.getStatistics();

      setGameState(updatedGameState);
      setActionLog(Array.from(updatedGameLog));
      setStatistics(updatedStatistics);

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

      // Schedule next autoplay turn if still enabled and game is still playing
      // Use ref to get current autoPlay state (avoids closure issues)
      if (autoPlayRef.current && simulationState === "playing" && gameSession?.getMasterState() !== "finished") {
        autoPlayTimeout.current = setTimeout(() => {
          executeNextTurn();
        }, autoPlaySpeed);
      }
    }
  };

  // Human player interaction handlers
  const handleHumanDecision = (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    decisionContext: DecisionContext,
  ): Promise<{ choice: string }> => {
    return new Promise((resolve) => {
      setHumanDecisionContext(decisionContext);
      setHumanDecisionResolver(() => (choice: string) => {
        setHumanDecisionContext(null);
        setHumanDecisionResolver(null);
        resolve({ choice });
      });
    });
  };

  const handleHumanDiceAction = (
    gameState: GameState,
    gameLog: readonly GameLogEntry[],
    turnContext: TurnContext,
  ): Promise<DiceAction> => {
    return new Promise((resolve) => {
      // Only initialize dice state if this is the first action of the turn
      // Check if the remaining dice count equals the total dice rolled (meaning it's the first action)
      const isFirstActionOfTurn = turnContext.remainingDiceValues.length === turnContext.diceRolled.length;

      console.log("🎲 handleHumanDiceAction called:", {
        isFirstActionOfTurn,
        diceRolled: turnContext.diceRolled,
        remainingDiceValues: turnContext.remainingDiceValues,
        currentDiceValues: diceValues,
        usedDiceIndices: usedDiceIndices,
      });

      if (isFirstActionOfTurn) {
        console.log("🎲 Initializing dice state for turn");
        // Initialize dice state for the turn
        setDiceValues(turnContext.diceRolled);
        setUsedDiceIndices([]);
        setSelectedDieIndex(null);

        // Show rolling animation only on first action
        setIsDiceRolling(true);
        setTimeout(() => {
          setIsDiceRolling(false);
        }, 1000);
      } else {
        console.log("🎲 Continuing with existing dice state");
      }

      // Always reset champion selection for new action
      setSelectedChampionId(null);
      setChampionMovementPath([]);

      setHumanDiceActionContext({
        gameState,
        gameLog,
        turnContext,
        resolver: resolve,
      });
    });
  };

  const handleDieSelection = (dieIndex: number) => {
    if (usedDiceIndices.includes(dieIndex)) {
      return; // Can't select used die
    }

    if (selectedDieIndex === dieIndex) {
      // Deselect if clicking same die
      setSelectedDieIndex(null);
    } else {
      // Select new die
      setSelectedDieIndex(dieIndex);
      // Clear champion selection when selecting new die
      setSelectedChampionId(null);
      setChampionMovementPath([]);
    }
  };

  const handleChampionSelection = (championId: number) => {
    // Must have a die selected first
    if (selectedDieIndex === null) {
      return;
    }

    if (selectedChampionId === championId) {
      // Just deselect the champion (Done button will handle movement completion)
      setSelectedChampionId(null);
      setChampionMovementPath([]);
    } else {
      // Select new champion
      setSelectedChampionId(championId);
      if (humanDiceActionContext) {
        const champion = humanDiceActionContext.gameState.getChampion(
          humanDiceActionContext.gameState.getCurrentPlayer().name,
          championId,
        );
        if (champion) {
          setChampionMovementPath([champion.position]);
        }
      }
    }
  };

  const handleTileClick = (row: number, col: number) => {
    if (selectedChampionId !== null && humanDiceActionContext && championMovementPath.length > 0) {
      const currentPos = championMovementPath[championMovementPath.length - 1];
      const newPos = { row, col };

      // Check if this is a neighboring tile (simple adjacency check)
      const isAdjacent =
        Math.abs(currentPos.row - newPos.row) <= 1 &&
        Math.abs(currentPos.col - newPos.col) <= 1 &&
        !(currentPos.row === newPos.row && currentPos.col === newPos.col);

      if (isAdjacent) {
        setChampionMovementPath([...championMovementPath, newPos]);
      }
    }
  };

  const handleMovementUndo = () => {
    if (championMovementPath.length > 1) {
      // Remove the last position from the path
      setChampionMovementPath(championMovementPath.slice(0, -1));
    }
  };

  const handleMovementDone = () => {
    if (
      selectedChampionId !== null &&
      championMovementPath.length > 1 &&
      humanDiceActionContext &&
      selectedDieIndex !== null
    ) {
      const diceValue = diceValues[selectedDieIndex];
      const action: DiceAction = {
        actionType: "championAction",
        championAction: {
          diceValueUsed: diceValue,
          championId: selectedChampionId,
          movementPathIncludingStartPosition: championMovementPath,
          tileAction: {}, // Empty tile action for now
        },
        reasoning: "Human player champion movement",
      };

      // Mark die as used and reset state
      setUsedDiceIndices([...usedDiceIndices, selectedDieIndex]);
      setSelectedDieIndex(null);
      setSelectedChampionId(null);
      setChampionMovementPath([]);

      // Check if all dice are used
      if (usedDiceIndices.length + 1 >= diceValues.length) {
        setHumanDiceActionContext(null);
      }

      // Resolve the action
      humanDiceActionContext.resolver(action);
    }
  };

  const createPlayer = async (
    config: PlayerConfig,
    tokenUsageTracker?: import("@/lib/TokenUsageTracker").TokenUsageTracker,
  ): Promise<PlayerAgent> => {
    switch (config.type) {
      case "random":
        return new RandomPlayerAgent(config.name);
      case "claude":
        if (!apiKey.trim()) {
          throw new Error("API key is required for Claude players");
        }
        // Create template processor for web usage (uses fetch)
        const templateProcessor = new TemplateProcessor();
        // Get the system message for Claude
        const systemMessage = await templateProcessor.processTemplate("SystemPrompt", {});
        const claude = new Claude(apiKey.trim(), systemMessage, undefined, tokenUsageTracker);
        return new ClaudePlayerAgent(config.name, claude, templateProcessor);
      case "human":
        const humanPlayer = new HumanPlayer(config.name);
        humanPlayer.setCallbacks({
          onDiceActionNeeded: handleHumanDiceAction,
          onDecisionNeeded: handleHumanDecision,
        });
        return humanPlayer;
      default:
        throw new Error(`Unknown player type: ${config.type}`);
    }
  };

  const startNewGame = async () => {
    try {
      // Check if Claude players need API key
      const hasClaudePlayers = playerConfigs.some((config) => config.type === "claude");
      if (hasClaudePlayers && !apiKey.trim()) {
        setShowApiKeyModal(true);
        return;
      }

      setIsStartingGame(true);

      // Create token usage tracker for Claude players
      const { TokenUsageTracker } = await import("@/lib/TokenUsageTracker");
      const tokenUsageTracker = new TokenUsageTracker();

      // Create all players asynchronously
      const players = await Promise.all(playerConfigs.map((config) => createPlayer(config, tokenUsageTracker)));

      // Validate player names
      const playerNames = players.map((p) => p.getName());
      if (new Set(playerNames).size !== playerNames.length) {
        setErrorMessage("Player names must be unique");
        return;
      }

      // Validate player types
      const hasValidTypes = players.every((p) => ["random", "claude", "human"].includes(p.getType()));
      if (!hasValidTypes) {
        setErrorMessage("Invalid player type detected");
        return;
      }

      // Create game session
      const sessionConfig: GameMasterConfig = {
        players: players,
        maxRounds: gameConfig.maxRounds,
        startingValues: {
          fame: gameConfig.startFame,
          might: gameConfig.startMight,
          food: gameConfig.startFood,
          wood: gameConfig.startWood,
          ore: gameConfig.startOre,
          gold: gameConfig.startGold,
        },
        seed: gameConfig.seed,
        tokenUsageTracker: tokenUsageTracker, // Pass the same tracker instance
      };

      const session = new GameMaster(sessionConfig);
      session.start();

      setGameSession(session);
      setGameState(session.getGameState());
      setSimulationState("playing");
      setActionLog([]);
      setStatistics([]);
      setCurrentView("game");
      setAutoPlay(false);

      console.log(
        "New game started with players:",
        players.map((p) => `${p.getName()} (${p.getType()})`),
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to start game: ${errorMessage}`);
    } finally {
      setIsStartingGame(false);
    }
  };

  const updatePlayerConfig = (index: number, field: keyof PlayerConfig, value: string) => {
    setPlayerConfigs((prev) => prev.map((config, i) => (i === index ? { ...config, [field]: value } : config)));
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const toggleAllowDragging = () => {
    setAllowDragging(!allowDragging);
  };

  const resetGame = () => {
    setGameSession(null);
    setGameState(null);
    setSimulationState("setup");
    setActionLog([]);
    setStatistics([]);
    setCurrentView("game");
    setAutoPlay(false);
  };

  const handleExtraInstructionsChange = (playerName: string, instructions: string) => {
    if (gameState && gameSession) {
      const player = gameState.getPlayer(playerName);
      if (player) {
        player.extraInstructions = instructions;
        // Force a re-render by incrementing counter
        setForceRender((prev) => prev + 1);
        // Update the game session's internal state
        gameSession.updateGameState(gameState);
      }
    }
  };

  const handleCopyGamestate = async () => {
    if (!gameState) {
      alert("No game state available to copy");
      return;
    }

    try {
      const gamestateText = stringifyGameState(gameState);
      await navigator.clipboard.writeText(gamestateText);
      setCopyGamestateSuccess(true);
      setTimeout(() => setCopyGamestateSuccess(false), 2000); // Hide success message after 2 seconds
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      alert("Failed to copy game state to clipboard");
    }
  };

  const hasClaudePlayers = playerConfigs.some((config) => config.type === "claude");

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
        <meta name="description" content="Lords of Doomspire Board Game Simulation" />
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
          overflowX: "auto",
          minWidth: "fit-content",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              margin: "0 0 15px 0",
              color: "#2c3e50",
              fontFamily: "serif",
            }}
          >
            Lords of Doomspire - Game Simulation
          </h1>

          <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
            {/* View Switching Buttons - Only show when game is active */}
            {(simulationState === "playing" || simulationState === "finished") && (
              <div style={{ display: "flex", gap: "5px" }}>
                <button
                  onClick={() => setCurrentView("game")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentView === "game" ? "#2c3e50" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    transition: "all 0.2s ease",
                  }}
                >
                  Game View
                </button>
                <button
                  onClick={() => setCurrentView("statistics")}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: currentView === "statistics" ? "#2c3e50" : "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    transition: "all 0.2s ease",
                  }}
                >
                  Statistics View
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href="/cheat-sheet"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#8b4513",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  border: "2px solid #654321",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#a0522d";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#8b4513";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                📋 Game Reference
              </a>

              <SettingsMenu
                debugMode={debugMode}
                onToggleDebugMode={toggleDebugMode}
                allowDragging={allowDragging}
                onToggleAllowDragging={toggleAllowDragging}
              />
            </div>

            {/* Token Usage Widget */}
            {gameSession && <TokenUsage tokenUsageTracker={gameSession.getTokenUsageTracker()} />}

            {/* Copy Gamestate Button */}
            {gameState && (
              <button
                onClick={handleCopyGamestate}
                style={{
                  padding: "10px 20px",
                  backgroundColor: copyGamestateSuccess ? "#28a745" : "#6f42c1",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseOver={(e) => {
                  if (!copyGamestateSuccess) {
                    e.currentTarget.style.backgroundColor = "#8a5cf5";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!copyGamestateSuccess) {
                    e.currentTarget.style.backgroundColor = "#6f42c1";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {copyGamestateSuccess ? "✅ Copied!" : "📋 Copy Gamestate"}
              </button>
            )}
          </div>
        </div>

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
            <h2 style={{ marginBottom: "15px", color: "#2c3e50" }}>Player Configuration</h2>

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
                  <span style={{ fontSize: "20px" }}>{apiKey ? "🔑" : "⚠️"}</span>
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
                  <h4 style={{ marginBottom: "10px", color: "#2c3e50" }}>Player {index + 1}</h4>

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
                      onChange={(e) => updatePlayerConfig(index, "name", e.target.value)}
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
                      onChange={(e) => updatePlayerConfig(index, "type", e.target.value as PlayerType)}
                      style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    >
                      <option value="random">Random AI</option>
                      <option value="claude">Claude AI</option>
                      <option value="human">Human Player</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Game Configuration */}
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "15px", color: "#2c3e50" }}>Game Configuration</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "12px",
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
                      width: "80px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
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
                      width: "80px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
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
                    Start Food:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={gameConfig.startFood}
                    onChange={(e) =>
                      setGameConfig({
                        ...gameConfig,
                        startFood: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "80px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
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
                    Start Wood:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={gameConfig.startWood}
                    onChange={(e) =>
                      setGameConfig({
                        ...gameConfig,
                        startWood: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "80px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
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
                    Start Ore:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={gameConfig.startOre}
                    onChange={(e) =>
                      setGameConfig({
                        ...gameConfig,
                        startOre: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "80px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
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
                    Start Gold:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={gameConfig.startGold}
                    onChange={(e) =>
                      setGameConfig({
                        ...gameConfig,
                        startGold: parseInt(e.target.value) || 0,
                      })
                    }
                    style={{
                      width: "80px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
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
                    Max Rounds:
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={gameConfig.maxRounds}
                    onChange={(e) =>
                      setGameConfig({
                        ...gameConfig,
                        maxRounds: parseInt(e.target.value) || 30,
                      })
                    }
                    style={{
                      width: "80px",
                      padding: "4px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                    placeholder="30"
                  />
                  <small style={{ fontSize: "12px", color: "#666", marginTop: "2px", display: "block" }}>
                    Maximum number of game rounds before ending.
                  </small>
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
                    Random Seed:
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="number"
                      value={gameConfig.seed}
                      onChange={(e) =>
                        setGameConfig({
                          ...gameConfig,
                          seed: parseInt(e.target.value) || 0,
                        })
                      }
                      style={{
                        width: "100px",
                        padding: "4px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                      placeholder="0 for default"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setGameConfig({
                          ...gameConfig,
                          seed: Math.floor(Math.random() * 1000000),
                        })
                      }
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🎲 Random
                    </button>
                  </div>
                  <small style={{ fontSize: "12px", color: "#666", marginTop: "2px", display: "block" }}>
                    Controls board layout generation. Same seed = same board.
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control Panel - Always visible */}
        <ControlPanel
          simulationState={simulationState}
          isExecutingTurn={isExecutingTurn}
          autoPlay={autoPlay}
          autoPlaySpeed={autoPlaySpeed}
          showActionLog={showActionLog}
          isStartingGame={isStartingGame}
          onStartNewGame={startNewGame}
          onExecuteNextTurn={executeNextTurn}
          onToggleAutoPlay={toggleAutoPlay}
          onSetAutoPlaySpeed={setAutoPlaySpeed}
          onResetGame={resetGame}
          onToggleActionLog={() => setShowActionLog(!showActionLog)}
        />

        {/* Conditional View Rendering */}
        {currentView === "game" ? (
          <>
            {/* Game Status */}
            {gameState && (
              <GameStatus
                gameState={gameState}
                simulationState={simulationState}
                actionLogLength={actionLog.length}
                humanPlayerWaiting={humanDiceActionContext !== null}
              />
            )}

            {/* Action Log */}
            <GameLog gameLog={actionLog} isVisible={showActionLog} players={gameState?.players || []} />

            {/* Dice Panel and Card Decks Row */}
            {gameState && (
              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "20px",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                {/* Human Player Dice Panel - Left Side */}
                {humanDiceActionContext && diceValues.length > 0 && (
                  <DicePanel
                    diceValues={diceValues}
                    usedDice={usedDiceIndices}
                    selectedDieIndex={selectedDieIndex}
                    onDieSelect={handleDieSelection}
                    isRolling={isDiceRolling}
                  />
                )}

                {/* Movement Indicator - Middle */}
                {selectedChampionId !== null && championMovementPath.length > 0 && (
                  <MovementIndicator
                    championId={selectedChampionId}
                    onUndo={handleMovementUndo}
                    onDone={handleMovementDone}
                    canUndo={championMovementPath.length > 1}
                  />
                )}

                {/* Card Decks - Right Side */}
                <div style={{ flex: 1 }}>
                  <CardDecks gameSession={gameSession} />
                </div>
              </div>
            )}

            {/* Game Board */}
            {gameState ? (
              <GameBoard
                gameState={gameState}
                debugMode={debugMode}
                allowDragging={allowDragging}
                playerConfigs={playerConfigs}
                onExtraInstructionsChange={handleExtraInstructionsChange}
                onGameStateUpdate={(newGameState) => {
                  setGameState(newGameState);
                  if (gameSession) {
                    gameSession.updateGameState(newGameState);
                  }
                }}
                humanPlayerState={
                  humanDiceActionContext
                    ? {
                        selectedChampionId,
                        championMovementPath,
                        onChampionSelect: handleChampionSelection,
                        onTileClick: handleTileClick,
                        hasSelectedDie: selectedDieIndex !== null,
                      }
                    : undefined
                }
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
                <h2 style={{ color: "#6c757d", marginBottom: "20px" }}>Welcome to Lords of Doomspire!</h2>
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
                  Choose between Random AI and Claude AI players for strategic gameplay!
                </p>
              </div>
            ) : null}
          </>
        ) : currentView === "statistics" ? (
          <div style={{ marginTop: "20px" }}>
            <StatisticsView statistics={statistics} />
          </div>
        ) : null}

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
        />

        {/* Human Player Decision Modal */}
        {humanDecisionContext && humanDecisionResolver && (
          <HumanPlayerModal isOpen={true} decisionContext={humanDecisionContext} onDecision={humanDecisionResolver} />
        )}
      </div>
    </>
  );
}
