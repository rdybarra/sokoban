import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { Menu } from "lucide-react";
import { MAPS, getInitialGameState, getInitialProgress } from "./utils/game";
import BoardRender from "./components/BoardRender";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import GameHeader from "./components/GameHeader";
import MobileControls from "./components/MobileControls";
import LevelNav from "./components/LevelNav";

function App() {
  const [bestScores, setBestScores] = useState(getInitialProgress);

  const [gameState, setGameState] = useState(() => {
    const scores = getInitialProgress();
    const beaten = Object.keys(scores).map(Number);
    if (beaten.length === 0) return getInitialGameState(0);

    const maxBeaten = Math.max(...beaten);
    const nextLevel = maxBeaten + 1;
    return getInitialGameState(nextLevel >= MAPS.length ? 0 : nextLevel);
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleUndo = useCallback(() => {
    setGameState((prev) => {
      if (prev.history.length === 0) return prev;

      const newHistory = [...prev.history];
      const previousState = newHistory.pop();

      return {
        ...prev,
        player: previousState.player,
        boxes: previousState.boxes,
        moves: previousState.moves,
        history: newHistory,
      };
    });
  }, []);

  const handleMove = useCallback((move) => {
    setGameState((prev) => {
      if (prev.player.x === -1) return prev;

      // Check if already won to prevent further movement
      const isWon =
        prev.boxes.length > 0 &&
        prev.boxes.every((b) => prev.level[b.y][b.x] === ".");
      if (isWon) return prev;

      const nx = prev.player.x + move.dx;
      const ny = prev.player.y + move.dy;

      // Check bounds for player
      if (
        ny < 0 ||
        ny >= prev.level.length ||
        nx < 0 ||
        nx >= prev.level[0].length
      ) {
        return prev;
      }

      // Check wall collision for player
      if (prev.level[ny][nx] === "#") {
        return prev;
      }

      // Create snapshot of dynamic state to push onto history
      const currentStateSnapshot = {
        player: { ...prev.player },
        boxes: prev.boxes.map((b) => ({ ...b })),
        moves: prev.moves,
      };

      // Check if there is a box at the target position
      const boxIndex = prev.boxes.findIndex((b) => b.x === nx && b.y === ny);

      if (boxIndex !== -1) {
        // Calculate where the box would be pushed
        const bx = nx + move.dx;
        const by = ny + move.dy;

        // Check bounds for box
        if (
          by < 0 ||
          by >= prev.level.length ||
          bx < 0 ||
          bx >= prev.level[0].length
        ) {
          return prev;
        }

        // Check wall collision for box
        if (prev.level[by][bx] === "#") {
          return prev;
        }

        // Check if there is another box at the push destination
        const otherBoxIndex = prev.boxes.findIndex(
          (b) => b.x === bx && b.y === by,
        );
        if (otherBoxIndex !== -1) {
          return prev; // Cannot push two boxes at once
        }

        // Push is valid, move the box and player
        const newBoxes = [...prev.boxes];
        newBoxes[boxIndex] = { x: bx, y: by };

        return {
          ...prev,
          player: { x: nx, y: ny },
          boxes: newBoxes,
          moves: prev.moves + 1,
          history: [...prev.history, currentStateSnapshot],
        };
      }

      // Just move the player if no box is in the way
      return {
        ...prev,
        player: { x: nx, y: ny },
        moves: prev.moves + 1,
        history: [...prev.history, currentStateSnapshot],
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyMap = {
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
      };

      const move = keyMap[e.key];
      if (!move) return;

      e.preventDefault(); // Prevent page scrolling
      handleMove(move);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  const isWon =
    gameState.boxes.length > 0 &&
    gameState.boxes.every((b) => gameState.level[b.y][b.x] === ".");

  useEffect(() => {
    if (isWon) {
      // Small timeout to prevent cascading renders
      setTimeout(() => {
        setBestScores((prev) => {
          const currentBest = prev[gameState.mapIndex];
          if (currentBest === undefined || gameState.moves < currentBest) {
            const newScores = {
              ...prev,
              [gameState.mapIndex]: gameState.moves,
            };
            localStorage.setItem("sokoban_progress", JSON.stringify(newScores));
            return newScores;
          }
          return prev;
        });
      }, 0);
    }
  }, [isWon, gameState.mapIndex, gameState.moves]);

  const handleReset = () => {
    setGameState(getInitialGameState(gameState.mapIndex));
  };

  const loadMap = (index) => {
    setGameState(getInitialGameState(index));
    setIsSidebarOpen(false);
  };

  const handlePrevMap = () => {
    if (gameState.mapIndex > 0) {
      loadMap(gameState.mapIndex - 1);
    }
  };

  const handleNextMap = () => {
    if (gameState.mapIndex < MAPS.length - 1) {
      loadMap(gameState.mapIndex + 1);
    }
  };

  return (
    <div className="layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentLevel={gameState.mapIndex}
        bestScores={bestScores}
        onSelectLevel={loadMap}
      />

      <div className="top-nav">
        <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={28} />
        </button>
      </div>

      <div className="main-content">
        <div className="app">
          <h1>Sokoban</h1>

          <GameHeader
            moves={gameState.moves}
            bestScore={bestScores[gameState.mapIndex]}
            onReset={handleReset}
          />

          {isWon && <div className="win-message">🎉 You Win! 🎉</div>}
          <BoardRender
            level={gameState.level}
            boxes={gameState.boxes}
            player={gameState.player}
          />

          <MobileControls
            onMove={handleMove}
            onUndo={handleUndo}
            canUndo={gameState.history.length > 0 && !isWon}
          />

          <LevelNav
            currentLevel={gameState.mapIndex}
            totalLevels={MAPS.length}
            onPrev={handlePrevMap}
            onNext={handleNextMap}
          />
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default App;
