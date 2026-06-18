import { Undo2 } from "lucide-react";

export default function MobileControls({ onMove, onUndo, canUndo }) {
  return (
    <div className="mobile-controls">
      <div className="mobile-controls-row">
        <button
          className="control-btn"
          onClick={() => onMove({ dx: 0, dy: -1 })}
        >
          ↑
        </button>
      </div>
      <div className="mobile-controls-row">
        <button
          className="control-btn"
          onClick={() => onMove({ dx: -1, dy: 0 })}
        >
          ←
        </button>
        <button
          className="control-btn"
          onClick={() => onMove({ dx: 0, dy: 1 })}
        >
          ↓
        </button>
        <button
          className="control-btn"
          onClick={() => onMove({ dx: 1, dy: 0 })}
        >
          →
        </button>
      </div>

      <button
        className="undo-btn"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo2 size={16} />
        Undo
      </button>
    </div>
  );
}
