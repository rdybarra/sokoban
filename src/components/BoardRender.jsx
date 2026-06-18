import { CHAR_MAP } from "../utils/game";

export default function BoardRender({ level, boxes, player }) {
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
