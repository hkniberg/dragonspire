import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { ActionLog } from "../components/ActionLog";
import { ControlPanel } from "../components/ControlPanel";
import { GameBoard } from "../components/GameBoard";
import { GameStatus } from "../components/GameStatus";
import { GameSession, GameSessionConfig } from "../engine/GameSession";
import { GameState } from "../game/GameState";
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

export default function GameSimulation() {
  // Client-side rendering state
  const [mounted, setMounted] = useState(false);

  // Game simulation state
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [simulationState, setSimulationState] =
    useState<SimulationState>("setup");
  const [actionLog, setActionLog] = useState<any[]>([]);

  // UI state
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1000); // ms between turns
  const [showActionLog, setShowActionLog] = useState(false);

  // Ref to hold the autoplay interval
  const autoPlayInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize component only on client side
  useEffect(() => {
    setMounted(true);
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

  const startNewGame = () => {
    // Create 4 random players
    const players = [
      new RandomPlayer("Alice"),
      new RandomPlayer("Bob"),
      new RandomPlayer("Charlie"),
      new RandomPlayer("Diana"),
    ];

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
      players.map((p) => p.getName())
    );
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
  };

  const resetGame = () => {
    setGameSession(null);
    setGameState(null);
    setSimulationState("setup");
    setActionLog([]);
    setAutoPlay(false);
  };

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

        {/* Control Panel */}
        <ControlPanel
          simulationState={simulationState}
          isExecutingTurn={isExecutingTurn}
          autoPlay={autoPlay}
          autoPlaySpeed={autoPlaySpeed}
          showActionLog={showActionLog}
          onStartNewGame={startNewGame}
          onExecuteNextTurn={executeNextTurn}
          onToggleAutoPlay={toggleAutoPlay}
          onSetAutoPlaySpeed={setAutoPlaySpeed}
          onResetGame={resetGame}
          onToggleActionLog={() => setShowActionLog(!showActionLog)}
        />

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
          <GameBoard gameState={gameState} debugMode={false} />
        ) : (
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
              Click "Start New Game" to begin a simulation with 4 random
              players.
            </p>
            <p style={{ color: "#6c757d", fontSize: "14px" }}>
              This is Milestone 3: Single Turn Execution (UI, Random Player)
            </p>
          </div>
        )}

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
      </div>
    </>
  );
}
