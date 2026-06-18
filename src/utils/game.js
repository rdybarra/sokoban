import rawMaps from "../maps/beginner.txt?raw";

export function parseSokobanFile(rawText) {
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

export const MAPS = parseSokobanFile(rawMaps);

export const CHAR_MAP = {
  "#": "wall",
  " ": "empty",
  _: "floor",
  $: "box",
  ".": "goal",
  "*": "box-on-goal",
  "@": "player",
  "+": "player-on-goal",
};

export function parseBoard(boardStr) {
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

export function getInitialGameState(mapIndex = 0) {
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

export const getInitialProgress = () => {
  try {
    return JSON.parse(localStorage.getItem("sokoban_progress") || "{}");
  } catch {
    return {};
  }
};
