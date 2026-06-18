export default function GameHeader({ moves, bestScore, onReset }) {
  return (
    <div className="header-controls">
      <div className="moves">
        Moves: {moves}
        {bestScore !== undefined && (
          <span style={{ marginLeft: "10px", color: "#F06D5A" }}>
            Best: {bestScore}
          </span>
        )}
      </div>
      <button className="reset-btn" onClick={onReset}>
        Restart Level
      </button>
    </div>
  );
}
