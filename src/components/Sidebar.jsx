import { X } from "lucide-react";
import { MAPS } from "../utils/game";

export default function Sidebar({ isOpen, onClose, currentLevel, bestScores, onSelectLevel }) {
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Levels</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="map-list">
          {MAPS.map((_, index) => (
            <button
              key={index}
              className={`map-btn ${currentLevel === index ? "active" : ""}`}
              onClick={() => onSelectLevel(index)}
            >
              Level {index + 1}{" "}
              {bestScores[index] !== undefined
                ? `(⭐ ${bestScores[index]})`
                : ""}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
