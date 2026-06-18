import { useState, useEffect, useCallback } from "react";
import "./App.css";
import rawMaps from "./maps/beginner.txt?raw";
import { Undo2, Menu, X } from "lucide-react";

function parseSokobanFile(rawText) {
  const lines = rawText.split(/\r?\n/);
  const parsedMaps = [];
  let currentMap = [];

  const mapLineRegex = /^[ \t]*[#@+$*._-]*#[#@+$*._ \t-]*$/;

  for (let line of lines) {
    if (mapLineRegex.test(line)) {
      currentMap.push(line);
    } else {
      if (currentMap.length > 0) {
        parsedMaps.push(currentMap.join("\n"));
        currentMap = [];
      }
    }
  }
  if (currentMap.length > 0) {
    parsedMaps.push(currentMap.join("\n"));
  }

  return parsedMaps;
}

const MAPS = parseSokobanFile(rawMaps);

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

function BoardRender({ level, boxes, player }) {
  // Add relative positioning to the board container
  return (
    <div className="board board-layered">
      {/* Static level layer */}
      {level.map((row, y) => (
        <div key={y} className="row">
          {row.map((cell, x) => {
            const cellType = CHAR_MAP[cell] || "empty";
            return (
              <div
                key={`${x}-${y}`}
                className={`cell ${cellType}`}
                title={`(${x}, ${y}): ${cell}`}
              >
                {cell === "." ? " " : ""}
              </div>
            );
          })}
        </div>
      ))}

      {/* Dynamic entities layer */}
      {boxes.map((box, i) => {
        const isBoxOnGoal = level[box.y] && level[box.y][box.x] === ".";
        return (
          <div
            key={`box-${i}`}
            className={`cell entity box ${isBoxOnGoal ? "box-on-goal" : ""}`}
            style={{
              transform: `translate(calc(${box.x} * var(--cell-size)), calc(${box.y} * var(--cell-size)))`,
            }}
          >
            📦
          </div>
        );
      })}

      {player.x !== -1 && player.y !== -1 && (
        <div
          className="cell entity player"
          style={{
            transform: `translate(calc(${player.x} * var(--cell-size)), calc(${player.y} * var(--cell-size)))`,
          }}
        >
          🧑
        </div>
      )}
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

const getInitialProgress = () => {
  try {
    return JSON.parse(localStorage.getItem("sokoban_progress") || "{}");
  } catch {
    return {};
  }
};

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

  const [isAboutOpen, setIsAboutOpen] = useState(false);

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
      setBestScores((prev) => {
        const currentBest = prev[gameState.mapIndex];
        if (currentBest === undefined || gameState.moves < currentBest) {
          const newScores = { ...prev, [gameState.mapIndex]: gameState.moves };
          localStorage.setItem("sokoban_progress", JSON.stringify(newScores));
          return newScores;
        }
        return prev;
      });
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
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Levels</h2>
          <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="map-list">
          {MAPS.map((_, index) => (
            <button
              key={index}
              className={`map-btn ${gameState.mapIndex === index ? "active" : ""}`}
              onClick={() => loadMap(index)}
            >
              Level {index + 1}{" "}
              {bestScores[index] !== undefined
                ? `(⭐ ${bestScores[index]})`
                : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="top-nav">
        <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={28} />
        </button>
      </div>

      <div className="main-content">
        <div className="app">
          <h1>Sokoban</h1>

          <div className="header-controls">
            <div className="moves">
              Moves: {gameState.moves}
              {bestScores[gameState.mapIndex] !== undefined && (
                <span style={{ marginLeft: "10px", color: "#4ade80" }}>
                  Best: {bestScores[gameState.mapIndex]}
                </span>
              )}
            </div>
            <button className="reset-btn" onClick={handleReset}>
              Restart Level
            </button>
          </div>

          {isWon && <div className="win-message">🎉 You Win! 🎉</div>}
          <BoardRender
            level={gameState.level}
            boxes={gameState.boxes}
            player={gameState.player}
          />

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

        {/* Footer */}
        <footer className="footer">
          <button className="about-link" onClick={() => setIsAboutOpen(true)}>
            About
          </button>
        </footer>
      </div>

      {/* About Sheet */}
      <div
        className={`about-sheet-overlay ${isAboutOpen ? "open" : ""}`}
        onClick={() => setIsAboutOpen(false)}
      />

      <div className={`about-sheet ${isAboutOpen ? "open" : ""}`}>
        <div className="about-sheet-header">
          <h2>About</h2>
          <button className="close-btn" onClick={() => setIsAboutOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className="about-sheet-content">
          <p>
            Maps by Jordi Domènech via
            <br />
            <a
              href="http://sokoban-jd.blogspot.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              sokoban-jd.blogspot.com
            </a>
            <br />
            For any comments or concerns email the website maintainer:
            ricky.ybarra@yahoo.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
