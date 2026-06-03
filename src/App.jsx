import { useState, useEffect, useCallback } from "react";
import "./App.css";
import rawMaps from "./maps.txt?raw";
import { Undo2 } from "lucide-react";

const MAPS = rawMaps
  .split(/;\s*\d+\n/)
  .filter((m) => m.trim())
  .map((m) => m.replace(/^\n+|\n+$/g, ""));

const CHAR_MAP = {
  "#": "wall",
  " ": "empty",
  _: "floor",
  $: "box",
  ".": "goal",
  "*": "box-on-goal",
  "@": "player",
  "+": "player-on-goal",
};

function parseBoard(boardStr) {
  // Remove \r if present and split by \n
  const lines = boardStr.replace(/\r/g, "").split("\n");

  // Find the maximum width
  const maxWidth = Math.max(...lines.map((line) => line.length));

  // Pad shorter lines with spaces to ensure a perfect grid
  const board = lines.map((line) => {
    const chars = line.split("");
    while (chars.length < maxWidth) {
      chars.push(" ");
    }
    return chars;
  });

  const height = board.length;

  // 1. Setup visited array for Flood Fill
  const isExterior = Array.from({ length: height }, () =>
    Array(maxWidth).fill(false),
  );
  const queue = [];

  // 2. Start flood fill from all perimeter tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < maxWidth; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === maxWidth - 1) {
        if (board[y][x] !== "#") {
          queue.push([x, y]);
          isExterior[y][x] = true;
        }
      }
    }
  }

  // 3. Run the flood fill (Breadth-First Search)
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      // If within bounds, not visited, and not a wall
      if (nx >= 0 && nx < maxWidth && ny >= 0 && ny < height) {
        if (!isExterior[ny][nx] && board[ny][nx] !== "#") {
          isExterior[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }

  // 4. Convert unreached interior empty spaces to floor
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < maxWidth; x++) {
      if (!isExterior[y][x] && board[y][x] === " ") {
        board[y][x] = "_";
      }
    }
  }

  return board;
}

function BoardRender({ board }) {
  return (
    <div className="board">
      {board.map((row, y) => (
        <div key={y} className="row">
          {row.map((cell, x) => {
            const cellType = CHAR_MAP[cell] || "empty";
            return (
              <div
                key={`${x}-${y}`}
                className={`cell ${cellType}`}
                title={`(${x}, ${y}): ${cell}`}
              >
                {cell === "@" || cell === "+"
                  ? "🧑"
                  : cell === "$"
                    ? "📦"
                    : cell === "*"
                      ? "✅"
                      : cell === "."
                        ? "🎯"
                        : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function getInitialGameState(mapIndex = 0) {
  const boardStr = MAPS[mapIndex] || MAPS[0];
  const board = parseBoard(boardStr);
  const boxes = [];
  let player = { x: -1, y: -1 };

  const level = board.map((row, y) =>
    row.map((cell, x) => {
      if (cell === "@") {
        player = { x, y };
        return "_"; // Floor underneath
      }
      if (cell === "+") {
        player = { x, y };
        return "."; // Goal underneath
      }
      if (cell === "$") {
        boxes.push({ x, y });
        return "_"; // Floor underneath
      }
      if (cell === "*") {
        boxes.push({ x, y });
        return "."; // Goal underneath
      }
      return cell;
    }),
  );

  return { level, boxes, player, moves: 0, mapIndex, history: [] };
}

function App() {
  const [gameState, setGameState] = useState(() => getInitialGameState(0));

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

  // Derive the combined display board
  const displayBoard = gameState.level.map((row) => [...row]);

  gameState.boxes.forEach((box) => {
    if (displayBoard[box.y][box.x] === ".") {
      displayBoard[box.y][box.x] = "*"; // Box on goal
    } else {
      displayBoard[box.y][box.x] = "$"; // Box on floor
    }
  });

  const { x, y } = gameState.player;
  if (x !== -1 && y !== -1) {
    if (displayBoard[y][x] === "." || displayBoard[y][x] === "*") {
      displayBoard[y][x] = "+"; // Player on goal
    } else {
      displayBoard[y][x] = "@"; // Player on floor (or box)
    }
  }

  const isWon =
    gameState.boxes.length > 0 &&
    gameState.boxes.every((b) => gameState.level[b.y][b.x] === ".");

  const handleReset = () => {
    setGameState(getInitialGameState(gameState.mapIndex));
  };

  const loadMap = (index) => {
    setGameState(getInitialGameState(index));
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
      <div className="sidebar">
        <h2>Levels</h2>
        <div className="map-list">
          {MAPS.map((_, index) => (
            <button
              key={index}
              className={`map-btn ${gameState.mapIndex === index ? "active" : ""}`}
              onClick={() => loadMap(index)}
            >
              Level {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="app">
          <h1>Sokoban</h1>

          <div className="header-controls">
            <div className="moves">Moves: {gameState.moves}</div>
            <button className="reset-btn" onClick={handleReset}>
              Restart Level
            </button>
          </div>

          {isWon && <div className="win-message">🎉 You Win! 🎉</div>}
          <BoardRender board={displayBoard} />

          <div className="mobile-controls">
            <div className="mobile-controls-row">
              <button
                className="control-btn"
                onClick={() => handleMove({ dx: 0, dy: -1 })}
              >
                ↑
              </button>
            </div>
            <div className="mobile-controls-row">
              <button
                className="control-btn"
                onClick={() => handleMove({ dx: -1, dy: 0 })}
              >
                ←
              </button>
              <button
                className="control-btn"
                onClick={() => handleMove({ dx: 0, dy: 1 })}
              >
                ↓
              </button>
              <button
                className="control-btn"
                onClick={() => handleMove({ dx: 1, dy: 0 })}
              >
                →
              </button>
            </div>

            <button
              className="undo-btn"
              onClick={handleUndo}
              disabled={gameState.history.length === 0 || isWon}
            >
              <Undo2 size={16} />
              Undo
            </button>
          </div>

          <div className="nav-controls">
            <button
              className="nav-btn"
              onClick={handlePrevMap}
              disabled={gameState.mapIndex === 0}
            >
              ← Previous
            </button>
            <span className="level-indicator">
              Level {gameState.mapIndex + 1} of {MAPS.length}
            </span>
            <button
              className="nav-btn"
              onClick={handleNextMap}
              disabled={gameState.mapIndex === MAPS.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
