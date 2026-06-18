export default function LevelNav({ currentLevel, totalLevels, onPrev, onNext }) {
  return (
    <div className="nav-controls">
      <button
        className="nav-btn"
        onClick={onPrev}
        disabled={currentLevel === 0}
      >
        ← Previous
      </button>
      <span className="level-indicator">
        Level {currentLevel + 1} of {totalLevels}
      </span>
      <button
        className="nav-btn"
        onClick={onNext}
        disabled={currentLevel === totalLevels - 1}
      >
        Next →
      </button>
    </div>
  );
}
